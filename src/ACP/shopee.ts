/**
 * Shopee Product Service - Firestore Migration Stubs
 * 
 * MongoDB integration has been removed.
 * This service currently returns empty results or static fallbacks
 * until the Firestore-based search engine is implemented.
 */

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

export const shopeeService = {
    /**
     * Search stub - Returns empty array until Firestore search is ready
     */
    search: async (query: string): Promise<Product[]> => {
        try {
            // Import dynamically to avoid circular deps if any, or just import at top if clean
            // Assuming firestoreService is available. 
            // Note: We need to map Firestore raw data to Product interface
            const rawProducts = await import('./services/firestore').then(m => m.firestoreService.products.search(query));
            
            return rawProducts.map((p: any) => ({
                product_id: p.itemid,
                product_name: p.title,
                product_price: p.price,
                currency: "THB",
                merchant_name: "Shopee", // Hardcoded for now
                merchant_logo: "https://cf.shopee.co.th/file/38d3010b996b7d22f281e69974261899",
                image_url: p.image_url,
                product_url: p.product_url,
                rating: p.rating,
                reviews_count: p.sold, // best guess mapping
                cashback_rate: 0.05, // default
                estimated_cashback: (p.price || 0) * 0.05,
                affiliate_link: p.product_url,
                in_stock: true
            }));

        } catch (error) {
            console.error("Firestore Search Failed:", error);
            return [];
        }
    }
};
