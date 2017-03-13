const blockchainInterface = require("./exchangeAPI/chainApi.js");
var util = require('util');
const eventWatcher = require("./exchangeAPI/eventWatcher.js");

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
    if (typeof req.swagger.params.period.value === "undefined" || req.swagger.params.period.value == null || req.swagger.params.period.value < 0) {
        return blockchainInterface.getState()[1];
    } else {
        return req.swagger.params.period.value;
    }
}

function getState(req, res, next) {
    try {
        var state_period_pair = blockchainInterface.getState();
        res.statusCode = 200;
        res.end(JSON.stringify({ "state": state_period_pair[0], "period": state_period_pair[1] }));
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
//         var period = blockchainInterface.getState()[1];
//         var orders = blockchainInterface.getBidOrders();
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
//         var period = blockchainInterface.getState()[1];
//         var orders = blockchainInterface.getAskOrders();
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
        var askReservePrice = blockchainInterface.getAskReservePrice(period);
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
        var bidReservePrice = blockchainInterface.getBidReservePrice(period);
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
        var askOrders = blockchainInterface.getMatchedAskOrders(period);
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
        var bidOrders = blockchainInterface.getMatchedBidOrders(period);
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
        var matchedAskOrders = blockchainInterface.getMatchedAskOrdersForUser(period, address);
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
        var matchedBidOrders = blockchainInterface.getMatchedBidOrdersForUser(period, address);
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

function getAllMatchingPrices(req, res, next) {
    try {
        blockchainInterface.getAllMatchingPrices().then(function(prices) {
            res.end(prices);
        }, function(reason) {
            res.statusCode = 500;
            res.end('Blockchain error: No address received from register function!');
        });
    } catch (error) {
        res.statusCode = 500;
        res.end('Blockchain error ' + error.message);
    }
}

function getBidOrders(req, res, next) {
    try {
        var period = req.swagger.params.period.value;
        blockchainInterface.getBidOrders(period).then(function(bids) {
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
        blockchainInterface.getAskOrders(period).then(function(bids) {
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
