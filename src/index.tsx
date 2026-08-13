import NativeZalo from './NativeZalo';
import { generateCodeVerifier, generateCodeChallenge } from './pkce';

export type {
  OAuthResponse,
  TokenResponse,
  ValidateResponse,
  UserProfile,
} from './NativeZalo';

export { generateCodeVerifier, generateCodeChallenge } from './pkce';

export enum LoginType {
  APP = 'app',
  WEB = 'web',
  APP_OR_WEB = 'app_or_web',
}

export const Zalo = {
  /**
   * Authenticates the user via Zalo OAuth 2.0.
   * You must provide your own codeChallenge (Base64URL(SHA256(codeVerifier))).
   *
   * @param codeChallenge - The PKCE code challenge.
   * @param loginType - The login method to use (default: APP_OR_WEB).
   */
  login(codeChallenge: string, loginType: LoginType = LoginType.APP_OR_WEB) {
    return NativeZalo.login(codeChallenge, loginType);
  },

  /**
   * Exchanges the OAuth code for an access token and refresh token.
   *
   * @param oauthCode - The OAuth code received from `login()`.
   * @param codeVerifier - The PKCE code verifier that matches the challenge used in `login()`.
   */
  getAccessTokenByOAuthCode(oauthCode: string, codeVerifier: string) {
    return NativeZalo.getAccessTokenByOAuthCode(oauthCode, codeVerifier);
  },

  /**
   * Convenience method: logs in and exchanges the OAuth code for tokens in one call.
   * Handles PKCE (codeVerifier/codeChallenge) automatically.
   *
   * @param loginType - The login method to use (default: APP_OR_WEB).
   * @returns The token response containing accessToken, refreshToken, and expiresIn.
   * @throws If login fails or the OAuth code exchange fails.
   */
  async authenticate(loginType: LoginType = LoginType.APP_OR_WEB) {
    const codeVerifier = generateCodeVerifier();
    const codeChallenge = generateCodeChallenge(codeVerifier);

    const loginResult = await NativeZalo.login(codeChallenge, loginType);

    if (loginResult.errorCode !== -1 || !loginResult.oauthCode) {
      throw new Error(
        `Login failed (errorCode: ${loginResult.errorCode}): ${loginResult.errorMessage}`
      );
    }

    return NativeZalo.getAccessTokenByOAuthCode(
      loginResult.oauthCode,
      codeVerifier
    );
  },

  /**
   * Gets a new access token using a refresh token.
   *
   * @param refreshToken - The refresh token from a previous token exchange.
   */
  getAccessTokenByRefreshToken(refreshToken: string) {
    return NativeZalo.getAccessTokenByRefreshToken(refreshToken);
  },

  /**
   * Validates whether a refresh token is still valid.
   *
   * @param refreshToken - The refresh token to validate.
   */
  validateRefreshToken(refreshToken: string) {
    return NativeZalo.validateRefreshToken(refreshToken);
  },

  /**
   * Logs out the current user and clears the Zalo SDK session.
   */
  logout(): void {
    NativeZalo.logout();
  },

  /**
   * Gets the Zalo user profile for the authenticated user.
   *
   * @param accessToken - The access token from a token exchange.
   */
  getProfile(accessToken: string) {
    return NativeZalo.getProfile(accessToken);
  },
};
