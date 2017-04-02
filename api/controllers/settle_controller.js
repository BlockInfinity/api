const blockchainInterface = require("./exchangeAPI/chainApi.js");
var util = require('util');

module.exports = {
   settle: settle
}

function settle(req, res, next) {
     try {
        var accountAddress = req.swagger.params.settleRequest.value.accountAddress;
        var password =  req.swagger.params.settleRequest.value.password;
        var volume = req.swagger.params.settleRequest.value.value;
        var type = req.swagger.params.settleRequest.value.type;
        var period = req.swagger.params.settleRequest.value.period;
       
        blockchainInterface.settle(type, volume, period, accountAddress, password);
        res.statusCode = 200;
    } catch (error) {
        res.statusCode = 500;
        res.end('Blockchain error ' + error.message);
    }
    res.end();
};
