const { app, BrowserWindow, ipcMain, Menu } = require('electron');
const path = require('path');
const isDev = require('electron-is-dev');
const sqlite3 = require('sqlite3').verbose();
const axios = require('axios');
const bcrypt = require('bcryptjs');

let mainWindow;
let localDB;

// Initialize local SQLite database
function initLocalDatabase() {
  const dbPath = path.join(app.getPath('userData'), 'restaurant-local.db');
  console.log('Local database path:', dbPath);
  
  localDB = new sqlite3.Database(dbPath, (err) => {
    if (err) {
      console.error('Error opening local database:', err);
    } else {
      console.log('Local database initialized');
      createLocalTables();
    }
  });
}

// Create local database tables (mirror of cloud schema)
function createLocalTables() {
  const tables = [
    `CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE,
      password TEXT,
      email TEXT,
      first_name TEXT,
      last_name TEXT,
      role TEXT,
      shop_id INTEGER,
      is_active BOOLEAN DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS shops (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE,
      owner_id INTEGER,
      address TEXT,
      phone TEXT,
      email TEXT,
      logo_url TEXT,
      currency TEXT DEFAULT 'USD',
      currency_symbol TEXT DEFAULT '$',
      tax_rate DECIMAL(5,2) DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS menu_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT,
      description TEXT,
      price DECIMAL(10,2),
      category TEXT,
      image_url TEXT,
      is_available BOOLEAN DEFAULT 1,
      shop_id INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS orders (
      id TEXT PRIMARY KEY,
      order_number TEXT,
      table_number TEXT,
      customer_name TEXT,
      customer_phone TEXT,
      order_type TEXT,
      total_amount DECIMAL(10,2),
      payment_status TEXT DEFAULT 'pending',
      payment_method TEXT,
      notes TEXT,
      shop_id INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS order_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id TEXT,
      menu_item_id INTEGER,
      quantity INTEGER,
      price DECIMAL(10,2),
      special_instructions TEXT
    )`,
    `CREATE TABLE IF NOT EXISTS bills (
      id TEXT PRIMARY KEY,
      order_id TEXT,
      table_number TEXT,
      subtotal DECIMAL(10,2),
      tax_amount DECIMAL(10,2),
      discount_amount DECIMAL(10,2),
      total_amount DECIMAL(10,2),
      payment_method TEXT,
      payment_status TEXT,
      shop_id INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS sync_queue (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      table_name TEXT,
      operation TEXT,
      data TEXT,
      synced BOOLEAN DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`
  ];

  localDB.serialize(() => {
    let completed = 0;
    tables.forEach(sql => {
      localDB.run(sql, (err) => {
        if (err) console.error('Error creating table:', err);
        completed++;
        if (completed === tables.length) {
          console.log('All tables created, checking for initial data...');
          setTimeout(() => {
            seedInitialDataNow();
          }, 500);
        }
      });
    });
  });
}

// Seed data after tables are ready
function seedInitialDataNow() {
  localDB.get('SELECT COUNT(*) as count FROM users', (err, row) => {
    if (err) {
      console.error('Error checking users:', err);
      return;
    }
    
    if (row && row.count > 0) {
      console.log('✅ Database already has users, skipping seed');
      return;
    }
    
    console.log('🌱 Seeding initial data...');
    
    localDB.serialize(() => {
      // Add default admin user
      localDB.run(`INSERT INTO users (id, username, password, email, first_name, last_name, role, is_active) 
        VALUES (1, 'admin', 'admin123', 'admin@restaurant.com', 'Admin', 'User', 'admin', 1)`, (err) => {
        if (err) console.error('Error creating admin:', err);
        else console.log('✅ Admin user created');
      });
      
      // Add default owner user with plain password
      localDB.run(`INSERT INTO users (id, username, password, email, first_name, last_name, role, is_active) 
        VALUES (2, 'owner', 'owner123', 'owner@restaurant.com', 'Owner', 'User', 'owner', 1)`, (err) => {
        if (err) console.error('Error creating owner:', err);
        else console.log('✅ Owner user created');
      });
      
      // Add sample menu items
      const menuItems = [
        { id: 1, name: 'Burger', price: 10.99, category: 'Main Course' },
        { id: 2, name: 'Pizza', price: 12.99, category: 'Main Course' },
        { id: 3, name: 'Pasta', price: 11.99, category: 'Main Course' },
        { id: 4, name: 'Salad', price: 7.99, category: 'Starters' },
        { id: 5, name: 'Soup', price: 6.99, category: 'Starters' },
        { id: 6, name: 'Coke', price: 2.99, category: 'Beverages' },
        { id: 7, name: 'Water', price: 1.99, category: 'Beverages' }
      ];
      
      menuItems.forEach((item) => {
        localDB.run(`INSERT INTO menu_items (id, name, price, category, is_available) 
          VALUES (?, ?, ?, ?, 1)`, [item.id, item.name, item.price, item.category], (err) => {
          if (err) console.error('Error creating menu item:', err);
        });
      });
      console.log('✅ Menu items created');
      
      // Add sample tables
      for (let i = 1; i <= 10; i++) {
        localDB.run(`INSERT INTO tables (id, table_number, capacity, status) 
          VALUES (?, ?, 4, 'Free')`, [i, i.toString()], (err) => {
          if (err) console.error('Error creating table:', err);
        });
      }
      console.log('✅ Tables created');
      
      // Add default settings
      const settings = {
        restaurant_name: 'My Restaurant',
        tax_rate: '10',
        currency: 'USD',
        currency_symbol: '$',
        enable_kds: 'true',
        enable_table_management: 'true',
        auto_print_bill: 'false',
        default_payment_method: 'Cash'
      };
      
      Object.entries(settings).forEach(([key, value]) => {
        localDB.run(`INSERT INTO settings (key, value) VALUES (?, ?)`, [key, value], (err) => {
          if (err) console.error('Error creating setting:', err);
        });
      });
      console.log('✅ Settings created');
      
      console.log('🎉 Initial data seeded successfully - Desktop app ready for offline use!');
    });
  });
}

// Check internet connectivity
async function checkConnectivity() {
  try {
    await axios.get('https://restaurant-pos-system-1-7h0m.onrender.com/api/debug/status', {
      timeout: 5000
    });
    return true;
  } catch (error) {
    return false;
  }
}

// Sync cloud data to local database
async function syncFromCloud() {
  const isOnline = await checkConnectivity();
  
  if (!isOnline) {
    console.log('Offline - skipping cloud sync');
    return { success: false, message: 'No internet connection' };
  }

  try {
    const token = ''; // Token not needed for basic data fetch
    const baseURL = 'https://restaurant-pos-system-1-7h0m.onrender.com/api';
    
    console.log('🔄 Starting cloud → local sync...');
    let synced = 0;
    
    // Sync menu items
    try {
      const menuResponse = await axios.get(`${baseURL}/menu`, { timeout: 15000 });
      
      // Delete and reinsert menu items
      localDB.run('DELETE FROM menu_items', async (err) => {
        if (!err && menuResponse.data) {
          for (const item of menuResponse.data) {
            localDB.run(`
              INSERT OR REPLACE INTO menu_items 
              (id, name, description, price, category, image_url, is_active, created_at)
              VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))
            `, [item.id, item.name, item.description, item.price, item.category, item.image_url, item.is_active !== false ? 1 : 0]);
          }
          synced++;
          console.log(`✅ Synced ${menuResponse.data.length} menu items`);
        }
      });
    } catch (error) {
      console.error('❌ Error syncing menu:', error.message);
    }
    
    console.log(`✅ Cloud sync completed (${synced} tables synced)`);
    return { success: true, message: `Synced ${synced} data tables`, count: synced };
    
  } catch (error) {
    console.error('❌ Cloud sync error:', error);
    return { success: false, message: error.message };
  }
}

// Sync local data to cloud
async function syncToCloud() {
  const isOnline = await checkConnectivity();
  
  if (!isOnline) {
    console.log('Offline - skipping sync');
    return;
  }

  localDB.all('SELECT * FROM sync_queue WHERE synced = 0', async (err, rows) => {
    if (err) {
      console.error('Error reading sync queue:', err);
      return;
    }

    for (const row of rows) {
      try {
        const data = JSON.parse(row.data);
        
        // Send to cloud API based on operation
        const endpoint = `https://restaurant-pos-system-1-7h0m.onrender.com/api/${row.table_name}`;
        
        if (row.operation === 'INSERT') {
          await axios.post(endpoint, data);
        } else if (row.operation === 'UPDATE') {
          await axios.put(`${endpoint}/${data.id}`, data);
        } else if (row.operation === 'DELETE') {
          await axios.delete(`${endpoint}/${data.id}`);
        }

        // Mark as synced
        localDB.run('UPDATE sync_queue SET synced = 1 WHERE id = ?', [row.id]);
        console.log('Synced:', row.table_name, row.operation);
        
      } catch (error) {
        console.error('Sync error:', error.message);
      }
    }
  });
}

// Create the main window
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1024,
    minHeight: 768,
    icon: path.join(__dirname, '../client/public/favicon.ico'),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: false,
      preload: path.join(__dirname, 'preload.js')
    },
    autoHideMenuBar: false,
    title: 'Restaurant POS System'
  });

  // Create custom menu
  const template = [
    {
      label: 'File',
      submenu: [
        {
          label: 'Sync Now',
          accelerator: 'CmdOrCtrl+R',
          click: () => syncToCloud()
        },
        { type: 'separator' },
        {
          label: 'Exit',
          accelerator: 'CmdOrCtrl+Q',
          click: () => app.quit()
        }
      ]
    },
    {
      label: 'View',
      submenu: [
        { role: 'reload' },
        { role: 'forceReload' },
        { role: 'toggleDevTools' },
        { type: 'separator' },
        { role: 'resetZoom' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
        { type: 'separator' },
        { role: 'togglefullscreen' }
      ]
    },
    {
      label: 'Window',
      submenu: [
        { role: 'minimize' },
        { role: 'zoom' },
        { role: 'close' }
      ]
    },
    {
      label: 'Help',
      submenu: [
        {
          label: 'About',
          click: () => {
            require('electron').dialog.showMessageBox({
              title: 'Restaurant POS System',
              message: 'Restaurant POS System v1.0.0',
              detail: 'Hybrid cloud-local POS system with offline support'
            });
          }
        }
      ]
    }
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);

  // Load the app
  const startUrl = isDev
    ? 'http://localhost:3000'
    : `file://${path.join(__dirname, '../client/build/index.html')}`;

  mainWindow.loadURL(startUrl);

  // Open DevTools in development
  if (isDev) {
    mainWindow.webContents.openDevTools();
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // Sync every 5 minutes
  setInterval(syncToCloud, 5 * 60 * 1000);
}

// App ready
app.whenReady().then(() => {
  initLocalDatabase();
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

// Quit when all windows are closed
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// IPC handlers for database operations
ipcMain.handle('db-query', async (event, sql, params) => {
  return new Promise((resolve, reject) => {
    console.log('🔍 DB Query:', sql, params);
    localDB.all(sql, params || [], (err, rows) => {
      if (err) {
        console.error('❌ DB Query Error:', err);
        reject(err);
      } else {
        console.log('✅ DB Query Result:', rows?.length || 0, 'rows');
        resolve(rows);
      }
    });
  });
});

ipcMain.handle('db-run', async (event, sql, params) => {
  return new Promise((resolve, reject) => {
    localDB.run(sql, params || [], function(err) {
      if (err) reject(err);
      else resolve({ lastID: this.lastID, changes: this.changes });
    });
  });
});

ipcMain.handle('check-connectivity', async () => {
  return await checkConnectivity();
});

ipcMain.handle('sync-to-cloud', async () => {
  await syncToCloud();
  return { success: true, message: 'Local data uploaded to cloud' };
});

ipcMain.handle('sync-from-cloud', async () => {
  const result = await syncFromCloud();
  return result;
});

ipcMain.handle('sync-bidirectional', async () => {
  console.log('🔄 Starting bidirectional sync...');
  const downloadResult = await syncFromCloud();
  const uploadResult = await syncToCloud();
  
  return {
    success: downloadResult.success || uploadResult.success,
    download: downloadResult,
    upload: uploadResult,
    message: 'Bidirectional sync completed'
  };
});

console.log('Electron main process started');

