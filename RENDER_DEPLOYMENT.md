# Render deployment configuration
# This file helps Render understand how to build and deploy your app

# Build command (Render will run this to build your app)
# Build Command: cd server && npm install && npm run build

# Start command (Render will run this to start your app)
# Start Command: cd server && npm start

# Environment variables needed:
# - NODE_ENV=production
# - PORT=10000 (Render automatically sets this)
# - SUPABASE_URL=your_supabase_url
# - SUPABASE_ANON_KEY=your_supabase_anon_key
# - OPENAI_API_KEY=your_openai_api_key
# - AUTH0_DOMAIN=your_auth0_domain
# - AUTH0_CLIENT_ID=your_auth0_client_id
# - AUTH0_CLIENT_SECRET=your_auth0_client_secret
# - AUTH0_AUDIENCE=your_auth0_audience
# - CORS_ORIGIN=https://your-cloudflare-pages-domain.pages.dev
