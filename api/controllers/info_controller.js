const blockchainInterface = require("./exchangeAPI/blockEnergyAPI.js");
var util = require('util');


module.exports = {
    // getBalance:getBalance,
    getAskOrders:getAskOrders,
    getBidOrders:getBidOrders,
   // getAskReserveOrders:getAskReserveOrders,
    //getBidReserveOrders:getBidReserveOrders,
    getMatchingPrice:getMatchingPrice,
    getState:getState

}

function findPeriod(req) {
    
     var period = req.swagger.params.period.value || blockchainInterface.getState()[1];
     return period;
}

function getState(req, res, next ) {

    try {
        var state_period_pair = blockchainInterface.getState();
        res.statusCode = 200;
        res.end(JSON.stringify({ "state": state_period_pair[0] , "period": state_period_pair[1] }));
    } catch (error) {
        res.statusCode = 500;
        res.end('Blockchain error ' + error.message);
    }
    res.end();
}

function getMatchingPrice(req, res, next) {

    try {
        
        var period = findPeriod(req);
        var matchingPrice = blockchainInterface.getMatchingPrice(period);
        console.log(matchingPrice);
        res.statusCode = 200;
        res.end(JSON.stringify({ "period": period , "matchingPrice": matchingPrice }));
    } catch (error) {
        res.statusCode = 500;
        res.end('Blockchain error ' + error.message);
    }
    res.end();
}

function getBidOrders (req, res, next) {
    try {
        //var period = findPeriod(req);
        var orders = blockchainInterface.getBidOrders();

        var prices = JSON.stringify(orders[0]);
        var volumes = JSON.stringify(orders[1]);

        prices = prices.split("\"").join("");
        volumes = volumes.split("\"").join("");

        res.statusCode = 200;

        res.end(JSON.stringify({ "prices": prices , "volumes": volumes }));

    } catch (error) {
        res.statusCode = 500;
        res.end('Blockchain error ' + error.message);
    }
    res.end();
}

function getAskOrders (req, res, next) {
    try {
        var orders = blockchainInterface.getAskOrders();

        var prices = JSON.stringify(orders[0]);
        var volumes = JSON.stringify(orders[1]);

        prices = prices.split("\"").join("");
        volumes = volumes.split("\"").join("");

        res.statusCode = 200;

        res.end(JSON.stringify([{ "prices": prices }, { "volumes": volumes }]));


    } catch (error) {
        res.statusCode = 500;
        res.end('Blockchain error ' + error.message);
    }
    res.end();
}

// function getAskReserveOrders (req, res, next) {
//     try {
//         //not included in contract

//         res.statusCode = 200;

//         res.end(JSON.stringify({"Reserve Ask Orders" : []}));

//     } catch (error) {
//         res.statusCode = 500;
//         res.end('Blockchain error ' + error.message);
//     }
//     res.end();
// }

// function getBidReserveOrders (req, res, next) {
//     try {
//         res.statusCode = 200;

//         res.end(JSON.stringify({"Reserve Bid Orders" : []}));

//     } catch (error) {
//         res.statusCode = 500;
//         res.end('Blockchain error ' + error.message);
//     }
//     res.end();
// }
