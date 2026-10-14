import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  User,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInAnonymously,
  updateProfile as updateAuthProfile,
  sendPasswordResetEmail,
} from 'firebase/auth';
import { auth, testFirestoreConnection } from '../lib/firebase';
import { UserProfile, UserRole } from '../types';
import { getUserProfile, saveUserProfile } from '../services/userService';

export interface ExtraUserData {
  company?: string;
  phone?: string;
  headline?: string;
  skills?: string[];
  bio?: string;
  passcode?: string;
}

interface AuthContextType {
  currentUser: User | null;
  userProfile: UserProfile | null;
  role: UserRole;
  loading: boolean;
  signInWithGoogle: (desiredRole?: UserRole, extra?: ExtraUserData) => Promise<boolean>;
  signInWithEmail: (email: string, pass: string, expectedRole?: UserRole) => Promise<{ success: boolean; error?: string }>;
  signUpWithEmail: (
    email: string,
    pass: string,
    displayName: string,
    role: UserRole,
    extra?: ExtraUserData
  ) => Promise<{ success: boolean; error?: string }>;
  signInAsDemo: (role: UserRole, extra?: ExtraUserData) => Promise<boolean>;
  sendPasswordReset: (email: string) => Promise<{ success: boolean; error?: string }>;
  signOutUser: () => Promise<void>;
  setRole: (role: UserRole) => Promise<void>;
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const ADMIN_EMAIL = 'mimshoromita@gmail.com';
const LOCAL_SESSION_KEY = 'jobtracker_custom_user_session';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Active role is strictly derived from userProfile, falling back to admin email or candidate
  const role: UserRole = userProfile?.role || (currentUser?.email === ADMIN_EMAIL ? 'admin' : 'candidate');

  const fetchProfile = async (user: User, preferredRole?: UserRole, extra?: ExtraUserData) => {
    try {
      let profile = await getUserProfile(user.uid);
      if (!profile) {
        // Initial user registration profile creation
        const initialRole: UserRole = preferredRole || (user.email === ADMIN_EMAIL ? 'admin' : 'candidate');
        profile = {
          userId: user.uid,
          email: user.email || `${user.uid.slice(0, 8)}@jobtracker.bd`,
          displayName: user.displayName || (initialRole === 'recruiter' ? 'Recruiter' : 'JobTracker User'),
          photoURL: user.photoURL || undefined,
          role: initialRole,
          company: extra?.company || (initialRole === 'recruiter' ? 'Brain Station 23' : undefined),
          headline:
            extra?.headline ||
            (initialRole === 'admin'
              ? 'Platform Administrator | JobTracker BD'
              : initialRole === 'recruiter'
              ? `Talent Acquisition Lead | ${extra?.company || 'Leading Bangladesh Enterprise'}`
              : 'Software Engineer | Dhaka, Bangladesh'),
          bio:
            extra?.bio ||
            (initialRole === 'recruiter'
              ? `Recruiting top software engineering talent for ${extra?.company || 'our organization'} across Bangladesh.`
              : 'Passionate software engineer exploring career opportunities in Bangladesh.'),
          skills: extra?.skills || ['JavaScript', 'TypeScript', 'React', 'Problem Solving', 'Node.js'],
          location: 'Dhaka, Bangladesh',
          phone: extra?.phone || '+880 1712-000000',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        await saveUserProfile(profile);
      } else if (preferredRole && profile.role !== preferredRole) {
        // Update role if explicitly selected during login/sign-up
        profile = {
          ...profile,
          role: preferredRole,
          company: extra?.company || profile.company,
          updatedAt: new Date().toISOString(),
        };
        await saveUserProfile(profile);
      }
      setUserProfile(profile);

      // If user is admin, set unlock state for dashboard convenience
      if (profile.role === 'admin') {
        sessionStorage.setItem('jobtracker_admin_session_unlocked', 'true');
      }
    } catch (err) {
      console.error('Failed to load user profile:', err);
    }
  };

  useEffect(() => {
    testFirestoreConnection();

    // Check for existing custom synthetic session if Firebase Auth was offline/anonymous
    const rawSavedSession = localStorage.getItem(LOCAL_SESSION_KEY);
    let initialMockUser: any = null;
    if (rawSavedSession) {
      try {
        initialMockUser = JSON.parse(rawSavedSession);
      } catch (e) {
        localStorage.removeItem(LOCAL_SESSION_KEY);
      }
    }

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setCurrentUser(user);
        await fetchProfile(user);
      } else if (initialMockUser) {
        // Fallback custom session active
        setCurrentUser(initialMockUser);
        await fetchProfile(initialMockUser);
      } else {
        setCurrentUser(null);
        setUserProfile(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Google Sign-In with desired role assignment
  const signInWithGoogle = async (desiredRole?: UserRole, extra?: ExtraUserData): Promise<boolean> => {
    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });
      const result = await signInWithPopup(auth, provider);
      if (result.user) {
        await fetchProfile(result.user, desiredRole, extra);
        localStorage.removeItem(LOCAL_SESSION_KEY);
        return true;
      }
      return false;
    } catch (error: any) {
      const code = error?.code || '';
      const message = error?.message || '';

      if (
        code === 'auth/popup-closed-by-user' ||
        code === 'auth/cancelled-popup-request' ||
        message.includes('popup-closed-by-user') ||
        message.includes('cancelled-popup-request')
      ) {
        console.info('Google sign-in popup was dismissed by the user.');
        return false;
      }

      console.warn('Sign-in notification:', code || message);
      return false;
    }
  };

  // Sign In with Email & Password
  const signInWithEmail = async (
    email: string,
    pass: string,
    expectedRole?: UserRole
  ): Promise<{ success: boolean; error?: string }> => {
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !pass) {
      return { success: false, error: 'Please enter both email and password.' };
    }

    try {
      const userCred = await signInWithEmailAndPassword(auth, cleanEmail, pass);
      if (userCred.user) {
        await fetchProfile(userCred.user, expectedRole);
        localStorage.removeItem(LOCAL_SESSION_KEY);
        return { success: true };
      }
      return { success: false, error: 'Failed to authenticate user.' };
    } catch (error: any) {
      const code = error?.code || '';
      const msg = error?.message || '';

      // If Firebase Auth Email/Password is disabled in Firebase console, fall back smoothly
      if (code === 'auth/operation-not-allowed' || code === 'auth/admin-restricted-operation') {
        try {
          // Attempt anonymous Firebase sign-in so firestore rules allow access
          let authUser: any = auth.currentUser;
          if (!authUser) {
            const anonRes = await signInAnonymously(auth);
            authUser = anonRes.user;
          }
          const syntheticUser = {
            uid: authUser?.uid || `usr_${Date.now()}`,
            email: cleanEmail,
            displayName: cleanEmail.split('@')[0],
            photoURL: '',
          };
          setCurrentUser(syntheticUser as User);
          await fetchProfile(syntheticUser as User, expectedRole);
          localStorage.setItem(LOCAL_SESSION_KEY, JSON.stringify(syntheticUser));
          return { success: true };
        } catch (anonErr) {
          console.warn('Anonymous fallback auth failed:', anonErr);
        }
      }

      if (code === 'auth/user-not-found' || code === 'auth/invalid-credential' || code === 'auth/wrong-password') {
        return { success: false, error: 'Invalid credentials. Please check your email and password or sign up.' };
      }
      if (code === 'auth/invalid-email') {
        return { success: false, error: 'Please enter a valid email address.' };
      }
      if (code === 'auth/user-disabled') {
        return { success: false, error: 'This account has been disabled. Please contact support.' };
      }

      return { success: false, error: msg || 'Authentication error. Please try again.' };
    }
  };

  // Sign Up with Email & Password
  const signUpWithEmail = async (
    email: string,
    pass: string,
    displayName: string,
    newRole: UserRole,
    extra?: ExtraUserData
  ): Promise<{ success: boolean; error?: string }> => {
    const cleanEmail = email.trim().toLowerCase();
    const cleanName = displayName.trim();

    if (!cleanEmail || !pass || !cleanName) {
      return { success: false, error: 'Please complete all required fields.' };
    }
    if (pass.length < 6) {
      return { success: false, error: 'Password must be at least 6 characters long.' };
    }

    try {
      const userCred = await createUserWithEmailAndPassword(auth, cleanEmail, pass);
      if (userCred.user) {
        try {
          await updateAuthProfile(userCred.user, { displayName: cleanName });
        } catch (e) {
          // Non-fatal
        }
        await fetchProfile(userCred.user, newRole, extra);
        localStorage.removeItem(LOCAL_SESSION_KEY);
        return { success: true };
      }
      return { success: false, error: 'Failed to create user account.' };
    } catch (error: any) {
      const code = error?.code || '';
      const msg = error?.message || '';

      // Graceful fallback if email/pass provider is not enabled in Firebase console
      if (code === 'auth/operation-not-allowed' || code === 'auth/admin-restricted-operation') {
        try {
          let authUser: any = auth.currentUser;
          if (!authUser) {
            const anonRes = await signInAnonymously(auth);
            authUser = anonRes.user;
          }
          const syntheticUser = {
            uid: authUser?.uid || `usr_${Date.now()}`,
            email: cleanEmail,
            displayName: cleanName,
            photoURL: '',
          };
          setCurrentUser(syntheticUser as User);
          await fetchProfile(syntheticUser as User, newRole, extra);
          localStorage.setItem(LOCAL_SESSION_KEY, JSON.stringify(syntheticUser));
          return { success: true };
        } catch (anonErr) {
          console.warn('Anonymous fallback signup failed:', anonErr);
        }
      }

      if (code === 'auth/email-already-in-use') {
        return { success: false, error: 'An account with this email already exists. Please sign in instead.' };
      }
      if (code === 'auth/invalid-email') {
        return { success: false, error: 'Please enter a valid email address.' };
      }
      if (code === 'auth/weak-password') {
        return { success: false, error: 'Password is too weak. Please use at least 6 characters.' };
      }

      return { success: false, error: msg || 'Failed to create account. Please try again.' };
    }
  };

  // Instant 1-Click Demo Login for any of the 3 Modes
  const signInAsDemo = async (demoRole: UserRole, extra?: ExtraUserData): Promise<boolean> => {
    try {
      let authUser: any = auth.currentUser;
      if (!authUser) {
        try {
          const anonRes = await signInAnonymously(auth);
          authUser = anonRes.user;
        } catch (anonErr) {
          console.info('Using local demo identity for testing.');
        }
      }

      const demoUid = authUser?.uid || `demo_${demoRole}_${Date.now()}`;
      let demoEmail = 'candidate.demo@jobtracker.bd';
      let demoName = 'Tanvir Ahmed (Demo Candidate)';
      let defaultCompany = undefined;

      if (demoRole === 'recruiter') {
        demoEmail = 'recruiter@brainstation-23.com';
        demoName = 'Farhana Yeasmin (HR Lead)';
        defaultCompany = extra?.company || 'Brain Station 23';
      } else if (demoRole === 'admin') {
        demoEmail = ADMIN_EMAIL;
        demoName = 'System Administrator (Mim)';
      }

      const syntheticUser = {
        uid: demoUid,
        email: demoEmail,
        displayName: demoName,
        photoURL: '',
      };

      setCurrentUser(syntheticUser as User);
      await fetchProfile(syntheticUser as User, demoRole, {
        company: defaultCompany,
        ...extra,
      });

      if (demoRole === 'admin') {
        sessionStorage.setItem('jobtracker_admin_session_unlocked', 'true');
      }

      localStorage.setItem(LOCAL_SESSION_KEY, JSON.stringify(syntheticUser));
      return true;
    } catch (err) {
      console.error('Demo login error:', err);
      return false;
    }
  };

  // Password reset email
  const sendPasswordReset = async (email: string): Promise<{ success: boolean; error?: string }> => {
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail) {
      return { success: false, error: 'Please enter your registered email address.' };
    }
    try {
      await sendPasswordResetEmail(auth, cleanEmail);
      return { success: true };
    } catch (error: any) {
      const code = error?.code || '';
      if (code === 'auth/user-not-found') {
        return { success: false, error: 'No account registered with this email address.' };
      }
      if (code === 'auth/invalid-email') {
        return { success: false, error: 'Invalid email format.' };
      }
      return { success: false, error: error?.message || 'Could not send reset email.' };
    }
  };

  const signOutUser = async () => {
    try {
      localStorage.removeItem(LOCAL_SESSION_KEY);
      sessionStorage.removeItem('jobtracker_admin_session_unlocked');
      await signOut(auth);
      setCurrentUser(null);
      setUserProfile(null);
    } catch (error) {
      console.error('Error signing out:', error);
      throw error;
    }
  };

  const setRole = async (newRole: UserRole) => {
    if (!currentUser || !userProfile) return;
    const updated: UserProfile = {
      ...userProfile,
      role: newRole,
      updatedAt: new Date().toISOString(),
    };
    setUserProfile(updated);
    await saveUserProfile(updated);
  };

  const updateProfile = async (updates: Partial<UserProfile>) => {
    if (!currentUser || !userProfile) return;
    const updated: UserProfile = {
      ...userProfile,
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    setUserProfile(updated);
    await saveUserProfile(updated);
  };

  const refreshProfile = async () => {
    if (currentUser) {
      await fetchProfile(currentUser);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        userProfile,
        role,
        loading,
        signInWithGoogle,
        signInWithEmail,
        signUpWithEmail,
        signInAsDemo,
        sendPasswordReset,
        signOutUser,
        setRole,
        updateProfile,
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
