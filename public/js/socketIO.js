// Hubungkan ke server Socket.IO (sesuaikan URL server jika bukan localhost)
const socket = io('http://localhost:3000');
let socketID

// Event untuk koneksi
socket.on('connect', () => {
  console.log('Connected to Socket.IO server');
  console.log(socket);
  socketID = socket.id;
});

// Dengarkan event `stockDataUpdated` dari server
socket.on('stockDataUpdated', (stock) => {
  console.log('Received updated stock data:', stock);
  const { symbol, data, emitterSocketID } = stock;

  console.log(socketID)
  console.log(emitterSocketID)
  if (emitterSocketID !== socketID) {
    if (data.results && data.results.length > 0) {
      const labels = data.results.map((item) => new Date(item.t).toLocaleDateString());
      const prices = data.results.map((item) => item.c);

      // Cek apakah chartInstance sudah ada
      if (!chartInstance) {
        chartData.labels = labels; // Set labels hanya saat pertama kali chart dibuat
      }

      // Dataset baru untuk simbol ini
      const newDataset = {
        label: `${symbol} Closing Prices`,
        data: prices,
        borderColor: generateRandomColor(),
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
        borderWidth: 1,
        tension: 0.3,
      };

      // Tambahkan dataset baru ke chartData
      chartData.datasets.push(newDataset);

      // Hanya buat chart baru jika chartInstance belum ada
      if (!chartInstance) {
        console.log('Creating new chart instance');
        chartInstance = new Chart(ctx, {
          type: 'line',
          data: chartData,
          options: {
            responsive: true,
            plugins: {
              legend: {
                position: 'top',
              },
              title: {
                display: true,
                text: 'Stock Market Data (Multiple Symbols)',
              },
            },
          },
        });
      } else {
        // Jika chart sudah ada, hanya update chart yang sudah ada
        console.log('Updating existing chart');
        chartInstance.update();
      }

      // Menambahkan tombol untuk menghapus dataset
      const datasetItem = document.createElement('div');
      datasetItem.className = 'dataset-item';
      datasetItem.innerHTML = `
        <span>${newDataset.label}</span>
        <button class="remove-dataset" data-symbol="${symbol}">Remove</button>
      `;
      datasetList.appendChild(datasetItem);

      datasetItem.querySelector('.remove-dataset').addEventListener('click', (e) => {
        const symbolToRemove = e.target.dataset.symbol;
        removeDataset(symbolToRemove);
      });
    }
  }
});

// Mendengarkan event 'stockDeleted' dari server
socket.on('stockDeleted', (stock) => {
  const { symbol, emitterSocketID } = stock;

  console.log(socketID)
  console.log(emitterSocketID)

  if (emitterSocketID !== socketID) {
    // Cari dataset dengan simbol yang sama
    const datasetIndex = chartData.datasets.findIndex((dataset) =>
      dataset.label.startsWith(symbol)
    );

    if (datasetIndex !== -1) {
      // Hapus dataset dari chartData
      chartData.datasets.splice(datasetIndex, 1);

      // Hapus item dari daftar dataset di UI
      const datasetItem = document.querySelector(`button[data-symbol="${symbol}"]`).parentElement;
      datasetItem.remove();

      // Update chart
      chartInstance.update();
      console.log(`Stock with symbol ${symbol} has been deleted from all clients.`);
    }
  }
});

// Event untuk diskoneksi
socket.on('disconnect', () => {
  console.log('Disconnected from server');
});
