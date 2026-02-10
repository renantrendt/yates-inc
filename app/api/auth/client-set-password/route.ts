import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

export async function POST(request: NextRequest) {
  try {
    const { clientId, password } = await request.json();

    if (!clientId || !password) {
      return NextResponse.json({ success: false, error: 'Client ID and password required' }, { status: 400 });
    }

    if (password.length < 4) {
      return NextResponse.json({ success: false, error: 'Password must be at least 4 characters' }, { status: 400 });
    }

    // Save password server-side — never returned to client
    const { error: updateError } = await supabase
      .from('clients')
      .update({ password: password })
      .eq('id', clientId);

    if (updateError) {
      console.error('Error setting password:', updateError);
      return NextResponse.json({ success: false, error: 'Failed to save password.' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Set password error:', err);
    return NextResponse.json({ success: false, error: 'Something went wrong.' }, { status: 500 });
  }
}
