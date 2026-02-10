import { NextResponse } from 'next/server';

// SECRET lives server-side ONLY — never shipped to the browser
const SECRET = 'yates-terminal-secret-2024-bloodmoon';
const INTERVAL_MS = 5 * 60 * 1000; // 5 minutes

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

function getCurrentTimeWindow(): number {
  return Math.floor(Date.now() / INTERVAL_MS);
}

function getCurrentTerminalPassword(): string {
  const timeWindow = getCurrentTimeWindow();
  const seed = simpleHash(`${SECRET}-${timeWindow}`);
  return generateFromSeed(seed);
}

function getPasswordExpiry(): Date {
  const nextWindow = getCurrentTimeWindow() + 1;
  return new Date(nextWindow * INTERVAL_MS);
}

export async function GET() {
  const password = getCurrentTerminalPassword();
  const expiry = getPasswordExpiry();
  const secondsUntilExpiry = Math.max(0, Math.floor((expiry.getTime() - Date.now()) / 1000));

  return NextResponse.json({
    password,
    expiresAt: expiry.toISOString(),
    secondsUntilExpiry,
    timeWindow: getCurrentTimeWindow(),
  });
}
