# API Reference

Base URL: `https://gogocash-acp.web.app`

## 🔎 Search
### `GET /api/searchProducts`
Search for products in the catalog.
*   **Query Params**:
    *   `q` (string): Search keywords.
    *   `minPrice`, `maxPrice` (number): Filter range.
    *   `limit` (number): Max results (default 20).
*   **Response**: Array of product objects.

## 👤 User
### `GET /api/login`
Authenticate or retrieve user status.
*   **Headers**: `Authorization: Bearer <firebase_id_token>`
*   **Response**: `{ user: { email, phone, balance } }`

### `GET /api/check-mongo-user` (Admin/Debug)
Check user data from legacy MongoDB (if configured).
*   **Query Params**: `email` or `phone`.
*   **Response**: Full profile + cashback history.

## 💰 Wallet
### `POST /api/linkWallet`
Link a verified phone number to the current user.
*   **Body**: `{ phone: "+66..." }`
*   **Response**: `{ success: true, walletId: "..." }`

### `GET /api/getCashback`
Get cashback balance and recent transactions.
*   **Response**: `{ balance: 150.00, transactions: [...] }`
