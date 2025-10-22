# 🌐 Clear Cloud Database - Complete Guide

## Overview
This guide shows how to clear your cloud database (PostgreSQL or MongoDB) to start completely fresh with only the owner account.

## 🎯 What Gets Cleared
- ✅ All users (except owner will be recreated)
- ✅ All shops
- ✅ All menu items
- ✅ All orders and bills
- ✅ All tables and categories
- ✅ All audit logs
- ✅ All settings (will be recreated with defaults)

## 📋 Prerequisites
- Your application must be deployed to cloud (Vercel, Render, etc.)
- You need access to environment variables
- You need the database connection string

---

## 🔵 Method 1: Clear PostgreSQL Database (Render)

### Step 1: Get PostgreSQL Connection String
1. Go to [Render Dashboard](https://dashboard.render.com/)
2. Click on your PostgreSQL database
3. Copy the **Internal Database URL**
4. It looks like: `postgresql://user:password@host/database`

### Step 2: Run Clear Script
```bash
# Set the PostgreSQL URL and run the clear script
POSTGRES_URL="postgresql://user:password@host/database" node clear-cloud-database.js
```

### Step 3: Redeploy Application
1. Go to your backend service on Render
2. Click **"Manual Deploy"** → **"Deploy latest commit"**
3. Wait for deployment to complete

### Step 4: Verify Fresh Start
1. Visit your frontend URL
2. Login with: `owner` / `owner123`
3. Check that no shops exist
4. Create a test shop to verify it works

---

## 🟢 Method 2: Clear MongoDB Database (Vercel/Atlas)

### Step 1: Get MongoDB Connection String
1. Go to [MongoDB Atlas](https://cloud.mongodb.com/)
2. Click **"Connect"** on your cluster
3. Choose **"Connect your application"**
4. Copy the connection string
5. It looks like: `mongodb+srv://user:password@cluster.mongodb.net/database`

### Step 2: Run Clear Script
```bash
# Set the MongoDB URI and run the clear script
MONGODB_URI="mongodb+srv://user:password@cluster.mongodb.net/database" node clear-cloud-database.js
```

### Step 3: Redeploy Application
1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click on your project
3. Go to **"Deployments"** tab
4. Click **"..."** → **"Redeploy"**
5. Wait for deployment to complete

### Step 4: Verify Fresh Start
1. Visit your frontend URL
2. Login with: `owner` / `owner123`
3. Check that no shops exist
4. Create a test shop to verify it works

---

## 🛠️ Method 3: Clear via API Endpoints

### For PostgreSQL (Render)
```bash
# Clear all data via API (requires owner login)
curl -X POST https://your-backend.onrender.com/api/debug/delete-all-data \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json"
```

### For MongoDB (Vercel)
```bash
# Clear all data via API (requires owner login)
curl -X POST https://your-app.vercel.app/api/debug/delete-all-data \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json"
```

---

## 🔧 Method 4: Manual Database Clearing

### PostgreSQL (via psql)
```bash
# Connect to database
psql "postgresql://user:password@host/database"

# Clear all tables
TRUNCATE TABLE users, shops, menu_items, orders, order_items, bills, tables, categories, settings, audit_logs RESTART IDENTITY CASCADE;

# Exit
\q
```

### MongoDB (via mongosh)
```bash
# Connect to database
mongosh "mongodb+srv://user:password@cluster.mongodb.net/database"

# Clear all collections
db.users.deleteMany({})
db.shops.deleteMany({})
db.menu_items.deleteMany({})
db.orders.deleteMany({})
db.order_items.deleteMany({})
db.bills.deleteMany({})
db.tables.deleteMany({})
db.categories.deleteMany({})
db.settings.deleteMany({})
db.audit_logs.deleteMany({})

# Exit
exit
```

---

## ✅ Verification Steps

After clearing the database, verify:

1. **Check Database Status**
   ```bash
   curl https://your-app.vercel.app/api/debug/status
   ```
   Should show: `"user_count": 1`

2. **Login Test**
   - Username: `owner`
   - Password: `owner123`
   - Should work and show owner dashboard

3. **Check Owner Portal**
   - Should show 0 shops
   - Should show 0 menu items
   - Should show 0 tables
   - Should show 0 categories

4. **Create Test Data**
   - Create a test shop
   - Add a test menu item
   - Verify data persists after page refresh

---

## 🚨 Important Notes

### ⚠️ Data Loss Warning
- **ALL DATA WILL BE PERMANENTLY DELETED**
- This includes all shops, users, orders, bills, etc.
- Make a backup first if you need to preserve any data

### 🔄 Automatic Recreation
After clearing, the system will automatically recreate:
- ✅ Owner account (`owner` / `owner123`)
- ✅ Default settings (tax rates, currency, etc.)
- ✅ Default taxes (GST, Service Tax)

### 🏗️ Manual Setup Required
After clearing, you must manually create:
- ❌ Shops
- ❌ Users (admin, cashier, etc.)
- ❌ Menu items and categories
- ❌ Tables
- ❌ Any custom settings

---

## 🆘 Troubleshooting

### Issue: "Connection refused"
**Solution:**
- Check connection string is correct
- Ensure database is running
- Verify network access permissions

### Issue: "Authentication failed"
**Solution:**
- Check username/password in connection string
- Reset database user password
- Update connection string

### Issue: "Tables not cleared"
**Solution:**
- Check foreign key constraints
- Use CASCADE option for PostgreSQL
- Clear collections individually for MongoDB

### Issue: "Owner account not recreated"
**Solution:**
- Redeploy the application
- Check deployment logs for errors
- Manually trigger account creation API

---

## 📞 Support

If you encounter issues:
1. Check deployment logs
2. Verify environment variables
3. Test connection string separately
4. Contact support with specific error messages

---

## 🎉 Success!

After successful clearing:
- ✅ Database is completely clean
- ✅ Only owner account exists
- ✅ No shops or other data
- ✅ Fresh start ready
- ✅ Owner can create everything from scratch

**Your cloud database is now completely fresh!** 🚀
