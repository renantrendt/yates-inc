import { NextRequest, NextResponse } from 'next/server';

// SECRET lives server-side ONLY
const SECRET = 'yates-terminal-secret-2024-bloodmoon';
const INTERVAL_MS = 5 * 60 * 1000;

function simpleHash(str: string): number {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) + hash) ^ str.charCodeAt(i);
  }
  return Math.abs(hash);
}

function generateFromSeed(seed: number): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let result = '';
  let current = seed;

  for (let i = 0; i < 6; i++) {
    result += chars[current % chars.length];
    current = simpleHash(current.toString() + i);
  }

  return result;
}

function getCurrentTerminalPassword(): string {
  const timeWindow = Math.floor(Date.now() / INTERVAL_MS);
  const seed = simpleHash(`${SECRET}-${timeWindow}`);
  return generateFromSeed(seed);
}

export async function POST(request: NextRequest) {
  try {
    const { password } = await request.json();

    if (!password) {
      return NextResponse.json({ valid: false });
    }

    const currentPassword = getCurrentTerminalPassword();
    const valid = password.toUpperCase() === currentPassword;

    return NextResponse.json({ valid });
  } catch (err) {
    console.error('Terminal validate error:', err);
    return NextResponse.json({ valid: false }, { status: 500 });
  }
}
