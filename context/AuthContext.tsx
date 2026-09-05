import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  useCallback,
  ReactNode,
} from 'react';
import { supabase, isLiveSupabaseConfigured, SafeStorage } from '../lib/supabase';
import { ProfileService } from '../lib/profile';
import { AuthUser, AuthSession, AuthState } from '../types/auth';
import { UserProfile, QuizFormData } from '../types/quiz';
import { DEMO_ACCOUNT, isDemoModeEnabled } from '../constants/demo';
import { clearCombinedWeek } from '../services/api/combinedPlan';

const STORAGE_KEYS = {
  INTRO_SEEN: '@unifit_intro_seen',
  ONBOARDING_COMPLETED_PREFIX: '@unifit_onboarding_completed_',
  AUTH_SESSION: '@unifit_local_session',
  MOCK_USERS: '@unifit_mock_users',
};

interface AuthContextType extends AuthState {
  isIntroSeen: boolean;
  profileRevision: number;
  signIn: (emailOrUsername: string, password: string) => Promise<{ success: boolean; error?: string; requiresQuiz?: boolean }>;
  signInWithDemo: () => Promise<{ success: boolean; error?: string }>;
  signUp: (fullName: string, email: string, password: string) => Promise<{ success: boolean; error?: string; confirmationSent?: boolean; requiresQuiz?: boolean }>;
  resetPassword: (email: string) => Promise<{ success: boolean; error?: string }>;
  updatePassword: (newPassword: string) => Promise<{ success: boolean; error?: string }>;
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
  const [isRecoveryMode, setIsRecoveryMode] = useState<boolean>(false);
  const [profileRevision, setProfileRevision] = useState(0);
  const [isIntroSeen, setIsIntroSeen] = useState<boolean>(false);
  const [isOnboardingCompleted, setIsOnboardingCompleted] = useState<boolean>(false);
  const [isConfiguredWithLiveSupabase, setIsConfiguredWithLiveSupabase] = useState<boolean>(false);
  // Guards stale asynchronous profile loads from overwriting a newer session
  // (e.g. logout during loading or an account switch while a fetch is in flight).
  const activeUserIdRef = useRef<string | null>(null);
  const profileLoadGenerationRef = useRef(0);

  const toAuthUser = (
    supabaseUser: { id: string; email?: string | null; created_at?: string; user_metadata?: Record<string, any> },
    fallbackName: string
  ): AuthUser => ({
    id: supabaseUser.id,
    email: supabaseUser.email || '',
    fullName:
      supabaseUser.user_metadata?.full_name ||
      supabaseUser.email?.split('@')[0] ||
      fallbackName ||
      'UniFit Athlete',
    createdAt: supabaseUser.created_at || new Date().toISOString(),
  });

  // Supabase exposes expires_at in whole seconds; UniFit stores milliseconds so
  // all consumers (local demo sessions included) share one unit.
  const buildSession = (
    authUser: AuthUser,
    accessToken: string,
    expiresAtSeconds?: number | null
  ): AuthSession => ({
    user: authUser,
    accessToken,
    expiresAt: expiresAtSeconds
      ? expiresAtSeconds * 1000
      : Date.now() + 3600 * 1000,
  });

  const loadUserProfile = async (
    userId: string,
    defaultName: string
  ): Promise<UserProfile | null> => {
    const generation = ++profileLoadGenerationRef.current;
    activeUserIdRef.current = userId;
    try {
      const userProfile = await ProfileService.getProfile(userId);
      // Another sign-in/out happened while this request was in flight: discard.
      if (
        generation !== profileLoadGenerationRef.current ||
        activeUserIdRef.current !== userId
      ) {
        return null;
      }
      if (userProfile) {
        setProfile(userProfile);
        const completed = Boolean(userProfile.onboarding_completed);
        setIsOnboardingCompleted(completed);
        setProfileRevision(userProfile.profile_revision ?? 0);
        return userProfile;
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
        setProfileRevision(0);
        return initialProfile;
      }
    } catch (err) {
      console.warn('Failed to load user profile:', err);
      if (generation === profileLoadGenerationRef.current) {
        setProfile(null);
        setIsOnboardingCompleted(false);
        setProfileRevision(0);
      }
      return null;
    }
  };

  const applySupabaseSession = useCallback(
    (supaSession: { user?: any; access_token?: string; expires_at?: number | null } | null) => {
      if (!supaSession?.user) {
        activeUserIdRef.current = null;
        profileLoadGenerationRef.current += 1;
        setUser(null);
        setProfile(null);
        setSession(null);
        setIsOnboardingCompleted(false);
        return;
      }
      const authUser = toAuthUser(supaSession.user, 'UniFit Athlete');
      activeUserIdRef.current = authUser.id;
      setUser(authUser);
      setSession(
        buildSession(authUser, supaSession.access_token || '', supaSession.expires_at)
      );
      // Deliberately not awaited: Supabase auth callbacks must not host
      // asynchronous Supabase/profile work (documented deadlock risk).
      void loadUserProfile(authUser.id, authUser.fullName);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  const clearAuthState = useCallback(() => {
    activeUserIdRef.current = null;
    profileLoadGenerationRef.current += 1;
    setUser(null);
    setProfile(null);
    setSession(null);
    setIsOnboardingCompleted(false);
    setProfileRevision(0);
  }, []);

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
          // Check Supabase session (persisted securely by supabase-js).
          const { data: { session: supaSession } } = await supabase.auth.getSession();
          applySupabaseSession(supaSession);
        } else {
          // Check persistent local session
          const storedSession = await SafeStorage.getItem(STORAGE_KEYS.AUTH_SESSION);
          if (storedSession) {
            const parsedSession: AuthSession = JSON.parse(storedSession);
            if (parsedSession.expiresAt && parsedSession.expiresAt < Date.now()) {
              await SafeStorage.removeItem(STORAGE_KEYS.AUTH_SESSION);
              return;
            }
            setSession(parsedSession);
            setUser(parsedSession.user);
            activeUserIdRef.current = parsedSession.user.id;
            void loadUserProfile(parsedSession.user.id, parsedSession.user.fullName);
          }
        }
      } catch (err) {
        console.warn('Error during auth initialization:', err);
        clearAuthState();
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();

    // Listen to Supabase auth state changes if live configured
    if (isLiveSupabaseConfigured()) {
      const { data: { subscription } } = supabase.auth.onAuthStateChange(
        (event, supaSession) => {
          // Handle recovery links without blocking the auth callback.
          setIsRecoveryMode(event === 'PASSWORD_RECOVERY' && Boolean(supaSession?.user));
          applySupabaseSession(supaSession);
        }
      );

      return () => {
        subscription.unsubscribe();
      };
    }
  }, [applySupabaseSession, clearAuthState]);

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

    const result = await ProfileService.saveQuizProfile(
      user.id,
      user.fullName,
      quizData,
      profile?.profile_revision
    );
    if (result.success && result.profile) {
      // New quiz answers make the previously generated plan stale. Clear both
      // local and backend caches so the next load regenerates with this profile.
      clearCombinedWeek(user.id);
      setProfile(result.profile);
      const revision = result.profile.profile_revision;
      setProfileRevision(
        revision !== undefined ? revision : (prev: number) => prev + 1
      );
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
          const authUser = toAuthUser(data.user, sanitizedEmail.split('@')[0]);
          activeUserIdRef.current = authUser.id;
          setUser(authUser);
          setSession(
            buildSession(
              authUser,
              data.session?.access_token || '',
              data.session?.expires_at
            )
          );
          const fetchedProfile = await loadUserProfile(
            authUser.id,
            authUser.fullName
          );
          const completed = Boolean(fetchedProfile?.onboarding_completed);

          return { success: true, requiresQuiz: !completed };
        }
      } else {
        // Resilient development mode
        const mockUsersStr = await SafeStorage.getItem(STORAGE_KEYS.MOCK_USERS);
        const mockUsers = mockUsersStr ? JSON.parse(mockUsersStr) : [];
        const existing = mockUsers.find(
          (u: any) => u.email === sanitizedEmail && u.password === password
        );

        const fullName = existing ? existing.fullName : (sanitizedEmail.split('@')[0] || 'UniFit Athlete');
        const authUser: AuthUser = {
          id: existing ? existing.id : 'usr_' + Date.now(),
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
        await loadUserProfile(authUser.id, authUser.fullName);

        const fetchedProfile = await ProfileService.getProfile(authUser.id);
        const completed = Boolean(fetchedProfile?.onboarding_completed);

        return { success: true, requiresQuiz: !completed };
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
        const { data, error } = await supabase.auth.signInWithPassword({
          email: DEMO_ACCOUNT.email,
          password: DEMO_ACCOUNT.password,
        });

        if (error || !data.session || !data.user) {
          return {
            success: false,
            error:
              'Demo account is not ready in Supabase. Ask the team to create demo@unifit.app and enable email confirmation.',
          };
        }

        const authUser = toAuthUser(data.user, DEMO_ACCOUNT.fullName);
        activeUserIdRef.current = authUser.id;
        setUser(authUser);
        setSession(
          buildSession(
            authUser,
            data.session.access_token,
            data.session.expires_at
          )
        );

        const demoProfile = await ProfileService.saveDemoProfile(
          authUser.id,
          DEMO_ACCOUNT.fullName
        );
        setProfile(demoProfile);
        setIsOnboardingCompleted(true);
        return { success: true };
      }

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

      const demoProfile = await ProfileService.saveDemoProfile(demoUser.id, demoUser.fullName);
      setProfile(demoProfile);
      setIsOnboardingCompleted(true);
      return { success: true };
    } catch (err) {
      console.warn('Demo login error:', err);
      return {
        success: false,
        error: 'Unable to connect to the demo account. Please check your connection.',
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
          const authUser = toAuthUser(data.user!, sanitizedName);
          activeUserIdRef.current = authUser.id;
          setUser(authUser);
          setSession(
            buildSession(
              authUser,
              data.session.access_token,
              data.session.expires_at
            )
          );
          void loadUserProfile(authUser.id, authUser.fullName);
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

  const updatePassword = async (
    newPassword: string
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      if (!isConfiguredWithLiveSupabase) {
        return {
          success: false,
          error: 'Password recovery requires a real Supabase account.',
        };
      }
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) {
        if (
          error.message.toLowerCase().includes('expired') ||
          error.message.toLowerCase().includes('invalid') ||
          error.message.toLowerCase().includes('no user found')
        ) {
          setIsRecoveryMode(false);
          return {
            success: false,
            error: 'This recovery link is invalid or has expired. Please request a new one.',
          };
        }
        return { success: false, error: error.message };
      }
      setIsRecoveryMode(false);
      return { success: true };
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
      clearAuthState();
    } catch (err) {
      console.warn('Sign out error:', err);
      clearAuthState();
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        profileRevision,
        session,
        isLoading,
        isIntroSeen,
        isOnboardingCompleted,
        isConfiguredWithLiveSupabase,
        isRecoveryMode,
        signIn,
        signInWithDemo,
        signUp,
        resetPassword,
        updatePassword,
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
