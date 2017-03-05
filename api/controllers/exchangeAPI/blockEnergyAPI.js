const co = require("co");
const web3 = require("./chainConnector.js");
const rpc = require('node-json-rpc');

const eth = web3.eth;
var etherex = web3.exchangeContract;


var options = {
    port: 8545,
    host: 'localhost'

};

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
    } catch (err) {
        console.log("something happaned");
    }
}

// todo (mg): register funktion nimmt "_type" (enum: buyer,seller) entgegen und erstellt einen ethereum account.
// zurückgegeben wird eine certID und die public address des erstellten ethereum accounts
// CertID: wird benötigt für buy / sell
// Public address: account dient als Prepaid Konto. 

function init_account(_user_password) {

    var call_function = function(_user_password) {
	return  client.call({ "jsonrpc": "2.0", "method": "personal_newAccount", "params": [_user_password], "id": 74 }, function(err, jsonObj) {
            if (err || !jsonObj.result) {
                throw new Error("Couldn't create an user account!");
            } else {
                console.log("in one", jsonObj.result);
                return String(jsonObj.result);
            }
        }); 
    }
    
    var adr =  co(function*() {
       var address =  call_function(_user_password);
       var tad = typeof address;
       console.log(" type of addr", tad);
      });

       var check_address = eth.accounts[eth.accounts.length - 1];

//    console.log( "returned address - " + address);  
       console.log( "returned check_address - " + check_address);

       return check_address;
       //}).catch(function(error) {
        //   throw error;
       //});

   var fff = typeof adr;
   console.log( " type of adr ", fff);

  return adr;
}

function register(_user_password, _type) {
    var user_address = init_account(_user_password);
    //Unlocking the certAuth account
    web3.personal.unlockAccount(eth.accounts[0], "amalien", 1000);

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
            throw new Error("Invalid user type: " + _type);
    }
}

// todo (mg) Statt _addr muss CertID mitgegeben werden. Vom CertID muss auf die Adresse geschlossen werden.
function buy(_volume, _price, _addr, _password) {

    //Unlocking the account
    web3.personal.unlockAccount(_addr, _password, 1000);

    let tx = etherex.submitBid(_volume, _price, { from: _addr, gas: 20000000 });
    eth.awaitConsensus(tx, 20000000);
}

// todo (mg) Statt _addr muss CertID mitgegeben werden. Vom CertID muss auf die Adresse geschlossen werden.
function sell(_volume, _price, _addr, _password) {

    //Unlocking the account
    web3.personal.unlockAccount(_addr, _password, 1000);

    let tx = etherex.submitAsk(_volume, _price, { from: _addr, gas: 20000000 });
    eth.awaitConsensus(tx, 20000000);
}

// todo (mg) statt periode soll Zeit rein kommen und von zeit soll auf die periode geschlossen werden können
// statt _addr muss es eine entsprechende certID geben, was nur die enbw als Daten-Einspeise-Entität bekommt
function settle(_type, _volume, _period, _addr) {

    //Unlocking the account
    web3.personal.unlockAccount(_addr, "amalien", 1000);

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
    return etherex.getMatchingPrice(_period);
}

function getState() {
    let state = etherex.getCurrState();
    let period = etherex.getCurrPeriod();
    return ([state, period]);
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

// ######################################################################
// ############################# Information Retrieval ##################
// ######################################################################

function getBalance(_addr) {
  console.log(_addr);
    return web3.fromWei(eth.getBalance(_addr));
    }


    /////////////////////////////////////////////////////////////////////////// end of debugging


