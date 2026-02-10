import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json();

    if (!username) {
      return NextResponse.json({ success: false, error: 'Username required' }, { status: 400 });
    }

    // Fetch client — password stays on the server
    const { data: client, error } = await supabase
      .from('clients')
      .select('id, username, mail_handle, password')
      .eq('username', username.toLowerCase())
      .single();

    if (error || !client) {
      return NextResponse.json({ success: false, error: 'Account not found. Check your username or create a new one!' });
    }

    // Check if user has a password set
    if (client.password) {
      if (!password) {
        return NextResponse.json({ success: false, error: 'needs_password', message: 'This account has a password. Please enter it.' });
      }

      // Compare password SERVER-SIDE
      if (client.password !== password) {
        return NextResponse.json({ success: false, error: 'Wrong password! Try again.' });
      }
    }
    // If no password set, let them in (they'll be prompted to create one via PasswordSetupPopup)

    // Return client data WITHOUT the password
    return NextResponse.json({
      success: true,
      client: {
        id: client.id,
        username: client.username,
        mail_handle: client.mail_handle,
      },
    });
  } catch (err) {
    console.error('Client login error:', err);
    return NextResponse.json({ success: false, error: 'Something went wrong.' }, { status: 500 });
  }
}
