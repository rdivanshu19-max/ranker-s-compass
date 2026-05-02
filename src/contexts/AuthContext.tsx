import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import type { User, Session } from '@supabase/supabase-js';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  profile: { display_name: string; bio: string } | null;
  isAdmin: boolean;
  isModerator: boolean;
  signUp: (email: string, password: string, displayName: string) => Promise<any>;
  signIn: (email: string, password: string) => Promise<any>;
  requestPasswordReset: (email: string) => Promise<any>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const useAuth = () => useContext(AuthContext);

const PRODUCTION_SITE_URL = 'https://rankers-stars.vercel.app';

const normalizeUrl = (url: string) => url.replace(/\/+$/, '');

const resolveAuthRedirectBase = () => {
  const configuredUrl = import.meta.env.VITE_APP_SITE_URL?.trim();
  if (configuredUrl) return normalizeUrl(configuredUrl);

  if (typeof window !== 'undefined') {
    if (window.location.hostname.endsWith('lovable.app')) return PRODUCTION_SITE_URL;
    return window.location.origin;
  }

  return PRODUCTION_SITE_URL;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<{ display_name: string; bio: string } | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isModerator, setIsModerator] = useState(false);

  const fetchProfile = async (userId: string) => {
    const { data } = await supabase.from('profiles').select('display_name, bio').eq('user_id', userId).single();
    if (data) setProfile(data);
    const { data: roles } = await supabase.from('user_roles').select('role').eq('user_id', userId);
    setIsAdmin(roles?.some(r => r.role === 'admin') || false);
    setIsModerator(roles?.some(r => r.role === 'moderator') || false);
  };

  const refreshProfile = async () => {
    if (user) await fetchProfile(user.id);
  };

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, currentSession) => {
      setSession(currentSession);
      setUser(currentSession?.user ?? null);
      if (currentSession?.user) {
        setTimeout(() => fetchProfile(currentSession.user.id), 0);
      } else {
        setProfile(null);
        setIsAdmin(false);
        setIsModerator(false);
      }
      setLoading(false);
    });

    supabase.auth.getSession().then(({ data: { session: initialSession } }) => {
      setSession(initialSession);
      setUser(initialSession?.user ?? null);
      if (initialSession?.user) fetchProfile(initialSession.user.id);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string, displayName: string) => {
    const redirectBase = resolveAuthRedirectBase();
    return supabase.auth.signUp({
      email,
      password,
      options: {
        data: { display_name: displayName },
        emailRedirectTo: `${redirectBase}/auth`,
      },
    });
  };

  const signIn = async (email: string, password: string) => {
    return supabase.auth.signInWithPassword({ email, password });
  };

  const requestPasswordReset = async (email: string) => {
    const redirectBase = resolveAuthRedirectBase();
    return supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${redirectBase}/reset-password`,
    });
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setProfile(null);
    setIsAdmin(false);
    setIsModerator(false);
  };

  return (
    <AuthContext.Provider
      value={{ user, session, loading, profile, isAdmin, isModerator, signUp, signIn, requestPasswordReset, signOut, refreshProfile }}
    >
      {children}
    </AuthContext.Provider>
  );
};
