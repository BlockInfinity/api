const blockchainInterface = require("./exchangeAPI/chainApi.js");
var util = require('util');

module.exports = {
    submitSellRequest: submitSellRequest,
    submitBuyRequest: submitBuyRequest
}

function submitSellRequest(req, res, next) {
    try {
        var values = req.swagger.params.sellRequest.value;
        var accountAddress = values.accountAddress;
        var password =  values.password;
        var volume = Number(values.volume);
        if (typeof values.price !== "undefined" && values.price != null ) {
            var price = Number(values.price);
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
        var values = req.swagger.params.buyRequest.value;
        var accountAddress = values.accountAddress;
        var password =  values.password;
        var volume = Number(values.volume);
        if (typeof values.price !== "undefined" && values.price != 0) {
            var price = Number(values.price);
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
