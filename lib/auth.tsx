'use client';

import * as React from 'react';
import { apiRequest } from '@/lib/api';

export interface AuthUser { id: string; name: string; email: string; createdAt?: string; updatedAt?: string }
interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<AuthUser>;
  register: (name: string, email: string, password: string) => Promise<AuthUser>;
  logout: () => Promise<void>;
}
const AuthContext = React.createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = React.useState<AuthUser | null>(null);
  const [loading, setLoading] = React.useState(true);
  React.useEffect(() => {
    apiRequest<AuthUser>('/auth/me').then(setUser).catch(() => setUser(null)).finally(() => setLoading(false));
  }, []);
  const login = React.useCallback(async (email: string, password: string) => {
    const next = await apiRequest<AuthUser>('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) });
    setUser(next); return next;
  }, []);
  const register = React.useCallback(async (name: string, email: string, password: string) => {
    const next = await apiRequest<AuthUser>('/auth/register', { method: 'POST', body: JSON.stringify({ name, email, password }) });
    setUser(next); return next;
  }, []);
  const logout = React.useCallback(async () => {
    await apiRequest<void>('/auth/logout', { method: 'POST' });
    setUser(null);
  }, []);
  return <AuthContext.Provider value={{ user, loading, login, register, logout }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = React.useContext(AuthContext);
  if (!value) throw new Error('useAuth must be used within AuthProvider');
  return value;
}
