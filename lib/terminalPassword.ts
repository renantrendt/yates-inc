// Terminal Password Generator
// Generates a deterministic 6-character alphanumeric password that changes every 5 minutes
// All clients will generate the same password for the same time window

// Obfuscated secret - decoded at runtime
const _0x = [121,97,116,101,115,45,116,101,114,109,105,110,97,108,45,115,101,99,114,101,116,45,50,48,50,52,45,98,108,111,111,100,109,111,111,110];
const SECRET = String.fromCharCode(..._0x);
const INTERVAL_MS = 5 * 60 * 1000; // 5 minutes

// Simple hash function (djb2 variant)
function simpleHash(str: string): number {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) + hash) ^ str.charCodeAt(i);
  }
  return Math.abs(hash);
}

// Generate a deterministic string from a seed
function generateFromSeed(seed: number): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Removed confusing chars: 0,O,1,I
  let result = '';
  let current = seed;
  
  for (let i = 0; i < 6; i++) {
    result += chars[current % chars.length];
    current = simpleHash(current.toString() + i);
  }
  
  return result;
}

/**
 * Get the current 5-minute time window
 */
export function getCurrentTimeWindow(): number {
  return Math.floor(Date.now() / INTERVAL_MS);
}

/**
 * Get the current terminal password
 * Changes every 5 minutes, same across all clients
 */
export function getCurrentTerminalPassword(): string {
  const timeWindow = getCurrentTimeWindow();
  const seed = simpleHash(`${SECRET}-${timeWindow}`);
  return generateFromSeed(seed);
}

/**
 * Validate a password against the current password
 */
export function validateTerminalPassword(input: string): boolean {
  const currentPassword = getCurrentTerminalPassword();
  return input.toUpperCase() === currentPassword;
}

/**
 * Get the expiry time of the current password
 */
export function getPasswordExpiry(): Date {
  const nextWindow = getCurrentTimeWindow() + 1;
  return new Date(nextWindow * INTERVAL_MS);
}

/**
 * Get seconds until the current password expires
 */
export function getSecondsUntilExpiry(): number {
  const expiry = getPasswordExpiry();
  return Math.max(0, Math.floor((expiry.getTime() - Date.now()) / 1000));
}

/**
 * Format seconds as MM:SS
 */
export function formatTimeRemaining(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}
