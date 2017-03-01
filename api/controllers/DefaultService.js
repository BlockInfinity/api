'use strict';

var api = require('./exchangeAPI/blockEnergyAPI.js');
//var smartMeterAPI = require('../dex_api/SmartmeterAPI')


exports.register = function(req, res, next) {

    //  //The response object is a standard http response object
    try {
        api.register(req.registerRequest.value.userAddress,req.registerRequest.value.type);
        res.statusCode = 200

        console.log(req.registerRequest.value.userAddress,req.registerRequest.value.type);
      
   
        res.end("Registered user with address " + req.registerRequest.value.userAddress + " as "+req.registerRequest.value.type);
    } catch (error) {

        res.statusCode = 500;
        res.end('Blockchain error ' + error.message);

    }
    res.end();
};

exports.settle = function(req, res, next) {
       //The response object is a standard http response object
    // try {

    //     api.settle(req.settleRequest.value.type, req.settleRequest.value.volume, req.settleRequest.value.address);
    //     res.statusCode = 200
  
    //     //console.log(req.price.value, req.volume.value);
    //     res.end();
    // } catch (error) {

    //     res.statusCode = 500;
    //     res.end('Blockchain error ' + error.message);

    // }
    // res.end();
};


exports.buy = function(req, res, next) {

    //The response object is a standard http response object
    try {
        api.buy(req.buyRequest.value.price, req.buyRequest.value.volume, req.buyRequest.value.address);
        res.statusCode = 200

  
        //console.log(req.price.value, req.volume.value);
        res.end('Made transaction succesfully with price:' + req.buyRequest.value.price + ', volume: ' + req.buyRequest.value.volume + ', address: ' + req.buyRequest.value.address);
    } catch (error) {

        res.statusCode = 500;
        res.end('Blockchain error ' + error.message);

    }
    res.end();
};


exports.sell = function(req, res, next) {

    //The response object is a standard http response object
    try {
        api.sell(req.sellRequest.value.price, req.sellRequest.value.volume, req.sellRequest.value.address);
        res.statusCode = 200

  
        //console.log(req.price.value, req.volume.value);
        res.end('Made transaction succesfully with price:' + req.sellRequest.value.price + ', volume: ' + req.sellRequest.value.volume + ', address: ' + req.sellRequest.value.address);
    } catch (error) {

        res.statusCode = 500;
        res.end('Blockchain error ' + error.message);

    }
    res.end();
};


exports.getBidOrders = function(req, res) {

    //The response object is a standard http response object
    try {
        var orders = api.getBidOrders();

        var prices = JSON.stringify(orders[0]);
        var volumes = JSON.stringify(orders[1]);

        prices = prices.split("\"").join("");
        volumes = volumes.split("\"").join("");

        res.statusCode = 200;

        res.end(JSON.stringify([{ "prices": prices }, { "volumes": volumes }]));

    } catch (error) {

        res.statusCode = 500;
        res.end('Blockchain error ' + error.message);

    }
    res.end();
};


exports.getAskOrders = function(req, res) {

    //The response object is a standard http response object
    try {
        var orders = api.getAskOrders();

        var prices = JSON.stringify(orders[0]);
        var volumes = JSON.stringify(orders[1]);

        prices = prices.split("\"").join("");
        volumes = volumes.split("\"").join("");

        res.statusCode = 200;

        res.end(JSON.stringify([{ "prices": prices }, { "volumes": volumes }]));


    } catch (error) {

        res.statusCode = 500;
        res.end('Blockchain error ' + error.message);

    }
    res.end();
};


exports.getBidReserveOrders = function(req, res) {

    res.end();

};

exports.getAskReserveOrders = function(req, res, next) {


    res.end();

};


exports.getState = function(req, res, next) {

    //The response object is a standard http response object
    try {

        var state = api.getState();


        console.log(state);
        res.statusCode = 200;

        res.end(JSON.stringify({ "state": state[0],"period":state[1] }));


    } catch (error) {

        res.statusCode = 500;
        res.end('Blockchain error ' + error.message);

    }
    res.end();
};

exports.getMatchingPrice = function(req, res, next) {

    //The response object is a standard http response object
    try {


        var matchingPrice = api.getMatchingPrice(req.period.value);

        matchingPrice = matchingPrice.c[0];


        console.log(matchingPrice);
        res.statusCode = 200;

        res.end(JSON.stringify({ "matchingPrice": matchingPrice }));


    } catch (error) {

        res.statusCode = 500;
        res.end('Blockchain error ' + error.message);

    }
    res.end();
};
