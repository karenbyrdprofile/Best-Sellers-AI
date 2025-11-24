

import { AFFILIATE_TAG } from "../constants";

/**
 * Ensures any Amazon link has the correct affiliate tag and required tracking parameters.
 * Automatically adds:
 * - tag: samsulalam08-20
 * - linkCode: ll1 (for products) or ll2 (for search)
 * - language: en_US
 * - ref_: as_li_ss_tl
 * 
 * SAFETY FEATURE: Detects fake/placeholder ASINs (e.g. 123456) and converts to search links to prevent 404s.
 */
export const sanitizeUrl = (url: string): string => {
  try {
    // Pre-clean: Replace spaces with + if it's an Amazon search URL
    let cleanUrl = url.trim();
    if (cleanUrl.includes('amazon') && cleanUrl.includes('k=')) {
      cleanUrl = cleanUrl.replace(/ /g, '+');
    }

    const urlObj = new URL(cleanUrl);
    
    // SKIP PROCESSING FOR IMAGE URLS
    // Appending parameters to static image files (jpg, png) or the images-na domain often breaks them
    if (
        cleanUrl.match(/\.(jpg|jpeg|png|gif|webp)$/i) || 
        urlObj.hostname.includes('images-na.ssl-images-amazon.com') ||
        urlObj.hostname.includes('m.media-amazon.com')
    ) {
        return cleanUrl;
    }
    
    // SAFETY CHECK: Detect common AI hallucinations for ASINs (e.g., B07F123456, 12345, 00000)
    // If found, convert to a safe Search URL to avoid 404 pages.
    const path = urlObj.pathname;
    const asinMatch = path.match(/\/(B[A-Z0-9]{9})\b/);
    if (asinMatch) {
        const asin = asinMatch[1];
        // Check for suspicious patterns: "123456", repeated chars "AAAAA", or "ABCDEF"
        if (
            asin.includes('123456') || 
            asin.includes('ABCDEF') || 
            /^(.)\1+$/.test(asin.substring(2)) // Checks for repeated chars like B0AAAAAAA
        ) {
            // Extract potential product name from path to create a search link
            // Path usually looks like /Product-Name/dp/ASIN
            const parts = path.split('/');
            const dpIndex = parts.indexOf('dp');
            if (dpIndex > 0) {
                const productName = parts[dpIndex - 1].replace(/-/g, '+');
                return `https://www.amazon.com/s?k=${productName}&tag=${AFFILIATE_TAG}&linkCode=ll2&language=en_US&ref_=as_li_ss_tl`;
            }
        }
    }

    if (urlObj.hostname.includes('amazon') || urlObj.hostname.includes('amzn')) {
      // 1. Tag (Mandatory)
      urlObj.searchParams.set('tag', AFFILIATE_TAG);
      
      // 2. Encoding (Standard)
      if (!urlObj.searchParams.has('_encoding')) {
        urlObj.searchParams.set('_encoding', 'UTF8');
      }

      // 3. New Requirements matching user example
      // Language
      if (!urlObj.searchParams.has('language')) {
        urlObj.searchParams.set('language', 'en_US');
      }
      
      // Reference
      if (!urlObj.searchParams.has('ref_')) {
        urlObj.searchParams.set('ref_', 'as_li_ss_tl');
      }

      // LinkCode: 'll1' for product pages, 'll2' for others/search
      if (!urlObj.searchParams.has('linkCode')) {
         // Check if it's a product page URL structure
         const isProduct = 
            urlObj.pathname.includes('/dp/') || 
            urlObj.pathname.includes('/gp/') || 
            // Matches /ASIN/ or /ASIN?
            urlObj.pathname.match(/\/([A-Z0-9]{10})(?:\/|\?|$)/);
            
         urlObj.searchParams.set('linkCode', isProduct ? 'll1' : 'll2');
      }
    }
    return urlObj.toString();
  } catch (e) {
    // Fallback for very malformed URLs - try to just append tag and params if possible
    if (url.includes('amazon') && !url.match(/\.(jpg|jpeg|png|gif|webp)$/i)) {
       // Clean spaces in fallback too
       const spaceCleaned = url.replace(/ /g, '+');
       const hasQuery = spaceCleaned.includes('?');
       
       // Build query string if missing
       const params = new URLSearchParams();
       if (!spaceCleaned.includes('tag=')) params.set('tag', AFFILIATE_TAG);
       if (!spaceCleaned.includes('linkCode=')) params.set('linkCode', 'll1'); // Default to ll1 for direct strings
       if (!spaceCleaned.includes('language=')) params.set('language', 'en_US');
       if (!spaceCleaned.includes('ref_=')) params.set('ref_', 'as_li_ss_tl');
       
       const queryString = params.toString();
       if (queryString) {
           return `${spaceCleaned}${hasQuery ? '&' : '?'}${queryString}`;
       }
    }
    return url;
  }
};

/**
 * Extracts a readable product name from an Amazon search URL.
 * Used to populate the wishlist with the actual product name instead of link text (like "Check Price").
 * Returns null if extraction fails.
 */
export const extractProductName = (url: string): string | null => {
  try {
    if (!url.includes('amazon') && !url.includes('amzn')) {
      return null;
    }

    const urlObj = new URL(url);
    
    // 1. Try 'k' parameter (Search results)
    // This is the most common pattern for our AI generated links
    if (urlObj.searchParams.has('k')) {
      const k = urlObj.searchParams.get('k');
      if (k) {
        // Decode and replace + with spaces
        // Amazon uses + for spaces in search query
        return decodeURIComponent(k.replace(/\+/g, ' ')).trim();
      }
    }

    // 2. Try path for /Product-Name/dp/ASIN pattern
    // This handles direct product links if the AI generates them
    const pathSegments = urlObj.pathname.split('/').filter(Boolean);
    
    // Look for 'dp' or 'gp' segments
    const dpIndex = pathSegments.findIndex(s => s === 'dp');
    if (dpIndex > 0) {
       // The segment before 'dp' is often the product name
       // e.g. /Sony-WH-1000XM5-Canceling-Headphones/dp/B09XS7JWHH
       const nameSegment = pathSegments[dpIndex - 1];
       // Filter out generic 'product' segment if it was /gp/product
       if (nameSegment !== 'product' && nameSegment.length > 2) {
          return decodeURIComponent(nameSegment.replace(/-/g, ' ')).trim();
       }
    }
    
    return null;
  } catch (e) {
    return null;
  }
};

/**
 * Helper to identify and parse raw URLs from plain text
 */
const parseRawUrls = (text: string): { type: 'text' | 'link', content: string, url?: string }[] => {
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const parts: { type: 'text' | 'link', content: string, url?: string }[] = [];
  let lastIndex = 0;
  let match;

  while ((match = urlRegex.exec(text)) !== null) {
    // Text before URL
    if (match.index > lastIndex) {
      parts.push({
        type: 'text',
        content: text.substring(lastIndex, match.index)
      });
    }

    let url = match[1];
    // Remove trailing punctuation (common in sentences ending with URL)
    const trailingPunct = url.match(/[.,;!?)]+$/);
    let suffix = '';
    if (trailingPunct) {
      url = url.substring(0, url.length - trailingPunct[0].length);
      suffix = trailingPunct[0];
    }

    const isAmazon = url.includes('amazon') || url.includes('amzn');
    
    parts.push({
      type: 'link',
      content: isAmazon ? 'Check Price on Amazon' : url,
      url: sanitizeUrl(url)
    });

    if (suffix) {
      parts.push({ type: 'text', content: suffix });
    }

    lastIndex = urlRegex.lastIndex;
  }

  if (lastIndex < text.length) {
    parts.push({
      type: 'text',
      content: text.substring(lastIndex)
    });
  }
  
  if (parts.length === 0) return [{ type: 'text', content: text }];
  return parts;
};

/**
 * Parses markdown-style links [text](url) and images ![text](url) AND raw URLs into an array of segments.
 * Returns an array of objects { type: 'text' | 'link' | 'image', content: string, url?: string }
 */
export const parseMarkdownLinks = (text: string) => {
  // Regex matches:
  // Group 1: Optional '!' (indicates image)
  // Group 2: Alt text / Link text
  // Group 3: URL
  const regex = /(!?)\[([^\]]+)\]\s*\(([^)]+)\)/g;
  
  const segments: { type: 'text' | 'link' | 'image', content: string, url?: string }[] = [];
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(text)) !== null) {
    // Process text before the markdown link/image for raw URLs
    if (match.index > lastIndex) {
      const plainText = text.substring(lastIndex, match.index);
      segments.push(...parseRawUrls(plainText));
    }

    const isImage = match[1] === '!';
    
    // Push link or image
    segments.push({
      type: isImage ? 'image' : 'link',
      content: match[2],
      url: sanitizeUrl(match[3])
    });

    lastIndex = regex.lastIndex;
  }

  // Process remaining text for raw URLs
  if (lastIndex < text.length) {
    const plainText = text.substring(lastIndex);
    segments.push(...parseRawUrls(plainText));
  }

  return segments;
};

/**
 * Extracts product titles from the generated markdown text.
 * Assumes product titles are formatted as headers (### Product Name).
 */
export const extractProductHeaders = (text: string): string[] => {
  const headers: string[] = [];
  // Regex to match lines starting with ## or ### (handling standard Markdown)
  // Support ### **Product**, ### Product, ## Product
  const regex = /^(?:#{2,6})\s+(.+)$/gm;
  
  let match;
  while ((match = regex.exec(text)) !== null) {
    let header = match[1].trim();
    
    // Clean Markdown formatting (bold, italic, links, code)
    header = header.replace(/\*\*(.*?)\*\*/g, '$1'); // bold
    header = header.replace(/\*(.*?)\*/g, '$1');     // italic
    header = header.replace(/`([^`]+)`/g, '$1');     // code
    header = header.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1'); // links
    
    // Remove "1. " or "Product: " or "1) "
    header = header.replace(/^(\d+[\.\)]\s*)|((Product|Item)\s*(Name|Title)?:\s*)/i, '');
    
    // Clean up
    header = header.trim();
    
    // Validation: Filter out structural headers often found in AI responses
    const lower = header.toLowerCase();
    const invalid = [
      'recommendation', 'summary', 'conclusion', 'pros', 'cons', 'buying advice', 
      'feature', 'description', 'price', 'verdict', 'intro', 'best for', 
      'top picks', 'comparison', 'reference', 'guidelines', 'rules'
    ];
    
    // Accept only if it's substantial and not a banned keyword
    if (header.length > 3 && !invalid.some(i => lower.includes(i))) {
      headers.push(header);
    }
  }
  return headers;
};

/**
 * Cleans a search query to extract the core product name/model.
 * Removes words like "reviews", "price", "reddit", "pros and cons", site names, etc.
 * Useful for converting a Google Search query into an Amazon Product Search query.
 */
export const cleanProductQuery = (query: string): string => {
  let cleaned = query;
  
  // 1. Remove URLs if any
  cleaned = cleaned.replace(/https?:\/\/[^\s]+/g, '');

  // 2. Remove common sites/suffixes
  // Extended list to ensure we strip out review sites and forums
  const sites = [
    "rtings", "wirecutter", "techradar", "cnet", "tom's guide", "toms guide", 
    "the verge", "pcmag", "digital trends", "what hifi", "soundguys", 
    "gsmarena", "notebookcheck", "reddit", "youtube", "quora", 
    "nytimes", "forbes", "wsj", "bloomberg", "ign", "gamespot",
    "amazon", "walmart", "best buy", "target", "ebay", "consumer reports"
  ];
  
  // Regex to remove sites (case insensitive, whole word)
  const sitePattern = new RegExp(`\\b(${sites.join('|')})\\b`, 'gi');
  cleaned = cleaned.replace(sitePattern, '');

  // 3. Remove intent words and timeframes
  const patternsToRemove = [
    /\b(reviews?|prices?|pricing?|specs?|specifications?)\b/gi,
    /\b(pros\s+and\s+cons)\b/gi,
    /\b(pros\s*&\s*cons)\b/gi,
    /\b(problems?|issues?|troubleshooting)\b/gi,
    /\b(vs|versus|comparison|compare)\b/gi,
    /\b(buy|shop|cost|deal|sale|best\s+price|cheap|affordable)\b/gi,
    /\b(202[0-9])\b/g, // Remove years 2020-2029
    /\b(best|top|rated|ranking|list|of)\b/gi, // Aggressively remove generic adjectives to find product names
  ];

  patternsToRemove.forEach(pattern => {
    cleaned = cleaned.replace(pattern, '');
  });

  // Cleanup whitespace
  cleaned = cleaned.replace(/\s+/g, ' ').trim();
  
  // Remove punctuation at ends
  cleaned = cleaned.replace(/^[^\w]+|[^\w]+$/g, '');

  return cleaned;
};