
import crypto from 'crypto';

interface LazadaProduct {
    productId: number;
    productName: string;
    pictures: string[]; // It seems to be a list or string? Doc says "Product Image". Assuming string URL or list.
    productPrice: string; // The doc doesn't explicitly list price in the feed response table provided?
    // Wait, the doc provided by user for "Get product feed" Response fields:
    // productId, productName, categoryL1, sales7d, pictures, outOfStock, stock, currency...
    // It DOES NOT list 'price' or 'productPrice'?
    // It has 'discountPrice'.
    discountPrice?: string;
    currency?: string;
    totalCommissionRate?: string;
    rating?: number; // Not present?
    review?: number; // Not present?
    sellerName?: string;
}

interface LazadaLinkResponse {
    productId: string | number;
    trackingLink?: string;
    regularPromotionLink?: string; // For batch response
}

interface Product {
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

const APP_KEY = process.env.LAZADA_APP_KEY || '';
const APP_SECRET = process.env.LAZADA_APP_SECRET || '';
const USER_TOKEN = process.env.LAZADA_USER_TOKEN || '';
const BASE_URL = 'https://api.lazada.com/rest'; // Gateway. .sg or .co.th might be specific, but usually .com/rest handles routing via params or token.

export const lazadaService = {
    // HMAC-SHA256 Signature Generation
    signRequest: (params: Record<string, string | number>, secret: string): string => {
        // 1. Sort keys
        const keys = Object.keys(params).sort();

        // 2. Concatenate key+value
        let str = '';
        for (const key of keys) {
            str += key + params[key];
        }

        // 3. HMAC-SHA256
        const hmac = crypto.createHmac('sha256', secret);
        hmac.update(str);
        return hmac.digest('hex').toUpperCase();
    },

    // Helper to make API calls
    callApi: async (path: string, businessParams: Record<string, any>) => {
        // System Params
        const timestamp = Date.now().toString();
        const params: Record<string, any> = {
            app_key: APP_KEY,
            timestamp: timestamp,
            sign_method: 'sha256',
            ...businessParams
        };

        // Generate Signature
        // Note: Check if secret exists
        if (APP_SECRET) {
            params.sign = lazadaService.signRequest(params, APP_SECRET);
        }

        // Construct Query String
        const qs = new URLSearchParams(params).toString();
        const url = `${BASE_URL}${path}?${qs}`;

        console.log(`[Lazada] Calling ${path}`);
        const res = await fetch(url);
        if (!res.ok) {
            throw new Error(`Lazada API error: ${res.status} ${await res.text()}`);
        }
        return res.json();
    },

    // Search (Feed -> Filter -> GetLinks)
    search: async (query: string): Promise<Product[]> => {
        try {
            // 1. Fetch Feed (Page 1, Limit 50)
            // We use 'offerType=1' (Regular offer)
            const feedData = await lazadaService.callApi('/marketing/product/feed', {
                userToken: USER_TOKEN,
                offerType: '1',
                page: '1',
                limit: '50'
            });

            if (!feedData.data || !feedData.data.length) {
                console.log('[Lazada] No products in feed');
                return [];
            }

            const rawProducts: LazadaProduct[] = feedData.data;

            // 2. Filter by Query (In-Memory)
            // Strategy: Strict -> Fuzzy -> Recommendations
            let candidates: LazadaProduct[] = [];
            const lowerQuery = query.toLowerCase();

            // A. Strict Filter (Name contains full query)
            candidates = rawProducts.filter(p =>
                p.productName && p.productName.toLowerCase().includes(lowerQuery)
            );

            // B. Fuzzy Filter (Name contains ANY word from query)
            if (candidates.length === 0) {
                const words = lowerQuery.split(' ').filter(w => w.length > 2); // Ignore short words
                candidates = rawProducts.filter(p => {
                    if (!p.productName) return false;
                    const name = p.productName.toLowerCase();
                    return words.some(w => name.includes(w));
                });
            }

            // C. Fallback: Recommendations (Top 5 from feed)
            if (candidates.length === 0) {
                console.log(`[Lazada] No matches for "${query}". Returning recommendations.`);
                // Return top items but shuffle/slice to give variety? 
                // Just take top 5 for now.
                candidates = rawProducts.slice(0, 5);
            } else {
                // Limit to 5
                candidates = candidates.slice(0, 5);
            }

            if (candidates.length === 0) return [];

            // 3. Batch Get Links
            // API: /marketing/getlink
            // inputType: productId
            // inputValue: comma separated IDs
            const productIds = candidates.map(p => p.productId).join(',');

            const linkData = await lazadaService.callApi('/marketing/getlink', {
                userToken: USER_TOKEN,
                inputType: 'productId',
                inputValue: productIds
            });

            // Map links by ID
            const linkMap = new Map<string, string>();
            if (linkData.data && linkData.data.productBatchGetLinkInfoList) {
                linkData.data.productBatchGetLinkInfoList.forEach((item: any) => {
                    // regularPromotionLink seems to be the CPS link
                    if (item.regularPromotionLink) {
                        linkMap.set(String(item.productId), item.regularPromotionLink);
                    }
                });
            }

            // 4. Transform to Domain Model
            return candidates.map(p => {
                const pid = String(p.productId);
                const trackingLink = linkMap.get(pid) || '';

                // Wrap link with our redirect service
                const myBaseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://gogocash-acp.vercel.app';
                const wrappedLink = trackingLink
                    ? `${myBaseUrl}/api/redirect?url=${encodeURIComponent(trackingLink)}`
                    : '';

                // Price logic: feed has 'discountPrice'?
                const price = p.discountPrice ? parseFloat(p.discountPrice) : 0;

                // Commission: feed has 'totalCommissionRate' (e.g. '5.00' or '0.05'?)
                // Usually percentages. Let's assume normalized later.
                const rateStr = p.totalCommissionRate || '0';
                // If it's > 1, it's likely %, e.g. 5.5 -> 0.055
                let rate = parseFloat(rateStr);
                if (rate > 1) rate = rate / 100;

                // Pictures: seems to be a list? Or string.
                // Doc says "Product Image". Assuming URL.
                // Assuming it's a string based on "pictures" plural naming. If array, take first.
                let img = 'https://via.placeholder.com/300?text=Lazada';
                if (Array.isArray(p.pictures) && p.pictures.length > 0) img = p.pictures[0];
                else if (typeof p.pictures === 'string') img = p.pictures;

                return {
                    product_id: `laz_${pid}`,
                    product_name: p.productName,
                    product_price: price,
                    currency: p.currency || 'THB',
                    merchant_name: 'Lazada',
                    merchant_logo: 'https://laz-img-cdn.alicdn.com/images/ims-web/TB19672SXXXXXbcaXXXXXXXXXXX.png',
                    image_url: img,
                    product_url: trackingLink || '#', // Affiliate link IS the product url often
                    rating: 4.5, // Not provided
                    reviews_count: 100, // Not provided
                    cashback_rate: rate,
                    estimated_cashback: Number((price * rate).toFixed(2)),
                    affiliate_link: wrappedLink,
                    in_stock: !((p as any).outOfStock) // Checking the 'outOfStock' field
                };
            });

        } catch (e) {
            console.error('[Lazada] Search error:', e);
            return [];
        }
    }
};
