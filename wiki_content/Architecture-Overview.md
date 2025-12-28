# Architecture Overview

## System Diagram
```mermaid
graph TD
    Client[Client App / Agent] -->|HTTPS| API[Next.js API Routes (Cloud Functions)]
    API -->|Read/Write| DB[(Firestore Database)]
    API -->|Auth| Auth[Firebase Auth]
    
    subgraph Firestore Collections
        Products[products]
        Users[users]
        Cashback[usermycashbacks]
    end
    
    DB --> Products
    DB --> Users
    DB --> Cashback
```

## Data Schema

### 1. Products Collection (`products`)
Stores e-commerce catalog data.
*   `itemid` (string): Unique identifier.
*   `title` (string): Product name.
*   `price` (number): Price in base currency.
*   `image_url` (string): URL to product image.
*   `shopid` (string): Shop identifier.
*   `rating` (number): Star rating (0-5).

### 2. Users Collection (`users`)
Stores user profiles.
*   `email` (string): User email.
*   `phone` (string): Verified phone number.
*   `balance` (number): Current wallet balance.
*   `go_points` (number): Loyalty points.
*   `migrated_at` (timestamp): Migration date (if from MongoDB).

### 3. Cashback Collection (`usermycashbacks`)
Tracks reward history.
*   `userId` (string): Link to `users` document ID.
*   `amount` (number): Cashback amount.
*   `status` (string): `pending`, `confirmed`, `paid`.
*   `createdAt` (timestamp).

## Key Design Decisions
1.  **Serverless**: Entirely hosted on Firebase to avoid managing servers (EC2/VPS).
2.  **Next.js Adapter**: Uses `firebase-frameworks` to run Next.js SSR logic within Cloud Functions.
3.  **Direct DB Access**: API routes interact directly with Firestore using `firebase-admin`, bypassing legacy middleware.
