# 💻 All Install Commands for Deployment

**Complete list of commands to install and deploy your Restaurant POS**

---

## 🎯 **Quick Reference:**

### **Local Development (On your computer):**

```bash
# Install backend
npm install

# Install frontend
cd client
npm install
cd ..
```

### **On Render.com:**

Just use these in the forms (Render runs them automatically):

**Backend Build:** `npm install`  
**Frontend Build:** `npm install && npm run build`

---

## 📋 **COMPLETE DEPLOYMENT COMMANDS**

---

## 🏠 **OPTION 1: Run Locally (Your Computer)**

### **Step 1: Install Dependencies**

```bash
# Go to project folder
cd /Users/admin/restaurant-billing-system

# Install backend dependencies
npm install

# Install frontend dependencies
cd client
npm install
cd ..
```

### **Step 2: Start Backend**

```bash
# In Terminal 1
cd /Users/admin/restaurant-billing-system
node server.js
```

**Output:**
```
Server running on port 5002
Database initialized
✅ Backend ready!
```

### **Step 3: Start Frontend**

```bash
# In Terminal 2 (new terminal window)
cd /Users/admin/restaurant-billing-system/client
npm start
```

**Output:**
```
Compiled successfully!
Local:   http://localhost:3000
✅ Frontend ready!
```

### **Step 4: Access**

Open browser: **http://localhost:3000**

---

## 🌐 **OPTION 2: Deploy on Render.com (Online)**

### **Prerequisites:**

```bash
# 1. Push code to GitHub first
cd /Users/admin/restaurant-billing-system
git push -u origin main
```

---

### **BACKEND Deployment Settings:**

When creating **Web Service** on Render:

| Setting | Value |
|---------|-------|
| **Name** | `restaurant-pos-backend` |
| **Region** | `Singapore` |
| **Branch** | `main` |
| **Root Directory** | *(leave empty)* |
| **Environment** | `Node` |
| **Build Command** | `npm install` |
| **Start Command** | `node server.js` |
| **Plan** | `Free` |

**Environment Variables:**

```
JWT_SECRET=your-super-secret-random-key-change-this
PORT=5002
TZ=Asia/Kolkata
NODE_ENV=production
```

**No manual install needed!** Render runs `npm install` automatically.

---

### **FRONTEND Deployment Settings:**

After backend is deployed, update `client/src/index.js`:

```javascript
// Change this line:
axios.defaults.baseURL = 'http://localhost:5002';

// To your backend URL:
axios.defaults.baseURL = 'https://restaurant-pos-backend.onrender.com';
```

**Push to GitHub:**
```bash
git add client/src/index.js
git commit -m "Update API URL for production"
git push origin main
```

When creating **Static Site** on Render:

| Setting | Value |
|---------|-------|
| **Name** | `restaurant-pos-frontend` |
| **Branch** | `main` |
| **Root Directory** | `client` |
| **Build Command** | `npm install && npm run build` |
| **Publish Directory** | `build` |

**No manual install needed!** Render runs the build command automatically.

---

## 🚀 **OPTION 3: Production Build (Local)**

### **Build Frontend for Production:**

```bash
# Go to frontend folder
cd /Users/admin/restaurant-billing-system/client

# Build production version
npm run build
```

**Output:**
```
Creating an optimized production build...
Compiled successfully!
Build folder ready: client/build/
```

### **Serve Production Build:**

```bash
# Install serve globally (one time)
npm install -g serve

# Serve the built app
cd /Users/admin/restaurant-billing-system/client
npx serve -s build -p 3000
```

**Access:** http://localhost:3000

---

## 📦 **What Gets Installed:**

### **Backend Dependencies (from package.json):**

```json
{
  "express": "^4.18.2",           // Web framework
  "sqlite3": "^5.1.6",            // Database
  "socket.io": "^4.6.1",          // Real-time
  "bcryptjs": "^2.4.3",           // Password hashing
  "jsonwebtoken": "^9.0.0",       // JWT auth
  "cors": "^2.8.5",               // CORS handling
  "moment-timezone": "^0.5.43",   // Timezone
  "multer": "^1.4.5-lts.1",       // File upload
  "helmet": "^7.0.0",             // Security
  "express-rate-limit": "^6.7.0", // Rate limiting
  "express-validator": "^7.0.1",  // Validation
  "uuid": "^9.0.0"                // UUID generation
}
```

**Command:** `npm install` downloads ALL of these!

---

### **Frontend Dependencies (from client/package.json):**

```json
{
  "react": "^18.2.0",              // React framework
  "react-dom": "^18.2.0",          // React DOM
  "react-router-dom": "^6.10.0",   // Routing
  "axios": "^1.4.0",               // HTTP client
  "socket.io-client": "^4.6.1",    // Real-time
  "chart.js": "^4.2.1",            // Charts
  "react-chartjs-2": "^5.2.0",     // React charts
  "react-hot-toast": "^2.4.1",     // Notifications
  "react-icons": "^4.8.0",         // Icons
  "date-fns": "^2.30.0"            // Date utilities
}
```

**Plus dev dependencies:**
```json
{
  "tailwindcss": "^3.3.2",         // CSS framework
  "postcss": "^8.4.24",            // CSS processing
  "autoprefixer": "^10.4.14"       // CSS prefixing
}
```

**Command:** `npm install` downloads ALL of these!

---

## ⏱️ **Installation Time:**

### **First Time Install:**
- Backend: 3-5 minutes (downloads ~50 packages)
- Frontend: 5-8 minutes (downloads ~1500 packages)
- **Total: 10-15 minutes**

### **Subsequent Installs:**
- Much faster (uses cache)
- Backend: 1-2 minutes
- Frontend: 2-3 minutes

---

## 🔄 **Update Dependencies:**

### **Update all packages:**

```bash
# Backend
cd /Users/admin/restaurant-billing-system
npm update

# Frontend
cd client
npm update
cd ..
```

### **Check for outdated packages:**

```bash
# Backend
npm outdated

# Frontend
cd client
npm outdated
```

---

## 🧹 **Clean Install (If issues):**

### **Backend:**

```bash
cd /Users/admin/restaurant-billing-system

# Remove old installations
rm -rf node_modules
rm package-lock.json

# Fresh install
npm install
```

### **Frontend:**

```bash
cd /Users/admin/restaurant-billing-system/client

# Remove old installations
rm -rf node_modules
rm package-lock.json

# Fresh install
npm install
```

---

## 🎯 **All Commands Summary:**

### **Initial Setup (Your Computer):**

```bash
# Clone from GitHub (if needed)
git clone https://github.com/mnafeel/restaurant-pos-system.git
cd restaurant-pos-system

# Install backend
npm install

# Install frontend
cd client
npm install
cd ..

# Start backend
node server.js &

# Start frontend
cd client
npm start
```

---

### **Production Build (Your Computer):**

```bash
cd /Users/admin/restaurant-billing-system

# Build frontend
cd client
npm run build
cd ..

# Start backend
node server.js &

# Serve frontend build
cd client
npx serve -s build -p 3000
```

---

### **Deploy on Render (No manual commands needed):**

**Backend:**
- Build Command: `npm install`
- Start Command: `node server.js`

**Frontend:**
- Build Command: `npm install && npm run build`
- Publish Directory: `build`

**Render runs these automatically!**

---

## 🔧 **Useful Commands:**

### **Check Node/npm versions:**

```bash
node --version    # Should be v14 or higher
npm --version     # Should be 6 or higher
```

### **Install specific package:**

```bash
# Backend
npm install package-name

# Frontend
cd client
npm install package-name
```

### **Remove package:**

```bash
npm uninstall package-name
```

### **List installed packages:**

```bash
npm list --depth=0
```

---

## 🐛 **Fix Common Issues:**

### **Issue: "Cannot find module"**

```bash
# Clean install
rm -rf node_modules package-lock.json
npm install
```

### **Issue: "Permission denied"**

```bash
# Use sudo (Mac/Linux)
sudo npm install -g serve

# Or fix npm permissions
mkdir ~/.npm-global
npm config set prefix '~/.npm-global'
```

### **Issue: "EACCES error"**

```bash
# Fix npm permissions
sudo chown -R $(whoami) ~/.npm
```

### **Issue: "Out of memory"**

```bash
# Increase Node memory
export NODE_OPTIONS="--max-old-space-size=4096"
npm run build
```

---

## 📊 **Package Sizes:**

**Backend node_modules:**
- Size: ~50-80 MB
- Packages: ~200
- Install time: 3 minutes

**Frontend node_modules:**
- Size: ~300-400 MB
- Packages: ~1500
- Install time: 5 minutes

**Total:** ~450 MB (don't upload to GitHub - that's why we have .gitignore!)

---

## ✅ **Installation Checklist:**

**Local Development:**
- [ ] Node.js installed (v14+)
- [ ] npm installed (v6+)
- [ ] Backend dependencies installed
- [ ] Frontend dependencies installed
- [ ] Backend starts without errors
- [ ] Frontend starts without errors
- [ ] Can access http://localhost:3000

**Production Build:**
- [ ] Frontend builds successfully
- [ ] No build errors
- [ ] Build folder created
- [ ] Can serve build folder

**Render Deployment:**
- [ ] Code on GitHub
- [ ] Backend deployed (build successful)
- [ ] Frontend deployed (build successful)
- [ ] Can access online URL
- [ ] All features working

---

## 🎯 **Copy-Paste Commands for Render:**

### **Backend (Web Service):**

**Build Command:**
```
npm install
```

**Start Command:**
```
node server.js
```

---

### **Frontend (Static Site):**

**Build Command:**
```
npm install && npm run build
```

**Publish Directory:**
```
build
```

---

## 📖 **Related Guides:**

- **BUILD_COMMANDS_EXPLAINED.md** - Detailed build explanation
- **ROOT_DIRECTORY_EXPLAINED.md** - Root directory guide
- **RENDER_STEP_BY_STEP.md** - Complete Render deployment
- **DEPLOY_ON_RENDER.md** - Quick Render guide

---

## 💡 **Key Points:**

✅ **npm install** = Download dependencies  
✅ **npm run build** = Build React for production  
✅ **node server.js** = Start backend server  
✅ **&&** = Run second command after first succeeds

---

## 🚀 **Ready to Deploy?**

**On Render, just copy-paste the commands above!**

No need to run install manually - Render does it automatically! ✨

---

**Restaurant POS Pro v1.0.0**  
**All Install Commands Ready!** 🎉

