
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

        const cashbacks = await db.cashbacks.findByUser(user.id);

        return NextResponse.json({
            cashbacks: cashbacks
        });

    } catch (error) {
        console.error('Error in user/cashback:', error);
        return NextResponse.json(
            { error: 'Internal Server Error' },
            { status: 500 }
        );
    }
}
