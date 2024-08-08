
const express = require("express");
const mg = require("mongoose")

const app   = express();
const PORT  = process.env.PORT;
const DB_IP = process.env.DB_IP 

const markets = require("../config.json").markets;
const brokers = require("../config.json").brokers;

app.use(express.json());

const priceSchema = new mg.Schema({
    broker: String,
    name: String,
    irr_buy: Number,
    irr_sell: Number,
    usdt_buy: Number,
    usdt_sell: Number
});
const arbitrageSchema = new mg.Schema({
    currency_name: String,
    quote_currency: String,
    broker_buy: String,
    broker_sell: String,
    price_buy: Number,
    price_sell: Number, 
    arb_buy_sell: Number,
    arb_sell_buy: Number
});

const Price = mg.model("price", priceSchema);
const Arbitrage = mg.model("arbitrage", arbitrageSchema);

app.listen(PORT, async () => {
    console.log(`${printTime()} Server listening on ${PORT}`);
    await mg.connect(DB_IP + "/cache");
    console.log(`${printTime()} Connected to database: ${DB_IP}`);
    await update();
});

setInterval(update, 60*1000);

async function fetchAsync (url) {
    let response = await fetch(url);
    return response;
}

function pad(n, width, z) {
  z = z || '0';
  n = n + '';
  return n.length >= width ? n : new Array(width - n.length + 1).join(z) + n;
}

function printTime() {
    const now = new Date();
    return `[${pad(now.getHours(), 2)}:${pad(now.getMinutes(), 2)}:${pad(now.getSeconds(), 2)}]`
}

async function update() {
    const startTime = Date.now();
    console.log(`${printTime()} Updating DB`);
    
    // Nobitex
    for (let i = 0; i < markets.length; i++) {
        const currency = markets[i];
        const curr_irr_raw = await fetchAsync(`${brokers.nobitex}?srcCurrency=${currency}&dstCurrency=rls`);
        const curr_usdt_raw = await fetchAsync(`${brokers.nobitex}?srcCurrency=${currency}&dstCurrency=usdt`);
	if(!curr_irr_raw.ok || !curr_usdt_raw.ok) {
	    continue;
	}
	await Price.deleteMany({broker: 'nobitex', name: currency}).exec().catch((err) => {
            console.error(`[DB] Deleting prices failed: ${err}`);
    	});
	const curr_irr = (await curr_irr_raw.json()).stats[`${currency}-rls`];
	const curr_usdt = (await curr_usdt_raw.json()).stats[`${currency}-usdt`];

        var price = new Price({
            broker: "nobitex",
            name: currency,
            irr_buy: curr_irr ? parseFloat(curr_irr.bestBuy) : 0,
            irr_sell: curr_irr ? parseFloat(curr_irr.bestSell) : 0,
            usdt_buy: curr_usdt ? parseFloat(curr_usdt.bestBuy) : 0,
            usdt_sell: curr_usdt ? parseFloat(curr_usdt.bestSell) : 0
        });

        if (currency == "shib") {
            price.irr_buy  *= 0.001;
            price.irr_sell *= 0.001;
            price.usdt_buy *= 0.001;
            price.usdt_sell *= 0.001;
        }
        
        await price.save();
    }

    // Ramzinex
    const res_raw = await fetchAsync(`${brokers.ramzinex}`);
    if(res_raw.ok) {
	const response = (await res_raw.json()).data;
	await Price.deleteMany({broker: 'ramzinex'}).exec().catch((err) => {
            console.error(`[DB] Deleting prices failed: ${err}`);
    	});
    	for(let i = 0; i < markets.length; i++) {
            var currency = markets[i];
        
            if (currency == "shib") currency = "100shib";
            if (currency == "ton") currency = "toncoin";
        
            let price = new Price({
                broker: "ramzinex",
                name: currency,
                irr_buy: response[`${currency}irr`] ? response[`${currency}irr`].buy : 0,
                irr_sell: response[`${currency}irr`] ? response[`${currency}irr`].sell : 0,
                usdt_buy: response[`${currency}usdt`] ? response[`${currency}usdt`].buy : 0,
                usdt_sell: response[`${currency}usdt`] ? response[`${currency}usdt`].sell : 0
            });
            if (currency == "100shib") {
                price.name = "shib";
                price.irr_buy *=  0.01;
                price.irr_sell *= 0.01;
                price.usdt_buy *= 0.01;
                price.usdt_buy *= 0.01;
            }
            if (currency == "toncoin") price.name = "ton";
        
            await price.save();
    	}
    }

    // Bitpin
    const res_raw2 = await fetchAsync(`${brokers.bitpin}`);
    if(res_raw2.ok) {
    	const response2 = (await res_raw2.json());
	await Price.deleteMany({broker: 'bitpin'}).exec().catch((err) => {
            console.error(`[DB] Deleting prices failed: ${err}`);
    	});
        for(let i = 0; i < response2.results.length; i++) {
            const currency = response2.results[i];
            if (markets.indexOf(currency.code.toLowerCase()) == -1) continue;
            const price = new Price({
                broker: "bitpin",
                name: currency.code.toLowerCase(),
                irr_buy: currency.price_info.price ? parseFloat(currency.price_info.price) * 10 : 0,
                irr_sell: currency.price_info.price ? parseFloat(currency.price_info.price) * 10 : 0,
                usdt_buy: currency.price_info_usdt.price ? parseFloat(currency.price_info_usdt.price) : 0,
                usdt_sell: currency.price_info_usdt.price ? parseFloat(currency.price_info_usdt.price) : 0
            });
            await price.save();
        }
    }

    // Calculate and Cache Arbitrage
    await Arbitrage.deleteMany({}).exec().catch((err) => {
        console.error(`[DB] Deleting arbitrages failed: ${err}`);
    });
    for (let i = 0; i < markets.length; i++) {
        const currency = markets[i];
        
        const usdt_sell = (await Price.find({ name: currency, usdt_sell: { $gt: 0} }).sort("-usdt_sell").limit(1))[0];
        const usdt_buy = (await Price.find({ name: currency, usdt_buy: { $gt: 0} }).sort("usdt_buy").limit(1))[0];
        const irr_sell = (await Price.find({ name: currency, irr_sell: { $gt: 0} }).sort("-irr_sell").limit(1))[0];
        const irr_buy = (await Price.find({ name: currency, irr_buy: { $gt: 0} }).sort("irr_buy").limit(1))[0];
        
        if (usdt_buy != null && usdt_sell != null) {
            const arb = new Arbitrage({
                currency_name: currency,
                quote_currency: "usdt",
                broker_buy: usdt_buy.broker,
                broker_sell: usdt_sell.broker,
                price_buy: usdt_buy.usdt_buy,
                price_sell: usdt_sell.usdt_sell,
                arb_buy_sell: (usdt_sell.usdt_sell - usdt_buy.usdt_buy)/usdt_buy.usdt_buy,
                arb_sell_buy: -(usdt_buy.usdt_buy - usdt_sell.usdt_sell)/usdt_sell.usdt_sell
            });
            await arb.save();
        }
        if (irr_buy != null && irr_sell != null) {
            const arb = new Arbitrage({
                currency_name: currency,
                quote_currency: "irr",
                broker_buy: irr_buy.broker,
                broker_sell: irr_sell.broker,
                price_buy: irr_buy.irr_buy,
                price_sell: irr_sell.irr_sell,
                arb_buy_sell: (irr_sell.irr_sell - irr_buy.irr_buy)/irr_buy.irr_buy,
                arb_sell_buy: -(irr_buy.irr_buy - irr_sell.irr_sell)/irr_sell.irr_sell
            });
            await arb.save();
        }
    }
    const elapsedTime = ((Date.now() - startTime)/1000).toFixed(3);
    console.log(`${printTime()} Update finished. Took ${elapsedTime}s`);
}

app.post('/update', async (req, res) => {
    await update();
    res.sendStatus(200);
});

app.get('/', async (req, res) => {
    console.log(`${printTime()} GET / request from ${req.ip}`);
    
    var table = Object();
    const brokers_arr = Object.keys(brokers);
    for (let i = 0; i < brokers_arr.length; i++) {
        var broker = brokers_arr[i];
        table[`${broker}`] = Object();
        for (let j = 0; j < markets.length; j++) {
            var currency = markets[j];
            table[`${broker}`][`${currency}`]= Object();  
        }
    } 
    const prices = await Price.find({});
    for (let i = 0; i < prices.length; i++) {
        const price = prices[i];
        table[price.broker][price.name].irr_buy = price.irr_buy;
        table[price.broker][price.name].irr_sell = price.irr_sell;
        table[price.broker][price.name].usdt_buy = price.usdt_buy;
        table[price.broker][price.name].usdt_sell = price.usdt_sell;
    }
    
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.send(table);
});


app.get('/arb', async (req, res) => {
    console.log(`${printTime()} GET /arb request from ${req.ip}`);
    res.setHeader("Access-Control-Allow-Origin", "*");

    if (req.query.currency == null) {
    	res.send(await Arbitrage.find({}));
    } else {
	if (markets.indexOf(req.query.currency) == -1) {
	    res.sendStatus(400);
	} else {
	    res.send(await Arbitrage.find({ currency_name: req.query.currency }));
	}
    }
})
