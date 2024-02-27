
const express = require('express');

const app = express();
const PORT = process.env.PORT || 5000;

const markets = require("../config.json").markets;
const exchangeMarkets = require("../config.json").exchangeMarkets;

app.use(express.json());

app.listen(PORT, () => {
  makeTemplate();
  console.log(`Server listening on ${PORT}`);
});

async function fetchAsync (url) {
    let response = await fetch(url);
    let data = await response.json();
    return data;
}

var table = Object();

function makeTemplate() {
  exchangeMarkets.forEach(e => {
    let emarketName = Object.keys(e)[0];
    table[emarketName] = Object();
    markets.forEach(m => {
        table[emarketName][m] = Object();
    });
  });
}

app.get('/', async (req, res) => {

    // Nobitex
    for(const currency in table.nobitex){
        const response = await fetchAsync(`${exchangeMarkets[0].nobitex}?srcCurrency=${currency}&dstCurrency=rls`);
        let curr = response.stats[`${currency}-rls`];
        if (!curr) continue;
        table.nobitex[currency].irr_buy = parseFloat(curr.bestBuy);
        table.nobitex[currency].irr_sell = parseFloat(curr.bestSell);
    }
    for(const currency in table.nobitex){
        const response = await fetchAsync(`${exchangeMarkets[0].nobitex}?srcCurrency=${currency}&dstCurrency=usdt`);
        let curr = response.stats[`${currency}-usdt`];
        if (!curr) continue;
        table.nobitex[currency].usdt_buy = parseFloat(curr.bestBuy);
        table.nobitex[currency].usdt_sell = parseFloat(curr.bestSell);
    }

    // Ramzinex
    const response = await fetchAsync(`${exchangeMarkets[1].ramzinex}`);
    for(let i = 0; i < response.data.length; i++) {
        const currency = response.data[i];
        const base = currency.base_currency_symbol.en;
        if (markets.indexOf(base) == -1) continue;
        table.ramzinex[`${currency.base_currency_symbol.en}`][`${currency.quote_currency_symbol.en}_buy`] = currency.buy;
        table.ramzinex[`${currency.base_currency_symbol.en}`][`${currency.quote_currency_symbol.en}_sell`]  = currency.sell;
     }

    // Bitpin
    const response2 = await fetchAsync(`${exchangeMarkets[2].bitpin}`);
    for(let i = 0; i < response2.results.length; i++) {
        const currency = response2.results[i];
        const names = currency.code.toLowerCase();
        if (markets.indexOf(names) == -1) continue;
        table.bitpin[`${currency.code.toLowerCase()}`][`irr_buy`] = parseFloat(currency.price_info.price);
	    table.bitpin[`${currency.code.toLowerCase()}`][`irr_sell`] = parseFloat(currency.price_info.price);
        table.bitpin[`${currency.code.toLowerCase()}`][`usdt_buy`] = parseFloat(currency.price_info_usdt.price);
        table.bitpin[`${currency.code.toLowerCase()}`][`usdt_sell`] = parseFloat(currency.price_info_usdt.price);
    }

    res.send(table);
});
