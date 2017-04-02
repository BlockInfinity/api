init();

function init() {
    try {
        //web3.personal.unlockAccount(eth.accounts[0], "amalien", 1000);
        //etherex.registerCertificateAuthority(eth.accounts[0], { from: eth.accounts[0] });

        // checks every n seconds if a not yet settled period can
        // end settled because all users with orders in that period
        // have called the settle method
        setInterval(function() {
            var currentPeriod = etherex.getCurrPeriod();
            for (var p = 0; p < currentPeriod; p++) {
                if (etherex.haveAllUsersSettled(p) && !etherex.isPeriodSettled(p)) {
                    etherex.endSettle(p, { from: eth.accounts[0], gas: 20000000 });
                }
            }
        }, END_SETTLE_CHECK_IN_SECONDS * 1000);

    } catch (err) {
        console.log("something happaned");
    }

    // web3.personal.unlockAccount(_addr, "amalien", 1000);
}
