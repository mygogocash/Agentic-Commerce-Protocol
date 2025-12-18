
import { NextResponse } from 'next/server';
import { db } from '@/lib/mock-db';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        let token = request.headers.get('Authorization')?.split(' ')[1];

        // Fallback: Check query param
        if (!token) {
            token = searchParams.get('session_token') || undefined;
        }

        // 1. Validation
        if (!token) {
            return NextResponse.json(
                { error: 'Unauthorized: Missing session_token' },
                { status: 401 }
            );
        }

        const user = await db.sessions.verify(token);

        if (!user) {
            return NextResponse.json(
                { error: 'Session expired. Please link account again.' },
                { status: 401 }
            );
        }

        // 2. Mock Cashback Data Retrieval
        // In a real app, query DB for transactions by user_id
        // Here we generate some dummy data for the user

        // Deterministic mock data based on user ID for consistency
        const userIdNum = user.id.length;

        const summary = {
            pending_amount: 12.50,
            confirmed_amount: 5.00,
            paid_amount: 45.00,
            total_earned: 62.50,
            next_payout_amount: 5.00,
            next_payout_date: '2025-12-25', // Next Friday
        };

        const transactions = [
            {
                id: 'tx_1',
                product_name: 'Sony WH-1000XM5',
                merchant: 'Amazon',
                date: '2025-12-15',
                amount: 348.00,
                cashback_amount: 6.96,
                status: 'pending',
                estimated_payout: '2026-02-15',
            },
            {
                id: 'tx_2',
                product_name: 'Nike Air Max 90',
                merchant: 'Nike',
                date: '2025-12-10',
                amount: 120.00,
                cashback_amount: 5.54, // odd number logic
                status: 'pending',
                estimated_payout: '2026-02-10',
            },
            {
                id: 'tx_3',
                product_name: 'Anker USB-C Charger',
                merchant: 'Shopee',
                date: '2025-11-20',
                amount: 25.00,
                cashback_amount: 1.25,
                status: 'confirmed',
                estimated_payout: '2025-12-25',
            }
        ];

        // 3. Return Response
        return NextResponse.json({
            user_id: user.id,
            summary,
            transactions
        });

    } catch (error) {
        console.error('Error in getCashback:', error);
        return NextResponse.json(
            { error: 'Internal Server Error' },
            { status: 500 }
        );
    }
}
