const axios = require('axios');

const API_KEY = 'b1b3b7f8-71bd-46fa-bab0-146493fd3366'; // Reemplaza con tu API Key
const BASE_URL = 'http://localhost:3000';

async function testAllApis() {
  console.log('🚀 Probando todas las APIs...\n');

  try {
    // 1. Health Check
    console.log('1️⃣ Health Check:');
    const health = await axios.get(`${BASE_URL}/health`);
    console.log(`   ✅ ${health.data.status} - Uptime: ${health.data.uptime}s\n`);

    // 2. Productos Públicos
    console.log('2️⃣ Productos Públicos:');
    const products = await axios.get(`${BASE_URL}/api/public/products`);
    console.log(`   ✅ Total productos: ${products.data.total}\n`);

    // 3. Categorías
    console.log('3️⃣ Categorías:');
    const categories = await axios.get(`${BASE_URL}/api/public/products/categories`);
    console.log(`   ✅ Categorías: ${categories.data.categories.join(', ')}\n`);

    // 4. Test Scraper (requiere API Key)
    console.log('4️⃣ Test Scraper:');
    try {
      const scraped = await axios.get(`${BASE_URL}/web-scraping/test-scrape`, {
        headers: { 'x-api-key': API_KEY }
      });
      console.log(`   ✅ Productos obtenidos: ${scraped.data.data.total}\n`);
    } catch (error) {
      console.log(`   ❌ Error: ${error.response?.status} - ${error.response?.data?.message || error.message}\n`);
    }

    // 5. Sincronizar (requiere API Key)
    console.log('5️⃣ Sincronizar:');
    try {
      const sync = await axios.post(`${BASE_URL}/web-scraping/sync`, {}, {
        headers: { 'x-api-key': API_KEY }
      });
      console.log(`   ✅ ${sync.data.message}\n`);
    } catch (error) {
      console.log(`   ❌ Error: ${error.response?.status} - ${error.response?.data?.message || error.message}\n`);
    }

    // 6. Logs (requiere API Key)
    console.log('6️⃣ Logs:');
    try {
      const logs = await axios.get(`${BASE_URL}/api/logs`, {
        headers: { 'x-api-key': API_KEY }
      });
      console.log(`   ✅ Últimos ${logs.data.length} registros\n`);
    } catch (error) {
      console.log(`   ❌ Error: ${error.response?.status} - ${error.response?.data?.message || error.message}\n`);
    }

  } catch (error) {
    console.error('❌ Error general:', error.message);
  }
}

testAllApis();