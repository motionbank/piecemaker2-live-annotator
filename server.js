var static = require('node-static'),
    fserver = new static.Server('./');

require('http').createServer(function (request, response) {
    request.addListener('end', function () {
        fserver.serve(request, response);
    }).resume();
}).listen(8080);