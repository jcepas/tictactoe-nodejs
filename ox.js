var crypto = require('crypto');

// Objeto que inicializa el juego.
exports.Game = function (game_id, socket) {

	this.game_id = game_id;

	this.board = new Array(0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0);
	this.player1 = socket;
	this.player2 = undefined;

	this.p1_turn = true;

	return this;
}


// Vemos las posibles soluciones existentes para ganar una partida
exports.ganar = function (b) {

	// Posiciones Verticales
	if ((b[0] == b[1] && b[1] == b[2] && b[2] == b[3]) && b[0])
		return b[0];

	if ((b[4] == b[5] && b[5] == b[6] && b[6] == b[7]) && b[4])
		return b[4];

	if ((b[8] == b[9] && b[9] == b[10] && b[10] == b[11]) && b[8])
		return b[8];

	if ((b[12] == b[13] && b[13] == b[14] && b[14] == b[15]) && b[12])
		return b[12];

	// Posiciones Horizontales
	if ((b[0] == b[4] && b[4] == b[8] && b[8] == b[12]) && b[0])
		return b[0];

	if ((b[1] == b[5] && b[5] == b[9] && b[9] == b[13]) && b[1])
		return b[1];

	if ((b[2] == b[6] && b[6] == b[10] && b[10] == b[14]) && b[2])
		return b[2];

	if ((b[3] == b[7] && b[7] == b[11] && b[11] == b[15]) && b[3])
		return b[3];

	// Posciones Diagonales

	if ((b[0] == b[5] && b[5] == b[10] && b[10] == b[15]) && b[0])
		return b[0];

	if ((b[12] == b[9] && b[9] == b[6] && b[6] == b[3]) && b[12])
		return b[12];

	return 0;

}

// Comprueba si el tablero se ha llenado.
exports.tableroLleno = function (b) {

	for (var i=0; i<b.length; i++)
		if (b[i] == 0)
			return false;

	return true;
}

// Creamos un nuevo juego y añadimos al objeto creado en server.js games
exports.creandoJuego = function (games, socket, hash) {

	var new_game_id = hash;

	if (new_game_id == null) {
		var u = 'uoasodf8a7yf8a89h89awrh'+(new Date()).getTime();
		new_game_id = crypto.createHash('md5').update(u).digest("hex");	
	}

	games[new_game_id] = new exports.Game(new_game_id, socket);

	socket.emit('juegoCreado', { game_id: new_game_id });
}


// Asignamos el juego y empezaos si el juego (games) esta activo.
exports.esperandoJuego = function (games, socket) {

	for (var i in games)
		if (games[i].player2 === undefined)
		{
			games[i].player2 = socket;
			games[i].player1.emit('empezar', 
					      { game_id: games[i].game_id,
									turn: games[i].p1_turn });

			games[i].player2.emit('empezar',
				              { game_id: games[i].game_id, 
												turn: !games[i].p1_turn });

			return;
		}

	socket.emit('juegoCompartido');
}

// Ejecutamos el envio de movimiento relevante al juego.
exports.ejecutarMovimiento = function (games, socket, data, handler) {

	var game = games[data.game_id];

	if (game === undefined) {
		socket.emit('error', { description: 'ID de juego no valido'});
		return;
	}

	if (handler == null)
		handler = exports.movimiento;

	if (handler(game, socket, data))
		delete games[data.game_id];
}

// Validar y ejecutar movimiento
exports.movimiento = function (game, socket, data) {

	var square = data.square;

	if (game.player1 === socket && !game.p1_turn) {
		socket.emit('error', { description: 'No es tu turno'});
		return false;
	}

	if (game.player2 === socket && game.p1_turn) {
		socket.emit('error', { description: 'No es tu turno'});
		return false;
	}

	if (game.board[square] != 0 || square < 0 || square > 15) {
		socket.emit('error', { description: 'Movimiento erroneo'});
		return false;
	}

	if (game.p1_turn)
		game.board[square] = 1;
	else
		game.board[square] = 2;

	data.sign = game.board[square];

	game.p1_turn = !game.p1_turn;

	game.player1.emit('movimiento', data);
	game.player2.emit('movimiento', data);

	var winner = exports.ganar(game.board);

	if (winner || exports.tableroLleno(game.board)) {
		game.player1.emit('juegoTerminado', { winner: winner });
		game.player2.emit('juegoTerminado', { winner: winner });
		return true;
	}

	return false;
}