
import { initializeApp, cert, getApps } from 'firebase-admin/app';

const SERVICE_ACCOUNT_PATH = process.env.FIREBASE_SERVICE_ACCOUNT_PATH || './service-account.json';

let app: any;

// Only initialize if we haven't already
if (!getApps().length) {
    try {
        // In production (Cloud Run / Vercel), we rely on Env Vars or Identity
        // In local, we check for service account via standard env vars
        const { applicationDefault } = require('firebase-admin/app');
        let credential = applicationDefault();

        app = initializeApp({
            credential,
            projectId: 'gogocash-acp',
            storageBucket: 'gogocash-acp.firebasestorage.app'
        });
    } catch (error) {
        console.error('Firebase Admin Init Error:', error);
    }
} else {
    app = getApps()[0];
}

export { app };
