var fs = require("fs");
var express = require("express");
const exphbs = require('express-handlebars');
const path = require('path');

var app = express();

const engineConfig = {
    extname: '.hbs', defaultLayout: 'main',
    layoutsDir: path.join(__dirname, 'views', 'layouts'),
    partialsDir: path.join(__dirname, 'views', 'partials')
}
app.engine('hbs', exphbs(engineConfig));
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs');

var portfolio = JSON.parse(fs.readFileSync("../portfolio.json"));


app.get("/", function(req, res){

    //hier die views datei einfügen die in main.hsb gerendert werden soll
    res.render('portfolio', {portfolio});

});

app.listen(3000, function(){
    
    console.log('Server running!');

});

