// Auth0 配置
export const auth0Config = {
  domain: process.env.REACT_APP_AUTH0_DOMAIN || 'dev-supk23n0xgucx0no.us.auth0.com',
  clientId: process.env.REACT_APP_AUTH0_CLIENT_ID || 'AsjzEsZrhndYvRZQMSE0MBAfjdGZCt80',
  audience: process.env.REACT_APP_AUTH0_AUDIENCE || 'https://dev-supk23n0xgucx0no.us.auth0.com/api/v2/',
  redirectUri: process.env.REACT_APP_AUTH0_REDIRECT_URI || 'http://localhost:3000/',
  scope: 'openid profile email',
  responseType: 'code',
  useRefreshTokens: true,
  cacheLocation: 'localstorage' as const,
};

// 环境变量检查
export const checkAuth0Config = () => {
  const requiredVars = [
    'REACT_APP_AUTH0_DOMAIN',
    'REACT_APP_AUTH0_CLIENT_ID',
    'REACT_APP_AUTH0_AUDIENCE',
    'REACT_APP_AUTH0_REDIRECT_URI'
  ];
  
  const missingVars = requiredVars.filter(varName => !process.env[varName]);
  
  if (missingVars.length > 0) {
    console.warn('Missing Auth0 environment variables:', missingVars);
    console.log('Using fallback Auth0 configuration');
  }
  
  return true; // 总是返回true，使用fallback配置
};
