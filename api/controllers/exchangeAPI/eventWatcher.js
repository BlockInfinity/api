const web3 = require("./chainConnector.js");
const mysql = require("mysql");
const eth = web3.eth;
const etherex = web3.exchangeContract;

var currPeriod = etherex.getCurrPeriod().toNumber();
var state = etherex.getCurrState().toNumber();

var db_config = {
    host: "localhost",
    user: "dex",
    password: "amalien",
    database: "apidb",
    connectTimeout: 900000 // connect_timeout is set here and overwrites the configuration in my.cnf
};


// in order to avoid time out errors and establish a contionous connection

function handleDisconnect() {
    connection = mysql.createConnection(db_config); // Recreate the connection, since
    // the old one cannot be reused.

    connection.connect(function(err) { // The server is either down
        if (err) { // or restarting (takes a while sometimes).
            console.log('error when connecting to db:', err);
            setTimeout(handleDisconnect, 2000); // We introduce a delay before attempting to reconnect,
        } // to avoid a hot loop, and to allow our node script to
    }); // process asynchronous requests in the meantime.
    // If you're also serving http, display a 503 error.
    connection.on('error', function(err) {
        console.log('db error', err);
        if (err.code === 'PROTOCOL_CONNECTION_LOST') { // Connection to the MySQL server is usually
            handleDisconnect(); // lost due to either server restart, or a
        } else { // connnection idle timeout (the wait_timeout
            throw err; // server variable configures this)
        }
    });
}

handleDisconnect();

setInterval(function() {
    connection.query('SELECT 1');
}, 5000);

// inserts the matching price into the database when the state changes to 1
var StateChangeEvent = etherex.StateChangedEvent();
StateChangeEvent.watch(function(err, res) {
    if (!err) {
        state = res.args._state.toNumber();
        if (state == 1) {

            let matchingPrice = etherex.getMatchingPrice(currPeriod).toNumber();

            let post = { period: currPeriod, price: matchingPrice };
            let query = connection.query('insert ignore into matchingPrices set ?', post, function(err, res) {
                if (err) {
                    console.log("MySql error:", err);
                }
            });
        } else {
            currPeriod = etherex.getCurrPeriod().toNumber();
        }
    }
});

// as soon as order gets submitted, it is saved in the database
var OrderEvent = etherex.OrderEvent();
OrderEvent.watch(function(err, res) {
    if (!err) {
        let _price = res.args._price.toNumber();
        let _volume = res.args._volume.toNumber();
        let _period = etherex.getCurrPeriod().toNumber();
        let _type = hex2a(res.args._type);

        let post = { period: _period, price: _price, volume: _volume, type: _type };
        let query = connection.query('insert ignore into orders set ?', post, function(err, res) {
            if (err) {
                console.log("MySql error:", err);
            }
        });
    }
});

// helper function to convert solidity's bytes32 to string
function hex2a(hexx) {
    var hex = hexx.toString(); //force conversion
    var str = '';
    for (var i = 2; i < hex.length; i += 2) {
        if (parseInt(hex.substr(i, 2)) != 0) {
            str += String.fromCharCode(parseInt(hex.substr(i, 2), 16));
        }
    }
    return str;
}


//getAndSaveMatchingPriceHistory();

function sleep(time, callback) {
    var stop = new Date().getTime();
    while (new Date().getTime() < stop + time) {;
    }
    callback();
}

function getAndSaveMatchingPriceHistory() {

    let info = [];


    // let time = 45000;
    // console.log("going to sleep", time/1000);
    // sleep(time, function() {
    //     console.log("woke up");
    // })

    for (let i = 0; i < currPeriod; i++) {
        let res = etherex.getMatchingPrice(i).toNumber();
        let post = { period: i, price: res };
        let query = connection.query('insert ignore into matchingPrices set ?', post, function(err, res) {
            if (err) {
                console.log("MySql error:", err);
            }
        });
    }
}

function getPeriod() {
    return currPeriod;
}

function getState() {
    return state;
}

function getConn() {
    return connection;
}


module.exports = {
    getPeriod: getPeriod,
    getState: getState,
    getConn: getConn
}
