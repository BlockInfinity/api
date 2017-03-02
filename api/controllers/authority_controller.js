const blockchainInterface = require("./exchangeAPI/blockEnergyAPI.js");
var util = require('util');


module.exports = {
   register:register,


}

function register(req, res, next) {

    //  //The response object is a standard http response object
    try {
        var user_address = blockchainInterface.register(req.registerRequest.value.password, req.registerRequest.value.type);
        if (user_address) {
            res.statusCode = 200;
            res.end(JSON.stringify({ "userAddress": user_address }));
        } else {
            res.statusCode = 500;
            res.end('Blockchain error: No address received from register function!');
        }
        
    } catch (error) {
        res.statusCode = 500;
        res.end('Blockchain error ' + error.message);
    }
    res.end();
};