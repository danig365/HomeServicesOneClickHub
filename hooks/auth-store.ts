import createContextHook from '@nkzw/create-context-hook';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useState, useCallback, useMemo, useEffect } from 'react';
import { User, UserRole } from '@/types/user';
import { supabase, supabaseAdmin } from '@/lib/supabase';
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
  role?: UserRole;
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

  // Load current user - defined early so it can be used by other functions
  const loadCurrentUser = useCallback(async () => {
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      
      if (!authUser) {
        setUser(null);
        return;
      }

      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authUser.id)
        .single();

      if (profileError) throw profileError;

      // Get assigned properties if user is a tech
      let assignedProperties: string[] = [];
      if (profileData.role === 'tech') {
        const { data: techAssignments } = await supabase
          .from('tech_assignments')
          .select('property_id')
          .eq('tech_id', authUser.id)
          .eq('status', 'active');
        
        assignedProperties = techAssignments?.map(ta => ta.property_id) || [];
      }

      setUser({
        id: profileData.id,
        name: profileData.full_name || '',
        email: profileData.email,
        phone: '',
        role: profileData.role,
        assignedProperties,
      });
      
      setProfile(profileData);
    } catch (error) {
      console.error('[Auth] Failed to load current user:', error);
      setUser(null);
    }
  }, []);

  // Load all techs with their assignments
  const loadTechs = useCallback(async () => {
    try {
      const { data: techProfiles, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'tech')
        .order('full_name');

      if (error) throw error;

      // Get all tech assignments
      const { data: allAssignments } = await supabase
        .from('tech_assignments')
        .select('tech_id, property_id, status')
        .eq('status', 'active');

      const techsWithAssignments: User[] = (techProfiles || []).map(profile => {
        const techAssignments = allAssignments?.filter(a => a.tech_id === profile.id) || [];
        
        return {
          id: profile.id,
          name: profile.full_name || '',
          email: profile.email,
          phone: '',
          role: profile.role as UserRole,
          assignedProperties: techAssignments.map(a => a.property_id),
        };
      });

      return techsWithAssignments;
    } catch (error) {
      console.error('[Auth] Failed to load techs:', error);
      return [];
    }
  }, []);

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

      // Get assigned properties if user is a tech
      let assignedProperties: string[] = [];
      if (data.role === 'tech') {
        const { data: techAssignments } = await supabase
          .from('tech_assignments')
          .select('property_id')
          .eq('tech_id', currentSession.user.id)
          .eq('status', 'active');
        
        assignedProperties = techAssignments?.map(ta => ta.property_id) || [];
      }

      // Also update the user state to match the profile
      setUser({
        id: data.id,
        email: data.email,
        name: data.full_name || '',
        phone: '',
        role: data.role,
        assignedProperties,
      });
    } catch (err) {
      console.error('[Auth] Error fetching profile:', err);
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
          
          // Get assigned properties if user is a tech
          let assignedProperties: string[] = [];
          if (profileData.role === 'tech') {
            const { data: techAssignments } = await supabase
              .from('tech_assignments')
              .select('property_id')
              .eq('tech_id', currentSession.user.id)
              .eq('status', 'active');
            
            assignedProperties = techAssignments?.map(ta => ta.property_id) || [];
          }
          
          setUser({
            id: profileData.id,
            email: profileData.email,
            name: profileData.full_name || '',
            phone: '',
            role: profileData.role,
            assignedProperties,
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
            
            // Get assigned properties if user is a tech
            let assignedProperties: string[] = [];
            if (profileData.role === 'tech') {
              const { data: techAssignments } = await supabase
                .from('tech_assignments')
                .select('property_id')
                .eq('tech_id', newSession.user.id)
                .eq('status', 'active');
              
              assignedProperties = techAssignments?.map(ta => ta.property_id) || [];
            }
            
            setUser({
              id: profileData.id,
              email: profileData.email,
              name: profileData.full_name || '',
              phone: '',
              role: profileData.role,
              assignedProperties,
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

  // Initialize on mount
  useEffect(() => {
    initialize();
  }, [initialize]);

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
      
      // Get assigned properties if user is a tech
      let assignedProperties: string[] = [];
      if (profileData.role === 'tech') {
        const { data: techAssignments } = await supabase
          .from('tech_assignments')
          .select('property_id')
          .eq('tech_id', data.user.id)
          .eq('status', 'active');
        
        assignedProperties = techAssignments?.map(ta => ta.property_id) || [];
      }
      
      setUser({
        id: profileData.id,
        email: profileData.email,
        name: profileData.full_name || '',
        phone: '',
        role: profileData.role,
        assignedProperties,
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

      // Create redirect URL dynamically
      const redirectTo =
        Constants?.expoConfig?.extra?.supabaseRedirectUrl ||
        Linking.createURL('/auth/callback');

      console.log('[Auth] Using redirect URL:', redirectTo);

      // Include emailRedirectTo in Supabase signup
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          emailRedirectTo: redirectTo,
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

      // Clear AsyncStorage for backward compatibility
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
      console.error('[Auth] Logout error:', err);
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
      console.error('[Auth] Reset password error:', err);
      setError('An error occurred');
      return false;
    }
  }, []);

  const getAllUsers = useCallback(async (): Promise<User[]> => {
    try {
      const { data: profiles, error } = await supabase
        .from('profiles')
        .select('*')
        .order('full_name');

      if (error) {
        console.error('[Auth] Supabase getAllUsers error:', error);
        return [];
      }

      // Get all tech assignments
      const { data: allAssignments } = await supabase
        .from('tech_assignments')
        .select('tech_id, property_id, status')
        .eq('status', 'active');

      const users: User[] = (profiles || []).map(profile => {
        const techAssignments = allAssignments?.filter(a => a.tech_id === profile.id) || [];
        
        return {
          id: profile.id,
          name: profile.full_name || '',
          email: profile.email,
          phone: '',
          role: profile.role as UserRole,
          assignedProperties: techAssignments.map(a => a.property_id),
        };
      });

      return users;
    } catch (err) {
      console.error('[Auth] Get all users error:', err);
      return [];
    }
  }, []);

  const deleteUser = useCallback(async (userId: string): Promise<boolean> => {
    console.log('[Auth] deleteUser called with userId:', userId);
    console.log('[Auth] Current user:', user?.id, user?.email);

    try {
      // First check if user exists in profiles
      const { data: existingUser, error: checkError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (checkError) {
        console.error('[Auth] Error checking user existence:', checkError);
        return false;
      }

      if (!existingUser) {
        console.error('[Auth] User not found:', userId);
        return false;
      }

      // Delete user using admin client
      const { error: authDeleteError } = await supabaseAdmin.auth.admin.deleteUser(userId);

      if (authDeleteError) {
        console.error('[Auth] Supabase deleteUser error:', authDeleteError);
        console.error('[Auth] Error details:', JSON.stringify(authDeleteError, null, 2));
        return false;
      }

      // After successful auth deletion, delete from profiles
      const { error: profileDeleteError } = await supabaseAdmin
        .from('profiles')
        .delete()
        .eq('id', userId);

      if (profileDeleteError) {
        console.error('[Auth] Error deleting user profile:', profileDeleteError);
        return false;
      }

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
    console.log('[Auth] updateUserRole called:', { newRole, userId });
    console.log('[Auth] Current user:', user?.id, user?.email, user?.role);

    try {
      // First verify user exists
      const { data: existingUser, error: checkError } = await supabaseAdmin
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (checkError) {
        console.error('[Auth] Error checking user:', checkError);
        return false;
      }

      if (!existingUser) {
        console.error('[Auth] User not found in database:', userId);
        return false;
      }

      console.log('[Auth] Found user:', existingUser.email, 'Current role:', existingUser.role);

      // Perform update
      const { error: updateError } = await supabaseAdmin
        .from('profiles')
        .update({ role: newRole })
        .eq('id', userId);

      if (updateError) {
        console.error('[Auth] Update error:', updateError);
        return false;
      }

      // Verify the update
      const { data: updatedUser, error: verifyError } = await supabaseAdmin
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (verifyError || !updatedUser) {
        console.error('[Auth] Verification error:', verifyError);
        return false;
      }
      
      console.log('[Auth] Role successfully updated from', existingUser.role, 'to', updatedUser.role);
      
      // Update local state if it's the current user
      if (user?.id === userId) {
        setUser(prev => prev ? { ...prev, role: newRole } : null);
        setProfile(prev => prev ? { ...prev, role: newRole } : null);
        console.log('[Auth] Local state updated for current user');
      }
      
      return true;
    } catch (err) {
      console.error('[Auth] Update user role error:', err);
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

  const assignTechToProperty = useCallback(async (techId: string, propertyId: string): Promise<boolean> => {
    try {
      console.log('[Auth] Assigning tech', techId, 'to property', propertyId);
      
      // Check if assignment already exists
      const { data: existing, error: checkError } = await supabase
        .from('tech_assignments')
        .select('id, status')
        .eq('tech_id', techId)
        .eq('property_id', propertyId)
        .maybeSingle();

      if (checkError && checkError.code !== 'PGRST116') {
        console.error('[Auth] Error checking existing assignment:', checkError);
        throw checkError;
      }

      if (existing) {
        // Assignment exists
        if (existing.status === 'inactive') {
          // Reactivate it
          const { error: updateError } = await supabase
            .from('tech_assignments')
            .update({ 
              status: 'active',
              assigned_date: new Date().toISOString()
            })
            .eq('id', existing.id);

          if (updateError) {
            console.error('[Auth] Error reactivating assignment:', updateError);
            throw updateError;
          }
          console.log('[Auth] Assignment reactivated');
        } else {
          console.log('[Auth] Assignment already active');
        }
      } else {
        // Create new assignment
        const { error: insertError } = await supabase
          .from('tech_assignments')
          .insert({
            tech_id: techId,
            property_id: propertyId,
            status: 'active',
            assigned_date: new Date().toISOString(),
          });

        if (insertError) {
          console.error('[Auth] Error creating assignment:', insertError);
          throw insertError;
        }
        console.log('[Auth] New assignment created');
      }

      // Refresh user data to get updated assignments
      await loadCurrentUser();
      
      return true;
    } catch (error) {
      console.error('[Auth] Failed to assign tech to property:', error);
      return false;
    }
  }, [loadCurrentUser]);

  // Get all techs with their assignments
  const getAllTechsWithAssignments = useCallback(async (): Promise<User[]> => {
    try {
      const { data: techProfiles, error: techError } = await supabase
        .from('profiles')
        .select('id, email, full_name, role')
        .eq('role', 'tech')
        .order('full_name');

      if (techError) throw techError;

      // Get all active assignments
      const { data: assignments, error: assignError } = await supabase
        .from('tech_assignments')
        .select('tech_id, property_id, status')
        .eq('status', 'active');

      if (assignError) throw assignError;

      const techsWithAssignments: User[] = (techProfiles || []).map(profile => {
        const techAssignments = assignments?.filter(a => a.tech_id === profile.id) || [];
        
        return {
          id: profile.id,
          name: profile.full_name || '',
          email: profile.email,
          phone: '',
          role: 'tech' as UserRole,
          assignedProperties: techAssignments.map(a => a.property_id),
        };
      });

      return techsWithAssignments;
    } catch (error) {
      console.error('[Auth] Failed to get techs with assignments:', error);
      return [];
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
    assignTechToProperty,
    getAllTechsWithAssignments,
    loadCurrentUser,
    loadTechs,
  }), [
    user, token, session, profile, isLoading, error,
    login, signup, logout, resetPassword, clearError,
    getAllUsers, deleteUser, updateUserRole, setDemoMode,
    initialize, fetchProfile, assignTechToProperty,
    getAllTechsWithAssignments, loadCurrentUser, loadTechs
  ]);
});