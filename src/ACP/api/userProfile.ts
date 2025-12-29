
import { NextResponse } from 'next/server';
import { db } from '../mock-db';

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

        if (!token) {
            return NextResponse.json({ error: 'Unauthorized: Missing Token' }, { status: 401 });
        }

        const user = await db.sessions.verify(token);

        if (!user) {
            return NextResponse.json({ error: 'Invalid Session' }, { status: 401 });
        }

        return NextResponse.json({
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

    } catch (error) {
        console.error('Error in user/profile:', error);
        return NextResponse.json(
            { error: 'Internal Server Error' },
            { status: 500 }
        );
    }
}
