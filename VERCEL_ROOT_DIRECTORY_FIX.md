# 🔧 Fix Vercel Build - Set Root Directory

## ❌ **The Problem:**

Vercel is looking for `client` folder from the wrong location:
```
Error: sh: line 1: cd: client: No such file or directory
```

This is because Vercel starts from the **repository root** but needs to start from the **client folder**.

---

## ✅ **The Solution: Set Root Directory**

You need to tell Vercel to use `client` as the root directory.

---

## 📝 **Step-by-Step Fix:**

### **Step 1: Go to Vercel Dashboard**
Visit: https://vercel.com/dashboard

### **Step 2: Select Your Project**
Click on: **restaurant-pos-system-one**

### **Step 3: Go to Settings**
Click the **"Settings"** tab at the top

### **Step 4: Find Root Directory**
Scroll down to the **"General"** section

Look for: **"Root Directory"**

It probably shows: `.` (current directory)

### **Step 5: Edit Root Directory**
1. Click **"Edit"** button next to Root Directory
2. Enter: `client`
3. Click **"Save"**

### **Step 6: Verify Other Settings**

While you're in Settings, verify:

**Framework Preset:** Create React App (or auto-detect)

**Build Command:** (leave empty for auto-detect)
- Vercel will auto-detect: `npm run buildnpm run build`

**Output Directory:** (leave empty for auto-detect)
- Vercel will auto-detect: `build`

**Install Command:** (leave empty for auto-detect)
- Vercel will auto-detect: `npm install`

### **Step 7: Redeploy**
1. Go to **"Deployments"** tab
2. Find the latest (failed) deployment
3. Click the **"..."** menu (3 dots)
4. Click **"Redeploy"**
5. Confirm by clicking **"Redeploy"** again

---

## 🎯 **What This Does:**

When you set Root Directory to `client`, Vercel will:

```
Repository Root (/)
  ├── server.js          ← Vercel ignores this
  ├── package.json       ← Vercel ignores this
  ├── client/            ← Vercel STARTS HERE! ✅
  │   ├── package.json   ← Vercel reads this
  │   ├── src/           ← React source code
  │   └── build/         ← Built React app (deployed)
  └── ...
```

---

## ✅ **After Redeploying:**

Vercel will:
1. ✅ Clone repository
2. ✅ Go into `client/` folder
3. ✅ Find `package.json`
4. ✅ Run `npm install`
5. ✅ Run `npm run build`
6. ✅ Deploy `build/` folder
7. ✅ Success! 🎉

---

## 📊 **Expected Build Log:**

After setting Root Directory, you should see:

```
Cloning github.com/mnafeel/restaurant-pos-system (Branch: main)...
Cloning completed: 1.234s

Running "install" command: npm install...
✓ Dependencies installed

Running "build" command: npm run build...
Creating an optimized production build...
Compiled successfully!
✓ Build completed

Uploading build outputs...
✓ Deployment Ready
```

---

## 🔍 **Troubleshooting:**

### **Issue 1: Still can't find client directory**

**Solution:** 
- Make sure you typed exactly: `client` (lowercase, no spaces)
- Click Save and wait a moment
- Then redeploy

### **Issue 2: Build still fails with different error**

**Solution:**
- Check the new error message
- It might be a dependency issue
- Share the error and I'll help fix it

### **Issue 3: Build succeeds but app doesn't work**

**Solution:**
- Check browser console for errors
- Make sure API URL is correct: `https://restaurant-pos-system-tuc6.onrender.com`
- Verify backend is running

---

## 🎉 **Summary:**

**Key Setting:** Root Directory = `client`

This tells Vercel to build your React app from the `client` folder, not from the repository root.

**After this fix:**
- ✅ Vercel builds successfully
- ✅ Frontend deploys to: https://restaurant-pos-system-one.vercel.app
- ✅ Connects to Render backend
- ✅ Login works!

---

## 🚀 **Quick Checklist:**

- [ ] Go to Vercel Dashboard
- [ ] Settings → Root Directory
- [ ] Set to: `client`
- [ ] Save
- [ ] Deployments → Redeploy
- [ ] Wait 2-3 minutes
- [ ] Visit frontend URL
- [ ] Test login!

---

**Do these steps now and the build will succeed!** ✅

