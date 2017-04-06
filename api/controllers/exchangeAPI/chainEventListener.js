const web3 = require("./chainConnector.js");
const chainApi = require("./chainApi.js");
const eth = web3.eth;
const etherex = web3.exchangeContract;
const co = require('co');
const chainUtil = require("./chainUtil.js");
const io = global.io;
const _ = require("lodash");
const db = require('../db');
const chainEndSettler = require('./chainEndSettler');

global.currentState = getCurrentState();

global.currentPeriod = getCurrentPeriod();

function getCurrentState() {
    return etherex.getCurrState().toNumber();
}

function getCurrentPeriod() {
    return etherex.getCurrPeriod().toNumber();
}

// catch blockcreation events and broadcast them to all clients
let filter = eth.filter('latest');
filter.watch(function(err, res) {
    if (!_.isUndefined(res)) {
        chainApi.updateState();
        let startBlock = etherex.getStartBlock().toNumber();
        let minedBlocks = eth.blockNumber - startBlock;
        let toSend = { MinedBlocksInCurrPeriod: minedBlocks }
        io.emit('blockCreationEvent', JSON.stringify(toSend));
    }
});

// setInterval(chainApi.updateState,12000);

// inserts the matching price into the database when the state changes to 1
var StateChangeEvent = etherex.StateChangedEvent();
StateChangeEvent.watch(function(err, res) {
    return co(function*() {
        if (!err) {
            if (!_.isUndefined(res)) {
                state = res.args._state.toNumber();
            }
            if (state === 1) {
                global.currentState = 1;
                let matchingPrice = etherex.getMatchingPrice(global.currentPeriod).toNumber();
                let post = { period: global.currentPeriod, price: matchingPrice };

                try {
                    yield db.insertMatchingPrices(post);
                } catch (e) {
                    console.log(e);
                }

                // socket io
                io.emit('matchingEvent', JSON.stringify(post));
            } else {
                global.currentState = 0;
                global.currentPeriod++;
                
                let _period = global.currentPeriod;
                let post = { period: _period };
                // socket io
                io.emit('newPeriodEvent', JSON.stringify(post));
                chainEndSettler.settleAll(_period - 1);
            }
        }
    });
});

// insert the reserveprice into the database when reservepriceevent comes in
var ReservePriceEvent = etherex.reservePriceEvent();
ReservePriceEvent.watch(function(err, res) {
    return co(function*() {
        if (!err) {
            let _price = res.args._price.toNumber();
            let _type = hex2a(res.args._type);
            let post = { period: global.currentPeriod, price: _price, type: _type };
            try {
                yield db.insertReservePrice(post);
            } catch (e) {
                console.log(e);
            }

            // socket io
            io.emit('reservePriceEvent', JSON.stringify(post));
        }
    });
});

// insert the reserveprice into the database when reservepriceevent comes in
var EndSettleEvent = etherex.EndSettleEvent();
EndSettleEvent.watch(function(err, res) {
    console.log("EndSettleEvent")
    return co(function*() {
        if (!err) {
            let _period = res.args._period.toNumber();

            let post = { period: _period };

            console.log("EndSettleEvent", post);
            // socket io
            io.emit('EndSettleEvent', JSON.stringify(post));
        }
    });
});

// insert the reserveprice into the database when reservepriceevent comes in
var SettleEvent = etherex.SettleEvent();
SettleEvent.watch(function(err, res) {
    console.log("SettleEvent");
    return co(function*() {
        if (!err) {
            let _type = res.args._type.toNumber();
            let _usedVolume = res.args._usedVolume.toNumber();
            let _orderedVolume = res.args._orderedVolume.toNumber();
            let _user = res.args._user;

            if (_type === 1) {
                _type = "producer";
            } else {
                _type = "consumer";
            }

            let post = { type: _type, period: global.currentPeriod, usedVolume: _usedVolume, orderedVolume: _orderedVolume, user: _user };

            console.log("SettleEvent", post);

            // socket io
            io.emit('SettleEvent', JSON.stringify(post));
        }
    });
});

// as soon as order gets submitted, it is saved in the database
var OrderEvent = etherex.OrderEvent();
OrderEvent.watch(function(err, res) {
    return co(function*() {
        if (!err) {
            let _price = res.args._price.toNumber();
            let _volume = res.args._volume.toNumber();
            let _period = global.currentPeriod;
            let _type = hex2a(res.args._type);
            let post = { period: _period, price: _price, volume: _volume, type: _type };
            // socket io
            io.emit('orderEvent', JSON.stringify(post));
        }
    });
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
