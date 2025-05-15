const API_KEY = 'S6YsEWf484ZrbOFrIVqU92AGsBlpMX8MomXebcBPmzUw9Wk8lhc1kKOV';
const API_URL = 'https://api.pexels.com/v1/search';
const DEFAULT_IMAGE = '/food-default.png';

/**
 * Fetches a food image URL from Pexels for a given food name.
 * @param {string} foodName - The food name to search for.
 * @returns {Promise<string>} - The image URL or the default image if not found.
 */
export async function fetchFoodImage(foodName) {
  try {
    const response = await fetch(`${API_URL}?query=${encodeURIComponent(foodName)}&per_page=1`, {
      headers: {
        Authorization: API_KEY,
      },
    });
    if (!response.ok) throw new Error('Pexels API error');
    const data = await response.json();
    if (data.photos && data.photos.length > 0) {
      // Use the medium or small size for thumbnails
      return data.photos[0].src.medium || data.photos[0].src.small || data.photos[0].src.original;
    }
    return DEFAULT_IMAGE;
  } catch (err) {
    return DEFAULT_IMAGE;
  }
} 