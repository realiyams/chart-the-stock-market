const form = document.getElementById('stock-form');
const ctx = document.getElementById('stockChart').getContext('2d');
const datasetList = document.getElementById('dataset-list');
let chartInstance = null; // Referensi chart global
let chartData = {
  labels: [],
  datasets: [],
};

form.addEventListener('submit', async (e) => {
  e.preventDefault();

  const symbol = document.getElementById('symbol').value.toUpperCase(); // Uppercase untuk memastikan valid

  // Mendapatkan tanggal kemarin dan sebulan yang lalu
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  const lastMonth = new Date(yesterday);
  lastMonth.setMonth(yesterday.getMonth() - 1);

  // Format tanggal dalam format YYYY-MM-DD
  const from = lastMonth.toISOString().split('T')[0];
  const to = yesterday.toISOString().split('T')[0];

  try {
    const response = await fetch(`/api/stocks/${symbol}?from=${from}&to=${to}&socketID=${socketID}`);
    const data = await response.json();

    if (data.results && data.results.length > 0) {
      const labels = data.results.map((item) => new Date(item.t).toLocaleDateString());
      const prices = data.results.map((item) => item.c);

      // Jika chart belum ada, buat chart baru
      if (!chartInstance) {
        chartData.labels = labels;
      }

      // Menambahkan dataset baru ke chartData
      const newDataset = {
        label: `${symbol} Closing Prices`,
        data: prices,
        borderColor: generateRandomColor(),
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
        borderWidth: 1,
        tension: 0.3,
      };

      chartData.datasets.push(newDataset);

      // Tambahkan item ke daftar dataset dengan tombol hapus
      const datasetItem = document.createElement('div');
      datasetItem.className = 'dataset-item';
      datasetItem.innerHTML = `
        <span>${newDataset.label}</span>
        <button class="remove-dataset" data-symbol="${symbol}">Remove</button>
      `;
      datasetList.appendChild(datasetItem);

      // Jika chartInstance belum ada, buat chart pertama kali
      if (!chartInstance) {
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
        // Jika chart sudah ada, update chart dengan dataset baru
        chartInstance.update();
      }

      // Tambahkan event listener untuk tombol hapus
      datasetItem.querySelector('.remove-dataset').addEventListener('click', (e) => {
        const symbolToRemove = e.target.dataset.symbol;
        removeDataset(symbolToRemove);
      });
    } else {
      alert('No data available for the given range.');
    }
  } catch (error) {
    console.error(error);
    alert('Failed to fetch stock data.');
  }
});

async function removeDataset(symbol) {
  const datasetIndex = chartData.datasets.findIndex((dataset) =>
    dataset.label.startsWith(symbol)
  );

  if (datasetIndex !== -1) {
    try {
      // Panggil API untuk menghapus dari database
      const response = await fetch(`/api/stocks/${symbol}`, {
        method: 'DELETE',
        body: {socketID}
      });
      console.log('get response')

      if (response.ok) {
        // Hapus dataset dari chartData
        chartData.datasets.splice(datasetIndex, 1);
        console.log('splice database')

        // Hapus item dari daftar dataset
        const datasetItem = document.querySelector(`button[data-symbol="${symbol}"]`);
        console.log(datasetItem)
        if (datasetItem && datasetItem.parentElement) {
          datasetItem.parentElement.remove();
          console.log('remove dataset');
        } else {
          console.warn(`Element with symbol ${symbol} not found in DOM.`);
        }

        // Update chart
        chartInstance.update();

        console.log('chartInstance')

        // alert(`Stock with symbol ${symbol} deleted successfully.`);
      } else {
        const errorData = await response.json();
        alert(errorData.error || 'Failed to delete stock from database.');
      }
    } catch (error) {
      console.error(error);
      alert('Failed to delete stock from database.');
    }
  }
}

document.addEventListener('DOMContentLoaded', async () => {
  // Mendapatkan tanggal kemarin dan sebulan yang lalu
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  const lastMonth = new Date(yesterday);
  lastMonth.setMonth(yesterday.getMonth() - 1);

  // Format tanggal dalam format YYYY-MM-DD
  const from = lastMonth.toISOString().split('T')[0];
  const to = yesterday.toISOString().split('T')[0];
  try {
    // Memanggil API untuk mengambil semua data saham
    const response = await fetch(`/api/stocks/data/load-all?from=${from}&to=${to}`);
    const allStocks = await response.json();

    console.log(allStocks);

    // Pastikan ada data yang diterima
    if (allStocks.length > 0) {
      allStocks.forEach(stock => {
        const { symbol, data, error } = stock;

        // Jika data tersedia untuk simbol saham
        if (data.results && data.results.length > 0 && !error) {
          const labels = data.results.map((item) => new Date(item.t).toLocaleDateString());
          const prices = data.results.map((item) => item.c);

          // Jika chart belum ada, buat chart baru
          if (!chartInstance) {
            chartData.labels = labels;
          }

          // Menambahkan dataset baru ke chartData
          const newDataset = {
            label: `${symbol} Closing Prices`,
            data: prices,
            borderColor: generateRandomColor(),
            backgroundColor: 'rgba(75, 192, 192, 0.2)',
            borderWidth: 1,
            tension: 0.3,
          };

          chartData.datasets.push(newDataset);

          // Tambahkan item ke daftar dataset dengan tombol hapus
          const datasetItem = document.createElement('div');
          datasetItem.className = 'dataset-item';
          datasetItem.innerHTML = `
            <span>${newDataset.label}</span>
            <button class="remove-dataset" data-symbol="${symbol}">Remove</button>
          `;
          datasetList.appendChild(datasetItem);

          // Jika chartInstance belum ada, buat chart pertama kali
          if (!chartInstance) {
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
            // Jika chart sudah ada, update chart dengan dataset baru
            chartInstance.update();
          }

          // Tambahkan event listener untuk tombol hapus
          datasetItem.querySelector('.remove-dataset').addEventListener('click', (e) => {
            const symbolToRemove = e.target.dataset.symbol;
            removeDataset(symbolToRemove);
          });
        }
      });
    }
    // else {
    //   alert('No stock data available.');
    // }
  } catch (error) {
    console.error(error);
    // alert('Failed to load all stock data.');
  }
});

// Fungsi untuk menghasilkan warna acak untuk setiap dataset
function generateRandomColor() {
  return `rgba(${Math.floor(Math.random() * 256)}, ${Math.floor(Math.random() * 256)}, ${Math.floor(Math.random() * 256)}, 1)`;
}





