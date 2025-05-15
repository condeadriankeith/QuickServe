// Usage: node src/api/updateMenuImages.js
const fs = require('fs');
const path = require('path');
const { fetch } = require('undici'); // Node 18+ or install undici for fetch
const menuPath = path.resolve(__dirname, '../components/menuData.js');

const API_KEY = 'S6YsEWf484ZrbOFrIVqU92AGsBlpMX8MomXebcBPmzUw9Wk8lhc1kKOV';
const API_URL = 'https://api.pexels.com/v1/search';
const DEFAULT_IMAGE = '/food-default.png';

async function fetchFoodImage(foodName) {
  try {
    const response = await fetch(`${API_URL}?query=${encodeURIComponent(foodName)}&per_page=1`, {
      headers: { Authorization: API_KEY },
    });
    if (!response.ok) throw new Error('Pexels API error');
    const data = await response.json();
    if (data.photos && data.photos.length > 0) {
      return data.photos[0].src.medium || data.photos[0].src.small || data.photos[0].src.original;
    }
    return DEFAULT_IMAGE;
  } catch (err) {
    return DEFAULT_IMAGE;
  }
}

async function updateMenuImages() {
  let menu = require(menuPath).default || require(menuPath);
  for (const category of Object.keys(menu)) {
    for (const item of menu[category]) {
      item.img = await fetchFoodImage(item.name);
      console.log(`Updated: ${item.name} -> ${item.img}`);
    }
  }
  const fileContent =
    '// Auto-updated by updateMenuImages.js\nconst menu = ' +
    JSON.stringify(menu, null, 2) +
    '\n\nexport default menu;\n';
  fs.writeFileSync(menuPath, fileContent);
  console.log('Menu images updated!');
}

updateMenuImages(); 