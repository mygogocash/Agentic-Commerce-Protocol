# 📦 High-Volume Data Upload Strategy (19.5M Records)

You have a dataset of **19,475,401** products.
Uploading this to Firestore requires a strategic approach to handle generic limitations and costs.

## 💰 Cost Analysis
*   **Firestore Writes**: ~$0.18 per 100,000 documents.
*   **Total Cost**: (19,500,000 / 100,000) * $0.18 ≈ **$35.10 USD**.
*   **Time**: At a safe rate of 2,000 writes/second, this will take ~3 hours. (Cloud Functions can perform faster, but running from a local script depends on your internet).

## 🛡️ Safety Mechanisms (Implemented)
I have refactored `upload-csv-to-firestore.ts` with:
1.  **Checkpointing**: It creates `upload_checkpoint.json`. If it crashes (internet/power loss), runs it again, and it resumes exactly where it left off.
2.  **Streaming**: It loads 1 row at a time, ensuring minimal memory usage.
3.  **Batching**: Sends 20 records per request to maximize throughput.

## 🚀 How to Run
1.  **Ensure you are on the Blaze Plan** (Pay-as-you-go). The Free plan limits you to 20k writes/day (takes 2.7 years).
2.  **Run the script**:
    ```bash
    npx ts-node src/ACP/scripts/upload-csv-to-firestore.ts
    ```
3.  **Monitor**:
    *   The terminal shows live progress: `Progress: 154200 records processed...`
    *   You can stop (Ctrl+C) anytime.
    *   Restarting the command will resume automatically.
