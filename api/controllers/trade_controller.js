const chainApi = require("./exchangeAPI/chainApi.js");
const chainUtil = require("./exchangeAPI/chainUtil.js");
const _ = require("lodash");

module.exports = {
    submitAskOrder: submitAskOrder,
    submitBidOrder: submitBidOrder,
    submitReserveAskOrder: submitReserveAskOrder,
    submitReserveBidOrder: submitReserveBidOrder,
    // updateState: updateState
}

function submitAskOrder(req, res, next) {
    if (global.currentState === 1) {
        res.statusCode = 400;
        res.end('Invalid state. Only reserve orders can be submitted.');
        return;
    }

    var values = req.swagger.params.sellRequest.value;
    var accountAddress = values.accountAddress;
    var password = values.password;
    var volume = Number(values.volume);

    if (!_.isUndefined(values.price) && values.price !== 0) {
        var price = Number(values.price);
    } else {
        res.statusCode = 500;
        res.end("A price is required to submit your selling order!")
    }

    chainApi.sell(volume, price, accountAddress, password, false).then(function() {
        res.statusCode = 200;
        res.end();
    }, function(err) {
        res.statusCode = 500;
        res.end('Blockchain error ' + err.message);
    });
}

function submitBidOrder(req, res, next) {
    if (global.currentState === 1) {
        res.statusCode = 400;
        res.end('Invalid state. Only reserve orders can be submitted.');
    }

    var values = req.swagger.params.buyRequest.value;
    var accountAddress = values.accountAddress;
    var password = values.password;
    var volume = Number(values.volume);
    if (!_.isUndefined(values.price) && values.price !== 0) {
        var price = Number(values.price);
    } else {
        var price = Number.MAX_VALUE;
    }
    chainApi.buy(volume, price, accountAddress, password, false).then(function() {
        res.statusCode = 200;
        res.end();
    }, function(err) {
        res.statusCode = 500;
        res.end('Blockchain error ' + err.message);
    });
}

function submitReserveAskOrder(req, res, next) {
    if (global.currentState === 0) {
        res.statusCode = 400;
        res.end('Invalid state. Only normal orders can be submitted.');
    }

    var values = req.swagger.params.sellRequest.value;
    var accountAddress = values.accountAddress;
    var password = values.password;
    var volume = Number(values.volume);
    if (!_.isUndefined(values.price) && values.price !== 0) {
        var price = Number(values.price);
    } else {
        res.statusCode = 500;
        res.end("A price is required to submit your selling order!")
    }

    chainApi.sell(volume, price, accountAddress, password, true).then(function() {
        res.statusCode = 200;
        res.end();
    }, function(err) {
        res.statusCode = 500;
        res.end('Blockchain error ' + err.message);
    });
}

function submitReserveBidOrder(req, res, next) {
    if (global.currentState === 0) {
        res.statusCode = 400;
        res.end('Invalid state. Only normal orders can be submitted.');
    }

    var values = req.swagger.params.buyRequest.value;
    var accountAddress = values.accountAddress;
    var password = values.password;
    var volume = Number(values.volume);
    if (!_.isUndefined(values.price) && values.price !== 0) {
        var price = Number(values.price);
    } else {
        var price = Number.MAX_VALUE;
    }

    chainApi.buy(volume, price, accountAddress, password, true).then(function() {
        res.statusCode = 200;
        res.end();
    }, function(err) {
        res.statusCode = 500;
        res.end('Blockchain error ' + err.message);
    });
}

// function updateState(req, res, next) {
//     chainApi.updateState();
//     res.end("State updated");
// }
