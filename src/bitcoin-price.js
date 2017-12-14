var request = require("request");

var options = { method: 'GET',
  url: 'https://api.coindesk.com/v1/bpi/currentprice/EUR.json'};

request(options, function (error, response, body) {
  if (error) throw new Error(error);

  console.log(body);
});
