# Cloudflare Workers API (简化版)
// 这是一个简化的API示例，用于Cloudflare Workers
// 注意：Workers有10ms CPU时间限制，不适合复杂的YouTube处理

export default {
  async fetch(request, env) {
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

    // API路由
    if (url.pathname.startsWith('/api/')) {
      // 转发到Railway后端
      const backendUrl = 'https://your-backend.railway.app' + url.pathname + url.search;
      
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
    }

    // 静态文件服务
    return new Response('Not Found', { status: 404 });
  },
};
