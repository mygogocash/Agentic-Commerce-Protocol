import { NextResponse } from 'next/server';
import { db } from '@/src/ACP/lib/db-service';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
    try {
        let token = request.headers.get('Authorization')?.split(' ')[1];
        
        // If not in header, check body? (Usually logout is POST with token in header)
        // PRD says Authenticated via JWT.
        
        if (!token) {
             // Try getting it from body if header missing
             try {
                const body = await request.json();
                token = body.session_token;
             } catch (e) {
                 // ignore
             }
        }

        if (!token) {
            return NextResponse.json(
                { error: 'Missing session_token' },
                { status: 401 }
            );
        }

        // Verify it was valid (optional, but good practice)
        const user = await db.sessions.verify(token);
        if (!user) {
            // Already invalid, just return success
            return NextResponse.json({ message: 'Unlinked successfully', status: 'scucess' });
        }

        // Revoke
        await db.sessions.revoke(token);

        return NextResponse.json({
            message: 'Unlinked successfully. Session terminated.',
            status: 'success'
        });

    } catch (error) {
        console.error('Unlink error:', error);
        return NextResponse.json(
            { error: 'Internal Server Error' },
            { status: 500 }
        );
    }
}
