
import express from 'express';
import http from 'http';

const app = express();
const PORT = 5000;

app.use(express.json());

app.listen(PORT, () => {
  console.log(`Server listening on ${PORT}`);
});

async function fetchAsync (url) {
    let response = await fetch(url);
    let data = await response.json();
    return data;
}

var table = Object();
const markets = [
    "IRR",
    "USDT",
    "BTC",
    "ETH",
    "DOGE",
    "SHIB",
    "SOL",
    "TRX",
    "MATIC",
    "TON"
];
const exchangeMarkets = ["ramzinex", "nobitex", "bitpin"];

function makeTemplate() {
  exchangeMarkets.forEach(e => {
    table[e] = Object();
    markets.forEach(m => {
        table[e][m] = Object();
    });
  });
}


app.get('/', (req, res) => {
//   table.nobitex = Object();
//   table.BTC = Object();
//   table[0].name = 'ramzinex';
//   const response = await fetchAsync('https://publicapi.ramzinex.com/exchange/api/v1.0/exchange/pairs');
//   table[0].exchangeRates = response.data.map((obj) => obj.buy);
//   res.send(table);
    makeTemplate();
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
        "BTC": {
            "USDT-buy": 1231321,
            "USDT-sell": 132142,
            "IRR-buy": 13231421,
            "IRR-sell": 124141
        },
        "ETH": {
            "USDT-buy": 1231321,
            "USDT-sell": 132142,
            "IRR-buy": 13231421,
            "IRR-sell": 124141
        }
    },
    "nobitex": {
        "BTC": {
            "USDT-buy": 1231321,
            "USDT-sell": 132142,
            "IRR-buy": 13231421,
            "IRR-sell": 124141
        },
        "ETH": {
            "USDT-buy": 1231321,
            "USDT-sell": 13214142,
            "IRR-buy": 13231421,
            "IRR-sell": 124141
        }
    },
    "bitpin": {
        "BTC": {
            "USDT-buy": 1321,
            "USDT-sell": 132142,
            "IRR-buy": 13231421,
            "IRR-sell": 124141
        },
        "ETH": {
            "USDT-buy": 1231321,
            "USDT-sell": 132142,
            "IRR-buy": 13231421,
            "IRR-sell": 124141
        }
    }
}
*/
