'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface User {
  id: string;
  email: string;
  username: string;
  displayName: string;
  profilePicture?: string;
  isVerified: boolean;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  register: (userData: any) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for existing user data in localStorage
    const userData = localStorage.getItem('user');
    if (userData) {
      try {
        setUser(JSON.parse(userData));
      } catch (error) {
        console.error('Error parsing user data:', error);
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    try {
      console.log('🔐 Auth context: Starting login...', { email });
      console.log('🌐 Auth context: Making API call to backend login endpoint');
      
      const response = await fetch('https://halo-backend-wye4.onrender.com/api/auth/login', {
        method: 'POST',
        mode: 'cors',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({ email, password }),
      });

      console.log('📡 Auth context: Login response status:', response.status);
      console.log('📡 Auth context: Login response headers:', Object.fromEntries(response.headers.entries()));

      if (response.ok) {
        const data = await response.json();
        console.log('✅ Auth context: Login successful, setting user data');
        setUser(data.data.user);
        localStorage.setItem('user', JSON.stringify(data.data.user));
        localStorage.setItem('accessToken', data.data.accessToken);
        localStorage.setItem('refreshToken', data.data.refreshToken);
      } else {
        const errorData = await response.json();
        console.error('❌ Auth context: Login failed with status:', response.status);
        console.error('❌ Auth context: Login error data:', errorData);
        throw new Error(errorData.message || 'Login failed');
      }
    } catch (error) {
      console.error('❌ Auth context: Login error:', error);
      throw error;
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
  };

  const register = async (userData: any) => {
    console.log('🔐 Auth context: Starting registration...', userData);
    try {
      console.log('🌐 Auth context: Making API call to backend register endpoint');
      const response = await fetch('https://halo-backend-wye4.onrender.com/api/auth/register', {
        method: 'POST',
        mode: 'cors',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(userData),
      });

      console.log('📡 Auth context: API response status:', response.status);
      console.log('📡 Auth context: API response headers:', Object.fromEntries(response.headers.entries()));
      const data = await response.json();
      console.log('📄 Auth context: API response data:', data);

      if (response.ok) {
        console.log('✅ Auth context: Registration successful, setting user data');
        setUser(data.data.user);
        localStorage.setItem('user', JSON.stringify(data.data.user));
        localStorage.setItem('accessToken', data.data.accessToken);
        localStorage.setItem('refreshToken', data.data.refreshToken);
        console.log('💾 Auth context: User data stored in localStorage');
      } else {
        console.error('❌ Auth context: Registration failed with status:', response.status);
        throw new Error(data.message || 'Registration failed');
      }
    } catch (error) {
      console.error('❌ Auth context: Registration error:', error);
      throw error;
    }
  };

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    logout,
    register,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};