import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Auth0Provider } from '@auth0/auth0-react';
import { auth0Config, checkAuth0Config } from './config/auth0';
import { AuthProvider } from './contexts/AuthContext';
import { MemoProvider } from './contexts/MemoContext';
import HomePage from './pages/HomePage';
import MemoListPage from './pages/MemoListPage';
import MemoDetailPage from './pages/MemoDetailPage';
import CollectionsPage from './pages/CollectionsPage';
import CollectionDetailPage from './pages/CollectionDetailPage';
import LoginPage from './pages/LoginPage';
import AuthDebug from './components/AuthDebug';
import AuthTest from './components/AuthTest';

const isAuth0Configured = checkAuth0Config();

function App() {
  if (!isAuth0Configured) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Auth0 Configuration Required
          </h1>
          <p className="text-gray-600">
            Please configure Auth0 environment variables in your .env file
          </p>
        </div>
      </div>
    );
  }

  return (
    <Auth0Provider
      domain={auth0Config.domain}
      clientId={auth0Config.clientId}
      authorizationParams={{
        redirect_uri: auth0Config.redirectUri,
        audience: auth0Config.audience,
        scope: auth0Config.scope,
      }}
      useRefreshTokens={auth0Config.useRefreshTokens}
      cacheLocation={auth0Config.cacheLocation}
    >
      <AuthProvider>
        <MemoProvider>
          <Router>
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/memos" element={<MemoListPage />} />
              <Route path="/memo/:id" element={<MemoDetailPage />} />
              <Route path="/collections" element={<CollectionsPage />} />
              <Route path="/collections/:id" element={<CollectionDetailPage />} />
              <Route path="/debug" element={<AuthDebug />} />
              <Route path="/auth-test" element={<AuthTest />} />
            </Routes>
          </Router>
        </MemoProvider>
      </AuthProvider>
    </Auth0Provider>
  );
}

export default App;