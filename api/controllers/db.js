const mysql = require("mysql");
const eventWatcher = require("./exchangeAPI/chainEventListener.js");
const chainUtil = require("./exchangeAPI/chainUtil.js");

var db_config = {
    host: "localhost",
    user: "dex",
    password: "amalien",
    database: "apidb",
    connectTimeout: 900000 // connect_timeout is set here and overwrites the configuration in my.cnf
};

connection = null;

function getConnection() {
    return new Promise(function(resolve, reject) {
        if (connection) {
            return resolve(connection);
        } else {
            connection = mysql.createConnection(db_config); // Recreate the connection, since

            connection.connect(function(err) {
                if (err) {
                    console.log('error when connecting to db:', err);
                    setTimeout(getConnection, 2000);
                } else {
                    return resolve(connection);
                }
            });

            connection.on('error', function(err) {
                console.log('db error', err);
                if (err.code === 'PROTOCOL_CONNECTION_LOST') {
                    getConnection();
                } else {
                    return reject(err);
                }
            });
        }
    });
}

function getAllMatchingPrices() {
    return new Promise(function(resolve, reject) {
        getConnection().query("select * from matchingPrices", function(err, rows, fields) {
            if (err) {
                reject(err);
            } else {
                resolve(JSON.stringify(rows));
            }
        });
    });
}

function getBidOrders(_period) {
    if (typeof _period === "undefined") {
        _period = chainUtil.getCurrPeriod();
    }

    return new Promise(function(resolve, reject) {
        getConnection().query("select period,price,volume from orders where period = ? and type =  ?", [_period, "BID"], function(err, rows, fields) {
            if (err) {
                reject(err);
            } else {
                resolve(JSON.stringify(rows));
            }
        });
    });
}

function getAskOrders(_period) {
    if (typeof _period === "undefined") {
        _period = chainUtil.getCurrPeriod();
    }

    return new Promise(function(resolve, reject) {
        getConnection().query("select period,price,volume from orders where period = ? and type =  ?", [_period, "ASK"], function(err, rows, fields) {
            if (err) {
                reject(err);
            } else {
                resolve(JSON.stringify(rows));
            }
        });
    });
}


function getReserveBidOrders(_period) {
    if (typeof _period === "undefined") {
        _period = chainUtil.getCurrPeriod();
    }

    return new Promise(function(resolve, reject) {
        getConnection().query("select price,volume from reserveOrders where period = ? and type =  ?", [_period, "BID"], function(err, rows, fields) {
            if (err) {
                reject(err);
            } else {
                resolve(JSON.stringify(rows));
            }
        });
    });
}

function getReserveAskOrders(_period) {
    if (typeof _period === "undefined") {
        _period = chainUtil.getCurrPeriod();
    }

    return new Promise(function(resolve, reject) {
        getConnection().query("select price,volume from reserveOrders where period = ? and type =  ?", [_period, "ASK"], function(err, rows, fields) {
            if (err) {
                reject(err);
            } else {
                resolve(JSON.stringify(rows));
            }
        });
    });
}

function getReserveAskPrice(_period) {
    if (typeof _period === "undefined") {
        _period = chainUtil.getCurrPeriod();
    }

    return new Promise(function(resolve, reject) {
        getConnection().query("select price from reservePrices where period = ? and type =  ?", [_period, "ASK"], function(err, rows, fields) {
            if (err) {
                reject(err);
            } else {
                resolve(JSON.stringify(rows));
            }
        });
    });
}

function getReserveBidPrice(_period) {
    if (typeof _period === "undefined") {
        _period = chainUtil.getCurrPeriod();
    }

    return new Promise(function(resolve, reject) {
        getConnection().query("select price from reserveOrders where period = ? and type =  ?", [_period, "BID"], function(err, rows, fields) {
            if (err) {
                reject(err);
            } else {
                resolve(JSON.stringify(rows));
            }
        });
    });
}
