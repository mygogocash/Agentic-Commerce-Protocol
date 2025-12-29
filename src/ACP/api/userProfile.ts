
import { NextResponse } from 'next/server';
import { db } from '../lib/db-service';

// Add CORS headers for ChatGPT integration
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
        let token = '';

        const authHeader = request.headers.get('Authorization');
        if (authHeader && authHeader.startsWith('Bearer ')) {
            token = authHeader.split(' ')[1];
        } else {
            // Fallback to Query Param (for Custom GPTs)
            const { searchParams } = new URL(request.url);
            token = searchParams.get('session_token') || '';
        }

        // if (!token) ... we allow email fallback now, check happens later

        let user = null;
        if (token) {
            user = await db.sessions.verify(token);
        } else {
            // Check for user_email param (Simplified Auth for GPT)
            const { searchParams } = new URL(request.url);
            const email = searchParams.get('user_email');
            if (email) {
                user = await db.users.findByEmail(email);
            }
        }

        if (!user) {
            const response = NextResponse.json({ error: 'Invalid Session or Email not found' }, { status: 401 });
            return addCorsHeaders(response);
        }

        const response = NextResponse.json({
            user: {
                id: user.id,
                email: user.email,
                phone: user.phone,
                wallet_address: user.wallet_address,
                balance: user.balance,
                go_points: user.go_points,
                go_tier: user.go_tier,
                joined_at: user.joined_at
            }
        }, {
            headers: {
                'Cache-Control': 'no-store, max-age=0, must-revalidate',
            }
        });

        return addCorsHeaders(response);

    } catch (error) {
        console.error('Error in user/profile:', error);
        const response = NextResponse.json(
            { error: 'Internal Server Error' },
            { status: 500 }
        );
        return addCorsHeaders(response);
    }
}
