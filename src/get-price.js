var request = require("request");
var fs = require('fs');

var portfolio = JSON.parse(fs.readFileSync("../portfolio.json"));


function round(number, decimal) {
  var roundedNumber = Math.round(number * decimal) / decimal;
  return roundedNumber;
}

//Call Bittrex public API for each currency and get the market summary, then add into portfolio.
//#TODO: Implement with promise
function getPrice(portfolio) {

  for (let balance of portfolio) {
    var options = {
      method: 'GET',
      url: balance.url
    }
    if(balance.exchange == "bittrex"){
      getBittrexPrice(options, balance);
    }
    if(balance.exchange == "binance"){
      getBinancePrice(options, balance);
    }

  }

  function getBittrexPrice(options, balance) {
    request(options, function (error, response, body) {
      if (error) throw new Error(error);

      var ticker = JSON.parse(body);
      balance.lastPrice = ticker.result[0].Last;
      if (balance.name == 'BTC') {
        balance.previousDay = round(ticker.result[0].PrevDay, 100);
      } else {
        balance.previousDay = ticker.result[0].PrevDay;
      }
    });
  }

  function getBinancePrice(options, balance) {
    request(options, function (error, response, body) {
      if (error) throw new Error(error);

      var ticker = JSON.parse(body);
      balance.lastPrice = ticker.lastPrice;
      balance.previousDay = ticker.openPrice;
    });
  }


  //pseudo-async
  var millisecondsToWait = 700;
  setTimeout(function () {}, millisecondsToWait);
  
}

//warum funktioniert das ohne den aufruf nicht????
getPrice(portfolio);
module.exports = getPrice;