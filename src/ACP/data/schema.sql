-- Enable UUID extension if needed
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

DROP TABLE IF EXISTS shopee_products;

-- Create table for Shopee products
CREATE TABLE IF NOT EXISTS shopee_products (
    itemid BIGINT PRIMARY KEY,
    title TEXT NOT NULL,
    price NUMERIC(10, 2) NOT NULL,
    price_usd NUMERIC(10, 2), -- Approx 1 USD = 34 THB
    currency VARCHAR(3) DEFAULT 'THB',
    rating NUMERIC(3, 2),
    sold INT DEFAULT 0,
    image_url TEXT,
    product_url TEXT,
    affiliate_link TEXT,
    merchant_name TEXT DEFAULT 'Shopee',
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Search vector for full text search
    fts tsvector GENERATED ALWAYS AS (to_tsvector('english', title)) STORED
);

-- Index for fast search
CREATE INDEX IF NOT EXISTS products_fts_idx ON shopee_products USING GIN (fts);
CREATE INDEX IF NOT EXISTS products_sold_idx ON shopee_products (sold DESC);
