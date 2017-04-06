const web3 = require("./chainConnector.js");
const eth = web3.eth;
const etherex = web3.exchangeContract;
const chainUtil = require("./chainUtil.js");
const chainApi = require("./chainApi.js");
const co = require('co');
const db = require('../db');
const _ = require("lodash");

module.exports = {
    settleAll: settleAll,
}

var consumers;
var producers;
var resereveProducers;
var reserveConsumers;

// loadUsers();

// function loadUsers() {

//     return co(function*() {

//         consumers = yield db.getAllConsumers();
//         producers = yield db.getAllProducers();
//         reserveConsumers = yield db.getAllReserveConsumers();
//         reserveProducers = yield db.getAllReserveProducers();

//         consumers = JSON.parse(consumers);
//         producers = JSON.parse(producers);
//         reserveConsumers = JSON.parse(reserveConsumers);
//         reserveProducers = JSON.parse(reserveProducers);

//     })


// }


// function settle(_type, _volume, _period, _addr) {
// settleAll(10);



// settleAll(4);
// reserve consumer settled wird nicht aufgerufen
function settleAll(_period) {
    global.j = 0;

    return co(function*() {

        consumers = yield db.getAllConsumers();
        producers = yield db.getAllProducers();
        reserveConsumers = yield db.getAllReserveConsumers();
        reserveProducers = yield db.getAllReserveProducers();

        consumers = JSON.parse(consumers);
        producers = JSON.parse(producers);
        reserveConsumers = JSON.parse(reserveConsumers);
        reserveProducers = JSON.parse(reserveProducers);


        console.log(consumers);

        var smVolume;
        var collateral;
        var bidReservePrice;
        var askReservePrice;

        var sumConsumed = 0;
        var sumProduced = 0;

        console.log("consumers.length", consumers.length)
        console.log("producers.length", producers.length)
        console.log("reserveConsumers.length", reserveConsumers.length)
        console.log("reserveProducers.length", reserveProducers.length)


        // settle for all consumers 
        for (var i = 0; i < consumers.length; i++) {
            smVolume = Math.round(Math.random() * 100);
            chainApi.settle("consumer", smVolume, _period, consumers[i].address);
            sumConsumed += smVolume;
        }



        // settle for all producers 
        for (var i = 0; i < producers.length; i++) {
            smVolume = Math.round(Math.random() * 100);
            chainApi.settle("producer", smVolume, _period, producers[i].address);
            sumProduced += smVolume;
        }

        // // one reserve order user regulates the lack or excess 

        console.log("CsumProduced", sumProduced);
        console.log("sumConsumed", sumConsumed);

        if (sumProduced != sumConsumed) {
            if (sumProduced > sumConsumed) {
                var diff = sumProduced - sumConsumed;
                for (var i = 0; i < reserveConsumers.length; i++) {
                    if (chainApi.isMatchedForBidReserve(reserveConsumers[i].address, _period)) {
                        chainApi.settle("consumer", diff, _period, reserveConsumers[i].address);
                        console.log("reserve consumer settled");
                        break;
                    }
                }
            } else {
                var diff = sumConsumed - sumProduced;
                for (var i = 0; i < reserveProducers.length; i++) {
                    if (chainApi.isMatchedForAskReserve(reserveProducers[i].address, _period)) {
                        chainApi.settle("producer", diff, _period, reserveProducers[i].address);
                        console.log("reserve Producer settled");
                        break;
                    }
                }
            }
        }
        // // überigen reserve Leute müssen settle aufrufen

        for (var i = 0; i < reserveProducers.length; i++) {
            chainApi.settle("producer", 0, _period, reserveProducers[i].address);
        }
        for (var i = 0; i < reserveConsumers.length; i++) {
            chainApi.settle("consumer", 0, _period, reserveConsumers[i].address);
        }


    })

}
