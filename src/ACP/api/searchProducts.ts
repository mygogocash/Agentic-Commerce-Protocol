import { NextResponse } from 'next/server';
import { db } from '@/src/ACP/mock-db';
import { merchantService } from '@/src/ACP/mock-merchants';
import { lazadaService } from '@/src/ACP/lazada';
import { shopeeService } from '@/src/ACP/shopee';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const query = searchParams.get('query');
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

        if (!query) {
            return NextResponse.json(
                { error: 'Query parameter is required' },
                { status: 400 }
            );
        }

        // 2. Search Merchants
        const [lazadaResults, shopeeResults] = await Promise.all([
            lazadaService.search(query),
            shopeeService.search(query)
        ]);

        let rawResults = [...lazadaResults, ...shopeeResults];
        
        // Fallback to mock data if no real results found (for demo continuity)
        if (rawResults.length === 0) {
             const mockResults = await merchantService.search(query);
             rawResults = [...mockResults];
        }

        // 3. Filter/Deduplicate/Sort (Simplified)
        // In a real app, we would dedupe by name similarity here.
        const results = rawResults.slice(0, 5); // Take top 5 as per PRD

        // 4. Return Results
        return NextResponse.json({
            query,
            total_results: rawResults.length,
            results
        });

    } catch (error) {
        console.error('Error in searchProducts:', error);
        return NextResponse.json(
            { error: 'Internal Server Error' },
            { status: 500 }
        );
    }
}
