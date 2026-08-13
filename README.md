# react-native-zalo

React Native wrapper for the [Zalo SDK](https://developers.zalo.me/), supporting both iOS and Android.

## Features

- Login via Zalo app or WebView (PKCE flow)
- Get Access Token from OAuth code
- Refresh Access Token
- Validate Refresh Token
- Get user profile (id, name, avatar)
- Logout

## Installation

```sh
npm install @nthanhha/react-native-zalo
# or
yarn add @nthanhha/react-native-zalo
```

### iOS

The `ZaloSDK` pod is included automatically via the podspec. Install:

```sh
cd ios && pod install
```

### Android

Add the Zalo Maven repository to your project's `android/build.gradle`:

```groovy
// android/build.gradle
allprojects {
    repositories {
        maven { url "https://gitlab.com/api/v4/projects/50747855/packages/maven" }
    }
}
```

Add the `sdk-auth` dependency to your app's `android/app/build.gradle`:

```groovy
// android/app/build.gradle
dependencies {
    // ... existing dependencies
    implementation("me.zalo:sdk-auth:4.24.1101")
}
```

## Setup

Before using the library, you must configure both platforms with your **Zalo App ID** from [developers.zalo.me](https://developers.zalo.me/).

### Android Setup

#### 1. Add App ID to `strings.xml`

```xml
<!-- android/app/src/main/res/values/strings.xml -->
<resources>
    <string name="appID">YOUR_ZALO_APP_ID</string>
</resources>
```

#### 2. Update `AndroidManifest.xml`

```xml
<manifest xmlns:android="http://schemas.android.com/apk/res/android">

    <!-- Allow ZaloSDK to detect Zalo app -->
    <queries>
        <package android:name="com.zing.zalo" />
    </queries>

    <application ...>

        <!-- Zalo App ID metadata -->
        <meta-data
            android:name="com.zing.zalo.zalosdk.appID"
            android:value="@string/appID" />

        <!-- Browser login callback activity -->
        <activity
            android:name="com.zing.zalo.zalosdk.oauth.BrowserLoginActivity"
            android:exported="true">
            <intent-filter>
                <action android:name="android.intent.action.VIEW" />
                <category android:name="android.intent.category.DEFAULT" />
                <category android:name="android.intent.category.BROWSABLE" />
                <data android:scheme="zalo-YOUR_ZALO_APP_ID" />
            </intent-filter>
        </activity>

    </application>
</manifest>
```

> Replace `YOUR_ZALO_APP_ID` with your actual App ID.

#### 3. Initialize SDK in Application class

```kotlin
// MainApplication.kt
import com.zing.zalo.zalosdk.oauth.ZaloSDKApplication

class MainApplication : Application(), ReactApplication {
    override fun onCreate() {
        super.onCreate()
        ZaloSDKApplication.wrap(this)
        // ... existing code
    }
}
```

#### 4. Add ProGuard rules

```proguard
# proguard-rules.pro
-keep class com.zing.zalo.**{ *; }
-keep enum com.zing.zalo.**{ *; }
-keep interface com.zing.zalo.**{ *; }
```

### iOS Setup

#### 1. Initialize SDK in AppDelegate

```swift
import ZaloSDK

// In application(_:didFinishLaunchingWithOptions:):
ZaloSDK.sharedInstance().initialize(withAppId: "YOUR_ZALO_APP_ID")
```

#### 2. Handle URL callback

```swift
// In AppDelegate or SceneDelegate:
func application(
    _ app: UIApplication,
    open url: URL,
    options: [UIApplication.OpenURLOptionsKey: Any] = [:]
) -> Bool {
    return ZDKApplicationDelegate.sharedInstance().application(app, open: url, options: options)
}
```

#### 3. Add URL Scheme

In Xcode: **Target → Info → URL Types → +**

| Field | Value |
|-------|-------|
| Identifier | `zalo` |
| URL Schemes | `zalo-YOUR_ZALO_APP_ID` |

#### 4. Add LSApplicationQueriesSchemes

In `Info.plist`, add:

```xml
<key>LSApplicationQueriesSchemes</key>
<array>
    <string>zalosdk</string>
    <string>zaloshareext</string>
</array>
```

## Usage

### Quick Start (Recommended)

Use `authenticate()` — handles PKCE and token exchange in one call:

```typescript
import { Zalo, LoginType } from 'react-native-zalo';

// Login + get tokens in one step
const { accessToken, refreshToken, expiresIn } = await Zalo.authenticate(
  LoginType.APP_OR_WEB
);

// Get user profile
const { id, name, picture } = await Zalo.getProfile(accessToken);

// Refresh an expired access token
const tokens = await Zalo.getAccessTokenByRefreshToken(refreshToken);

// Check if a refresh token is still valid
const { isValid } = await Zalo.validateRefreshToken(refreshToken);

// Logout
Zalo.logout();
```

### Manual PKCE Flow

If you need full control over the PKCE flow, use `login()` and `getAccessTokenByOAuthCode()` separately:

```typescript
import {
  Zalo,
  LoginType,
  generateCodeVerifier,
  generateCodeChallenge,
} from 'react-native-zalo';

// 1. Generate PKCE pair
const codeVerifier = generateCodeVerifier();
const codeChallenge = generateCodeChallenge(codeVerifier);

// 2. Login
const { oauthCode, errorCode } = await Zalo.login(
  codeChallenge,
  LoginType.APP_OR_WEB
);

// 3. Exchange OAuth code for tokens
const { accessToken, refreshToken, expiresIn } =
  await Zalo.getAccessTokenByOAuthCode(oauthCode, codeVerifier);
```

> You can also bring your own PKCE implementation instead of using the built-in helpers.

### PKCE (Code Challenge / Code Verifier)

Zalo requires [PKCE](https://datatracker.ietf.org/doc/html/rfc7636) for authentication. Each login needs a unique `codeVerifier` / `codeChallenge` pair:

```
codeVerifier  = random 43-character alphanumeric string
codeChallenge = Base64URL(SHA256(ASCII(codeVerifier)))
```

The library provides built-in helpers (`generateCodeVerifier`, `generateCodeChallenge`), or you can use `authenticate()` which handles PKCE automatically.

### Token Lifecycle

| Token | Default Validity | Notes |
|-------|-----------------|-------|
| OAuth Code | 10 minutes | Single-use; exchange immediately for tokens |
| Access Token | 1 hour | Used to call Zalo APIs |
| Refresh Token | 3 months | Single-use; save the new one after each refresh |

## API Reference

### `Zalo.authenticate(loginType?)`

Convenience method: logs in and exchanges the OAuth code for tokens in one call. Handles PKCE automatically. Returns `Promise<TokenResponse>`. Throws if login fails.

- `loginType`: `LoginType.APP` | `LoginType.WEB` | `LoginType.APP_OR_WEB` (default)

### `Zalo.login(codeChallenge, loginType?)`

Authenticate with Zalo using a manually-provided PKCE code challenge. Returns `Promise<OAuthResponse>`.

- `loginType`: `LoginType.APP` | `LoginType.WEB` | `LoginType.APP_OR_WEB` (default)

### `Zalo.getAccessTokenByOAuthCode(oauthCode, codeVerifier)`

Exchange an OAuth code for access and refresh tokens. Returns `Promise<TokenResponse>`.

### `Zalo.getAccessTokenByRefreshToken(refreshToken)`

Get a new access token using a refresh token. Returns `Promise<TokenResponse>`.

> The used refresh token becomes invalid. Always save the new refresh token from the response.

### `Zalo.validateRefreshToken(refreshToken)`

Check whether a refresh token is still valid. Returns `Promise<ValidateResponse>`.

### `Zalo.getProfile(accessToken)`

Fetch the authenticated user's profile. Returns `Promise<UserProfile>`.

### `Zalo.logout()`

Clear the local login session. Does not revoke tokens server-side.

### `generateCodeVerifier()`

Generates a random 43-character code verifier string for manual PKCE flow.

### `generateCodeChallenge(codeVerifier)`

Computes `Base64URL(SHA256(codeVerifier))` for manual PKCE flow.

## Types

```typescript
enum LoginType {
  APP = 'app',
  WEB = 'web',
  APP_OR_WEB = 'app_or_web',
}

interface OAuthResponse {
  oauthCode: string;
  errorCode: number;   // -1 on success
  errorMessage: string;
}

interface TokenResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  errorCode: number;
  errorMessage: string;
}

interface ValidateResponse {
  isValid: boolean;
  errorCode: number;
  errorMessage: string;
}

interface UserProfile {
  id: string;
  name: string;
  picture?: { data: { url: string } };
  errorCode?: number;
  errorMessage?: string;
}
```

## Contributing

- [Development workflow](CONTRIBUTING.md#development-workflow)
- [Sending a pull request](CONTRIBUTING.md#sending-a-pull-request)
- [Code of conduct](CODE_OF_CONDUCT.md)

## License

MIT

---

Made with [create-react-native-library](https://github.com/callstack/react-native-builder-bob)
