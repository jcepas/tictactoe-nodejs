var express = require('express');
var app = express();
var io = require('socket.io').listen(app.listen(3000)); //Le comunicamos al socket a que direccion debe escuchar en nuestro caso localhost:3000
var OX = require('./ox');
var usuarios ={};

//Indicamos que dirección o pagina vamos a abrir, "index.html"
app.get('/', function (req, res) {
		res.sendfile(__dirname + '/index.html');
		});

var games = new Object(); //Generamos el objeto game

//Lanzamos el socket con el evento 'connection'
io.sockets.on('connection', function (socket) {
 	//Espera al evento 'esperandoJuego' para lanzar el juego
	socket.on('esperandoJuego', function (data) {
		OX.esperandoJuego(games, socket);
	});

	//Si existe conexion y ha llegado el esperandoJuego, lanza la creación del juego mediante el evento creandoJuego
	socket.on('creandoJuego', function (data) {
		OX.creandoJuego(games, socket);

	});
	//Espera el moviento por parte del usuario.
	socket.on('movimiento', function (data) {
		OX.ejecutarMovimiento(games, socket, data);
	});

	socket.on('enviarMensaje',function(data){
			io.socket.emit('nuevo mensaje', {msg: data, usuario: socket.usuario});
	});

});