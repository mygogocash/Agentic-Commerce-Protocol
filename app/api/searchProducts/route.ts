import { NextResponse } from 'next/server';

// Add CORS headers
function addCorsHeaders(response: NextResponse) {
    response.headers.set('Access-Control-Allow-Origin', '*');
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    return response;
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

        // For now, return mock data to test if the API works
        const mockProducts = [
            {
                product_id: 'test_1',
                product_name: `Premium ${query.charAt(0).toUpperCase() + query.slice(1)} - High Quality`,
                product_price: 1299,
                currency: "THB",
                merchant_name: "Shopee",
                merchant_logo: "https://cf.shopee.co.th/file/38d3010b996b7d22f281e69974261899",
                image_url: `https://via.placeholder.com/300x300/FF6B35/FFFFFF?text=${encodeURIComponent(query)}`,
                product_url: "https://shopee.co.th/test-product-1",
                rating: 4.5,
                reviews_count: 1250,
                cashback_rate: 0.05,
                estimated_cashback: 64.95,
                affiliate_link: "https://shopee.co.th/test-product-1",
                in_stock: true
            },
            {
                product_id: 'test_2',
                product_name: `Budget ${query.charAt(0).toUpperCase() + query.slice(1)} - Great Value`,
                product_price: 599,
                currency: "THB",
                merchant_name: "Shopee",
                merchant_logo: "https://cf.shopee.co.th/file/38d3010b996b7d22f281e69974261899",
                image_url: `https://via.placeholder.com/300x300/4ECDC4/FFFFFF?text=Budget+${encodeURIComponent(query)}`,
                product_url: "https://shopee.co.th/test-product-2",
                rating: 4.2,
                reviews_count: 856,
                cashback_rate: 0.05,
                estimated_cashback: 29.95,
                affiliate_link: "https://shopee.co.th/test-product-2",
                in_stock: true
            }
        ];

        const response = NextResponse.json({
            query,
            user_email: userEmail,
            total_results: mockProducts.length,
            results: mockProducts.slice(0, limit),
            message: 'API is working with mock data',
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