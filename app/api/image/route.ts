import { NextResponse } from 'next/server';

// Image proxy to serve external images through our domain
// This helps ChatGPT render images since it trusts our domain
export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const imageUrl = searchParams.get('url');
        
        if (!imageUrl) {
            return new NextResponse('Missing url parameter', { status: 400 });
        }
        
        // Only allow Shopee CDN images for security
        if (!imageUrl.includes('cf.shopee.co.th') && !imageUrl.includes('down-th.img.susercontent.com')) {
            return new NextResponse('Only Shopee images are allowed', { status: 403 });
        }
        
        // Fetch the image
        const imageResponse = await fetch(imageUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (compatible; GoGoCashBot/1.0)',
                'Accept': 'image/*',
            }
        });
        
        if (!imageResponse.ok) {
            return new NextResponse('Failed to fetch image', { status: 502 });
        }
        
        const contentType = imageResponse.headers.get('content-type') || 'image/jpeg';
        const imageBuffer = await imageResponse.arrayBuffer();
        
        const response = new NextResponse(imageBuffer, {
            status: 200,
            headers: {
                'Content-Type': contentType,
                'Cache-Control': 'public, max-age=86400', // Cache for 24 hours
                'Access-Control-Allow-Origin': '*',
            }
        });
        
        return response;
        
    } catch (error) {
        console.error('Image proxy error:', error);
        return new NextResponse('Internal Server Error', { status: 500 });
    }
}
