import { onRequest } from 'firebase-functions/v2/https';
import * as admin from 'firebase-admin';

admin.initializeApp();

// CORS headers helper
const setCorsHeaders = (res: any) => {
    res.set('Access-Control-Allow-Origin', '*');
    res.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
};

// Test API endpoint
export const test = onRequest((req, res) => {
    setCorsHeaders(res);

    if (req.method === 'OPTIONS') {
        res.status(200).send('');
        return;
    }

    res.json({
        message: 'Firebase Functions v2 API is working!',
        timestamp: new Date().toISOString(),
        method: req.method,
        path: req.path
    });
});

// Search Products API endpoint
export const searchProducts = onRequest((req, res) => {
    setCorsHeaders(res);

    if (req.method === 'OPTIONS') {
        res.status(200).send('');
        return;
    }

    const query = req.query.query as string || 'default';
    const userEmail = req.query.user_email as string;
    const limit = parseInt(req.query.limit as string || '5');

    // Mock products for testing
    const mockProducts = [
        {
            product_id: 'firebase_1',
            product_name: `Premium ${query.charAt(0).toUpperCase() + query.slice(1)} - High Quality`,
            product_price: 1299,
            currency: "THB",
            merchant_name: "Shopee",
            merchant_logo: "https://cf.shopee.co.th/file/38d3010b996b7d22f281e69974261899",
            image_url: `https://via.placeholder.com/300x300/FF6B35/FFFFFF?text=${encodeURIComponent(query)}`,
            product_url: "https://shopee.co.th/firebase-product-1",
            rating: 4.5,
            reviews_count: 1250,
            cashback_rate: 0.05,
            estimated_cashback: 64.95,
            affiliate_link: "https://shopee.co.th/firebase-product-1",
            in_stock: true
        },
        {
            product_id: 'firebase_2',
            product_name: `Budget ${query.charAt(0).toUpperCase() + query.slice(1)} - Great Value`,
            product_price: 599,
            currency: "THB",
            merchant_name: "Shopee",
            merchant_logo: "https://cf.shopee.co.th/file/38d3010b996b7d22f281e69974261899",
            image_url: `https://via.placeholder.com/300x300/4ECDC4/FFFFFF?text=Budget+${encodeURIComponent(query)}`,
            product_url: "https://shopee.co.th/firebase-product-2",
            rating: 4.2,
            reviews_count: 856,
            cashback_rate: 0.05,
            estimated_cashback: 29.95,
            affiliate_link: "https://shopee.co.th/firebase-product-2",
            in_stock: true
        }
    ];

    res.json({
        query,
        user_email: userEmail,
        total_results: mockProducts.length,
        results: mockProducts.slice(0, limit),
        message: 'Firebase Functions v2 API working with mock data',
        timestamp: new Date().toISOString()
    });
});

// User Profile API endpoint
export const getUserProfile = onRequest((req, res) => {
    setCorsHeaders(res);

    if (req.method === 'OPTIONS') {
        res.status(200).send('');
        return;
    }

    const userEmail = req.query.user_email as string;

    if (!userEmail) {
        res.status(400).json({ error: 'user_email parameter is required' });
        return;
    }

    // Mock user profile
    res.json({
        user: {
            id: 'firebase_user_1',
            email: userEmail,
            balance: 150.75,
            go_points: 1250,
            go_tier: 'Silver',
            joined_at: '2024-01-15T10:30:00Z'
        }
    });
});

// User Cashback API endpoint
export const getUserCashback = onRequest((req, res) => {
    setCorsHeaders(res);

    if (req.method === 'OPTIONS') {
        res.status(200).send('');
        return;
    }

    const userEmail = req.query.user_email as string;

    if (!userEmail) {
        res.status(400).json({ error: 'user_email parameter is required' });
        return;
    }

    // Mock cashback history
    res.json({
        cashbacks: [
            {
                amount: 25.50,
                description: 'Cashback from Shopee purchase',
                status: 'approved',
                createdAt: '2024-12-28T14:30:00Z'
            },
            {
                amount: 15.25,
                description: 'Cashback from electronics purchase',
                status: 'approved',
                createdAt: '2024-12-27T09:15:00Z'
            },
            {
                amount: 8.75,
                description: 'Cashback from fashion purchase',
                status: 'pending',
                createdAt: '2024-12-26T16:45:00Z'
            }
        ]
    });
});