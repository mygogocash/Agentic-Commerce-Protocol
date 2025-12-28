import * as fs from 'fs';
import * as path from 'path';
import { parse } from 'csv-parse';

// --- CONFIGURATION ---
const CSV_FILE_PATH = path.resolve(__dirname, '../../../data-feed/shopee_datafeed.csv');
const PROJECT_ID = 'gogocash-acp';
const COLLECTION_NAME = 'products';
let ACCESS_TOKEN = process.env.TEMP_ACCESS_TOKEN || "PLACEHOLDER_TOKEN";

const MAX_RECORDS = 500000; // Increased limit for bulk upload
const BATCH_SIZE = 20;    // REST API batch limit

import * as dotenv from 'dotenv';
dotenv.config({ path: path.resolve(__dirname, '../../../.env.local') });

async function getAccessToken() {
    if (process.env.FIREBASE_REFRESH_TOKEN) {
        const params = new URLSearchParams();
        params.append('grant_type', 'refresh_token');
        params.append('refresh_token', process.env.FIREBASE_REFRESH_TOKEN);
        params.append('client_id', process.env.FIREBASE_CLIENT_ID || '563584335869-fgrhgmd47bqnekij5i8b5pr03ho849e6.apps.googleusercontent.com');
        
        try {
            const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyAh8WyPFz1nXFudNto0es4ZsnEjawtdKPg";
            const response = await fetch('https://securetoken.googleapis.com/v1/token?key=' + apiKey, {
                 method: 'POST',
                 headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                 body: params
            });
            const data = await response.json();
            if (data.access_token) return data.access_token;
            
            // Fallback
             const response2 = await fetch('https://oauth2.googleapis.com/token', {
                 method: 'POST',
                 headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                 body: params
            });
            const data2 = await response2.json();
             if (data2.access_token) return data2.access_token;

            console.error('Failed to refresh token:', data);
        } catch(e) { console.error(e); }
    }
    return ACCESS_TOKEN;
}

async function uploadCsvToFirestore() {
    if (!fs.existsSync(CSV_FILE_PATH)) {
        console.error(`CSV file not found at: ${CSV_FILE_PATH}`);
        return;
    }

    console.log(`Starting upload to Firestore (REST API)...`);
    ACCESS_TOKEN = await getAccessToken(); // Fetch fresh token
    console.log(`Project: ${PROJECT_ID}, Collection: ${COLLECTION_NAME}`);
    console.log(`Target: ${MAX_RECORDS} records\n`);

    const parser = fs.createReadStream(CSV_FILE_PATH).pipe(parse({
        columns: true,
        skip_empty_lines: true,
        relax_quotes: true
    }));

    let buffer: any[] = [];
    let totalProcessed = 0;
    let successCount = 0;

const SKIP_RECORDS = 235000; // Resume point (Quota Hit)

    for await (const record of parser) {
        if (totalProcessed < SKIP_RECORDS) {
            totalProcessed++;
            continue;
        }
        if (totalProcessed >= MAX_RECORDS) break;

        // Map CSV fields to Firestore Document
        // Firestore REST API requires specific format: { fields: { key: { stringValue: val } } }
        const docId = record.itemid || `auto_${totalProcessed}`;
        const fields: any = {
            itemid: { stringValue: record.itemid || '' },
            title: { stringValue: record.title || '' },
            price: { doubleValue: record.price ? parseFloat(record.price) : 0 },
            image_url: { stringValue: record.image_link || '' },
            product_url: { stringValue: record.product_link || '' },
            shopid: { stringValue: record.shopid || '' },
            rating: { doubleValue: record.item_rating ? parseFloat(record.item_rating) : 0 },
            sold: { integerValue: record.item_sold ? parseInt(record.item_sold) : 0 },
            uploadedAt: { timestampValue: new Date().toISOString() }
        };

        buffer.push({ docId, fields });
        totalProcessed++;

        if (buffer.length >= BATCH_SIZE) {
            await commitBatch(buffer);
            successCount += buffer.length;
            process.stdout.write(`\rProgress: ${successCount} / ${MAX_RECORDS} uploaded...`);
            buffer = [];
        }
    }

    if (buffer.length > 0) {
        await commitBatch(buffer);
        successCount += buffer.length;
    }

    console.log(`\n\nUpload Complete! Successfully uploaded ${successCount} documents.`);
}

async function commitBatch(items: any[]) {
    // Construct batchWrite body
    const url = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents:batchWrite`;
    
    const writes = items.map(item => ({
        update: {
            name: `projects/${PROJECT_ID}/databases/(default)/documents/${COLLECTION_NAME}/${item.docId}`,
            fields: item.fields
        }
    }));

    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${ACCESS_TOKEN}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ writes })
    });

    if (!response.ok) {
        const err = await response.text();
        console.error(`\nBatch failed: ${response.status} ${response.statusText}`);
        console.error(err);
        // Don't exit, just skip batch
    }
}

uploadCsvToFirestore().catch(console.error);

