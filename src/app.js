var fs = require("fs");
var express = require("express");
const exphbs = require('express-handlebars');
const path = require('path');
var request = require('request');
let altCoinPrice = require('./bittrex-price');

var app = express();
var coindeskResponse;
var portfolio = JSON.parse(fs.readFileSync("../portfolio.json"));
var options = {
    method: 'GET',
    url: 'https://api.coindesk.com/v1/bpi/currentprice/EUR.json'
};


const engineConfig = {
    extname: '.hbs',
    defaultLayout: 'main',
    layoutsDir: path.join(__dirname, 'views', 'layouts'),
    partialsDir: path.join(__dirname, 'views', 'partials')
}

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
function calculateValue(portfolio, btcPrice) {
    for (let entry of portfolio) {
        if (entry.name == 'BTC') {
            entry.worthInUSD = round(entry.balance * btcPrice, 100);
            entry.accBTCValue = entry.balance;
        } else {
            entry.accBTCValue = round(entry.balance * entry.lastPrice, 100000000);
            entry.worthInUSD = round(entry.accBTCValue * btcPrice, 100);
        }
    }
}

/*
function calculateTotalValue(portfolio) {
    var totalValueUSD;
    var totalValueBTC;
    for (let entry of portfolio) {
        totalValueUSD = totalValueUSD + entry.worthInUSD;
        totalValueBTC = totalValueBTC + entry.accBTCValue;
    }
    var totalEntry = {
        name: "Total",
        balance: " ",
        accBTCValue: totalValueBTC,
        worthInUSD: totalValueUSD,
        lastPrice: " "
    }
    portfolio.push(totalEntry);
}
*/


app.get("/", function (req, res) {

    //hier die views datei einfügen die in main.hsb gerendert werden soll
    request(options, function (error, response, body) {
        if (error) throw new Error(error);

        coindeskResponse = JSON.parse(body);
        var btcPriceRounded = round(coindeskResponse.bpi.USD.rate_float, 100);
        altCoinPrice(portfolio);
        portfolio[0].lastPrice = btcPriceRounded; //TODO where entry.name = "btc"
        calculateValue(portfolio, coindeskResponse.bpi.USD.rate_float);
        console.log(portfolio);
        res.render('portfolio', {
            portfolio: portfolio,
            btcPrice: coindeskResponse.bpi.USD.rate_float,
            btcPriceRounded: btcPriceRounded
        });
    });
});

app.listen(3000, function () {

    console.log('Server running!');

});