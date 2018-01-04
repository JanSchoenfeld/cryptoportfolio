var request = require("request");
var fs = require('fs');


function round(number, decimal) {
  var roundedNumber = Math.round(number * decimal) / decimal;
  return roundedNumber;
}

//Call Bittrex public API for each currency and get the market summary, then add into portfolio.
function getPrice(portfolio) {

  var jobs = [];
  var values = [];

  for (let balance of portfolio) {

    var promise = new Promise(function (resolve, reject) {
      var options = {
        method: 'GET',
        url: balance.url
      }

      switch (balance.exchange) {
        case 'bittrex':
          var result = {};
          request(options, function (error, response, body) {
            if (error) throw new Error(error);

            var ticker = JSON.parse(body);
            result.lastPrice = ticker.result[0].Last;
            if (balance.name == 'BTC') {
              result.previousDay = round(ticker.result[0].PrevDay, 100);
            } else {
              result.previousDay = ticker.result[0].PrevDay;
            }
            resolve(result);
          });
          break;
        case 'binance':
          var result = {};
          request(options, function (error, response, body) {
            if (error) throw new Error(error);

            var ticker = JSON.parse(body);
            result.lastPrice = ticker.lastPrice;
            result.previousDay = ticker.openPrice;
            resolve(result);
          });
          break;
        default:
          console.log('Unrecognized Exchange');
          break;
      }

    })
    jobs.push(promise) // Push jobs down the stairs

  }

  Promise.all(jobs).then(balance => {

    portfolio.forEach(function (obj, idx) {
      obj.lastPrice = balance[idx].lastPrice;
      obj.previousDay = balance[idx].previousDay;
    });
    console.log(portfolio);
  })

}


module.exports = getPrice;