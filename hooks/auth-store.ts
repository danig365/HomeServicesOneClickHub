import createContextHook from '@nkzw/create-context-hook';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useState, useCallback, useMemo } from 'react';
import { User, UserRole } from '@/types/user';
import { supabase } from '@/lib/supabase';
import { Session, AuthError } from '@supabase/supabase-js';
import * as Linking from 'expo-linking';
import Constants from 'expo-constants';

const AUTH_TOKEN_KEY = 'hudson_auth_token';
const AUTH_USER_KEY = 'hudson_auth_user';

interface AuthCredentials {
  email: string;
  password: string;
}

interface SignupData extends AuthCredentials {
  name: string;
  phone: string;
  role?: UserRole,
  redirectTo?: string;
}

interface UserProfile {
  id: string;
  email: string;
  full_name?: string;
  role: UserRole;
}

export const [AuthProvider, useAuth] = createContextHook(() => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProfile = useCallback(async () => {
    const currentSession = session;
    if (!currentSession?.user) return;

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', currentSession.user.id)
        .single();

      if (error) throw error;
      setProfile(data);

      // Also update the user state to match the profile
      setUser({
        id: data.id,
        email: data.email,
        name: data.full_name || '',
        phone: '',
        role: data.role,

      });
    } catch (err) {
      console.error('Error fetching profile:', err);
    }
  }, [session]);

  const initialize = useCallback(async () => {
    try {
      console.log('[Auth] Initializing Supabase auth...');

      // Get current session
      const { data: { session: currentSession } } = await supabase.auth.getSession();

      if (currentSession) {
        console.log('[Auth] Session found:', currentSession.user.email);
        setSession(currentSession);
        setToken(currentSession.access_token);

        // Fetch profile
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', currentSession.user.id)
          .single();

        if (profileError) {
          console.error('[Auth] Error fetching profile:', profileError);
        } else {
          setProfile(profileData);
          setUser({
            id: profileData.id,
            email: profileData.email,
            name: profileData.full_name || '',
            phone: '',
            role: profileData.role,
          });
        }
      } else {
        console.log('[Auth] No session found');
      }

      // Listen for auth changes
      supabase.auth.onAuthStateChange(async (_event, newSession) => {
        console.log('[Auth] Auth state changed:', _event);
        setSession(newSession);
        setToken(newSession?.access_token ?? null);

        if (newSession?.user) {
          // Fetch profile when session changes
          const { data: profileData } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', newSession.user.id)
            .single();

          if (profileData) {
            setProfile(profileData);
            setUser({
              id: profileData.id,
              email: profileData.email,
              name: profileData.full_name || '',
              phone: '',
              role: profileData.role,

            });
          }
        } else {
          setProfile(null);
          setUser(null);
        }
      });
    } catch (err) {
      console.error('[Auth] Error initializing auth:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const login = useCallback(async (credentials: AuthCredentials): Promise<boolean> => {
    setError(null);
    setIsLoading(true);

    try {
      console.log('[Auth] Attempting Supabase login for:', credentials.email);

      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email: credentials.email,
        password: credentials.password,
      });

      if (signInError) throw signInError;

      console.log('[Auth] Login successful');
      setSession(data.session);
      setToken(data.session?.access_token ?? null);

      // Fetch profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', data.user.id)
        .single();

      if (profileError) throw profileError;

      setProfile(profileData);
      setUser({
        id: profileData.id,
        email: profileData.email,
        name: profileData.full_name || '',
        phone: '',
        role: profileData.role,

      });

      setIsLoading(false);
      console.log('[Auth] Login complete, user:', profileData.email, 'role:', profileData.role);
      return true;
    } catch (err) {
      console.error('[Auth] Login error:', err);
      let errorMessage = 'Invalid email or password';

      if (err instanceof AuthError) {
        if (err.message.includes('Invalid login credentials')) {
          errorMessage = 'Invalid email or password';
        } else {
          errorMessage = err.message;
        }
      } else if (err instanceof Error) {
        if (err.message.includes('Network request failed') || err.message.includes('fetch failed')) {
          errorMessage = 'Unable to connect to server. Please check your internet connection.';
        } else {
          errorMessage = err.message;
        }
      }

      setError(errorMessage);
      setIsLoading(false);
      return false;
    }
  }, []);

  const signup = useCallback(async (data: SignupData): Promise<boolean> => {
    setError(null);
    setIsLoading(true);

    try {
      console.log('[Auth] Attempting Supabase signup for:', data.email);

      // ✅ Create redirect URL dynamically
      const redirectTo =
        Constants?.expoConfig?.extra?.supabaseRedirectUrl ||
        Linking.createURL('/auth/callback'); // fallback for safety

      console.log('[Auth] Using redirect URL:', redirectTo);

      // ✅ Include `emailRedirectTo` in Supabase signup
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          emailRedirectTo: redirectTo, // <-- Key addition
          data: {
            full_name: data.name,
            role: data.role || 'homeowner',
          },
        },
      });

      if (signUpError) throw signUpError;

      console.log('[Auth] Signup successful');

      // Check if email confirmation is required
      if (authData.user && !authData.session) {
        setError('Please check your email to confirm your account');
        setIsLoading(false);
        return false;
      }

      // If session exists, set it
      if (authData.session && authData.user) {
        setSession(authData.session);
        setToken(authData.session.access_token);

        // Fetch profile
        const { data: profileData } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', authData.user.id)
          .single();

        if (profileData) {
          setProfile(profileData);
          setUser({
            id: profileData.id,
            email: profileData.email,
            name: profileData.full_name || '',
            phone: data.phone,
            role: profileData.role,
          });
        }
      }

      setIsLoading(false);
      return true;
    } catch (err) {
      console.error('[Auth] Signup error:', err);
      let errorMessage = 'An error occurred during signup';

      if (err instanceof AuthError) {
        if (err.message.includes('User already registered')) {
          errorMessage = 'This email is already registered. Please login instead.';
        } else {
          errorMessage = err.message;
        }
      } else if (err instanceof Error) {
        if (err.message.includes('Network request failed') || err.message.includes('fetch failed')) {
          errorMessage = 'Unable to connect to server. Please check your internet connection.';
        } else {
          errorMessage = err.message;
        }
      }

      setError(errorMessage);
      setIsLoading(false);
      return false;
    }
  }, []);


  const logout = useCallback(async () => {
    try {
      console.log('[Auth] Logging out...');
      await supabase.auth.signOut();

      // Also clear AsyncStorage for backward compatibility
      await Promise.all([
        AsyncStorage.removeItem(AUTH_TOKEN_KEY),
        AsyncStorage.removeItem(AUTH_USER_KEY),
      ]);

      setSession(null);
      setToken(null);
      setUser(null);
      setProfile(null);
      console.log('[Auth] Logout complete');
    } catch (err) {
      console.error('Logout error:', err);
    }
  }, []);

  const resetPassword = useCallback(async (email: string): Promise<boolean> => {
    setError(null);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: 'yourapp://reset-password',
      });

      if (error) throw error;
      return true;
    } catch (err) {
      console.error('Reset password error:', err);
      setError('An error occurred');
      return false;
    }
  }, []);

  const getAllUsers = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*');

      if (error) {
        console.error('Supabase getAllUsers error:', error);
        return [];
      }

      return data || [];
    } catch (err) {
      console.error('Get all users error:', err);
      return [];
    }
  }, []);

  const deleteUser = useCallback(async (userId: string): Promise<boolean> => {
    console.log('[Auth] deleteUser called with userId:', userId);
    console.log('[Auth] Current user:', user?.id, user?.email);

    try {
      console.log('[Auth] Attempting to delete user via Supabase admin API...');
      const { error } = await supabase.auth.admin.deleteUser(userId);

      if (error) {
        console.error('[Auth] Supabase deleteUser error:', error);
        console.error('[Auth] Error details:', JSON.stringify(error, null, 2));
        return false;
      }

      console.log('[Auth] User deleted successfully from auth');

      // If the deleted user is the current logged-in user
      if (user?.id === userId) {
        console.log('[Auth] Deleted user was current user, logging out...');
        await logout();
      }

      console.log('[Auth] deleteUser completed successfully');
      return true;
    } catch (err) {
      console.error('[Auth] Delete user error:', err);
      console.error('[Auth] Error stack:', err instanceof Error ? err.stack : 'No stack trace');
      return false;
    }
  }, [user, logout]);

  const updateUserRole = useCallback(async (userId: string, newRole: UserRole): Promise<boolean> => {
    console.log('[Auth] updateUserRole called:', { userId, newRole });
    console.log('[Auth] Current user:', user?.id, user?.email, user?.role);

    try {
      console.log('[Auth] Attempting to update role in profiles table...');
      const { data, error } = await supabase
        .from('profiles')
        .update({ role: newRole })
        .eq('id', userId)
        .select()
        .single();

      if (error) {
        console.error('[Auth] Supabase updateUserRole error:', error);
        console.error('[Auth] Error details:', JSON.stringify(error, null, 2));
        return false;
      }

      console.log('[Auth] Role updated successfully:', data);

      if (data && user?.id === userId) {
        console.log('[Auth] Updated user is current user, updating local state...');
        setUser(data);
        await AsyncStorage.setItem(AUTH_USER_KEY, JSON.stringify(data));
        console.log('[Auth] Local state updated');
      }

      console.log('[Auth] updateUserRole completed successfully');
      return true;
    } catch (err) {
      console.error('[Auth] Update user role error:', err);
      console.error('[Auth] Error stack:', err instanceof Error ? err.stack : 'No stack trace');
      return false;
    }
  }, [user]);


  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const setDemoMode = useCallback(async (demoUser: User, demoToken: string) => {
    try {
      await Promise.all([
        AsyncStorage.setItem(AUTH_TOKEN_KEY, demoToken),
        AsyncStorage.setItem(AUTH_USER_KEY, JSON.stringify(demoUser)),
      ]);
      setToken(demoToken);
      setUser(demoUser);
      // Set a mock profile for demo mode
      setProfile({
        id: demoUser.id,
        email: demoUser.email,
        full_name: demoUser.name,
        role: demoUser.role,
      });
      console.log('[Auth] Demo mode activated');
    } catch (err) {
      console.error('[Auth] Failed to set demo mode:', err);
      throw err;
    }
  }, []);

  return useMemo(() => ({
    user,
    token,
    session,
    profile,
    isLoading,
    isAuthenticated: !!session || (!!token && !!user),
    error,
    login,
    signup,
    logout,
    resetPassword,
    clearError,
    getAllUsers,
    deleteUser,
    updateUserRole,
    setDemoMode,
    initialize,
    fetchProfile,
  }), [user, token, session, profile, isLoading, error, login, signup, logout, resetPassword, clearError, getAllUsers, deleteUser, updateUserRole, setDemoMode, initialize, fetchProfile]);
});