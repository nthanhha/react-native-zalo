import { sha256 } from 'js-sha256';

const VERIFIER_LENGTH = 43;
const CHARSET =
  'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

/**
 * Generates a random code verifier string for the PKCE OAuth 2.0 flow.
 * @returns A random string of 43 characters from the unreserved character set.
 */
export function generateCodeVerifier(): string {
  let result = '';
  for (let i = 0; i < VERIFIER_LENGTH; i++) {
    result += CHARSET.charAt(Math.floor(Math.random() * CHARSET.length));
  }
  return result;
}

/**
 * Generates a code challenge from a code verifier using SHA-256 + Base64URL encoding.
 * @param codeVerifier - The code verifier to derive the challenge from.
 * @returns The Base64URL-encoded SHA-256 hash of the code verifier.
 */
export function generateCodeChallenge(codeVerifier: string): string {
  const hash = sha256.arrayBuffer(codeVerifier);
  const base64 = btoa(String.fromCodePoint(...new Uint8Array(hash)));
  return base64.replaceAll('+', '-').replaceAll('/', '_').replaceAll('=', '');
}
