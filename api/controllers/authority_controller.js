const blockchainInterface = require("./exchangeAPI/blockEnergyAPI.js");
var util = require('util');

module.exports = {
   register:register
}

function register(req, res, next) {
    try {
        if (typeof req.swagger.params.registerRequest.value.type === "undefined" || req.swagger.params.registerRequest.value.type == null) {
            throw new Error("You need to specify the type of an account to be registered! Possible options are 'consumer' and 'producer'!")
        } else {
            var user_type = req.swagger.params.registerRequest.value.type.toLowerCase();
            if (user_type != "consumer" && user_type != "producer") {
                throw new Error("Unsuported account type! Please choose one of 'consumer' or 'producer'.");
            }
            console.log("before");
            blockchainInterface.register(req.swagger.params.registerRequest.value.password, user_type).then(function(user_address) {
                res.statusCode = 200;
                res.end(JSON.stringify({ "userAddress": user_address }));
            }, function(reason) {
                res.statusCode = 500;
                res.end('Blockchain error: No address received from register function!');
            });        
        }
       
    } catch (error) {
        res.statusCode = 500;
        res.end('Blockchain error: ' + error.message);
    } 
}
