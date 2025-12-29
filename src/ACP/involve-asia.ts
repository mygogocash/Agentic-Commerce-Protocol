
import { Product } from './types';

const API_KEY = process.env.INVOLVE_API_KEY || 'general';
const API_SECRET = process.env.INVOLVE_API_SECRET;

if (!API_SECRET) {
    throw new Error("Missing INVOLVE_API_SECRET environment variable");
}

const BASE_URL = 'https://api.involve.asia/api';

let cachedToken: string | null = null;
let tokenExpiry = 0;
let cachedOffers: any[] = [];

async function authenticate() {
    if (cachedToken && Date.now() < tokenExpiry) {
        return cachedToken;
    }

    const params = new URLSearchParams();
    params.append('key', API_KEY);
    params.append('secret', API_SECRET);

    const res = await fetch(`${BASE_URL}/authenticate`, {
        method: 'POST',
        body: params
    });

    const data = await res.json();
    if (data.status === 'success' && data.data?.token) {
        cachedToken = data.data.token;
        tokenExpiry = Date.now() + 7000 * 1000; // ~2 hours
        return cachedToken;
    }

    console.error('Involve Auth Failed:', data);
    return null;
}

export const involveAsia = {
    getOffers: async () => {
        const token = await authenticate();
        if (!token) return [];

        if (cachedOffers.length > 0) return cachedOffers;

        try {
            const res = await fetch(`${BASE_URL}/offers/all`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ page: 1 })
            });

            const data = await res.json();
            if (data.status === 'success' && data.data?.data) {
                cachedOffers = data.data.data;
                return cachedOffers;
            }
        } catch (e) {
            console.error('Error fetching offers:', e);
        }
        return [];
    },

    search: async (query: string): Promise<Product[]> => {
        // Parallel fetch: Standard Offers + Shopee Xtra
        const [offers, shopeeXtra] = await Promise.all([
            involveAsia.getOffers(),
            involveAsia.getShopeeCommissionXtra()
        ]);

        const lowerQuery = query.toLowerCase();

        // 1. Map Standard Offers
        const matchedOffers = offers.filter((o: any) =>
            o.offer_name.toLowerCase().includes(lowerQuery) ||
            (o.categories && o.categories.toLowerCase().includes(lowerQuery))
        ).map((o: any) => {
            const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://gogocash-acp.vercel.app';
            const wrappedLink = `${baseUrl}/api/redirect?url=${encodeURIComponent(o.tracking_link)}`;

            return {
                product_id: `ia_${o.offer_id}`,
                product_name: `[Offer] ${o.offer_name}`,
                product_price: 0,
                currency: o.currency || 'USD',
                merchant_name: o.offer_name,
                merchant_logo: o.logo || 'https://via.placeholder.com/50',
                image_url: o.logo || 'https://via.placeholder.com/300',
                product_url: o.preview_url,
                rating: 4.5,
                reviews_count: 100,
                cashback_rate: 0.05,
                estimated_cashback: 0,
                affiliate_link: wrappedLink,
                in_stock: true
            };
        });

        // 2. Map Shopee Xtra
        const matchedXtra = shopeeXtra.filter((s: any) =>
            s.shop_name.toLowerCase().includes(lowerQuery) ||
            s.offer_name.toLowerCase().includes(lowerQuery)
        ).map((s: any) => {
            const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://gogocash-acp.vercel.app';
            const wrappedLink = `${baseUrl}/api/redirect?url=${encodeURIComponent(s.tracking_link)}`;

            return {
                product_id: `shopee_xtra_${s.shop_id}`,
                product_name: `[Shopee Xtra] ${s.shop_name} - ${s.offer_name}`,
                product_price: 0,
                currency: s.currency || 'USD',
                merchant_name: `Shopee (${s.shop_type})`,
                merchant_logo: s.shop_image || 'https://via.placeholder.com/50',
                image_url: s.shop_image || 'https://via.placeholder.com/300',
                product_url: s.shop_link || '',
                rating: 5.0,
                reviews_count: 500,
                cashback_rate: parseFloat(s.commission_rate) / 100,
                estimated_cashback: 0,
                affiliate_link: wrappedLink,
                in_stock: true
            };
        });

        return [...matchedXtra, ...matchedOffers];
    },

    getShopeeCommissionXtra: async () => {
        const token = await authenticate();
        if (!token) return [];

        try {
            const res = await fetch(`${BASE_URL}/shopeextra/all`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    page: 1,
                    sort: 'high_commission'
                })
            });

            const data = await res.json();
            if (data.status === 'success' && data.data?.data) {
                return data.data.data;
            }
        } catch (e) {
            console.error('Error fetching Shopee Xtra:', e);
        }
        return [];
    }
};

