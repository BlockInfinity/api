const chainApi = require("./exchangeAPI/chainApi.js");
const chainUtil = require("./exchangeAPI/chainUtil.js");
const util = require('util');
const db = require('./db');
const _ = require("lodash");

module.exports = {
    getBalance: getBalance,
    getAskOrders: getAskOrders,
    getBidOrders: getBidOrders,
    getMatchingPrice: getMatchingPrice,
    getAllMatchingPrices: getAllMatchingPrices,
    getState: getState,
    getBalance: getBalance,
    getReserveAskOrders: getReserveAskOrders,
    getReserveBidOrders: getReserveBidOrders,
    getReserveAskPrice: getReserveAskPrice,
    getReserveBidPrice: getReserveBidPrice,
    getAllReserveBidPrices: getAllReserveBidPrices,
    getAllReserveAskPrices: getAllReserveAskPrices
}

function findPeriod(req) {
    if (_.isUndefined(req.swagger.params.period.value) || _.isNull(req.swagger.params.period.value) || req.swagger.params.period.value < 0) {
        return global.currentPeriod;
    } else {
        return req.swagger.params.period.value;
    }
}

function getState(req, res, next) {
    try {
        var currentState = global.currentState;
        var currentPeriod = global.currentPeriod;
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

        db.getMatchingPrice(period).then(function(price) {
            res.statusCode = 200;
            res.end(JSON.stringify({ "period": period, "price": price }));
        }, function(reason) {
            res.statusCode = 500;
            res.end('db error', reason);
        });
    } catch (error) {
        res.statusCode = 500;
        res.end('Blockchain error ' + error.message);
    }
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

// function getAskReservePrice(req, res, next) {
//     try {
//         var period = findPeriod(req);
//         var askReservePrice = chainApi.getAskReservePrice(period);
//         res.statusCode = 200;
//         res.end(JSON.stringify({ "period": period, "askReservePrice": askReservePrice }));
//     } catch (error) {
//         res.statusCode = 500;
//         res.end('Blockchain error ' + error.message);
//     }
//     res.end();
// }

// function getBidReservePrice(req, res, next) {
//     try {
//         var period = findPeriod(req);
//         var bidReservePrice = chainApi.getBidReservePrice(period);
//         res.statusCode = 200;
//         res.end(JSON.stringify({ "period": period, "bidReservePrice": bidReservePrice }));
//     } catch (error) {
//         res.statusCode = 500;
//         res.end('Blockchain error ' + error.message);
//     }
//     res.end();
// }

// function getMatchedAskOrders(req, res, next) {
//     try {
//         var period = findPeriod(req);
//         var askOrders = chainApi.getMatchedAskOrders(period);
//         res.statusCode = 200;
//         res.end(JSON.stringify({ "period": period, "matchedAskOrders": askOrders }));
//     } catch (error) {
//         res.statusCode = 500;
//         res.end('Blockchain error ' + error.message);
//     }
//     res.end();
// }

// function getMatchedBidOrders(req, res, next) {
//     try {
//         var period = findPeriod(req);
//         var bidOrders = chainApi.getMatchedBidOrders(period);
//         res.statusCode = 200;
//         res.end(JSON.stringify({ "period": period, "matchedBidOrders": bidOrders }));
//     } catch (error) {
//         res.statusCode = 500;
//         res.end('Blockchain error ' + error.message);
//     }
//     res.end();
// }

// function getMatchedAskOrdersForUser(req, res, next) {
//     try {
//         var period = findPeriod(req);
//         var address = req.swagger.params.address.value;
//         var matchedAskOrders = chainApi.getMatchedAskOrdersForUser(period, address);
//         res.statusCode = 200;
//         res.end(JSON.stringify({ "period": period, "matchedAskOrders": matchedAskOrders }));
//     } catch (error) {
//         res.statusCode = 500;
//         res.end('Blockchain error ' + error.message);
//     }
//     res.end();
// }

// function getMatchedBidOrdersForUser(req, res, next) {
//     try {
//         var period = findPeriod(req);
//         var address = req.swagger.params.address.value;
//         var matchedBidOrders = chainApi.getMatchedBidOrdersForUser(period, address);
//         res.statusCode = 200;
//         res.end(JSON.stringify({ "period": period, "matchedBidOrders": matchedBidOrders }));
//     } catch (error) {
//         res.statusCode = 500;
//         res.end('Blockchain error ' + error.message);
//     }
//     res.end();
// }

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

function getAllReserveAskPrices(req, res, next) {
    try {
        db.getAllReserveAskPrices().then(function(prices) {
            res.end(prices);
        }, function(reason) {
            res.statusCode = 500;
            res.end('DB error', reason);
        });
    } catch (error) {
        res.statusCode = 500;
        res.end('DB error ' + error.message);
    }
}

function getAllReserveBidPrices(req, res, next) {
    try {
        db.getAllReserveBidPrices().then(function(prices) {
            res.end(prices);
        }, function(reason) {
            res.statusCode = 500;
            res.end('DB error', reason);
        });
    } catch (error) {
        res.statusCode = 500;
        res.end('DB error ' + error.message);
    }
}

function getBidOrders(req, res, next) {
    try {
        var period = findPeriod(req);
        db.getBidOrders(period).then(function(orders) {
            res.end(orders);
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
        var period = findPeriod(req);
        db.getAskOrders(period).then(function(orders) {
            res.end(orders);
        }, function(reason) {
            res.statusCode = 500;
            res.end('Blockchain error: No address received from register function!');
        });
    } catch (error) {
        res.statusCode = 500;
        res.end('Blockchain error ' + error.message);
    }
}

function getReserveAskOrders(req, res, next) {
    try {
        var period = findPeriod(req);
        db.getReserveAskOrders(period).then(function(orders) {
            res.end(orders);
        }, function(reason) {
            res.statusCode = 500;
            res.end('Database error', reason);
        });
    } catch (error) {
        res.statusCode = 500;
        res.end('Database error' + error.message);
    }
}

function getReserveBidOrders(req, res, next) {
    try {
        var period = findPeriod(req);
        db.getReserveBidOrders(period).then(function(orders) {
            res.end(orders);
        }, function(reason) {
            res.statusCode = 500;
            res.end('Database error', reason);
            console.log(reason);
        });
    } catch (error) {
        res.statusCode = 500;
        res.end('Database error ' + error.message);
    }
}

function getReserveAskPrice(req, res, next) {
    try {
        var period = findPeriod(req);
        db.getReserveAskPrice(period).then(function(result) {
            res.end(result);
        }, function(reason) {
            res.statusCode = 500;
            res.end('db error', reason);
        });
    } catch (error) {
        res.statusCode = 500;
        res.end('db error ' + error.message);
    }
}

function getReserveBidPrice(req, res, next) {
    try {
        var period = findPeriod(req);
        db.getReserveBidPrice(period).then(function(result) {
            res.end(result);
        }, function(reason) {
            res.statusCode = 500;
            res.end('db error', reason);
            console.log(reason);
        });
    } catch (error) {
        res.statusCode = 500;
        res.end('db error ' + error.message);
    }
}
