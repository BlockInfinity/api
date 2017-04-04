const co = require("co");
const web3 = require("./chainConnector.js");
const rpc = require('node-json-rpc');
const chainUtil = require("./chainUtil.js");
const db = require('../db');
const _ = require("lodash");
const eth = web3.eth;
const etherex = web3.exchangeContract;

var options = {
    port: 8545,
    host: 'localhost'
};

var client = new rpc.Client(options);

if (!etherex) {
    console.log("Exchange contract is not defined");
} else {
    console.log("Exchange contract with address", etherex.address, "loaded!");
}



// ######################################################################
// ######################## tracking out of gas errors ##################
// ######################################################################

Object.getPrototypeOf(web3.eth).getTransactionReceiptAsync = function(txhash) {
    return new Promise(function(resolve, reject) {
        let receipt = eth.getTransactionReceipt(txhash);
        resolve(receipt);
    });
}

Object.getPrototypeOf(web3.eth).awaitConsensus = function(txhash, gasSent) {

    let filter = eth.filter('latest');

    filter.watch(function(err, res) {
        eth.getTransactionReceiptAsync(txhash).then(function(receipt) {
            if (receipt && receipt.transactionHash === txhash) {
                filter.stopWatching();
                // note corner case of gasUsed == gasSent.  It could
                // mean used EXACTLY that amount of gas and succeeded.
                // this is a limitation of ethereum.  Hopefully they fix it
                if (receipt.gasUsed >= gasSent) {
                    console.log("ran out of gas, transaction likely failed!");
                }
            }
        });
    });
}

// ######################################################################
// ######################## functions that change the state #############
// ######################################################################


function register(_user_password, _type) {
    return new Promise(function(resolve, reject) {
        if (!_type || !(_type === 'consumer' || _type === 'producer' || _type === 'reserveproducer' || _type === 'reserveconsumer')) {
            return reject('invalid arguments');
        }
        console.log(2);

        client.call({ "jsonrpc": "2.0", "method": "personal_newAccount", "params": [_user_password], "id": 74 },
            function(err, jsonObj) {
                if (err || !jsonObj.result) {
                    console.log("Couldn't create an user account!");
                    reject(err);
                } else {

                    console.log(3);
                    console.log(4,_type);
                    var user_address = String(jsonObj.result);

                    var again = true;
                    while (again) {
                        try {
                            // insert order into bchain
                            etherex.registerCertificateAuthority(eth.accounts[0], { from: eth.accounts[0], gas: 20000000 });
                            again = false;
                        } catch (err) {
                            console.log("accounts gets unlocked");
                            web3.personal.unlockAccount(eth.accounts[0], "amalien", 2000000);
                        }
                    }

                    switch (_type) {
                        case "consumer":
                            var tx = etherex.registerConsumer(user_address, { from: eth.accounts[0], gas: 20000000 });
                            eth.awaitConsensus(tx, 800000);
                            break;
                        case "producer":
                            var tx = etherex.registerProducer(user_address, { from: eth.accounts[0], gas: 20000000 });
                            eth.awaitConsensus(tx, 800000);
                            break;
                        case "reserveconsumer":
                            var tx = etherex.registerConsumer(user_address, { from: eth.accounts[0], gas: 20000000 });
                            eth.awaitConsensus(tx, 800000);
                            break;
                        case "reserveproducer":
                            var tx = etherex.registerProducer(user_address, { from: eth.accounts[0], gas: 20000000 });
                            eth.awaitConsensus(tx, 800000);
                            break;
                        default:
                            return reject(new Error("Invalid user type: " + _type));
                    }

                    db.insertUser({ address: user_address, type: _type });

                    // transfer some money to the newly created account
                    try {
                        let balance = web3.fromWei(eth.getBalance(eth.accounts[0])).toNumber();

                        if (balance < 11) {
                            throw new Error();
                        }

                        eth.sendTransaction({ from: eth.accounts[0], to: user_address, value: "10000000000000000000", gas: 20000000 });
                        return resolve(user_address);
                    } catch (err) {
                        return reject(new Error("Not enough money in master account! Couldn't transfer eth!"));
                    }
                }
            });
    })
}

function buy(_volume, _price, _addr, _password, _reserve) {
    return co(function*() {
        if (!_addr) {
            throw new Error("User address must be provided")
        }
        if (!_volume || _volume <= 0) {
            throw new Error("Volume must be provided and greater than 0")
        }
        if (_.isUndefined(_price)) {
            throw new Error("Price must be provided")
        }
        if (!_password) {
            throw new Error("Password must be provided")
        }
        if (_.isUndefined(_reserve)) {
            throw new Error("Reserve must be provided")
        }
        // check user has no order in current period
        // if (etherex.hasUserBidOrderInPeriod(_addr)) {
        //     throw new Error("User already submitted buy order in current period")
        // }
        let hasUserBidOrderInPeriod = yield db.hasUserOrderInPeriod(_addr, chainUtil.getCurrentPeriod(), _reserve, 'BID');
        if (hasUserBidOrderInPeriod) {
            throw new Error("User already submitted bid order in current period")
        }


        // insert order into db
        yield db.insertOrder(_reserve, { period: chainUtil.getCurrentPeriod(), price: _price, volume: _volume, type: 'BID' });
        var again = true;
        let tx;
        while (again) {
            try {
                // insert order into bchain
                tx = etherex.submitBid(_price, _volume, { from: _addr, gas: 2000000 });
                again = false;
            } catch (err) {
                console.log("accounts gets unlocked");
                web3.personal.unlockAccount(_addr, _password, 2000000);
            }
        }
        eth.awaitConsensus(tx, 20000000);
    })
}

function sell(_volume, _price, _addr, _password, _reserve) {
    return co(function*() {
        if (!_addr) {
            throw new Error("User address must be provided")
        }
        if (!_volume || _volume <= 0) {
            throw new Error("Volume must be provided and greater than 0")
        }
        if (_.isUndefined(_price)) {
            throw new Error("Price must be provided")
        }
        if (!_password) {
            throw new Error("Password must be provided")
        }
        if (_.isUndefined(_reserve)) {
            throw new Error("Reserve must be provided")
        }

        // check user has no order in current period
        // if (etherex.hasUserAskOrderInPeriod(_addr)) {
        //     throw new Error("User already submitted sell order in current period")
        // }
        let hasUserAskOrderInPeriod = yield db.hasUserOrderInPeriod(_addr, chainUtil.getCurrentPeriod(), _reserve, 'ASK');
        if (hasUserAskOrderInPeriod) {
            throw new Error("User already submitted sell order in current period")
        }

        // insert order into db
        yield db.insertOrder(_reserve, { period: chainUtil.getCurrentPeriod(), price: _price, volume: _volume, type: 'ASK' });

        var again = true;
        let tx;
        while (again) {
            try {
                // insert order into bchain
                tx = etherex.submitAsk(_price, _volume, { from: _addr, gas: 2000000 });
                again = false;
            } catch (err) {
                console.log("accounts gets unlocked");
                web3.personal.unlockAccount(_addr, _password, 2000000);
            }
        }
        eth.awaitConsensus(tx, 20000000);
    });
}

// todo (mg) statt periode soll Zeit rein kommen und von zeit soll auf die periode geschlossen werden können
// statt _addr muss es eine entsprechende certID geben, was nur die enbw als Daten-Einspeise-Entität bekommt


// settle("consumer", 40, 41, "0xf15dd7a0b509a69338bb09057d8b418dd7507b1e");
global.j = 0;

function settle(_type, _volume, _period, _addr) {
    if (!_type || !(_type === 'consumer' || _type === 'producer')) {
        throw new Error("Type must be either consumer or provider")
    }

    if (_period < 0) {
        throw new Error("Period must be greater or equal to 0")
    }
    if (!_addr) {
        throw new Error("User address must be provided")
    }


    let tx;
    let type;
    if (_type === 'consumer') {
        type = 2;
    } else {
        type = 1;
    }

    var again = true;
    while (again) {
        try {
            // insert order into bchain
            tx = etherex.settle(type, _volume, _period, _addr, { from: eth.accounts[0], gas: 20000000 });
            again = false;
        } catch (err) {
            console.log(err);
            web3.personal.unlockAccount(eth.accounts[0], "amalien", 2000000);
        }
    }
    eth.awaitConsensus(tx, 20000000);

    console.log(global.j++, "mal gesettled");
}

// ######################################################################
// ######################## Getters #####################################
// ######################################################################

function getMatchingPrice(_period) {
    if (_.isUndefined(_period)) {
        throw new Error("Period must be provided")
    }
    let res = etherex.getMatchingPrice(_period).toNumber();
    return res;
}

function getAskReservePrice(_period) {
    if (!_period) {
        throw new Error("Period must be provided")
    }
    return etherex.getAskReservePrice(_period);
}

function getBidReservePrice(_period) {
    if (!_period) {
        throw new Error("Period must be provided")
    }
    return etherex.getBidReservePrice(_period);
}

function getMatchedAskOrders(_period) {
    if (!_period) {
        throw new Error("Period must be provided")
    }
    //return etherex.getMatchedAskOrders(_period);
    return [];
}

function getMatchedBidOrders(_period) {
    if (!_period) {
        throw new Error("Period must be provided")
    }
    //return etherex.getMatchedBidOrders(_period);
    return [];
}

function getMatchedAskOrdersForUser(_period, _addr) {
    if (!_period) {
        throw new Error("Period must be provided")
    }
    if (_addr) {
        throw new Error("User address must be provided")
    }
    return etherex.getMatchedAskOrdersForUser(_period, _addr);
}

function getMatchedAskOrdersForUser(_period, _addr) {
    if (!_period) {
        throw new Error("Period must be provided")
    }
    if (_addr) {
        throw new Error("User address must be provided")
    }
    return etherex.getMatchedAskOrdersForUser(_period, _addr);
}



// ######################################################################
// ########################Automatic Mining #############################
// ######################################################################

function autoMine() {
    eth.filter("latest", function(err, block) { checkWork(); });
    eth.filter("pending", function(err, block) { checkWork(); });
}

function checkWork() {
    if (eth.getBlock("pending").transactions.length > 0) {
        if (eth.mining) return;
        console.log("== Pending transactions! Mining...");
        startMining();
    } else {
        stopMining();
        console.log("== No transactions! Mining stopped.");
    }
}

function startMining() {
    client.call({ "jsonrpc": "2.0", "method": "miner_start", "params": [], "id": 74 }, function(err, res) {
        if (err) {
            console.log(err);
        }
        console.log(res);
    });
}

function stopMining() {
    client.call({ "jsonrpc": "2.0", "method": "miner_stop", "params": [], "id": 74 }, function(err, res) {
        if (err) {
            console.log(err);
        }
        console.log(res);
    });
}

function updateState() {

    var again = true;
    while (again) {
        try {
            // insert order into bchain
            etherex.testUpdateState({ from: eth.accounts[0], gas: 8000000 });
            again = false;
        } catch (err) {
            console.log("accounts gets unlocked");
            web3.personal.unlockAccount(eth.accounts[0], "amalien", 2000000);
        }
    }
}

function isMatchedForBidReserve(_user, _period) {
    return etherex.isMatchedForBidReserve(_user, _period);
}

function isMatchedForAskReserve(_user, _period) {
    return etherex.isMatchedForAskReserve(_user, _period);
}

module.exports = {
    register: register,
    buy: buy,
    sell: sell,
    getMatchingPrice: getMatchingPrice,
    autoMine: autoMine,
    updateState: updateState,
    settle: settle,
    isMatchedForBidReserve: isMatchedForBidReserve,
    isMatchedForAskReserve: isMatchedForAskReserve
}
