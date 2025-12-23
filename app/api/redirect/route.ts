import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const targetUrl = searchParams.get('url');

    if (!targetUrl) {
        return NextResponse.json({ error: 'Missing url parameter' }, { status: 400 });
    }

    try {
        const decodedUrl = decodeURIComponent(targetUrl);
        
        // LOGGING: In a real app, we would log the click here (User ID, Timestamp, Target Merchant)
        console.log(`[AffiliateClick] Redirecting to: ${decodedUrl}`);

        // Perform Redirect
        return NextResponse.redirect(decodedUrl);

    } catch (error) {
        return NextResponse.json({ error: 'Invalid URL' }, { status: 400 });
    }
}
