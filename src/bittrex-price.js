var request = require("request");
var fs = require('fs');

var portfolio = JSON.parse(fs.readFileSync("../portfolio.json"));
var url = 'https://bittrex.com/api/v1.1/public/getmarketsummary?market=BTC-';


//Call Bittrex public API for each currency and get the market summary, then add into portfolio.
//#TODO: Implement with promise
function getBittrexPrice(portfolio) {

  for (let balance of portfolio) {
    if (balance.name == 'BTC') {
      var options = {
        method: 'GET',
        url: 'https://bittrex.com/api/v1.1/public/getmarketsummary?market=USDT-BTC'
      }
    } else {
      var options = {
        method: 'GET',
        url: url + balance.name
      }
    }

    request(options, function (error, response, body) {
      if (error) throw new Error(error);

      var ticker = JSON.parse(body);
      balance.lastPrice = ticker.result[0].Last;
    });
  }

  //pseudo-async
  var millisecondsToWait = 700;
  setTimeout(function () {}, millisecondsToWait);

}

//warum funktioniert das ohne den aufruf nicht????
getBittrexPrice(portfolio);

module.exports = getBittrexPrice;