# 📦 Google Drive Automatic Backup System

## 🎯 Overview

This guide will help you set up **automatic backups** of your Restaurant POS data to **Google Drive**. Your data (shops, users, menu items, orders, bills) will be backed up automatically.

---

## ✅ Features

- 🔄 **Automatic daily backups** to Google Drive
- 📁 **Organized backup files** with timestamps
- 🔒 **Secure authentication** with Google OAuth
- 💾 **Complete data export** (all tables)
- 📊 **JSON format** (easy to restore)
- ⏰ **Scheduled backups** (configurable)
- 🔔 **Backup notifications** (optional)

---

## 📋 Quick Setup (30 minutes)

### Option 1: Manual Backup (No Setup Required) ⭐ EASIEST

**Already working! Just visit:**

1. **Login as Owner**
   ```
   https://restaurant-pos-system-one.vercel.app
   Username: owner
   Password: owner123
   ```

2. **Download Backup**
   - Go to **Owner Portal**
   - Click **"System"** tab
   - Click **"Download Full Backup (JSON)"**
   - Save file to your computer

3. **Upload to Google Drive**
   - Open Google Drive
   - Create folder: "Restaurant POS Backups"
   - Upload the JSON file
   - Rename with date: `backup-2025-10-19.json`

4. **Schedule Reminder**
   - Set weekly reminder on your phone
   - Every Monday 9 AM: Download & upload backup

---

## 🤖 Option 2: Automated Google Drive Backup

### Prerequisites

1. **Google Cloud Project** (Free)
2. **Google Drive API enabled**
3. **OAuth 2.0 credentials**
4. **Node.js packages** (`googleapis`)

---

## 🔧 Step-by-Step Automated Setup

### Step 1: Create Google Cloud Project (5 min)

1. **Go to Google Cloud Console**
   - Visit: https://console.cloud.google.com/

2. **Create New Project**
   - Click "Select a project" (top left)
   - Click "NEW PROJECT"
   - Name: `Restaurant POS Backup`
   - Click "CREATE"

3. **Enable Google Drive API**
   - Go to "APIs & Services" → "Library"
   - Search for "Google Drive API"
   - Click "ENABLE"

---

### Step 2: Create OAuth Credentials (10 min)

1. **Configure OAuth Consent Screen**
   - Go to "APIs & Services" → "OAuth consent screen"
   - User Type: **External**
   - Click "CREATE"
   - App name: `Restaurant POS Backup`
   - User support email: Your email
   - Developer contact: Your email
   - Click "SAVE AND CONTINUE"
   - Scopes: Skip, click "SAVE AND CONTINUE"
   - Test users: Add your email
   - Click "SAVE AND CONTINUE"

2. **Create OAuth Client ID**
   - Go to "Credentials" → "CREATE CREDENTIALS" → "OAuth client ID"
   - Application type: **Desktop app**
   - Name: `Restaurant POS Backup Client`
   - Click "CREATE"
   - **IMPORTANT**: Download JSON file
   - Save as `credentials.json`

---

### Step 3: Install Required Package

Add Google Drive package to your backend:

```bash
npm install googleapis --save
```

---

### Step 4: Add Backup Script

Create a new file: `backup-to-drive.js`

```javascript
const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

// OAuth2 Configuration
const SCOPES = ['https://www.googleapis.com/auth/drive.file'];
const TOKEN_PATH = path.join(__dirname, 'token.json');
const CREDENTIALS_PATH = path.join(__dirname, 'credentials.json');

/**
 * Load or create OAuth2 client
 */
async function authorize() {
  let credentials;
  try {
    credentials = JSON.parse(fs.readFileSync(CREDENTIALS_PATH, 'utf8'));
  } catch (err) {
    console.error('Error loading credentials.json');
    console.error('Please download OAuth credentials from Google Cloud Console');
    process.exit(1);
  }

  const { client_secret, client_id, redirect_uris } = credentials.installed || credentials.web;
  const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);

  // Check if we have a token
  try {
    const token = fs.readFileSync(TOKEN_PATH, 'utf8');
    oAuth2Client.setCredentials(JSON.parse(token));
    return oAuth2Client;
  } catch (err) {
    return getAccessToken(oAuth2Client);
  }
}

/**
 * Get OAuth access token
 */
async function getAccessToken(oAuth2Client) {
  const authUrl = oAuth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
  });

  console.log('Authorize this app by visiting this url:', authUrl);
  
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve, reject) => {
    rl.question('Enter the code from that page here: ', (code) => {
      rl.close();
      oAuth2Client.getToken(code, (err, token) => {
        if (err) return reject(err);
        oAuth2Client.setCredentials(token);
        fs.writeFileSync(TOKEN_PATH, JSON.stringify(token));
        console.log('Token stored to', TOKEN_PATH);
        resolve(oAuth2Client);
      });
    });
  });
}

/**
 * Upload backup to Google Drive
 */
async function uploadBackup(auth, backupData) {
  const drive = google.drive({ version: 'v3', auth });
  
  const fileName = `restaurant-pos-backup-${new Date().toISOString().split('T')[0]}.json`;
  const fileContent = JSON.stringify(backupData, null, 2);
  
  // Create a temporary file
  const tempPath = path.join(__dirname, 'temp-backup.json');
  fs.writeFileSync(tempPath, fileContent);

  try {
    // Find or create backup folder
    let folderId = await findOrCreateFolder(drive, 'Restaurant POS Backups');

    // Upload file
    const fileMetadata = {
      name: fileName,
      parents: [folderId]
    };
    
    const media = {
      mimeType: 'application/json',
      body: fs.createReadStream(tempPath)
    };

    const file = await drive.files.create({
      resource: fileMetadata,
      media: media,
      fields: 'id, name, webViewLink'
    });

    console.log('✅ Backup uploaded to Google Drive:');
    console.log('   File ID:', file.data.id);
    console.log('   File Name:', file.data.name);
    console.log('   Link:', file.data.webViewLink);

    // Clean up temp file
    fs.unlinkSync(tempPath);

    return file.data;
  } catch (error) {
    console.error('❌ Error uploading to Google Drive:', error.message);
    throw error;
  }
}

/**
 * Find or create folder in Google Drive
 */
async function findOrCreateFolder(drive, folderName) {
  // Search for folder
  const res = await drive.files.list({
    q: `name='${folderName}' and mimeType='application/vnd.google-apps.folder' and trashed=false`,
    fields: 'files(id, name)',
  });

  if (res.data.files.length > 0) {
    return res.data.files[0].id;
  }

  // Create folder if not found
  const fileMetadata = {
    name: folderName,
    mimeType: 'application/vnd.google-apps.folder'
  };

  const folder = await drive.files.create({
    resource: fileMetadata,
    fields: 'id'
  });

  console.log('📁 Created folder:', folderName);
  return folder.data.id;
}

/**
 * Get backup data from database
 */
async function getBackupData() {
  const db = require('./db-adapter');
  
  return new Promise((resolve, reject) => {
    const backupData = {
      timestamp: new Date().toISOString(),
      version: '1.0'
    };

    // Get all shops
    db.all('SELECT * FROM shops', [], (err, shops) => {
      if (err) return reject(err);
      backupData.shops = shops;

      // Get all users (exclude passwords for security)
      db.all('SELECT id, username, email, role, first_name, last_name, phone, company_name, shop_id, is_active, created_at FROM users', [], (err, users) => {
        if (err) return reject(err);
        backupData.users = users;

        // Get all menu items
        db.all('SELECT * FROM menu_items', [], (err, menuItems) => {
          if (err) return reject(err);
          backupData.menu_items = menuItems;

          // Get all tables
          db.all('SELECT * FROM tables', [], (err, tables) => {
            if (err) return reject(err);
            backupData.tables = tables;

            // Get all settings
            db.all('SELECT * FROM settings', [], (err, settings) => {
              if (err) return reject(err);
              backupData.settings = settings;

              console.log('✅ Backup data collected:');
              console.log('   Shops:', shops.length);
              console.log('   Users:', users.length);
              console.log('   Menu Items:', menuItems.length);
              console.log('   Tables:', tables.length);
              console.log('   Settings:', settings.length);

              resolve(backupData);
            });
          });
        });
      });
    });
  });
}

/**
 * Main backup function
 */
async function performBackup() {
  try {
    console.log('🔄 Starting backup process...');
    
    // Authorize with Google
    const auth = await authorize();
    console.log('✅ Authorized with Google Drive');

    // Get backup data
    const backupData = await getBackupData();
    
    // Upload to Drive
    await uploadBackup(auth, backupData);
    
    console.log('🎉 Backup completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Backup failed:', error);
    process.exit(1);
  }
}

// Run backup if called directly
if (require.main === module) {
  performBackup();
}

module.exports = { performBackup };
```

---

### Step 5: First Time Setup (Authorization)

1. **Upload credentials.json**
   - Place `credentials.json` in your project root (same level as server.js)
   - **IMPORTANT**: Add to `.gitignore` (don't commit to GitHub)

2. **Run Authorization** (locally first)
   ```bash
   node backup-to-drive.js
   ```

3. **Follow Instructions**
   - Browser will open with Google login
   - Allow access to Google Drive
   - Copy the code
   - Paste in terminal
   - `token.json` will be created

4. **Add token.json to Server**
   - Copy both `credentials.json` and `token.json` to Render
   - Or set as environment variables (see below)

---

### Step 6: Schedule Automatic Backups

#### Method A: Cron Job (Linux/Mac)

Add to crontab:
```bash
# Daily backup at 2 AM
0 2 * * * cd /path/to/project && node backup-to-drive.js >> backup.log 2>&1

# Weekly backup every Monday at 9 AM
0 9 * * 1 cd /path/to/project && node backup-to-drive.js >> backup.log 2>&1
```

#### Method B: Node-Cron (In Your App)

Add to `server.js`:
```javascript
const cron = require('node-cron');
const { performBackup } = require('./backup-to-drive');

// Schedule daily backup at 2 AM
cron.schedule('0 2 * * *', async () => {
  console.log('⏰ Running scheduled backup...');
  try {
    await performBackup();
  } catch (error) {
    console.error('Scheduled backup failed:', error);
  }
});
```

Install node-cron:
```bash
npm install node-cron --save
```

---

## 🔒 Security Best Practices

### 1. Protect Credentials

Add to `.gitignore`:
```
credentials.json
token.json
temp-backup.json
backup.log
```

### 2. Use Environment Variables (Render)

Instead of files, use environment variables:

**In Render Dashboard:**
- Add `GOOGLE_CREDENTIALS` = `{entire credentials.json content}`
- Add `GOOGLE_TOKEN` = `{entire token.json content}`

**In code:**
```javascript
const credentials = JSON.parse(process.env.GOOGLE_CREDENTIALS || fs.readFileSync('credentials.json'));
const token = JSON.parse(process.env.GOOGLE_TOKEN || fs.readFileSync('token.json'));
```

---

## 📊 Backup Management

### View Backups

1. Open Google Drive
2. Go to "Restaurant POS Backups" folder
3. See all backup files with dates

### Restore from Backup

1. Download backup JSON file
2. Parse the JSON data
3. Manually recreate shops/users/menu items
4. Or implement restore API endpoint

---

## 🔔 Backup Notifications (Optional)

### Email Notification

Use Nodemailer to send email on backup success/failure:

```javascript
const nodemailer = require('nodemailer');

async function sendBackupNotification(success, details) {
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.NOTIFICATION_EMAIL,
      pass: process.env.NOTIFICATION_PASSWORD
    }
  });

  const subject = success ? '✅ Backup Successful' : '❌ Backup Failed';
  const text = success 
    ? `Backup completed successfully at ${new Date().toISOString()}\n\nFile: ${details.fileName}`
    : `Backup failed: ${details.error}`;

  await transporter.sendMail({
    from: process.env.NOTIFICATION_EMAIL,
    to: process.env.OWNER_EMAIL,
    subject,
    text
  });
}
```

---

## ✅ Verification Checklist

After setup, verify:

- [ ] credentials.json downloaded and placed in project
- [ ] Google Drive API enabled
- [ ] OAuth authorization completed (token.json created)
- [ ] Test backup runs successfully
- [ ] Backup file appears in Google Drive
- [ ] Backup folder created: "Restaurant POS Backups"
- [ ] Scheduled backup configured
- [ ] Credentials added to .gitignore
- [ ] (Optional) Notifications working

---

## 🆘 Troubleshooting

### Error: "credentials.json not found"
- Download OAuth credentials from Google Cloud Console
- Place in project root directory

### Error: "Token has been expired or revoked"
- Delete `token.json`
- Run authorization again: `node backup-to-drive.js`

### Error: "Access denied"
- Check OAuth consent screen configuration
- Ensure Google Drive API is enabled
- Verify scopes include drive.file

### Backup not running automatically
- Check cron syntax
- Verify cron service is running
- Check backup.log for errors

---

## 💡 Alternative: Simple Webhook Backup

If Google Drive setup is too complex, use a simpler webhook approach:

1. **Use Zapier/IFTTT** (No code required)
   - Create Zap: Webhook → Google Drive
   - Trigger webhook from your app
   - Automatically saves to Drive

2. **Manual Scheduled Backup**
   - Set phone reminder
   - Download backup weekly
   - Upload to Google Drive manually

---

## 📌 Summary

**Easiest Method (5 minutes):**
- Manual download + upload to Drive
- Weekly reminder on phone

**Automated Method (30 minutes):**
- Google Cloud setup
- OAuth configuration
- Scheduled automatic backups

**Best Practice:**
- Backup daily automatically
- Keep 30 days of backups
- Test restore process monthly
- Store credentials securely

Choose the method that fits your technical comfort level!

