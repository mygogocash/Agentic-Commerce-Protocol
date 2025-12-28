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
        console.log(`[Shopee] Search received for "${query}" - MongoDB is removed. Returning mock/empty.`);
        
        // Return a few static results for "gift" or general queries so the UI doesn't look broken
        if (query.match(/gift|idea/i)) {
            return [
                {
                    product_id: 'stub_1',
                    product_name: "Samsung Galaxy Watch 6 (Migration Placeholder)",
                    product_price: 9900,
                    currency: "THB",
                    merchant_name: "Shopee",
                    merchant_logo: "https://cf.shopee.co.th/file/38d3010b996b7d22f281e69974261899",
                    image_url: "https://down-th.img.susercontent.com/file/th-11134207-7r98o-ll09u434253q3d",
                    product_url: "https://shopee.co.th",
                    rating: 4.8,
                    reviews_count: 100,
                    cashback_rate: 0.05,
                    estimated_cashback: 495,
                    affiliate_link: "https://shopee.co.th",
                    in_stock: true
                }
            ];
        }

        return [];
    }
};
