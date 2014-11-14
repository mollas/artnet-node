var dgram = require('dgram');
var Buffer = require('buffer').Buffer;

//			  A   r    t    -  N    e    t
var HEADER = [65, 114, 116, 45, 78, 101, 116, 0]; // 0 - 11
// 0x5000 - Standard ArtDMX data packet
var OP_CODE_DATAPACKET = [0, 80];
var PROTOCOL_VERSION = [0, 14];
var SEQUENCE = [0]; // 12
var PHYSICAL = [0]; // 13

var PORT = 6454;

function ArtNetClient(host, port, universe) {
	this._host = host;
	this._port = port;
	this._socket = dgram.createSocket("udp4");

	this.UNIVERSE = [universe, 0]; // 14 - 15, low byte of universe number is sent first
	//this.LENGTH = [0, 13]; // 16 - 17
}

ArtNetClient.prototype.send = function(data) {
	// Calcualte the length
	var length_upper = Math.floor(data.length / 256);
	var length_lower = data.length % 256;
	var data = HEADER.concat(OP_CODE_DATAPACKET).concat(PROTOCOL_VERSION).concat(SEQUENCE)
				.concat(PHYSICAL).concat(this.UNIVERSE).concat([length_upper, length_lower]).concat(data);
	var buf = Buffer(data);
	this._socket.send(buf, 0, buf.length, this._port, this._host, function(err, res){ });
}

ArtNetClient.prototype.close = function(){
	this._socket.close();
}

exports.discoverNodes = function(callback) {
	var nodes = [];
	var socket = dgram.createSocket('udp4');

	socket.bind(6454, '0.0.0.0');

	// retrieve responses from artnet nodes
	socket.on('message', function(message, rinfo) {
		var node = {name: message.toString().slice(24, 44), address: rinfo.address, port: rinfo.port};
		nodes.push(node);
	});

	// listening fires after the socket has been created
	socket.on('listening', function() {
		socket.setBroadcast(true);

		// OpCode defining this packet as ArtPoll packet
		var artPollOpCode = [0, 32];
		// specify what information we want back
		var talkToMe = [0, 1, 1, 0,0,0,0,0];

		var data = HEADER.concat(artPollOpCode).concat(PROTOCOL_VERSION).concat(talkToMe);
		var buf = Buffer(data);
		socket.send(buf, 0, buf.length, PORT, '255.255.255.255');
	});

	// wait 2 sec for messages
	setTimeout(function() {
		socket.close();
		callback(nodes);
	}, 2000);
}

exports.createClient = function(host, port, universe) {
	return new ArtNetClient(host, port, universe);
}

exports.ArtNetClient = ArtNetClient;
