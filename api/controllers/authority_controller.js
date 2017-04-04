const chainApi = require("./exchangeAPI/chainApi.js");
const util = require('util');
const _ = require("lodash");

module.exports = {
   register:register
}

function register(req, res, next) {
    try {
        console.log(0);
        if (_.isUndefined(req.swagger.params.registerRequest.value.type) || _.isNull(req.swagger.params.registerRequest.value.type)) {
            throw new Error("You need to specify the type of an account to be registered! Possible options are 'consumer' and 'producer'!")
        } else {
            var user_type = req.swagger.params.registerRequest.value.type.toLowerCase();
            console.log(user_type);
            if (user_type !== "consumer" && user_type !== "producer" && user_type !== "reserveproducer" && user_type !== "reserveconsumer") {
                throw new Error("Unsuported account type! Please choose one of 'consumer' or 'producer'.");
            }
            console.log(1);
            chainApi.register(req.swagger.params.registerRequest.value.password, user_type).then(function(user_address) {
                res.statusCode = 200;
                res.end(JSON.stringify({ "userAddress": user_address }));
            }, function(reason) {
                res.statusCode = 500;
                res.end("Blockchain error");
            });        
        }
       
    } catch (error) {
        res.statusCode = 500;
        res.end('Blockchain error: ' + error.message);
    } 
}
