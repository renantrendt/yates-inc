import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json();

    if (!username || !password) {
      return NextResponse.json({ success: false, error: 'Username and password required' }, { status: 400 });
    }

    const mailHandle = username.toLowerCase() + '.mail';

    // Check if username already exists (only check id, not password)
    const { data: existingUser } = await supabase
      .from('clients')
      .select('id')
      .eq('username', username.toLowerCase())
      .single();

    if (existingUser) {
      return NextResponse.json({ success: false, error: 'Username already taken! Try another one.' });
    }

    // Create new client — password stored server-side, never returned
    const { data: newClient, error: createError } = await supabase
      .from('clients')
      .insert([
        {
          username: username.toLowerCase(),
          mail_handle: mailHandle,
          password: password,
        },
      ])
      .select('id, username, mail_handle')
      .single();

    if (createError) {
      console.error('Error creating client:', createError);
      return NextResponse.json({ success: false, error: 'Error creating account. Make sure you ran the SQL setup!' }, { status: 500 });
    }

    // Return client data WITHOUT the password
    return NextResponse.json({
      success: true,
      client: {
        id: newClient.id,
        username: newClient.username,
        mail_handle: newClient.mail_handle,
      },
    });
  } catch (err) {
    console.error('Client register error:', err);
    return NextResponse.json({ success: false, error: 'Something went wrong.' }, { status: 500 });
  }
}
