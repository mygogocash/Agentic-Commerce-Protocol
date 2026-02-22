
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const target = searchParams.get('url');
    // const userId = searchParams.get('u'); // Optional: tracking user

    if (!target) {
        return NextResponse.json({ error: 'Missing target URL' }, { status: 400 });
    }

    try {
        // Decode if it was base64 encoded (optional, but cleaner URL)
        // For now, we assume simple URI component encoding or direct URL
        // If we want to support base64:
        // const decoded = Buffer.from(target, 'base64').toString('utf-8');

        const destination = decodeURIComponent(target);

        // TODO: Log analytics here (click tracking)
        console.log(`[Redirect] Redirecting to: ${destination}`);

        return NextResponse.redirect(destination);
    } catch (e) {
        return NextResponse.json({ error: 'Invalid URL' }, { status: 400 });
    }
}
