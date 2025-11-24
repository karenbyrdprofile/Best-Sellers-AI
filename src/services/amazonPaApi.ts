
/**
 * Service to fetch Real-Time Amazon Product Data via our custom Node.js Backend.
 * This requires the local server to be running on port 3000.
 */

const BACKEND_API_URL = 'http://localhost:3000/api/search';

export interface AmazonProduct {
  asin: string;
  title: string;
  brand?: string;
  url: string;
  image?: string;
  price: string;
  features: string[];
  isPrime: boolean;
}

export const searchAmazonProducts = async (keyword: string): Promise<AmazonProduct[]> => {
  try {
    // 1. Attempt to call the local backend
    const response = await fetch(BACKEND_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ keyword }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.warn('Backend API Error:', errorData.error || response.statusText);
      return [];
    }

    const data = await response.json();
    return data.products || [];

  } catch (error) {
    // 2. Fail gracefully if backend is not running
    // This ensures the app continues to work using standard AI generation even if the server is down.
    console.log('Amazon Backend not reachable (This is expected if you haven\'t started the node server). Falling back to AI generation.');
    return [];
  }
};