# 🚀 Complete Render Backend Setup Guide

## 🎯 **Your Setup:**

- **Frontend:** Vercel → https://restaurant-pos-system-one.vercel.app
- **Backend:** Render → https://restaurant-pos-system-tuc6.onrender.com
- **Database:** SQLite (persistent on Render disk)

---

## ✅ **Step 1: Verify Render Service Exists**

### **1.1 Go to Render Dashboard**
Visit: https://dashboard.render.com/

### **1.2 Check Your Service**
You should see: **restaurant-pos-system-tuc6**
- Type: Web Service
- Status: Should be "Live" (green)

### **1.3 If Service Doesn't Exist**
Create a new service:
1. Click **"New +"** → **"Web Service"**
2. Connect GitHub repository: `mnafeel/restaurant-pos-system`
3. Configure:
   ```
   Name: restaurant-pos-backend
   Environment: Node
   Branch: main
   Build Command: npm install
   Start Command: node server.js
   Plan: Free
   ```
4. Click **"Create Web Service"**

---

## ✅ **Step 2: Configure Environment Variables**

### **2.1 Go to Service Settings**
1. Click your service name
2. Go to **"Environment"** tab

### **2.2 Add Required Variables**
Click **"Add Environment Variable"** for each:

```
Key: NODE_ENV
Value: production

Key: PORT
Value: 5002

Key: JWT_SECRET
Value: your-super-secret-jwt-key-change-this-in-production-12345

Key: TZ
Value: Asia/Kolkata
```

### **2.3 Optional: MongoDB (if not using SQLite)**
```
Key: MONGODB_URI
Value: mongodb+srv://username:password@cluster.mongodb.net/restaurant-pos?retryWrites=true&w=majority
```

### **2.4 Save**
Click **"Save Changes"**

---

## ✅ **Step 3: Configure Persistent Storage (for SQLite)**

### **3.1 Add Disk Storage**
1. Go to **"Environment"** tab
2. Scroll down to **"Disk"** section
3. Click **"Add Disk"**
4. Configure:
   ```
   Name: database-storage
   Mount Path: /opt/render/project/src
   Size: 1 GB (Free tier)
   ```
5. Click **"Save Changes"**

**This ensures your SQLite database persists across deploys!**

---

## ✅ **Step 4: Verify Deployment**

### **4.1 Check Logs**
1. Go to **"Logs"** tab
2. Look for:
   ```
   ==> Build successful 🎉
   ==> Starting service...
   🟢 Using SQLite (Local)
   ✅ Connected to SQLite database
   ✅ Database has 3 user(s)
   Server running on port 5002
   ```

### **4.2 Common Log Messages**

**Good:**
```
✅ Connected to SQLite database
✅ Database has 3 user(s)
Server running on port 5002
🎉 Server is ready!
```

**If Empty Database:**
```
✅ Connected to SQLite database
🔄 No users found. Creating default accounts...
✅ Owner account created!
✅ Admin account created!
✅ Cashier account created!
```

**If Errors:**
```
❌ Database connection error
❌ Port already in use
❌ Module not found
```

---

## ✅ **Step 5: Test Backend API**

### **5.1 Check Health Status**
Visit in browser:
```
https://restaurant-pos-system-tuc6.onrender.com/api/debug/status
```

**Expected Response:**
```json
{
  "status": "ok",
  "database": "connected",
  "user_count": 3,
  "users": [
    {"username": "owner", "role": "owner"},
    {"username": "admin", "role": "admin"},
    {"username": "cashier", "role": "cashier"}
  ],
  "deployment": "Render",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### **5.2 If user_count is 0**
Create accounts manually:

**Using Browser Console (F12):**
```javascript
fetch('https://restaurant-pos-system-tuc6.onrender.com/api/debug/create-accounts', {
  method: 'POST',
  headers: {'Content-Type': 'application/json'},
  body: JSON.stringify({secret: 'create-accounts-now-2024'})
}).then(r => r.json()).then(data => {
  console.log('✅ Accounts created:', data);
  alert('Success! Login with owner/owner123');
});
```

**Using curl:**
```bash
curl -X POST https://restaurant-pos-system-tuc6.onrender.com/api/debug/create-accounts \
  -H 'Content-Type: application/json' \
  -d '{"secret": "create-accounts-now-2024"}'
```

---

## ✅ **Step 6: Test Frontend Connection**

### **6.1 Visit Frontend**
Go to: https://restaurant-pos-system-one.vercel.app

### **6.2 Open Browser Console (F12)**
Check for errors:
- ❌ CORS errors → Check server.js CORS config
- ❌ Network errors → Backend might be sleeping
- ❌ 401 errors → Accounts not created
- ✅ No errors → Everything working!

### **6.3 Login**
```
Username: owner
Password: owner123
```

**Should redirect to dashboard!** ✅

---

## 🔧 **Troubleshooting**

### **Issue 1: "Service Unavailable" / 503 Error**

**Cause:** Backend is starting up or sleeping

**Solution:**
1. Wait 30 seconds (free tier wakes up)
2. Refresh the page
3. Try again

### **Issue 2: "CORS Error"**

**Cause:** Backend not allowing frontend domain

**Solution:**
Check `server.js` has this in CORS config:
```javascript
const allowedOrigins = [
  'http://localhost:3000',
  'https://restaurant-pos-system-one.vercel.app',
  /\.vercel\.app$/,
  /\.onrender\.com$/
];
```

### **Issue 3: "Invalid credentials" (401)**

**Cause:** Database is empty, no users exist

**Solution:**
Create accounts using the debug endpoint (see Step 5.2)

### **Issue 4: "Database Error" (500)**

**Cause:** SQLite file not persisting

**Solution:**
1. Make sure Disk storage is configured (Step 3)
2. Redeploy the service
3. Check logs for database path

### **Issue 5: Backend Keeps Sleeping**

**Cause:** Render free tier sleeps after 15 min idle

**Solutions:**
1. Accept the wake-up time (15-30 seconds)
2. Use a ping service (e.g., UptimeRobot) to keep it alive
3. Upgrade to $7/month for always-on

### **Issue 6: Build Fails**

**Cause:** Missing dependencies or wrong Node version

**Solution:**
1. Check logs for specific error
2. Ensure `package.json` has all dependencies
3. Add `.node-version` file with `18` or `20`
4. Redeploy

---

## 📊 **Render Free Tier Limits**

✅ **What's Included (Free):**
- 750 hours/month runtime
- 512 MB RAM
- Shared CPU
- 1 GB persistent disk
- Automatic SSL
- Auto-deploy from GitHub

⚠️ **Limitations:**
- Sleeps after 15 min idle
- Takes 15-30 sec to wake up
- CPU and RAM are shared
- Not suitable for high traffic

💰 **When to Upgrade ($7/month):**
- Always-on (no sleep)
- Better performance
- More RAM and CPU
- Priority support

---

## 🔐 **Security Checklist**

Before going live:

- [ ] Change JWT_SECRET to a random string
- [ ] Change default passwords (owner/admin/cashier)
- [ ] Enable rate limiting (already in code)
- [ ] Review CORS allowed origins
- [ ] Set up proper logging
- [ ] Enable database backups
- [ ] Add monitoring (e.g., Sentry)

---

## 📝 **Deployment Workflow**

### **Automatic Deployment:**

1. Make changes to code locally
2. Commit: `git commit -m "Your changes"`
3. Push: `git push origin main`
4. **Render auto-deploys backend** (3-4 min)
5. **Vercel auto-deploys frontend** (2-3 min)
6. Test the changes

### **Manual Redeploy:**

**Render:**
1. Go to Dashboard → Your service
2. Click **"Manual Deploy"** → **"Clear build cache & deploy"**
3. Wait for completion

**Vercel:**
1. Go to Dashboard → Your project
2. Go to Deployments tab
3. Click "..." → "Redeploy"

---

## 🎯 **Database Management**

### **Access SQLite Database:**

**Option 1: Via Shell (in Render)**
1. Go to your service
2. Click **"Shell"** tab
3. Run:
   ```bash
   sqlite3 restaurant.db
   
   # View users
   SELECT * FROM users;
   
   # View orders
   SELECT * FROM orders;
   
   # Exit
   .quit
   ```

**Option 2: Download Database**
1. Use Render Shell
2. Run: `cat restaurant.db > /tmp/db-backup.db`
3. Download via SFTP or similar

### **Backup Database:**

**Manual Backup:**
```bash
# In Render Shell
cp restaurant.db restaurant-backup-$(date +%Y%m%d).db
```

**Automated Backup:**
Set up a cron job or use Render Cron Jobs (paid feature)

---

## 🚀 **Performance Tips**

### **1. Keep Backend Alive (Free Tier)**

Use UptimeRobot to ping your backend every 5 minutes:
1. Sign up: https://uptimerobot.com/
2. Add monitor:
   - URL: https://restaurant-pos-system-tuc6.onrender.com/api/server-time
   - Interval: 5 minutes
3. This prevents sleep!

### **2. Optimize Frontend**

- Images already optimized
- Code splitting enabled
- Vercel CDN handles caching

### **3. Database Optimization**

- Add indexes to frequently queried columns
- Clean up old audit logs periodically
- Archive old orders

---

## ✅ **Final Checklist**

Before considering deployment complete:

- [ ] Backend is live on Render
- [ ] Frontend is live on Vercel
- [ ] Can login successfully
- [ ] All pages load without errors
- [ ] Can create orders
- [ ] Can manage menu items
- [ ] Can create users
- [ ] Database persists across deploys
- [ ] CORS is working
- [ ] Changed default passwords

---

## 🎉 **Your Live URLs**

### **Frontend (Vercel):**
https://restaurant-pos-system-one.vercel.app

### **Backend (Render):**
https://restaurant-pos-system-tuc6.onrender.com

### **API Endpoints:**
```
Health: /api/debug/status
Login: /api/auth/login
Menu: /api/menu
Orders: /api/orders
Users: /api/users
```

### **Default Credentials:**
```
Owner:   owner   / owner123
Admin:   admin   / admin123
Cashier: cashier / cashier123
```

---

## 📞 **Need Help?**

### **Check Logs:**
- **Render:** Dashboard → Service → Logs tab
- **Vercel:** Dashboard → Project → Deployments → Click deployment → View Function Logs

### **Common Commands:**

**Restart Backend:**
- Render Dashboard → Manual Deploy

**View Database:**
- Render Shell → `sqlite3 restaurant.db`

**Clear Cache:**
- Render → Manual Deploy → Clear build cache & deploy

---

**Your Restaurant POS System is now fully deployed and ready to use!** 🎉

Start taking orders and managing your restaurant! 🍽️

