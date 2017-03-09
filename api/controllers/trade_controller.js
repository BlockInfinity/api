const blockchainInterface = require("./exchangeAPI/blockEnergyAPI.js");
var util = require('util');

module.exports = {
    submitSellRequest: submitSellRequest,
    submitBuyRequest: submitSellRequest
}

function submitSellRequest(req, res, next) {
    try {
        var accountAddress = req.swagger.params.sellRequest.accountAddress.value;
        var password =  req.swagger.params.sellRequest.password.value;
        var volume = Number(req.swagger.params.sellRequest.volume.value);
        if (typeof req.swagger.params.sellRequest.price.value !== "undefined" && req.swagger.params.sellRequest.price.value != null ) {
            var price = Number(req.swagger.params.sellRequest.price.value);
        } else {
            res.statusCode = 500;
            res.end("A price is required to submit your selling order!")
        }
       
        blockchainInterface.sell(volume, price, accountAddress, password);
        res.statusCode = 200;
    } catch (error) {
        res.statusCode = 500;
        res.end('Blockchain error ' + error.message);
    }
    res.end();
}

function submitBuyRequest(req, res, next) {
     try {
        var accountAddress = req.swagger.params.buyRequest.accountAddress.value;
        var password =  req.swagger.params.buyRequest.password.value;
        var volume = Number(req.swagger.params.buyRequest.volume.value);
        if (typeof req.swagger.params.buyRequest.price.value !== "undefined" && req.swagger.params.buyRequest.price.value != 0) {
            var price = Number(req.swagger.params.buyRequest.price.value);
        } else {
            var price = Number.MAX_VALUE;
        }
       
        blockchainInterface.buy(volume, price, accountAddress, password);
        res.statusCode = 200;
    } catch (error) {
        res.statusCode = 500;
        res.end('Blockchain error ' + error.message);
    }
    res.end();
}
