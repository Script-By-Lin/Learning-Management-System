'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authService } from '../services/authService';

export interface UserProfile {
  id: string;
  email: string;
  fullName: string;
  role: 'STUDENT' | 'INSTRUCTOR' | 'ADMIN';
  isApproved: boolean;
  avatarUrl?: string | null;
  bio?: string | null;
  createdAt: string;
}

export interface WebSettings {
  id: string;
  lmsName: string;
  bannerTitle: string;
  bannerSubtitle: string;
  bannerUrl: string | null;
  footerInfo: string;
  contactEmail: string;
  updatedAt: string;
}

interface AuthContextType {
  user: UserProfile | null;
  loading: boolean;
  error: string | null;
  login: (data: any) => Promise<boolean>;
  register: (data: any) => Promise<boolean>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  settings: WebSettings | null;
  refreshSettings: () => Promise<void>;
  updateSettings: (data: any) => Promise<boolean>;
  uploadBanner: (file: File) => Promise<string | null>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [settings, setSettings] = useState<WebSettings | null>(null);

  // Fetch active settings on load
  const refreshSettings = async () => {
    try {
      const res = await authService.getSettings();
      if (res.success && res.data) {
        setSettings(res.data);
      }
    } catch (err) {
      console.error('Failed to load web settings in provider', err);
    }
  };

  const updateSettings = async (data: any): Promise<boolean> => {
    try {
      const res = await authService.updateSettings(data);
      if (res.success && res.data) {
        setSettings(res.data);
        return true;
      }
      return false;
    } catch (err) {
      console.error('Failed to update web settings in provider', err);
      return false;
    }
  };

  const uploadBanner = async (file: File): Promise<string | null> => {
    try {
      const res = await authService.uploadBanner(file);
      if (res.success && res.data?.bannerUrl) {
        return res.data.bannerUrl;
      }
      return null;
    } catch (err) {
      console.error('Failed to upload banner in provider', err);
      return null;
    }
  };

  // Fetch active user session on initial load
  const refreshProfile = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await authService.getProfile();
      if (res.success && res.data?.user) {
        setUser(res.data.user);
      } else {
        setUser(null);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to authenticate user.');
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshProfile();
    refreshSettings();

    // Register PWA Service Worker
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js').then(
          (registration) => {
            console.log('PWA ServiceWorker registered with scope:', registration.scope);
          },
          (err) => {
            console.error('PWA ServiceWorker registration failed:', err);
          }
        );
      });
    }
  }, []);

  const login = async (data: any): Promise<boolean> => {
    try {
      setError(null);
      setLoading(true);
      const res = await authService.login(data);
      if (res.success && res.data?.user) {
        setUser(res.data.user);
        return true;
      } else {
        setError(res.error || 'Login failed.');
        return false;
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred during login.');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const register = async (data: any): Promise<boolean> => {
    try {
      setError(null);
      setLoading(true);
      const res = await authService.register(data);
      if (res.success && res.data?.user) {
        setUser(res.data.user);
        return true;
      } else {
        setError(res.error || 'Registration failed.');
        return false;
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred during registration.');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      setLoading(true);
      await authService.logout();
      setUser(null);
    } catch (err: any) {
      setError(err.message || 'Logout failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        error,
        login,
        register,
        logout,
        refreshProfile,
        settings,
        refreshSettings,
        updateSettings,
        uploadBanner,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuthContext() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }
  return context;
}
