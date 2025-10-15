import React, { useState, useEffect } from 'react';
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
  Image
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/hooks/auth-store';
import { LinearGradient } from 'expo-linear-gradient';
import { Lock, Mail } from 'lucide-react-native';

const TEAL = '#0D3135';
const CREAM = '#FFF8E7';
const DARK_TEAL = '#0A2528';
const GOLD = '#AB9380';
const ACCENT = '#4A7D83';

export default function LoginScreen() {
  const router = useRouter();
  const { login, error, clearError, isLoading, setDemoMode, profile } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);

  // Role-based navigation after login
  useEffect(() => {
    if (profile && !isLoading) {
      console.log('[Login] Profile loaded, navigating based on role:', profile.role);
      switch (profile.role) {
        case 'admin':
          router.replace('/admin-portal');
          break;
        case 'tech':
          router.replace('/tech-portal');
          break;
        case 'homeowner':
          router.replace('/(tabs)/(home)');
          break;
        default:
          router.replace('/(tabs)/(home)');
      }
    }
  }, [profile, isLoading, router]);

  const handleLogin = async () => {
    clearError();
    setLocalError(null);
    console.log('[Login] Starting login process with Supabase');
    const success = await login({ email, password });
    console.log('[Login] Login result:', success);
    if (success) {
      console.log('[Login] Login successful, navigation will happen automatically');
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

  const handleAdminDemoMode = async () => {
    clearError();
    setLocalError(null);
    console.log('[Login] Entering admin demo mode - bypassing authentication');
    const demoAdminUser: any = {
      id: 'demo-admin-123',
      email: 'admin-demo@hudson.com',
      name: 'Demo Administrator',
      phone: '555-0300',
      role: 'admin' as const,
    };
    const demoToken = 'demo-admin-token-' + Date.now();
    
    try {
      await setDemoMode(demoAdminUser, demoToken);
      console.log('[Login] Admin demo mode activated');
    } catch (err) {
      console.error('[Login] Failed to set admin demo mode:', err);
      setLocalError('Failed to enter admin demo mode');
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
            <Image 
              source={{ uri: 'https://hudsoniowa.com/HMHTMLOGO.svg' }} 
              style={styles.logo}
              resizeMode="contain"
            />
            <Text style={styles.tagline}>Premium Home Care</Text>
          </View>

          <View style={styles.formContainer}>
            <Text style={styles.title}>Welcome Back</Text>
            <Text style={styles.subtitle}>Sign in to continue</Text>

            {(error || localError) ? (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{error || localError}</Text>
              </View>
            ) : null}

            <View style={styles.inputContainer}>
              <View style={styles.inputWrapper}>
                <Mail size={20} color={ACCENT} style={styles.inputIcon} />
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
                <Lock size={20} color={ACCENT} style={styles.inputIcon} />
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
              <Text style={styles.demoButtonText}>🎮 Homeowner Demo</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.techDemoButton}
              onPress={handleTechDemoMode}
              disabled={isLoading}
            >
              <Text style={styles.techDemoButtonText}>🔧 Tech Portal Demo</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.adminDemoButton}
              onPress={handleAdminDemoMode}
              disabled={isLoading}
            >
              <Text style={styles.adminDemoButtonText}>👑 Admin Portal Demo</Text>
            </TouchableOpacity>

            <View style={styles.demoContainer}>
              <Text style={styles.demoTitle}>Demo Accounts (Supabase):</Text>
              <Text style={styles.demoText}>Create an account via Sign Up</Text>
              <Text style={styles.demoText}>Or use demo mode buttons above</Text>
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
    width: 200,
    height: 80,
    marginBottom: 8,
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
    fontWeight: '700',
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
    color: ACCENT,
    fontSize: 14,
    fontWeight: '600',
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
    fontWeight: '700',
  },
  signupContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  signupText: {
    color: '#6B7280',
    fontSize: 14,
  },
  signupLink: {
    color: ACCENT,
    fontSize: 14,
    fontWeight: '700',
  },
  demoButton: {
    backgroundColor: ACCENT,
    height: 56,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 2,
    borderColor: '#3A6D73',
  },
  demoButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '700',
  },
  techDemoButton: {
    backgroundColor: GOLD,
    height: 56,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 2,
    borderColor: '#8B7660',
  },
  techDemoButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '700',
  },
  adminDemoButton: {
    backgroundColor: '#DC2626',
    height: 56,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 2,
    borderColor: '#B91C1C',
  },
  adminDemoButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '700',
  },
  demoContainer: {
    marginTop: 8,
    padding: 16,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
  },
  demoTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 8,
  },
  demoText: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
  },
});