
import { NextResponse } from 'next/server';
import { loginUser } from '../services/gogocash-api';

// Add CORS headers for ChatGPT integration
function addCorsHeaders(response: NextResponse) {
    response.headers.set('Access-Control-Allow-Origin', '*');
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    return response;
}

export async function OPTIONS(request: Request) {
    return addCorsHeaders(new NextResponse(null, { status: 200 }));
}

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const email = searchParams.get('user_email');

        if (!email) {
            const response = NextResponse.json({ 
                error: 'user_email parameter is required',
            }, { status: 400 });
            return addCorsHeaders(response);
        }

        // Call GoGoCash API to login/get user profile
        const user = await loginUser(email);

        if (!user) {
            const response = NextResponse.json({ 
                error: 'Account not found. Please create an account at https://app.gogocash.co first.',
                signup_url: 'https://app.gogocash.co'
            }, { status: 401 });
            return addCorsHeaders(response);
        }

        const response = NextResponse.json({
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

        return addCorsHeaders(response);

    } catch (error) {
        console.error('Error in user/profile:', error);
        const response = NextResponse.json(
            { error: 'Internal Server Error' },
            { status: 500 }
        );
        return addCorsHeaders(response);
    }
}

