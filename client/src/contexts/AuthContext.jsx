/**
 * DVA - Contexte d'authentification
 * Gère l'état de l'utilisateur connecté et le refresh silencieux
 */
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authApi } from '../api/authApi';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Vérifier la session au chargement de l'application
  useEffect(() => {
    authApi.getMe()
      .then((res) => setUser(res.data.user))
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  // Écouter l'événement d'expiration de session (depuis axiosClient)
  useEffect(() => {
    const handleExpired = () => {
      setUser(null);
      window.location.href = '/connexion';
    };
    window.addEventListener('dva:auth:expired', handleExpired);
    return () => window.removeEventListener('dva:auth:expired', handleExpired);
  }, []);

  const login = useCallback(async (email, password) => {
    const res = await authApi.login({ email, password });
    setUser(res.data.user);
    return res.data.user;
  }, []);

  const register = useCallback(async (data) => {
    const res = await authApi.register(data);
    setUser(res.data.user);
    return res.data.user;
  }, []);

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } catch {
      // Continuer même si l'appel échoue
    }
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth doit être utilisé dans AuthProvider');
  return ctx;
}
