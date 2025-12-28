
import { NextResponse } from 'next/server';
import { db } from '../mock-db';

export async function GET(request: Request) {
    try {
        const authHeader = request.headers.get('Authorization');
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const token = authHeader.split(' ')[1];
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
        });

    } catch (error) {
        console.error('Error in user/profile:', error);
        return NextResponse.json(
            { error: 'Internal Server Error' },
            { status: 500 }
        );
    }
}
