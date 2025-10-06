import jwt from 'jsonwebtoken';
import jwksClient from 'jwks-client';
import { Request, Response, NextFunction } from 'express';

interface Auth0Config {
  domain: string;
  audience: string;
  issuer: string;
}

interface AuthRequest extends Request {
  user?: any;
}

const auth0Config: Auth0Config = {
  domain: process.env.AUTH0_DOMAIN || '',
  audience: process.env.AUTH0_AUDIENCE || '',
  issuer: process.env.AUTH0_ISSUER || ''
};

// 创建 JWKS 客户端
const client = jwksClient({
  jwksUri: `https://${auth0Config.domain}/.well-known/jwks.json`
});

// 获取签名密钥
function getKey(header: any, callback: any) {
  client.getSigningKey(header.kid, (err, key) => {
    if (err) {
      callback(err);
      return;
    }
    const signingKey = key?.publicKey || key?.rsaPublicKey;
    callback(null, signingKey);
  });
}

// Auth0 JWT 验证中间件
export const authenticateToken = (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  // 调试信息
  console.log('Token received:', token.substring(0, 20) + '...');
  console.log('Auth0 config:', { audience: auth0Config.audience, issuer: auth0Config.issuer });

  jwt.verify(token, getKey, {
    audience: auth0Config.audience,
    issuer: auth0Config.issuer,
    algorithms: ['RS256']
  }, (err, decoded) => {
    if (err) {
      console.error('JWT verification error:', err);
      return res.status(403).json({ error: 'Invalid token' });
    }
    
    req.user = decoded;
    next();
  });
};

// 可选认证中间件（用于开发环境）
export const optionalAuth = (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    // 如果没有 token，继续执行但不设置用户信息
    console.log('OptionalAuth - No token provided, continuing without authentication');
    req.user = null;
    return next();
  }

  // 调试信息
  console.log('OptionalAuth - Token received:', token.substring(0, 20) + '...');
  console.log('OptionalAuth - Auth0 config:', { audience: auth0Config.audience, issuer: auth0Config.issuer });

  jwt.verify(token, getKey, {
    audience: auth0Config.audience,
    issuer: auth0Config.issuer,
    algorithms: ['RS256']
  }, (err, decoded) => {
    if (err) {
      console.error('OptionalAuth - JWT verification error:', err);
      return res.status(403).json({ error: 'Invalid token' });
    }
    
    req.user = decoded;
    next();
  });
};

// 获取用户信息
export const getUserInfo = (req: AuthRequest) => {
  if (!req.user) {
    return null;
  }
  
  return {
    id: req.user.sub,
    email: req.user.email,
    name: req.user.name,
    picture: req.user.picture
  };
};
