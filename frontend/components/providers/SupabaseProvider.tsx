'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode
} from 'react';

interface Session {
  accessToken: string;
  refreshToken?: string;
  email: string;
}

interface SupabaseContextValue {
  session: Session | null;
  loading: boolean;
  signIn(email: string, password: string): Promise<void>;
  signUp(email: string, password: string): Promise<void>;
  signOut(): Promise<void>;
}

const STORAGE_KEY = 'spray-record-session';

function readStoredSession(): Session | null {
  if (typeof window === 'undefined') {
    return null;
  }
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Session) : null;
  } catch (error) {
    console.warn('Failed to read stored session', error);
    return null;
  }
}

function writeStoredSession(session: Session | null) {
  if (typeof window === 'undefined') {
    return;
  }
  if (session) {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
  } else {
    window.localStorage.removeItem(STORAGE_KEY);
  }
}

const SupabaseContext = createContext<SupabaseContextValue | undefined>(undefined);

interface SupabaseProviderProps {
  children: ReactNode;
}

async function authenticateWithSupabase(
  endpoint: 'token' | 'signup' | 'logout',
  payload: Record<string, unknown>,
  { supabaseUrl, supabaseKey, accessToken }: { supabaseUrl?: string; supabaseKey?: string; accessToken?: string }
) {
  if (!supabaseUrl || !supabaseKey) {
    return null;
  }

  const url =
    endpoint === 'token'
      ? `${supabaseUrl}/auth/v1/token?grant_type=password`
      : endpoint === 'signup'
        ? `${supabaseUrl}/auth/v1/signup`
        : `${supabaseUrl}/auth/v1/logout`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      apikey: supabaseKey,
      'Content-Type': 'application/json',
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {})
    },
    body: endpoint === 'logout' ? undefined : JSON.stringify(payload)
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || 'Supabase authentication failed');
  }

  if (endpoint === 'logout') {
    return null;
  }

  return response.json() as Promise<{
    access_token: string;
    refresh_token?: string;
    expires_in?: number;
  }>;
}

export function SupabaseProvider({ children }: SupabaseProviderProps) {
  const [session, setSession] = useState<Session | null>(() => readStoredSession());
  const [loading, setLoading] = useState(false);

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  useEffect(() => {
    writeStoredSession(session);
  }, [session]);

  const signIn = useCallback(
    async (email: string, password: string) => {
      setLoading(true);
      try {
        let accessToken = crypto.randomUUID();
        let refreshToken: string | undefined;

        try {
          const response = await authenticateWithSupabase('token', { email, password }, { supabaseUrl, supabaseKey });
          if (response) {
            accessToken = response.access_token;
            refreshToken = response.refresh_token;
          }
        } catch (error) {
          console.warn('Supabase password authentication failed, falling back to offline session.', error);
        }

        setSession({ accessToken, refreshToken, email });
      } finally {
        setLoading(false);
      }
    },
    [supabaseKey, supabaseUrl]
  );

  const signUp = useCallback(
    async (email: string, password: string) => {
      setLoading(true);
      try {
        try {
          await authenticateWithSupabase('signup', { email, password }, { supabaseUrl, supabaseKey });
        } catch (error) {
          console.warn('Supabase sign up failed; account may need manual provisioning.', error);
          throw error;
        }
      } finally {
        setLoading(false);
      }
    },
    [supabaseKey, supabaseUrl]
  );

  const signOut = useCallback(async () => {
    setLoading(true);
    try {
      if (session?.accessToken) {
        try {
          await authenticateWithSupabase('logout', {}, {
            supabaseUrl,
            supabaseKey,
            accessToken: session.accessToken
          });
        } catch (error) {
          console.warn('Supabase logout failed; clearing local session anyway.', error);
        }
      }
      setSession(null);
    } finally {
      setLoading(false);
    }
  }, [session?.accessToken, supabaseKey, supabaseUrl]);

  const value = useMemo(
    () => ({
      session,
      loading,
      signIn,
      signUp,
      signOut
    }),
    [loading, session, signIn, signUp, signOut]
  );

  return <SupabaseContext.Provider value={value}>{children}</SupabaseContext.Provider>;
}

export function useSupabase() {
  const context = useContext(SupabaseContext);
  if (!context) {
    throw new Error('useSupabase must be used within a SupabaseProvider');
  }
  return context;
}
