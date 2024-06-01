var chaiHttp = require('chai-http');
var chai = require('chai');
var assert = chai.assert;
var server = require('../server');

chai.use(chaiHttp);

suite('Functional Tests', function() {

    suite('GET /api/stock-prices => stockData object', function() {

        // Test viewing one stock
        test('Viewing one stock: GET request to /api/stock-prices/', function(done) {
            chai.request(server)
            .get('/api/stock-prices')
            .query({stock: 'GOOG'})
            .end(function(err, res) {
                assert.equal(res.status, 200);
                assert.equal(res.body.stockData.stock, 'GOOG');
                assert.isNotNull(res.body.stockData.price);
                assert.isNotNull(res.body.stockData.likes);
                done();
            });
        });

        // Test viewing one stock and liking it
        test('Viewing one stock and liking it: GET request to /api/stock-prices/', function(done) {
            chai.request(server)
            .get('/api/stock-prices')
            .query({stock: 'GOOG', like: true})
            .end(function(err, res) {
                assert.equal(res.status, 200);
                assert.equal(res.body.stockData.stock, 'GOOG');
                assert.isNotNull(res.body.stockData.price);
                assert.equal(res.body.stockData.likes, 1);
                done();
            });
        });

        // Test viewing the same stock and liking it again to ensure likes are not double-counted
        test('Viewing the same stock and liking it again: GET request to /api/stock-prices/', function(done) {
            chai.request(server)
            .get('/api/stock-prices')
            .query({stock: 'GOOG', like: true})
            .end(function(err, res) {
                assert.equal(res.status, 200);
                assert.equal(res.body, 'Error: Only 1 Like per IP Allowed');
                done();
            });
        });

        // Test viewing two stocks
        test('Viewing two stocks: GET request to /api/stock-prices/', function(done) {
            chai.request(server)
            .get('/api/stock-prices')
            .query({stock: ['AAPL', 'MSFT']})
            .end(function(err, res) {
                let stockData = res.body.stockData;
                assert.isArray(stockData);

                if(stockData[0].stock === 'AAPL') {
                    assert.equal(stockData[0].stock, 'AAPL');
                    assert.isNotNull(stockData[0].price);
                    assert.isNotNull(stockData[0].rel_likes);
                    assert.equal(stockData[1].stock, 'MSFT');
                    assert.isNotNull(stockData[1].price);
                    assert.isNotNull(stockData[1].rel_likes);
                } else {
                    assert.equal(stockData[1].stock, 'AAPL');
                    assert.isNotNull(stockData[1].price);
                    assert.isNotNull(stockData[1].rel_likes);
                    assert.equal(stockData[0].stock, 'MSFT');
                    assert.isNotNull(stockData[0].price);
                    assert.isNotNull(stockData[0].rel_likes);
                }
                done();
            });
        });

        // Test viewing two stocks and liking them
        test('Viewing two stocks and liking them: GET request to /api/stock-prices/', function(done) {
            chai.request(server)
            .get('/api/stock-prices')
            .query({stock: ['AAPL', 'MSFT'], like: true})
            .end(function(err, res) {
                let stockData = res.body.stockData;
                assert.isArray(stockData);

                if(stockData[0].stock === 'AAPL') {
                    assert.equal(stockData[0].stock, 'AAPL');
                    assert.isNotNull(stockData[0].price);
                    assert.isNotNull(stockData[0].rel_likes);
                    assert.equal(stockData[1].stock, 'MSFT');
                    assert.isNotNull(stockData[1].price);
                    assert.isNotNull(stockData[1].rel_likes);
                } else {
                    assert.equal(stockData[1].stock, 'AAPL');
                    assert.isNotNull(stockData[1].price);
                    assert.isNotNull(stockData[1].rel_likes);
                    assert.equal(stockData[0].stock, 'MSFT');
                    assert.isNotNull(stockData[0].price);
                    assert.isNotNull(stockData[0].rel_likes);
                }
                done();
            });
        });

    });

});
