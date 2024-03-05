
const express = require("express");
const mg = require("mongoose")

const app   = express();
const PORT  = process.env.PORT;
const DB_IP = process.env.DB_IP 

const markets         = require("../config.json").markets;
const brokers         = require("../config.json").brokers;
const frontendAddress = require("../config.json").frontendAddress;

app.use(express.json());

const priceSchema = new mg.Schema({
    broker:    String,
    name:      String,
    irr_buy:   Number,
    irr_sell:  Number,
    usdt_buy:  Number,
    usdt_sell: Number
});

const Price = mg.model("price", priceSchema);

app.listen(PORT, async () => {
  makeTemplate();
  console.log(`Server listening on ${PORT}`);
  await mg.connect(DB_IP + "/cache");
  console.log(`Connected to database: ${DB_IP}`)
});

async function fetchAsync (url) {
    let response = await fetch(url);
    let data = await response.json();
    return data;
}

var table = Object();

function makeTemplate() {
  brokers.forEach(e => {
    let emarketName = Object.keys(e)[0];
    table[emarketName] = Object();
    markets.forEach(m => {
        table[emarketName][m] = Object();
    });
  });
}

var cached = false;

app.get('/', async (req, res) => {

    // Nobitex
    for(const currency in table.nobitex){
        const response = await fetchAsync(`${brokers[0].nobitex}?srcCurrency=${currency}&dstCurrency=rls`);
        let curr = response.stats[`${currency}-rls`];
        if (!curr) continue;
        table.nobitex[currency].irr_buy = parseFloat(curr.bestBuy);
        table.nobitex[currency].irr_sell = parseFloat(curr.bestSell);
    }
    for(const currency in table.nobitex){
        const response = await fetchAsync(`${brokers[0].nobitex}?srcCurrency=${currency}&dstCurrency=usdt`);
        let curr = response.stats[`${currency}-usdt`];
        if (!curr) continue;
        table.nobitex[currency].usdt_buy = parseFloat(curr.bestBuy);
        table.nobitex[currency].usdt_sell = parseFloat(curr.bestSell);
    }

    // Ramzinex
    const response = await fetchAsync(`${brokers[1].ramzinex}`);
    for(let i = 0; i < response.data.length; i++) {
        const currency = response.data[i];
        const base = currency.base_currency_symbol.en;
        if (markets.indexOf(base) == -1) continue;
        table.ramzinex[`${currency.base_currency_symbol.en}`][`${currency.quote_currency_symbol.en}_buy`] = currency.buy;
        table.ramzinex[`${currency.base_currency_symbol.en}`][`${currency.quote_currency_symbol.en}_sell`]  = currency.sell;
     }

    // Bitpin
    const response2 = await fetchAsync(`${brokers[2].bitpin}`);
    for(let i = 0; i < response2.results.length; i++) {
        const currency = response2.results[i];
        const names = currency.code.toLowerCase();
        if (markets.indexOf(names) == -1) continue;
        table.bitpin[`${currency.code.toLowerCase()}`][`irr_buy`] = parseFloat(currency.price_info.price);
	    table.bitpin[`${currency.code.toLowerCase()}`][`irr_sell`] = parseFloat(currency.price_info.price);
        table.bitpin[`${currency.code.toLowerCase()}`][`usdt_buy`] = parseFloat(currency.price_info_usdt.price);
        table.bitpin[`${currency.code.toLowerCase()}`][`usdt_sell`] = parseFloat(currency.price_info_usdt.price);
    }

    console.log(`Got request from ${req.ip}`);
    res.setHeader("Access-Control-Allow-Origin", frontendAddress);
    if(!cached) {
        cache();
        cached = true;
    }
    res.send(table);
});

async function cache() {
    const brokers = Object.keys(table);
    for (let i = 0; i < brokers.length; i++) {
        const coins = Object.keys(table[brokers[i]]);
        for (let j = 0; j < coins.length; j++) {
            const values = table[brokers[i]][coins[j]];
            const price = new Price({
                broker: brokers[i],
                name: coins[j],
                irr_buy: values.irr_buy ? values.irr_buy : 0,
                irr_sell: values.irr_sell ? values.irr_sell : 0,
                usdt_buy: values.usdt_buy ? values.usdt_buy : 0,
                usdt_sell: values.usdt_sell ? values.usdt_sell : 0
            });
            await price.save();
        }
    }
}