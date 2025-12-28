
import { NextResponse } from 'next/server';
import { db } from '@/src/ACP/mock-db';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { email, phone } = body;

        // 1. Validation
        if (!email && !phone) {
            return NextResponse.json(
                { error: 'Email or Phone is required' },
                { status: 400 }
            );
        }

        let user;
        let isNewUser = false;

        // 2. Find or Create User
        if (email) {
            // Email Validation (Basic regex)
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) {
                return NextResponse.json({ error: 'Invalid email format' }, { status: 400 });
            }
            
            user = await db.users.findByEmail(email.toLowerCase().trim());
            
            if (!user) {
                user = await db.users.create({ email: email.toLowerCase().trim() });
                isNewUser = true;
            }
        } else if (phone) {
            // Phone Validation (Basic length check for now, can be improved)
            const phoneRegex = /^\+?[0-9]{10,15}$/;
            if (!phoneRegex.test(phone)) {
                 return NextResponse.json({ error: 'Invalid phone format. Use E.164 format or standard digits (10-15 digits).' }, { status: 400 });
            }

            user = await db.users.findByPhone(phone.trim());

            if (!user) {
                user = await db.users.create({ phone: phone.trim() });
                isNewUser = true;
            }
        }

        if (!user) {
             return NextResponse.json({ error: 'User creation failed' }, { status: 500 });
        }

        // 3. Generate Session
        const session = await db.sessions.create(user.id);

        // 4. Return Response
        return NextResponse.json({
            message: isNewUser ? '✓ Account created! Welcome! You earned 100 bonus GO points' : '✓ Login successful! Welcome back!',
            session_token: session.token,
            user: {
                id: user.id,
                email: user.email,
                phone: user.phone,
                wallet_address: user.wallet_address,
                go_points: user.go_points,
                go_tier: user.go_tier,
            }
        });

    } catch (error) {
        console.error('Error in auth/login:', error);
        return NextResponse.json(
            { error: 'Internal Server Error' },
            { status: 500 }
        );
    }
}
