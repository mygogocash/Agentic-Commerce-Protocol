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
You are the Agentic Commerce Assistant, a helpful shopping expert.

Your goal is to help users find the best products and check their rewards status.

### Tools:
1.  **searchProducts**: Use this WHENEVER the user asks to find, buy, or search for a product.
    *   ALWAYS ask for clarification if the query is too vague (e.g., "shoes").
    *   Suggest searching for "top rated" or strict keywords.
    *   When results are returned, display them in a clean list with:
        *   Product Name
        *   Price (formatted in original currency)
        *   Platform (e.g., Shopee)
        *   Direct Link to buy
    *   NEVER invent products. Only show what the API returns.

2.  **checkUser**: Use this if the user asks about their "profile", "cashback", or "points".
    *   Ask for their email or phone number first if not provided.
```

## Step 3: Add Actions (The Schema)

1.  Click **Create new action**.
2.  **Import from URL**: `https://gogocash-acp.web.app/openapi.yaml`
3.  **Troubleshooting**: If the URL import fails, copy the text below and paste it into the "Schema" box manually:

<details>
<summary>Click to expand strict JSON Schema</summary>

```yaml
openapi: 3.1.0
info:
  title: Agentic Commerce Protocol (ACP)
  description: API for searching products and checking user cashback rewards.
  version: 1.0.0
servers:
  - url: https://gogocash-acp.web.app
    description: Production Server (Firebase)
paths:
  /api/searchProducts:
    get:
      operationId: searchProducts
      summary: Search for products
      description: Search the product catalog using keywords (e.g., "iphone", "dress").
      parameters:
        - name: query
          in: query
          description: Search keywords (e.g. "iphone 15 pro")
          required: true
          schema:
            type: string
        - name: limit
          in: query
          description: Number of results (default 5)
          required: false
          schema:
            type: integer
      responses:
        '200':
          description: Successful search results
          content:
            application/json:
              schema:
                type: object
                properties:
                  results:
                    type: array
                    items:
                      type: object
                      properties:
                        product_name:
                          type: string
                        product_price:
                          type: number
                        product_url:
                          type: string
                        image_url:
                          type: string
                        merchant_name:
                          type: string
  /api/check-mongo-user:
    get:
      operationId: checkUser
      summary: Check User Profile
      description: Retrieve legacy user data and cashback history.
      parameters:
        - name: email
          in: query
          schema:
            type: string
      responses:
        '200':
          description: User profile found
          content:
            application/json:
              schema:
                type: object
                properties:
                  found:
                    type: boolean
                  user:
                    type: object
```
</details>

## Step 4: Test it!
In the Preview pane (right side), type:
> "Find me a cheap mechanical keyboard"

ChatGPT will call your API and show real products!

