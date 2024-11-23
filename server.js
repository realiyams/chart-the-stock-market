const express = require('express');
const cors = require('cors');
const { createServer } = require('http'); // Untuk membuat server HTTP
const { Server } = require('socket.io'); // Socket.IO server
require('dotenv').config();

const app = express();
const PORT = 3000;

// Parsing JSON dan URL-encoded request body
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Middleware
app.use(cors());
app.use(express.json());

// Set EJS as the template engine
app.set('view engine', 'ejs');
app.use(express.static('public')); // For serving static files like JS, CSS

// Create HTTP server
const httpServer = createServer(app);

// Socket.IO setup
const io = new Server(httpServer, {
  cors: {
    origin: '*', // Ganti dengan origin yang valid jika diperlukan
    methods: ['GET', 'POST'],
  },
});

// Handle WebSocket connections
io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);

  // Mengirim pesan ke klien yang baru terhubung
  socket.emit('message', 'Welcome to the stock data service!');

  // Handle disconnect
  socket.on('disconnect', () => {
    console.log('A user disconnected:', socket.id);
  });
});

// Middleware to inject io into req
app.use((req, res, next) => {
  console.log('Injecting io:', io !== undefined); // Harus true
  req.io = io; // Tambahkan instance io ke req
  next();
});

// Routes
const stockRoutes = require('./routes/stock');
app.use('/api/stocks', stockRoutes);

// Home route to render EJS
app.get('/', (req, res) => {
  res.render('index', { stockData: null });
});

// Start Server
httpServer.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
