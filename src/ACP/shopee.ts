import productsData from './data/shopee-subset.json';

export interface Product {
    product_id: string;
    product_name: string;
    product_price: number;
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

// Type assertion for the imported JSON
const allProducts: Product[] = productsData as Product[];

export const shopeeService = {
    search: async (query: string): Promise<Product[]> => {
        if (!query) return [];

        const lowerQuery = query.toLowerCase();
        const terms = lowerQuery.split(' ').filter(t => t.length > 2);

        // Filter: Name must contain at least one significant term from query
        // Validation: If query is very specific, we try to match more terms.
        
        let matches = allProducts.filter(p => {
             const name = p.product_name.toLowerCase();
             // Simple check: does it contain the full query?
             if (name.includes(lowerQuery)) return true;
             
             // Fuzzy: does it contain ALL terms?
             if (terms.every(t => name.includes(t))) return true;

             return false;
        });

        // Fallback: If no matches, try ANY term (looser search)
        if (matches.length === 0 && terms.length > 0) {
            matches = allProducts.filter(p => {
                const name = p.product_name.toLowerCase();
                return terms.some(t => name.includes(t));
            });
        }

        // Sort by relevance (simple count of term matches?) or just keep original sort (Sales)
        // Since the JSON is already sorted by Sales, taking the top matches gives us "Popular items matching query"
        return matches.slice(0, 10);
    }
};
