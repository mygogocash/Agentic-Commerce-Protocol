import { NextResponse } from 'next/server';
import { db } from '@/src/ACP/lib/db-service';
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
        // 1. Auth Check (Optional)
        // We allow public search, but if a token is provided, we verify it.
        let user = null;
        if (token) {
            user = await db.sessions.verify(token);
            // If token provided but invalid -> we could 401 OR just ignore. 
            // For better UX, let's ignore invalid token and treat as guest, or strict 401 if they tried to auth.
            // Let's go with: if token provided, it MUST be valid.
            if (!user) {
                 return NextResponse.json(
                    { error: 'Session expired. Please login again.' },
                    { status: 401 }
                );
            }
        }


        if (!query) {
            return NextResponse.json(
                { error: 'Query parameter is required' },
                { status: 400 }
            );
        }

        // 2. Search Merchants - FORCED SHOPEE ONLY MODE
        const [lazadaResults, shopeeResults] = await Promise.all([
            // lazadaService.search(query), // DISABLED per user request
            [], 
            shopeeService.search(query)
        ]);

        const rawResults = [...lazadaResults, ...shopeeResults];
        
        // 3. Filter/Deduplicate/Sort (Simplified)
        // In a real app, we would dedupe by name similarity here.
        const topResults = rawResults.slice(0, 5); // Take top 5 as per PRD
        
        // 4. Wrap Links for Tracking
        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://gogocash-acp.web.app';
        const results = topResults.map((product: any) => {
            let trackingLink = product.affiliate_link || product.product_url;
            
            // If we have a user token OR email, route through our redirector to attach sub_id
            if (trackingLink && (token || searchParams.get('user_email'))) {
                const emailParam = searchParams.get('user_email') ? `&user_email=${encodeURIComponent(searchParams.get('user_email')!)}` : '';
                const tokenParam = token ? `&session_token=${token}` : '';
                
                trackingLink = `${baseUrl}/api/redirect?url=${encodeURIComponent(trackingLink)}${tokenParam}${emailParam}`;
            }
            
            return {
                ...product,
                affiliate_link: trackingLink
            };
        });

        // 5. Return Results
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
