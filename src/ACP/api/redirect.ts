
import { NextResponse } from 'next/server';
import { db } from '../mock-db';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const target = searchParams.get('url');
    // We can accept a session_token to securely identify the user
    // OR we can accept a direct 'u' param if the frontend already knows the ID
    const sessionToken = searchParams.get('session_token');
    let userId = searchParams.get('u'); 

    if (!target) {
        return NextResponse.json({ error: 'Missing target URL' }, { status: 400 });
    }

    try {
        // If we have a session token but no direct user ID, try to resolve the user
        if (!userId && sessionToken) {
            const sessionUser = await db.sessions.verify(sessionToken);
            if (sessionUser) {
                // STRICT CHECK: Verify user exists in MongoDB "users" collection
                // This ensures we don't track users who aren't actually in our DB
                const dbUser = await db.users.findById(sessionUser.id);
                if (dbUser) {
                    userId = dbUser.id;
                }
            }
        }

        const destination = decodeURIComponent(target);
        let finalUrl = destination;

        // Inject sub_id if we managed to find a User ID
        if (userId) {
            // Check if URL already has query params
            const separator = finalUrl.includes('?') ? '&' : '?';
            finalUrl = `${finalUrl}${separator}sub_id=${userId}`;
            console.log(`[Redirect] Tracking User: ${userId} -> sub_id`);
        }

        // TODO: Log analytics here (click tracking)
        console.log(`[Redirect] Redirecting to: ${finalUrl}`);

        return NextResponse.redirect(finalUrl);
    } catch (e) {
        return NextResponse.json({ error: 'Invalid URL' }, { status: 400 });
    }
}
