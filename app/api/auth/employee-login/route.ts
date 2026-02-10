import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

export async function POST(request: NextRequest) {
  try {
    const { id, password } = await request.json();

    if (!id || !password) {
      return NextResponse.json({ success: false, error: 'id' }, { status: 400 });
    }

    // Fetch employee from Supabase — password stays on the server
    const { data, error } = await supabase
      .from('employees')
      .select('id, name, password, role, bio, mail_handle')
      .eq('id', id)
      .single();

    if (error || !data) {
      return NextResponse.json({ success: false, error: 'id' });
    }

    // Compare password SERVER-SIDE — never sent to client
    if (data.password !== password) {
      return NextResponse.json({ success: false, error: 'password' });
    }

    // Return employee data WITHOUT the password
    return NextResponse.json({
      success: true,
      employee: {
        id: data.id,
        name: data.name,
        role: data.role,
        bio: data.bio,
        mail_handle: data.mail_handle,
      },
    });
  } catch (err) {
    console.error('Employee login error:', err);
    return NextResponse.json({ success: false, error: 'id' }, { status: 500 });
  }
}
