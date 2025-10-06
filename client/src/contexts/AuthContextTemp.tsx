import React, { createContext, useContext, useState } from 'react';

interface User {
  id: string;
  email: string;
  name: string;
  picture?: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: () => void;
  logout: () => void;
  getAccessToken: () => Promise<string | undefined>;
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
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  // 临时禁用Auth0，直接返回已认证状态
  const [user] = useState<User>({
    id: 'lilingfei7@gmail.com',
    email: 'lilingfei7@gmail.com',
    name: 'Test User',
    picture: undefined
  });

  const login = () => {
    // 临时登录，直接设置用户
    console.log('Temporary login - user already set');
  };

  const logout = () => {
    // 临时登出
    console.log('Temporary logout');
  };

  const getAccessToken = async () => {
    // 返回临时token
    return 'temp-token';
  };

  const value: AuthContextType = {
    user,
    isAuthenticated: true, // 临时设为已认证
    isLoading: false,
    login,
    logout,
    getAccessToken
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
