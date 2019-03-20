let request = require("request");


function round(number, decimal) {
  let roundedNumber = Math.round(number * decimal) / decimal;
  return roundedNumber;
}

//Call Bittrex public API for each currency and get the market summary, then add into portfolio.
function getPrice(portfolio) {

  let jobs = [];
  let values = [];

  for (let balance of portfolio) {

    let result = {};
    let promise = new Promise((resolve, reject) => {
      let options = {
        method: 'GET',
        url: balance.url
      };

      switch (balance.exchange) {
        case 'bittrex':
          request(options, function (error, response, body) {
            if (error) throw new Error(error);

            let ticker = JSON.parse(body);
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
          request(options, function (error, response, body) {
            if (error) throw new Error(error);

            let ticker = JSON.parse(body);
            result.lastPrice = ticker.lastPrice;
            result.previousDay = ticker.openPrice;
            resolve(result);
          });
          break;
        default:
          console.log('Unrecognized Exchange');
          break;
      }

    });
    jobs.push(promise); // Push jobs down the stairs

  }

  Promise.all(jobs).then(balance => {

    portfolio.forEach(function (obj, idx) {
      obj.lastPrice = balance[idx].lastPrice;
      obj.previousDay = balance[idx].previousDay;
    });
  });

}


module.exports = getPrice;