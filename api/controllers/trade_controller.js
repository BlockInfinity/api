const blockchainInterface = require("./exchangeAPI/blockEnergyAPI.js");
var util = require('util');

module.exports = {
    submitSellRequest: submitSellRequest,
    submitBuyRequest: submitSellRequest
}

function submitSellRequest(req, res, next ) {
    try {
        var accountAddress = req.swagger.params.sellRequest.value.accountAddress;
        var password =  req.swagger.params.sellRequest.value.password;
        var volume = req.swagger.params.sellRequest.value.value;
         if (typeof req.swagger.params.sellRequest.value.price !== "undefined" && req.swagger.params.sellRequest.value.price != null ) {
            var price = req.swagger.params.sellRequest.value.price;
        } else {
            throw new Error("A price is required to submit your selling order!")
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
        var accountAddress = req.swagger.params.sellRequest.value.accountAddress;
        var password =  req.swagger.params.sellRequest.value.password;
        var volume = req.swagger.params.sellRequest.value.value;
        if (typeof req.swagger.params.sellRequest.value.price !== "undefined" && req.swagger.params.sellRequest.value.price != 0) {
            var price = req.swagger.params.sellRequest.value.price;
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