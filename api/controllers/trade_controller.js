const blockchainInterface = require("./exchangeAPI/chainApi.js");
var util = require('util');


const eventWatcher = require("./exchangeAPI/chainEventListener.js");

module.exports = {
    submiAskOrder: submiAskOrder,
    submitBidOrder: submitBidOrder,
    submitReserveAskOrder: submitReserveAskOrder,
    submitReserveBidOrder: submitReserveBidOrder
}

function submiAskOrder(req, res, next) {

    if (eventWatcher.getState() == 1) {
        res.statusCode = 400;
        res.end('Invalid state. Only reserve orders can be submitted.');
    }

    var values = req.swagger.params.sellRequest.value;
    var accountAddress = values.accountAddress;
    var password = values.password;
    var volume = Number(values.volume);
    if (typeof values.price !== "undefined" && values.price != null) {
        var price = Number(values.price);
    } else {
        res.statusCode = 500;
        res.end("A price is required to submit your selling order!")
    }


    try {

        blockchainInterface.sell(volume, price, accountAddress, password);
        res.statusCode = 200;
    } catch (error) {
        res.statusCode = 500;
        res.end('Blockchain error ' + error.message);
    }
    res.end();
}


function submitBidOrder(req, res, next) {

    if (eventWatcher.getState() == 1) {
        res.statusCode = 400;
        res.end('Invalid state. Only reserve orders can be submitted.');
    }



    var values = req.swagger.params.buyRequest.value;
    var accountAddress = values.accountAddress;
    var password = values.password;
    var volume = Number(values.volume);
    if (typeof values.price !== "undefined" && values.price != 0) {
        var price = Number(values.price);
    } else {
        var price = Number.MAX_VALUE;
    }
    try {

        blockchainInterface.buy(volume, price, accountAddress, password);
        res.statusCode = 200;
    } catch (error) {
        res.statusCode = 500;
        res.end('Blockchain error ' + error.message);
    }
    res.end();
}


function submitReserveAskOrder(req, res, next) {

    if (eventWatcher.getState() == 0) {
        res.statusCode = 400;
        res.end('Invalid state. Only normal orders can be submitted.');
    }


    var values = req.swagger.params.sellRequest.value;
    var accountAddress = values.accountAddress;
    var password = values.password;
    var volume = Number(values.volume);
    if (typeof values.price !== "undefined" && values.price != null) {
        var price = Number(values.price);
    } else {
        res.statusCode = 500;
        res.end("A price is required to submit your selling order!")
    }
    try {
        blockchainInterface.sell(volume, price, accountAddress, password);
        res.statusCode = 200;
    } catch (error) {
        res.statusCode = 500;
        res.end('Blockchain error ' + error.message);
    }
    res.end();
}

function submitReserveBidOrder(req, res, next) {

    if (eventWatcher.getState() == 0) {
        res.statusCode = 400;
        res.end('Invalid state. Only normal orders can be submitted.');
    }

    var values = req.swagger.params.buyRequest.value;
    var accountAddress = values.accountAddress;
    var password = values.password;
    var volume = Number(values.volume);
    if (typeof values.price !== "undefined" && values.price != 0) {
        var price = Number(values.price);
    } else {
        var price = Number.MAX_VALUE;
    }
    try {
        blockchainInterface.buy(volume, price, accountAddress, password);
        res.statusCode = 200;
    } catch (error) {
        res.statusCode = 500;
        res.end('Blockchain error ' + error.message);
    }
    res.end();
}
