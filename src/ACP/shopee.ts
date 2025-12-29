import { getCollection, Collections } from './lib/mongodb';

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

// Enhanced search function with better matching
function enhanceSearchQuery(query: string): string[] {
  const cleanQuery = query.toLowerCase().trim();

  // Remove common words that don't help with product search
  const stopWords = ['for', 'new', 'year', 'gift', 'under', 'over', 'around', 'about', 'the', 'a', 'an'];
  const words = cleanQuery.split(' ').filter(word => !stopWords.includes(word) && word.length > 1);

  // Extract price information
  const priceMatch = cleanQuery.match(/\$(\d+)/);
  const maxPrice = priceMatch ? parseInt(priceMatch[1]) : null;

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

  return [...new Set(expandedWords)]; // Remove duplicates
}

export const shopeeService = {
  search: async (query: string): Promise<Product[]> => {
    try {
      const collection = await getCollection(Collections.SHOPEE_PRODUCTS);
      if (!collection) {
        console.warn('[Shopee] MongoDB not available, returning mock data');
        return generateMockProducts(query);
      }

      // Enhanced search with multiple strategies
      const searchTerms = enhanceSearchQuery(query);
      const priceMatch = query.match(/\$(\d+)/);
      const maxPrice = priceMatch ? parseInt(priceMatch[1]) * 35 : null; // Convert USD to THB roughly

      // Build MongoDB aggregation pipeline for better search
      const pipeline = [
        {
          $match: {
            $and: [
              {
                $or: [
                  // Text search on product name
                  { name: { $regex: searchTerms.join('|'), $options: 'i' } },
                  { title: { $regex: searchTerms.join('|'), $options: 'i' } },
                  // Category matching
                  { category: { $regex: searchTerms.join('|'), $options: 'i' } },
                  // Brand matching
                  { brand: { $regex: searchTerms.join('|'), $options: 'i' } }
                ]
              },
              // Price filter if specified
              ...(maxPrice ? [{ price: { $lte: maxPrice } }] : [])
            ]
          }
        },
        {
          $addFields: {
            // Calculate relevance score
            relevanceScore: {
              $add: [
                // Boost if title contains exact search terms
                { $cond: [{ $regexMatch: { input: "$name", regex: searchTerms[0], options: "i" } }, 10, 0] },
                // Boost high-rated products
                { $multiply: ["$rating", 2] },
                // Boost products with more sales
                { $divide: [{ $ifNull: ["$sold", 0] }, 100] }
              ]
            }
          }
        },
        { $sort: { relevanceScore: -1, rating: -1, sold: -1 } },
        { $limit: 20 }
      ];

      const rawProducts = await collection.aggregate(pipeline).toArray();

      if (rawProducts.length === 0) {
        // Fallback: broader search
        const fallbackResults = await collection.find({
          $or: [
            { name: { $regex: searchTerms[0], $options: 'i' } },
            { title: { $regex: searchTerms[0], $options: 'i' } }
          ]
        }).limit(10).toArray();

        if (fallbackResults.length === 0) {
          console.warn(`[Shopee] No products found for query: ${query}`);
          return generateMockProducts(query);
        }

        rawProducts.push(...fallbackResults);
      }

      return rawProducts.map((p: any) => ({
        product_id: p.itemid || p._id?.toString() || p.id,
        product_name: p.name || p.title || p.product_name,
        product_price: Number(p.price || 0),
        currency: "THB",
        merchant_name: "Shopee",
        merchant_logo: "https://cf.shopee.co.th/file/38d3010b996b7d22f281e69974261899",
        image_url: p.image || p.image_url || `https://via.placeholder.com/300x300?text=${encodeURIComponent(p.name || 'Product')}`,
        product_url: p.link || p.product_url || `https://shopee.co.th/product/${p.shopid}/${p.itemid}`,
        rating: Number(p.rating || 4.0),
        reviews_count: Number(p.sold || p.reviews_count || 0),
        cashback_rate: 0.05,
        estimated_cashback: Number((p.price || 0) * 0.05),
        affiliate_link: p.link || p.product_url || `https://shopee.co.th/product/${p.shopid}/${p.itemid}`,
        in_stock: true
      }));

    } catch (error) {
      console.error("[Shopee] Search failed:", error);
      return generateMockProducts(query);
    }
  }
};

// Generate mock products when database is unavailable
function generateMockProducts(query: string): Product[] {
  const searchTerms = enhanceSearchQuery(query);
  const mainTerm = searchTerms[0] || 'product';

  return [
    {
      product_id: 'mock_1',
      product_name: `Premium ${mainTerm.charAt(0).toUpperCase() + mainTerm.slice(1)} - High Quality`,
      product_price: 1299,
      currency: "THB",
      merchant_name: "Shopee",
      merchant_logo: "https://cf.shopee.co.th/file/38d3010b996b7d22f281e69974261899",
      image_url: `https://via.placeholder.com/300x300?text=${encodeURIComponent(mainTerm)}`,
      product_url: "https://shopee.co.th/mock-product-1",
      rating: 4.5,
      reviews_count: 1250,
      cashback_rate: 0.05,
      estimated_cashback: 64.95,
      affiliate_link: "https://shopee.co.th/mock-product-1",
      in_stock: true
    },
    {
      product_id: 'mock_2',
      product_name: `Budget ${mainTerm.charAt(0).toUpperCase() + mainTerm.slice(1)} - Great Value`,
      product_price: 599,
      currency: "THB",
      merchant_name: "Shopee",
      merchant_logo: "https://cf.shopee.co.th/file/38d3010b996b7d22f281e69974261899",
      image_url: `https://via.placeholder.com/300x300?text=Budget+${encodeURIComponent(mainTerm)}`,
      product_url: "https://shopee.co.th/mock-product-2",
      rating: 4.2,
      reviews_count: 856,
      cashback_rate: 0.05,
      estimated_cashback: 29.95,
      affiliate_link: "https://shopee.co.th/mock-product-2",
      in_stock: true
    },
    {
      product_id: 'mock_3',
      product_name: `Professional ${mainTerm.charAt(0).toUpperCase() + mainTerm.slice(1)} - Top Rated`,
      product_price: 899,
      currency: "THB",
      merchant_name: "Shopee",
      merchant_logo: "https://cf.shopee.co.th/file/38d3010b996b7d22f281e69974261899",
      image_url: `https://via.placeholder.com/300x300?text=Pro+${encodeURIComponent(mainTerm)}`,
      product_url: "https://shopee.co.th/mock-product-3",
      rating: 4.7,
      reviews_count: 2103,
      cashback_rate: 0.05,
      estimated_cashback: 44.95,
      affiliate_link: "https://shopee.co.th/mock-product-3",
      in_stock: true
    }
  ];
}

