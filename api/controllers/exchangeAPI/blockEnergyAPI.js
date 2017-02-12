const web3 = require("./chainConnector.js");
const rpc = require('node-json-rpc');

const eth = web3.eth;
var etherex = web3.exchangeContract;


//  establish rpc connection to test chain
var options = {
    port: 8545,
    host: 'localhost'
};
var client = new rpc.Client(options);


/*
Annahmen zur Vereinfachung:
- eth.accounts[0] ist certificate authority
- certificateID ist einfach die Adresse der user
- settle funktion wird auch einfach durch angaben der user address aufgerufen
*/

//  falls contract neu deployed, wird mit init der erste account als certificate authority registriert
function init() {
    web3.personal.unlockAccount(eth.accounts[0],"amalien",1000);
    etherex.registerCertificateAuthority(eth.accounts[0],{from: eth.accounts[0]});
}


// for testing: smart meter address, seed and certId are not taken into consideration
function register(_userAddr, _type) {

    //Unlocking the certAuth account
    web3.personal.unlockAccount(eth.accounts[0], "amalien", 1000);

    switch (_type) {
        case "consumer":
            var tx = etherex.registerConsumer(_userAddr, { from: eth.accounts[0], gas: 400000 });
            eth.awaitConsensus(tx,800000);
            break;
        case "producer":
            var tx = etherex.registerProducer(_userAddr, { from: eth.accounts[0], gas: 400000 });
            eth.awaitConsensus(tx,800000);
            break;
        default:
            throw new IllegalArgumentException("Invalid user type: " + _type);
    }
}

function buy(_volume, _price, _addr) {

    //Unlocking the account
    web3.personal.unlockAccount(_addr, "amalien", 1000);

    let tx = etherex.submitBid(_volume, _price, { from: _addr, gas: 8000000 });
    eth.awaitConsensus(tx,800000);
}


function sell(_volume, _price, _addr) {

    //Unlocking the account
    web3.personal.unlockAccount(_addr, "amalien", 1000);

    let tx = etherex.submitAsk(_volume, _price,  { from: _addr, gas: 8000000 });
    eth.awaitConsensus(tx,800000);
}

function settle(_type, _volume, _period, _user) {

    //Unlocking the account
    // web3.personal.unlockAccount(_addr, "amalien", 1000);

    // let tx = etherex.settle(_type, _volume, _period, { from: _user, gas: 8000000 });
    // eth.awaitConsensus(tx,800000);
}


function getBidOrders() {
    return etherex.getBidOrders()
}

function getAskOrders() {
    return etherex.getAskOrders()
}

function getMatchingPrice(_period) {
    return etherex.getMatchingPrice(_period);
}

function getState(){
    let state = etherex.getCurrState();
    let period = etherex.getCurrPeriod();
    return([state, period]);
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

function getBalance() {
    for (var i in eth.accounts) {
        console.log("Balance of account ", i, ": ", web3.fromWei(eth.getBalance(eth.accounts[i]).toString()));
    }
}

/////////////////////////////////////////////////////////////////////////// end of debugging


module.exports = {
    buy: buy,
    sell: sell,
    register: register,
    init:init,
    autoMine:autoMine,
    getBalance:getBalance,
    getAskOrders:getAskOrders,
    getBidOrders:getBidOrders,
    getMatchingPrice:getMatchingPrice,
    getState:getState

}





// var fs = require('fs')
// var compiled = null;

// var contractAddress = '0x20366626351477455a192d6c802f760f9ef48e67';
// var accountAddress = 'someaccountaddress';
// var accountKey = 'someaccountkey'

// fs.readFile('../contracts/Etherex.sol', 'utf8', function (err,data) {
//     if (err) {
//         return console.log(err);
//     }

//     //If there is no contract ABI, compile the contract
//     if( fs.stat('./contract.abi') === undefined) {
//         source = data.replace('\n', '');
//         var compiled = web3.eth.compile.solidity(source);
//         console.log(compiled);
//         var abi = compiled.info.abiDefinition;
//         fs.writeFile('./contract.abi', JSON.stringify(abi), function(error){console.log(error)});
//     } else {
//         var abi = fs.readFile('./dex_api/contract.abi');
//     }
//     console.log('Compiled contract, got abi definition!');

//     contract = web3.eth.contract(abi).at(contractAddress);
//     console.log('Contract');
// });
