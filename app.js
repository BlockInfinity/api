'use strict';

var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var swaggerTools = require('swagger-tools');
var jsyaml = require('js-yaml');
var fs = require('fs');
var serverPort = 8080;
var express = require("express")
var SSE = require('sse');



// swaggerRouter configuration
var options = {
    swaggerUi: '/swagger.json',
    controllers: './api/controllers',
    useStubs: process.env.NODE_ENV === 'development' ? true : false // Conditionally turn on stubs (mock mode)
};

// The Swagger document (require it, build it programmatically, fetch it from a URL, ...)
var spec = fs.readFileSync('./api/swagger/swagger.yaml', 'utf8');
var swaggerDoc = jsyaml.safeLoad(spec);

app.use(function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "X-Requested-With");
    next();
});

app.use(express.static('public'));


app.all('/', function(req, resp) {

    resp.redirect('/docs');

});


const web3 = require("./api/controllers/exchangeAPI/chainConnector.js");
const eth = web3.eth;
const etherex = web3.exchangeContract;


var server;
var currPeriod = etherex.getCurrPeriod().toNumber();
var state = etherex.getCurrState().toNumber();
// Initialize the Swagger middleware
swaggerTools.initializeMiddleware(swaggerDoc, function(middleware) {
    // Interpret Swagger resources and attach metadata to request - must be first in swagger-tools middleware chain
    app.use(middleware.swaggerMetadata());

    // Validate Swagger requests
    app.use(middleware.swaggerValidator());

    // Route validated requests to appropriate controller
    app.use(middleware.swaggerRouter(options));

    // Serve the Swagger documents and Swagger UI
    app.use(middleware.swaggerUi());

    io.on('connection', function(socket) {
        console.log('a user connected');
        socket.on('disconnect', function() {
            console.log('user disconnected');
        });


        // catch blockcreation events and broadcast them to all clients
        let filter = eth.filter('latest');
        filter.watch(function(err, res) {
            let startBlock = etherex.getStartBlock().toNumber();
            let minedBlocks = eth.blockNumber - startBlock;
            let toSend = {MinedBlocksInCurrPeriod: minedBlocks}
            io.emit('blockCreationEvent', JSON.stringify(toSend));
        });

        // catch order  events and broadcast them to all clients
        var OrderEvent = etherex.OrderEvent();
        OrderEvent.watch(function(err, res) {
            let _price = res.args._price.toNumber();
            let _volume = res.args._volume.toNumber();
            let _period = currPeriod;
            let _type = hex2a(res.args._type);
            let toSend = { "period": _period, "type": _type, "price": _price, "volume": _volume }
            io.emit('orderEvent', JSON.stringify(toSend));
        });

        // catch matching events and new period events and broadcast them to all clients
        var StateChangeEvent = etherex.StateChangedEvent();
        StateChangeEvent.watch(function(err, res) {
            if (!err) {
                state = res.args._state.toNumber();
                if (state == 1) {

                    let matchingPrice = etherex.getMatchingPrice(currPeriod).toNumber();

                    let post = { period: currPeriod, price: matchingPrice };
                    io.emit('matchingEvent', JSON.stringify(post));

                } else {
                    currPeriod = etherex.getCurrPeriod().toNumber();
                    let post = { period: currPeriod };
                    io.emit('newPeriodEvent', JSON.stringify(post));
                }
            }
        });

    });

    // Start the server
    http.listen(serverPort, function() {
        console.log('Your server is listening on port %d (http://localhost:%d)', serverPort, serverPort);
        console.log('Swagger-ui is available on http://localhost:%d/docs', serverPort);
    });

});


// helper function to convert solidity's bytes32 to string
function hex2a(hexx) {
    var hex = hexx.toString(); //force conversion
    var str = '';
    for (var i = 2; i < hex.length; i += 2) {
        if (parseInt(hex.substr(i, 2)) != 0) {
            str += String.fromCharCode(parseInt(hex.substr(i, 2), 16));
        }
    }
    return str;
}
