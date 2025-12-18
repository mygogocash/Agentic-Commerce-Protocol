
// lib/mock-merchants.ts

export interface Product {
    product_id: string;
    product_name: string;
    product_price: number; // Normalized to USD
    original_price?: number;
    currency: string;
    merchant_name: string;
    merchant_logo: string;
    image_url: string;
    product_url: string;
    rating: number;
    reviews_count: number;
    cashback_rate: number; // e.g., 0.05 for 5%
    estimated_cashback: number;
    affiliate_link: string;
    in_stock: boolean;
}

// Dummy data generator
const generateMockProducts = (query: string): Product[] => {
    const merchants = [
        { name: 'Shopee', logo: 'shopee_logo.png', base_cashback: 0.05 },
        { name: 'Lazada', logo: 'lazada_logo.png', base_cashback: 0.04 },
        { name: 'Amazon', logo: 'amazon_logo.png', base_cashback: 0.02 },
        { name: 'Nike', logo: 'nike_logo.png', base_cashback: 0.08 },
    ];

    const products: Product[] = [];

    // Generate 2-3 products per merchant for the query
    merchants.forEach((merchant) => {
        // Randomize count
        const count = Math.floor(Math.random() * 3) + 1;
        for (let i = 0; i < count; i++) {
            const price = Math.floor(Math.random() * 200) + 20;
            const cashback_amount = Number((price * merchant.base_cashback).toFixed(2));
            const id = `${merchant.name.toLowerCase()}_${Math.random().toString(36).substr(2, 5)}`;

            const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://gogocash-acp.vercel.app';

            // Generate a valid "demo" link that actually works
            let targetUrl = `https://${merchant.name.toLowerCase()}.com`;
            if (merchant.name === 'Nike') targetUrl = `https://www.nike.com/w?q=${encodeURIComponent(query)}`;
            else if (merchant.name === 'Amazon') targetUrl = `https://www.amazon.com/s?k=${encodeURIComponent(query)}`;
            else if (merchant.name === 'Shopee') targetUrl = `https://shopee.co.th/search?keyword=${encodeURIComponent(query)}`;
            else if (merchant.name === 'Lazada') targetUrl = `https://www.lazada.co.th/catalog/?q=${encodeURIComponent(query)}`;

            const encodedTarget = encodeURIComponent(targetUrl);

            products.push({
                product_id: id,
                product_name: `${merchant.name} ${query} ${Math.floor(Math.random() * 1000)} series`,
                product_price: price,
                original_price: price + Math.floor(Math.random() * 50),
                currency: 'USD',
                merchant_name: merchant.name,
                merchant_logo: merchant.logo,
                image_url: `https://via.placeholder.com/300?text=${merchant.name}+${query}+${i}`,
                product_url: targetUrl,
                rating: Number((4 + Math.random()).toFixed(1)),
                reviews_count: Math.floor(Math.random() * 5000),
                cashback_rate: merchant.base_cashback,
                estimated_cashback: cashback_amount,
                affiliate_link: `${baseUrl}/api/redirect?url=${encodedTarget}`,
                in_stock: Math.random() > 0.1,
            });
        }
    });

    // Shuffle
    return products.sort(() => .5 - Math.random());
}

export const merchantService = {
    search: async (query: string): Promise<Product[]> => {
        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 500));
        return generateMockProducts(query);
    }
};
