var dgram = require('dgram');
var Buffer = require('buffer').Buffer;

function ArtNetClient(host, port, universe) {
	this._host = host;
	this._port = port;
	this._socket = dgram.createSocket("udp4");
				 // A   r    t    -  N    e    t
	this.HEADER = [65, 114, 116, 45, 78, 101, 116, 0]; // 0 - 11
				// 0x5000 - ArtDMX data packet
	this.OP_CODE = [0, 80];
	this.PROTOCOL_VERSION = [0, 14];
	this.SEQUENCE = [0]; // 12
	this.PHYSICAL = [0]; // 13
	this.UNIVERSE = [universe, 0]; // 14 - 15, low byte of universe number is sent first
	//this.LENGTH = [0, 13]; // 16 - 17
}

ArtNetClient.prototype.send = function(data) {
	// Calcualte the length
	var length_upper = Math.floor(data.length / 256);
	var length_lower = data.length % 256;
	var data = this.HEADER.concat(this.OP_CODE).concat(this.PROTOCOL_VERSION).concat(this.SEQUENCE)
				.concat(this.PHYSICAL).concat(this.UNIVERSE).concat([length_upper, length_lower]).concat(data);
	var buf = Buffer(data);
	this._socket.send(buf, 0, buf.length, this._port, this._host, function(err, res){  console.log("response: "+res) });
}

ArtNetClient.prototype.discover = function(callback) {
	// this._socket.bind();
	var response = '';



	var self = this;
	this._socket.bind(6454, '0.0.0.0');

	this._socket.on('message', function(message, rinfo) {
		response += message;
		console.log('answer recieved: ' + message.toString());
	})


	this._socket.on('listening', function() {
		console.log('listening');

		self._socket.setBroadcast(true);
		// self._socket.addMembership('255.255.255.255');

		var artPollOpCode = [0, 32];
		var talkToMe = [0, 1, 1, 0,0,0,0,0];

		var data = self.HEADER.concat(artPollOpCode).concat(self.PROTOCOL_VERSION).concat(talkToMe);
		var buf = Buffer(data);
		self._socket.send(buf, 0, buf.length, self._port, '192.168.0.255', function(err, res) {
	    // self._socket.send(Buffer([3]), 0, 1, 11001, '255.255.255.255', function(err, bytes) {
			console.log('broadcast send');
			console.log("discover response: " + res);
			// self.close();
		});
		// self.close();
	});

	// wait 3 sec for messages
	setTimeout(function() {
		callback(response);
	}, 3000);
}

ArtNetClient.prototype.close = function(){
	this._socket.close();
};


exports.createClient = function(host, port, universe) {
	return new ArtNetClient(host, port, universe);
}

exports.ArtNetClient = ArtNetClient;
