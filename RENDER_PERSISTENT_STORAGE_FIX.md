# 🚨 CRITICAL FIX: Render Persistent Storage for Database

## 🐛 THE PROBLEM

**Your shop data is being deleted on every deployment/restart** because:

1. **Render's free tier has EPHEMERAL file system** - files are wiped on restart
2. **No persistent disk was configured** - `restaurant.db` SQLite file gets deleted
3. **Every deployment = fresh database** - all shops, users, orders are lost

---

## ✅ THE SOLUTION: Add Persistent Disk

### Option 1: Using render.yaml (Automatic) ⭐ RECOMMENDED

The `render.yaml` file has been updated to include persistent storage:

```yaml
disk:
  name: restaurant-pos-data
  mountPath: /data
  sizeGB: 1
```

**This will automatically configure persistent storage on next deployment.**

---

### Option 2: Manual Configuration (Render Dashboard)

If the YAML config doesn't work, configure manually:

#### Step 1: Go to Render Dashboard
1. Visit: https://dashboard.render.com/
2. Click on your **restaurant-pos-backend** service

#### Step 2: Add Persistent Disk
1. Go to **"Disks"** tab in the left sidebar
2. Click **"Add Disk"**
3. Configure:
   - **Name**: `restaurant-pos-data`
   - **Mount Path**: `/data`
   - **Size**: `1 GB` (free tier limit)
4. Click **"Save"**

#### Step 3: Redeploy
1. Go to **"Manual Deploy"** tab
2. Click **"Deploy latest commit"**
3. Wait for deployment to complete

---

## 🔍 How to Verify It's Working

### 1. Check Disk Status
After deployment, go to **Disks** tab and confirm:
- ✅ Status: **Active**
- ✅ Mount Path: `/data`
- ✅ Size: `1 GB`

### 2. Test Data Persistence
1. **Create a test shop** in your Owner Portal
2. **Trigger a redeploy** (Manual Deploy → Deploy latest commit)
3. **Check if shop still exists** after deployment completes
4. ✅ If shop is still there → **FIXED!**
5. ❌ If shop is deleted → **Follow troubleshooting below**

---

## 🛠️ Troubleshooting

### Issue: Disk Not Showing in Dashboard

**Solution:**
1. Delete and recreate the service
2. During creation, enable **"Add Disk"** option
3. Configure disk BEFORE first deployment

### Issue: Data Still Being Lost

**Possible Causes:**

1. **Database file location is wrong**
   ```javascript
   // In server.js, check this line:
   const db = new sqlite3.Database('./restaurant.db');
   
   // Should be in the mounted directory:
   const db = new sqlite3.Database('/opt/render/project/src/restaurant.db');
   ```

2. **Multiple database files**
   - Check if code creates DB in different locations
   - Ensure all code uses the SAME path

3. **Disk not properly mounted**
   - Check Render logs for disk mount errors
   - Verify mount path matches your code

---

## 📊 Database Location

**Current Setup:**
- **Database File**: `restaurant.db`
- **Location**: `/data/restaurant.db` (persistent disk)
- **Uploads Directory**: `/data/uploads` (persistent disk)
- **Mount Point**: `/data`
- **Persistence**: ✅ Enabled (after fix)

**Before Fix:**
- Files stored in ephemeral storage → **DELETED on restart**

**After Fix:**
- Files stored in persistent disk → **SURVIVES restarts/deployments**

---

## 💾 Data Backup (Important!)

Even with persistent storage, **ALWAYS backup your data**:

### Method 1: Download via API
Visit this URL in your browser (logged in as owner):
```
https://restaurant-pos-system-1-7h0m.onrender.com/api/debug/backup-all-data
```

This downloads a JSON file with all your data.

### Method 2: Manual Dashboard Download
1. Go to Owner Portal → System tab
2. Click **"Download Full Backup (JSON)"**
3. Save the file safely

### Method 3: Scheduled Backups
Set a reminder to backup weekly:
- Monday at 9 AM: Download backup
- Store in Google Drive / Dropbox / Local folder

---

## 🚀 After Applying This Fix

### What Changes:
✅ **Shop data persists** across deployments  
✅ **Users remain** after service restarts  
✅ **Orders/bills saved** permanently  
✅ **Menu items preserved**  
✅ **No more automatic deletion**  

### What Stays the Same:
- Frontend URL (Vercel)
- Backend URL (Render)
- Login credentials
- All functionality

---

## 📝 Important Notes

1. **Free Tier Limit**: 1 GB persistent disk (plenty for SQLite)
2. **Disk Cannot Be Resized**: Plan ahead if you need more space
3. **Disk Persists Even If Service Deleted**: Must manually delete disk too
4. **Backup Regularly**: Persistent ≠ Immortal (hardware can fail)

---

## ⚠️ WARNING: Don't Do This

❌ **Don't delete the service** without backing up data first  
❌ **Don't change mount path** after deployment (will lose data)  
❌ **Don't skip backups** assuming disk is 100% safe  
❌ **Don't use multiple database files** in different locations  

---

## 🆘 Emergency Data Recovery

If shops were deleted and you need to recover:

### Option 1: Restore from Backup
1. Load your JSON backup file
2. Use the restore API endpoint (if implemented)
3. Or manually recreate shops from backup data

### Option 2: Check Old Logs
1. Go to Render Dashboard → Logs
2. Search for shop creation logs
3. Extract shop details from logs
4. Manually recreate

### Option 3: Contact Render Support
- Render may have temporary backups (within 24 hours)
- Ask if they can restore from snapshot

---

## ✅ Verification Checklist

After applying this fix, verify:

- [ ] Persistent disk shows in Render Dashboard
- [ ] Disk status is "Active"
- [ ] Mount path is `/opt/render/project/src`
- [ ] Create a test shop
- [ ] Trigger manual redeploy
- [ ] Test shop still exists after deployment
- [ ] Login still works
- [ ] All data preserved
- [ ] Download a backup for safety

---

## 📞 Need Help?

If data is still being lost after applying this fix:

1. Check Render logs for disk mount errors
2. Verify database file path in code
3. Ensure disk is properly attached
4. Contact Render support with service details

---

**THIS FIX IS CRITICAL - YOUR DATA WILL NOT SURVIVE WITHOUT IT!**

