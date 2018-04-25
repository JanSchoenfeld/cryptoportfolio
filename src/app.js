var fs = require("fs");
var express = require("express");
var exphbs = require('express-handlebars');
var path = require('path');
var request = require('request');
var altCoinPrice = require('./get-price');
var app = express();
var coindeskResponse;
var portfolio = JSON.parse(fs.readFileSync("../portfolio.json"));
var options = {
    method: 'GET',
    url: 'https://api.coindesk.com/v1/bpi/currentprice/EUR.json'
};
var engineConfig = {
    extname: '.hbs',
    defaultLayout: 'main',
    helpers: {
        if_equal: function (a, b, opts) {
            if (a == b) {
                return opts.fn(this);
            }
            else {
                return opts.inverse(this);
            }
        }
    },
    layoutsDir: path.join(__dirname, 'views', 'layouts'),
    partialsDir: path.join(__dirname, 'views', 'partials')
};
app.engine('hbs', exphbs(engineConfig));
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs');
//Function that rounds on second decimal after 0
//params: number to round, decimal to round to (Ex. 10 for .0, 100 for .00)
function round(number, decimal) {
    var roundedNumber = Math.round(number * decimal) / decimal;
    return roundedNumber;
}
//Function to calculate the current dollar price based on satoshi price, balance and BTC-USD price
function calculateValue(portfolio, btcPriceUSD, btcPriceEUR) {
    for (var _i = 0, portfolio_1 = portfolio; _i < portfolio_1.length; _i++) {
        var entry = portfolio_1[_i];
        if (entry.name == 'BTC') {
            entry.worthInUSD = round(entry.balance * btcPriceUSD, 100);
            entry.worthInEUR = round(entry.balance * btcPriceEUR, 100);
            entry.accBTCValue = entry.balance;
        }
        else {
            entry.accBTCValue = round(entry.balance * entry.lastPrice, 100000000);
            entry.worthInUSD = round(entry.accBTCValue * btcPriceUSD, 100);
            entry.worthInEUR = round(entry.accBTCValue * btcPriceEUR, 100);
        }
    }
    var totalValueUSD = 0;
    var totalValueBTC = 0;
    var totalValueEUR = 0;
    for (var _a = 0, portfolio_2 = portfolio; _a < portfolio_2.length; _a++) {
        var entry = portfolio_2[_a];
        totalValueUSD = totalValueUSD + parseFloat(entry.worthInUSD);
        totalValueEUR = totalValueEUR + parseFloat(entry.worthInEUR);
        totalValueBTC = totalValueBTC + parseFloat(entry.accBTCValue);
    }
    totalValueUSD = round(totalValueUSD, 100);
    totalValueEUR = round(totalValueEUR, 100);
    totalValueBTC = round(totalValueBTC, 100);
    console.log(totalValueBTC + ' BTC ' + '$' + totalValueUSD + ' €' + totalValueEUR);
}
function calculatePercentChange(portfolio) {
    for (var _i = 0, portfolio_3 = portfolio; _i < portfolio_3.length; _i++) {
        var entry = portfolio_3[_i];
        entry.percentChange = round((((1 - (entry.lastPrice / entry.previousDay)) * 100) * -1), 10);
    }
}
app.get("/", function (req, res) {
    //request to coinbase to get current btc price
    request(options, function (error, response, body) {
        if (error)
            throw new Error(error);
        coindeskResponse = JSON.parse(body);
        var btcPriceRoundedUSD = round(coindeskResponse.bpi.USD.rate_float, 100);
        var btcPriceRoundedEUR = round(coindeskResponse.bpi.EUR.rate_float, 100);
        //call bittrex api for altcoin price
        for (var _i = 0, portfolio_4 = portfolio; _i < portfolio_4.length; _i++) {
            var entry = portfolio_4[_i];
            if (entry.name == 'BTC') {
                entry.lastPrice = btcPriceRoundedUSD;
                break;
            }
        }
        calculateValue(portfolio, coindeskResponse.bpi.USD.rate_float, coindeskResponse.bpi.EUR.rate_float);
        calculatePercentChange(portfolio);
        //hier die views datei + variablen einfügen die in main.hsb gerendert werden soll
        res.render('portfolio', {
            portfolio: portfolio,
            btcPrice: coindeskResponse.bpi.USD.rate_float,
            btcPriceRounded: btcPriceRoundedUSD
        });
    });
});
app.listen(3000, function () {
    console.log('Server running!');
    altCoinPrice(portfolio);
    var coinLoop = setInterval(function () {
        console.log('patte fliesst');
    }, 30000);
});
