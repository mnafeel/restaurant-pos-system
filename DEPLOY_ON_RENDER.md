# 🚀 Deploy Restaurant POS on Render.com (FREE)

**Simple step-by-step guide to get your POS online for FREE**

---

## ✅ **Why Render.com?**

- 🆓 **100% FREE** tier (750 hours/month)
- ✅ Supports Node.js backend
- ✅ Supports React frontend
- ✅ Auto-deploy from GitHub
- ✅ Free HTTPS/SSL
- ✅ No credit card required for free tier
- ✅ Easy setup (10 minutes)

---

## 📋 **Prerequisites**

- [x] Code pushed to GitHub
- [ ] Render.com account
- [ ] 10 minutes of time

---

## 🎯 **PART 1: Push to GitHub** (If not done)

```bash
# 1. Create repository on GitHub
# → https://github.com/new
# → Name: restaurant-pos-system
# → Private

# 2. Push code
cd /Users/admin/restaurant-billing-system
git push -u origin main
```

✅ **Code on GitHub!**

---

## 🌐 **PART 2: Deploy Backend on Render**

### **Step 1: Sign Up**

1. Go to: **https://render.com**
2. Click **"Get Started for Free"**
3. Sign up with:
   - GitHub account (easiest - click "GitHub" button)
   - Or email

### **Step 2: Create Web Service**

1. Click **"New +"** (top right)
2. Select **"Web Service"**

### **Step 3: Connect Repository**

1. Click **"Connect account"** if needed
2. Find your repository: `restaurant-pos-system`
3. Click **"Connect"**

### **Step 4: Configure Backend**

Fill in these settings:

**Basic:**

- **Name:** `restaurant-pos-backend`
- **Region:** `Singapore` (closest to India)
- **Branch:** `main`
- **Root Directory:** _(leave empty)_

**Build & Deploy:**

- **Environment:** `Node`
- **Build Command:** `npm install`
- **Start Command:** `node server.js`

**Instance:**

- **Instance Type:** `Free` (select from dropdown)

**Environment Variables** (Click "Add Environment Variable"):

Add these one by one:

| Key          | Value                           |
| ------------ | ------------------------------- |
| `JWT_SECRET` | `your-random-secret-key-123456` |
| `PORT`       | `5002`                          |
| `TZ`         | `Asia/Kolkata`                  |
| `NODE_ENV`   | `production`                    |

**Important:** Change `JWT_SECRET` to a random string!

### **Step 5: Deploy**

1. Click **"Create Web Service"** (bottom)
2. **Wait 5-10 minutes** (watch the logs)
3. **Deployment complete!** ✅

### **Step 6: Get Backend URL**

At the top of the page, you'll see:

```
https://restaurant-pos-backend.onrender.com
```

**COPY THIS URL!** You'll need it for the frontend.

---

## 💻 **PART 3: Update Frontend Configuration**

### **Step 1: Update API URL**

On your computer, edit this file:

```
/Users/admin/restaurant-billing-system/client/src/index.js
```

Find line 9:

```javascript
axios.defaults.baseURL = "http://localhost:5002";
```

Change to (use YOUR backend URL):

```javascript
axios.defaults.baseURL = "https://restaurant-pos-backend.onrender.com";
```

### **Step 2: Commit and Push**

```bash
cd /Users/admin/restaurant-billing-system
git add client/src/index.js
git commit -m "Update API URL for production"
git push origin main
```

---

## 🎨 **PART 4: Deploy Frontend on Render**

### **Step 1: Create Static Site**

1. On Render dashboard
2. Click **"New +"** → **"Static Site"**

### **Step 2: Connect Repository**

1. Select your repository: `restaurant-pos-system`
2. Click **"Connect"**

### **Step 3: Configure Frontend**

**Basic:**

- **Name:** `restaurant-pos-frontend`
- **Branch:** `main`
- **Root Directory:** `client`

**Build Settings:**

- **Build Command:** `npm install && npm run build`
- **Publish Directory:** `build`

### **Step 4: Deploy**

1. Click **"Create Static Site"**
2. **Wait 3-5 minutes**
3. **Done!** ✅

### **Step 5: Get Frontend URL**

You'll see:

```
https://restaurant-pos-frontend.onrender.com
```

**This is your POS URL!** 🎉

---

## 🎉 **SUCCESS! Your POS is Live!**

**Access your POS at:**

```
https://restaurant-pos-frontend.onrender.com
```

### **Login with:**

- Username: `owner`
- Password: `owner123`
- **⚠️ Change password immediately!**

### **Works on:**

- ✅ Any computer
- ✅ Tablets
- ✅ Mobile phones
- ✅ Anywhere with internet

---

## 🔄 **Auto-Deploy Feature**

Every time you make changes:

```bash
# Local changes
git add .
git commit -m "Your changes"
git push origin main
```

**Render automatically:**

1. Detects the push
2. Rebuilds your app
3. Deploys new version
4. **Live in 5 minutes!** 🚀

---

## ⚡ **Free Tier Performance**

**What to expect:**

- App **sleeps** after 15 min of inactivity
- **Wakes up** on first request (15-30 sec wait)
- After wake up: Normal speed
- Good for: Testing, small restaurants, demos

**To keep always-on:**

- Upgrade to paid plan: $7/month
- No sleep mode
- Better performance
- Recommended for production

---

## 🔧 **Important Settings**

### **CORS (Already configured in server.js):**

```javascript
app.use(
  cors({
    origin: "*", // Allows all origins
    credentials: true,
  })
);
```

### **Database:**

- SQLite file stored on Render
- Backed up on Render's disk
- Consider PostgreSQL for production

---

## 📊 **Monitor Your Deployment**

**Render Dashboard shows:**

- Deployment status
- Logs (live)
- Resource usage
- Performance metrics
- Latest deployments

**Access logs:**

- Click on your service
- "Logs" tab
- See real-time activity

---

## 🔐 **Security Recommendations**

After deployment:

1. **Change all default passwords**
2. **Update JWT_SECRET** (use random 32+ character string)
3. **Set strong passwords** for all accounts
4. **Review who has access** to repository
5. **Enable 2FA** on GitHub account

---

## 📝 **Post-Deployment Checklist**

- [ ] Backend deployed successfully
- [ ] Frontend deployed successfully
- [ ] Can access login page
- [ ] Can login as owner
- [ ] Changed owner password
- [ ] Created first shop
- [ ] Added menu items
- [ ] Tested order creation
- [ ] Tested bill generation
- [ ] Tested from mobile device
- [ ] All features working

---

## 🆘 **Troubleshooting**

### **Backend won't start:**

- Check logs in Render dashboard
- Verify environment variables are set
- Check build command succeeded

### **Frontend shows blank page:**

- Check if API URL is correct in `client/src/index.js`
- Check browser console for errors
- Verify backend is running

### **Can't connect to backend:**

- Check CORS settings
- Verify backend URL in frontend
- Check if backend is sleeping (wait 30 seconds)

### **Database errors:**

- Render creates disk storage automatically
- Database persists between deploys
- Check logs for SQLite errors

---

## 💰 **Cost Breakdown**

**Free Tier:**

- Backend: FREE (750 hours/month)
- Frontend: FREE (unlimited)
- SSL: FREE
- Bandwidth: FREE (100 GB/month)
- **Total: $0/month** 🎉

**Paid (if needed):**

- Backend always-on: $7/month
- More RAM: $7-25/month
- PostgreSQL: $7/month

---

## 🌐 **Custom Domain** (Optional)

Add your own domain:

1. **On Render:**

   - Service Settings → Custom Domain
   - Add: `pos.yourrestaurant.com`

2. **On your domain registrar:**

   - Add CNAME record
   - Point to Render URL

3. **SSL certificate:** Automatic!

---

## ✅ **Summary**

**What you get with Render:**

- ✅ Your POS online 24/7
- ✅ Accessible from anywhere
- ✅ Secure HTTPS
- ✅ Auto-deploy from GitHub
- ✅ FREE forever (free tier)

**Time to deploy:**

- Backend: 10 minutes
- Frontend: 5 minutes
- **Total: 15 minutes** ⏱️

---

## 🚀 **Let's Do This!**

1. **Now:** Push code to GitHub
2. **Then:** Deploy on Render (15 min)
3. **Done:** Your POS is live! 🎉

**Start here:** https://render.com/signup

**Questions?** Read DEPLOYMENT_GUIDE.md for more details!

---

**Restaurant POS Pro v1.0.0**  
**Deploy once, access forever!** ✨
