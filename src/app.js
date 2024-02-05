
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

var table = [];

app.get('/', async (req, res) => {
  table[0] = Object();
  table[0].name = 'ramzinex';
  const response = await fetchAsync('https://publicapi.ramzinex.com/exchange/api/v1.0/exchange/pairs');
  table[0].exchangeRates = response.data.map((obj) => obj.buy / 10);
  res.send(table);
});
