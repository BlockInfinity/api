const web3 = require("./chainConnector.js");
const eth = web3.eth;
const etherex = web3.exchangeContract;
const chainUtil = require("./chainUtil.js");
const io = GLOBAL.io;

// inserts the matching price into the database when the state changes to 1
var StateChangeEvent = etherex.StateChangedEvent();
StateChangeEvent.watch(function(err, res) {
    if (!err) {
        state = res.args._state.toNumber();
        if (state === 1) {
            let matchingPrice = etherex.getMatchingPrice(chainUtil.getCurrPeriod()).toNumber();
            let post = { period: chainUtil.getCurrPeriod(), price: matchingPrice };
            let query = connection.query('insert ignore into matchingPrices set ?', post, function(err, res) {
                if (err) {
                    console.log("MySql error:", err);
                }
            });
        }
    }
});

// as soon as order gets submitted, it is saved in the database
var OrderEvent = etherex.OrderEvent();
OrderEvent.watch(function(err, res) {
    if (!err) {
        let _price = res.args._price.toNumber();
        let _volume = res.args._volume.toNumber();
        let _period = chainUtil.getCurrPeriod();
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

function sleep(time, callback) {
    var stop = new Date().getTime();
    while (new Date().getTime() < stop + time) {;
    }
    callback();
}

function getAndSaveMatchingPriceHistory() {
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





// catch blockcreation events and broadcast them to all clients
let filter = eth.filter('latest');
filter.watch(function(err, res) {
    if (typeof res != "undefined") {
        let startBlock = etherex.getStartBlock().toNumber();
        let minedBlocks = eth.blockNumber - startBlock;
        let toSend = { MinedBlocksInCurrPeriod: minedBlocks }
        io.emit('blockCreationEvent', JSON.stringify(toSend));
    }
});

// catch order  events and broadcast them to all clients
var OrderEvent = etherex.OrderEvent();
OrderEvent.watch(function(err, res) {
    if (typeof res != "undefined") {
        let _price = res.args._price.toNumber();
        let _volume = res.args._volume.toNumber();
        let _period = currPeriod;
        let _type = hex2a(res.args._type);
        let toSend = { "period": _period, "type": _type, "price": _price, "volume": _volume }
        io.emit('orderEvent', JSON.stringify(toSend));
    }
});

// catch matching events and new period events and broadcast them to all clients
var StateChangeEvent = etherex.StateChangedEvent();
StateChangeEvent.watch(function(err, res) {
    if (!err) {
        if (typeof res != "undefined") {

            state = res.args._state.toNumber();
        }
        if (state == 1) {

            let matchingPrice = etherex.getMatchingPrice(currPeriod).toNumber();

            let post = { period: currPeriod, price: matchingPrice };
            io.emit('matchingEvent', JSON.stringify(post));

        } else {
            currPeriod = etherex.getCurrPeriod().toNumber();
            let post = { period: currPeriod };
            io.emit('newPeriodEvent', JSON.stringify(post));
        }
    }
});
