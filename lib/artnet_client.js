var dgram = require('dgram');

function ArtNetClient(host, port, universe) {
	this._host = host;
	this._port = port;
	this._socket = dgram.createSocket("udp4");
	this._header = new Buffer(18);

	// Construct Art-Net packet
	var pos = this._header.write("Art-Net\0");

	this._header.writeUInt16LE(0x5000, pos); // OpOutput
	pos += 2;

	this._header.writeUInt16BE(14, pos);     // Protocol version 14
	pos += 2;

	this._header.writeUInt8(0, pos);         // Sequence 0 == disable sequence numbering
	pos++;

	this._header.writeUInt8(0, pos);         // Physical input, informational data
	pos++;

	this._header.writeUInt16LE(universe & 0x7FFF, pos);
	pos += 2;
}

ArtNetClient.prototype.send = function(data, callback) {
	// Protocol states that length should be a even number
	if (data.length % 2 == 1) {
		data.push(0);
	}
	this._header.writeUInt16BE(data.length, 16); // Write packet length

	var buf = Buffer.concat([this._header, new Buffer(data)]);
	this._socket.send(buf, 0, buf.length, this._port, this._host, function(error){
		if (typeof callback == 'function') {
			callback(error);
		}
	});
}

ArtNetClient.prototype.close = function(){
	this._socket.close();
};


exports.createClient = function(host, port, universe) {
	return new ArtNetClient(host, port, universe);
}

exports.ArtNetClient = ArtNetClient;
