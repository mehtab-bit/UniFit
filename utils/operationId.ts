/**
 * Stable, deterministic operation ids for idempotent session recording.
 *
 * The same logical recording (same user + scheduled workout + exercise) must
 * reuse the same operation id across retries and double taps so the backend
 * can never create a duplicate.
 */

function hash(input: string): string {
  let h1 = 0xdeadbeef;
  let h2 = 0x41c6ce57;
  for (let i = 0; i < input.length; i++) {
    const ch = input.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507);
  h1 ^= Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507);
  h2 ^= Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return (
    (h2 >>> 0).toString(16).padStart(8, '0') +
    (h1 >>> 0).toString(16).padStart(8, '0')
  );
}

export function operationIdFromParts(...parts: Array<string | number | undefined | null>): string {
  return `op_${hash(parts.map((part) => String(part ?? '')).join('|'))}`;
}
