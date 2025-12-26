/**
 * Shopee Product Service - MongoDB Version
 * 
 * Provides product search with:
 * - Full-text search using MongoDB text index
 * - Price filtering (under/over)
 * - Fallback to regex search
 * - Optional Atlas Search for advanced features
 */

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

// MongoDB document interface
interface ShopeeProductDoc {
    itemid: string;
    title: string;
    price: number;
    price_usd: number;
    currency: string;
    rating: number;
    sold: number;
    image_url: string;
    product_url: string;
    affiliate_link: string;
    updated_at: Date;
}

/**
 * Utility to check if Atlas Search is available
 * Set ATLAS_SEARCH_ENABLED=true in .env.local if you've configured Atlas Search
 */
const useAtlasSearch = process.env.ATLAS_SEARCH_ENABLED === 'true';

export const shopeeService = {
    /**
     * Search for products using MongoDB
     */
    search: async (query: string): Promise<Product[]> => {
        if (!query) return [];

        const collection = await getCollection<ShopeeProductDoc>(Collections.SHOPEE_PRODUCTS);
        if (!collection) {
            console.error('[ShopeeService] MongoDB not configured. Search unavailable.');
            return [];
        }

        try {
            // 1. Parse query for price filters
            let cleanQuery = query;
            let maxPrice: number | null = null;
            let minPrice: number | null = null;

            // Match "under $300", "below 300", "< 300"
            const underMatch = query.match(/(?:under|below|<)\s?\$?(\d+)/i);
            if (underMatch) {
                maxPrice = parseInt(underMatch[1]);
                cleanQuery = cleanQuery.replace(underMatch[0], '').trim();
            }

            // Match "over $300", "above 300", "> 300"
            const overMatch = query.match(/(?:over|above|>)\s?\$?(\d+)/i);
            if (overMatch) {
                minPrice = parseInt(overMatch[1]);
                cleanQuery = cleanQuery.replace(overMatch[0], '').trim();
            }

            // Remove conversational filler words
            cleanQuery = cleanQuery
                .replace(/\b(gift|ideas|idea|suggestion|recommendations?|recommend|best|top)\b/gi, '')
                .replace(/\bgadgets?\b/gi, 'electronics')
                .trim();

            console.log(`[Shopee] Original: "${query}" -> Clean: "${cleanQuery}"`);

            // Prevent empty query from causing issues
            if (!cleanQuery) cleanQuery = 'product';

            let results: ShopeeProductDoc[];

            // 2. Choose search method
            if (useAtlasSearch) {
                // Use Atlas Search with fuzzy matching
                results = await searchWithAtlas(collection, cleanQuery, minPrice, maxPrice);
            } else {
                // Use standard MongoDB text search
                results = await searchWithTextIndex(collection, cleanQuery, minPrice, maxPrice);
            }

            // 3. Fallback to regex search if no results
            if (results.length === 0 && !maxPrice && !minPrice) {
                console.log(`[Shopee] Text search found 0. Trying regex fallback for: ${cleanQuery}`);
                results = await collection
                    .find({
                        title: { $regex: cleanQuery, $options: 'i' }
                    })
                    .limit(20)
                    .toArray() as ShopeeProductDoc[];
            }

            // 4. Map results to Product interface
            return results.map(mapToProduct);

        } catch (err) {
            console.error('[ShopeeService] MongoDB search error:', err);
            return [];
        }
    }
};

/**
 * Standard text search using MongoDB text index
 */
async function searchWithTextIndex(
    collection: any,
    query: string,
    minPrice: number | null,
    maxPrice: number | null
): Promise<ShopeeProductDoc[]> {
    // Build filter
    const filter: any = {
        $text: { $search: query }
    };

    // Add price filters
    if (maxPrice !== null || minPrice !== null) {
        filter.price_usd = {};
        if (maxPrice !== null) filter.price_usd.$lte = maxPrice;
        if (minPrice !== null) filter.price_usd.$gte = minPrice;
    }

    // Execute with text score sorting
    return await collection
        .find(filter, {
            projection: { score: { $meta: 'textScore' } }
        })
        .sort({ score: { $meta: 'textScore' } })
        .limit(20)
        .toArray();
}

/**
 * Advanced search using MongoDB Atlas Search
 * Provides: fuzzy matching, typo tolerance, better relevance scoring
 * 
 * Requires Atlas Search index to be created in MongoDB Atlas UI:
 * Index Name: "default"
 * Index Definition:
 * {
 *   "mappings": {
 *     "dynamic": false,
 *     "fields": {
 *       "title": {
 *         "type": "string",
 *         "analyzer": "lucene.standard"
 *       },
 *       "price_usd": { "type": "number" }
 *     }
 *   }
 * }
 */
async function searchWithAtlas(
    collection: any,
    query: string,
    minPrice: number | null,
    maxPrice: number | null
): Promise<ShopeeProductDoc[]> {
    const pipeline: any[] = [];

    // Atlas Search stage with fuzzy matching
    const searchStage: any = {
        $search: {
            index: 'default', // Name of your Atlas Search index
            compound: {
                must: [
                    {
                        text: {
                            query: query,
                            path: 'title',
                            fuzzy: {
                                maxEdits: 2,      // Allow up to 2 character changes
                                prefixLength: 2   // First 2 chars must match
                            }
                        }
                    }
                ]
            }
        }
    };

    // Add price range filter to Atlas Search if applicable
    if (minPrice !== null || maxPrice !== null) {
        searchStage.$search.compound.filter = [];
        
        if (minPrice !== null) {
            searchStage.$search.compound.filter.push({
                range: {
                    path: 'price_usd',
                    gte: minPrice
                }
            });
        }
        
        if (maxPrice !== null) {
            searchStage.$search.compound.filter.push({
                range: {
                    path: 'price_usd',
                    lte: maxPrice
                }
            });
        }
    }

    pipeline.push(searchStage);

    // Add score for debugging/ranking visibility
    pipeline.push({
        $addFields: {
            searchScore: { $meta: 'searchScore' }
        }
    });

    // Limit results
    pipeline.push({ $limit: 20 });

    return await collection.aggregate(pipeline).toArray();
}

/**
 * Map MongoDB document to Product interface
 */
function mapToProduct(doc: ShopeeProductDoc): Product {
    return {
        product_id: `shp_mongo_${doc.itemid}`,
        product_name: doc.title,
        product_price: parseFloat(String(doc.price)),
        product_price_usd: doc.price_usd ? parseFloat(String(doc.price_usd)) : undefined,
        currency: doc.currency || 'THB',
        merchant_name: 'Shopee',
        merchant_logo: 'https://cf.shopee.co.th/file/38d3010b996b7d22f281e69974261899',
        image_url: doc.image_url,
        product_url: doc.product_url,
        rating: parseFloat(String(doc.rating)) || 0,
        reviews_count: doc.sold || 0,
        cashback_rate: 0.05,
        estimated_cashback: Number((parseFloat(String(doc.price)) * 0.05).toFixed(2)),
        affiliate_link: `https://gogocash-acp.vercel.app/api/redirect?url=${encodeURIComponent(doc.affiliate_link || doc.product_url)}`,
        in_stock: true
    };
}
