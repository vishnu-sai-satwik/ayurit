# Development Environment Setup

## Quick Start

### Prerequisites
- Node.js 18+ LTS
- npm or yarn
- Git
- MongoDB Atlas account (free tier)

### Step 1: Clone and Install

```bash
# Navigate to project
cd ayutit-client

# Frontend
cd ayurit-client
npm install

# Backend (in separate terminal)
cd ../backend
npm install
```

### Step 2: Environment Variables

#### Frontend (.env.local)
```bash
# Copy from .env.example
cp .env.example .env.local

# For development, leave VITE_API_URL commented (uses Vite proxy)
# VITE_API_URL=http://localhost:4000/api
```

#### Backend (.env)
```bash
# Edit the provided .env file or create new:
PORT=4000
NODE_ENV=development
DB_PROVIDER=mongodb
MONGODB_URI=mongodb+srv://<USERNAME>:<PASSWORD>@<CLUSTER>.mongodb.net/ayurit_dev?retryWrites=true&w=majority
JWT_SECRET=dev-secret-minimum-32-characters-long
AES_SECRET=dev-aes-secret-32-bytes-minimum-local-dev
API_KEY=<your-gemini-key>
GEMINI_API_KEY=<your-gemini-key>
ALLOWED_ORIGIN=http://localhost:5173
```

### Step 3: MongoDB Atlas Setup (Free)

1. Go to https://www.mongodb.com/cloud/atlas
2. Create free account
3. Create free cluster (512MB)
4. Whitelist your IP (or 0.0.0.0 for dev)
5. Create database user
6. Copy connection string to MONGODB_URI

### Step 4: Start Development Servers

#### Terminal 1: Frontend
```bash
cd ayurit-client
npm run dev
# Opens http://localhost:5174
```

#### Terminal 2: Backend
```bash
cd backend
npm start
# Starts on http://localhost:4000
# Will auto-fallback to 4001, 4002, etc. if port occupied
```

### Step 5: Test the Application

1. Open http://localhost:5174 in browser
2. Click "Login" button
3. Test with demo credentials or create new account

## Key Development Commands

### Frontend
```bash
npm run dev          # Start dev server with HMR
npm run build        # Production build
npm run preview      # Preview production build locally
npm run lint         # Run ESLint (if configured)
```

### Backend
```bash
npm start            # Start server with auto-restart (nodemon)
npm run lint         # Run ESLint (if configured)
npm test             # Run tests (if configured)
```

## Debugging

### Frontend
- Open DevTools: F12
- Check Console tab for logger output
- In development mode: `import.meta.env.DEV` is true
- All `logger.debug()` calls will print to console

### Backend
- Check terminal output for logs
- Set `NODE_ENV=development` for verbose logging
- Use `console.log()` for debugging
- MongoDB Compass for database inspection

## Common Issues

### Port Already in Use
```bash
# Kill process on port 4000
lsof -i :4000
kill -9 <PID>

# Or use different port
PORT=4001 npm start
```

### MongoDB Connection Failed
- Verify MONGODB_URI in .env
- Check IP whitelist in MongoDB Atlas
- Ensure database user credentials are correct
- Test connection with MongoDB Compass

### CORS Errors
- Verify ALLOWED_ORIGIN in backend .env
- Should match frontend URL (http://localhost:5173)
- Check Vite proxy is configured in vite.config.js

### API 401 Unauthorized
- Clear localStorage and cookies
- Try logging in again
- Check JWT_SECRET is same in .env
- Verify token is being sent in request headers

## Project Structure

```
ayutit-client/
├── ayurit-client/          # React frontend (Vite)
│   ├── src/
│   │   ├── pages/         # Route pages (Login, Dashboard, etc.)
│   │   ├── components/    # Reusable components
│   │   ├── utils/         # API, session, logger utilities
│   │   ├── App.jsx        # Main app component
│   │   └── main.jsx       # Entry point
│   ├── vite.config.js     # Vite proxy configuration
│   └── package.json
│
├── backend/               # Express backend
│   ├── src/
│   │   ├── controllers/   # Business logic
│   │   ├── routes/        # API endpoints
│   │   ├── models/        # Database schemas
│   │   ├── services/      # Data services
│   │   ├── middlewares/   # Auth, RBAC, errors
│   │   ├── config/        # Database, env config
│   │   ├── app.js         # Express app setup
│   │   └── server.js      # Server entry point
│   ├── .env               # Environment variables (LOCAL)
│   ├── .env.example       # Environment template
│   └── package.json
│
└── PRODUCTION_DEPLOYMENT.md  # Deployment guide
```

## Git Workflow

```bash
# Make changes
git add .
git commit -m "Feature: Description"

# Note: .env files are automatically ignored (in .gitignore)
# Never commit .env files with real credentials

# Push to deploy
git push origin main
```

## Resources

- **Frontend**: https://vitejs.dev/, https://react.dev/
- **Backend**: https://expressjs.com/, https://mongoosejs.com/
- **Database**: https://docs.mongodb.com/atlas/
- **Debugging**: Chrome DevTools, MongoDB Compass

## Getting Help

1. Check error message in console/logs
2. Verify .env variables are set correctly
3. Check MongoDB connection is working
4. Review browser DevTools Network tab for API responses
5. Check backend logs for server errors

---
**Happy Coding!** 🚀
