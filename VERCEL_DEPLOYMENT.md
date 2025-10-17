# 🚀 Deploy to Vercel (Frontend + Backend)

## ⚠️ Important Note

**SQLite doesn't work on Vercel!** Vercel uses serverless functions which don't have persistent storage.

You have **2 options**:

### Option 1: Use Vercel Postgres (Recommended) ✅
- Deploy both frontend and backend on Vercel
- Use Vercel Postgres database (free tier available)
- **Follow this guide**

### Option 2: Split Deployment
- Frontend on Vercel
- Backend on Render (with SQLite)
- See `RENDER_STEP_BY_STEP.md`

---

## 📋 **Prerequisites**

1. GitHub account
2. Vercel account (free)
3. Code pushed to GitHub

---

## 🎯 **Step 1: Push Code to GitHub**

```bash
cd /Users/admin/restaurant-billing-system

# Add all files
git add .

# Commit
git commit -m "Add Vercel deployment configuration"

# Push
git push origin main
```

---

## 🎯 **Step 2: Deploy to Vercel**

### **2.1 Go to Vercel Dashboard**
1. Visit https://vercel.com
2. Click **"Add New Project"**
3. Click **"Import Git Repository"**
4. Select your GitHub repository

### **2.2 Configure Project**
```
Framework Preset: Other
Root Directory: ./
Build Command: npm run build
Output Directory: client/build
Install Command: npm install && cd client && npm install
```

### **2.3 Environment Variables (Skip for now)**
Click **"Deploy"** without adding variables yet.

---

## 🎯 **Step 3: Add Vercel Postgres**

### **3.1 Create Database**
1. Go to your project dashboard on Vercel
2. Click **"Storage"** tab
3. Click **"Create Database"**
4. Select **"Postgres"**
5. Choose **"Free Hobby"** plan
6. Click **"Create"**

### **3.2 Connect to Project**
1. Database will be created
2. Click **"Connect Project"**
3. Select your project
4. Click **"Connect"**

This automatically adds these environment variables:
- `POSTGRES_URL`
- `POSTGRES_PRISMA_URL`
- `POSTGRES_URL_NON_POOLING`
- `POSTGRES_USER`
- `POSTGRES_HOST`
- `POSTGRES_PASSWORD`
- `POSTGRES_DATABASE`

### **3.3 Redeploy**
1. Go to **"Deployments"** tab
2. Click the **"..."** menu on latest deployment
3. Click **"Redeploy"**
4. Wait 2-3 minutes

---

## 🎯 **Step 4: Test Your Deployment**

### **4.1 Get Your URL**
Your app will be at:
```
https://your-project-name.vercel.app
```

### **4.2 Check Database Status**
Visit:
```
https://your-project-name.vercel.app/api/debug/status
```

Should show:
```json
{
  "status": "ok",
  "database": "connected",
  "user_count": 3,
  "users": [
    {"username": "owner", "role": "owner"},
    {"username": "admin", "role": "admin"},
    {"username": "cashier", "role": "cashier"}
  ]
}
```

### **4.3 Login**
Go to your frontend URL and login:
```
Username: owner
Password: owner123
```

---

## ⚠️ **If Database is Empty**

If `/api/debug/status` shows `user_count: 0`, manually create accounts:

### **Option 1: Using Browser Console**
1. Open browser console (F12)
2. Paste this:
```javascript
fetch('https://your-project-name.vercel.app/api/debug/create-accounts', {
  method: 'POST',
  headers: {'Content-Type': 'application/json'},
  body: JSON.stringify({secret: 'create-accounts-now-2024'})
}).then(r => r.json()).then(console.log)
```

### **Option 2: Using curl**
```bash
curl -X POST https://your-project-name.vercel.app/api/debug/create-accounts \
  -H 'Content-Type: application/json' \
  -d '{"secret": "create-accounts-now-2024"}'
```

---

## 🎯 **Update Frontend API URL**

If frontend can't connect to backend, update the API URL:

### **Edit `client/src/index.js`**
```javascript
// Change from Render URL to Vercel URL
axios.defaults.baseURL = process.env.REACT_APP_API_URL || 'https://your-project-name.vercel.app';
```

### **Or add environment variable in Vercel:**
1. Go to project **"Settings"** → **"Environment Variables"**
2. Add:
   ```
   Key: REACT_APP_API_URL
   Value: https://your-project-name.vercel.app
   ```
3. **Redeploy**

---

## 🔧 **Troubleshooting**

### **Issue 1: "Database error" on login**
- Check Vercel Postgres is connected
- Check environment variables are set
- Redeploy after connecting database

### **Issue 2: "CORS error"**
- Backend should allow Vercel domains
- Check server.js CORS configuration

### **Issue 3: "Function timeout"**
- Vercel free tier has 10-second timeout
- Upgrade to Pro if needed ($20/month)

### **Issue 4: Build fails**
- Make sure both root and client dependencies install
- Check build logs in Vercel dashboard

---

## 📊 **Database Management**

### **Access Postgres Database**
1. Go to Vercel dashboard → **"Storage"**
2. Click your database
3. Go to **"Data"** tab
4. Use SQL editor to query/modify data

### **Example Queries**
```sql
-- Check users
SELECT * FROM users;

-- Check settings
SELECT * FROM settings;

-- Reset owner password
UPDATE users 
SET password_hash = '$2a$10$...' 
WHERE username = 'owner';
```

---

## 💰 **Pricing**

### **Free Tier Includes:**
- ✅ Unlimited frontend deployments
- ✅ 100 GB bandwidth/month
- ✅ Serverless functions
- ✅ Postgres database (60 hours compute/month)
- ✅ Custom domain

### **Limitations:**
- ⚠️ 10-second function timeout
- ⚠️ 60 hours compute time for database
- ⚠️ 256 MB database storage

### **When to Upgrade:**
- High traffic (>100 GB/month)
- Need longer function execution
- More database storage/compute

---

## ✅ **Your Deployment is Complete!**

### **Credentials:**
```
Owner:   owner   / owner123
Admin:   admin   / admin123
Cashier: cashier / cashier123
```

### **URLs:**
- Frontend: https://your-project-name.vercel.app
- API: https://your-project-name.vercel.app/api
- Debug: https://your-project-name.vercel.app/api/debug/status

---

## 🎉 **Next Steps**

1. ✅ Change default passwords
2. ✅ Add custom domain (optional)
3. ✅ Configure shop settings
4. ✅ Add menu items
5. ✅ Create shops and users
6. ✅ Start taking orders!

---

## 🔐 **Security Notes**

⚠️ **After first login:**
1. Change all default passwords
2. Remove or protect debug endpoints
3. Set up proper authentication
4. Configure HTTPS (Vercel does this automatically)

---

## 📞 **Support**

Having issues? Check:
1. Vercel deployment logs
2. Browser console (F12)
3. Network tab for API errors
4. Vercel Postgres logs

---

**Enjoy your cloud-deployed Restaurant POS System!** 🎉
