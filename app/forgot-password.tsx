import React, { useState } from 'react';
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
import { Mail, CheckCircle } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const TEAL = '#14B8A6';
const CREAM = '#FFF8E7';
const DARK_TEAL = '#0F766E';

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { resetPassword, error, clearError } = useAuth();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleResetPassword = async () => {
    clearError();
    setIsLoading(true);

    const result = await resetPassword(email);
    setIsLoading(false);

    if (result) {
      setSuccess(true);
    }
  };

  if (success) {
    return (
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <LinearGradient
          colors={[TEAL, DARK_TEAL]}
          style={styles.gradient}
        >
          <View style={[styles.scrollContent, { paddingTop: insets.top + 24 }]}>
            <View style={styles.successContainer}>
              <CheckCircle size={64} color={TEAL} />
              <Text style={styles.successTitle}>Check Your Email</Text>
              <Text style={styles.successText}>
                We have sent password reset instructions to {email}
              </Text>
              <TouchableOpacity
                style={styles.backButton}
                onPress={() => router.back()}
              >
                <Text style={styles.backButtonText}>Back to Login</Text>
              </TouchableOpacity>
            </View>
          </View>
        </LinearGradient>
      </KeyboardAvoidingView>
    );
  }

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
          contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + 24 }]}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.header}>
            <Text style={styles.logo}>HUDSON</Text>
            <Text style={styles.tagline}>Premium Home Care</Text>
          </View>

          <View style={styles.formContainer}>
            <Text style={styles.title}>Reset Password</Text>
            <Text style={styles.subtitle}>
              Enter your email address and we will send you instructions to reset your password
            </Text>

            {error ? (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{error}</Text>
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
            </View>

            <TouchableOpacity
              style={[styles.resetButton, isLoading && styles.resetButtonDisabled]}
              onPress={handleResetPassword}
              disabled={isLoading || !email}
            >
              {isLoading ? (
                <ActivityIndicator color={CREAM} />
              ) : (
                <Text style={styles.resetButtonText}>Send Reset Link</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.backToLogin}
              onPress={() => router.back()}
              disabled={isLoading}
            >
              <Text style={styles.backToLoginText}>Back to Login</Text>
            </TouchableOpacity>
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
    lineHeight: 24,
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
    marginBottom: 24,
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
  resetButton: {
    backgroundColor: TEAL,
    height: 56,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  resetButtonDisabled: {
    opacity: 0.6,
  },
  resetButtonText: {
    color: CREAM,
    fontSize: 18,
    fontWeight: '700' as const,
  },
  backToLogin: {
    alignItems: 'center',
  },
  backToLoginText: {
    color: TEAL,
    fontSize: 14,
    fontWeight: '600' as const,
  },
  successContainer: {
    backgroundColor: 'white',
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  successTitle: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: '#1F2937',
    marginTop: 24,
    marginBottom: 12,
  },
  successText: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  backButton: {
    backgroundColor: TEAL,
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
  },
  backButtonText: {
    color: CREAM,
    fontSize: 16,
    fontWeight: '700' as const,
  },
});
