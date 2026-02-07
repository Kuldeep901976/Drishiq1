"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';

interface AuthContextType {
  user: any;
  session: any;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Mock implementation
    setLoading(false);
  }, []);

  const signIn = async (email: string, password: string) => {
    // Mock implementation
  };

  const signOut = async () => {
    setUser(null);
  };

  const signUp = async (email: string, password: string) => {
    // Mock implementation
  };

  return (
    <AuthContext.Provider value={{ user, session: null, loading, signIn, signOut, signUp }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
