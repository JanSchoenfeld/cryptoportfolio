var fs = require("fs");
var express = require("express");
const exphbs = require('express-handlebars');
const path = require('path');
var request = require('request');
let altCoinPrice = require('./get-price');

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
    helpers: {
        if_equal: function (a: any, b: any, opts: any) {
            if (a == b) {
                return opts.fn(this);
            } else {
                return opts.inverse(this);
            }
        }
    },
    layoutsDir: path.join(__dirname, 'views', 'layouts'),
    partialsDir: path.join(__dirname, 'views', 'partials')
}

app.engine('hbs', exphbs(engineConfig));
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs');

//Function that rounds on second decimal after 0
//params: number to round, decimal to round to (Ex. 10 for .0, 100 for .00)
function round(number: number, decimal: number) {
    var roundedNumber = Math.round(number * decimal) / decimal;
    return roundedNumber;
}



//Function to calculate the current dollar price based on satoshi price, balance and BTC-USD price
function calculateValue(portfolio: any, btcPriceUSD: number, btcPriceEUR: number) {
    for (let entry of portfolio) {
        if (entry.name == 'BTC') {
            entry.worthInUSD = round(entry.balance * btcPriceUSD, 100);
            entry.worthInEUR = round(entry.balance * btcPriceEUR, 100);
            entry.accBTCValue = entry.balance;
        } else {
            entry.accBTCValue = round(entry.balance * entry.lastPrice, 100000000);
            entry.worthInUSD = round(entry.accBTCValue * btcPriceUSD, 100);
            entry.worthInEUR = round(entry.accBTCValue * btcPriceEUR, 100);
        }
    }
    var totalValueUSD = 0;
    var totalValueBTC = 0;
    var totalValueEUR = 0;
    for (let entry of portfolio) {
        totalValueUSD = totalValueUSD + parseFloat(entry.worthInUSD);
        totalValueEUR = totalValueEUR + parseFloat(entry.worthInEUR);
        totalValueBTC = totalValueBTC + parseFloat(entry.accBTCValue);
    }
    totalValueUSD = round(totalValueUSD, 100);
    totalValueEUR = round(totalValueEUR, 100);
    totalValueBTC = round(totalValueBTC, 100);
    console.log(totalValueBTC + ' BTC ' + '$' + totalValueUSD + ' €' + totalValueEUR);
}



function calculatePercentChange(portfolio: any) {
    for (let entry of portfolio) {
        entry.percentChange = round((((1 - (entry.lastPrice / entry.previousDay)) * 100) * -1), 10);
    }
}



app.get("/", function (req: any, res: any) {

    //request to coinbase to get current btc price
    request(options, function (error:any , response: any, body: any) {
        if (error) throw new Error(error);

        coindeskResponse = JSON.parse(body);
        var btcPriceRoundedUSD = round(coindeskResponse.bpi.USD.rate_float, 100);
        var btcPriceRoundedEUR = round(coindeskResponse.bpi.EUR.rate_float, 100);

        //call bittrex api for altcoin price
        for (let entry of portfolio) {
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
    var coinLoop = setInterval(() => {
        console.log('patte fliesst');
        
    }, 30000)


});