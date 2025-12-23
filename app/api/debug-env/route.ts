
import { NextResponse } from 'next/server';

export async function GET() {
  const dbUrl = process.env.DATABASE_URL;
  return NextResponse.json({
    status: 'debug',
    has_db_url: !!process.env.DATABASE_URL,
    has_involve_key: !!process.env.INVOLVE_API_KEY,
    has_involve_secret: !!process.env.INVOLVE_API_SECRET,
    has_supabase_url: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
    db_url_prefix: dbUrl ? dbUrl.substring(0, 15) + '...' : 'N/A',
    node_env: process.env.NODE_ENV,
    timestamp: new Date().toISOString()
  });
}
