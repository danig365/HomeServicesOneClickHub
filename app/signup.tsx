import React, { useState } from "react";
import * as Linking from "expo-linking";

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
  Image,
} from "react-native";
import { useRouter } from "expo-router";
import { useAuth } from "@/hooks/auth-store";
import { LinearGradient } from "expo-linear-gradient";
import { Lock, Mail, User, Phone } from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const TEAL = "#0D3135";
const CREAM = "#FFF8E7";
const DARK_TEAL = "#0A2528";
const ACCENT = "#4A7D83";

export default function SignupScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { signup, error, clearError, isLoading } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [localError, setLocalError] = useState("");

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };
  const redirectTo = Linking.createURL("/auth/callback");

  const handleSignup = async () => {
    clearError();
    setLocalError("");

    // Validate all fields are filled
    if (!name || !email || !phone || !password || !confirmPassword) {
      setLocalError("All fields are required");
      return;
    }

    // Validate name (no @ symbol, at least 2 characters)
    if (name.includes("@") || name.length < 2) {
      setLocalError("Please enter a valid full name");
      return;
    }

    // Validate email format
    if (!validateEmail(email)) {
      setLocalError(
        "Please enter a valid email address (e.g., user@example.com)"
      );
      return;
    }

    // Validate phone
    if (phone.length < 10) {
      setLocalError("Please enter a valid phone number");
      return;
    }

    // Validate password length
    if (password.length < 6) {
      setLocalError("Password must be at least 6 characters");
      return;
    }

    // Validate passwords match
    if (password !== confirmPassword) {
      setLocalError("Passwords do not match");
      return;
    }

    console.log("[Signup] Attempting signup with:", {
      name,
      email,
      phone: phone.substring(0, 3) + "***",
      passwordLength: password.length,
    });

    const success = await signup({
      name,
      email,
      phone,
      password,
      role: "homeowner",
      redirectTo
    });

    if (success) {
      console.log(
        "[Signup] Signup successful, navigation will happen automatically"
      );
    }
  };

  const displayError = error || localError;

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <LinearGradient colors={[TEAL, DARK_TEAL]} style={styles.gradient}>
        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            { paddingTop: insets.top + 24 },
          ]}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.header}>
            <Image
              source={{ uri: "https://hudsoniowa.com/HMHTMLOGO.svg" }}
              style={styles.logo}
              resizeMode="contain"
            />
            <Text style={styles.tagline}>Premium Home Care</Text>
          </View>

          <View style={styles.formContainer}>
            <Text style={styles.title}>Create Account</Text>
            <Text style={styles.subtitle}>Join Hudson today</Text>

            {displayError ? (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{displayError}</Text>
              </View>
            ) : null}

            <View style={styles.inputContainer}>
              <View style={styles.inputWrapper}>
                <User size={20} color={ACCENT} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Full Name"
                  placeholderTextColor="#999"
                  value={name}
                  onChangeText={(text) => {
                    setName(text);
                    setLocalError("");
                  }}
                  editable={!isLoading}
                  autoCapitalize="words"
                />
              </View>

              <View style={styles.inputWrapper}>
                <Mail size={20} color={ACCENT} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Email"
                  placeholderTextColor="#999"
                  value={email}
                  onChangeText={(text) => {
                    setEmail(text.toLowerCase().trim());
                    setLocalError("");
                  }}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  editable={!isLoading}
                  autoCorrect={false}
                />
              </View>

              <View style={styles.inputWrapper}>
                <Phone size={20} color={ACCENT} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Phone Number"
                  placeholderTextColor="#999"
                  value={phone}
                  onChangeText={(text) => {
                    setPhone(text);
                    setLocalError("");
                  }}
                  keyboardType="phone-pad"
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
                  onChangeText={(text) => {
                    setPassword(text);
                    setLocalError("");
                  }}
                  secureTextEntry
                  editable={!isLoading}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>

              <View style={styles.inputWrapper}>
                <Lock size={20} color={ACCENT} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Confirm Passwords"
                  placeholderTextColor="#999"
                  value={confirmPassword}
                  onChangeText={(text) => {
                    setConfirmPassword(text);
                    setLocalError("");
                  }}
                  secureTextEntry
                  editable={!isLoading}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>
            </View>

            <TouchableOpacity
              style={[
                styles.signupButton,
                isLoading && styles.signupButtonDisabled,
              ]}
              onPress={handleSignup}
              disabled={
                isLoading ||
                !name ||
                !email ||
                !phone ||
                !password ||
                !confirmPassword
              }
            >
              {isLoading ? (
                <ActivityIndicator color={CREAM} />
              ) : (
                <Text style={styles.signupButtonText}>Create Account</Text>
              )}
            </TouchableOpacity>

            <View style={styles.loginContainer}>
              <Text style={styles.loginText}>Already have an account? </Text>
              <TouchableOpacity
                onPress={() => router.back()}
                disabled={isLoading}
              >
                <Text style={styles.loginLink}>Sign In</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.hintContainer}>
              <Text style={styles.hintText}>
                💡 Make sure to use a valid email address
              </Text>
              <Text style={styles.hintText}>
                💡 Password must be at least 6 characters
              </Text>
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
    justifyContent: "center",
    padding: 24,
  },
  header: {
    alignItems: "center",
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
    backgroundColor: "white",
    borderRadius: 24,
    padding: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: "#1F2937",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: "#6B7280",
    marginBottom: 24,
  },
  errorContainer: {
    backgroundColor: "#FEE2E2",
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  errorText: {
    color: "#DC2626",
    fontSize: 14,
  },
  inputContainer: {
    gap: 16,
    marginBottom: 24,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F9FAFB",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    paddingHorizontal: 16,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    height: 56,
    fontSize: 16,
    color: "#1F2937",
  },
  signupButton: {
    backgroundColor: TEAL,
    height: 56,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
  },
  signupButtonDisabled: {
    opacity: 0.6,
  },
  signupButtonText: {
    color: CREAM,
    fontSize: 18,
    fontWeight: "700",
  },
  loginContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  loginText: {
    color: "#6B7280",
    fontSize: 14,
  },
  loginLink: {
    color: ACCENT,
    fontSize: 14,
    fontWeight: "700",
  },
  hintContainer: {
    marginTop: 16,
    padding: 12,
    backgroundColor: "#F9FAFB",
    borderRadius: 8,
  },
  hintText: {
    fontSize: 12,
    color: "#6B7280",
    marginBottom: 4,
  },
});
