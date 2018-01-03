var fs = require("fs");
const path = require('path');


var key = "24h_volume_change";
var coinlist = JSON.parse(fs.readFileSync("../list.json"));

for(let entry of coinlist){
    delete entry["price_usd"];
    delete entry["price_btc"];
    delete entry["24h_volume_usd"];
    delete entry["market_cap_usd"];
    delete entry["available_supply"];
    delete entry["total_supply"];
    delete entry["max_supply"];
    delete entry["percent_change_1h"];
    delete entry["percent_change_24h"];
    delete entry["percent_change_7d"];
    delete entry["last_updated"];
}
fs.writeFileSync('./editedlist.json', JSON.stringify(coinlist), 'utf-8');
console.log(coinlist.length);