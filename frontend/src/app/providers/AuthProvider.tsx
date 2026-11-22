import { useCallback, useEffect, useMemo, useState } from 'react';
import { api, clearTokens, readTokens, type UserProfile } from '../../shared/api/client';
import { AuthContext } from './auth-context';

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(() => Boolean(readTokens()));

  useEffect(() => {
    let mounted = true;
    const tokens = readTokens();

    const expireSession = () => {
      clearTokens();
      if (mounted) {
        setUser(null);
        setLoading(false);
      }
    };
    window.addEventListener('auth-expired', expireSession);

    if (!tokens) {
      return () => {
        mounted = false;
        window.removeEventListener('auth-expired', expireSession);
      };
    }

    api.me()
      .then((profile) => { if (mounted) setUser(profile); })
      .catch(() => { clearTokens(); if (mounted) setUser(null); })
      .finally(() => { if (mounted) setLoading(false); });

    return () => {
      mounted = false;
      window.removeEventListener('auth-expired', expireSession);
    };
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    await api.login(email, password);
    try {
      setUser(await api.me());
    } catch (error) {
      clearTokens();
      throw error;
    }
  }, []);

  const register = useCallback((fullName: string, email: string, password: string) =>
    api.register(fullName, email, password), []);

  const logout = useCallback(async () => {
    try {
      await api.logout();
    } catch {
      // Clear the local session even if the API is temporarily unavailable.
    } finally {
      clearTokens();
      setUser(null);
    }
  }, []);

  const value = useMemo(() => ({ user, loading, login, register, logout }), [user, loading, login, register, logout]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
