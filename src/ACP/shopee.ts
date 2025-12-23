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
            // Use websearch_to_tsquery for robust handling of user input (e.g. "sony headphones -black")
            // It automatically handles operators and special chars better than raw to_tsquery
            const sql = `
                SELECT *, ts_rank(fts, websearch_to_tsquery('english', $1)) as rank
                FROM shopee_products 
                WHERE fts @@ websearch_to_tsquery('english', $1) 
                ORDER BY rank DESC 
                LIMIT 20;
            `;
            
            const res = await pool.query(sql, [query]);
            
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
                affiliate_link: row.affiliate_link || row.product_url,
                in_stock: true
            }));

        } catch (err) {
            console.error('[ShopeeService] Cloud DB search error:', err);
            // In strict mode, we return empty or throw, but do NOT fallback to stale local data.
            return [];
        }
    }
};
