"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { toast } from 'sonner';

interface User {
  id: number;
  name: string;
  email: string;
  token: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  register: (name: string, email: string, password: string) => Promise<boolean>;
  logout: () => void;
  // Email verification methods
  requestVerificationOTP: (email: string, name: string) => Promise<boolean>;
  verifySignupOTP: (email: string, otp: string, name: string, password?: string) => Promise<boolean>;
  // Auth state for email verification flow
  emailForVerification: string | null;
  setEmailForVerification: (email: string | null) => void;
  nameForVerification: string | null;
  setNameForVerification: (name: string | null) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [emailForVerification, setEmailForVerification] = useState<string | null>(null);
  const [nameForVerification, setNameForVerification] = useState<string | null>(null);

  useEffect(() => {
    // Check if user is already logged in
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      const response = await fetch('https://snipstash-9tms.onrender.com/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Login failed');
      }

      // Save to localStorage & state
      localStorage.setItem('user', JSON.stringify(data));
      setUser(data);
      setIsLoading(false);
      toast.success('Successfully logged in!');
      return true;
    } catch (error) {
      setIsLoading(false);
      const errorMessage = error instanceof Error ? error.message : 'Login failed';
      toast.error(`Login failed: ${errorMessage}`);
      console.error('Login error:', error);
      return false;
    }
  };

  const register = async (name: string, email: string, password: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      const response = await fetch('https://snipstash-9tms.onrender.com/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name, email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Registration failed');
      }

      // Save to localStorage & state
      localStorage.setItem('user', JSON.stringify(data));
      setUser(data);
      setIsLoading(false);
      toast.success('Account created successfully!');
      return true;
    } catch (error) {
      setIsLoading(false);
      const errorMessage = error instanceof Error ? error.message : 'Registration failed';
      toast.error(`Registration failed: ${errorMessage}`);
      console.error('Registration error:', error);
      return false;
    }
  };

  // Email verification methods
  const requestVerificationOTP = async (email: string, name: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      
      // Check if this is login (empty name) or signup (name provided)
      const isLogin = !name;
      const endpoint = isLogin 
        ? 'https://snipstash-9tms.onrender.com/api/auth/email/request-login'
        : 'https://snipstash-9tms.onrender.com/api/auth/email/request-verification';
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(isLogin ? { email } : { email, name }),
      });

      const data = await response.json();

      if (!response.ok) {
        // Special case for existing user
        if (data.userExists) {
          toast.error('An account with this email already exists. Please log in instead.');
          setIsLoading(false);
          return false;
        }
        throw new Error(data.message || 'Failed to send verification code');
      }

      setEmailForVerification(email);
      if (!isLogin) {
        setNameForVerification(name);
      }
      
      setIsLoading(false);
      toast.success('Verification code sent to your email');
      return true;
    } catch (error) {
      setIsLoading(false);
      const errorMessage = error instanceof Error ? error.message : 'Failed to send verification code';
      toast.error(`Error: ${errorMessage}`);
      console.error('Request verification error:', error);
      return false;
    }
  };

  const verifySignupOTP = async (email: string, otp: string, name: string, password?: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      
      // Check if this is login (empty name) or signup (name provided)
      const isLogin = !name;
      const endpoint = isLogin 
        ? 'https://snipstash-9tms.onrender.com/api/auth/email/verify-login'
        : 'https://snipstash-9tms.onrender.com/api/auth/email/verify-signup';
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(isLogin ? { email, otp } : { email, otp, name, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Invalid verification code');
      }

      // Save to localStorage & state
      localStorage.setItem('user', JSON.stringify(data));
      setUser(data);
      setEmailForVerification(null);
      setNameForVerification(null);
      setIsLoading(false);
      toast.success(isLogin ? 'Successfully logged in!' : 'Account created successfully!');
      return true;
    } catch (error) {
      setIsLoading(false);
      const errorMessage = error instanceof Error ? error.message : 'Verification failed';
      toast.error(`Error: ${errorMessage}`);
      console.error('Verify signup error:', error);
      return false;
    }
  };

  const logout = () => {
    localStorage.removeItem('user');
    setUser(null);
    setEmailForVerification(null);
    setNameForVerification(null);
    toast.success('Logged out successfully');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        register,
        logout,
        // Email verification methods
        requestVerificationOTP,
        verifySignupOTP,
        // Email verification state
        emailForVerification,
        setEmailForVerification,
        nameForVerification,
        setNameForVerification
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}; 