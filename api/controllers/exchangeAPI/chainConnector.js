var web3;

try {
    web3 = require("web3");
    var fs = require('fs')

    web3 = new web3();
    web3.setProvider(new web3.providers.HttpProvider('http://localhost:8545'));
    web3.eth.defaulAccount = web3.eth.accounts[0];

    var contractAddress = '0xc5fdac19ba3e4ca1d2d82c0aec4fc4c47334fe2c';
    var compiled;
    var abi;

    var source = fs.readFileSync('./public/etherexV0.sol').toString();

    source = source.replace('\n', '');
    compiled = web3.eth.compile.solidity(source);
    abi = compiled['<stdin>:etherexV0'].info.abiDefinition;
    var contract = web3.eth.contract(abi).at(contractAddress);
    web3.exchangeContract = contract;
    Object.getPrototypeOf(web3).exchangeContract = contract;

} catch (err) {
    throw new Error(err);
}

module.exports = web3;
