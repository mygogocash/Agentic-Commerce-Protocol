
export interface User {
  id: string;
  wallet_address?: string;
  email?: string;
  phone?: string;
  joined_at: string;
  balance: number; // Added from gogocash schema
  go_points: number;
  go_tier: 'Bronze' | 'Silver' | 'Gold' | 'Platinum';
}

export interface UserMyCashback {
    id: string;
    userId: string;
    cashback_amount: number;
    status: 'pending' | 'approved' | 'rejected';
    created_at: string;
}

export interface Session {
  token: string;
  user_id: string;
  expires_at: string;
}

export interface Product {
    product_id: string;
    product_name: string;
    product_price: number; 
    original_price?: number;
    currency: string;
    merchant_name: string;
    merchant_logo: string;
    image_url: string;
    product_url: string;
    rating: number;
    reviews_count: number;
    cashback_rate: number; 
    estimated_cashback: number;
    affiliate_link: string;
    in_stock: boolean;
}
