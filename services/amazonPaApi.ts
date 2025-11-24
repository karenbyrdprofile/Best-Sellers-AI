
/**
 * Service to fetch Real-Time Amazon Product Data via our custom Node.js Backend.
 * Automatically switches between Localhost and Production URLs.
 */

// Helper to determine the correct Backend URL dynamically
const getBackendUrl = () => {
  // 1. Check if a specific URL is configured in index.html (e.g. Render URL)
  // This allows you to point the dist build to a specific backend without rebuilding
  const configuredUrl = (window as any).process?.env?.BACKEND_URL;
  
  // If explicitly set to a valid URL, use it.
  if (configuredUrl && configuredUrl.trim() !== '' && configuredUrl.includes('http')) {
     return configuredUrl.replace(/\/$/, '');
  }

  // 2. Automatic Detection based on where the browser is running
  if (typeof window !== 'undefined') {
      const hostname = window.location.hostname;
      if (hostname === 'localhost' || hostname === '127.0.0.1') {
         // We are running locally, so look for the server on port 3000
         return 'http://localhost:3000';
      }
  }

  // 3. Production Fallback
  // If no URL is set and we are on a live domain, we return empty string.
  // This results in a relative path request ("/api/search"), which works if
  // you are hosting frontend and backend on the same domain/server.
  return ''; 
};

const BASE_URL = getBackendUrl();
const BACKEND_API_URL = `${BASE_URL}/api/search`;
const HEALTH_CHECK_URL = `${BASE_URL}/`;

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

// Check if we can talk to the backend with a timeout
export const checkBackendConnection = async (): Promise<boolean> => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 2000);

  try {
    // If URL is empty and we are local, fail fast (unless on same origin)
    if (BASE_URL === '' && window.location.hostname !== 'localhost') {
        // Allow relative path attempt
    }
    
    // Simple fetch to root or health endpoint
    const response = await fetch(HEALTH_CHECK_URL, { 
        method: 'GET',
        signal: controller.signal
    });
    clearTimeout(timeoutId);
    return response.ok;
  } catch (e) {
    clearTimeout(timeoutId);
    return false;
  }
};

const getAmazonKeys = () => {
    return {
        accessKey: localStorage.getItem('amazon_access_key') || '',
        secretKey: localStorage.getItem('amazon_secret_key') || '',
        partnerTag: localStorage.getItem('amazon_partner_tag') || ''
    };
};

export const searchAmazonProducts = async (keyword: string): Promise<AmazonProduct[]> => {
  // Setup timeout to prevent hanging the AI response
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 3000); // 3s timeout

  try {
    const keys = getAmazonKeys();
    
    // Prepare Headers
    const headers: any = {
      'Content-Type': 'application/json',
    };
    
    // Inject Keys if present
    if (keys.accessKey) headers['x-amazon-access-key'] = keys.accessKey;
    if (keys.secretKey) headers['x-amazon-secret-key'] = keys.secretKey;
    if (keys.partnerTag) headers['x-amazon-partner-tag'] = keys.partnerTag;

    const response = await fetch(BACKEND_API_URL, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify({ keyword }),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.warn(`Backend API Error (${BACKEND_API_URL}):`, errorData.error || response.statusText);
      return [];
    }

    const data = await response.json();
    return data.products || [];

  } catch (error) {
    clearTimeout(timeoutId);
    // Fail gracefully if backend is not running/reachable/timed out
    // This ensures the AI continues to work using standard generation even if Amazon connection fails.
    console.log(`Amazon Backend not reachable at ${BACKEND_API_URL} or timed out. Falling back to AI generation.`);
    return [];
  }
};
