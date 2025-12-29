# 🤖 How to Connect ACP to ChatGPT

You can now use your specific product data directly inside ChatGPT!

## Step 1: Deploy the Spec

I have created the API definition file at `public/openapi.yaml`.
You need to deploy this change first so ChatGPT can see it.

1.  Run `./deploy_to_firebase.sh` (or `firebase deploy --only hosting`).
2.  Verify you can see the file at: `https://gogocash-acp.web.app/openapi.yaml`

## Step 2: Configure the GPT

1.  **Name**: Agentic Commerce Assistant
2.  **Description**: I help you find products and check cashback rewards.
3.  **Instructions**: copy and paste the text below:

```text
You are the GoGoCash Shopping Assistant, an AI-powered cashback shopping expert.

Your goal is to help users find the best products with cashback rewards and manage their GoGoCash profile.

### Core Capabilities:
1. **Product Search**: Search for products across merchants with cashback tracking
2. **Account Linking**: Help users link their GoGoCash accounts for cashback rewards
3. **Profile Management**: Check user balance, points, and cashback history

### Authentication Flow:
- **Account Linking**: If the user wants to earn cashback:
  1. Direct them to create an account at: `https://app.gogocash.co`
  2. Ask them to share their email address with you
  3. Once they provide the email, say "Thanks! I've linked your account." and proceed
- **For searches**: Always pass the user's email in the `user_email` parameter if available

### Tools:
1. **searchProducts**: Use this WHENEVER the user asks to find, buy, or search for a product.
   - CRITICAL: If the user has shared their email, pass it to the `user_email` parameter
   - Display results with images: `![Product Name](image_url)`
   - Show: Product Name, Price, Merchant, Estimated Cashback
   - Use the `affiliate_link` as "Buy Now & Earn Cashback" button
   - NEVER invent products. Only show what the API returns.

2. **getUserProfile**: Check user balance, GO points, and tier status
   - Use the user's email address for lookup

3. **getUserCashback**: Show cashback transaction history
   - Use the user's email address for lookup

### Tone & Style:
- Professional, helpful, and money-savvy
- Emphasize "Cashback" and "Savings" 
- Use phrases like "I found these deals for you!" and highlight savings

### Rules:
- Do not make up product details. Use only API responses.
- Do not strip parameters from affiliate_link - it contains tracking logic
- Always encourage account creation for cashback benefits
```

## Step 3: Add Actions (The Schema)

1.  Click **Create new action**.
2.  **Import from URL**: `https://gogocash-acp.web.app/openapi.yaml`
3.  **Troubleshooting**: If the URL import fails, copy the text below and paste it into the "Schema" box manually:

<details>
<summary>Click to expand OpenAPI Schema</summary>

```yaml
openapi: 3.1.0
info:
  title: Agentic Commerce Protocol (ACP)
  description: API for searching products with cashback and checking user rewards.
  version: 1.0.0
servers:
  - url: https://gogocash-acp.web.app
    description: Production Server
paths:
  /api/searchProducts:
    get:
      operationId: searchProducts
      summary: Search for products
      description: Search the product catalog. Returns products with cashback affiliate links.
      parameters:
        - name: query
          in: query
          description: Search keywords (e.g., "iphone 15", "running shoes")
          required: true
          schema:
            type: string
        - name: user_email
          in: query
          description: User's email address for linking/tracking (Required for cashback tracking)
          required: false
          schema:
            type: string
        - name: limit
          in: query
          description: Number of results (default 5)
          required: false
          schema:
            type: integer
      responses:
        "200":
          description: Successful search
          content:
            application/json:
              schema:
                type: object
                properties:
                  query:
                    type: string
                  total_results:
                    type: integer
                  results:
                    type: array
                    items:
                      type: object
                      properties:
                        product_name:
                          type: string
                        product_price:
                          type: number
                        affiliate_link:
                          type: string
                          description: Clickable link for the user (Contains tracking)
                        image_url:
                          type: string
                        merchant_name:
                          type: string
                        estimated_cashback:
                          type: number

  /api/user/profile:
    get:
      operationId: getUserProfile
      summary: Get User Profile
      description: Retrieve user balance, points, and tier.
      parameters:
        - name: user_email
          in: query
          description: User email (Required)
          required: true
          schema:
            type: string
      responses:
        "200":
          description: User profile found
          content:
            application/json:
              schema:
                type: object
                properties:
                  user:
                    type: object
                    properties:
                      id:
                        type: string
                      email:
                        type: string
                      balance:
                        type: number
                      go_points:
                        type: number
                      go_tier:
                        type: string

  /api/user/cashback:
    get:
      operationId: getUserCashback
      summary: Get Cashback History
      description: Retrieve list of past cashback transactions.
      parameters:
        - name: user_email
          in: query
          description: User email (Required)
          required: true
          schema:
            type: string
      responses:
        "200":
          description: History found
          content:
            application/json:
              schema:
                type: object
                properties:
                  cashbacks:
                    type: array
                    items:
                      type: object
                      properties:
                        amount:
                          type: number
                        description:
                          type: string
                        status:
                          type: string
                        createdAt:
                          type: string
```

</details>

## Step 4: Test it!

In the Preview pane (right side), try these examples:

> "I want to link my GoGoCash account"

The assistant should direct you to create an account at https://app.gogocash.co and ask for your email.

> "Find me a cheap mechanical keyboard"

ChatGPT will call your API and show real products with cashback information!

> "What's my cashback balance?"

After linking your account, it will show your GO points, tier, and balance.
