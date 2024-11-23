const express = require('express');
const axios = require('axios');
const { io } = require('../server');
const { Stock } = require('../models'); // Import model Stock
const router = express.Router();

// API Endpoint: Get Stock Data with Date Range
router.get('/:symbol', async (req, res) => {
  const { symbol } = req.params;
  const { from, to, socketID } = req.query; // Query params for date range

  console.log(socketID);

  const apiKey = process.env.POLYGON_API_KEY;

  // Validate query params
  if (!from || !to) {
    return res.status(400).json({ error: 'Missing required query parameters: from, to' });
  }

  // Pastikan simbol saham uppercase
  const uppercaseSymbol = symbol.toUpperCase();

  // URL API Polygon
  const url = `https://api.polygon.io/v2/aggs/ticker/${uppercaseSymbol}/range/1/day/${from}/${to}?adjusted=true&sort=asc&apiKey=${apiKey}`;

  try {
    // Cek apakah simbol sudah ada di database
    const existingStock = await Stock.findOne({ where: { symbol: uppercaseSymbol } });

    // Fetch data dari API
    const response = await axios.get(url);

    if (response.data.resultsCount !== 0) {
      if (!existingStock) {
        // Jika tidak ada, simpan ke database
        await Stock.create({ symbol: uppercaseSymbol });
        console.log(`Symbol ${uppercaseSymbol} saved to database.`);
      } else {
        console.log(`Symbol ${uppercaseSymbol} already exists in database.`);
      }


      console.log('io available in req:', req.io !== undefined); // Harus true
      // Emit event ke semua klien
      if (req.io) {
        req.io.emit('stockDataUpdated', { symbol: uppercaseSymbol, data: response.data, emitterSocketID: socketID });
        console.log(`Stock data for ${uppercaseSymbol} emitted to clients.`);
      } else {
        console.warn('Socket.IO instance not available in req.');
      }
      // console.log(response.data); // Debugging log
      console.log(`Stock data for ${uppercaseSymbol} emitted to clients.`);
      res.json(response.data); // Kirim data ke klien
    } else
      res.status(404).json({ error: `Failed to fetch  stock data ${symbol} not found` });
  } catch (error) {
    console.error(`Error fetching stock data for ${uppercaseSymbol}:`, error.message);
    res.status(500).json({ error: 'Failed to fetch stock data' });
  }
});

// API Endpoint: Load All Stocks and Fetch API Data
router.get('/data/load-all', async (req, res) => {
  const { from, to } = req.query; // Query params for date range
  const apiKey = process.env.POLYGON_API_KEY;

  try {
    // Ambil semua simbol saham dari database
    const stocks = await Stock.findAll();
    console.log(stocks)
    if (stocks.length === 0) {
      return res.status(404).json({ error: 'No stocks found in the database.' });
    }

    const stockData = []; // Untuk menyimpan data hasil API call

    // Iterasi setiap simbol saham
    for (const stock of stocks) {
      const uppercaseSymbol = stock.symbol.toUpperCase();

      const url = `https://api.polygon.io/v2/aggs/ticker/${uppercaseSymbol}/range/1/day/${from}/${to}?adjusted=true&sort=asc&apiKey=${apiKey}`;

      try {
        // Fetch data dari API untuk setiap simbol
        const response = await axios.get(url);

        console.log(`Fetched data for ${uppercaseSymbol}`); // Debugging log
        stockData.push({ symbol: uppercaseSymbol, data: response.data });
      } catch (error) {
        console.error(`Error fetching data for ${uppercaseSymbol}:`, error.message);
        stockData.push({ symbol: uppercaseSymbol, error: 'Failed to fetch data: ' + error.message });
      }
    }

    // Kirim hasil ke klien
    res.json(stockData);
  } catch (error) {
    console.error('Error loading stocks from database:', error.message);
    res.status(500).json({ error: 'Failed to load stocks from database' });
  }
});

// API Endpoint: Delete Stock by Symbol
router.delete('/:symbol', async (req, res) => {
  const { symbol, socketID } = req.params;

  try {
    // Cari dan hapus data berdasarkan simbol
    const deletedStock = await Stock.destroy({
      where: { symbol: symbol.toUpperCase() }, // Pastikan simbol uppercase
    });

    if (deletedStock) {
      // Emit ke semua klien bahwa data telah dihapus
      req.io.emit('stockDeleted', { symbol: symbol, emitterSocketID: socketID });
      console.log(`Stock ${symbol} deleted from database and emitted to clients.`);

      return res.json({ message: `Stock ${symbol} deleted successfully.` });
    } else {
      res.status(404).json({ error: `Stock with symbol ${symbol} not found.` });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to delete stock data.' });
  }
});

module.exports = router;
