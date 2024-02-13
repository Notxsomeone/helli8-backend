
import express from 'express';
import http from 'http';

const app = express();
const PORT = 5000;

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
const exchangeMarkets = [
    { "ramzinex": "https://api.nobitex.ir" },
    { "nobitex": "https://api.nobitex.ir" },
    { "bitpin": "https://api.nobitex.ir" }
];
const markets = [
    "irr",
    "usdt",
    "btc",
    "eth",
    "doge",
    "shib",
    "sol",
    "trx",
    "matic",
    "ton"
];

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
    // table.nobitex.btc.IRR_BUY = response.stats["btc_rls"].bestBuy;

    for(const currency in table.nobitex){
        const response = await fetchAsync(`${exchangeMarkets[0].ramzinex}/market/stats?srcCurrency=${currency}&dstCurrency=rls`)
        table.nobitex[currency].irr_buy = response.stats[`${currency}-rls`].bestBuy
        table.nobitex[currency].irr_sell = response.stats[`${currency}-rls`].bestSell
    }
    for(const currency in table.nobitex){
        const response = await fetchAsync(`${exchangeMarkets[0].ramzinex}/market/stats?srcCurrency=${currency}&dstCurrency=usdt`)
        // table.nobitex[currency].usdt_buy = response.stats[`${currency}-usdt`].bestBuy
        // table.nobitex[currency].usdt_sell = response.stats[`${currency}-usdt`].bestSell
        console.log(response.stats)
    }

    res.send(table);
});


/*
IRR
USDT
BTC
ETH
DOGE
SHIB
SOL
TRX
MATIC
TON
*/

/*
{
    "ramzinex": {
        "btc": {
            "usdt_buy": 1231321,
            "usdt_sell": 132142,
            "irr_buy": 13231421,
            "irr_sell": 124141
        },
        "eth": {
            "usdt_buy": 1231321,
            "usdt_sell": 132142,
            "irr_buy": 13231421,
            "irr_sell": 124141
        }
    },
    "nobitex": {
        "btc": {
            "usdt_buy": 1231321,
            "usdt_sell": 132142,
            "irr_buy": 13231421,
            "irr_sell": 124141
        },
        "eth": {
            "usdt_buy": 1231321,
            "usdt_sell": 13214142,
            "irr_buy": 13231421,
            "irr_sell": 124141
        }
    },
    "bitpin": {
        "btc": {
            "usdt_buy": 1321,
            "usdt_sell": 132142,
            "irr_buy": 13231421,
            "irr_sell": 124141
        },
        "eth": {
            "usdt_buy": 1231321,
            "usdt_sell": 132142,
            "irr_buy": 13231421,
            "irr_sell": 124141
        }
    }
}
*/
