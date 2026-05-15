# MongoDB Setup for AyurIT

## Option 1: MongoDB Atlas (Cloud - Recommended)

### Step 1: Create Free MongoDB Atlas Account
1. Go to https://www.mongodb.com/cloud/atlas
2. Sign up for free account
3. Verify email

### Step 2: Create a Cluster
1. Click "Create Deployment"
2. Choose **M0 Sandbox** (free tier)
3. Select cloud provider (AWS recommended) and region closest to you
4. Click "Create"
5. Wait 5-10 minutes for cluster to initialize

### Step 3: Get Connection String
1. Click "Connect" button on your cluster
2. Choose "Drivers" option
3. Select "Node.js" and driver version "4.x or later"
4. Copy the connection string

### Step 4: Update .env
Replace the placeholder in `backend/.env`:
```
MONGODB_URI=mongodb+srv://USERNAME:PASSWORD@your-cluster.mongodb.net/ayurit_dev?retryWrites=true&w=majority
```

**Important:** Replace `USERNAME`, `PASSWORD`, and cluster name with your actual credentials.

---

## Option 2: Local MongoDB (Development)

### Step 1: Install MongoDB Community Edition
- **Windows**: Download from https://www.mongodb.com/try/download/community
- **Mac**: `brew install mongodb-community`
- **Linux**: `sudo apt-get install mongodb`

### Step 2: Start MongoDB Service
```bash
# Windows (PowerShell as Admin)
net start MongoDB

# Mac
brew services start mongodb-community

# Linux
sudo systemctl start mongod
```

### Step 3: Update .env
```
MONGODB_URI=mongodb://localhost:27017/ayurit_dev
```

---

## Verify Connection

After updating `.env`, restart the backend:
```bash
# Stop current backend (Ctrl+C in terminal)
# Then restart:
cd backend
npm run dev
```

You should see in the logs:
```
[db] Attempting to connect to MongoDB...
[db] ✓ Successfully connected to MongoDB
[db] Database: ayurit_dev
```

## Security Notes

- **NEVER commit real credentials to GitHub**
- `.env` is already in `.gitignore`
- Use strong passwords for MongoDB Atlas
- In production, use environment variables from your deployment platform (Heroku, Vercel, etc.)

## Troubleshooting

**Connection timeout**: Ensure MongoDB is running or your Atlas cluster is active
**Authentication failed**: Check USERNAME and PASSWORD in connection string
**Database not found**: MongoDB will auto-create `ayurit_dev` on first connection

---

**Next steps after MongoDB is connected:**
1. Backend will auto-create collections (`users`, `patients`, `foods`, `charts`)
2. Test signup/login to store users in MongoDB
3. Verify dashboards fetch real database data
4. Then proceed with dashboard reconstruction and Gemini AI integration
