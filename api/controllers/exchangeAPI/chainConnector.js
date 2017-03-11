var web3;
try {
    web3 = require("web3");
    var fs = require('fs')

    web3 = new web3();
    web3.setProvider(new web3.providers.HttpProvider('http://localhost:8545'));
    web3.eth.defaulAccount = web3.eth.accounts[0];


    var contractAddress = '0xd83fa77c38d47a3452089c968c4cc9f5afaca9c2';
    var compiled;
    var abi;

    var source = fs.readFileSync('./public/Etherex_raw.sol').toString();

    source = source.replace('\n', '');
    compiled = web3.eth.compile.solidity(source);
    abi = compiled['<stdin>:Etherex_raw'].info.abiDefinition;
    var contract = web3.eth.contract(abi).at(contractAddress);
    web3.exchangeContract = contract;
    Object.getPrototypeOf(web3).exchangeContract = contract;

} catch (err) {
    throw new Error("Geth command line not running. Not able to connect to http://localhost:8545")
}

module.exports = web3;
