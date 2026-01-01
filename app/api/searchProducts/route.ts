import { NextResponse } from 'next/server';

// Add CORS headers
function addCorsHeaders(response: NextResponse) {
    response.headers.set('Access-Control-Allow-Origin', '*');
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    return response;
}

// Firestore REST API Configuration
const FIRESTORE_PROJECT_ID = 'gogocash-acp';
const FIRESTORE_BASE_URL = `https://firestore.googleapis.com/v1/projects/${FIRESTORE_PROJECT_ID}/databases/(default)/documents`;

// English to Thai and Thai to English synonyms for better search
const SYNONYMS: { [key: string]: string[] } = {
    // Electronics
    'keyboard': ['keyboard', 'คีย์บอร์ด', 'คีบอร์ด', 'mechanical', 'gaming'],
    'mechanical': ['mechanical', 'เมคานิคอล', 'คีย์บอร์ด', 'keyboard'],
    'mouse': ['mouse', 'เมาส์', 'gaming', 'wireless'],
    'headphone': ['headphone', 'หูฟัง', 'earphone', 'headset'],
    'earphone': ['earphone', 'หูฟัง', 'headphone', 'earbud', 'earbuds'],
    'laptop': ['laptop', 'โน๊ตบุ๊ค', 'notebook', 'computer'],
    'phone': ['phone', 'โทรศัพท์', 'smartphone', 'mobile', 'iphone', 'samsung'],
    'watch': ['watch', 'นาฬิกา', 'smartwatch', 'smart'],
    'camera': ['camera', 'กล้อง', 'dslr', 'mirrorless'],
    'speaker': ['speaker', 'ลำโพง', 'bluetooth', 'wireless'],
    'monitor': ['monitor', 'จอ', 'display', 'screen'],
    'charger': ['charger', 'ที่ชาร์จ', 'adapter', 'power'],
    'cable': ['cable', 'สาย', 'usb', 'type-c'],
    
    // Fashion
    'shirt': ['shirt', 'เสื้อ', 'tshirt', 't-shirt', 'top'],
    'pants': ['pants', 'กางเกง', 'jeans', 'trousers'],
    'shoe': ['shoe', 'รองเท้า', 'shoes', 'sneakers', 'boots'],
    'bag': ['bag', 'กระเป๋า', 'backpack', 'handbag'],
    'dress': ['dress', 'เดรส', 'ชุดเดรส', 'skirt'],
    
    // Home
    'chair': ['chair', 'เก้าอี้', 'gaming', 'office'],
    'table': ['table', 'โต๊ะ', 'desk'],
    'lamp': ['lamp', 'โคม', 'โคมไฟ', 'light'],
    'fan': ['fan', 'พัดลม', 'cooling'],
    
    // Beauty
    'makeup': ['makeup', 'เมคอัพ', 'cosmetic', 'beauty'],
    'skincare': ['skincare', 'สกินแคร์', 'cream', 'serum'],
    'perfume': ['perfume', 'น้ำหอม', 'fragrance'],
    
    // General
    'gaming': ['gaming', 'เกมมิ่ง', 'gamer', 'game'],
    'wireless': ['wireless', 'ไร้สาย', 'bluetooth'],
    'usb': ['usb', 'usb-c', 'type-c', 'type'],
    'rgb': ['rgb', 'led', 'light', 'backlit'],
};

interface FirestoreProduct {
    product_id: string;
    product_name: string;
    product_price: number;
    currency: string;
    merchant_name: string;
    merchant_logo: string;
    image_url: string;
    product_url: string;
    rating: number;
    reviews_count: number;
    cashback_rate: number;
    estimated_cashback: number;
    affiliate_link: string;
    in_stock: boolean;
}

// Parse Firestore document into product object
function parseFirestoreDoc(doc: any): FirestoreProduct | null {
    try {
        const fields = doc.fields;
        const name = doc.name || '';
        const docId = name.split('/').pop() || '';
        
        // Get image URL and ensure it's valid
        let imageUrl = fields.image_url?.stringValue || fields.image?.stringValue || '';
        
        // If image URL is missing or placeholder, try to construct from Shopee CDN
        if (!imageUrl || imageUrl.includes('placeholder')) {
            imageUrl = 'https://cf.shopee.co.th/file/sg-11134201-22100-1h1h1h1h1h1h';
        }
        
        const price = Number(fields.price?.integerValue || fields.price?.doubleValue || 0);
        
        return {
            product_id: docId,
            product_name: fields.title?.stringValue || fields.name?.stringValue || 'Unknown Product',
            product_price: price,
            currency: fields.currency?.stringValue || 'THB',
            merchant_name: fields.merchant_name?.stringValue || 'Shopee',
            merchant_logo: 'https://cf.shopee.co.th/file/38d3010b996b7d22f281e69974261899',
            image_url: imageUrl,
            product_url: fields.product_url?.stringValue || fields.link?.stringValue || '',
            rating: Number(fields.rating?.doubleValue || fields.rating?.integerValue || 4.0),
            reviews_count: Number(fields.sold?.integerValue || fields.reviews_count?.integerValue || 0),
            cashback_rate: 0.05,
            estimated_cashback: Math.round(price * 0.05 * 100) / 100,
            affiliate_link: fields.affiliate_link?.stringValue || fields.product_url?.stringValue || fields.link?.stringValue || '',
            in_stock: true
        };
    } catch (error) {
        console.error('Error parsing Firestore doc:', error);
        return null;
    }
}

// Extract search keywords from query (removes noise words, extracts product terms)
function extractSearchKeywords(query: string): string[] {
    const cleanQuery = query.toLowerCase()
        .replace(/[^\w\sก-๙]/g, ' ')  // Keep alphanumeric and Thai characters
        .replace(/\s+/g, ' ')
        .trim();
    
    // Noise words to remove
    const noiseWords = new Set([
        'find', 'me', 'a', 'an', 'the', 'on', 'in', 'for', 'with', 'and', 'or',
        'within', 'under', 'below', 'above', 'over', 'around', 'about',
        'thb', 'baht', 'usd', 'dollars', 'price', 'cost', 'budget',
        'shopee', 'lazada', 'amazon', 'please', 'want', 'need', 'looking',
        'good', 'best', 'top', 'great', 'nice', 'cheap', 'expensive',
        'หา', 'ต้องการ', 'อยากได้', 'ราคา', 'ไม่เกิน', 'ประมาณ'
    ]);
    
    // Extract meaningful keywords
    const words = cleanQuery.split(' ')
        .filter(word => word.length > 1 && !noiseWords.has(word));
    
    // Expand with synonyms
    const expandedKeywords = new Set<string>();
    words.forEach(word => {
        expandedKeywords.add(word);
        // Check if word has synonyms
        for (const [key, synonyms] of Object.entries(SYNONYMS)) {
            if (key === word || synonyms.includes(word)) {
                synonyms.forEach(s => expandedKeywords.add(s));
            }
        }
    });
    
    return Array.from(expandedKeywords).slice(0, 10); // Limit to 10 keywords
}

// Query Firestore with a single keyword
async function queryFirestoreByKeyword(keyword: string, limit: number): Promise<FirestoreProduct[]> {
    try {
        const structuredQuery = {
            structuredQuery: {
                from: [{ collectionId: "products" }],
                where: {
                    fieldFilter: {
                        field: { fieldPath: "keywords" },
                        op: "ARRAY_CONTAINS",
                        value: { stringValue: keyword }
                    }
                },
                limit: limit
            }
        };

        const response = await fetch(
            `${FIRESTORE_BASE_URL}:runQuery`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(structuredQuery)
            }
        );

        if (!response.ok) {
            return [];
        }

        const results = await response.json();
        return results
            .filter((r: any) => r.document)
            .map((r: any) => parseFirestoreDoc(r.document))
            .filter((p: FirestoreProduct | null): p is FirestoreProduct => p !== null);
    } catch (error) {
        console.error('Firestore query error for keyword:', keyword, error);
        return [];
    }
}

// Search products using multiple keywords with priority
async function searchFirestoreProducts(query: string, limit: number = 5): Promise<FirestoreProduct[]> {
    const keywords = extractSearchKeywords(query);
    console.log('Search keywords:', keywords);
    
    if (keywords.length === 0) {
        return [];
    }
    
    // Try each keyword until we get results
    const seenIds = new Set<string>();
    const allProducts: FirestoreProduct[] = [];
    
    for (const keyword of keywords) {
        if (allProducts.length >= limit * 2) break;
        
        const products = await queryFirestoreByKeyword(keyword, limit);
        
        for (const product of products) {
            if (!seenIds.has(product.product_id)) {
                seenIds.add(product.product_id);
                allProducts.push(product);
            }
        }
    }
    
    // Extract price limit from query
    const priceMatch = query.match(/(?:within|under|below|ไม่เกิน|ราคา|budget)\s*[฿$]?\s*([\d,]+)/i);
    let filteredProducts = allProducts;
    
    if (priceMatch) {
        const maxPrice = parseInt(priceMatch[1].replace(/,/g, ''));
        filteredProducts = allProducts.filter(p => p.product_price <= maxPrice);
        
        // If price filter removed all results, return original (with warning in name)
        if (filteredProducts.length === 0 && allProducts.length > 0) {
            // Sort by price ascending and take cheapest ones
            filteredProducts = allProducts
                .sort((a, b) => a.product_price - b.product_price)
                .slice(0, limit);
        }
    }
    
    // Sort by rating descending
    filteredProducts.sort((a, b) => b.rating - a.rating);
    
    return filteredProducts.slice(0, limit);
}

// Generate fallback with Shopee search link
function generateFallbackProducts(query: string): FirestoreProduct[] {
    const keywords = extractSearchKeywords(query);
    const mainTerm = keywords[0] || 'product';
    const shopeeSearchUrl = `https://shopee.co.th/search?keyword=${encodeURIComponent(query)}`;
    
    return [{
        product_id: 'search_link',
        product_name: `🔍 ค้นหา "${mainTerm}" บน Shopee`,
        product_price: 0,
        currency: 'THB',
        merchant_name: 'Shopee',
        merchant_logo: 'https://cf.shopee.co.th/file/38d3010b996b7d22f281e69974261899',
        image_url: 'https://cf.shopee.co.th/file/9ca36899f65dff9cc6ce62b92e70e567',
        product_url: shopeeSearchUrl,
        rating: 5.0,
        reviews_count: 0,
        cashback_rate: 0.05,
        estimated_cashback: 0,
        affiliate_link: shopeeSearchUrl,
        in_stock: true
    }];
}

export async function OPTIONS(request: Request) {
    return addCorsHeaders(new NextResponse(null, { status: 200 }));
}

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const query = searchParams.get('query') || 'default';
        const userEmail = searchParams.get('user_email');
        const limit = parseInt(searchParams.get('limit') || '5');

        // Try to fetch real products from Firestore with enhanced search
        let products = await searchFirestoreProducts(query, limit);
        let source = 'firestore';
        
        // Fallback to Shopee search link if no results
        if (products.length === 0) {
            products = generateFallbackProducts(query);
            source = 'shopee_search';
        }
        
        // Wrap affiliate links with tracking if user email provided
        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://gogocash-acp.web.app';
        const trackedResults = products.map((product) => {
            let trackingLink = product.affiliate_link || product.product_url;
            
            // If we have a user email, route through our redirector
            if (trackingLink && userEmail) {
                trackingLink = `${baseUrl}/api/redirect?url=${encodeURIComponent(trackingLink)}&user_email=${encodeURIComponent(userEmail)}`;
            }
            
            // Create proxied image URL for ChatGPT to render
            const originalImageUrl = product.image_url;
            const proxiedImageUrl = originalImageUrl && originalImageUrl.includes('shopee') 
                ? `${baseUrl}/api/image?url=${encodeURIComponent(originalImageUrl)}`
                : originalImageUrl;
            
            // Product card URL for viewing details with image
            const productCardUrl = `${baseUrl}/product/${product.product_id}`;
            
            return {
                ...product,
                image_url: proxiedImageUrl,
                image_url_original: originalImageUrl,
                product_card_url: productCardUrl,  // Link to view product with image
                affiliate_link: trackingLink
            };
        });

        const response = NextResponse.json({
            query,
            user_email: userEmail,
            total_results: products.length,
            results: trackedResults,
            source,
            keywords_used: extractSearchKeywords(query).slice(0, 5),
            timestamp: new Date().toISOString()
        });

        return addCorsHeaders(response);

    } catch (error) {
        console.error('Error in searchProducts:', error);
        const response = NextResponse.json(
            {
                error: 'Internal Server Error',
                message: error instanceof Error ? error.message : 'Unknown error',
                timestamp: new Date().toISOString()
            },
            { status: 500 }
        );
        return addCorsHeaders(response);
    }
}