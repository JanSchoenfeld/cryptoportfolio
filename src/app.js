const fs = require("fs");
const express = require("express");
const exphbs = require('express-handlebars');
const path = require('path');
const request = require('request');
const altCoinPrice = require('./get-price');

let app = express();
let coindeskResponse;
let portfolio = JSON.parse(fs.readFileSync(path.join(__dirname, "../portfolio.json")));
let options = {
    method: 'GET',
    url: 'https://api.coindesk.com/v1/bpi/currentprice/EUR.json'
};

let totalValueUSD = 0;
let totalValueBTC = 0;
let totalValueEUR = 0;

const engineConfig = {
    extname: '.hbs',
    defaultLayout: 'main',
    helpers: {
        if_equal: function (a, b, opts) {
            if (a == b) {
                return opts.fn(this);
            } else {
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
    let roundedNumber = Math.round(number * decimal) / decimal;
    return roundedNumber;
}



//Function to calculate the current dollar price based on satoshi price, balance and BTC-USD price
function calculateValue(portfolio, btcPriceUSD, btcPriceEUR) {
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
    totalValueUSD = 0;
    totalValueBTC = 0;
    totalValueEUR = 0;
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



function calculatePercentChange(portfolio) {
    for (let entry of portfolio) {
        entry.percentChange = round((((1 - (entry.lastPrice / entry.previousDay)) * 100) * -1), 10);
    }
}

app.get("/eur", function (req, res) {

    //request to coinbase to get current btc price
    request(options, function (error, response, body) {
        if (error) throw new Error(error);

        coindeskResponse = JSON.parse(body);
        let btcPriceRoundedUSD = round(coindeskResponse.bpi.USD.rate_float, 100);
        let btcPriceRoundedEUR = round(coindeskResponse.bpi.EUR.rate_float, 100);

        //call bittrex api for altcoin price
        for (let entry of portfolio) {
            if (entry.name == 'BTC') {
                entry.lastPrice = btcPriceRoundedUSD;
                entry.lastPriceEUR = btcPriceRoundedEUR;
                break;
            }
        }
        calculateValue(portfolio, coindeskResponse.bpi.USD.rate_float, coindeskResponse.bpi.EUR.rate_float);
        calculatePercentChange(portfolio);
        //hier die views datei + letiablen einfügen die in main.hsb gerendert werden soll
        res.render('portfolio_eur', {
            portfolio: portfolio,
            btcPrice: coindeskResponse.bpi.EUR.rate_float,
            btcPriceRounded: btcPriceRoundedUSD,
            btcPriceRoundedEUR: btcPriceRoundedEUR,
            totalValueUSD: totalValueUSD,
            totalValueBTC: totalValueBTC,
            totalValueEUR: totalValueEUR
        });
    });
});


app.get("/", function (req, res) {

    //request to coinbase to get current btc price
    request(options, function (error, response, body) {
        if (error) throw new Error(error);

        coindeskResponse = JSON.parse(body);
        let btcPriceRoundedUSD = round(coindeskResponse.bpi.USD.rate_float, 100);
        let btcPriceRoundedEUR = round(coindeskResponse.bpi.EUR.rate_float, 100);

        //call bittrex api for altcoin price
        for (let entry of portfolio) {
            if (entry.name == 'BTC') {
                entry.lastPrice = btcPriceRoundedUSD;
                break;
            }
        }
        calculateValue(portfolio, coindeskResponse.bpi.USD.rate_float, coindeskResponse.bpi.EUR.rate_float);
        calculatePercentChange(portfolio);
        //hier die views datei + letiablen einfügen die in main.hsb gerendert werden soll
        res.render('portfolio', {
            portfolio: portfolio,
            btcPrice: coindeskResponse.bpi.USD.rate_float,
            btcPriceRounded: btcPriceRoundedUSD,
            btcPriceRoundedEUR: btcPriceRoundedEUR,
            totalValueUSD: totalValueUSD,
            totalValueBTC: totalValueBTC,
            totalValueEUR: totalValueEUR
        });
    });
});



app.listen(3000, function () {

    console.log('Server running!');
    altCoinPrice(portfolio);
    setInterval(() => {
        altCoinPrice(portfolio);
        console.log('patte fliesst');
    }, 30000);


});