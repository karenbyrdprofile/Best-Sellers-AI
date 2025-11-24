const express = require('express');
const cors = require('cors');
const path = require('path');
const ProductAdvertisingAPIv1 = require('paapi5-nodejs-sdk');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Enable CORS for ALL origins
app.use(cors({
  origin: '*', 
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type', 'x-amazon-access-key', 'x-amazon-secret-key', 'x-amazon-partner-tag']
}));

app.use(express.json());

// Serve Static Frontend Files (Expects 'dist' folder to be inside 'server' folder for cPanel)
app.use(express.static(path.join(__dirname, 'dist')));

// Health Check Route
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'online', 
    service: 'Amazon PA-API Proxy'
  });
});

// Search Endpoint
app.post('/api/search', async (req, res) => {
  try {
    const { keyword } = req.body;
    
    // Accept keys from headers (Client Provided) OR Environment Variables (Server Configured)
    const accessKey = req.headers['x-amazon-access-key'] || process.env.AMAZON_ACCESS_KEY;
    const secretKey = req.headers['x-amazon-secret-key'] || process.env.AMAZON_SECRET_KEY;
    const partnerTag = req.headers['x-amazon-partner-tag'] || process.env.AMAZON_PARTNER_TAG || 'samsulalam08-20';
    
    if (!keyword) {
      return res.status(400).json({ error: 'Keyword is required' });
    }

    if (!accessKey || !secretKey) {
       console.error("❌ Missing API Keys");
       return res.status(500).json({ error: 'Missing Amazon API Keys. Configure them in Settings or .env file.' });
    }

    console.log(`🔍 Searching Amazon for: "${keyword}"`);

    // DYNAMIC CLIENT CONFIGURATION
    // Note: paapi5-nodejs-sdk uses a singleton 'ApiClient.instance'.
    // We update it per request to support dynamic keys from the client.
    const client = ProductAdvertisingAPIv1.ApiClient.instance;
    client.accessKey = accessKey;
    client.secretKey = secretKey;
    client.host = 'webservices.amazon.com'; // US Region default
    client.region = 'us-east-1';

    const api = new ProductAdvertisingAPIv1.DefaultApi();

    const searchItemsRequest = new ProductAdvertisingAPIv1.SearchItemsRequest();
    searchItemsRequest['PartnerTag'] = partnerTag;
    searchItemsRequest['PartnerType'] = 'Associates';
    searchItemsRequest['Keywords'] = keyword;
    searchItemsRequest['SearchIndex'] = 'All';
    searchItemsRequest['ItemCount'] = 5; 
    searchItemsRequest['Resources'] = [
      'Images.Primary.Large',
      'ItemInfo.Title',
      'ItemInfo.Features',
      'ItemInfo.ByLineInfo', 
      'Offers.Listings.Price',
      'Offers.Listings.DeliveryInfo.IsPrime',
      'BrowserNodeInfo.BrowseNodes'
    ];

    const data = await new Promise((resolve, reject) => {
      api.searchItems(searchItemsRequest, (error, data) => {
        if (error) {
          reject(error);
        } else {
          resolve(data);
        }
      });
    });

    let products = [];
    if (data.SearchResult && data.SearchResult.Items) {
        products = data.SearchResult.Items.map(item => ({
          asin: item.ASIN,
          title: item.ItemInfo.Title.DisplayValue,
          brand: item.ItemInfo.ByLineInfo?.Brand?.DisplayValue || '',
          url: item.DetailPageURL,
          image: item.Images?.Primary?.Large?.URL,
          price: item.Offers?.Listings?.[0]?.Price?.DisplayAmount || 'Check Price',
          features: item.ItemInfo.Features?.DisplayValues || [],
          isPrime: item.Offers?.Listings?.[0]?.DeliveryInfo?.IsPrime || false
        }));
    }

    console.log(`✅ Found ${products.length} products`);
    res.json({ products });

  } catch (error) {
    console.error('❌ Amazon API Error:', error);
    const errorMessage = error.message || JSON.stringify(error);
    
    if (errorMessage.includes('AccessDenied')) {
       return res.status(403).json({ error: 'Amazon API Access Denied. Check Keys or Account Status.' });
    }
    if (errorMessage.includes('TooManyRequests')) {
        return res.status(429).json({ error: 'Amazon API Rate Limit Exceeded' });
    }

    res.status(500).json({ 
        error: 'Failed to fetch products from Amazon',
        details: errorMessage
    });
  }
});

// CATCH-ALL ROUTE: Serve React App for any non-API request
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`\n🚀 Server running at http://localhost:${PORT}`);
});