import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

export async function POST(request: NextRequest) {
  try {
    const { clientId } = await request.json();

    if (!clientId) {
      return NextResponse.json({ needsPassword: false }, { status: 400 });
    }

    // Check if client has a password — only return boolean, NEVER the password itself
    const { data, error } = await supabase
      .from('clients')
      .select('password')
      .eq('id', clientId)
      .single();

    if (error) {
      // Column might not exist yet — show the popup
      return NextResponse.json({ needsPassword: true });
    }

    return NextResponse.json({ needsPassword: !data?.password });
  } catch (err) {
    console.error('Check password error:', err);
    return NextResponse.json({ needsPassword: true });
  }
}
