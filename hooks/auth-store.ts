import createContextHook from '@nkzw/create-context-hook';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState, useCallback, useMemo } from 'react';
import { User, UserRole } from '@/types/user';
import { trpcClient } from '@/lib/trpc';

const AUTH_TOKEN_KEY = 'hudson_auth_token';
const AUTH_USER_KEY = 'hudson_auth_user';

interface AuthCredentials {
  email: string;
  password: string;
}

interface SignupData extends AuthCredentials {
  name: string;
  phone: string;
  role?: UserRole;
}

export const [AuthProvider, useAuth] = createContextHook(() => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadAuthData = useCallback(async () => {
    try {
      const [storedToken, storedUser] = await Promise.all([
        AsyncStorage.getItem(AUTH_TOKEN_KEY),
        AsyncStorage.getItem(AUTH_USER_KEY),
      ]);

      if (storedToken && storedUser) {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
      }
    } catch (err) {
      console.error('Failed to load auth data:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAuthData();
  }, [loadAuthData]);

  const login = useCallback(async (credentials: AuthCredentials): Promise<boolean> => {
    setError(null);
    setIsLoading(true);

    try {
      console.log('[Auth] Attempting login for:', credentials.email);
      const result = await trpcClient.auth.login.mutate({
        email: credentials.email,
        password: credentials.password,
      });

      console.log('[Auth] Login successful, storing auth data');
      await Promise.all([
        AsyncStorage.setItem(AUTH_TOKEN_KEY, result.token),
        AsyncStorage.setItem(AUTH_USER_KEY, JSON.stringify(result.user)),
      ]);

      setToken(result.token);
      setUser(result.user);
      setIsLoading(false);
      console.log('[Auth] Login complete, user:', result.user.email);
      return true;
    } catch (err) {
      console.error('[Auth] Login error:', err);
      let errorMessage = 'Invalid email or password';
      
      if (err instanceof Error) {
        console.error('[Auth] Error message:', err.message);
        console.error('[Auth] Error stack:', err.stack);
        if (err.message.includes('Network request failed') || err.message.includes('fetch failed') || err.message.includes('Failed to fetch')) {
          errorMessage = 'Unable to connect to server. Please check your internet connection and ensure the backend is running.';
        } else if (err.message.includes('Invalid credentials') || err.message.includes('Invalid email or password')) {
          errorMessage = 'Invalid email or password';
        } else if (!err.message.includes('Invalid')) {
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
      console.log('[Auth] Attempting signup for:', data.email);
      const result = await trpcClient.auth.signup.mutate({
        name: data.name,
        email: data.email,
        phone: data.phone,
        password: data.password,
        role: data.role,
      });

      console.log('[Auth] Signup successful, storing auth data');
      await Promise.all([
        AsyncStorage.setItem(AUTH_TOKEN_KEY, result.token),
        AsyncStorage.setItem(AUTH_USER_KEY, JSON.stringify(result.user)),
      ]);

      setToken(result.token);
      setUser(result.user);
      setIsLoading(false);
      console.log('[Auth] Signup complete, user:', result.user.email);
      return true;
    } catch (err) {
      console.error('[Auth] Signup error:', err);
      let errorMessage = 'An error occurred during signup';
      
      if (err instanceof Error) {
        console.error('[Auth] Error message:', err.message);
        console.error('[Auth] Error stack:', err.stack);
        if (err.message.includes('Network request failed') || err.message.includes('fetch failed') || err.message.includes('Failed to fetch')) {
          errorMessage = 'Unable to connect to server. Please check your internet connection and ensure the backend is running.';
        } else if (err.message.includes('Email already exists')) {
          errorMessage = 'This email is already registered. Please login instead.';
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
      await Promise.all([
        AsyncStorage.removeItem(AUTH_TOKEN_KEY),
        AsyncStorage.removeItem(AUTH_USER_KEY),
      ]);

      setToken(null);
      setUser(null);
    } catch (err) {
      console.error('Logout error:', err);
    }
  }, []);

  const resetPassword = useCallback(async (email: string): Promise<boolean> => {
    setError(null);

    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      return true;
    } catch (err) {
      console.error('Reset password error:', err);
      setError('An error occurred');
      return false;
    }
  }, []);

  const getAllUsers = useCallback(async () => {
    if (!token) return [];
    try {
      const users = await trpcClient.users.getAll.query(undefined, {
        context: {
          headers: {
            authorization: `Bearer ${token}`,
          },
        },
      });
      return users;
    } catch (err) {
      console.error('Get all users error:', err);
      return [];
    }
  }, [token]);

  const deleteUser = useCallback(async (userId: string): Promise<boolean> => {
    if (!token) return false;
    try {
      const result = await trpcClient.users.delete.mutate(
        { userId },
        {
          context: {
            headers: {
              authorization: `Bearer ${token}`,
            },
          },
        }
      );

      if (result.success && user?.id === userId) {
        await logout();
      }

      return result.success;
    } catch (err) {
      console.error('Delete user error:', err);
      return false;
    }
  }, [token, user, logout]);

  const updateUserRole = useCallback(async (userId: string, newRole: UserRole): Promise<boolean> => {
    if (!token) return false;
    try {
      const result = await trpcClient.users.updateRole.mutate(
        { userId, newRole },
        {
          context: {
            headers: {
              authorization: `Bearer ${token}`,
            },
          },
        }
      );

      if (result.success && result.user && user?.id === userId) {
        setUser(result.user);
        await AsyncStorage.setItem(AUTH_USER_KEY, JSON.stringify(result.user));
      }

      return result.success;
    } catch (err) {
      console.error('Update user role error:', err);
      return false;
    }
  }, [token, user]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return useMemo(() => ({
    user,
    token,
    isLoading,
    isAuthenticated: !!token && !!user,
    error,
    login,
    signup,
    logout,
    resetPassword,
    clearError,
    getAllUsers,
    deleteUser,
    updateUserRole,
  }), [user, token, isLoading, error, login, signup, logout, resetPassword, clearError, getAllUsers, deleteUser, updateUserRole]);
});
