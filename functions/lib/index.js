"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.getUserCashback = exports.getUserProfile = exports.searchProducts = exports.test = void 0;
const https_1 = require("firebase-functions/v2/https");
const admin = __importStar(require("firebase-admin"));
admin.initializeApp();
// CORS headers helper
const setCorsHeaders = (res) => {
    res.set('Access-Control-Allow-Origin', '*');
    res.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
};
// Test API endpoint
exports.test = (0, https_1.onRequest)((req, res) => {
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
exports.searchProducts = (0, https_1.onRequest)((req, res) => {
    setCorsHeaders(res);
    if (req.method === 'OPTIONS') {
        res.status(200).send('');
        return;
    }
    const query = req.query.query || 'default';
    const userEmail = req.query.user_email;
    const limit = parseInt(req.query.limit || '5');
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
exports.getUserProfile = (0, https_1.onRequest)(async (req, res) => {
    setCorsHeaders(res);
    if (req.method === 'OPTIONS') {
        res.status(200).send('');
        return;
    }
    const userEmail = req.query.user_email;
    if (!userEmail) {
        res.status(400).json({ error: 'user_email parameter is required' });
        return;
    }
    try {
        // Call real GoGoCash API
        const response = await fetch('https://api.gogocash.co/auth/log-in/ai', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: userEmail })
        });
        if (!response.ok) {
            res.status(401).json({
                error: 'Account not found. Please create an account at https://app.gogocash.co first.',
                signup_url: 'https://app.gogocash.co'
            });
            return;
        }
        const data = await response.json();
        res.json({
            user: {
                id: data.id || data._id || data.userId,
                email: data.email || userEmail,
                balance: data.balance || data.cashback_balance || 0,
                go_points: data.go_points || data.goPoints || data.points || 0,
                go_tier: data.go_tier || data.goTier || data.tier || 'Bronze',
                joined_at: data.joined_at || data.createdAt || data.created_at
            }
        });
    }
    catch (error) {
        console.error('Error calling GoGoCash API:', error);
        res.status(500).json({ error: 'Failed to fetch user profile' });
    }
});
// User Cashback API endpoint
exports.getUserCashback = (0, https_1.onRequest)((req, res) => {
    setCorsHeaders(res);
    if (req.method === 'OPTIONS') {
        res.status(200).send('');
        return;
    }
    const userEmail = req.query.user_email;
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
//# sourceMappingURL=index.js.map