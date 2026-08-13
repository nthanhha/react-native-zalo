import { TurboModuleRegistry, type TurboModule } from 'react-native';

/**
 * Response from the Zalo OAuth login flow.
 * @property oauthCode - The OAuth code to exchange for an access token. Empty string on failure.
 * @property errorCode - `-1` on success, or a Zalo SDK error code on failure.
 * @property errorMessage - Empty string on success, or an error description on failure.
 */
export type OAuthResponse = {
  oauthCode: string;
  errorCode: number;
  errorMessage: string;
};

/**
 * Response from access token retrieval (via OAuth code or refresh token).
 * @property accessToken - The access token for calling Zalo APIs. Valid for 1 hour.
 * @property refreshToken - The refresh token for obtaining new access tokens. Valid for 3 months.
 * @property expiresIn - The access token validity period in seconds (default 3600).
 * @property errorCode - `0` on success, or a Zalo SDK error code on failure.
 * @property errorMessage - Empty string on success, or an error description on failure.
 */
export type TokenResponse = {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  errorCode: number;
  errorMessage: string;
};

/**
 * Response from refresh token validation.
 * @property isValid - Whether the refresh token is still valid.
 * @property errorCode - The error code from the SDK.
 * @property errorMessage - Error description if applicable.
 */
export type ValidateResponse = {
  isValid: boolean;
  errorCode: number;
  errorMessage: string;
};

/**
 * Zalo user profile information.
 * @property id - The user's Zalo ID.
 * @property name - The user's display name.
 * @property picture - The user's avatar (optional), containing `data.url`.
 * @property errorCode - The error code from the SDK (iOS only, 0 on success).
 * @property errorMessage - Error description if applicable (iOS only).
 */
export type UserProfile = {
  id: string;
  name: string;
  picture?: {
    data: {
      url: string;
    };
  };
  errorCode?: number;
  errorMessage?: string;
};

export interface Spec extends TurboModule {
  login(codeChallenge: string, loginType: string): Promise<OAuthResponse>;
  getAccessTokenByOAuthCode(
    oauthCode: string,
    codeVerifier: string
  ): Promise<TokenResponse>;
  getAccessTokenByRefreshToken(refreshToken: string): Promise<TokenResponse>;
  validateRefreshToken(refreshToken: string): Promise<ValidateResponse>;
  logout(): void;
  getProfile(accessToken: string): Promise<UserProfile>;
}

export default TurboModuleRegistry.getEnforcing<Spec>('Zalo');
