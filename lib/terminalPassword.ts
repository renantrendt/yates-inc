// Terminal Password — ALL generation and validation has been moved server-side
// See: /api/terminal/password (GET) and /api/terminal/validate (POST)
//
// The secret and algorithm are NO LONGER in the client bundle.
// This file is kept as a reference — nothing here runs client-side anymore.

/**
 * Format seconds as MM:SS (utility, no secret involved)
 */
export function formatTimeRemaining(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}
