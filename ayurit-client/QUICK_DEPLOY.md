# 🚀 Quick Deployment Reference

## Pre-Deployment Checklist (5 minutes)

```bash
# 1. Frontend - Clean build test
cd ayurit-client
npm run build
# ✓ Should complete without errors
# ✓ Check dist/ folder created

# 2. Check git status (no .env files committed)
git status
# ✓ Should show .env files are ignored

# 3. Verify environment files exist
ls .env.example
ls backend/.env.example
# ✓ Both should exist
```

## Frontend Deployment (Vercel)

### 15-Minute Setup

```bash
# 1. Install Vercel CLI
npm install -g vercel

# 2. Build locally to verify
npm run build

# 3. Deploy to production
cd ayurit-client
vercel --prod

# 4. When prompted, set environment variable:
# VITE_API_URL = https://api.yourdomain.com
# (or your backend URL)
```

### Manual Alternative (GitHub Connected)

1. Go to https://vercel.com
2. Import GitHub repository
3. Select `ayurit-client` as root directory
4. Add environment variable: `VITE_API_URL`
5. Deploy

---

## Backend Deployment (Render)

### 15-Minute Setup

1. Go to https://render.com (signup/login)
2. Create new Web Service
3. Connect GitHub repository
4. Select `backend` as root directory
5. Set build command: `npm install && npm start`
6. Add environment variables:
   ```
   NODE_ENV=production
   PORT=4000
   DB_PROVIDER=mongodb
   MONGODB_URI=<your-atlas-uri>
   JWT_SECRET=<your-32-char-secret>
   AES_SECRET=<your-32-byte-secret>
   API_KEY=<your-gemini-key>
   GEMINI_API_KEY=<your-gemini-key>
   ALLOWED_ORIGIN=https://yourdomain.com
   ```
7. Deploy

---

## Database Setup (MongoDB Atlas)

### 10-Minute Setup

1. Go to https://cloud.mongodb.com
2. Create free account
3. Create free cluster (512 MB)
4. Create database user
5. Whitelist IP (or 0.0.0.0 for testing)
6. Copy connection string
7. Replace in backend .env: `MONGODB_URI=<string>`

---

## Post-Deployment Verification

```bash
# Test frontend
curl https://yourdomain.com
# Should return HTML

# Test backend API
curl https://api.yourdomain.com/api/auth/me
# Should return 401 Unauthorized (expected without token)

# Check logs
# Frontend: Browser DevTools Console
# Backend: Render/Railway dashboard logs
```

---

## Environment Variables Quick Reference

### Frontend (.env.local or Vercel)
```
VITE_API_URL=https://api.yourdomain.com
```

### Backend (.env or Render)
```
NODE_ENV=production
PORT=4000
DB_PROVIDER=mongodb
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/db
JWT_SECRET=<32+ random characters>
AES_SECRET=<32 random bytes>
API_KEY=<gemini-key>
GEMINI_API_KEY=<gemini-key>
ALLOWED_ORIGIN=https://yourdomain.com
```

---

## Common Gotchas

| Issue | Solution |
|-------|----------|
| API 401 errors | Check JWT_SECRET matches in .env |
| Cannot connect to DB | Check IP whitelist in MongoDB Atlas |
| CORS errors | Verify ALLOWED_ORIGIN in backend |
| Frontend 404 | Check VITE_API_URL is correct |
| Port already in use | Try different port or kill process |

---

## Emergency Rollback

```bash
# If something breaks, revert last commit
git revert HEAD
git push

# Deployment platforms auto-redeploy on push
# Service should be back to previous version in 2-5 minutes
```

---

## Monitoring Commands

```bash
# Check frontend deployment status
vercel ls
vercel status

# Check backend logs (Render)
# Go to https://dashboard.render.com
# Select service > Logs tab

# Check database (MongoDB Compass)
# Download: https://www.mongodb.com/products/compass
# Connect with MONGODB_URI from .env
```

---

## Helpful Links

- Vercel Dashboard: https://vercel.com/dashboard
- Render Dashboard: https://dashboard.render.com
- MongoDB Atlas: https://cloud.mongodb.com
- Project Status: See PROJECT_STATUS.md
- Full Guide: See PRODUCTION_DEPLOYMENT.md

---

**Total Deployment Time:** 30-60 minutes  
**Difficulty Level:** Easy  
**Success Probability:** 95%+ ✅

Good luck! 🚀
