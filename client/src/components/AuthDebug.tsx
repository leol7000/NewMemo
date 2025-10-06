import React from 'react';
import { useAuth } from '../contexts/AuthContext';

const AuthDebug: React.FC = () => {
  const { 
    user, 
    isAuthenticated, 
    isLoading,
    getAccessToken
  } = useAuth();

  const [token, setToken] = React.useState<string>('');

  const handleGetToken = async () => {
    try {
      const accessToken = await getAccessToken();
      setToken(accessToken || '');
      console.log('Access token:', accessToken);
    } catch (err) {
      console.error('Failed to get token:', err);
    }
  };

  if (isLoading) return <div>Loading...</div>;

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Auth Debug</h1>
      
      <div className="mb-4">
        <p><strong>Is Authenticated:</strong> {isAuthenticated ? 'Yes' : 'No'}</p>
        <p><strong>User:</strong> {user ? JSON.stringify(user, null, 2) : 'None'}</p>
        <p><strong>Token:</strong> {token ? token.substring(0, 50) + '...' : 'None'}</p>
      </div>

      <button 
        onClick={handleGetToken}
        className="bg-blue-500 text-white px-4 py-2 rounded"
      >
        Get Access Token
      </button>
    </div>
  );
};

export default AuthDebug;
