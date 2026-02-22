import { NextResponse } from 'next/server';
import { db } from '@/src/ACP/mock-db';
import { merchantService } from '@/src/ACP/mock-merchants';
import { lazadaService } from '@/src/ACP/lazada';
import { shopeeService } from '@/src/ACP/shopee';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const recipient = searchParams.get('recipient') || 'friend';
        const budget = searchParams.get('budget');
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

        // 2. Construct Search Query
        let query = `Christmas gift for ${recipient}`;
        if (budget) {
            // Note: Lazada search doesn't strictly support "limit 50 usd" in text, 
            // but we can add "under {budget}" to the query to guide the fuzzy search 
            // or just rely on post-filtering if we had that logic.
            // For now, let's keep it simple text search.
            query += ` under ${budget}`;
        }

        console.log(`[ChristmasAction] Searching for: ${query}`);

        // 3. Search Merchants
        const [realResults, mockResults, shopeeResults] = await Promise.all([
            lazadaService.search(query),
            merchantService.search(query),
            shopeeService.search(query)
        ]);

        const rawResults = [...realResults, ...shopeeResults, ...mockResults];

        // 4. Filter/Deduplicate/Sort
        // Prioritize items with high ratings for gifts
        const results = rawResults
            .sort((a, b) => b.rating - a.rating)
            .slice(0, 5);

        // 5. Return Results
        return NextResponse.json({
            query,
            total_results: rawResults.length,
            results
        });

    } catch (error) {
        console.error('Error in getChristmasGifts:', error);
        return NextResponse.json(
            { error: 'Internal Server Error' },
            { status: 500 }
        );
    }
}
