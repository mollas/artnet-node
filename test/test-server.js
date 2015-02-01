var artnetsrv = require('../lib/artnet_server');

var discovery = artnetsrv.ArtNetServer.discover(function (err, data) {
	console.log("err:",err,"data:",data);
}, 5000, "10.255.255.255");

var srv = artnetsrv.ArtNetServer.listen(6454, function(err, msg, peer) {
	if (msg.type == 'ArtOutput') {
		console.log("-----------------");
		console.log("Sequence: " + msg.sequence);
		console.log("Physical: " + msg.physical);
		console.log("Universe: " + msg.universe);
		console.log("Length: " + msg.data.length);
		console.log("Data: " + msg.data);
		console.log("-----------------");
	} else {
	//	console.log(msg);
	}
});

