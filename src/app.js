var fs = require("fs");
var express = require("express");
const exphbs = require('express-handlebars');
const path = require('path');
var request = require('request');

var app = express();
var coindeskResponse;

const engineConfig = {
    extname: '.hbs', defaultLayout: 'main',
    layoutsDir: path.join(__dirname, 'views', 'layouts'),
    partialsDir: path.join(__dirname, 'views', 'partials')
}

app.engine('hbs', exphbs(engineConfig));
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs');

var portfolio = JSON.parse(fs.readFileSync("../portfolio.json"));

var request = require("request");

var options = { method: 'GET',
  url: 'https://api.coindesk.com/v1/bpi/currentprice/EUR.json'};


function round(number){
    var roundedNumber = Math.round(number * 100) / 100;
    return roundedNumber;
}


app.get("/", function(req, res){

    //hier die views datei einfügen die in main.hsb gerendert werden soll
    request(options, function (error, response, body) {
        if (error) throw new Error(error);
      
        coindeskResponse = JSON.parse(body);
        var btcPriceRounded = round(coindeskResponse.bpi.USD.rate_float);
        console.log(btcPriceRounded);
        res.render('portfolio', {portfolio:portfolio, btcPrice: coindeskResponse.bpi.USD.rate_float, btcPriceRounded: btcPriceRounded});
      });

});

app.listen(3000, function(){
    
    console.log('Server running!');

});

