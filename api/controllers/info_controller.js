const chainApi = require("./exchangeAPI/chainApi.js");
const chainUtil = require("./exchangeAPI/chainUtil.js");
const util = require('util');
const db = require('./db');
const _ = require("lodash");

module.exports = {
    getBalance: getBalance,
    getAskOrders: getAskOrders,
    getBidOrders: getBidOrders,
    getAskReservePrice: getAskReservePrice,
    getBidReservePrice: getBidReservePrice,
    getMatchedAskOrders: getMatchedAskOrders,
    getMatchedBidOrders: getMatchedBidOrders,
    getMatchedAskOrdersForUser: getMatchedAskOrdersForUser,
    getMatchedBidOrdersForUser: getMatchedBidOrdersForUser,
    getMatchingPrice: getMatchingPrice,
    getAllMatchingPrices: getAllMatchingPrices,
    getState: getState,
    getBalance: getBalance
}

function findPeriod(req) {
    if (_.isUndefined(req.swagger.params.period.value) || _.isNull(req.swagger.params.period.value) || req.swagger.params.period.value < 0) {
        return chainUtil.getCurrentPeriod();
    } else {
        return req.swagger.params.period.value;
    }
}

function getState(req, res, next) {
    try {
        var currentState = chainUtil.getCurrentState();
        var currentPeriod = chainUtil.getCurrentPeriod();
        res.statusCode = 200;
        res.end(JSON.stringify({ "state": currentState, "period": currentPeriod }));
    } catch (error) {
        res.statusCode = 500;
        res.end('Blockchain error ' + error.message);
    }
    res.end();
}

function getMatchingPrice(req, res, next) {
    try {
        var period = findPeriod(req);
        var matchingPrice = chainApi.getMatchingPrice(period);
        res.statusCode = 200;
        res.end(JSON.stringify({ "period": period, "matchingPrice": matchingPrice }));
    } catch (error) {
        res.statusCode = 500;
        res.end('Blockchain error ' + error.message);
    }
    res.end();
}

// function getBidOrders(req, res, next) {
//     try {
//         var period = chainApi.getState()[1];
//         var orders = chainApi.getBidOrders();
//         var bidOrders = [];
//         for (var i = 0; i < orders[0].length; i++) {
//             bidOrders.push({ "price": orders[0][i], "volume": orders[1][i] });
//         }
//         res.statusCode = 200;
//         res.end(JSON.stringify({ "period": period, "bidOrders": bidOrders }));

//     } catch (error) {
//         res.statusCode = 500;
//         res.end('Blockchain error ' + error.message);
//     }
//     res.end();
// }

// function getAskOrders(req, res, next) {
//     try {
//         var period = chainApi.getState()[1];
//         var orders = chainApi.getAskOrders();
//         var askOrders = [];
//         for (var i = 0; i < orders[0].length; i++) {
//             askOrders.push({ "price": orders[0][i], "volume": orders[1][i] });
//         }
//         res.statusCode = 200;
//         res.end(JSON.stringify({ "period": period, "askOrders": askOrders }));

//     } catch (error) {
//         res.statusCode = 500;
//         res.end('Blockchain error ' + error.message);
//     }
//     res.end();
// }

function getAskReservePrice(req, res, next) {
    try {
        var period = findPeriod(req);
        var askReservePrice = chainApi.getAskReservePrice(period);
        res.statusCode = 200;
        res.end(JSON.stringify({ "period": period, "askReservePrice": askReservePrice }));
    } catch (error) {
        res.statusCode = 500;
        res.end('Blockchain error ' + error.message);
    }
    res.end();
}

function getBidReservePrice(req, res, next) {
    try {
        var period = findPeriod(req);
        var bidReservePrice = chainApi.getBidReservePrice(period);
        res.statusCode = 200;
        res.end(JSON.stringify({ "period": period, "bidReservePrice": bidReservePrice }));
    } catch (error) {
        res.statusCode = 500;
        res.end('Blockchain error ' + error.message);
    }
    res.end();
}

function getMatchedAskOrders(req, res, next) {
    try {
        var period = findPeriod(req);
        var askOrders = chainApi.getMatchedAskOrders(period);
        res.statusCode = 200;
        res.end(JSON.stringify({ "period": period, "matchedAskOrders": askOrders }));
    } catch (error) {
        res.statusCode = 500;
        res.end('Blockchain error ' + error.message);
    }
    res.end();
}

function getMatchedBidOrders(req, res, next) {
    try {
        var period = findPeriod(req);
        var bidOrders = chainApi.getMatchedBidOrders(period);
        res.statusCode = 200;
        res.end(JSON.stringify({ "period": period, "matchedBidOrders": bidOrders }));
    } catch (error) {
        res.statusCode = 500;
        res.end('Blockchain error ' + error.message);
    }
    res.end();
}

function getMatchedAskOrdersForUser(req, res, next) {
    try {
        var period = findPeriod(req);
        var address = req.swagger.params.address.value;
        var matchedAskOrders = chainApi.getMatchedAskOrdersForUser(period, address);
        res.statusCode = 200;
        res.end(JSON.stringify({ "period": period, "matchedAskOrders": matchedAskOrders }));
    } catch (error) {
        res.statusCode = 500;
        res.end('Blockchain error ' + error.message);
    }
    res.end();
}

function getMatchedBidOrdersForUser(req, res, next) {
    try {
        var period = findPeriod(req);
        var address = req.swagger.params.address.value;
        var matchedBidOrders = chainApi.getMatchedBidOrdersForUser(period, address);
        res.statusCode = 200;
        res.end(JSON.stringify({ "period": period, "matchedBidOrders": matchedBidOrders }));
    } catch (error) {
        res.statusCode = 500;
        res.end('Blockchain error ' + error.message);
    }
    res.end();
}

function getBalance(req, res, next) {
    try {
        var address = req.swagger.params.userAddress.value;
        var balance = chainUtil.getBalance(address);
        balance = balance.c[0];
        res.statusCode = 200;
        res.end(JSON.stringify({ "balance": balance }));
    } catch (error) {
        res.statusCode = 500;
        res.end('Blockchain error ' + error.message);
    }
    res.end();
}

function getAllMatchingPrices(req, res, next) {
    try {
        db.getAllMatchingPrices().then(function(prices) {
            res.end(prices);
        }, function(reason) {
            res.statusCode = 500;
            res.end('Blockchain error: No address received from register function!', reason);
        });
    } catch (error) {
        res.statusCode = 500;
        res.end('Blockchain error ' + error.message);
    }
}

function getBidOrders(req, res, next) {
    try {
        var period = req.swagger.params.period.value;
        chainApi.getBidOrders(period).then(function(bids) {
            res.end(bids);
        }, function(reason) {
            res.statusCode = 500;
            res.end('Blockchain error: No address received from register function!');
        });
    } catch (error) {
        res.statusCode = 500;
        res.end('Blockchain error ' + error.message);
    }
}

function getAskOrders(req, res, next) {
    try {
        var period = req.swagger.params.period.value;
        chainApi.getAskOrders(period).then(function(bids) {
            res.end(bids);
        }, function(reason) {
            res.statusCode = 500;
            res.end('Blockchain error: No address received from register function!');
        });
    } catch (error) {
        res.statusCode = 500;
        res.end('Blockchain error ' + error.message);
    }
}
