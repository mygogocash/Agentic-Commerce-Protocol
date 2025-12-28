
import { NextResponse } from 'next/server';
import { db } from '@/src/ACP/mock-db';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { wallet_address } = body;

        // 1. Validation
        if (!wallet_address || typeof wallet_address !== 'string') {
            return NextResponse.json(
                { error: 'Wallet address is required' },
                { status: 400 }
            );
        }

        // Check format: 0x followed by 40 hex chars
        const walletRegex = /^0x[a-fA-F0-9]{40}$/;
        if (!walletRegex.test(wallet_address)) {
            return NextResponse.json(
                { error: 'Invalid wallet address format. Must start with 0x followed by 40 hexadecimal characters.' },
                { status: 400 }
            );
        }

        const cleanAddress = wallet_address.trim().toLowerCase();

        // 2. Find or Create User
        let user = await db.users.findByWallet(cleanAddress);
        let isNewUser = false;

        if (!user) {
            user = await db.users.create({ wallet_address: cleanAddress });
            isNewUser = true;
        }

        // 3. Generate Session
        const session = await db.sessions.create(user.id);

        // 4. Return Response
        return NextResponse.json({
            message: isNewUser ? '✓ Account created! Welcome! You earned 100 bonus GO points' : '✓ Account linked! Welcome back!',
            session_token: session.token,
            user: {
                id: user.id,
                wallet_address: user.wallet_address,
                go_points: user.go_points,
                go_tier: user.go_tier,
            }
        });

    } catch (error) {
        console.error('Error in linkWallet:', error);
        return NextResponse.json(
            { error: 'Internal Server Error' },
            { status: 500 }
        );
    }
}
