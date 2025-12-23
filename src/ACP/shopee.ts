import { Pool } from 'pg';
// import productsData from './data/shopee-subset.json';

// Use a Pool for better performance in serverless env
let pool: Pool | null = null;

if (process.env.DATABASE_URL) {
    pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false },
        max: 5 // Limit connections
    });
}

export interface Product {
    product_id: string;
    product_name: string;
    product_price: number;
    product_price_usd?: number; // Added USD price
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

// Local JSON fallback removed for Production Robustness
// const allProducts: Product[] = productsData as Product[];

export const shopeeService = {
    search: async (query: string): Promise<Product[]> => {
        if (!query) return [];

        // Strict Cloud Mode: Only allow search if DB is configured
        if (!pool) {
            console.error('[ShopeeService] Cloud DB not configured. Search unavailable in Strict Mode.');
            return [];
        }

        try {
            // 1. Initial Parsing
            let cleanQuery = query;
            let maxPrice: number | null = null;
            let minPrice: number | null = null;

            // Regex for "under $300", "below 300", "< 300"
            const underMatch = query.match(/(?:under|below|<)\s?\$?(\d+)/i);
            if (underMatch) {
                maxPrice = parseInt(underMatch[1]);
                cleanQuery = cleanQuery.replace(underMatch[0], '').trim();
            }

            // Regex for "over $300", "above 300", "> 300"
            const overMatch = query.match(/(?:over|above|>)\s?\$?(\d+)/i);
            if (overMatch) {
                minPrice = parseInt(overMatch[1]);
                cleanQuery = cleanQuery.replace(overMatch[0], '').trim();
            }

            // Remove conversational filler
            cleanQuery = cleanQuery
                .replace(/\b(gift|ideas|idea|suggestion|recommendations?|recommend|best|top)\b/gi, '')
                .replace(/\bgadgets?\b/gi, 'electronics') // Map gadget -> electronics
                .trim();

            console.log(`Original: "${query}" -> Clean: "${cleanQuery}"`);


            // If query became empty (e.g. user just typed "under 500"), prevent SQL error
            // Fallback to searching for "all" or handle gracefully. 
            // websearch_to_tsquery handles empty string by matching nothing usually, let's keep it safe.
            if (!cleanQuery) cleanQuery = "product"; 

            // 2. Build SQL Query
            const conditions: string[] = [`fts @@ websearch_to_tsquery('english', $1)`];
            const params: any[] = [cleanQuery];
            let paramIndex = 2;

            if (maxPrice !== null) {
                conditions.push(`price_usd <= $${paramIndex}`);
                params.push(maxPrice);
                paramIndex++;
            }

            if (minPrice !== null) {
                conditions.push(`price_usd >= $${paramIndex}`);
                params.push(minPrice);
                paramIndex++;
            }

            const sql = `
                SELECT *, ts_rank(fts, websearch_to_tsquery('english', $1)) as rank
                FROM shopee_products 
                WHERE ${conditions.join(' AND ')}
                ORDER BY rank DESC 
                LIMIT 20;
            `;
            
            const res = await pool.query(sql, params);
            
            return res.rows.map(row => ({
                product_id: `shp_cloud_${row.itemid}`,
                product_name: row.title,
                product_price: parseFloat(row.price),
                product_price_usd: row.price_usd ? parseFloat(row.price_usd) : undefined,
                currency: row.currency,
                merchant_name: 'Shopee',
                merchant_logo: 'https://cf.shopee.co.th/file/38d3010b996b7d22f281e69974261899',
                image_url: row.image_url,
                product_url: row.product_url,
                rating: parseFloat(row.rating),
                reviews_count: row.sold,
                cashback_rate: 0.05,
                estimated_cashback: Number((parseFloat(row.price) * 0.05).toFixed(2)),
                affiliate_link: `https://gogocash-acp.vercel.app/api/redirect?url=${encodeURIComponent(row.affiliate_link || row.product_url)}`,
                in_stock: true
            }));

        } catch (err) {
            console.error('[ShopeeService] Cloud DB search error:', err);
            return [];
        }
    }
};
