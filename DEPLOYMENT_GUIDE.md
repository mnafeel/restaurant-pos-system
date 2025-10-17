# 🚀 GitHub Deployment Guide - Restaurant POS Pro

Complete guide to host your Restaurant POS system on GitHub and deploy it online.

---

## 📋 Prerequisites

Before deploying, make sure you have:
- ✅ GitHub account
- ✅ Git installed on your computer
- ✅ Node.js installed (v14 or higher)

---

## 🎯 Deployment Options

### **Option 1: GitHub Repository Only** (Recommended for backup)
Host the code on GitHub for version control and collaboration.

### **Option 2: GitHub + Render/Railway** (Full deployment)
Host code on GitHub + Deploy backend/frontend on cloud platforms.

### **Option 3: GitHub Pages** (Frontend only)
Host static frontend on GitHub Pages (requires separate backend hosting).

---

## 📦 Option 1: Push to GitHub Repository

### **Step 1: Initialize Git Repository**

```bash
cd /Users/admin/restaurant-billing-system

# Initialize git (if not already done)
git init

# Add all files
git add .

# Create first commit
git commit -m "Initial commit - Restaurant POS Pro v1.0.0"
```

### **Step 2: Create GitHub Repository**

1. Go to https://github.com
2. Click "New repository" (green button)
3. Repository name: `restaurant-pos-system` (or your choice)
4. Description: "Professional Restaurant POS System with multi-shop, billing, and inventory management"
5. Choose **Private** (recommended) or Public
6. **DO NOT** initialize with README (we already have one)
7. Click "Create repository"

### **Step 3: Connect and Push**

GitHub will show you commands. Use these:

```bash
# Add GitHub as remote
git remote add origin https://github.com/YOUR_USERNAME/restaurant-pos-system.git

# Push to GitHub
git branch -M main
git push -u origin main
```

Replace `YOUR_USERNAME` with your actual GitHub username.

---

## 🌐 Option 2: Deploy Full Application (Backend + Frontend)

### **Using Render.com** (Free tier available)

#### **A. Deploy Backend:**

1. **Sign up at https://render.com**
2. Click "New +" → "Web Service"
3. Connect your GitHub repository
4. Configure:
   - **Name:** restaurant-pos-backend
   - **Environment:** Node
   - **Build Command:** `npm install`
   - **Start Command:** `node server.js`
   - **Region:** Singapore (closest to India)
   - **Instance Type:** Free

5. **Environment Variables** (Add these):
   ```
   JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
   PORT=5002
   NODE_ENV=production
   TZ=Asia/Kolkata
   ```

6. Click "Create Web Service"
7. Wait for deployment (5-10 minutes)
8. Copy your backend URL (e.g., `https://restaurant-pos-backend.onrender.com`)

#### **B. Deploy Frontend:**

1. Update `client/src/index.js`:
   ```javascript
   // Replace this line:
   axios.defaults.baseURL = 'http://localhost:5002';
   
   // With your Render backend URL:
   axios.defaults.baseURL = 'https://restaurant-pos-backend.onrender.com';
   ```

2. Build frontend:
   ```bash
   cd client
   npm run build
   ```

3. On Render dashboard:
   - Click "New +" → "Static Site"
   - Connect repository
   - **Publish directory:** `client/build`
   - Click "Create Static Site"

4. Your frontend will be live at: `https://restaurant-pos.onrender.com`

---

### **Using Railway.app** (Alternative)

1. **Sign up at https://railway.app**
2. Click "New Project" → "Deploy from GitHub repo"
3. Select your repository
4. Railway will auto-detect Node.js
5. Set environment variables (same as Render)
6. Deploy!

---

## 🔐 Option 3: GitHub Pages (Frontend Only)

**Note:** GitHub Pages only hosts static sites. You'll need separate backend hosting.

1. **Update `client/package.json`**, add:
   ```json
   "homepage": "https://YOUR_USERNAME.github.io/restaurant-pos-system"
   ```

2. **Install gh-pages:**
   ```bash
   cd client
   npm install --save-dev gh-pages
   ```

3. **Add deploy scripts to `client/package.json`:**
   ```json
   "scripts": {
     "predeploy": "npm run build",
     "deploy": "gh-pages -d build",
     ...existing scripts...
   }
   ```

4. **Deploy:**
   ```bash
   npm run deploy
   ```

5. **Enable GitHub Pages:**
   - Go to repository Settings
   - Scroll to "Pages"
   - Source: `gh-pages` branch
   - Save

---

## 📝 Environment Configuration

### **Development (.env.local)**
```env
REACT_APP_API_URL=http://localhost:5002
```

### **Production (.env.production)**
```env
REACT_APP_API_URL=https://your-backend-url.onrender.com
```

---

## 🔒 Security Checklist Before Deployment

- [ ] Change `JWT_SECRET` to a strong random string
- [ ] Update default admin password
- [ ] Set strong passwords for all accounts
- [ ] Enable HTTPS (automatic on Render/Railway)
- [ ] Review CORS settings in server.js
- [ ] Remove any console.log statements with sensitive data
- [ ] Add rate limiting (already implemented)
- [ ] Set up database backups

---

## 📊 Post-Deployment Checklist

- [ ] Test login functionality
- [ ] Create a test shop
- [ ] Add sample menu items
- [ ] Create and complete a test order
- [ ] Print a test bill
- [ ] Check reports generation
- [ ] Test all payment methods
- [ ] Verify timezone (IST)
- [ ] Test currency settings
- [ ] Check mobile responsiveness

---

## 🔄 Updating Your Deployment

### **After making changes:**

```bash
# Commit changes
git add .
git commit -m "Description of changes"

# Push to GitHub
git push origin main
```

**On Render/Railway:** Auto-deploys from GitHub (if auto-deploy enabled)

**On GitHub Pages:**
```bash
cd client
npm run deploy
```

---

## 💾 Database Considerations

### **SQLite (Current Setup)**
- ✅ Good for: Small to medium deployments
- ⚠️ Limitation: Single file, no concurrent writes
- 📝 Backup: Download `restaurant.db` regularly

### **Upgrade to PostgreSQL** (Recommended for production)
1. Create database on Render/Railway
2. Install `pg` package: `npm install pg`
3. Update database connection in `server.js`
4. Migrate schema from SQLite to PostgreSQL

---

## 🛠️ Custom Domain (Optional)

### **On Render:**
1. Go to your service settings
2. Click "Custom Domain"
3. Add your domain (e.g., `pos.yourrestaurant.com`)
4. Update DNS records as shown
5. SSL certificate is automatic!

---

## 📱 Mobile Access

Once deployed, your POS system will be accessible:
- From any device with internet
- On tablets (perfect for waiters)
- On mobile phones
- On desktop computers

Just visit your deployed URL!

---

## 🔍 Monitoring & Maintenance

### **Render Dashboard:**
- View logs
- Monitor performance
- Check uptime
- Resource usage

### **Database Backups:**
```bash
# Download database regularly
scp user@server:/path/to/restaurant.db ./backups/restaurant-$(date +%Y%m%d).db
```

---

## 🆘 Troubleshooting

### **Backend not starting:**
- Check logs in Render dashboard
- Verify all environment variables are set
- Check Node.js version compatibility

### **Frontend can't connect to backend:**
- Verify `axios.defaults.baseURL` is correct
- Check CORS settings in `server.js`
- Ensure backend is running

### **Database errors:**
- Check if database file exists
- Verify file permissions
- Consider migrating to PostgreSQL for production

---

## 📞 Support

For issues or questions:
1. Check error logs in Render/Railway dashboard
2. Review browser console for frontend errors
3. Check server logs for backend errors

---

## 🎉 Success!

Once deployed, your Restaurant POS Pro will be:
- ✅ Accessible from anywhere
- ✅ Secure with HTTPS
- ✅ Running 24/7
- ✅ Professionally hosted
- ✅ Ready for production use

---

**Version:** Restaurant POS Pro v1.0.0  
**Last Updated:** 17/10/2025  
**Timezone:** Indian Standard Time (IST)

