/// <reference types="node" />
import * as dotenv from "dotenv";
import * as path from "path";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

import * as fs from "fs";
import { parse } from "csv-parse";

// --- CONFIGURATION ---
const CSV_FILE_PATH = path.resolve(
  process.cwd(),
  "data-feed/shopee_datafeed.csv"
);
const PROJECT_ID = "gogocash-acp";
const COLLECTION_NAME = "products";
let ACCESS_TOKEN = process.env.TEMP_ACCESS_TOKEN || "PLACEHOLDER_TOKEN";

const MAX_RECORDS = 20000000; // 20 Million (Full Dataset)
const DAILY_LIMIT = Infinity; // UNLIMITED (User requested)
const BATCH_SIZE = 20; // REST API batch limit

async function getAccessToken() {
  if (process.env.FIREBASE_REFRESH_TOKEN) {
    const params = new URLSearchParams();
    params.append("grant_type", "refresh_token");
    params.append("refresh_token", process.env.FIREBASE_REFRESH_TOKEN);
    params.append(
      "client_id",
      process.env.FIREBASE_CLIENT_ID ||
        "563584335869-fgrhgmd47bqnekij5i8b5pr03ho849e6.apps.googleusercontent.com"
    );

    try {
      const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
      if (!apiKey) throw new Error("Missing NEXT_PUBLIC_FIREBASE_API_KEY");
      const response = await fetch(
        "https://securetoken.googleapis.com/v1/token?key=" + apiKey,
        {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: params,
        }
      );
      const data = await response.json();
      if (data.access_token) return data.access_token;

      // Fallback
      const response2 = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: params,
      });
      const data2 = await response2.json();
      if (data2.access_token) return data2.access_token;

      console.error("Failed to refresh token:", data);
    } catch (e) {
      console.error(e);
    }
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
  console.log(
    `Token Length: ${ACCESS_TOKEN.length}, Preview: ${ACCESS_TOKEN.substring(
      0,
      5
    )}...${ACCESS_TOKEN.slice(-5)}`
  );
  console.log(`Project: ${PROJECT_ID}, Collection: ${COLLECTION_NAME}`);
  console.log(`Target: ${MAX_RECORDS} records\n`);

  const parser = fs.createReadStream(CSV_FILE_PATH).pipe(
    parse({
      columns: true,
      skip_empty_lines: true,
      relax_quotes: true,
    })
  );

  let buffer: any[] = [];
  let totalProcessed = 0;
  let successCount = 0;

  const CHECKPOINT_FILE = path.resolve(
    process.cwd(),
    "src/ACP/scripts/upload_checkpoint.json"
  );
  const DAILY_TRACKER_FILE = path.resolve(
    process.cwd(),
    "src/ACP/scripts/daily_tracker.json"
  );

  let lastProcessedIndex = 0;
  let recordsUploadedToday = 0;
  const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD

  // Load Checkpoint
  if (fs.existsSync(CHECKPOINT_FILE)) {
    try {
      const data = JSON.parse(fs.readFileSync(CHECKPOINT_FILE, "utf8"));
      lastProcessedIndex = data.lastProcessedIndex || 0;
      console.log(`Resuming from checkpoint: Record #${lastProcessedIndex}`);
    } catch (e) {
      console.warn("Invalid checkpoint file.");
    }
  }

  // Load Daily Tracker
  if (fs.existsSync(DAILY_TRACKER_FILE)) {
    try {
      const data = JSON.parse(fs.readFileSync(DAILY_TRACKER_FILE, "utf8"));
      if (data.date === today) {
        recordsUploadedToday = data.count || 0;
        console.log(`Already uploaded today: ${recordsUploadedToday} records.`);
      } else {
        console.log(`New day detected (${today}). Resetting daily counter.`);
      }
    } catch (e) {
      console.warn("Invalid daily tracker, starting fresh count for today.");
    }
  }

  if (recordsUploadedToday >= DAILY_LIMIT) {
    console.log(
      `\n🛑 Daily Limit of ${DAILY_LIMIT} reached for ${today}. Come back tomorrow to keep it free!`
    );
    return;
  }

  for await (const record of parser) {
    totalProcessed++;

    // Fast-forward to checkpoint
    if (totalProcessed <= lastProcessedIndex) {
        if (totalProcessed % 100000 === 0) {
            process.stdout.write(`\rSkipping record ${totalProcessed}/${lastProcessedIndex}...`);
        }
        continue;
    }

    // Safety Limits
    if (totalProcessed > MAX_RECORDS) break;
    if (recordsUploadedToday >= DAILY_LIMIT) {
      console.log(
        `\n🛑 Reached Daily Limit (${DAILY_LIMIT}). Stopping for Free Tier compliance.`
      );
      break;
    }

    // Map CSV fields to Firestore Document
    if (totalProcessed === lastProcessedIndex + 1) {
        console.log(`\nResuming upload at record #${totalProcessed}. Sample: ${record.itemid}`);
    }
    const docId = record.itemid || `auto_${totalProcessed}`;
    // Generate Search Keywords (naive tokenization)
    const rawTitle = (record.title || "").toLowerCase();
    // Split by spaces, remove special chars, filter empty
    let keywords = rawTitle.replace(/[^\w\s\u0E00-\u0E7F]/g, "").split(/\s+/);
    // Limit to 10 keywords to save index space
    keywords = [...new Set(keywords)].slice(0, 10);

    const fields: any = {
      itemid: { stringValue: record.itemid || "" },
      title: { stringValue: record.title || "" },
      price: { doubleValue: record.price ? parseFloat(record.price) : 0 },
      image_url: { stringValue: record.image_link || "" },
      product_url: { stringValue: record.product_link || "" },
      shopid: { stringValue: record.shopid || "" },
      rating: {
        doubleValue: record.item_rating ? parseFloat(record.item_rating) : 0,
      },
      sold: { integerValue: record.item_sold ? parseInt(record.item_sold) : 0 },
      uploadedAt: { timestampValue: new Date().toISOString() },
      keywords: {
        arrayValue: {
          values: keywords.map((k: string) => ({ stringValue: k })),
        },
      },
    };

    buffer.push({ docId, fields });

    if (buffer.length >= BATCH_SIZE) {
      await commitBatch(buffer);
      const count = buffer.length;
      successCount += count;
      recordsUploadedToday += count;

      process.stdout.write(
        `\r[${today}] Today: ${recordsUploadedToday}/${DAILY_LIMIT} | Total: ${totalProcessed} | Uploaded: ${successCount}`
      );

      // Save State
      fs.writeFileSync(
        CHECKPOINT_FILE,
        JSON.stringify({ lastProcessedIndex: totalProcessed })
      );
      fs.writeFileSync(
        DAILY_TRACKER_FILE,
        JSON.stringify({ date: today, count: recordsUploadedToday })
      );

      buffer = [];
    }
  }

  if (buffer.length > 0) {
    await commitBatch(buffer);
    successCount += buffer.length;
  }

  console.log(
    `\n\nUpload Complete! Reason: End of CSV Stream. Successfully uploaded ${successCount} documents.`
  );
}

async function commitBatch(items: any[]) {
  // Construct batchWrite body
  const url = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents:batchWrite`;

  const writes = items.map((item) => ({
    update: {
      name: `projects/${PROJECT_ID}/databases/(default)/documents/${COLLECTION_NAME}/${item.docId}`,
      fields: item.fields,
    },
  }));

  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${ACCESS_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ writes }),
  });

  if (!response.ok) {
    const err = await response.text();
    console.error(`\nBatch failed: ${response.status} ${response.statusText}`);
    console.error(err);
    // Don't exit, just skip batch
  }
}

uploadCsvToFirestore().catch(console.error);
