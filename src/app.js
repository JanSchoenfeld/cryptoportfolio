var fs = require("fs");
var express = require("express");
const exphbs = require('express-handlebars');

var app = express();

var portfolio = JSON.parse(fs.readFileSync("../portfolio.json"));

for (let balance of portfolio){
    console.log(balance.name + " " + balance.balance);
}

app.get("/", function(req, res){

    res.send("Hello Blyets");
    res.render

});

app.listen(3000, function(){
    
    console.log("server listening blyet");

});

