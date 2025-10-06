import React from 'react';
import { useAuth0 } from '@auth0/auth0-react';

const AuthTest: React.FC = () => {
  const { 
    user, 
    isAuthenticated, 
    isLoading, 
    loginWithRedirect, 
    logout,
    getAccessTokenSilently,
    error 
  } = useAuth0();

  const [token, setToken] = React.useState<string>('');

  const handleGetToken = async () => {
    try {
      const accessToken = await getAccessTokenSilently();
      setToken(accessToken || '');
      console.log('Access token:', accessToken);
    } catch (err) {
      console.error('Failed to get token:', err);
    }
  };

  const handleTestAPI = async () => {
    try {
      const accessToken = await getAccessTokenSilently();
      const response = await fetch('http://localhost:3001/api/memos', {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      });
      
      const data = await response.json();
      console.log('API Response:', data);
      alert(`API Response: ${JSON.stringify(data, null, 2)}`);
    } catch (err) {
      console.error('API Test failed:', err);
      alert(`API Test failed: ${err}`);
    }
  };

  if (isLoading) return <div>Loading...</div>;

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1>Auth0 Test Page</h1>
      
      <div style={{ marginBottom: '20px' }}>
        <h2>Auth Status</h2>
        <p><strong>Is Authenticated:</strong> {isAuthenticated ? 'Yes' : 'No'}</p>
        <p><strong>User:</strong> {user ? JSON.stringify(user, null, 2) : 'None'}</p>
        <p><strong>Error:</strong> {error ? error.message : 'None'}</p>
        <p><strong>Token:</strong> {token ? token.substring(0, 50) + '...' : 'None'}</p>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <h2>Actions</h2>
        {!isAuthenticated ? (
          <button 
            onClick={() => loginWithRedirect()}
            style={{ padding: '10px 20px', marginRight: '10px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '4px' }}
          >
            Login
          </button>
        ) : (
          <>
            <button 
              onClick={handleGetToken}
              style={{ padding: '10px 20px', marginRight: '10px', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '4px' }}
            >
              Get Access Token
            </button>
            <button 
              onClick={handleTestAPI}
              style={{ padding: '10px 20px', marginRight: '10px', backgroundColor: '#17a2b8', color: 'white', border: 'none', borderRadius: '4px' }}
            >
              Test API
            </button>
            <button 
              onClick={() => logout()}
              style={{ padding: '10px 20px', backgroundColor: '#dc3545', color: 'white', border: 'none', borderRadius: '4px' }}
            >
              Logout
            </button>
          </>
        )}
      </div>

      <div style={{ marginBottom: '20px' }}>
        <h2>Auth0 Config</h2>
        <p><strong>Domain:</strong> {process.env.REACT_APP_AUTH0_DOMAIN || 'dev-supk23n0xgucx0no.us.auth0.com'}</p>
        <p><strong>Client ID:</strong> {process.env.REACT_APP_AUTH0_CLIENT_ID || 'AsjzEsZrhndYvRZQMSE0MBAfjdGZCt80'}</p>
        <p><strong>Audience:</strong> {process.env.REACT_APP_AUTH0_AUDIENCE || 'https://dev-supk23n0xgucx0no.us.auth0.com/api/v2/'}</p>
        <p><strong>Redirect URI:</strong> {process.env.REACT_APP_AUTH0_REDIRECT_URI || 'http://localhost:3000/'}</p>
      </div>
    </div>
  );
};

export default AuthTest;
