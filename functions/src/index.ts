import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

admin.initializeApp();

// Simple test function
export const helloWorld = functions.https.onRequest((request, response) => {
    functions.logger.info("Hello logs!", { structuredData: true });
    response.send("Hello from Firebase!");
});

// API proxy for Next.js routes
export const api = functions.https.onRequest((req, res) => {
    // This will proxy requests to your Next.js API routes
    res.set('Access-Control-Allow-Origin', '*');
    res.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') {
        res.status(200).send('');
        return;
    }

    // For now, return a simple response
    res.json({
        message: 'Firebase Functions API is working',
        path: req.path,
        method: req.method,
        timestamp: new Date().toISOString()
    });
});