const web3 = require("./chainConnector.js");
const eth = web3.eth;
const etherex = web3.exchangeContract;

function getCurrentPeriod() {
    return etherex.getCurrPeriod().toNumber();
}

function getCurrentState() {
    return etherex.getCurrState().toNumber();
}

function setCurrentPeriod() {
    return etherex.getCurrPeriod().toNumber();
}

function setCurrentState() {
    return etherex.getCurrState().toNumber();
}

function getBalance(_addr) {
    if (!_addr) {
        throw new Error("Address must be provided")
    }
    return web3.fromWei(eth.getBalance(_addr), 'ether');
}

module.exports = {
    getCurrentPeriod: getCurrentPeriod,
    getCurrentState: getCurrentState,
    getBalance: getBalance
}
