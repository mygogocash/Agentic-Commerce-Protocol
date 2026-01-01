/**
 * GoGoCash API Service
 * 
 * Connects to the real GoGoCash API for user authentication and deeplink creation.
 * API Base URL: https://api.gogocash.co
 */

const GOGOCASH_API_BASE = 'https://api.gogocash.co';

export interface GoGoCashUser {
    id: string;
    email: string;
    phone?: string;
    wallet_address?: string;
    balance: number;
    go_points: number;
    go_tier: string;
    joined_at?: string;
}

export interface GoGoCashDeeplinkResponse {
    success: boolean;
    affiliate_link?: string;
    error?: string;
}

/**
 * Login/Get user profile from GoGoCash API using email
 * 
 * POST https://api.gogocash.co/auth/log-in/ai
 * Body: { "email": "user@example.com" }
 */
export async function loginUser(email: string): Promise<GoGoCashUser | null> {
    try {
        const response = await fetch(`${GOGOCASH_API_BASE}/auth/log-in/ai`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email }),
        });

        if (!response.ok) {
            console.error(`GoGoCash API login failed: ${response.status} ${response.statusText}`);
            return null;
        }

        const data = await response.json();
        
        // Map API response to our user interface
        // Adjust this mapping based on actual API response structure
        return {
            id: data.id || data._id || data.userId,
            email: data.email,
            phone: data.phone,
            wallet_address: data.wallet_address || data.walletAddress,
            balance: data.balance || data.cashback_balance || 0,
            go_points: data.go_points || data.goPoints || data.points || 0,
            go_tier: data.go_tier || data.goTier || data.tier || 'Bronze',
            joined_at: data.joined_at || data.createdAt || data.created_at,
        };
    } catch (error) {
        console.error('Error calling GoGoCash login API:', error);
        return null;
    }
}

/**
 * Create an affiliate deeplink for a product
 * 
 * POST https://api.gogocash.co/involve/create-affiliate-ai/{email}
 * Body: { "offer_id": "1732", "merchant_id": 100583 }
 */
export async function createAffiliateDeeplink(
    email: string,
    offerId: string,
    merchantId: number
): Promise<GoGoCashDeeplinkResponse> {
    try {
        const response = await fetch(
            `${GOGOCASH_API_BASE}/involve/create-affiliate-ai/${encodeURIComponent(email)}`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    offer_id: offerId,
                    merchant_id: merchantId,
                }),
            }
        );

        if (!response.ok) {
            console.error(`GoGoCash deeplink creation failed: ${response.status}`);
            return { success: false, error: `API returned ${response.status}` };
        }

        const data = await response.json();
        
        return {
            success: true,
            affiliate_link: data.affiliate_link || data.deeplink || data.link || data.url,
        };
    } catch (error) {
        console.error('Error creating affiliate deeplink:', error);
        return { success: false, error: String(error) };
    }
}

/**
 * Check if a user exists in GoGoCash by email
 * Returns the user if found, null otherwise
 */
export async function getUserByEmail(email: string): Promise<GoGoCashUser | null> {
    return loginUser(email);
}
