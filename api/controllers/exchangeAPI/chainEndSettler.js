const web3 = require("./chainConnector.js");
const eth = web3.eth;
const etherex = web3.exchangeContract;
const chainUtil = require("./chainUtil.js");

const END_SETTLE_CHECK_IN_SECONDS = 10;

function start() {
    try {
        // clear interval if one is currently active
        if (global.endSettlerInterval) {
            clearInterval(global.endSettlerInterval);
        }
        // checks every n seconds if a not yet settled period can
        // end settled because all users with orders in that period
        // have called the settle method
        global.endSettlerInterval = setInterval(function() {
            var again = true;
            while (again) {
                try {
                    var currentPeriod = chainUtil.getCurrentPeriod();
                    for (var p = 0; p < currentPeriod; p++) {
                        if (etherex.haveAllUsersSettled(p) && !etherex.isPeriodSettled(p)) {
                            etherex.endSettle(p, { from: eth.accounts[0], gas: 20000000 });
                        }
                    }
                    again = false;
                } catch(e) {
                    web3.personal.unlockAccount(eth.accounts[0], "amalien", 1000);
                }
            }
        }, END_SETTLE_CHECK_IN_SECONDS * 1000);
    } catch (err) {
        console.log(err.message);
    }
}

function stop() {
    try {
        // clear interval if one is currently active
        if (global.endSettlerInterval) {
            clearInterval(global.endSettlerInterval);
        }
    } catch (err) {
        console.log(err.message);
    }
}

module.exports = {                                                                                                                                      
    start: start,
    stop: stop
}
