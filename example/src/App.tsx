import { useState, useCallback } from 'react';
import {
  Text,
  View,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  SafeAreaView,
} from 'react-native';
import {
  Zalo,
  LoginType,
  type TokenResponse,
  type UserProfile,
} from 'react-native-zalo';

// ─── App ─────────────────────────────────────────────────────────────────────

export default function App() {
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState<string | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [log, setLog] = useState<string[]>([]);

  const appendLog = useCallback((message: string) => {
    setLog((prev) => [
      ...prev,
      `[${new Date().toLocaleTimeString()}] ${message}`,
    ]);
  }, []);

  // ── Authenticate (login + get token in one step) ──────────────────────────

  const handleAuthenticate = useCallback(async () => {
    try {
      appendLog('Authenticating…');

      const result: TokenResponse = await Zalo.authenticate(
        LoginType.APP_OR_WEB
      );
      console.log('[Authenticate] result:', JSON.stringify(result));

      if (result.errorCode === 0) {
        setAccessToken(result.accessToken);
        setRefreshToken(result.refreshToken);
        appendLog(`Auth OK — expires in ${result.expiresIn}s`);
      } else {
        appendLog(`Auth error ${result.errorCode}: ${result.errorMessage}`);
      }
    } catch (e: any) {
      console.log('[Authenticate] error:', e);
      appendLog(`Auth exception: ${e.message}`);
    }
  }, [appendLog]);

  // ── Refresh Token ──────────────────────────────────────────────────────────

  const handleRefreshToken = useCallback(async () => {
    if (!refreshToken) {
      Alert.alert('No refresh token', 'Authenticate first.');
      return;
    }
    try {
      appendLog('Refreshing token…');

      const result: TokenResponse =
        await Zalo.getAccessTokenByRefreshToken(refreshToken);
      console.log('[RefreshToken] result:', JSON.stringify(result));

      if (result.errorCode === 0) {
        setAccessToken(result.accessToken);
        setRefreshToken(result.refreshToken);
        appendLog(`Refresh OK — new token expires in ${result.expiresIn}s`);
      } else {
        appendLog(`Refresh error ${result.errorCode}: ${result.errorMessage}`);
      }
    } catch (e: any) {
      console.log('[RefreshToken] error:', e);
      appendLog(`Refresh exception: ${e.message}`);
    }
  }, [refreshToken, appendLog]);

  // ── Validate Refresh Token ─────────────────────────────────────────────────

  const handleValidateRefreshToken = useCallback(async () => {
    if (!refreshToken) {
      Alert.alert('No refresh token', 'Authenticate first.');
      return;
    }
    try {
      appendLog('Validating refresh token…');

      const result = await Zalo.validateRefreshToken(refreshToken);
      console.log('[ValidateRefreshToken] refreshToken:', refreshToken);
      console.log('[ValidateRefreshToken] result:', JSON.stringify(result));
      appendLog(`Valid: ${result.isValid} (errorCode: ${result.errorCode})`);
    } catch (e: any) {
      console.log('[ValidateRefreshToken] error:', e);
      appendLog(`Validate exception: ${e.message}`);
    }
  }, [refreshToken, appendLog]);

  // ── Get Profile ────────────────────────────────────────────────────────────

  const handleGetProfile = useCallback(async () => {
    if (!accessToken) {
      Alert.alert('No access token', 'Authenticate first.');
      return;
    }
    try {
      appendLog('Fetching profile…');

      const result: UserProfile = await Zalo.getProfile(accessToken);
      console.log('[GetProfile] result:', JSON.stringify(result));

      if (result.errorCode === 0) {
        setProfile(result);
        appendLog(`Profile: ${result.name} (id: ${result.id})`);
      } else {
        appendLog(`Profile error ${result.errorCode}: ${result.errorMessage}`);
      }
    } catch (e: any) {
      console.log('[GetProfile] error:', e);
      appendLog(`Profile exception: ${e.message}`);
    }
  }, [accessToken, appendLog]);

  // ── Logout ─────────────────────────────────────────────────────────────────

  const handleLogout = useCallback(() => {
    Zalo.logout();
    setAccessToken(null);
    setRefreshToken(null);
    setProfile(null);
    appendLog('Logged out');
  }, [appendLog]);

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Zalo SDK Example</Text>

      {/* Status */}
      <View style={styles.statusRow}>
        <Text style={styles.statusLabel}>Access Token:</Text>
        <Text style={styles.statusValue}>
          {accessToken ? `${accessToken.substring(0, 20)}…` : '—'}
        </Text>
      </View>
      {profile && (
        <View style={styles.statusRow}>
          <Text style={styles.statusLabel}>User:</Text>
          <Text style={styles.statusValue}>{profile.name}</Text>
        </View>
      )}

      {/* Actions */}
      <View style={styles.buttons}>
        <TouchableOpacity style={styles.button} onPress={handleAuthenticate}>
          <Text style={styles.buttonText}>Authenticate</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, !refreshToken && styles.buttonDisabled]}
          onPress={handleRefreshToken}
          disabled={!refreshToken}
        >
          <Text style={styles.buttonText}>Refresh Token</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, !refreshToken && styles.buttonDisabled]}
          onPress={handleValidateRefreshToken}
          disabled={!refreshToken}
        >
          <Text style={styles.buttonText}>Validate Refresh Token</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, !accessToken && styles.buttonDisabled]}
          onPress={handleGetProfile}
          disabled={!accessToken}
        >
          <Text style={styles.buttonText}>Get Profile</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.buttonLogout]}
          onPress={handleLogout}
        >
          <Text style={styles.buttonText}>Logout</Text>
        </TouchableOpacity>
      </View>

      {/* Log */}
      <Text style={styles.logTitle}>Log</Text>
      <ScrollView style={styles.logContainer}>
        {log.map((entry, i) => (
          <Text key={i} style={styles.logEntry}>
            {entry}
          </Text>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    textAlign: 'center',
    marginVertical: 12,
  },
  statusRow: {
    flexDirection: 'row',
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  statusLabel: {
    fontWeight: '600',
    width: 110,
    color: '#333',
  },
  statusValue: {
    flex: 1,
    color: '#555',
  },
  buttons: {
    marginTop: 16,
    gap: 8,
  },
  button: {
    backgroundColor: '#0068ff',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonDisabled: {
    backgroundColor: '#a0c4ff',
  },
  buttonLogout: {
    backgroundColor: '#cc3333',
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 15,
  },
  logTitle: {
    fontWeight: '700',
    fontSize: 14,
    marginTop: 16,
    marginBottom: 4,
  },
  logContainer: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 8,
  },
  logEntry: {
    fontSize: 12,
    color: '#444',
    fontFamily: 'monospace',
    marginBottom: 2,
  },
});
