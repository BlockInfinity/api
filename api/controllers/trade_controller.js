const blockchainInterface = require("./exchangeAPI/blockEnergyAPI.js");
var util = require('util');

module.exports = {
    submitSellRequest: submitSellRequest,
    submitBuyRequest: submitBuyRequest
}

function submitSellRequest(req, res, next) {
    try {
        var accountAddress = req.swagger.params.sellRequest.value.accountAddress;
        var password =  req.swagger.params.sellRequest.value.password;
        var volume = Number(req.swagger.params.sellRequest.value.volume);
        if (typeof req.swagger.params.sellRequest.value.price !== "undefined" && req.swagger.params.sellRequest.value.price != null ) {
            var price = Number(req.swagger.params.sellRequest.value.price);
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
        var accountAddress = req.swagger.params.buyRequest.value.accountAddress;
        var password =  req.swagger.params.buyRequest.value.password;
        var volume = Number(req.swagger.params.buyRequest.value.volume);
        if (typeof req.swagger.params.buyRequest.value.price !== "undefined" && req.swagger.params.buyRequest.value.price != 0) {
            var price = Number(req.swagger.params.buyRequst.value.price);
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
