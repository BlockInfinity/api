const blockchainInterface = require("./exchangeAPI/blockEnergyAPI.js");
var util = require('util');


module.exports = {
    getBalance:getBalance,
    getAskOrders:getAskOrders,
    getBidOrders:getBidOrders,
   // getAskReserveOrders:getAskReserveOrders,
    //getBidReserveOrders:getBidReserveOrders,
    getMatchingPrice:getMatchingPrice,
    getState:getState,
    getBalance:getBalance

}

function findPeriod(req) {
    if (typeof req.swagger.params.period.value === "undefined" || req.swagger.params.period.value == null || req.swagger.params.period.value < 0)  {
        return blockchainInterface.getState()[1];
    } else {
        return req.swagger.params.period.value;
    }
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
        
        var orders = blockchainInterface.getBidOrders();
        var bidOrders = [];
        for (var i = 0; i < orders[0].length; i++) {
            bidOrders.push({"price": orders[0][i], "volume" : orders[1][i]});
        }
         
        res.statusCode = 200;
        res.end(JSON.stringify({ "period" : "last", "bidOrders" : bidOrders }));

    } catch (error) {
        res.statusCode = 500;
        res.end('Blockchain error ' + error.message);
    }
    res.end();
}

function getAskOrders (req, res, next) {
    try {
        var orders = blockchainInterface.getAskOrders();
        var askOrders = [];
        for (var i = 0; i < orders[0].length; i++) {
            askOrders.push({"price": orders[0][i], "volume" : orders[1][i]});
        }

        res.statusCode = 200;
        res.end(JSON.stringify({ "period" : "last", "askOrders" : askOrders }));
        
    } catch (error) {
        res.statusCode = 500;
        res.end('Blockchain error ' + error.message);
    }
    res.end();
}

function getBalance(req, res, next) {
    
    try {
        var address = req.swagger.params.address.value;
        var balance = blockchainInterface.getBalance(address);
        balance = balance.c[0];
        res.statusCode = 200;
        res.end(JSON.stringify({ "balance": balance }));
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
