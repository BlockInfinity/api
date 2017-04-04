const mysql = require("mysql");
const _ = require("lodash");

const chainUtil = require("./exchangeAPI/chainUtil.js");

var db_config = {
    host: "52.166.9.249",
    user: "dex",
    password: "amalien",
    database: "apidb"
};

global.db_connection_pool = null;

function getConnection() {
    return new Promise(function(resolve, reject) {
        if (global.db_connection_pool) {
            global.db_connection_pool.getConnection(function(err, connection) {
                if (err) {
                    console.log('error when connecting to db:', err);
                    setTimeout(getConnectionPool, 2000);
                } else {
                    return resolve(connection);
                }
            });
        } else {
            global.db_connection_pool = mysql.createPool(db_config);
            global.db_connection_pool.getConnection(function(err, connection) {
                if (err) {
                    console.log('error when connecting to db:', err);
                    setTimeout(getConnectionPool, 2000);
                } else {
                    return resolve(connection);
                }
            });
        }
    });
}

function getAllMatchingPrices() {
    return new Promise(function(resolve, reject) {
        getConnection().then(function(connection) {
            connection.query("select * from matchingPrices", function(err, rows, fields) {
                connection.release();
                if (err) {
                    reject(err);
                } else {
                    resolve(JSON.stringify(rows));
                }
            });
        }, function(err) {
            reject(err);
        });
    });
}

function getAllConsumers() {
    return new Promise(function(resolve, reject) {
        getConnection().then(function(connection) {
            connection.query("select address from users where type = ?",'consumer', function(err, rows, fields) {
                connection.release();
                if (err) {
                    reject(err);
                } else {
                    resolve(JSON.stringify(rows));
                }
            });
        }, function(err) {
            reject(err);
        });
    });
}

function getAllProducers() {
    return new Promise(function(resolve, reject) {
        getConnection().then(function(connection) {
            connection.query("select address from users where type = ?", 'producer', function(err, rows, fields) {
                connection.release();
                if (err) {
                    reject(err);
                } else {
                    resolve(JSON.stringify(rows));
                }
            });
        }, function(err) {
            reject(err);
        });
    });
}

function getAllReserveConsumers() {
    return new Promise(function(resolve, reject) {
        getConnection().then(function(connection) {
            connection.query("select address from users where type = ?", 'reserveConsumer', function(err, rows, fields) {
                connection.release();
                if (err) {
                    reject(err);
                } else {
                    resolve(JSON.stringify(rows));
                }
            });
        }, function(err) {
            reject(err);
        });
    });
}

function getAllReserveProducers() {
    return new Promise(function(resolve, reject) {
        getConnection().then(function(connection) {
            connection.query("select address from users where type = ?", 'reserveProducer', function(err, rows, fields) {
                connection.release();
                if (err) {
                    reject(err);
                } else {
                    resolve(JSON.stringify(rows));
                }
            });
        }, function(err) {
            reject(err);
        });
    });
}


function getAllReserveAskPrices() {
    return new Promise(function(resolve, reject) {
        getConnection().then(function(connection) {
            connection.query("select period,price from reservePrices where type = 'ASK'", function(err, rows, fields) {
                connection.release();
                if (err) {
                    reject(err);
                } else {
                    resolve(JSON.stringify(rows));
                }
            });
        }, function(err) {
            reject(err);
        });
    });
}

function getAllReserveBidPrices() {
    return new Promise(function(resolve, reject) {
        getConnection().then(function(connection) {
            connection.query("select period,price from reservePrices where type = 'BID'", function(err, rows, fields) {
                connection.release();
                if (err) {
                    reject(err);
                } else {
                    resolve(JSON.stringify(rows));
                }
            });
        }, function(err) {
            reject(err);
        });
    });
}

function getMatchingPrice(_period) {
    return new Promise(function(resolve, reject) {
        getConnection().then(function(connection) {
            connection.query("select * from matchingPrices where period = ?", _period, function(err, rows, fields) {
                connection.release();
                if (err) {
                    reject(err);
                } else {
                    resolve(rows[0].price.toString());
                }
            });
        }, function(err) {
            reject(err);
        });
    });
}

function getBidOrders(_period) {
    if (_.isUndefined(_period)) {
        _period = chainUtil.getCurrentPeriod();
    }

    return new Promise(function(resolve, reject) {
        getConnection().then(function(connection) {
            connection.query("select period, price, volume from orders where period = ? and type =  ?", [_period, "BID"], function(err, rows, fields) {
                connection.release();
                if (err) {
                    reject(err);
                } else {
                    resolve(JSON.stringify(rows));
                }
            });
        }, function(err) {
            reject(err);
        });
    });
}

function getAskOrders(_period) {
    if (_.isUndefined(_period)) {
        _period = chainUtil.getCurrentPeriod();
    }

    return new Promise(function(resolve, reject) {
        getConnection().then(function(connection) {
            connection.query("select period, price, volume from orders where period = ? and type =  ?", [_period, "ASK"], function(err, rows, fields) {
                connection.release();
                if (err) {
                    reject(err);
                } else {
                    resolve(JSON.stringify(rows));
                }
            });
        }, function(err) {
            reject(err);
        });
    });
}

function getReserveBidOrders(_period) {
    if (_.isUndefined(_period)) {
        _period = chainUtil.getCurrentPeriod();
    }

    return new Promise(function(resolve, reject) {
        getConnection().then(function(connection) {
            connection.query("select price,volume from reserveOrders where period = ? and type =  ?", [_period, "BID"], function(err, rows, fields) {
                connection.release();
                if (err) {
                    reject(err);
                } else {
                    resolve(JSON.stringify(rows));
                }
            });
        });
    })
}

function insertMatchingPrices(_post) {
    return new Promise(function(resolve, reject) {
        if (!_post) {
            return reject(new Error('missing post data'));
        }

        getConnection().then(function(connection) {
            connection.query('insert ignore into matchingPrices set ?', _post, function(err, rows, fields) {
                connection.release();
                if (err) {
                    reject(err);
                } else {
                    resolve(JSON.stringify(rows));
                }
            });
        }, function(err) {
            reject(err);
        })
    })
}

function insertUser(_post) {
    return new Promise(function(resolve, reject) {
        if (!_post) {
            return reject(new Error('missing post data'));
        }

        getConnection().then(function(connection) {
            connection.query('insert ignore into users set ?', _post, function(err, rows, fields) {
                connection.release();
                if (err) {
                    reject(err);
                } else {
                    resolve(JSON.stringify(rows));
                }
            });
        }, function(err) {
            reject(err);
        })
    })
}


function getReserveAskOrders(_period) {
    if (_.isUndefined(_period)) {
        _period = chainUtil.getCurrentPeriod();
    }

    return new Promise(function(resolve, reject) {
        getConnection().then(function(connection) {
            connection.query("select price,volume from reserveOrders where period = ? and type =  ?", [_period, "ASK"], function(err, rows, fields) {
                connection.release();
                if (err) {
                    reject(err);
                } else {
                    resolve(JSON.stringify(rows));
                }
            });
        });
    })
}

function insertOrder(_reserve, _post) {
    return new Promise(function(resolve, reject) {
        if (_.isUndefined(_reserve)) {
            return reject(new Error('missing reserve data'));
        }
        if (!_post) {
            return reject(new Error('missing post data'));
        }

        let table = 'orders';
        if (_reserve) {
            table = 'reserveOrders';
        }

        getConnection().then(function(connection) {
            connection.query('insert ignore into ' + table + ' set ?', _post, function(err, rows, fields) {
                connection.release();
                if (err) {
                    reject(err);
                } else {
                    resolve(JSON.stringify(rows));
                }
            });
        }, function(err) {
            reject(err);
        });
    });
}

function getReserveAskPrice(_period) {
    if (_.isUndefined(_period)) {
        _period = chainUtil.getCurrentPeriod();
    }
    return new Promise(function(resolve, reject) {
        getConnection().then(function(connection) {
            connection.query("select price from reservePrices where period = ? and type =  ?", [_period, "ASK"], function(err, rows, fields) {
                connection.release();
                if (err) {
                    reject(err);
                } else {
                    resolve(JSON.stringify(rows));
                }
            })
        })
    })
}

function getReserveBidPrice(_period) {
    if (_.isUndefined(_period)) {
        _period = chainUtil.getCurrentPeriod();
    }

    return new Promise(function(resolve, reject) {
        getConnection().then(function(connection) {
            connection.query("select price from reservePrices where period = ? and type =  ?", [_period, "BID"], function(err, rows, fields) {
                connection.release();
                if (err) {
                    reject(err);
                } else {
                    resolve(JSON.stringify(rows));
                }
            });
        });
    })
}

function insertReservePrice(_post) {
    if (!_post) {
        return reject(new Error('missing post data'));
    }

    return new Promise(function(resolve, reject) {
        getConnection().then(function(connection) {
            connection.query('insert ignore into reservePrices set ?', _post, function(err, rows, fields) {
                connection.release();
                if (err) {
                    reject(err);
                } else {
                    resolve(JSON.stringify(rows));
                }
            });
        });
    })
}

function hasUserOrderInPeriod(_addr, _period, _reserve, _type) {
    return new Promise(function(resolve, reject) {
        if (!_addr) {
            return reject(new Error('missing addr'));
        }
        if (_.isUndefined(_period)) {
            return reject(new Error('missing period'));
        }
        if (_.isUndefined(_reserve)) {
            return reject(new Error('missing reserve'));
        }
        if (!_type || !(_type === 'BID' || _type === 'ASK')) {
            throw new Error("Type must be either ASK or BID")
        }

        let table = 'orders';
        if (_reserve) {
            table = 'reserveOrders';
        }

        getConnection().then(function(connection) {
            connection.query('select orderID from ' + table + ' where account = ? and type =  ?', [_addr, _type], function(err, rows, fields) {
                connection.release();
                if (err) {
                    reject(err);
                } else {
                    resolve(rows && rows.length === 1 ? rows[0] : null);
                }
            });
        }, function(err) {
            reject(err);
        });
    });
}

module.exports = {
    getAllMatchingPrices: getAllMatchingPrices,
    getMatchingPrice: getMatchingPrice,
    getBidOrders: getBidOrders,
    getAskOrders: getAskOrders,
    insertMatchingPrices: insertMatchingPrices,
    insertOrder: insertOrder,
    hasUserOrderInPeriod: hasUserOrderInPeriod,
    getReserveBidPrice: getReserveBidPrice,
    getReserveAskPrice: getReserveAskPrice,
    insertReservePrice: insertReservePrice,
    getReserveBidOrders: getReserveBidOrders,
    getReserveAskOrders: getReserveAskOrders,
    getAllReserveAskPrices: getAllReserveAskPrices,
    getAllReserveBidPrices: getAllReserveBidPrices,
    insertUser: insertUser,
    getAllConsumers: getAllConsumers,
    getAllProducers: getAllProducers,
    getAllReserveConsumers: getAllReserveConsumers,
    getAllReserveProducers: getAllReserveProducers,
}
