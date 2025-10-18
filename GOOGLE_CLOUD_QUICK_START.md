# 🚀 Google Cloud Quick Start - Automated Backups

## ✅ Step-by-Step Guide (30 minutes)

Follow these steps carefully to set up automated backups to Google Drive.

---

## 📋 STEP 1: Create Google Cloud Project (5 minutes)

### 1.1 Go to Google Cloud Console
- Open: https://console.cloud.google.com/
- Login with your Google account (Gmail)

### 1.2 Create New Project
1. Click **"Select a project"** at the top (next to Google Cloud logo)
2. Click **"NEW PROJECT"** button
3. **Project name**: Type `Restaurant-POS-Backup`
4. **Organization**: Leave as "No organization"
5. Click **"CREATE"**
6. Wait 30 seconds for project creation
7. Click **"SELECT PROJECT"** when it appears

✅ **Checkpoint**: You should see "Restaurant-POS-Backup" at the top

---

## 📋 STEP 2: Enable Google Drive API (2 minutes)

### 2.1 Go to APIs Library
1. Click **☰ (menu icon)** top left
2. Click **"APIs & Services"** → **"Library"**
3. Or direct link: https://console.cloud.google.com/apis/library

### 2.2 Enable the API
1. In search box, type: `Google Drive API`
2. Click **"Google Drive API"** (first result)
3. Click **"ENABLE"** button (blue button)
4. Wait 10 seconds

✅ **Checkpoint**: You should see "API enabled" checkmark

---

## 📋 STEP 3: Configure OAuth Consent Screen (5 minutes)

### 3.1 Go to OAuth Consent
1. Click **☰ (menu)** → **"APIs & Services"** → **"OAuth consent screen"**
2. Or direct link: https://console.cloud.google.com/apis/credentials/consent

### 3.2 Configure Consent Screen
1. **User Type**: Select **"External"** (radio button)
2. Click **"CREATE"**

### 3.3 Fill App Information (Page 1)
1. **App name**: `Restaurant POS Backup`
2. **User support email**: Select your email from dropdown
3. **App logo**: Skip (leave empty)
4. **Application home page**: Skip (leave empty)
5. **Authorized domains**: Skip (leave empty)
6. **Developer contact information**: Enter your email
7. Click **"SAVE AND CONTINUE"**

### 3.4 Scopes (Page 2)
1. Click **"ADD OR REMOVE SCOPES"**
2. Scroll down and find: `../auth/drive.file`
3. Check the box next to it
4. Click **"UPDATE"** at bottom
5. Click **"SAVE AND CONTINUE"**

### 3.5 Test Users (Page 3)
1. Click **"+ ADD USERS"**
2. Enter your Gmail address
3. Click **"ADD"**
4. Click **"SAVE AND CONTINUE"**

### 3.6 Summary (Page 4)
1. Review information
2. Click **"BACK TO DASHBOARD"**

✅ **Checkpoint**: OAuth consent screen configured

---

## 📋 STEP 4: Create OAuth Credentials (5 minutes)

### 4.1 Go to Credentials
1. Click **☰ (menu)** → **"APIs & Services"** → **"Credentials"**
2. Or direct link: https://console.cloud.google.com/apis/credentials

### 4.2 Create Credentials
1. Click **"+ CREATE CREDENTIALS"** (top blue button)
2. Select **"OAuth client ID"**

### 4.3 Configure OAuth Client
1. **Application type**: Select **"Desktop app"** from dropdown
2. **Name**: Type `POS Backup Desktop Client`
3. Click **"CREATE"**

### 4.4 Download Credentials
1. A popup appears: "OAuth client created"
2. Click **"DOWNLOAD JSON"** button
3. **IMPORTANT**: Save this file
4. Rename it to: `credentials.json`
5. Click **"OK"** to close popup

✅ **Checkpoint**: You have `credentials.json` file downloaded

---

## 📋 STEP 5: Setup on Your Computer (10 minutes)

### 5.1 Install Google APIs Package

Open terminal/command prompt and run:

```bash
cd /Users/admin/restaurant-billing-system
npm install googleapis
```

Wait for installation to complete.

### 5.2 Add credentials.json

1. **Locate** your downloaded `credentials.json` file
2. **Copy** it to your project folder
3. **Place** it in: `/Users/admin/restaurant-billing-system/credentials.json`
4. It should be in the same folder as `server.js`

### 5.3 Verify File Location

Run this command to check:

```bash
ls -la | grep credentials.json
```

You should see: `credentials.json`

---

## 📋 STEP 6: First Authorization (5 minutes)

### 6.1 Run Backup Script

```bash
node backup-to-drive.js
```

### 6.2 Authorize the App

You'll see output like:
```
🔐 Authorize this app by visiting this url: https://accounts.google.com/o/oauth2/v2/auth?...
```

1. **Copy** the entire URL
2. **Paste** it in your browser
3. **Login** with your Google account (if asked)
4. Click **"Continue"** (ignore "Google hasn't verified" warning - it's your own app)
5. Click **"Continue"** again
6. Check the box: **"Allow access to Google Drive"**
7. Click **"Continue"**
8. You'll see: **"Please copy this code..."**
9. **Copy** the code

### 6.3 Enter Code

1. Go back to terminal
2. You'll see: `Enter the code from that page here:`
3. **Paste** the code
4. Press **Enter**

### 6.4 Wait for Backup

You'll see:
```
✅ Token stored to token.json
✅ Authorization successful!
📊 Collecting data from database...
📁 Finding or creating backup folder...
📤 Uploading backup to Google Drive...
✅ Backup uploaded successfully!
   File Name: restaurant-pos-backup-2025-10-19.json
   View Link: https://drive.google.com/...
🎉 BACKUP COMPLETED SUCCESSFULLY!
```

✅ **Checkpoint**: First backup completed!

---

## 📋 STEP 7: Verify in Google Drive (2 minutes)

### 7.1 Open Google Drive
1. Go to: https://drive.google.com/
2. Look for folder: **"Restaurant POS Backups"**
3. Click on it
4. You should see your backup file: `restaurant-pos-backup-2025-10-19.json`
5. Click on it to open/view

✅ **Success!** Your first automated backup is complete!

---

## 📋 STEP 8: Schedule Automatic Backups (Optional)

### Option A: Manual Run (Simplest)

Whenever you want a backup, just run:
```bash
cd /Users/admin/restaurant-billing-system
node backup-to-drive.js
```

### Option B: Weekly Cron Job (Mac/Linux)

1. Open crontab:
```bash
crontab -e
```

2. Add this line (press `i` to insert):
```bash
0 9 * * 1 cd /Users/admin/restaurant-billing-system && node backup-to-drive.js >> backup.log 2>&1
```
This runs every Monday at 9 AM.

3. Save and exit (press `Esc`, type `:wq`, press Enter)

4. Verify:
```bash
crontab -l
```

### Option C: Scheduled Task (Windows)

1. Open **Task Scheduler**
2. Create Basic Task
3. Name: `POS Backup`
4. Trigger: **Weekly** (Monday, 9 AM)
5. Action: **Start a program**
6. Program: `C:\Program Files\nodejs\node.exe`
7. Arguments: `backup-to-drive.js`
8. Start in: `C:\path\to\restaurant-billing-system`
9. Finish

---

## 🔒 SECURITY: Deploy to Render (Optional)

If you want automated backups on Render server:

### 1. Convert credentials to environment variables

```bash
# In your project folder
cat credentials.json | pbcopy  # Mac (copies to clipboard)
# Or just open credentials.json and copy the content
```

### 2. Add to Render

1. Go to Render Dashboard
2. Click your backend service
3. Go to **"Environment"** tab
4. Add variable:
   - **Key**: `GOOGLE_CREDENTIALS`
   - **Value**: Paste the entire credentials.json content
5. Add another variable:
   - **Key**: `GOOGLE_TOKEN`
   - **Value**: Paste the entire token.json content
6. Click **"Save Changes"**

### 3. Schedule on Render

Add to your `server.js` (at the bottom, before `const PORT`):

```javascript
// Scheduled backups
const cron = require('node-cron');
const { performBackup } = require('./backup-to-drive');

// Run backup every Monday at 2 AM (server time)
cron.schedule('0 2 * * 1', async () => {
  console.log('⏰ Running scheduled backup...');
  try {
    await performBackup();
    console.log('✅ Scheduled backup completed');
  } catch (error) {
    console.error('❌ Scheduled backup failed:', error);
  }
}, {
  timezone: "Asia/Kolkata"
});
```

---

## ✅ Testing Checklist

After setup, verify:

- [ ] Google Cloud project created
- [ ] Google Drive API enabled
- [ ] OAuth consent screen configured
- [ ] OAuth credentials downloaded (credentials.json)
- [ ] credentials.json placed in project folder
- [ ] googleapis package installed
- [ ] First authorization completed (token.json created)
- [ ] First backup uploaded to Google Drive
- [ ] Backup file visible in Drive folder
- [ ] Can download and view backup JSON
- [ ] (Optional) Scheduled backup configured

---

## 🆘 Troubleshooting

### "credentials.json not found"
**Solution**: Make sure the file is in the project root folder (same level as server.js)

### "Token has been expired or revoked"
**Solution**: Delete `token.json` and run authorization again:
```bash
rm token.json
node backup-to-drive.js
```

### "Access blocked: This app's request is invalid"
**Solution**: 
1. Make sure you added your email as a test user
2. Go to OAuth consent screen
3. Add your email under "Test users"

### "The API returned an error: 403 insufficientPermissions"
**Solution**: 
1. Check you selected the right scope (drive.file)
2. Delete token.json and authorize again

### "Error fetching user: ... no such table: users"
**Solution**: Your database is empty. Either:
1. Setup PostgreSQL first
2. Or create some test data in the app

---

## 📊 What Gets Backed Up

Every backup includes:
- ✅ All shops (name, address, phone, email, etc.)
- ✅ All users (username, email, role - passwords excluded)
- ✅ All menu items (name, price, category, image URLs)
- ✅ All tables (number, capacity, status)
- ✅ All settings (tax rate, currency, etc.)
- ✅ Metadata (timestamp, database type)

**Format**: Clean JSON file, easy to read and restore

---

## 🎯 Quick Reference Commands

```bash
# Test backup manually
node backup-to-drive.js

# Check credentials exist
ls credentials.json

# Check token exists (after first auth)
ls token.json

# View backup log (if using cron)
cat backup.log

# Test cron schedule (dry run)
crontab -l
```

---

## 🎉 You're Done!

**Congratulations!** You now have:
- ✅ Automated backup system
- ✅ Backups stored in Google Drive
- ✅ Organized backup folder
- ✅ (Optional) Scheduled automatic backups

**Next Steps:**
1. Test by running: `node backup-to-drive.js`
2. Check Google Drive for backup file
3. Set up schedule if you haven't
4. Verify weekly backups are working

**Keep `credentials.json` and `token.json` SAFE** - they give access to your Google Drive!

---

## 💡 Pro Tips

1. **Test Monthly**: Run manual backup once a month to verify it still works
2. **Check Drive Space**: Google Drive free tier = 15 GB (plenty for backups)
3. **Old Backups**: Delete backups older than 30 days to save space
4. **Restore Test**: Download a backup and verify you can read the JSON
5. **Multiple Accounts**: You can backup to multiple Google accounts if needed

---

Need help? Check the full guide: `GOOGLE_DRIVE_BACKUP.md`

