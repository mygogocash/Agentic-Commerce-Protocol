import { firestoreService } from './services/firestore';

export interface Product {
  product_id: string;
  product_name: string;
  product_price: number;
  product_price_usd?: number;
  currency: string;
  merchant_name: string;
  merchant_logo: string;
  image_url: string;
  product_url: string;
  rating: number;
  reviews_count: number;
  cashback_rate: number;
  estimated_cashback: number;
  affiliate_link: string;
  in_stock: boolean;
}

// Enhanced search function with better matching for Firebase/Firestore
function enhanceSearchQuery(query: string): { keywords: string[], maxPrice: number | null } {
  const cleanQuery = query.toLowerCase().trim();

  // Remove common words that don't help with product search
  const stopWords = ['for', 'new', 'year', 'gift', 'under', 'over', 'around', 'about', 'the', 'a', 'an'];
  const words = cleanQuery.split(' ').filter(word => !stopWords.includes(word) && word.length > 1);

  // Extract price information
  const priceMatch = cleanQuery.match(/\$(\d+)/);
  const maxPrice = priceMatch ? parseInt(priceMatch[1]) * 35 : null; // Convert USD to THB roughly

  // Add variations and synonyms for better matching
  const synonyms: { [key: string]: string[] } = {
    'earphone': ['earphones', 'headphones', 'earbuds', 'headset'],
    'phone': ['smartphone', 'mobile', 'cellphone'],
    'laptop': ['notebook', 'computer'],
    'watch': ['smartwatch', 'timepiece'],
    'bag': ['backpack', 'handbag', 'purse'],
    'shoe': ['shoes', 'sneakers', 'footwear'],
    'shirt': ['t-shirt', 'tshirt', 'top', 'blouse']
  };

  const expandedWords = [...words];
  words.forEach(word => {
    if (synonyms[word]) {
      expandedWords.push(...synonyms[word]);
    }
  });

  return {
    keywords: [...new Set(expandedWords)], // Remove duplicates
    maxPrice
  };
}

// Generate contextual mock products when database is unavailable
function generateMockProducts(query: string): Product[] {
  const { keywords } = enhanceSearchQuery(query);
  const mainTerm = keywords[0] || 'product';
  const priceMatch = query.match(/\$(\d+)/);
  const maxPriceUSD = priceMatch ? parseInt(priceMatch[1]) : 50;
  const maxPriceTHB = maxPriceUSD * 35;

  const products = [
    {
      product_id: 'mock_1',
      product_name: `Premium ${mainTerm.charAt(0).toUpperCase() + mainTerm.slice(1)} - High Quality`,
      product_price: Math.min(maxPriceTHB * 0.8, 1299),
      currency: "THB",
      merchant_name: "Shopee",
      merchant_logo: "https://cf.shopee.co.th/file/38d3010b996b7d22f281e69974261899",
      image_url: `https://via.placeholder.com/300x300/FF6B35/FFFFFF?text=${encodeURIComponent(mainTerm)}`,
      product_url: "https://shopee.co.th/mock-product-1",
      rating: 4.5,
      reviews_count: 1250,
      cashback_rate: 0.05,
      estimated_cashback: Math.min(maxPriceTHB * 0.8, 1299) * 0.05,
      affiliate_link: "https://shopee.co.th/mock-product-1",
      in_stock: true
    },
    {
      product_id: 'mock_2',
      product_name: `Budget ${mainTerm.charAt(0).toUpperCase() + mainTerm.slice(1)} - Great Value`,
      product_price: Math.min(maxPriceTHB * 0.4, 599),
      currency: "THB",
      merchant_name: "Shopee",
      merchant_logo: "https://cf.shopee.co.th/file/38d3010b996b7d22f281e69974261899",
      image_url: `https://via.placeholder.com/300x300/4ECDC4/FFFFFF?text=Budget+${encodeURIComponent(mainTerm)}`,
      product_url: "https://shopee.co.th/mock-product-2",
      rating: 4.2,
      reviews_count: 856,
      cashback_rate: 0.05,
      estimated_cashback: Math.min(maxPriceTHB * 0.4, 599) * 0.05,
      affiliate_link: "https://shopee.co.th/mock-product-2",
      in_stock: true
    },
    {
      product_id: 'mock_3',
      product_name: `Professional ${mainTerm.charAt(0).toUpperCase() + mainTerm.slice(1)} - Top Rated`,
      product_price: Math.min(maxPriceTHB * 0.6, 899),
      currency: "THB",
      merchant_name: "Shopee",
      merchant_logo: "https://cf.shopee.co.th/file/38d3010b996b7d22f281e69974261899",
      image_url: `https://via.placeholder.com/300x300/45B7D1/FFFFFF?text=Pro+${encodeURIComponent(mainTerm)}`,
      product_url: "https://shopee.co.th/mock-product-3",
      rating: 4.7,
      reviews_count: 2103,
      cashback_rate: 0.05,
      estimated_cashback: Math.min(maxPriceTHB * 0.6, 899) * 0.05,
      affiliate_link: "https://shopee.co.th/mock-product-3",
      in_stock: true
    }
  ];

  // Filter by price if specified
  const { maxPrice } = enhanceSearchQuery(query);
  if (maxPrice) {
    return products.filter(p => p.product_price <= maxPrice);
  }

  return products;
}

export const shopeeService = {
  search: async (query: string): Promise<Product[]> => {
    try {
      const { keywords, maxPrice } = enhanceSearchQuery(query);

      // Use enhanced Firestore search with multiple keywords
      const rawProducts = await firestoreService.products.searchEnhanced(keywords, maxPrice);

      if (rawProducts.length === 0) {
        console.warn(`[Shopee] No products found for query: ${query}, returning mock products`);
        return generateMockProducts(query);
      }

      return rawProducts.map((p: any) => ({
        product_id: p.itemid || p.id,
        product_name: p.title || p.product_name || p.name,
        product_price: Number(p.price || 0),
        currency: "THB",
        merchant_name: "Shopee",
        merchant_logo: "https://cf.shopee.co.th/file/38d3010b996b7d22f281e69974261899",
        image_url: p.image_url || p.image || `https://via.placeholder.com/300x300?text=${encodeURIComponent(p.title || 'Product')}`,
        product_url: p.product_url || p.link || `https://shopee.co.th/product/${p.shopid}/${p.itemid}`,
        rating: Number(p.rating || 4.0),
        reviews_count: Number(p.sold || p.reviews_count || 0),
        cashback_rate: 0.05,
        estimated_cashback: Number((p.price || 0) * 0.05),
        affiliate_link: p.product_url || p.link || `https://shopee.co.th/product/${p.shopid}/${p.itemid}`,
        in_stock: true
      }));

    } catch (error) {
      console.error("[Shopee] Firestore search failed:", error);
      return generateMockProducts(query);
    }
  }
};