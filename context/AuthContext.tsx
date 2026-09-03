import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { supabase, isLiveSupabaseConfigured, SafeStorage } from '../lib/supabase';
import { ProfileService } from '../lib/profile';
import { AuthUser, AuthSession, AuthState } from '../types/auth';
import { UserProfile, QuizFormData } from '../types/quiz';
import { DEMO_ACCOUNT, isDemoModeEnabled } from '../constants/demo';

const STORAGE_KEYS = {
  INTRO_SEEN: '@unifit_intro_seen',
  ONBOARDING_COMPLETED_PREFIX: '@unifit_onboarding_completed_',
  AUTH_SESSION: '@unifit_local_session',
  MOCK_USERS: '@unifit_mock_users',
};

interface AuthContextType extends AuthState {
  isIntroSeen: boolean;
  signIn: (emailOrUsername: string, password: string) => Promise<{ success: boolean; error?: string; requiresQuiz?: boolean }>;
  signInWithDemo: () => Promise<{ success: boolean; error?: string }>;
  signUp: (fullName: string, email: string, password: string) => Promise<{ success: boolean; error?: string; confirmationSent?: boolean; requiresQuiz?: boolean }>;
  resetPassword: (email: string) => Promise<{ success: boolean; error?: string }>;
  signOut: () => Promise<void>;
  completeIntro: () => Promise<void>;
  resetOnboarding: () => Promise<void>;
  submitQuizProfile: (quizData: QuizFormData) => Promise<{ success: boolean; error?: string }>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [session, setSession] = useState<AuthSession | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isIntroSeen, setIsIntroSeen] = useState<boolean>(false);
  const [isOnboardingCompleted, setIsOnboardingCompleted] = useState<boolean>(false);
  const [isConfiguredWithLiveSupabase, setIsConfiguredWithLiveSupabase] = useState<boolean>(false);

  const loadUserProfile = async (userId: string, defaultName: string) => {
    try {
      const userProfile = await ProfileService.getProfile(userId);
      if (userProfile) {
        setProfile(userProfile);
        const completed = Boolean(userProfile.onboarding_completed);
        setIsOnboardingCompleted(completed);
      } else {
        const initialProfile: UserProfile = {
          user_id: userId,
          full_name: defaultName,
          age: null,
          sex: null,
          height_cm: null,
          weight_kg: null,
          fitness_goal: null,
          lifestyle_activity: null,
          diet: null,
          preferred_activities: [],
          accessibility_needs: [],
          has_exercise_restriction: false,
          strength_equipment: [],
          strength_experience: null,
          onboarding_completed: false,
        };
        setProfile(initialProfile);
        setIsOnboardingCompleted(false);
      }
    } catch (err) {
      console.warn('Failed to load user profile:', err);
    }
  };

  // Initialize Auth & Storage State on app boot
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const liveConfigured = isLiveSupabaseConfigured();
        setIsConfiguredWithLiveSupabase(liveConfigured);

        // Check if intro tour has been seen
        const introSeen = await SafeStorage.getItem(STORAGE_KEYS.INTRO_SEEN);
        setIsIntroSeen(introSeen === 'true');

        if (liveConfigured) {
          // Check Supabase session
          const { data: { session: supaSession } } = await supabase.auth.getSession();
          if (supaSession?.user) {
            const authUser: AuthUser = {
              id: supaSession.user.id,
              email: supaSession.user.email || '',
              fullName: supaSession.user.user_metadata?.full_name || supaSession.user.email?.split('@')[0] || 'UniFit Athlete',
              createdAt: supaSession.user.created_at,
            };
            setUser(authUser);
            setSession({
              user: authUser,
              accessToken: supaSession.access_token,
              expiresAt: supaSession.expires_at || Date.now() + 3600 * 1000,
            });
            await loadUserProfile(authUser.id, authUser.fullName);
          }
        } else {
          // Check persistent local session
          const storedSession = await SafeStorage.getItem(STORAGE_KEYS.AUTH_SESSION);
          if (storedSession) {
            const parsedSession: AuthSession = JSON.parse(storedSession);
            setSession(parsedSession);
            setUser(parsedSession.user);
            await loadUserProfile(parsedSession.user.id, parsedSession.user.fullName);
          }
        }
      } catch (err) {
        console.warn('Error during auth initialization:', err);
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();

    // Listen to Supabase auth state changes if live configured
    if (isLiveSupabaseConfigured()) {
      const { data: { subscription } } = supabase.auth.onAuthStateChange(
        async (_event, supaSession) => {
          if (supaSession?.user) {
            const authUser: AuthUser = {
              id: supaSession.user.id,
              email: supaSession.user.email || '',
              fullName: supaSession.user.user_metadata?.full_name || supaSession.user.email?.split('@')[0] || 'UniFit Athlete',
              createdAt: supaSession.user.created_at,
            };
            setUser(authUser);
            setSession({
              user: authUser,
              accessToken: supaSession.access_token,
              expiresAt: supaSession.expires_at || Date.now() + 3600 * 1000,
            });
            await loadUserProfile(authUser.id, authUser.fullName);
          } else {
            setUser(null);
            setProfile(null);
            setSession(null);
            setIsOnboardingCompleted(false);
          }
        }
      );

      return () => {
        subscription.unsubscribe();
      };
    }
  }, []);

  const refreshProfile = async () => {
    if (user) {
      await loadUserProfile(user.id, user.fullName);
    }
  };

  const completeIntro = async () => {
    try {
      await SafeStorage.setItem(STORAGE_KEYS.INTRO_SEEN, 'true');
      setIsIntroSeen(true);
    } catch (err) {
      console.warn('Failed to persist intro seen state:', err);
    }
  };

  const submitQuizProfile = async (
    quizData: QuizFormData
  ): Promise<{ success: boolean; error?: string }> => {
    if (!user) {
      return { success: false, error: 'User session not found.' };
    }

    const result = await ProfileService.saveQuizProfile(user.id, user.fullName, quizData);
    if (result.success && result.profile) {
      setProfile(result.profile);
      setIsOnboardingCompleted(true);
      return { success: true };
    }

    return { success: false, error: result.error || 'Failed to save profile' };
  };

  const resetOnboarding = async () => {
    try {
      if (user) {
        await ProfileService.clearQuizDraft(user.id);
        const resetProf = await ProfileService.getProfile(user.id);
        if (resetProf) {
          const updated: UserProfile = { ...resetProf, onboarding_completed: false };
          await SafeStorage.setItem(
            `@unifit_user_profile_${user.id}`,
            JSON.stringify(updated)
          );
          setProfile(updated);
        }
      }
      setIsOnboardingCompleted(false);
    } catch (err) {
      console.warn('Failed to reset onboarding state:', err);
    }
  };

  const signIn = async (
    emailOrUsername: string,
    password: string
  ): Promise<{ success: boolean; error?: string; requiresQuiz?: boolean }> => {
    try {
      const sanitizedEmail = emailOrUsername.trim().toLowerCase();

      if (isConfiguredWithLiveSupabase) {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: sanitizedEmail,
          password: password,
        });

        if (error) {
          if (error.message.toLowerCase().includes('invalid login credentials')) {
            return { success: false, error: 'Incorrect email or password. Please try again.' };
          }
          if (error.message.toLowerCase().includes('email not confirmed')) {
            return { success: false, error: 'Please check your email and confirm your account before logging in.' };
          }
          return { success: false, error: error.message };
        }

        if (data.user) {
          const authUser: AuthUser = {
            id: data.user.id,
            email: data.user.email || sanitizedEmail,
            fullName: data.user.user_metadata?.full_name || 'UniFit Athlete',
            createdAt: data.user.created_at,
          };
          setUser(authUser);
          await loadUserProfile(authUser.id, authUser.fullName);

          const fetchedProfile = await ProfileService.getProfile(authUser.id);
          const completed = Boolean(fetchedProfile?.onboarding_completed);

          return { success: true, requiresQuiz: !completed };
        }
      } else {
        // Resilient development mode (only enabled in development/demo mode)
        if (!isDemoModeEnabled()) {
          return { success: false, error: 'Local development auth is disabled in production.' };
        }

        const mockUsersStr = await SafeStorage.getItem(STORAGE_KEYS.MOCK_USERS);
        const mockUsers = mockUsersStr ? JSON.parse(mockUsersStr) : [];
        
        // Authenticate against demo credentials or registered mock users
        const isDemo = sanitizedEmail === DEMO_ACCOUNT.email;
        if (isDemo) {
          if (password !== DEMO_ACCOUNT.password) {
            return { success: false, error: 'Incorrect email or password. Please try again.' };
          }
        }

        const existing = mockUsers.find(
          (u: any) => u.email === sanitizedEmail && u.password === password
        );

        if (!isDemo && !existing) {
          return { success: false, error: 'Incorrect email or password. Please try again.' };
        }

        const fullName = isDemo
          ? DEMO_ACCOUNT.fullName
          : existing
          ? existing.fullName
          : (sanitizedEmail.split('@')[0] || 'UniFit Athlete');

        const authUser: AuthUser = {
          id: isDemo ? 'usr_demo_unifit' : (existing ? existing.id : 'usr_' + Date.now()),
          email: sanitizedEmail,
          fullName: fullName.charAt(0).toUpperCase() + fullName.slice(1),
          createdAt: new Date().toISOString(),
        };

        const newSession: AuthSession = {
          user: authUser,
          accessToken: 'demo_token_' + Date.now(),
          expiresAt: Date.now() + 7 * 24 * 3600 * 1000,
        };

        await SafeStorage.setItem(STORAGE_KEYS.AUTH_SESSION, JSON.stringify(newSession));
        setUser(authUser);
        setSession(newSession);

        if (isDemo) {
          const demoProf = await ProfileService.saveDemoProfile(authUser.id, authUser.fullName);
          setProfile(demoProf);
          setIsOnboardingCompleted(true);
          return { success: true, requiresQuiz: false };
        } else {
          await loadUserProfile(authUser.id, authUser.fullName);
          const fetchedProfile = await ProfileService.getProfile(authUser.id);
          const completed = Boolean(fetchedProfile?.onboarding_completed);
          return { success: true, requiresQuiz: !completed };
        }
      }

      return { success: false, error: 'Unable to complete sign in. Please try again.' };
    } catch (err: any) {
      return {
        success: false,
        error: 'Unable to connect to service. Please check your network connection.',
      };
    }
  };

  const signInWithDemo = async (): Promise<{ success: boolean; error?: string }> => {
    try {
      if (!isDemoModeEnabled()) {
        return { success: false, error: 'Demo mode is not enabled in this environment.' };
      }

      if (isConfiguredWithLiveSupabase) {
        // Authenticate with real Supabase Auth
        const { data, error } = await supabase.auth.signInWithPassword({
          email: DEMO_ACCOUNT.email,
          password: DEMO_ACCOUNT.password,
        });

        if (error) {
          // If demo user does not exist yet in Supabase Auth, attempt signUp
          if (error.message.toLowerCase().includes('invalid login credentials')) {
            const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
              email: DEMO_ACCOUNT.email,
              password: DEMO_ACCOUNT.password,
              options: {
                data: {
                  full_name: DEMO_ACCOUNT.fullName,
                },
              },
            });

            if (signUpError || !signUpData.user) {
              return {
                success: false,
                error: 'Demo user is not yet created in Supabase Auth. Please create demo@unifit.app in Supabase.',
              };
            }

            if (!signUpData.session) {
              return {
                success: false,
                error: 'Demo user requires email confirmation in Supabase. Please confirm demo@unifit.app.',
              };
            }

            const authUser: AuthUser = {
              id: signUpData.user.id,
              email: signUpData.user.email || DEMO_ACCOUNT.email,
              fullName: DEMO_ACCOUNT.fullName,
              createdAt: signUpData.user.created_at,
            };
            setUser(authUser);
            setSession({
              user: authUser,
              accessToken: signUpData.session.access_token,
              expiresAt: signUpData.session.expires_at || Date.now() + 3600 * 1000,
            });

            const demoProf = await ProfileService.saveDemoProfile(authUser.id, DEMO_ACCOUNT.fullName);
            setProfile(demoProf);
            setIsOnboardingCompleted(true);
            return { success: true };
          }

          return { success: false, error: error.message };
        }

        if (data.user && data.session) {
          const authUser: AuthUser = {
            id: data.user.id,
            email: data.user.email || DEMO_ACCOUNT.email,
            fullName: data.user.user_metadata?.full_name || DEMO_ACCOUNT.fullName,
            createdAt: data.user.created_at,
          };
          setUser(authUser);
          setSession({
            user: authUser,
            accessToken: data.session.access_token,
            expiresAt: data.session.expires_at || Date.now() + 3600 * 1000,
          });

          // Ensure demo profile exists and onboarding is complete
          const demoProf = await ProfileService.saveDemoProfile(authUser.id, authUser.fullName);
          setProfile(demoProf);
          setIsOnboardingCompleted(true);
          return { success: true };
        }
      } else {
        // Resilient development mode fallback (ONLY in demo mode)
        const demoUser: AuthUser = {
          id: 'usr_demo_unifit',
          email: DEMO_ACCOUNT.email,
          fullName: DEMO_ACCOUNT.fullName,
          createdAt: new Date().toISOString(),
        };

        const demoSession: AuthSession = {
          user: demoUser,
          accessToken: 'demo_token_' + Date.now(),
          expiresAt: Date.now() + 7 * 24 * 3600 * 1000,
        };

        await SafeStorage.setItem(STORAGE_KEYS.AUTH_SESSION, JSON.stringify(demoSession));
        setUser(demoUser);
        setSession(demoSession);

        const demoProf = await ProfileService.saveDemoProfile(demoUser.id, demoUser.fullName);
        setProfile(demoProf);
        setIsOnboardingCompleted(true);

        return { success: true };
      }

      return { success: false, error: 'Demo sign in could not be completed.' };
    } catch (err: any) {
      console.warn('Demo login error:', err);
      return {
        success: false,
        error: 'Unable to connect to service. Please check your network connection.',
      };
    }
  };

  const signUp = async (
    fullName: string,
    email: string,
    password: string
  ): Promise<{ success: boolean; error?: string; confirmationSent?: boolean; requiresQuiz?: boolean }> => {
    try {
      const sanitizedEmail = email.trim().toLowerCase();
      const sanitizedName = fullName.trim();

      if (isConfiguredWithLiveSupabase) {
        const { data, error } = await supabase.auth.signUp({
          email: sanitizedEmail,
          password: password,
          options: {
            data: {
              full_name: sanitizedName,
            },
          },
        });

        if (error) {
          if (error.message.toLowerCase().includes('user already registered') || error.message.toLowerCase().includes('already exists')) {
            return { success: false, error: 'An account with this email address already exists. Please login instead.' };
          }
          if (error.message.toLowerCase().includes('password should be at least')) {
            return { success: false, error: 'Password should be at least 6 characters long.' };
          }
          return { success: false, error: error.message };
        }

        if (data.session) {
          const authUser: AuthUser = {
            id: data.user!.id,
            email: data.user!.email || sanitizedEmail,
            fullName: sanitizedName,
            createdAt: data.user!.created_at,
          };
          setUser(authUser);
          await loadUserProfile(authUser.id, authUser.fullName);
          return { success: true, requiresQuiz: true };
        } else if (data.user && !data.session) {
          return { success: true, confirmationSent: true };
        }
      } else {
        // Resilient development mode
        const mockUsersStr = await SafeStorage.getItem(STORAGE_KEYS.MOCK_USERS);
        const mockUsers = mockUsersStr ? JSON.parse(mockUsersStr) : [];
        
        const existing = mockUsers.find((u: any) => u.email === sanitizedEmail);
        if (existing) {
          return { success: false, error: 'An account with this email address already exists. Please login instead.' };
        }

        const newUserRecord = {
          id: 'usr_' + Date.now(),
          fullName: sanitizedName,
          email: sanitizedEmail,
          password: password,
          createdAt: new Date().toISOString(),
        };

        mockUsers.push(newUserRecord);
        await SafeStorage.setItem(STORAGE_KEYS.MOCK_USERS, JSON.stringify(mockUsers));

        const authUser: AuthUser = {
          id: newUserRecord.id,
          email: sanitizedEmail,
          fullName: sanitizedName,
          createdAt: newUserRecord.createdAt,
        };

        const newSession: AuthSession = {
          user: authUser,
          accessToken: 'demo_token_' + Date.now(),
          expiresAt: Date.now() + 7 * 24 * 3600 * 1000,
        };

        await SafeStorage.setItem(STORAGE_KEYS.AUTH_SESSION, JSON.stringify(newSession));
        setUser(authUser);
        setSession(newSession);
        await loadUserProfile(authUser.id, authUser.fullName);

        return { success: true, requiresQuiz: true };
      }

      return { success: false, error: 'Registration could not be completed.' };
    } catch (err: any) {
      return {
        success: false,
        error: 'Unable to connect to service. Please check your network connection.',
      };
    }
  };

  const resetPassword = async (
    email: string
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      const sanitizedEmail = email.trim().toLowerCase();

      if (isConfiguredWithLiveSupabase) {
        const { error } = await supabase.auth.resetPasswordForEmail(sanitizedEmail);
        if (error) {
          return { success: false, error: error.message };
        }
        return { success: true };
      } else {
        await new Promise((resolve) => setTimeout(resolve, 800));
        return { success: true };
      }
    } catch (err: any) {
      return {
        success: false,
        error: 'Unable to connect to service. Please check your network connection.',
      };
    }
  };

  const signOut = async () => {
    try {
      if (isConfiguredWithLiveSupabase) {
        await supabase.auth.signOut();
      } else {
        await SafeStorage.removeItem(STORAGE_KEYS.AUTH_SESSION);
      }
      setUser(null);
      setProfile(null);
      setSession(null);
      setIsOnboardingCompleted(false);
    } catch (err) {
      console.warn('Sign out error:', err);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        session,
        isLoading,
        isIntroSeen,
        isOnboardingCompleted,
        isConfiguredWithLiveSupabase,
        signIn,
        signInWithDemo,
        signUp,
        resetPassword,
        signOut,
        completeIntro,
        resetOnboarding,
        submitQuizProfile,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
