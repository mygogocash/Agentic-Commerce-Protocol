
import { NextResponse } from 'next/server';
import { db } from '@/src/ACP/mock-db';

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
