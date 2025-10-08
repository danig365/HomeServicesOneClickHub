import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/hooks/auth-store';
import { LinearGradient } from 'expo-linear-gradient';
import { Lock, Mail, Wifi, WifiOff } from 'lucide-react-native';
import Constants from 'expo-constants';

const TEAL = '#14B8A6';
const CREAM = '#FFF8E7';
const DARK_TEAL = '#0F766E';

export default function LoginScreen() {
  const router = useRouter();
  const { login, error, clearError, isLoading, setDemoMode } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [backendStatus, setBackendStatus] = useState<'checking' | 'online' | 'offline'>('checking');
  const [backendUrl, setBackendUrl] = useState<string>('');
  const [localError, setLocalError] = useState<string | null>(null);

  const getBaseUrl = () => {
    if (process.env.EXPO_PUBLIC_RORK_API_BASE_URL) {
      return process.env.EXPO_PUBLIC_RORK_API_BASE_URL;
    }

    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined') {
        return window.location.origin;
      }
      return "http://localhost:8081";
    }

    const debuggerHost = Constants.expoConfig?.hostUri;
    if (debuggerHost) {
      console.log('[Login] Raw hostUri:', debuggerHost);
      
      const host = debuggerHost.split(':')[0];
      
      if (debuggerHost.includes('tunnel.dev') || debuggerHost.includes('ngrok') || debuggerHost.includes('.trycloudflare.com')) {
        return `https://${host}`;
      }
      
      if (host.includes('.e2b.app')) {
        return `https://8081-${host}`;
      }
      
      return `http://${host}:8081`;
    }

    return "http://localhost:8081";
  };

  const checkBackendConnection = useCallback(async () => {
    const baseUrl = getBaseUrl();
    setBackendUrl(baseUrl);
    console.log('[Login] Checking backend connection at:', baseUrl);
    console.log('[Login] Platform:', Platform.OS);
    console.log('[Login] EXPO_PUBLIC_RORK_API_BASE_URL:', process.env.EXPO_PUBLIC_RORK_API_BASE_URL);
    
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => {
        console.log('[Login] Backend check timeout after 8s');
        controller.abort();
      }, 8000);
      
      const response = await fetch(`${baseUrl}/api`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      console.log('[Login] Backend response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('[Login] Backend response:', data);
        setBackendStatus('online');
      } else {
        console.error('[Login] Backend returned error status:', response.status);
        setBackendStatus('offline');
      }
    } catch (err) {
      console.error('[Login] Backend connection failed:', err);
      if (err instanceof Error) {
        console.error('[Login] Error name:', err.name);
        console.error('[Login] Error message:', err.message);
        console.error('[Login] Error stack:', err.stack);
      }
      setBackendStatus('offline');
    }
  }, []);

  useEffect(() => {
    checkBackendConnection();
  }, [checkBackendConnection]);

  const handleLogin = async () => {
    clearError();
    console.log('[Login] Starting login process');
    const success = await login({ email, password });
    console.log('[Login] Login result:', success);
    if (success) {
      console.log('[Login] Login successful, navigation should happen automatically');
    }
  };

  const handleBypassLogin = async () => {
    clearError();
    console.log('[Login] Bypassing enrollment with test account');
    setEmail('homeowner@hudson.com');
    setPassword('home123');
    const success = await login({ email: 'homeowner@hudson.com', password: 'home123' });
    if (success) {
      console.log('[Login] Bypass login successful');
    }
  };

  const handleDemoMode = async () => {
    clearError();
    setLocalError(null);
    console.log('[Login] Entering demo mode - bypassing authentication');
    const demoUser: any = {
      id: 'demo-user-123',
      email: 'demo@hudson.com',
      name: 'Demo User',
      phone: '555-0100',
      role: 'homeowner' as const,
      createdAt: new Date().toISOString(),
    };
    const demoToken = 'demo-token-' + Date.now();
    
    try {
      await setDemoMode(demoUser, demoToken);
      console.log('[Login] Demo mode activated, navigation will happen automatically');
    } catch (err) {
      console.error('[Login] Failed to set demo mode:', err);
      setLocalError('Failed to enter demo mode');
    }
  };

  const handleTechDemoMode = async () => {
    clearError();
    setLocalError(null);
    console.log('[Login] Entering tech demo mode - bypassing authentication');
    const demoTechUser: any = {
      id: 'demo-tech-123',
      email: 'tech-demo@hudson.com',
      name: 'Demo Technician',
      phone: '555-0200',
      role: 'tech' as const,
      createdAt: new Date().toISOString(),
    };
    const demoToken = 'demo-tech-token-' + Date.now();
    
    try {
      await setDemoMode(demoTechUser, demoToken);
      console.log('[Login] Tech demo mode activated');
      setTimeout(() => {
        router.push('/tech-portal' as any);
      }, 100);
    } catch (err) {
      console.error('[Login] Failed to set tech demo mode:', err);
      setLocalError('Failed to enter tech demo mode');
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <LinearGradient
        colors={[TEAL, DARK_TEAL]}
        style={styles.gradient}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.header}>
            <Text style={styles.logo}>HUDSON</Text>
            <Text style={styles.tagline}>Premium Home Care</Text>
          </View>

          <View style={styles.formContainer}>
            <Text style={styles.title}>Welcome Back</Text>
            <Text style={styles.subtitle}>Sign in to continue</Text>

            <View style={[
              styles.statusContainer,
              backendStatus === 'online' ? styles.statusOnline : 
              backendStatus === 'offline' ? styles.statusOffline : 
              styles.statusChecking
            ]}>
              {backendStatus === 'checking' ? (
                <ActivityIndicator size="small" color={TEAL} />
              ) : backendStatus === 'online' ? (
                <Wifi size={16} color="#10B981" />
              ) : (
                <WifiOff size={16} color="#EF4444" />
              )}
              <Text style={styles.statusText}>
                {backendStatus === 'checking' ? 'Checking server...' :
                 backendStatus === 'online' ? 'Server connected' :
                 'Server offline'}
              </Text>
            </View>

            {backendStatus === 'offline' && (
              <View style={styles.warningContainer}>
                <Text style={styles.warningTitle}>Backend Server Offline</Text>
                <Text style={styles.warningText}>
                  Cannot connect to: {backendUrl}/api
                </Text>
                <Text style={styles.warningText}>
                  Platform: {Platform.OS}
                </Text>
                {Platform.OS !== 'web' && (
                  <Text style={styles.warningText}>
                    Host URI: {Constants.expoConfig?.hostUri || 'Not available'}
                  </Text>
                )}
                <Text style={styles.warningHint}>
                  {Platform.OS === 'web' 
                    ? 'Make sure the backend server is running on this machine.'
                    : 'For mobile: The backend must be accessible from your device. If using a physical device, ensure both are on the same WiFi network.'}
                </Text>
                <TouchableOpacity 
                  style={styles.retryButton}
                  onPress={checkBackendConnection}
                >
                  <Text style={styles.retryButtonText}>Retry Connection</Text>
                </TouchableOpacity>
              </View>
            )}

            {(error || localError) ? (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{error || localError}</Text>
              </View>
            ) : null}

            <View style={styles.inputContainer}>
              <View style={styles.inputWrapper}>
                <Mail size={20} color={TEAL} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Email"
                  placeholderTextColor="#999"
                  value={email}
                  onChangeText={setEmail}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  editable={!isLoading}
                />
              </View>

              <View style={styles.inputWrapper}>
                <Lock size={20} color={TEAL} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Password"
                  placeholderTextColor="#999"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                  editable={!isLoading}
                />
              </View>
            </View>

            <TouchableOpacity
              style={styles.forgotPassword}
              onPress={() => router.push('/forgot-password' as any)}
              disabled={isLoading}
            >
              <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.loginButton, isLoading && styles.loginButtonDisabled]}
              onPress={handleLogin}
              disabled={isLoading || !email || !password}
            >
              {isLoading ? (
                <ActivityIndicator color={CREAM} />
              ) : (
                <Text style={styles.loginButtonText}>Sign In</Text>
              )}
            </TouchableOpacity>

            <View style={styles.signupContainer}>
              <Text style={styles.signupText}>Don&apos;t have an account? </Text>
              <TouchableOpacity
                onPress={() => router.push('/signup' as any)}
                disabled={isLoading}
              >
                <Text style={styles.signupLink}>Sign Up</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.demoButton}
              onPress={handleDemoMode}
              disabled={isLoading}
            >
              <Text style={styles.demoButtonText}>🎮 Homeowner Demo (No Backend)</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.techDemoButton}
              onPress={handleTechDemoMode}
              disabled={isLoading}
            >
              <Text style={styles.techDemoButtonText}>🔧 Tech Portal Demo (No Backend)</Text>
            </TouchableOpacity>

            {backendStatus === 'online' && (
              <TouchableOpacity
                style={styles.bypassButton}
                onPress={handleBypassLogin}
                disabled={isLoading}
              >
                <Text style={styles.bypassButtonText}>🚀 Quick Start with Test Account</Text>
              </TouchableOpacity>
            )}

            <View style={styles.demoContainer}>
              <Text style={styles.demoTitle}>Demo Accounts:</Text>
              <Text style={styles.demoText}>Admin: admin@hudson.com / admin123</Text>
              <Text style={styles.demoText}>Tech: tech@hudson.com / tech123</Text>
              <Text style={styles.demoText}>Homeowner: homeowner@hudson.com / home123</Text>
            </View>
          </View>
        </ScrollView>
      </LinearGradient>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: 48,
  },
  logo: {
    fontSize: 48,
    fontWeight: '900' as const,
    color: CREAM,
    letterSpacing: 2,
  },
  tagline: {
    fontSize: 16,
    color: CREAM,
    marginTop: 8,
    opacity: 0.9,
  },
  formContainer: {
    backgroundColor: 'white',
    borderRadius: 24,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  title: {
    fontSize: 28,
    fontWeight: '700' as const,
    color: '#1F2937',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    marginBottom: 24,
  },
  errorContainer: {
    backgroundColor: '#FEE2E2',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  errorText: {
    color: '#DC2626',
    fontSize: 14,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    gap: 8,
  },
  statusChecking: {
    backgroundColor: '#F3F4F6',
  },
  statusOnline: {
    backgroundColor: '#D1FAE5',
  },
  statusOffline: {
    backgroundColor: '#FEE2E2',
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600' as const,
  },
  warningContainer: {
    backgroundColor: '#FEF3C7',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  warningTitle: {
    color: '#92400E',
    fontSize: 14,
    fontWeight: '700' as const,
    marginBottom: 8,
  },
  warningText: {
    color: '#92400E',
    fontSize: 11,
    marginBottom: 4,
  },
  warningHint: {
    color: '#92400E',
    fontSize: 10,
    marginTop: 8,
    marginBottom: 8,
    fontStyle: 'italic' as const,
  },
  retryButton: {
    backgroundColor: '#F59E0B',
    padding: 8,
    borderRadius: 6,
    alignItems: 'center',
  },
  retryButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600' as const,
  },
  inputContainer: {
    gap: 16,
    marginBottom: 16,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 16,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    height: 56,
    fontSize: 16,
    color: '#1F2937',
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    marginBottom: 24,
  },
  forgotPasswordText: {
    color: TEAL,
    fontSize: 14,
    fontWeight: '600' as const,
  },
  loginButton: {
    backgroundColor: TEAL,
    height: 56,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  loginButtonDisabled: {
    opacity: 0.6,
  },
  loginButtonText: {
    color: CREAM,
    fontSize: 18,
    fontWeight: '700' as const,
  },
  signupContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  signupText: {
    color: '#6B7280',
    fontSize: 14,
  },
  signupLink: {
    color: TEAL,
    fontSize: 14,
    fontWeight: '700' as const,
  },
  demoContainer: {
    marginTop: 24,
    padding: 16,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
  },
  demoTitle: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: '#1F2937',
    marginBottom: 8,
  },
  demoText: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
  },
  bypassButton: {
    backgroundColor: '#8B5CF6',
    height: 56,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 2,
    borderColor: '#7C3AED',
  },
  bypassButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '700' as const,
  },
  demoButton: {
    backgroundColor: '#10B981',
    height: 56,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 2,
    borderColor: '#059669',
  },
  demoButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '700' as const,
  },
  techDemoButton: {
    backgroundColor: '#F59E0B',
    height: 56,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 2,
    borderColor: '#D97706',
  },
  techDemoButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '700' as const,
  },
});
