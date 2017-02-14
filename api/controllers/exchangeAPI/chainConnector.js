try {
    var web3 = require("web3");
    var fs = require('fs')

    web3 = new web3();
    web3.setProvider(new web3.providers.HttpProvider('http://localhost:8545'));
    web3.eth.defaulAccount = web3.eth.accounts[0];


    var contractAddress = '0xea295bdb835dcb6f415b443ef1d0cf58ec99025b';
    var compiled;
    var abi;

    fs.readFile('./Etherex_raw.sol', 'utf8', function(err, data) {
        if (err) {
            return console.log(err);
        }
        source = data.replace('\n', '');
        compiled = web3.eth.compile.solidity(source);
        abi = compiled['<stdin>:Etherex_raw'].info.abiDefinition;
        web3.exchangeContract = web3.eth.contract(abi).at(contractAddress);
    });

} catch (err) {
    throw new Error("Geth command line not running. Not able to connect to http://localhost:8545")
}


module.exports = web3;
