var dgram = require('dgram');
var Buffer = require('buffer').Buffer;

var HEADER       = "Art-Net\0";
var OP_OUTPUT    = 0x5000; // 0x5000 - Standard ArtDMX data packet
var OP_POLL      = 0x2000; // 0x2000 - ArtPoll packet
var OP_POLLREPLY = 0x2100; // 0x2100 - ArtPollReply packet
var PROTOCOL_VERSION = 14;

// Defaults
var SEQUENCE = 0;
var PHYSICAL = 0;

var PORT = 6454;

function artnet_header(opcode) {
	var buf = new Buffer(12);
	buf.write(HEADER);
	buf.writeUInt16LE(opcode, 8);
	buf.writeUInt16BE(PROTOCOL_VERSION, 10);
	return buf;
}

function ArtNetClient(host, port, universe) {
	this._host     = host;
	this._port     = port;
	this._socket   = dgram.createSocket("udp4");
	this._universe = universe;
	this.sequence  = SEQUENCE;
	this.physical  = PHYSICAL;
}

ArtNetClient.prototype.send = function(data, callback) {
	var self = this;

	// Adjust data length, length must be even according to protocol
	if (data.length % 2 == 1) {
		data.push(0);
	}

	var header = artnet_header(OP_OUTPUT);
	var header_opOutput = new Buffer(6);

	// Sequence, Int8
	header_opOutput.writeUInt8(this.sequence, 0);

	// Physical, input Int8
	header_opOutput.writeUInt8(this.physical, 1);

	// Universe number, 15 bit accuracy
	header_opOutput.writeUInt16LE(this.universe & 0x7FFF, 2);

	// Data length
	header_opOutput.writeUInt16BE(data.length, 4);

	var buf = Buffer.concat([header, header_opOutput, new Buffer(data)]);
	this._socket.send(buf, 0, buf.length, this._port, this._host, function(err, res) {
		if (typeof callback == 'function') {
			callback.call(self, err, res);
		}
	});
}

ArtNetClient.prototype.close = function(){
	try {
		this._socket.close();
	} catch (err) {
		// Ignore
	}
}

exports.discover = function(callback, timeout, address) {
	var self = this;
	var timer;
	var nodes = [];
	var socket = dgram.createSocket('udp4');
	var waitfor = timeout || 3000; // Protocol says 3 seconds max

	/* Abort on error */
	socket.on('error', function (err) {
		if (typeof callback == "function") {
			callback.call(self, "Error: " + err);
		} else {
			throw err;
		}
		if (typeof timer != 'undefined') {
			clearTiemout(timer);
		}
		socket.close();
	});

	try {
		socket.bind(PORT, '0.0.0.0');
	} catch (e) {
		if (typeof callback == "function") {
			callback.call(self, "Error: " + e.message);
		} else {
			throw e;
		}
		return;
	}

	// retrieve responses from artnet nodes
	socket.on('message', function(message, rinfo) {
		if (message.toString('utf8', 0, 8) == HEADER) {
			var opcode = message.readUInt16LE(8);

			if (opcode == OP_POLLREPLY) {
				var info = {
					shortName: message.toString('utf8', 26, 44),
					name: message.toString('utf8', 44, 108),
					address: rinfo.address,
					port: rinfo.port
				};
				info.shortName = info.shortName.substring(0, info.shortName.indexOf("\0"));
				info.name = info.name.substring(0, info.name.indexOf("\0"));
				nodes.push(info);
			}
		}
	});

	// listening fires after the socket has been created
	socket.on('listening', function() {
		socket.setBroadcast(true);

		var header = artnet_header(OP_POLL);
		var packet_opPoll = new Buffer(2);
		/*
		 * 	7-4 = 0
		 * 	3   = Diagnostics messages are unicast. (we do not need diagnostics messages)
		 *	2   =  Send me diagnostics messages. (No thank you)
		 *	1   =  Send ArtPollReply whenever Node conditions
		 *	       change. This selection allows the Controller to be
		 *	       informed of changes without the need to
		 *	       continuously poll. (No thanks, we only need one response)
		 *	0   = 0
		 *
		 *	Our result: 0000 0000
		 */
		var talkToMe = parseInt("00000000", 2);

		// TalkToMe, Int8
		packet_opPoll.writeUInt8(talkToMe, 0);

		// Diagnostics priority, Int8
		packet_opPoll.writeUInt8(0, 1); // Not interested

		var buf = Buffer.concat([header, packet_opPoll]);
		socket.send(buf, 0, buf.length, PORT, address || '255.255.255.255');
	});

	// wait "waitfor" milliseconds for messages
	timer = setTimeout(function() {
		socket.close();
		if (typeof callback == 'function') {
			callback.call(self, null, nodes);
		} else {
			throw "No callback defined for result";
		}
	}, waitfor);
}

exports.createClient = function(host, port, universe) {
	return new ArtNetClient(host, port, universe);
}

exports.ArtNetClient = ArtNetClient;
