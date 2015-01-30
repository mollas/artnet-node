# artnet-node
## Art-Net Library for NodeJS

### Client example

Here is an example that sends 4 dmx channels 10 times to each node it finds on the network, and then exits.

```js
  var artnet = require('arnet-node');
  var artnetClient = artnet.Client;
  
  artnet.Discover(function (err, data) {
    if (data) {
      console.log("I found: ", data);
      for (var i = 0; i < data.length; ++i) {

        // Send 1 packet to each node found, at universe 1
        var client = new artnetClient(data[i].address, data[i].port, 1);
        client.count = 0;

        for (var ii = 0; ii < 10; ++ii) {

          client.send([255, 255, 255, 255], function (err) {
            if (!err) {
              console.log("Packet sent to " + this._host);
            } else {
              console.log("Error: ", err);
            }

            // Close socket when done
            if (--this.count == 0) this.close();
          });

          client.count++;
        }

      }
    }
  }, 3000, "10.255.255.255");

```

### Written by (amongst others)
* Brian McClain
* Martin Herbst
* Håkon Nessjøen
