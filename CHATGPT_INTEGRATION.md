# 🤖 How to Connect ACP to ChatGPT

You can now use your specific product data directly inside ChatGPT!

## Step 1: Deploy the Spec
I have created the API definition file at `public/openapi.yaml`.
You need to deploy this change first so ChatGPT can see it.

1.  Run `./deploy_to_firebase.sh` (or `firebase deploy --only hosting`).
2.  Verify you can see the file at: `https://gogocash-acp.web.app/openapi.yaml`

## Step 2: Create the Custom GPT
1.  Go to [ChatGPT](https://chat.openai.com/).
2.  Click **Explore GPTs** -> **Create**.
3.  Go to the **Configure** tab.
4.  Scroll down to **Actions** and click **Create new action**.

## Step 3: Import the Schema
1.  Click **Import from URL**.
2.  Paste: `https://gogocash-acp.web.app/openapi.yaml`
3.  Click **Import**.
4.  You should see available actions like `searchProducts` and `checkUser`.

## Step 4: Test it!
In the Preview pane (right side), type:
> "Search for a blue dress under 500 baht"

ChatGPT will call your API, get the real data from Firestore, and show you the results!
