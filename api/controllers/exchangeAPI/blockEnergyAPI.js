const co = require("co");
const web3 = require("./chainConnector.js");
const rpc = require('node-json-rpc');

const eth = web3.eth;
var etherex = web3.exchangeContract;

var options = {
    port: 8545,
    host: 'localhost'
};

const END_SETTLE_CHECK_IN_SECONDS = 10;

var client = new rpc.Client(options);

module.exports = {
    buy: buy,
    sell: sell,
    register: register,
    init: init,
    autoMine: autoMine,
    getBalance: getBalance,
    getAskOrders: getAskOrders,
    getBidOrders: getBidOrders,
    getMatchingPrice: getMatchingPrice,
    getState: getState
}

if (!etherex) {
    console.log("Exchange contract is not defined");
} else {
    console.log("Exchange contract with address", etherex.address, "loaded!");
}

//  establish rpc connection to test chain

/*
Annahmen zur Vereinfachung:
- eth.accounts[0] ist certificate authority
- certificateID ist einfach die Adresse der user
- settle funktion wird auch einfach durch angaben der user address aufgerufen
*/

// todo (mg) falls contract neu deployed, wird mit init der erste account als certificate authority registriert. 
// Zukünftig muss das direkt im Konstruktor aufgerufen werden
// todo (mg) auch enbw muss ich als entität registriert werden, der es einzigst gestattet ist die settle funktoin aufzurufen
function init() {
    try {
        web3.personal.unlockAccount(eth.accounts[0], "amalien", 1000);
        etherex.registerCertificateAuthority(eth.accounts[0], { from: eth.accounts[0] });

        // checks every n seconds if a not yet settled period can
        // end settled because all users with orders in that period
        // have called the settle method
        setInterval(function() {
            var currentPeriod = etherex.getCurrPeriod();
            for (var p=0; p<currentPeriod; p++) {
                if (etherex.haveAllUsersSettled(p) && !etherex.isPeriodSettled(p)) {
                    etherex.endSettle(p);
                }
            }
        }, END_SETTLE_CHECK_IN_SECONDS * 1000);

    } catch (err) {
        console.log("something happaned");
    }

    // web3.personal.unlockAccount(_addr, "amalien", 1000);
}

// todo (mg): register funktion nimmt "_type" (enum: buyer,seller) entgegen und erstellt einen ethereum account.
// zurückgegeben wird eine certID und die public address des erstellten ethereum accounts
// CertID: wird benötigt für buy / sell
// Public address: account dient als Prepaid Konto. 
function register(_user_password, _type) {
    return new Promise(function (resolve, reject) {
        if (!_type || !(_type === 'consumer' || _type === 'producer')) {
            return reject('invalid arguments');
        }

        client.call({ "jsonrpc": "2.0", "method": "personal_newAccount", "params": [_user_password], "id": 74 }, function(err, jsonObj) {
            if (err || !jsonObj.result) {
                console.log("Couldn't create an user account!");
                reject(err);
            } else {
                console.log("in one", jsonObj.result);

                var user_address = String(jsonObj.result);

                web3.personal.unlockAccount(eth.accounts[0], "amalien", 1000);
                etherex.registerCertificateAuthority(eth.accounts[0], { from: eth.accounts[0], gas: 20000000 });
                switch (_type) {
                    case "consumer":
                        var tx = etherex.registerConsumer(user_address, { from: eth.accounts[0], gas: 20000000 });
                        eth.awaitConsensus(tx, 800000);
                        break;
                    case "producer":
                        var tx = etherex.registerProducer(user_address, { from: eth.accounts[0], gas: 20000000 });
                        eth.awaitConsensus(tx, 800000);
                        break;
                    default:
                        return reject(new Error("Invalid user type: " + _type));

                    try {
                        //  if (Number(getBalance(eth.accounts[0])) < 11 ) {
                        //      console.log(" lol" );
                        //      throw new Error();
                        //  }
                         console.log(" creating transaction" );
                         eth.sendTransaction({from: eth.accounts[0], to: user_address, value: "10000000000000000000", gas:20000000});
                         return resolve(user_address);
                    } catch (err) {
                        return reject(new Error("Not enough money in master account! Couldn't transfer eth!"));
                    }
                   
                }
            }
        }); 
    })
}

// todo (mg) Statt _addr muss CertID mitgegeben werden. Vom CertID muss auf die Adresse geschlossen werden.
function buy(_volume, _price, _addr, _password) {
    // check user has no order in current period
    if (etherex.hasUserBidOrderInPeriod(_addr)) {
        throw new Error("User already submitted buy order in current period")
    }
    if (!_volume || volume <= 0) {
        throw new Error("Volume must be provided and greater than 0")
    }
    if (_price === undefined) {
        throw new Error("Price must be provided")
    }
    if (!_addr) {
        throw new Error("User address must be provided")
    }
    if (!_password) {
        throw new Error("Password must be provided")
    }

    //Unlocking the account
    web3.personal.unlockAccount(_addr, _password, 1000);

    let tx = etherex.submitBid(_volume, _price, { from: _addr, gas: 20000000 });
    eth.awaitConsensus(tx, 20000000);
}

// todo (mg) Statt _addr muss CertID mitgegeben werden. Vom CertID muss auf die Adresse geschlossen werden.
function sell(_volume, _price, _addr, _password) {
    // check user has no order in current period
    if (etherex.hasUserAskOrderInPeriod(_addr)) {
        throw new Error("User already submitted sell order in current period")
    }
    if (!_volume || volume <= 0) {
        throw new Error("Volume must be provided and greater than 0")
    }
    if (_price === undefined) {
        throw new Error("Price must be provided")
    }
    if (!_addr) {
        throw new Error("User address must be provided")
    }
    if (!_password) {
        throw new Error("Password must be provided")
    }

    //Unlocking the account
    web3.personal.unlockAccount(_addr, _password, 1000);

    let tx = etherex.submitAsk(_volume, _price, { from: _addr, gas: 20000000 });
    eth.awaitConsensus(tx, 20000000);
}

// todo (mg) statt periode soll Zeit rein kommen und von zeit soll auf die periode geschlossen werden können
// statt _addr muss es eine entsprechende certID geben, was nur die enbw als Daten-Einspeise-Entität bekommt
function settle(_type, _volume, _period, _addr, _password) {
    // check user has not already settled in period
    if (etherex.hasUserAlreadySettledInPeriod(_addr, _period)) {
        throw new Error("User has already settled in period " + _period)
    }
    if (!_type || !(_type === 'consumer' || _type === 'producer')) {
        throw new Error("Type must be either consumer or provider")
    }
    if (!_volume || volume <= 0) {
        throw new Error("Volume must be provided and greater than 0")
    }
    if (_period < 0) {
        throw new Error("Period must be greater or equal to 0")
    }
    if (!_addr) {
        throw new Error("User address must be provided")
    }
    if (!_password) {
        throw new Error("Password must be provided")
    }

    //Unlocking the account
    web3.personal.unlockAccount(_addr, _password, 1000);

    let tx = etherex.settle(_type, _volume, _period, { from: _addr, gas: 20000000 });
    eth.awaitConsensus(tx, 800000);
}

function getBidOrders() {
    return etherex.getBidOrders();
}

function getAskOrders() {
    return etherex.getAskOrders();
}

function getMatchingPrice(_period) {
    if (!_period) {
        throw new Error("Period must be provided")
    }
    return etherex.getMatchingPrice(_period);
}

function getState() {
    let state = etherex.getCurrState();
    let period = etherex.getCurrPeriod();
    return ([state, period]);
}

function getBalance(_addr) {
    if (!_addr) {
        throw new Error("User address must be provided")
    }
    return web3.fromWei(eth.getBalance(_addr), 'ether');
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

/////////////////////////////////////////////////////////////////////////// for debugging


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
            if (receipt && receipt.transactionHash == txhash) {
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
