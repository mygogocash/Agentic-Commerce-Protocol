
import crypto from 'crypto';

interface LazadaProduct {
    productId: number;
    productName: string;
    productImage: string; // "Product Image" in docs, likely singular or first of list
    discountPrice?: string;
    price?: string;
    currency?: string;
    stock?: number;
    totalCommissionRate?: string;
    sellerName?: string;
    // ... add other fields as seen in docs if needed
}

interface LazadaLinkResponse {
    productId: string | number;
    regularPromotionLink?: string; // Confirmed from docs: "regular_promotion_link" or similar camelCase in JSON
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
const BASE_URL = 'https://api.lazada.co.th/rest'; // Thailand endpoint per user context

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
            // 1. Fetch Feed
            // Doc says: /marketing/product/feed
            // Params: offerType=1, limit=50
            const feedParams: Record<string, any> = {
                userToken: USER_TOKEN,
                offerType: '1',
                limit: '50',
                page: '1'
            };

            const feedData = await lazadaService.callApi('/marketing/product/feed', feedParams);

            if (!feedData.data || !feedData.data.length) {
                console.log('[Lazada] No products in feed');
                return [];
            }

            const rawProducts: LazadaProduct[] = feedData.data;

            // 2. Filter by Query (In-Memory Implementation)
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
                candidates = rawProducts.slice(0, 5);
            } else {
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
            // The response list key is usually snake_case or camelCase depending on the gateway.
            // Based on observed SDKs: productBatchGetLinkInfoList
            if (linkData.data && linkData.data.productBatchGetLinkInfoList) {
                linkData.data.productBatchGetLinkInfoList.forEach((item: any) => {
                    // regularPromotionLink is the standard affiliate link
                    if (item.regularPromotionLink) {
                        linkMap.set(String(item.productId), item.regularPromotionLink);
                    } else if (item.regular_promotion_link) {
                         linkMap.set(String(item.productId), item.regular_promotion_link);
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

                // Price logic
                const price = p.discountPrice ? parseFloat(p.discountPrice) : (p.price ? parseFloat(p.price) : 0);

                // Commission
                // Assuming raw rate is percentage like 5.00
                const rateStr = p.totalCommissionRate || '0';
                let rate = parseFloat(rateStr);
                if (rate > 1) rate = rate / 100;

                // Image
                // Doc says "productImage" usually.
                let img = p.productImage || 'https://via.placeholder.com/300?text=Lazada';
                // If specific pictures array exists (from previous implementation assumptions), check it
                if ((p as any).pictures && Array.isArray((p as any).pictures)) img = (p as any).pictures[0];

                return {
                    product_id: `laz_${pid}`,
                    product_name: p.productName,
                    product_price: price,
                    currency: p.currency || 'THB',
                    merchant_name: 'Lazada',
                    merchant_logo: 'https://laz-img-cdn.alicdn.com/images/ims-web/TB19672SXXXXXbcaXXXXXXXXXXX.png',
                    image_url: img,
                    product_url: trackingLink || '#',
                    rating: 4.5,
                    reviews_count: 100,
                    cashback_rate: rate,
                    estimated_cashback: Number((price * rate).toFixed(2)),
                    affiliate_link: wrappedLink,
                    in_stock: (p.stock !== undefined ? p.stock > 0 : true)
                };
            });

        } catch (e) {
            console.error('[Lazada] Search error:', e);
            return [];
        }
    }
};
