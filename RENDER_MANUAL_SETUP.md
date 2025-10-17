# 🔧 Render Manual Setup - Fix Build Error

## ❌ **The Problem:**

Render keeps failing with:
```
Publish directory npm run build does not exist!
Build failed 😞
```

This means Render is configured as a **Static Site** instead of a **Web Service**.

---

## ✅ **Solution: Reconfigure Render Service**

You need to manually configure Render to run as a Web Service (backend only).

---

## 🎯 **Step-by-Step Fix:**

### **Step 1: Go to Render Dashboard**
Visit: https://dashboard.render.com/

### **Step 2: Find Your Service**
Look for: `restaurant-pos-system-tuc6`

### **Step 3: Delete Old Service (if misconfigured)**
If it says "Static Site" instead of "Web Service":
1. Click the service name
2. Go to **"Settings"** tab (bottom)
3. Scroll to **"Danger Zone"**
4. Click **"Delete Web Service"**
5. Confirm deletion

### **Step 4: Create NEW Web Service**
1. Click **"New +"** button
2. Select **"Web Service"**
3. Click **"Build and deploy from a Git repository"**
4. Click **"Next"**

### **Step 5: Connect GitHub**
1. Find your repository: `mnafeel/restaurant-pos-system`
2. Click **"Connect"**

### **Step 6: Configure Service**

Fill in these settings EXACTLY:

```
Name: restaurant-pos-backend
Region: Oregon (US West) or closest to you
Branch: main
Root Directory: (leave empty)
Runtime: Node
Build Command: npm install
Start Command: node server.js
Plan: Free
```

### **Step 7: Add Environment Variables**

Click **"Advanced"** → **"Add Environment Variable"**

Add these:

```
NODE_ENV = production
PORT = 10000
JWT_SECRET = your-super-secret-jwt-key-change-this-12345
TZ = Asia/Kolkata
```

### **Step 8: Create Service**
Click **"Create Web Service"**

Wait 3-4 minutes for deployment...

---

## ✅ **Verify Deployment:**

### **Check Logs:**
1. After service is created
2. Go to **"Logs"** tab
3. Should see:

```
==> Cloning from https://github.com/mnafeel/restaurant-pos-system...
==> Installing dependencies
npm install
✓ Dependencies installed

==> Build successful 🎉

==> Starting service...
🟢 Using SQLite (Local)
✅ Connected to SQLite database
🔄 No users found. Creating default accounts...
✅ Owner account created!
✅ Admin account created!
✅ Cashier account created!
Server running on port 10000
```

### **Test Backend:**
Visit: https://restaurant-pos-backend.onrender.com/api/debug/status

**Note:** URL might be different! Check your Render dashboard for the actual URL.

---

## 🔧 **Common Issues:**

### **Issue 1: "Static Site" instead of "Web Service"**
**Solution:** Delete and recreate as Web Service (see steps above)

### **Issue 2: Build keeps failing**
**Solution:** 
- Make sure Root Directory is EMPTY (not "client")
- Build Command: `npm install` (not `npm run build`)
- Start Command: `node server.js`

### **Issue 3: "Module not found: sqlite3"**
**Solution:**
- Build Command should be: `npm install` (not `npm install --production`)
- This installs all dependencies including sqlite3

### **Issue 4: Wrong URL**
After creating new service, URL changes!
- Old: https://restaurant-pos-system-tuc6.onrender.com
- New: https://restaurant-pos-backend.onrender.com

**Update frontend:**
Edit `client/src/index.js`:
```javascript
axios.defaults.baseURL = 'https://NEW-URL-HERE.onrender.com';
```

---

## 📝 **Correct Render Settings:**

```
Service Type: Web Service (NOT Static Site)
Name: restaurant-pos-backend
Runtime: Node
Root Directory: (empty)
Build Command: npm install
Start Command: node server.js
Auto-Deploy: Yes
```

---

## ✅ **After Service is Running:**

### **Update Frontend with New Backend URL:**

1. Note your new Render URL (e.g., `https://restaurant-pos-backend.onrender.com`)

2. Update `client/src/index.js`:
```javascript
axios.defaults.baseURL = 'https://YOUR-NEW-RENDER-URL.onrender.com';
```

3. Commit and push:
```bash
git add client/src/index.js
git commit -m "Update backend URL"
git push origin main
```

4. Vercel will auto-redeploy frontend

---

## 🎉 **Then Test:**

1. Backend: https://your-new-url.onrender.com/api/debug/status
2. Frontend: https://restaurant-pos-system-one.vercel.app
3. Login: owner / owner123

Should work perfectly! ✅

---

## 💡 **Quick Fix Summary:**

The key is: **Render must be a WEB SERVICE, not a Static Site!**

If you can't fix it, just delete and recreate with correct settings.

---

**Follow the steps above to fix Render deployment!** 🚀

