# AyurIT Production Deployment Checklist

## ✅ Completed Pre-Production Optimizations

### 1. Debug Logging Cleanup
- ✅ Removed verbose console.log calls
- ✅ Converted to production-safe logger utility
- ✅ Logs only show in development mode (DEV environment variable)
- ✅ Production builds automatically suppress debug output

### 2. Environment Variables
- ✅ Frontend: .env.example documents API configuration
- ✅ Backend: .env.example with all required secrets
- ✅ .gitignore updated to exclude .env files

### 3. Build Optimization
- ✅ Production build succeeds without errors
- ✅ All TypeScript/JSX compiles cleanly
- ✅ Vite minifies assets for 650+ KB JS (consider code-splitting for future)
- ✅ CSS bundled and gzip-compressed (7.43 kB gzipped)

### 4. Security
- ✅ Sensitive data (.env files) excluded from git
- ✅ Backend JWT_SECRET uses minimum 32 characters
- ✅ AES_SECRET for encryption configured
- ✅ CORS restricted to specific origins

### 5. Frontend UI/UX
- ✅ Login page: Scrollbar stabilization fixed
- ✅ Daily Log: Previous entries display working
- ✅ Dashboard: All tabs render without errors
- ✅ Mobile responsiveness: Tested with iPhone 12 viewport

## 📋 Pre-Deployment Checklist

### Frontend (ayurit-client)

#### Environment Setup
- [ ] Copy `.env.example` to `.env.local` for development
- [ ] Set `VITE_API_URL` to production backend URL
  ```
  VITE_API_URL=https://api.yourdomain.com
  ```
- [ ] Verify .env.local is in .gitignore

#### Build & Deploy
- [ ] Run `npm run build` locally and verify dist/ folder
- [ ] Test: `npm run build` should complete without errors
- [ ] Deploy dist/ folder to Vercel/Netlify
  ```bash
  # Vercel deployment
  npm install -g vercel
  vercel --prod
  
  # Or Netlify
  netlify deploy --prod --dir=dist
  ```

#### Runtime Configuration
- [ ] Verify base URL routing works at production domain
- [ ] Test CORS headers are properly set
- [ ] Verify API requests go to backend URL, not localhost
- [ ] Check browser console for errors/warnings

#### Testing
- [ ] Test login flow on production build
- [ ] Verify Daily Log submission works
- [ ] Test session persistence across page refresh
- [ ] Check mobile responsiveness on production domain
- [ ] Test all dashboard tabs load correctly

### Backend (nodejs/express)

#### Environment Setup
- [ ] Copy `.env.example` to `.env`
- [ ] Replace placeholder values:
  ```bash
  PORT=4000
  NODE_ENV=production
  DB_PROVIDER=mongodb  # or postgres
  MONGODB_URI=<your-atlas-uri>  # if using MongoDB
  POSTGRES_URI=<your-postgres-uri>  # if using PostgreSQL
  JWT_SECRET=<generate-strong-32-char-secret>
  AES_SECRET=<generate-32-byte-secret>
  INTEGRATION_API_KEY=<your-api-key>
  API_KEY=<your-gemini-key>
  GEMINI_API_KEY=<your-gemini-key>
  ALLOWED_ORIGIN=https://yourdomain.com
  ```

#### Database Setup
- [ ] MongoDB Atlas cluster configured and IP whitelisted
  - [ ] Connection string includes credentials
  - [ ] Network access includes deployment server IP
  - [ ] SSL/TLS connection enabled
- OR PostgreSQL
  - [ ] Database created
  - [ ] Tables/schema initialized
  - [ ] Connection pool configured

#### Port & Networking
- [ ] Verify port 4000 is available or update PORT env var
- [ ] Configure firewall to allow inbound on app port
- [ ] Set ALLOWED_ORIGIN to match frontend domain
- [ ] Enable HTTPS/SSL on production

#### Deployment
- [ ] Deploy to Render/Railway/AWS/DigitalOcean
  ```bash
  # Example: Render deployment
  git push heroku main
  
  # Or Railway
  railway up
  ```
- [ ] Verify environment variables set in deployment platform
- [ ] Check backend logs for startup messages

#### Testing
- [ ] Test auth token endpoint: `curl -X POST https://api.yourdomain.com/api/auth/token`
- [ ] Test database connectivity in production
- [ ] Verify API responses include proper CORS headers
- [ ] Test token validation works
- [ ] Check error logging in production

### Database (MongoDB Atlas)

#### Cluster Setup
- [ ] MongoDB Atlas account created
- [ ] Free tier cluster provisioned (512MB storage)
- [ ] Network Access configured
  - [ ] Allow connection from deployment server
  - [ ] Allow connection from frontend if needed
- [ ] Database user created with strong password
- [ ] Connection string copied to .env

#### Data Verification
- [ ] Connect with MongoDB Compass to verify data
- [ ] Check users collection has test user
- [ ] Verify charts collection has sample entries
- [ ] Check indexes are optimized

#### Backup & Recovery
- [ ] Enable automated backups in MongoDB Atlas
- [ ] Test backup restore procedure
- [ ] Document recovery process

## 🚀 Deployment Steps (Summary)

### 1. Frontend Deployment (Vercel Example)
```bash
cd ayurit-client
npm run build
vercel --prod --env VITE_API_URL=https://api.yourdomain.com
```

### 2. Backend Deployment (Render Example)
```bash
# Connect GitHub repo to Render
# Set Environment Variables:
# - NODE_ENV=production
# - MONGODB_URI=<atlas-uri>
# - JWT_SECRET=<secret>
# - etc.
# Deploy automatically on push
git push origin main
```

### 3. Post-Deployment Verification
```bash
# Test frontend loads
curl https://yourdomain.com

# Test API responds
curl https://api.yourdomain.com/api/auth/me

# Check logs
# - Frontend: Browser DevTools Console
# - Backend: Deployment platform logs
```

## 🔒 Security Checklist

- [ ] .env files NOT committed to git
- [ ] Secrets stored in deployment platform env vars (not in code)
- [ ] HTTPS/SSL enabled on all domains
- [ ] CORS restricted to exact frontend domain
- [ ] JWT secret is cryptographically strong (32+ chars)
- [ ] Database user has minimal permissions needed
- [ ] API rate limiting configured (optional, for production)
- [ ] Security headers configured (Content-Security-Policy, etc.)

## 📊 Performance Checklist

- [ ] Frontend bundle size monitored (currently 182 KB gzipped)
- [ ] Database queries indexed properly
- [ ] API response times monitored
- [ ] Consider CDN for static assets (Vercel/Netlify auto-CDN)
- [ ] Enable HTTP/2 push headers
- [ ] Configure caching headers appropriately

## 🐛 Troubleshooting

### Frontend Issues
- **Blank page**: Check browser console for errors, verify VITE_API_URL
- **API 401/403**: Session expired, user needs to re-login
- **Broken links**: Verify backend domain in VITE_API_URL
- **Mobile layout broken**: Check viewport meta tag and responsive CSS

### Backend Issues
- **Connection refused**: Check port is open, firewall configured
- **Database connection error**: Verify MONGODB_URI/POSTGRES_URI
- **Auth token fails**: Check JWT_SECRET, confirm user exists
- **CORS errors**: Verify ALLOWED_ORIGIN matches frontend domain

### Database Issues
- **Cannot connect**: Check IP whitelist in MongoDB Atlas
- **Auth errors**: Verify username/password in connection string
- **Slow queries**: Check indexes, consider query optimization

## 📞 Post-Launch Support

After deployment:
1. Monitor error logs daily for first week
2. Check database size and backups are running
3. Verify automated alerts are configured
4. Plan maintenance window for updates
5. Document any custom configurations or workarounds

---
**Last Updated**: 2026-05-13
**Status**: Ready for Production Deployment
