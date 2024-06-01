'use strict';

var expect = require('chai').expect;
let mongodb = require('mongodb');
let mongoose = require('mongoose');
let XMLHttpRequest = require('xmlhttprequest').XMLHttpRequest;

module.exports = function (app) {
  
  let uri = 'mongodpapiurl'; //add mongo db authentication url 

  mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true });
  
  let stockSchema = new mongoose.Schema({
    name: { type: String, required: true },
    likes: { type: Number, default: 0 },
    ips: [String]
  });
  
  let Stock = mongoose.model('Stock', stockSchema);
  
  app.route('/api/stock-prices')
    .get(function (req, res) {
    
      let responseObject = {};
      responseObject['stockData'] = {};

      // Variable to determine number of stocks
      let twoStocks = false;

      /* Output Response */
      let outputResponse = () => {
        return res.json(responseObject);
      };

      /* Find/Update Stock Document */
      let findOrUpdateStock = async (stockName, documentUpdate, nextStep) => {
        try {
          const options = { new: true, upsert: true };
          const stockDocument = await Stock.findOneAndUpdate({ name: stockName }, documentUpdate, options);
          if (stockDocument) {
            if (!twoStocks) {
              return nextStep(stockDocument, processOneStock);
            } else {
              return nextStep(stockDocument, processTwoStocks);
            }
          }
        } catch (error) {
          console.error(error);
        }
      };

      /* Like Stock */
      let likeStock = async (stockName, nextStep) => {
        try {
          const stockDocument = await Stock.findOne({ name: stockName });
          if (!stockDocument || (stockDocument['ips'] && stockDocument['ips'].includes(req.ip))) {
            return res.json('Error: Only 1 Like per IP Allowed');
          } else {
            let documentUpdate = { $inc: { likes: 1 }, $push: { ips: req.ip } };
            nextStep(stockName, documentUpdate, getPrice);
          }
        } catch (error) {
          console.error(error);
        }
      };

      /* Get Price */
      let getPrice = (stockDocument, nextStep) => {
        let xhr = new XMLHttpRequest();
        let requestUrl = 'https://stock-price-checker-proxy.freecodecamp.rocks/v1/stock/' + stockDocument['name'] + '/quote';
        xhr.open('GET', requestUrl, true);
        xhr.onload = () => {
          let apiResponse = JSON.parse(xhr.responseText);
          stockDocument['price'] = Number(apiResponse['latestPrice'].toFixed(2));
          nextStep(stockDocument, outputResponse);
        };
        xhr.send();
      };

      /* Build Response for 1 Stock */
      let processOneStock = (stockDocument, nextStep) => {
        responseObject['stockData']['stock'] = stockDocument['name'];
        responseObject['stockData']['price'] = stockDocument['price'];
        responseObject['stockData']['likes'] = stockDocument['likes'];

        // Type validation
        if (typeof responseObject['stockData']['stock'] !== 'string' ||
            typeof responseObject['stockData']['price'] !== 'number' ||
            typeof responseObject['stockData']['likes'] !== 'number') {
          return res.json('Error: Invalid stock data format');
        }

        nextStep();
      };

      let stocks = [];        
      /* Build Response for 2 Stocks */
      let processTwoStocks = (stockDocument, nextStep) => {
        let newStock = {};
        newStock['stock'] = stockDocument['name'];
        newStock['price'] = stockDocument['price'];
        newStock['likes'] = stockDocument['likes'];

        // Type validation
        if (typeof newStock['stock'] !== 'string' ||
            typeof newStock['price'] !== 'number' ||
            typeof newStock['likes'] !== 'number') {
          return res.json('Error: Invalid stock data format');
        }

        stocks.push(newStock);
        if (stocks.length === 2) {
          stocks[0]['rel_likes'] = stocks[0]['likes'] - stocks[1]['likes'];
          stocks[1]['rel_likes'] = stocks[1]['likes'] - stocks[0]['likes'];
          responseObject['stockData'] = stocks;
          nextStep();
        } else {
          return;
        }
      };

      /* Process Input */  
      if (typeof (req.query.stock) === 'string') {
        /* One Stock */
        let stockName = req.query.stock;
        let documentUpdate = {};
        if (req.query.like && req.query.like === 'true') {
          likeStock(stockName, findOrUpdateStock);
        } else {
          findOrUpdateStock(stockName, documentUpdate, getPrice);
        }

      } else if (Array.isArray(req.query.stock)) {
        twoStocks = true;
        
        /* Stock 1 */
        let stockName = req.query.stock[0];
        if (req.query.like && req.query.like === 'true') {
          likeStock(stockName, findOrUpdateStock);
        } else {
          let documentUpdate = {};
          findOrUpdateStock(stockName, documentUpdate, getPrice);
        }

        /* Stock 2 */
        stockName = req.query.stock[1];
        if (req.query.like && req.query.like === 'true') {
          likeStock(stockName, findOrUpdateStock);
        } else {
          let documentUpdate = {};
          findOrUpdateStock(stockName, documentUpdate, getPrice);
        }
      }
    });
};
