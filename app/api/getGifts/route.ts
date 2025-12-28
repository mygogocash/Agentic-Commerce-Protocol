import { NextResponse } from 'next/server';
import { db } from '@/src/ACP/mock-db';
import { merchantService } from '@/src/ACP/mock-merchants';
import { lazadaService } from '@/src/ACP/lazada';
import { shopeeService } from '@/src/ACP/shopee';

export const dynamic = 'force-dynamic';

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

        // 1. Auth Check (Optional)
        // We allow public search, but if a token is provided, we verify it.
        let user = null;
        if (token) {
            user = await db.sessions.verify(token);
            if (!user) {
                 return NextResponse.json(
                    { error: 'Session expired. Please login again.' },
                    { status: 401 }
                );
            }
        }


        // 2. Construct Search Query
        let query = `Christmas gift for ${recipient}`;
        if (budget) {
            query += ` under ${budget}`;
        }

        console.log(`[ChristmasAction] Searching for: ${query}`);

        // 3. Search Merchants
        // 3. Search Merchants - ENFORCED SHOPEE ONLY FOR PROTOCOL ALIGNMENT
        const [shopeeResults] = await Promise.all([
            // lazadaService.search(query), // DISABLED
            // merchantService.search(query), // DISABLED
            shopeeService.search(query)
        ]);

        const rawResults = [...shopeeResults];

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
