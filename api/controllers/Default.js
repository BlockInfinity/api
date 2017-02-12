'use strict';

var url = require('url');

var Default = require('./DefaultService');

module.exports.buy = function buy (req, res, next) {
  Default.buy(req.swagger.params, res, next);
};

module.exports.sell = function sell (req, res, next) {
  Default.sell(req.swagger.params, res, next);
};

module.exports.settle = function settle (req, res, next) {
  Default.settle(req.swagger.params, res, next);
};

module.exports.register = function register (req, res, next) {
  Default.register(req.swagger.params, res, next);
};

module.exports.getBidOrders = function getBidOrders (req, res, next) {
  Default.getBidOrders(req.swagger.params, res, next);
};

module.exports.getAskOrders = function getAskOrders (req, res, next) {
  Default.getAskOrders(req.swagger.params, res, next);
};


module.exports.getAskReserveOrders = function getAskReserveOrders (req, res, next) {
  Default.getAskReserveOrders(req.swagger.params, res, next);
};


module.exports.getBidReserveOrders = function getBidReserveOrders (req, res, next) {
  Default.getBidReserveOrders(req.swagger.params, res, next);
};

module.exports.getState = function getState (req, res, next) {
  Default.getState(req.swagger.params, res, next);
};

module.exports.getMatchingPrice = function getMatchingPrice (req, res, next) {
  Default.getMatchingPrice(req.swagger.params, res, next);
};


