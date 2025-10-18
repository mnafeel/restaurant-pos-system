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
  
  // Try environment variable first (for Render deployment)
  if (process.env.GOOGLE_CREDENTIALS) {
    try {
      credentials = JSON.parse(process.env.GOOGLE_CREDENTIALS);
      console.log('✅ Loaded credentials from environment variable');
    } catch (err) {
      console.error('❌ Error parsing GOOGLE_CREDENTIALS env var');
      throw err;
    }
  } else {
    // Fall back to file (for local development)
    try {
      credentials = JSON.parse(fs.readFileSync(CREDENTIALS_PATH, 'utf8'));
      console.log('✅ Loaded credentials from credentials.json');
    } catch (err) {
      console.error('❌ Error loading credentials.json');
      console.error('Please download OAuth credentials from Google Cloud Console');
      console.error('Or set GOOGLE_CREDENTIALS environment variable');
      throw err;
    }
  }

  const { client_secret, client_id, redirect_uris } = credentials.installed || credentials.web;
  const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);

  // Check if we have a token
  let token;
  if (process.env.GOOGLE_TOKEN) {
    try {
      token = JSON.parse(process.env.GOOGLE_TOKEN);
      console.log('✅ Loaded token from environment variable');
    } catch (err) {
      console.error('❌ Error parsing GOOGLE_TOKEN env var');
      throw err;
    }
  } else {
    try {
      token = JSON.parse(fs.readFileSync(TOKEN_PATH, 'utf8'));
      console.log('✅ Loaded token from token.json');
    } catch (err) {
      console.log('⚠️  No token found, need to authorize');
      return getAccessToken(oAuth2Client);
    }
  }

  oAuth2Client.setCredentials(token);
  return oAuth2Client;
}

/**
 * Get OAuth access token
 */
async function getAccessToken(oAuth2Client) {
  const authUrl = oAuth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
  });

  console.log('🔐 Authorize this app by visiting this url:', authUrl);
  console.log('');
  
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve, reject) => {
    rl.question('Enter the code from that page here: ', (code) => {
      rl.close();
      oAuth2Client.getToken(code, (err, token) => {
        if (err) {
          console.error('❌ Error retrieving access token', err);
          return reject(err);
        }
        oAuth2Client.setCredentials(token);
        
        // Save token
        try {
          fs.writeFileSync(TOKEN_PATH, JSON.stringify(token));
          console.log('✅ Token stored to', TOKEN_PATH);
          console.log('💡 TIP: Set GOOGLE_TOKEN environment variable with this content for Render deployment');
        } catch (err) {
          console.warn('⚠️  Could not save token to file (this is OK on Render)');
        }
        
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
  
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0];
  const fileName = `restaurant-pos-backup-${timestamp}.json`;
  const fileContent = JSON.stringify(backupData, null, 2);
  
  // Create a temporary file
  const tempPath = path.join(__dirname, 'temp-backup.json');
  fs.writeFileSync(tempPath, fileContent);

  try {
    // Find or create backup folder
    console.log('📁 Finding or creating backup folder...');
    let folderId = await findOrCreateFolder(drive, 'Restaurant POS Backups');

    // Upload file
    console.log('📤 Uploading backup to Google Drive...');
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

    console.log('');
    console.log('✅ Backup uploaded successfully!');
    console.log('   File ID:', file.data.id);
    console.log('   File Name:', file.data.name);
    console.log('   View Link:', file.data.webViewLink);
    console.log('');

    // Clean up temp file
    fs.unlinkSync(tempPath);

    return file.data;
  } catch (error) {
    console.error('❌ Error uploading to Google Drive:', error.message);
    
    // Clean up temp file on error
    try {
      fs.unlinkSync(tempPath);
    } catch (e) {}
    
    throw error;
  }
}

/**
 * Find or create folder in Google Drive
 */
async function findOrCreateFolder(drive, folderName) {
  try {
    // Search for folder
    const res = await drive.files.list({
      q: `name='${folderName}' and mimeType='application/vnd.google-apps.folder' and trashed=false`,
      fields: 'files(id, name)',
      spaces: 'drive'
    });

    if (res.data.files.length > 0) {
      console.log('✅ Found existing folder:', folderName);
      return res.data.files[0].id;
    }

    // Create folder if not found
    console.log('📁 Creating new folder:', folderName);
    const fileMetadata = {
      name: folderName,
      mimeType: 'application/vnd.google-apps.folder'
    };

    const folder = await drive.files.create({
      resource: fileMetadata,
      fields: 'id'
    });

    console.log('✅ Folder created:', folderName);
    return folder.data.id;
  } catch (error) {
    console.error('❌ Error with folder operations:', error.message);
    throw error;
  }
}

/**
 * Get backup data from database
 */
async function getBackupData() {
  console.log('📊 Collecting data from database...');
  const db = require('./db-adapter');
  
  return new Promise((resolve, reject) => {
    const backupData = {
      timestamp: new Date().toISOString(),
      backup_date: new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }),
      version: '1.0',
      database_type: db.type || 'sqlite'
    };

    // Get all shops
    db.all('SELECT * FROM shops WHERE is_active = 1', [], (err, shops) => {
      if (err) {
        console.error('❌ Error fetching shops:', err.message);
        return reject(err);
      }
      backupData.shops = shops || [];

      // Get all users (exclude passwords for security)
      db.all('SELECT id, username, email, role, first_name, last_name, phone, company_name, shop_id, is_active, created_at FROM users WHERE is_active = 1', [], (err, users) => {
        if (err) {
          console.error('❌ Error fetching users:', err.message);
          return reject(err);
        }
        backupData.users = users || [];

        // Get all menu items
        db.all('SELECT * FROM menu_items WHERE is_available = 1', [], (err, menuItems) => {
          if (err) {
            console.error('❌ Error fetching menu items:', err.message);
            return reject(err);
          }
          backupData.menu_items = menuItems || [];

          // Get all tables
          db.all('SELECT * FROM tables', [], (err, tables) => {
            if (err) {
              console.error('❌ Error fetching tables:', err.message);
              return reject(err);
            }
            backupData.tables = tables || [];

            // Get all settings
            db.all('SELECT * FROM settings', [], (err, settings) => {
              if (err) {
                console.error('❌ Error fetching settings:', err.message);
                return reject(err);
              }
              backupData.settings = settings || [];

              console.log('');
              console.log('✅ Data collected successfully:');
              console.log('   📦 Shops:', backupData.shops.length);
              console.log('   👥 Users:', backupData.users.length);
              console.log('   🍽️  Menu Items:', backupData.menu_items.length);
              console.log('   🪑 Tables:', backupData.tables.length);
              console.log('   ⚙️  Settings:', backupData.settings.length);
              console.log('');

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
    console.log('');
    console.log('========================================');
    console.log('  🔄 RESTAURANT POS BACKUP SYSTEM');
    console.log('========================================');
    console.log('');
    console.log('⏰ Started at:', new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
    console.log('');

    // Authorize with Google
    console.log('🔐 Authorizing with Google Drive...');
    const auth = await authorize();
    console.log('✅ Authorization successful!');
    console.log('');

    // Get backup data
    const backupData = await getBackupData();
    
    // Upload to Drive
    await uploadBackup(auth, backupData);
    
    console.log('========================================');
    console.log('  🎉 BACKUP COMPLETED SUCCESSFULLY!');
    console.log('========================================');
    console.log('');
    
    return { success: true, data: backupData };
  } catch (error) {
    console.error('');
    console.error('========================================');
    console.error('  ❌ BACKUP FAILED!');
    console.error('========================================');
    console.error('');
    console.error('Error:', error.message);
    console.error('');
    
    if (error.stack) {
      console.error('Stack trace:', error.stack);
    }
    
    throw error;
  }
}

// Run backup if called directly
if (require.main === module) {
  performBackup()
    .then(() => {
      process.exit(0);
    })
    .catch((error) => {
      process.exit(1);
    });
}

module.exports = { performBackup, getBackupData };

