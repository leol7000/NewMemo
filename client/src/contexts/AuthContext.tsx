import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import { authApi } from '../services/api';

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
  const { 
    user: auth0User, 
    isAuthenticated, 
    isLoading, 
    loginWithRedirect, 
    logout: auth0Logout,
    getAccessTokenSilently 
  } = useAuth0();
  
  const [user, setUser] = useState<User | null>(null);

  // 当 Auth0 用户信息变化时，更新本地用户状态
  useEffect(() => {
    if (auth0User && isAuthenticated) {
      setUser({
        id: auth0User.sub || '',
        email: auth0User.email || '',
        name: auth0User.name || '',
        picture: auth0User.picture
      });
      
      // 获取并存储访问令牌
      getAccessTokenSilently().then(token => {
        if (token) {
          authApi.setAuthToken(token);
          // 通知 MemoContext token 已准备好
          window.dispatchEvent(new CustomEvent('authTokenReady'));
        }
      }).catch(error => {
        console.error('Failed to get access token:', error);
      });
    } else {
      setUser(null);
      authApi.clearAuthToken();
    }
  }, [auth0User, isAuthenticated, getAccessTokenSilently]);

  const login = () => {
    loginWithRedirect({
      authorizationParams: {
        redirect_uri: window.location.origin + '/'
      }
    });
  };

  const logout = () => {
    authApi.clearAuthToken();
    auth0Logout({
      logoutParams: {
        returnTo: window.location.origin + '/'
      }
    });
  };

  const getAccessToken = async () => {
    try {
      const token = await getAccessTokenSilently();
      if (token) {
        authApi.setAuthToken(token);
      }
      return token;
    } catch (error) {
      console.error('Failed to get access token:', error);
      return undefined;
    }
  };

  const value: AuthContextType = {
    user,
    isAuthenticated,
    isLoading,
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
