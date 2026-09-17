import React, { createContext, useContext, useEffect, useState } from 'react';
import { api, isDemoMode } from '../api/client';
import { initializeDemoData } from '../api/demoStorage';
import { User } from '../types';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isDemo: boolean;
  loginWithGoogle: (credentials: string | { id_token?: string; access_token?: string }) => Promise<void>;
  enterDemoMode: () => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const DEMO_USER: User = {
  id: 'demo-local-user',
  email: 'invitado@estuplani.local',
  full_name: 'Cuenta de Prueba (Local)',
  avatar_url: null,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isDemo, setIsDemo] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Si estaba en modo demo, restaurar sesión local
    if (isDemoMode()) {
      initializeDemoData();
      setUser(DEMO_USER);
      setIsDemo(true);
      setLoading(false);
      return;
    }

    const token = localStorage.getItem('estuplani_token');
    if (!token) {
      setLoading(false);
      return;
    }

    api
      .getMe()
      .then((userData) => {
        setUser(userData);
        setIsDemo(false);
      })
      .catch((err) => {
        console.error('Error al restaurar sesión:', err);
        localStorage.removeItem('estuplani_token');
        setUser(null);
        setIsDemo(false);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const loginWithGoogle = async (credentials: string | { id_token?: string; access_token?: string }) => {
    localStorage.removeItem('estuplani_demo_mode');
    const res = await api.googleLogin(credentials);
    localStorage.setItem('estuplani_token', res.token);
    setUser(res.user);
    setIsDemo(false);
  };

  const enterDemoMode = () => {
    initializeDemoData();
    localStorage.removeItem('estuplani_token');
    localStorage.setItem('estuplani_demo_mode', 'true');
    setUser(DEMO_USER);
    setIsDemo(true);
  };

  const logout = () => {
    localStorage.removeItem('estuplani_token');
    localStorage.removeItem('estuplani_demo_mode');
    setUser(null);
    setIsDemo(false);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isDemo,
        loginWithGoogle,
        enterDemoMode,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe usarse dentro de un AuthProvider');
  }
  return context;
};
