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
    getAllReserveAskPrices: getAllReserveAskPrices,
    getCollateral: getCollateral,
    getAllConsumers: getAllConsumers,
    getAllProducers: getAllProducers,
    getAllReserveConsumers: getAllReserveConsumers,
    getAllReserveProducers: getAllReserveProducers,
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

function getCollateral(req, res, next) {

    try {

        var address = req.swagger.params.userAddress.value;
        var collateral = chainApi.getCollateral(address);
        res.statusCode = 200;
        res.end(JSON.stringify({ "collateral": collateral }));

    } catch (error) {
        res.statusCode = 500;
        res.end('Blockchain error ' + error.message);
    }

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

function getAllConsumers(req, res, next) {
    try {
        db.getAllConsumers().then(function(result) {
            res.end(result);
        }, function(reason) {
            res.statusCode = 500;
            res.end('Blockchain error: No address received from register function!', reason);
        });
    } catch (error) {
        res.statusCode = 500;
        res.end('Blockchain error ' + error.message);
    }
}


function getAllProducers(req, res, next) {
    try {
        db.getAllProducers().then(function(result) {
            res.end(result);
        }, function(reason) {
            res.statusCode = 500;
            res.end('Blockchain error: No address received from register function!', reason);
        });
    } catch (error) {
        res.statusCode = 500;
        res.end('Blockchain error ' + error.message);
    }
}


function getAllReserveConsumers(req, res, next) {
    try {
        db.getAllReserveConsumers().then(function(result) {
            res.end(result);
        }, function(reason) {
            res.statusCode = 500;
            res.end('Blockchain error: No address received from register function!', reason);
        });
    } catch (error) {
        res.statusCode = 500;
        res.end('Blockchain error ' + error.message);
    }
}


function getAllReserveProducers(req, res, next) {
    try {
        db.getAllReserveProducers().then(function(result) {
            res.end(result);
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
