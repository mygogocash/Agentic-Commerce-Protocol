
import { NextResponse } from 'next/server';
import { db } from '../lib/db-service';

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
            const phoneRegex = /^\+?[0-9]{10,15}$/;
            if (!phoneRegex.test(phone)) {
                 return NextResponse.json({ error: 'Invalid phone format.' }, { status: 400 });
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

        return NextResponse.json({
            message: isNewUser ? '✓ Account created!' : '✓ Login successful!',
            session_token: session.token,
            user: {
                id: user.id,
                email: user.email,
                wallet_address: user.wallet_address,
                balance: user.balance
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
