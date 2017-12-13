var fs = require("fs");

var portfolio = JSON.parse(fs.readFileSync("../portfolio.json"));

for (let balance of portfolio){
    console.log(balance.name + " " + balance.balance);
}

