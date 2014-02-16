var connect = require('connect');
connect.createServer(
    connect.static(__dirname+"/../")
).listen(8000);
console.log("webnes started");

