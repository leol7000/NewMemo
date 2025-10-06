// Cloudflare Workers API 代理
export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    
    // CORS headers
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    };

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    // 文件上传处理 - 转发到Railway (Railway会处理Supabase Storage)
    if (url.pathname === '/api/upload' && request.method === 'POST') {
      try {
        // 转发到Railway处理
        const backendUrl = `${env.RAILWAY_BACKEND_URL}/api/upload`;
        
        const backendRequest = new Request(backendUrl, {
          method: request.method,
          headers: request.headers,
          body: request.body,
        });

        const response = await fetch(backendRequest);
        
        // 添加CORS headers
        const newHeaders = new Headers(response.headers);
        Object.entries(corsHeaders).forEach(([key, value]) => {
          newHeaders.set(key, value);
        });

        return new Response(response.body, {
          status: response.status,
          headers: newHeaders,
        });
      } catch (error) {
        return new Response(JSON.stringify({ 
          success: false, 
          error: 'Upload failed' 
        }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    // API路由 - 转发到Railway
    if (url.pathname.startsWith('/api/')) {
      try {
        // 构建Railway后端URL
        const backendUrl = `${env.RAILWAY_BACKEND_URL}${url.pathname}${url.search}`;
        
        // 转发请求到Railway
        const backendRequest = new Request(backendUrl, {
          method: request.method,
          headers: request.headers,
          body: request.body,
        });

        const response = await fetch(backendRequest);
        
        // 添加CORS headers
        const newHeaders = new Headers(response.headers);
        Object.entries(corsHeaders).forEach(([key, value]) => {
          newHeaders.set(key, value);
        });

        return new Response(response.body, {
          status: response.status,
          headers: newHeaders,
        });
      } catch (error) {
        return new Response(JSON.stringify({ 
          success: false, 
          error: 'Service temporarily unavailable' 
        }), {
          status: 503,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    return new Response('Not Found', { status: 404 });
  },
};