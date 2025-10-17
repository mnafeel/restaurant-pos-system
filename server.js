const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const bodyParser = require('body-parser');
const { v4: uuidv4 } = require('uuid');
const moment = require('moment-timezone');

// Set default timezone to Indian Standard Time
moment.tz.setDefault('Asia/Kolkata');
process.env.TZ = 'Asia/Kolkata';

const path = require('path');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const { body, validationResult } = require('express-validator');
const multer = require('multer');
const fs = require('fs');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

const PORT = process.env.PORT || 5002;
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production';

// Trust proxy for rate limiting
app.set('trust proxy', 1);

// Security middleware - Disable CSP for development
app.use(helmet({
  contentSecurityPolicy: false,
}));
// CORS configuration - allow Vercel and Render domains
const allowedOrigins = [
  'http://localhost:3000',
  'https://restaurant-pos-frontend.onrender.com',
  'https://restaurant-pos-system.vercel.app',
  'https://restaurant-pos-system-mnafeel.vercel.app',
  /\.vercel\.app$/,  // Any Vercel domain
  /\.onrender\.com$/ // Any Render domain
];

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl)
    if (!origin) return callback(null, true);
    
    // Check if origin is allowed
    const isAllowed = allowedOrigins.some(allowed => {
      if (typeof allowed === 'string') {
        return allowed === origin;
      } else if (allowed instanceof RegExp) {
        return allowed.test(origin);
      }
      return false;
    });
    
    if (isAllowed) {
      callback(null, true);
    } else {
      console.log('CORS blocked origin:', origin);
      callback(null, true); // Allow anyway for now (can restrict later)
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Rate limiting
// Rate limiting disabled for development
// const limiter = rateLimit({
//   windowMs: 15 * 60 * 1000,
//   max: 100
// });
// app.use('/api/', limiter);

// const authLimiter = rateLimit({
//   windowMs: 15 * 60 * 1000,
//   max: 5
// });
// app.use('/api/auth/', authLimiter);

// Middleware
app.use(bodyParser.json());

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
}

// Create subdirectories for different upload types
['avatars', 'shop-logos'].forEach(dir => {
  const dirPath = path.join(uploadsDir, dir);
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath);
  }
});

// Serve uploaded files with explicit CORS headers
app.use('/uploads', (req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  res.header('Cross-Origin-Resource-Policy', 'cross-origin');
  next();
}, express.static(path.join(__dirname, 'uploads')));

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    let uploadType = 'menu-items'; // default
    if (req.path.includes('/avatar')) {
      uploadType = 'avatars';
    } else if (req.path.includes('/logo')) {
      uploadType = 'shop-logos';
    } else if (req.path.includes('/menu')) {
      uploadType = 'menu-items';
    }
    cb(null, path.join(uploadsDir, uploadType));
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  // Accept images only
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed!'), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
});

// Authentication middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
};

// Role-based authorization middleware
const authorize = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    
    next();
  };
};

// Utility function to get current IST time
const getCurrentISTTime = () => {
  return moment().tz('Asia/Kolkata');
};

// Utility function to format date for Indian locale
const formatIndianDate = (date) => {
  return moment(date).tz('Asia/Kolkata').format('DD/MM/YYYY hh:mm A');
};

// Database setup - automatically uses PostgreSQL on Vercel, SQLite locally
const db = require('./db-adapter');

// Initialize database tables
db.serialize(() => {
  // Users table
  db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'cashier',
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    phone TEXT,
    avatar_url TEXT,
    is_active BOOLEAN DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // Tables table with enhanced fields
  db.run(`CREATE TABLE IF NOT EXISTS tables (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    table_number TEXT UNIQUE NOT NULL,
    status TEXT DEFAULT 'Free',
    capacity INTEGER DEFAULT 4,
    location TEXT DEFAULT 'main',
    current_order_id TEXT,
    merged_with TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (current_order_id) REFERENCES orders (id)
  )`);

  // Categories table
  db.run(`CREATE TABLE IF NOT EXISTS categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT UNIQUE NOT NULL,
    display_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // Menu variants table
  db.run(`CREATE TABLE IF NOT EXISTS menu_variants (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    menu_item_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    price_adjustment DECIMAL(10,2) DEFAULT 0,
    is_available BOOLEAN DEFAULT 1,
    FOREIGN KEY (menu_item_id) REFERENCES menu_items (id) ON DELETE CASCADE
  )`);

  // Menu items table with enhanced fields
  db.run(`CREATE TABLE IF NOT EXISTS menu_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL,
    category_id INTEGER,
    category TEXT NOT NULL,
    preparation_time INTEGER DEFAULT 15,
    is_available BOOLEAN DEFAULT 1,
    stock_quantity INTEGER DEFAULT 0,
    low_stock_threshold INTEGER DEFAULT 10,
    image_url TEXT,
    tax_applicable BOOLEAN DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES categories (id)
  )`);

  // Orders table with enhanced fields
  db.run(`CREATE TABLE IF NOT EXISTS orders (
    id TEXT PRIMARY KEY,
    table_number TEXT NOT NULL,
    table_ids TEXT,
    status TEXT DEFAULT 'New',
    kds_status TEXT DEFAULT 'New',
    total_amount DECIMAL(10,2) DEFAULT 0,
    staff_id INTEGER,
    customer_name TEXT,
    customer_phone TEXT,
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    completed_at DATETIME,
    FOREIGN KEY (staff_id) REFERENCES users (id)
  )`);

  // Order items table with variants
  db.run(`CREATE TABLE IF NOT EXISTS order_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id TEXT NOT NULL,
    menu_item_id INTEGER NOT NULL,
    variant_id INTEGER,
    quantity INTEGER NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    special_instructions TEXT,
    status TEXT DEFAULT 'New',
    kds_status TEXT DEFAULT 'New',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    prepared_at DATETIME,
    served_at DATETIME,
    FOREIGN KEY (order_id) REFERENCES orders (id) ON DELETE CASCADE,
    FOREIGN KEY (menu_item_id) REFERENCES menu_items (id),
    FOREIGN KEY (variant_id) REFERENCES menu_variants (id)
  )`);

  // Taxes table
  db.run(`CREATE TABLE IF NOT EXISTS taxes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    rate DECIMAL(5,2) NOT NULL,
    is_inclusive BOOLEAN DEFAULT 0,
    is_active BOOLEAN DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // Bills table with enhanced fields
  db.run(`CREATE TABLE IF NOT EXISTS bills (
    id TEXT PRIMARY KEY,
    order_id TEXT NOT NULL,
    table_number TEXT NOT NULL,
    subtotal DECIMAL(10,2) NOT NULL,
    tax_amount DECIMAL(10,2) DEFAULT 0,
    service_charge DECIMAL(10,2) DEFAULT 0,
    discount_amount DECIMAL(10,2) DEFAULT 0,
    discount_type TEXT,
    discount_reason TEXT,
    round_off DECIMAL(10,2) DEFAULT 0,
    total_amount DECIMAL(10,2) NOT NULL,
    payment_method TEXT DEFAULT 'cash',
    payment_status TEXT DEFAULT 'pending',
    is_split BOOLEAN DEFAULT 0,
    split_count INTEGER DEFAULT 1,
    staff_id INTEGER,
    voided BOOLEAN DEFAULT 0,
    void_reason TEXT,
    voided_by INTEGER,
    voided_at DATETIME,
    printed_count INTEGER DEFAULT 0,
    last_printed_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (order_id) REFERENCES orders (id),
    FOREIGN KEY (staff_id) REFERENCES users (id),
    FOREIGN KEY (voided_by) REFERENCES users (id)
  )`);

  // Split bills table
  db.run(`CREATE TABLE IF NOT EXISTS split_bills (
    id TEXT PRIMARY KEY,
    parent_bill_id TEXT NOT NULL,
    split_number INTEGER NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    payment_method TEXT,
    payment_status TEXT DEFAULT 'pending',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (parent_bill_id) REFERENCES bills (id) ON DELETE CASCADE
  )`);

  // Print queue table for offline support
  db.run(`CREATE TABLE IF NOT EXISTS print_queue (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    bill_id TEXT NOT NULL,
    printer_name TEXT,
    print_data TEXT NOT NULL,
    status TEXT DEFAULT 'pending',
    retry_count INTEGER DEFAULT 0,
    error_message TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    processed_at DATETIME
  )`);

  // Shops table (for multi-location support)
  db.run(`CREATE TABLE IF NOT EXISTS shops (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    logo_url TEXT,
    address TEXT,
    city TEXT,
    state TEXT,
    zip_code TEXT,
    country TEXT DEFAULT 'USA',
    phone TEXT,
    email TEXT,
    tax_id TEXT,
    is_primary BOOLEAN DEFAULT 0,
    is_active BOOLEAN DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // Settings table
  db.run(`CREATE TABLE IF NOT EXISTS settings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    key TEXT UNIQUE NOT NULL,
    value TEXT,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // Audit logs table
  db.run(`CREATE TABLE IF NOT EXISTS audit_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    action TEXT NOT NULL,
    table_name TEXT,
    record_id TEXT,
    old_values TEXT,
    new_values TEXT,
    ip_address TEXT,
    user_agent TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users (id)
  )`);

  // Insert default users
  const adminPassword = bcrypt.hashSync('admin123', 10);
  const cashierPassword = bcrypt.hashSync('cashier123', 10);
  const chefPassword = bcrypt.hashSync('chef123', 10);
  
  db.run(`INSERT OR IGNORE INTO users (username, email, password_hash, role, first_name, last_name) VALUES 
    ('admin', 'admin@restaurant.com', ?, 'admin', 'Admin', 'User')`, [adminPassword]);
  db.run(`INSERT OR IGNORE INTO users (username, email, password_hash, role, first_name, last_name) VALUES 
    ('cashier', 'cashier@restaurant.com', ?, 'cashier', 'Cashier', 'User')`, [cashierPassword]);
  db.run(`INSERT OR IGNORE INTO users (username, email, password_hash, role, first_name, last_name) VALUES 
    ('chef', 'chef@restaurant.com', ?, 'chef', 'Chef', 'User')`, [chefPassword]);

  // Insert default categories
  db.run(`INSERT OR IGNORE INTO categories (name, display_order) VALUES 
    ('Appetizers', 1), ('Main Course', 2), ('Pizza', 3), ('Pasta', 4), ('Salads', 5), ('Desserts', 6), ('Beverages', 7)`);

  // Insert sample tables
  const tableNumbers = ['T1', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'T8', 'T9', 'T10'];
  tableNumbers.forEach((num, idx) => {
    db.run(`INSERT OR IGNORE INTO tables (table_number, capacity, location) VALUES (?, ?, ?)`, 
      [num, idx % 3 === 0 ? 6 : 4, idx < 5 ? 'main' : 'patio']);
  });

  // Insert sample menu items
  db.run(`INSERT OR IGNORE INTO menu_items (name, description, price, category, preparation_time, stock_quantity) VALUES 
    ('Margherita Pizza', 'Classic tomato and mozzarella pizza', 12.99, 'Pizza', 20, 50),
    ('Pepperoni Pizza', 'Pepperoni with mozzarella cheese', 14.99, 'Pizza', 20, 45),
    ('Caesar Salad', 'Fresh romaine lettuce with caesar dressing', 8.99, 'Salads', 10, 30),
    ('Grilled Chicken', 'Grilled chicken breast with herbs', 16.99, 'Main Course', 25, 25),
    ('Pasta Carbonara', 'Creamy pasta with bacon and parmesan', 13.99, 'Pasta', 18, 40),
    ('Fish and Chips', 'Beer-battered fish with fries', 15.99, 'Main Course', 22, 20),
    ('Chocolate Cake', 'Rich chocolate cake with ganache', 6.99, 'Desserts', 5, 15),
    ('Ice Cream', 'Vanilla, chocolate, or strawberry', 4.99, 'Desserts', 2, 100),
    ('Spring Rolls', 'Crispy vegetable spring rolls', 6.99, 'Appetizers', 12, 40),
    ('Garlic Bread', 'Toasted bread with garlic butter', 4.99, 'Appetizers', 8, 60),
    ('Coke', 'Coca-Cola 330ml', 2.99, 'Beverages', 1, 200),
    ('Orange Juice', 'Freshly squeezed orange juice', 3.99, 'Beverages', 3, 100)`);

  // Insert default taxes
  db.run(`INSERT OR IGNORE INTO taxes (name, rate, is_inclusive, is_active) VALUES 
    ('GST', 9.00, 0, 1),
    ('Service Tax', 5.00, 0, 1)`);

  // Insert default shop
  db.run(`INSERT OR IGNORE INTO shops (id, name, address, city, state, zip_code, phone, email, tax_id, is_primary) VALUES 
    (1, 'Restaurant POS Main', '123 Main Street', 'New York', 'NY', '10001', '+1234567890', 'info@restaurant.com', 'TAX123456', 1)`);

  // Insert default settings
  db.run(`INSERT OR IGNORE INTO settings (key, value) VALUES 
    ('shop_name', 'Restaurant POS'),
    ('shop_address', '123 Main Street, City, State'),
    ('shop_phone', '+1234567890'),
    ('shop_email', 'info@restaurant.com'),
    ('tax_rate', '9.0'),
    ('service_charge_rate', '5.0'),
    ('currency_symbol', '$'),
    ('printer_type', 'network'),
    ('printer_ip', '192.168.1.100'),
    ('printer_port', '9100'),
    ('receipt_header', 'Thank you for dining with us!'),
    ('receipt_footer', 'Please visit again!'),
    ('enable_kds', 'true'),
    ('auto_print_bill', 'false'),
    ('default_payment_method', 'cash')`);

  // Database migrations - add missing columns if they don't exist
  db.all("PRAGMA table_info(orders)", (err, columns) => {
    if (!err && columns) {
      const hasPaymentStatus = columns.some(col => col.name === 'payment_status');
      const hasPaymentMethod = columns.some(col => col.name === 'payment_method');
      const hasOrderType = columns.some(col => col.name === 'order_type');
      
      if (!hasPaymentStatus) {
        console.log('Adding payment_status column to orders table...');
        db.run("ALTER TABLE orders ADD COLUMN payment_status TEXT DEFAULT 'pending'");
      }
      if (!hasPaymentMethod) {
        console.log('Adding payment_method column to orders table...');
        db.run("ALTER TABLE orders ADD COLUMN payment_method TEXT DEFAULT 'cash'");
      }
      if (!hasOrderType) {
        console.log('Adding order_type column to orders table...');
        db.run("ALTER TABLE orders ADD COLUMN order_type TEXT DEFAULT 'dine_in'");
      }
    }
  });

  // Create default owner account if no users exist
  db.get('SELECT COUNT(*) as count FROM users', (err, result) => {
    if (err) {
      console.error('Error checking users:', err);
      return;
    }
    
    if (result.count === 0) {
      console.log('🔄 No users found. Creating default accounts...');
      
      // Create owner account
      const ownerPasswordHash = bcrypt.hashSync('owner123', 10);
      db.run(`INSERT INTO users (username, email, password_hash, role, first_name, last_name, company_name, is_active) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        ['owner', 'owner@restaurant.com', ownerPasswordHash, 'owner', 'System', 'Owner', 'MNA POS SYSTEMS', 1],
        function(err) {
          if (err) {
            console.error('❌ Error creating owner account:', err);
          } else {
            console.log('✅ Owner account created!');
            console.log('   Username: owner');
            console.log('   Password: owner123');
          }
        }
      );
      
      // Create admin account for default shop
      const adminPasswordHash = bcrypt.hashSync('admin123', 10);
      db.run(`INSERT INTO users (username, email, password_hash, role, first_name, last_name, shop_id, is_active) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        ['admin', 'admin@restaurant.com', adminPasswordHash, 'admin', 'Admin', 'User', 1, 1],
        function(err) {
          if (err) {
            console.error('❌ Error creating admin account:', err);
          } else {
            console.log('✅ Admin account created!');
            console.log('   Username: admin');
            console.log('   Password: admin123');
          }
        }
      );
      
      // Create cashier account
      const cashierPasswordHash = bcrypt.hashSync('cashier123', 10);
      db.run(`INSERT INTO users (username, email, password_hash, role, first_name, last_name, shop_id, is_active) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        ['cashier', 'cashier@restaurant.com', cashierPasswordHash, 'cashier', 'Cashier', 'User', 1, 1],
        function(err) {
          if (err) {
            console.error('❌ Error creating cashier account:', err);
          } else {
            console.log('✅ Cashier account created!');
            console.log('   Username: cashier');
            console.log('   Password: cashier123');
            console.log('');
            console.log('⚠️  IMPORTANT: Change all passwords after first login!');
          }
        }
      );
    } else {
      console.log(`✅ Database has ${result.count} user(s)`);
    }
  });
});

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  socket.on('join-kitchen', () => {
    socket.join('kitchen');
    console.log('Kitchen staff joined');
  });

  socket.on('join-orders', () => {
    socket.join('orders');
    console.log('Order staff joined');
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// Helper function to log audit events
const logAuditEvent = (userId, action, tableName, recordId, oldValues, newValues, req) => {
  const ipAddress = req.ip || req.connection.remoteAddress;
  const userAgent = req.get('User-Agent');
  
  db.run(`INSERT INTO audit_logs (user_id, action, table_name, record_id, old_values, new_values, ip_address, user_agent) 
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [userId, action, tableName, recordId, JSON.stringify(oldValues), JSON.stringify(newValues), ipAddress, userAgent]);
};

// API Routes

// Get server time in IST (no auth required)
app.get('/api/server-time', (req, res) => {
  const now = getCurrentISTTime();
  res.json({
    timestamp: now.valueOf(),
    formatted: now.format('DD/MM/YYYY hh:mm:ss A'),
    timezone: 'Asia/Kolkata',
    offset: '+05:30',
    date: now.format('DD/MM/YYYY'),
    time: now.format('hh:mm:ss A')
  });
});

// Debug endpoint - check database status (no auth required)
app.get('/api/debug/status', (req, res) => {
  db.get('SELECT COUNT(*) as count FROM users', (err, result) => {
    if (err) {
      return res.json({ 
        status: 'error', 
        message: err.message,
        database: 'error'
      });
    }
    
    db.all('SELECT username, role FROM users', (err, users) => {
      res.json({
        status: 'ok',
        database: 'connected',
        user_count: result.count,
        users: users || [],
        deployment: 'Render',
        timestamp: new Date().toISOString()
      });
    });
  });
});

// Force create default accounts (no auth required - temporary for setup)
app.post('/api/debug/create-accounts', (req, res) => {
  const { secret } = req.body;
  
  // Simple secret key check (replace with your own secret)
  if (secret !== 'create-accounts-now-2024') {
    return res.status(403).json({ error: 'Invalid secret' });
  }
  
  db.get('SELECT COUNT(*) as count FROM users WHERE username = ?', ['owner'], (err, result) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    
    if (result.count > 0) {
      return res.json({ 
        message: 'Owner account already exists',
        existing_count: result.count
      });
    }
    
    // Create owner
    const ownerPasswordHash = bcrypt.hashSync('owner123', 10);
    db.run(`INSERT INTO users (username, email, password_hash, role, first_name, last_name, company_name, is_active) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      ['owner', 'owner@restaurant.com', ownerPasswordHash, 'owner', 'System', 'Owner', 'MNA POS SYSTEMS', 1],
      function(err) {
        if (err) {
          return res.status(500).json({ error: 'Failed to create owner: ' + err.message });
        }
        
        // Create admin
        const adminPasswordHash = bcrypt.hashSync('admin123', 10);
        db.run(`INSERT INTO users (username, email, password_hash, role, first_name, last_name, shop_id, is_active) 
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          ['admin', 'admin@restaurant.com', adminPasswordHash, 'admin', 'Admin', 'User', 1, 1],
          function(err) {
            if (err) {
              return res.status(500).json({ error: 'Failed to create admin: ' + err.message });
            }
            
            // Create cashier
            const cashierPasswordHash = bcrypt.hashSync('cashier123', 10);
            db.run(`INSERT INTO users (username, email, password_hash, role, first_name, last_name, shop_id, is_active) 
              VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
              ['cashier', 'cashier@restaurant.com', cashierPasswordHash, 'cashier', 'Cashier', 'User', 1, 1],
              function(err) {
                if (err) {
                  return res.status(500).json({ error: 'Failed to create cashier: ' + err.message });
                }
                
                res.json({ 
                  success: true,
                  message: 'All accounts created successfully!',
                  accounts: [
                    { username: 'owner', password: 'owner123', role: 'owner' },
                    { username: 'admin', password: 'admin123', role: 'admin' },
                    { username: 'cashier', password: 'cashier123', role: 'cashier' }
                  ]
                });
              }
            );
          }
        );
      }
    );
  });
});

// Get system version (no auth required)
app.get('/api/version', (req, res) => {
  const version = require('./version.json');
  res.json(version);
});

// Public endpoint to get company branding (no auth required)
app.get('/api/public/branding', (req, res) => {
  db.get('SELECT company_name, first_name, last_name FROM users WHERE role = ?', ['owner'], (err, owner) => {
    if (err) {
      return res.json({ company_name: 'Enterprise POS Solution' });
    }
    
    res.json({
      company_name: owner?.company_name || 'Enterprise POS Solution',
      owner_name: owner ? `${owner.first_name} ${owner.last_name}` : ''
    });
  });
});

// Authentication Routes
app.post('/api/auth/login', [
  body('username').notEmpty().withMessage('Username is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { username, password } = req.body;

  db.get('SELECT * FROM users WHERE username = ? AND is_active = 1', [username], (err, user) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }

    if (!user || !bcrypt.compareSync(password, user.password_hash)) {
      logAuditEvent(null, 'LOGIN_FAILED', 'users', username, null, null, req);
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Check if user belongs to a shop and if shop is active
    if (user.shop_id && user.role !== 'owner') {
      db.get('SELECT is_active, name FROM shops WHERE id = ?', [user.shop_id], (err, shop) => {
        if (err) {
          return res.status(500).json({ error: 'Database error' });
        }

        if (shop && !shop.is_active) {
          logAuditEvent(user.id, 'LOGIN_BLOCKED_SHOP_CLOSED', 'users', user.id, null, null, req);
          return res.status(403).json({ error: `This shop (${shop.name}) has been closed by the owner. Please contact management.` });
        }

        // Shop is active or doesn't exist, proceed with login
        sendLoginResponse(user, req, res);
      });
    } else {
      // Owner or no shop assigned
      sendLoginResponse(user, req, res);
    }
  });

  function sendLoginResponse(user, req, res) {
    const token = jwt.sign(
      { 
        id: user.id, 
        username: user.username, 
        role: user.role,
        email: user.email,
        shop_id: user.shop_id
      },
      JWT_SECRET,
      { expiresIn: '8h' }
    );

    logAuditEvent(user.id, 'LOGIN_SUCCESS', 'users', user.id, null, null, req);

    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        firstName: user.first_name,
        lastName: user.last_name,
        shop_id: user.shop_id,
        company_name: user.company_name
      }
    });
  }
});

// Verify owner password
app.post('/api/auth/verify-password', authenticateToken, (req, res) => {
  const { password } = req.body;

  db.get('SELECT password_hash FROM users WHERE id = ?', [req.user.id], (err, user) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }

    if (!user || !bcrypt.compareSync(password, user.password_hash)) {
      return res.status(401).json({ error: 'Incorrect password' });
    }

    res.json({ success: true });
  });
});

app.post('/api/auth/register', authenticateToken, authorize(['admin', 'owner']), [
  body('username').isLength({ min: 3 }).withMessage('Username must be at least 3 characters'),
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('first_name').notEmpty().withMessage('First name is required'),
  body('last_name').notEmpty().withMessage('Last name is required'),
  body('role').isIn(['staff', 'manager', 'admin', 'cashier', 'chef']).withMessage('Invalid role')
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { username, email, password, first_name, last_name, role, phone, shop_id } = req.body;
  const passwordHash = bcrypt.hashSync(password, 10);

  db.run(`INSERT INTO users (username, email, password_hash, role, first_name, last_name, phone, shop_id) 
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [username, email, passwordHash, role, first_name, last_name, phone, shop_id || null], function(err) {
      if (err) {
        if (err.message.includes('UNIQUE constraint failed')) {
          return res.status(400).json({ error: 'Username or email already exists' });
        }
        return res.status(500).json({ error: 'Database error' });
      }

      logAuditEvent(req.user.id, 'USER_CREATED', 'users', this.lastID, null, { username, email, role, shop_id }, req);

      res.json({ 
        message: 'User created successfully',
        userId: this.lastID 
      });
    });
});

app.get('/api/auth/me', authenticateToken, (req, res) => {
  db.get('SELECT id, username, email, role, first_name, last_name, phone, avatar_url, created_at, shop_id, company_name FROM users WHERE id = ?', 
    [req.user.id], (err, user) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
      
      // If user has shop_id, fetch shop name
      if (user.shop_id) {
        db.get('SELECT name as shop_name FROM shops WHERE id = ?', [user.shop_id], (err, shop) => {
          if (!err && shop) {
            user.shop_name = shop.shop_name;
          }
          res.json(user);
        });
      } else {
        res.json(user);
      }
    });
});

app.get('/api/users', authenticateToken, authorize(['admin', 'manager', 'owner']), (req, res) => {
  db.all('SELECT id, username, email, role, first_name, last_name, phone, is_active, created_at, shop_id FROM users ORDER BY created_at DESC', 
    (err, users) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      res.json(users);
    });
});

// Create user (for owner to create staff)
app.post('/api/users', authenticateToken, authorize(['owner', 'admin']), [
  body('username').isLength({ min: 3 }).withMessage('Username must be at least 3 characters'),
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('first_name').notEmpty().withMessage('First name is required'),
  body('last_name').notEmpty().withMessage('Last name is required'),
  body('role').isIn(['admin', 'cashier', 'chef', 'manager']).withMessage('Invalid role')
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { username, email, password, first_name, last_name, role, phone, shop_id } = req.body;
  const passwordHash = bcrypt.hashSync(password, 10);

  db.run(`INSERT INTO users (username, email, password_hash, role, first_name, last_name, phone, shop_id) 
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [username, email, passwordHash, role, first_name, last_name, phone, shop_id || null], function(err) {
      if (err) {
        if (err.message.includes('UNIQUE constraint failed')) {
          return res.status(400).json({ error: 'Username or email already exists' });
        }
        return res.status(500).json({ error: err.message });
      }

      logAuditEvent(req.user.id, 'USER_CREATED', 'users', this.lastID, null, { username, email, role, shop_id }, req);

      res.json({ 
        message: 'User created successfully',
        userId: this.lastID 
      });
    });
});

// Delete user
app.delete('/api/users/:id', authenticateToken, authorize(['owner', 'admin']), (req, res) => {
  const { id } = req.params;

  db.get('SELECT * FROM users WHERE id = ?', [id], (err, user) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // If user is an admin with a shop, delete the entire shop (cascade)
    if (user.role === 'admin' && user.shop_id) {
      console.log(`Admin user deletion - will cascade delete shop ${user.shop_id}`);
      
      db.serialize(() => {
        db.run('BEGIN TRANSACTION');
        
        // Get shop details for logging
        db.get('SELECT * FROM shops WHERE id = ?', [user.shop_id], (err, shop) => {
          if (err) {
            db.run('ROLLBACK');
            return res.status(500).json({ error: 'Failed to fetch shop details' });
          }
          
          // Delete all users from this shop (including the admin)
          db.run('DELETE FROM users WHERE shop_id = ?', [user.shop_id], function(err) {
            if (err) {
              db.run('ROLLBACK');
              return res.status(500).json({ error: 'Failed to delete shop users' });
            }
            
            const deletedUsers = this.changes;
            
            // Delete menu items
            db.run('DELETE FROM menu_items WHERE shop_id = ?', [user.shop_id], function(err) {
              if (err) {
                db.run('ROLLBACK');
                return res.status(500).json({ error: 'Failed to delete shop menu' });
              }
              
              const deletedMenuItems = this.changes;
              
              // Delete tables
              db.run('DELETE FROM tables WHERE shop_id = ?', [user.shop_id], function(err) {
                if (err) {
                  db.run('ROLLBACK');
                  return res.status(500).json({ error: 'Failed to delete shop tables' });
                }
                
                const deletedTables = this.changes;
                
                // Delete shop logo if exists
                if (shop && shop.logo_url) {
                  const filePath = path.join(__dirname, shop.logo_url);
                  if (fs.existsSync(filePath)) {
                    fs.unlinkSync(filePath);
                  }
                }
                
                // Delete the shop
                db.run('DELETE FROM shops WHERE id = ?', [user.shop_id], function(err) {
                  if (err) {
                    db.run('ROLLBACK');
                    return res.status(500).json({ error: 'Failed to delete shop' });
                  }
                  
                  db.run('COMMIT', (err) => {
                    if (err) {
                      return res.status(500).json({ error: 'Failed to commit transaction' });
                    }
                    
                    logAuditEvent(req.user.id, 'ADMIN_USER_DELETED_WITH_SHOP', 'users', id, user, {
                      shop_deleted: shop?.name,
                      deleted_users: deletedUsers,
                      deleted_menu_items: deletedMenuItems,
                      deleted_tables: deletedTables
                    }, req);
                    
                    res.json({ 
                      message: `Admin user and shop "${shop?.name}" deleted successfully`,
                      shop_deleted: true,
                      deleted_users: deletedUsers,
                      deleted_menu_items: deletedMenuItems,
                      deleted_tables: deletedTables
                    });
                  });
                });
              });
            });
          });
        });
      });
    } else {
      // Regular user (not admin or no shop) - just delete the user
      db.run('DELETE FROM users WHERE id = ?', [id], function(err) {
        if (err) {
          return res.status(500).json({ error: err.message });
        }

        logAuditEvent(req.user.id, 'USER_DELETED', 'users', id, user, null, req);
        res.json({ message: 'User deleted successfully' });
      });
    }
  });
});

app.put('/api/users/:id', authenticateToken, authorize(['admin', 'manager']), [
  body('role').optional().isIn(['staff', 'manager', 'admin']).withMessage('Invalid role'),
  body('isActive').optional().isBoolean().withMessage('isActive must be boolean')
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const userId = req.params.id;
  const { role, isActive } = req.body;

  // Get current user data for audit log
  db.get('SELECT * FROM users WHERE id = ?', [userId], (err, currentUser) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    if (!currentUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    const updates = [];
    const values = [];
    
    if (role !== undefined) {
      updates.push('role = ?');
      values.push(role);
    }
    if (isActive !== undefined) {
      updates.push('is_active = ?');
      values.push(isActive);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No valid fields to update' });
    }

    updates.push('updated_at = CURRENT_TIMESTAMP');
    values.push(userId);

    db.run(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`, values, function(err) {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }

      logAuditEvent(req.user.id, 'USER_UPDATED', 'users', userId, currentUser, req.body, req);
      res.json({ message: 'User updated successfully' });
    });
  });
});

// ==================== TABLE MANAGEMENT ====================

// Get all tables
app.get('/api/tables', authenticateToken, (req, res) => {
  const userShopId = req.user.shop_id;
  const whereClause = userShopId ? `WHERE shop_id = ${userShopId} OR shop_id IS NULL` : '';
  
  db.all(`SELECT * FROM tables ${whereClause} ORDER BY table_number`, (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
});

// Create new table
app.post('/api/tables', authenticateToken, authorize(['admin', 'manager']), (req, res) => {
  const { table_number, capacity, location } = req.body;
  const userShopId = req.user.shop_id;
  
  db.run('INSERT INTO tables (table_number, capacity, location, shop_id) VALUES (?, ?, ?, ?)',
    [table_number, capacity || 4, location || 'main', userShopId], function(err) {
      if (err) {
        if (err.message.includes('UNIQUE constraint failed')) {
          return res.status(400).json({ error: 'Table number already exists' });
        }
        return res.status(500).json({ error: err.message });
      }
      
      logAuditEvent(req.user.id, 'TABLE_CREATED', 'tables', this.lastID, null, req.body, req);
      res.json({ id: this.lastID, message: 'Table created successfully' });
    });
});

// Update table status
app.put('/api/tables/:id/status', authenticateToken, (req, res) => {
  const { id } = req.params;
  const { status, current_order_id } = req.body;
  
  const updates = ['status = ?', 'updated_at = CURRENT_TIMESTAMP'];
  const values = [status];
  
  if (current_order_id !== undefined) {
    updates.push('current_order_id = ?');
    values.push(current_order_id);
  }
  
  values.push(id);
  
  db.run(`UPDATE tables SET ${updates.join(', ')} WHERE id = ?`, values, function(err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    
    logAuditEvent(req.user.id, 'TABLE_STATUS_UPDATED', 'tables', id, null, req.body, req);
    io.emit('table-status-updated', { id, status });
    res.json({ message: 'Table status updated successfully' });
  });
});

// Merge tables
app.post('/api/tables/merge', authenticateToken, authorize(['cashier', 'admin', 'manager']), (req, res) => {
  const { table_ids, primary_table_id } = req.body;
  
  if (!table_ids || table_ids.length < 2) {
    return res.status(400).json({ error: 'At least 2 tables required for merge' });
  }
  
  db.serialize(() => {
    db.run('BEGIN TRANSACTION');
    
    // Update non-primary tables to mark them as merged
    const placeholders = table_ids.filter(id => id !== primary_table_id).map(() => '?').join(',');
    db.run(`UPDATE tables SET merged_with = ?, status = 'Occupied' WHERE id IN (${placeholders})`,
      [primary_table_id, ...table_ids.filter(id => id !== primary_table_id)], (err) => {
        if (err) {
          db.run('ROLLBACK');
          return res.status(500).json({ error: err.message });
        }
        
        db.run('COMMIT', (err) => {
          if (err) {
            return res.status(500).json({ error: err.message });
          }
          
          logAuditEvent(req.user.id, 'TABLES_MERGED', 'tables', primary_table_id, null, { table_ids }, req);
          io.emit('tables-merged', { table_ids, primary_table_id });
          res.json({ message: 'Tables merged successfully' });
        });
      });
  });
});

// Split tables
app.post('/api/tables/split', authenticateToken, authorize(['cashier', 'admin', 'manager']), (req, res) => {
  const { primary_table_id } = req.body;
  
  db.run('UPDATE tables SET merged_with = NULL, status = "Free" WHERE merged_with = ?',
    [primary_table_id], function(err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      
      logAuditEvent(req.user.id, 'TABLES_SPLIT', 'tables', primary_table_id, null, req.body, req);
      io.emit('tables-split', { primary_table_id });
      res.json({ message: 'Tables split successfully', affected: this.changes });
    });
});

// Delete table
app.delete('/api/tables/:id', authenticateToken, authorize(['admin', 'manager']), (req, res) => {
  const { id } = req.params;
  
  // Check if table has active orders
  db.get('SELECT current_order_id FROM tables WHERE id = ?', [id], (err, table) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    
    if (table && table.current_order_id) {
      return res.status(400).json({ error: 'Cannot delete table with active orders' });
    }
    
    db.run('DELETE FROM tables WHERE id = ?', [id], function(err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      
      logAuditEvent(req.user.id, 'TABLE_DELETED', 'tables', id, null, null, req);
      res.json({ message: 'Table deleted successfully' });
    });
  });
});

// ==================== MENU & CATEGORY MANAGEMENT ====================

// Get all categories
app.get('/api/categories', authenticateToken, (req, res) => {
  db.all('SELECT * FROM categories WHERE is_active = 1 ORDER BY display_order, name', (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(rows);
  });
});

// Create category
app.post('/api/categories', authenticateToken, authorize(['admin', 'manager']), (req, res) => {
  const { name, display_order } = req.body;
  
  db.run('INSERT INTO categories (name, display_order) VALUES (?, ?)',
    [name, display_order || 0], function(err) {
      if (err) {
        if (err.message.includes('UNIQUE constraint failed')) {
          return res.status(400).json({ error: 'Category already exists' });
        }
        return res.status(500).json({ error: err.message });
      }
      
      logAuditEvent(req.user.id, 'CATEGORY_CREATED', 'categories', this.lastID, null, req.body, req);
      res.json({ id: this.lastID, message: 'Category created successfully' });
    });
});

// Update category
app.put('/api/categories/:id', authenticateToken, authorize(['admin', 'manager']), (req, res) => {
  const { id } = req.params;
  const { name, display_order, is_active } = req.body;
  
  const updates = [];
  const values = [];
  
  if (name !== undefined) {
    updates.push('name = ?');
    values.push(name);
  }
  if (display_order !== undefined) {
    updates.push('display_order = ?');
    values.push(display_order);
  }
  if (is_active !== undefined) {
    updates.push('is_active = ?');
    values.push(is_active);
  }
  
  if (updates.length === 0) {
    return res.status(400).json({ error: 'No valid fields to update' });
  }
  
  values.push(id);
  
  db.run(`UPDATE categories SET ${updates.join(', ')} WHERE id = ?`, values, function(err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    
    logAuditEvent(req.user.id, 'CATEGORY_UPDATED', 'categories', id, null, req.body, req);
    res.json({ message: 'Category updated successfully' });
  });
});

// Get menu items for specific shop (owner only)
app.get('/api/shops/:shopId/menu', authenticateToken, authorize(['owner']), (req, res) => {
  const { shopId } = req.params;
  
  db.all(`SELECT m.*, GROUP_CONCAT(v.id || ':' || v.name || ':' || v.price_adjustment) as variants
    FROM menu_items m
    LEFT JOIN menu_variants v ON m.id = v.menu_item_id AND v.is_available = 1
    WHERE m.shop_id = ? OR m.shop_id IS NULL
    GROUP BY m.id
    ORDER BY m.category, m.name`, [shopId], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    
    const items = rows.map(item => ({
      ...item,
      variants: item.variants ? item.variants.split(',').map(v => {
        const [id, name, price_adjustment] = v.split(':');
        return { id: parseInt(id), name, price_adjustment: parseFloat(price_adjustment) };
      }) : []
    }));
    
    res.json(items);
  });
});

// Clear all menu items for a shop (owner only, password protected)
app.delete('/api/shops/:shopId/menu', authenticateToken, authorize(['owner']), (req, res) => {
  const { shopId } = req.params;
  const { password } = req.body;
  
  console.log('Clear menu request - shopId:', shopId, 'password provided:', !!password);
  
  if (!password) {
    return res.status(400).json({ error: 'Password is required' });
  }
  
  // Verify owner password
  db.get('SELECT password_hash FROM users WHERE id = ?', [req.user.id], (err, user) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    
    if (!user) {
      console.error('User not found');
      return res.status(404).json({ error: 'User not found' });
    }
    
    const passwordMatch = bcrypt.compareSync(password, user.password_hash);
    console.log('Password match:', passwordMatch);
    
    if (!passwordMatch) {
      return res.status(401).json({ error: 'Incorrect owner password' });
    }
    
    // Delete all menu items for this shop
    // If shopId is 'all', delete all menu items (including NULL)
    // Otherwise, delete only items with matching shop_id
    let deleteQuery;
    let deleteParams;
    
    if (shopId === 'all') {
      deleteQuery = 'DELETE FROM menu_items';
      deleteParams = [];
    } else {
      deleteQuery = 'DELETE FROM menu_items WHERE shop_id = ?';
      deleteParams = [shopId];
    }
    
    db.run(deleteQuery, deleteParams, function(err) {
      if (err) {
        console.error('Delete error:', err);
        return res.status(500).json({ error: err.message });
      }
      
      console.log('Menu items deleted:', this.changes);
      logAuditEvent(req.user.id, 'SHOP_MENU_CLEARED', 'menu_items', shopId, null, { items_deleted: this.changes }, req);
      res.json({ message: `${this.changes} menu items cleared successfully`, deleted_count: this.changes });
    });
  });
});

// Get menu items
app.get('/api/menu', authenticateToken, (req, res) => {
  const { include_unavailable } = req.query;
  const userShopId = req.user.shop_id;
  
  // Build WHERE clause with shop filtering
  let whereConditions = [];
  if (!include_unavailable) {
    whereConditions.push('m.is_available = 1');
  }
  if (userShopId) {
    whereConditions.push(`(m.shop_id = ${userShopId} OR m.shop_id IS NULL)`);
  }
  const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';
  
  db.all(`SELECT m.*, GROUP_CONCAT(v.id || ':' || v.name || ':' || v.price_adjustment) as variants
    FROM menu_items m
    LEFT JOIN menu_variants v ON m.id = v.menu_item_id AND v.is_available = 1
    ${whereClause}
    GROUP BY m.id
    ORDER BY m.category, m.name`, (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    
    // Parse variants
    const items = rows.map(item => ({
      ...item,
      variants: item.variants ? item.variants.split(',').map(v => {
        const [id, name, price_adjustment] = v.split(':');
        return { id: parseInt(id), name, price_adjustment: parseFloat(price_adjustment) };
      }) : []
    }));
    
    res.json(items);
  });
});

// Create menu item
app.post('/api/menu', authenticateToken, authorize(['admin', 'manager']), upload.single('image'), (req, res) => {
  const { name, description, price, category, preparation_time, stock_quantity, tax_applicable, variants } = req.body;
  const image_url = req.file ? `/uploads/menu-items/${req.file.filename}` : null;
  
  db.run(`INSERT INTO menu_items (name, description, price, category, preparation_time, stock_quantity, tax_applicable, image_url, shop_id) 
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [name, description, price, category, preparation_time || 15, stock_quantity || 0, tax_applicable !== false, image_url, req.user.shop_id || null], 
    function(err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      
      const menuItemId = this.lastID;
      
      // Add variants if provided
      if (variants && Array.isArray(variants) && variants.length > 0) {
        const stmt = db.prepare('INSERT INTO menu_variants (menu_item_id, name, price_adjustment) VALUES (?, ?, ?)');
        variants.forEach(variant => {
          stmt.run(menuItemId, variant.name, variant.price_adjustment || 0);
        });
        stmt.finalize();
      }
      
      logAuditEvent(req.user.id, 'MENU_ITEM_CREATED', 'menu_items', menuItemId, null, req.body, req);
      res.json({ id: menuItemId, message: 'Menu item created successfully' });
    });
});

// Update menu item
app.put('/api/menu/:id', authenticateToken, authorize(['admin', 'manager']), upload.single('image'), (req, res) => {
  const { id } = req.params;
  const { name, description, price, category, preparation_time, is_available, stock_quantity, low_stock_threshold, tax_applicable } = req.body;
  
  const updates = [];
  const values = [];
  
  if (name !== undefined) {
    updates.push('name = ?');
    values.push(name);
  }
  if (description !== undefined) {
    updates.push('description = ?');
    values.push(description);
  }
  if (price !== undefined) {
    updates.push('price = ?');
    values.push(price);
  }
  if (category !== undefined) {
    updates.push('category = ?');
    values.push(category);
  }
  if (preparation_time !== undefined) {
    updates.push('preparation_time = ?');
    values.push(preparation_time);
  }
  if (is_available !== undefined) {
    updates.push('is_available = ?');
    values.push(is_available);
  }
  if (stock_quantity !== undefined) {
    updates.push('stock_quantity = ?');
    values.push(stock_quantity);
  }
  if (low_stock_threshold !== undefined) {
    updates.push('low_stock_threshold = ?');
    values.push(low_stock_threshold);
  }
  if (tax_applicable !== undefined) {
    updates.push('tax_applicable = ?');
    values.push(tax_applicable);
  }
  if (req.file) {
    updates.push('image_url = ?');
    values.push(`/uploads/menu-items/${req.file.filename}`);
  }
  
  if (updates.length === 0) {
    return res.status(400).json({ error: 'No valid fields to update' });
  }
  
  updates.push('updated_at = CURRENT_TIMESTAMP');
  values.push(id);
  
  db.run(`UPDATE menu_items SET ${updates.join(', ')} WHERE id = ?`, values, function(err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    
    logAuditEvent(req.user.id, 'MENU_ITEM_UPDATED', 'menu_items', id, null, req.body, req);
    res.json({ message: 'Menu item updated successfully' });
  });
});

// Delete menu item
app.delete('/api/menu/:id', authenticateToken, authorize(['admin', 'manager', 'owner']), (req, res) => {
  const { id } = req.params;
  
  db.run('DELETE FROM menu_items WHERE id = ?', [id], function(err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    
    logAuditEvent(req.user.id, 'MENU_ITEM_DELETED', 'menu_items', id, null, null, req);
    res.json({ message: 'Menu item deleted successfully' });
  });
});

// Get variants for menu item
app.get('/api/menu/:id/variants', authenticateToken, (req, res) => {
  const { id } = req.params;
  
  db.all('SELECT * FROM menu_variants WHERE menu_item_id = ? AND is_available = 1', [id], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(rows);
  });
});

// Add variant to menu item
app.post('/api/menu/:id/variants', authenticateToken, authorize(['admin', 'manager']), (req, res) => {
  const { id } = req.params;
  const { name, price_adjustment } = req.body;
  
  db.run('INSERT INTO menu_variants (menu_item_id, name, price_adjustment) VALUES (?, ?, ?)',
    [id, name, price_adjustment || 0], function(err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      
      res.json({ id: this.lastID, message: 'Variant added successfully' });
    });
});

// ==================== ORDER MANAGEMENT ====================

// Create new order
app.post('/api/orders', authenticateToken, authorize(['cashier', 'chef', 'manager', 'admin']), (req, res) => {
  const { tableNumber, items, customer_name, customer_phone, notes, order_type, payment_status } = req.body;
  const orderId = uuidv4();
  
  if (!items || items.length === 0) {
    return res.status(400).json({ error: 'Order must contain at least one item' });
  }
  
  db.serialize(() => {
    db.run('BEGIN TRANSACTION');
    
    let totalAmount = 0;
    items.forEach(item => {
      totalAmount += (item.price + (item.variant_price_adjustment || 0)) * item.quantity;
    });
    
    // Create order
    db.run('INSERT INTO orders (id, table_number, staff_id, total_amount, customer_name, customer_phone, notes, order_type, payment_status, kds_status, shop_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)', 
      [orderId, tableNumber, req.user.id, totalAmount, customer_name, customer_phone, notes, order_type || 'Dine-In', payment_status || 'pending', null, req.user.shop_id], function(err) {
        if (err) {
          db.run('ROLLBACK');
          return res.status(500).json({ error: err.message });
        }
        
        // Add order items
        let completed = 0;
        items.forEach((item) => {
          const finalPrice = item.price + (item.variant_price_adjustment || 0);
          db.run('INSERT INTO order_items (order_id, menu_item_id, variant_id, quantity, price, special_instructions) VALUES (?, ?, ?, ?, ?, ?)',
            [orderId, item.menu_item_id, item.variant_id || null, item.quantity, finalPrice, item.special_instructions || ''], (err) => {
              if (err) {
                db.run('ROLLBACK');
                return res.status(500).json({ error: err.message });
              }
              
              completed++;
              if (completed === items.length) {
                // Update table status only for Dine-In orders
                if (order_type === 'Dine-In' && tableNumber && tableNumber !== 'Takeaway') {
                  db.run('UPDATE tables SET status = "Occupied", current_order_id = ?, updated_at = CURRENT_TIMESTAMP WHERE table_number = ?',
                    [orderId, tableNumber], (err) => {
                      if (err) {
                        db.run('ROLLBACK');
                        return res.status(500).json({ error: err.message });
                      }
                      
                      completeOrder();
                    });
                } else {
                  completeOrder();
                }
                
                function completeOrder() {
                  db.run('COMMIT', (err) => {
                    if (err) {
                      return res.status(500).json({ error: err.message });
                    }
                    
                    logAuditEvent(req.user.id, 'ORDER_CREATED', 'orders', orderId, null, { tableNumber, items }, req);
                    
                    // Do NOT automatically notify kitchen - only when "Send to Kitchen" button is clicked
                    // Kitchen notification happens via PUT /api/orders/:id/status endpoint
                    
                    if (order_type === 'Dine-In' && tableNumber && tableNumber !== 'Takeaway') {
                      io.emit('table-status-updated', { table_number: tableNumber, status: 'Occupied' });
                    }
                    
                    res.json({ orderId, totalAmount, message: 'Order created successfully' });
                  });
                }
              }
            });
        });
      });
  });
});

// Get pending orders - MUST be before /api/orders/:id to avoid route conflict
app.get('/api/orders/pending', authenticateToken, authorize(['cashier', 'manager', 'admin']), (req, res) => {
  const userShopId = req.user.shop_id;
  const shopFilter = userShopId ? `AND (o.shop_id = ${userShopId} OR o.shop_id IS NULL)` : '';
  
  db.all(`SELECT o.* FROM orders o WHERE o.payment_status = 'pending' ${shopFilter} ORDER BY o.created_at DESC`, [], (err, orders) => {
    if (err) {
      console.error('Pending orders error:', err);
      return res.status(500).json({ error: err.message });
    }
    
    if (orders.length === 0) {
      return res.json([]);
    }
    
    // Fetch items for each order
    let processed = 0;
    const ordersWithItems = [];
    
    orders.forEach((order, index) => {
      db.all(`SELECT oi.menu_item_id, oi.quantity, oi.price, mi.name, mi.category, mi.description
        FROM order_items oi
        JOIN menu_items mi ON oi.menu_item_id = mi.id
        WHERE oi.order_id = ?`, [order.id], (err, items) => {
          if (err) {
            console.error('Error fetching items for order:', order.id, err);
            return res.status(500).json({ error: err.message });
          }
          
          console.log(`Order ${order.id} has ${items.length} items`);
          
          ordersWithItems[index] = {
            ...order,
            items: items || []
          };
          
          processed++;
          if (processed === orders.length) {
            console.log('Sending pending orders:', ordersWithItems.length);
            res.json(ordersWithItems);
          }
      });
    });
  });
});

// Get all orders
app.get('/api/orders', authenticateToken, (req, res) => {
  const { status, table_number } = req.query;
  
  let whereClause = '';
  const params = [];
  
  if (status) {
    whereClause += 'WHERE o.status = ?';
    params.push(status);
  }
  
  if (table_number) {
    whereClause += (whereClause ? ' AND ' : 'WHERE ') + 'o.table_number = ?';
    params.push(table_number);
  }
  
  const query = `
    SELECT o.*, u.first_name || ' ' || u.last_name as staff_name
    FROM orders o
    LEFT JOIN users u ON o.staff_id = u.id
    ${whereClause}
    ORDER BY o.created_at DESC
  `;
  
  db.all(query, params, (err, orders) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    
    // Fetch items for each order
    const ordersWithItems = [];
    let processed = 0;
    
    if (orders.length === 0) {
      return res.json([]);
    }
    
    orders.forEach(order => {
      db.all(`SELECT oi.*, mi.name as item_name, mv.name as variant_name
        FROM order_items oi
        JOIN menu_items mi ON oi.menu_item_id = mi.id
        LEFT JOIN menu_variants mv ON oi.variant_id = mv.id
        WHERE oi.order_id = ?`, [order.id], (err, items) => {
          if (err) {
            return res.status(500).json({ error: err.message });
          }
          
          ordersWithItems.push({ ...order, items });
          processed++;
          
          if (processed === orders.length) {
            res.json(ordersWithItems);
          }
        });
    });
  });
});

// Get single order
app.get('/api/orders/:id', authenticateToken, (req, res) => {
  const { id } = req.params;
  
  db.get('SELECT * FROM orders WHERE id = ?', [id], (err, order) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }
    
    db.all(`SELECT oi.*, mi.name as item_name, mi.category, mv.name as variant_name
      FROM order_items oi
      JOIN menu_items mi ON oi.menu_item_id = mi.id
      LEFT JOIN menu_variants mv ON oi.variant_id = mv.id
      WHERE oi.order_id = ?`, [id], (err, items) => {
        if (err) {
          return res.status(500).json({ error: err.message });
        }
        
        res.json({ ...order, items });
      });
  });
});

// Update order payment
app.put('/api/orders/:orderId/payment', authenticateToken, authorize(['cashier', 'manager', 'admin']), (req, res) => {
  const { orderId } = req.params;
  const { payment_method, payment_status } = req.body;
  
  db.run(`UPDATE orders SET payment_method = ?, payment_status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
    [payment_method, payment_status, orderId], function(err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      
      // Auto-generate bill when payment is completed
      if (payment_status === 'paid') {
        db.get('SELECT * FROM orders WHERE id = ?', [orderId], (err, order) => {
          if (err || !order) {
            console.error('Error fetching order for bill generation:', err);
            return res.json({ message: 'Payment updated successfully' });
          }
          
          const billId = uuidv4();
          const subtotal = order.total_amount;
          const taxAmount = 0; // Can be calculated based on tax settings
          const serviceCharge = 0;
          const discountAmount = 0;
          const totalAmount = subtotal + taxAmount + serviceCharge - discountAmount;
          
          db.run(`INSERT INTO bills (
            id, order_id, table_number, subtotal, tax_amount, 
            service_charge, discount_amount, total_amount, 
            payment_method, payment_status, staff_id, shop_id, created_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [billId, orderId, order.table_number, subtotal, taxAmount, 
             serviceCharge, discountAmount, totalAmount, 
             payment_method, 'paid', req.user.id, order.shop_id || null, order.created_at],
            (err) => {
              if (err) {
                console.error('Error creating bill:', err);
              }
              logAuditEvent(req.user.id, 'PAYMENT_COMPLETED', 'orders', orderId, null, { payment_method, payment_status }, req);
              res.json({ message: 'Payment updated successfully', billId });
            }
          );
        });
      } else {
        res.json({ message: 'Payment updated successfully' });
      }
    });
});

// Update order items
app.put('/api/orders/:orderId/items', authenticateToken, authorize(['cashier', 'manager', 'admin']), (req, res) => {
  const { orderId } = req.params;
  const { items, customer_name, customer_phone, notes, tableNumber, order_type } = req.body;
  
  const totalAmount = items.reduce((sum, item) => sum + ((item.price + (item.variant_price_adjustment || 0)) * item.quantity), 0);
  
  db.run(`UPDATE orders SET 
    customer_name = ?, 
    customer_phone = ?, 
    notes = ?, 
    table_number = ?,
    order_type = ?,
    total_amount = ?, 
    updated_at = CURRENT_TIMESTAMP 
    WHERE id = ?`,
    [customer_name, customer_phone, notes, tableNumber, order_type, totalAmount, orderId], function(err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      
      db.run('DELETE FROM order_items WHERE order_id = ?', [orderId], (err) => {
        if (err) {
          return res.status(500).json({ error: err.message });
        }
        
        const stmt = db.prepare('INSERT INTO order_items (order_id, menu_item_id, quantity, price) VALUES (?, ?, ?, ?)');
        items.forEach(item => {
          stmt.run(orderId, item.menu_item_id, item.quantity, item.price);
        });
        stmt.finalize();
        
        res.json({ message: 'Order updated successfully' });
      });
    });
});

// Update order status
app.put('/api/orders/:id/status', authenticateToken, (req, res) => {
  const { id } = req.params;
  const { status, kds_status } = req.body;
  
  const updates = ['updated_at = CURRENT_TIMESTAMP'];
  const values = [];
  
  if (status) {
    updates.push('status = ?');
    values.push(status);
    
    if (status === 'Served') {
      updates.push('completed_at = CURRENT_TIMESTAMP');
    }
  }
  
  if (kds_status) {
    updates.push('kds_status = ?');
    values.push(kds_status);
  }
  
  values.push(id);
  
  db.run(`UPDATE orders SET ${updates.join(', ')} WHERE id = ?`, values, function(err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    
    logAuditEvent(req.user.id, 'ORDER_STATUS_UPDATED', 'orders', id, null, req.body, req);
    
    // Notify kitchen ONLY when kds_status is set to "Sent to Kitchen"
    if (kds_status === 'Sent to Kitchen') {
      // Fetch order details to send to kitchen
      db.get('SELECT * FROM orders WHERE id = ?', [id], (err, order) => {
        if (!err && order) {
          db.all(`SELECT oi.*, mi.name as item_name 
                  FROM order_items oi 
                  JOIN menu_items mi ON oi.menu_item_id = mi.id 
                  WHERE oi.order_id = ?`, [id], (err, items) => {
            if (!err && items) {
              io.to('kitchen').emit('new-order', { 
                orderId: id, 
                tableNumber: order.table_number, 
                items: items 
              });
            }
          });
        }
      });
    }
    
    io.emit('order-status-updated', { orderId: id, status, kds_status });
    
    res.json({ message: 'Order status updated successfully' });
  });
});

// Update order item status
app.put('/api/orders/:orderId/items/:itemId/status', authenticateToken, (req, res) => {
  const { orderId, itemId } = req.params;
  const { status, kds_status } = req.body;
  
  const updates = [];
  const values = [];
  
  if (status) {
    updates.push('status = ?');
    values.push(status);
    
    if (status === 'Ready') {
      updates.push('prepared_at = CURRENT_TIMESTAMP');
    } else if (status === 'Served') {
      updates.push('served_at = CURRENT_TIMESTAMP');
    }
  }
  
  if (kds_status) {
    updates.push('kds_status = ?');
    values.push(kds_status);
  }
  
  if (updates.length === 0) {
    return res.status(400).json({ error: 'No status provided' });
  }
  
  values.push(itemId, orderId);
  
  db.run(`UPDATE order_items SET ${updates.join(', ')} WHERE id = ? AND order_id = ?`, values, function(err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    
    io.to('kitchen').emit('item-status-updated', { orderId, itemId, status, kds_status });
    io.emit('order-item-updated', { orderId, itemId, status, kds_status });
    
    res.json({ message: 'Order item status updated successfully' });
  });
});

// ==================== KDS (Kitchen Display System) ====================

// Get orders for kitchen
app.get('/api/kitchen/orders', authenticateToken, authorize(['chef', 'cashier', 'manager', 'admin']), (req, res) => {
  const userShopId = req.user.shop_id;
  const shopFilter = userShopId ? `AND (o.shop_id = ${userShopId} OR o.shop_id IS NULL)` : '';
  
  const query = `
    SELECT 
      o.id as order_id,
      o.table_number,
      o.created_at,
      o.notes,
      o.kds_status as order_kds_status,
      oi.id as item_id,
      mi.name as item_name,
      mi.category,
      mv.name as variant_name,
      oi.quantity,
      oi.special_instructions,
      oi.status as item_status,
      oi.kds_status,
      oi.created_at as item_created_at
    FROM orders o
    JOIN order_items oi ON o.id = oi.order_id
    JOIN menu_items mi ON oi.menu_item_id = mi.id
    LEFT JOIN menu_variants mv ON oi.variant_id = mv.id
    WHERE o.kds_status IS NOT NULL 
      AND o.kds_status != '' 
      AND o.kds_status != 'New'
      AND o.payment_status != 'paid'
      AND oi.status != 'Served'
      ${shopFilter}
    ORDER BY o.created_at ASC, oi.id ASC
  `;
  
  db.all(query, (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    
    // Group items by order
    const orders = {};
    rows.forEach(row => {
      if (!orders[row.order_id]) {
        orders[row.order_id] = {
          order_id: row.order_id,
          table_number: row.table_number,
          created_at: row.created_at,
          notes: row.notes,
          items: []
        };
      }
      orders[row.order_id].items.push({
        item_id: row.item_id,
        item_name: row.item_name,
        category: row.category,
        variant_name: row.variant_name,
        quantity: row.quantity,
        special_instructions: row.special_instructions,
        status: row.item_status,
        kds_status: row.kds_status,
        created_at: row.item_created_at
      });
    });
    
    res.json(Object.values(orders));
  });
});

// ==================== TAX MANAGEMENT ====================

// Get all taxes
app.get('/api/taxes', authenticateToken, (req, res) => {
  db.all('SELECT * FROM taxes WHERE is_active = 1 ORDER BY name', (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(rows);
  });
});

// Create tax
app.post('/api/taxes', authenticateToken, authorize(['admin', 'manager']), (req, res) => {
  const { name, rate, is_inclusive } = req.body;
  
  db.run('INSERT INTO taxes (name, rate, is_inclusive) VALUES (?, ?, ?)',
    [name, rate, is_inclusive || 0], function(err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      
      logAuditEvent(req.user.id, 'TAX_CREATED', 'taxes', this.lastID, null, req.body, req);
      res.json({ id: this.lastID, message: 'Tax created successfully' });
    });
});

// Update tax
app.put('/api/taxes/:id', authenticateToken, authorize(['admin', 'manager']), (req, res) => {
  const { id } = req.params;
  const { name, rate, is_inclusive, is_active } = req.body;
  
  const updates = [];
  const values = [];
  
  if (name !== undefined) {
    updates.push('name = ?');
    values.push(name);
  }
  if (rate !== undefined) {
    updates.push('rate = ?');
    values.push(rate);
  }
  if (is_inclusive !== undefined) {
    updates.push('is_inclusive = ?');
    values.push(is_inclusive);
  }
  if (is_active !== undefined) {
    updates.push('is_active = ?');
    values.push(is_active);
  }
  
  if (updates.length === 0) {
    return res.status(400).json({ error: 'No valid fields to update' });
  }
  
  values.push(id);
  
  db.run(`UPDATE taxes SET ${updates.join(', ')} WHERE id = ?`, values, function(err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    
    logAuditEvent(req.user.id, 'TAX_UPDATED', 'taxes', id, null, req.body, req);
    res.json({ message: 'Tax updated successfully' });
  });
});

// Delete tax
app.delete('/api/taxes/:id', authenticateToken, authorize(['admin', 'manager']), (req, res) => {
  const { id } = req.params;
  
  // Get tax details for audit log
  db.get('SELECT * FROM taxes WHERE id = ?', [id], (err, tax) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    
    if (!tax) {
      return res.status(404).json({ error: 'Tax not found' });
    }
    
    db.run('DELETE FROM taxes WHERE id = ?', [id], function(err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      
      logAuditEvent(req.user.id, 'TAX_DELETED', 'taxes', id, tax, null, req);
      res.json({ message: 'Tax deleted successfully' });
    });
  });
});

// ==================== BILLING SYSTEM ====================

// Generate bill
app.post('/api/bills', authenticateToken, authorize(['cashier', 'manager', 'admin']), (req, res) => {
  const { orderId, discount_amount, discount_type, discount_reason, service_charge_rate, tax_ids } = req.body;
  const billId = uuidv4();
  
  db.get('SELECT * FROM orders WHERE id = ?', [orderId], (err, order) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }
    
    // Get order items
    db.all(`SELECT oi.*, mi.tax_applicable 
      FROM order_items oi
      JOIN menu_items mi ON oi.menu_item_id = mi.id
      WHERE oi.order_id = ?`, [orderId], (err, items) => {
        if (err) {
          return res.status(500).json({ error: err.message });
        }
        
        let subtotal = 0;
        items.forEach(item => {
          subtotal += item.price * item.quantity;
        });
        
        // Apply discount
        let discountAmount = discount_amount || 0;
        if (discount_type === 'percentage' && discount_amount) {
          discountAmount = (subtotal * discount_amount) / 100;
        }
        
        const afterDiscount = subtotal - discountAmount;
        
        // Calculate service charge
        const serviceChargeRate = service_charge_rate || 5.0;
        const serviceCharge = (afterDiscount * serviceChargeRate) / 100;
        
        // Calculate tax
        db.all('SELECT * FROM taxes WHERE is_active = 1', (err, taxes) => {
          if (err) {
            return res.status(500).json({ error: err.message });
          }
          
          let taxAmount = 0;
          taxes.forEach(tax => {
            if (!tax.is_inclusive) {
              taxAmount += ((afterDiscount + serviceCharge) * tax.rate) / 100;
            }
          });
          
          const beforeRounding = afterDiscount + serviceCharge + taxAmount;
          const roundOff = Math.round(beforeRounding) - beforeRounding;
          const totalAmount = Math.round(beforeRounding);
          
          // Insert bill
          db.run(`INSERT INTO bills (id, order_id, table_number, subtotal, tax_amount, service_charge, 
            discount_amount, discount_type, discount_reason, round_off, total_amount, staff_id, printed_count, last_printed_at) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, CURRENT_TIMESTAMP)`,
            [billId, orderId, order.table_number, subtotal, taxAmount, serviceCharge, discountAmount, 
             discount_type, discount_reason, roundOff, totalAmount, req.user.id], function(err) {
              if (err) {
                return res.status(500).json({ error: err.message });
              }
              
              // Update order and table status
              db.run('UPDATE orders SET status = "Billed" WHERE id = ?', [orderId]);
              db.run('UPDATE tables SET status = "Billed" WHERE current_order_id = ?', [orderId]);
              
              logAuditEvent(req.user.id, 'BILL_CREATED', 'bills', billId, null, { orderId, totalAmount }, req);
              
              res.json({
                billId,
                orderId,
                tableNumber: order.table_number,
                subtotal,
                discountAmount,
                serviceCharge,
                taxAmount,
                roundOff,
                totalAmount,
                message: 'Bill generated successfully'
              });
            });
        });
      });
  });
});

// Get all bills
app.get('/api/bills', authenticateToken, authorize(['cashier', 'manager', 'admin']), (req, res) => {
  const query = `
    SELECT 
      b.*,
      o.table_number,
      o.customer_name,
      o.customer_phone,
      u.first_name || ' ' || u.last_name as staff_name
    FROM bills b
    JOIN orders o ON b.order_id = o.id
    LEFT JOIN users u ON b.staff_id = u.id
    WHERE b.voided = 0
    ORDER BY b.created_at DESC
  `;
  
  db.all(query, (err, bills) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(bills);
  });
});

// Update bill
app.put('/api/bills/:billId', authenticateToken, authorize(['manager', 'admin']), (req, res) => {
  const { billId } = req.params;
  const { subtotal, tax_amount, service_charge, discount_amount, discount_reason, total_amount } = req.body;
  
  db.run(`UPDATE bills SET 
    subtotal = ?,
    tax_amount = ?, 
    service_charge = ?, 
    discount_amount = ?, 
    discount_reason = ?,
    total_amount = ?
    WHERE id = ?`,
    [subtotal, tax_amount, service_charge, discount_amount, discount_reason, total_amount, billId], 
    function(err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      
      if (this.changes === 0) {
        return res.status(404).json({ error: 'Bill not found' });
      }
      
      logAuditEvent(req.user.id, 'BILL_UPDATED', 'bills', billId, null, req.body, req);
      res.json({ message: 'Bill updated successfully' });
    }
  );
});

// Delete bill
app.delete('/api/bills/:billId', authenticateToken, authorize(['manager', 'admin']), (req, res) => {
  const { billId } = req.params;
  
  db.run('DELETE FROM bills WHERE id = ?', [billId], function(err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    
    if (this.changes === 0) {
      return res.status(404).json({ error: 'Bill not found' });
    }
    
    logAuditEvent(req.user.id, 'BILL_DELETED', 'bills', billId, null, null, req);
    res.json({ message: 'Bill deleted successfully' });
  });
});

// Get bill details
app.get('/api/bills/:billId', authenticateToken, (req, res) => {
  const { billId } = req.params;
  
  const query = `
    SELECT 
      b.*,
      o.customer_name,
      o.customer_phone,
      u.first_name || ' ' || u.last_name as staff_name
    FROM bills b
    JOIN orders o ON b.order_id = o.id
    LEFT JOIN users u ON b.staff_id = u.id
    WHERE b.id = ? AND b.voided = 0
  `;
  
  db.get(query, [billId], (err, bill) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    
    if (!bill) {
      return res.status(404).json({ error: 'Bill not found' });
    }
    
    // Get order items
    db.all(`SELECT oi.*, mi.name as item_name, mv.name as variant_name
      FROM order_items oi
      JOIN menu_items mi ON oi.menu_item_id = mi.id
      LEFT JOIN menu_variants mv ON oi.variant_id = mv.id
      WHERE oi.order_id = ?`, [bill.order_id], (err, items) => {
        if (err) {
          return res.status(500).json({ error: err.message });
        }
        
        // Get shop settings
        db.all('SELECT key, value FROM settings', (err, settings) => {
          if (err) {
            return res.status(500).json({ error: err.message });
          }
          
          const settingsObj = {};
          settings.forEach(s => {
            settingsObj[s.key] = s.value;
          });
          
          res.json({
            ...bill,
            items: items.map(item => ({
              item_name: item.item_name,
              variant_name: item.variant_name,
              quantity: item.quantity,
              price: item.price,
              total: item.quantity * item.price,
              special_instructions: item.special_instructions
            })),
            shop_info: settingsObj
          });
        });
      });
  });
});

// Update bill payment status
app.put('/api/bills/:billId/payment', authenticateToken, (req, res) => {
  const { billId } = req.params;
  const { payment_method, payment_status } = req.body;
  
  db.run('UPDATE bills SET payment_method = ?, payment_status = ? WHERE id = ? AND voided = 0',
    [payment_method, payment_status, billId], function(err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      
      if (payment_status === 'paid') {
        // Free up table
        db.run('UPDATE tables SET status = "Free", current_order_id = NULL WHERE status = "Billed"');
      }
      
      logAuditEvent(req.user.id, 'BILL_PAYMENT_UPDATED', 'bills', billId, null, req.body, req);
      res.json({ message: 'Payment status updated successfully' });
    });
});

// Reprint bill
app.post('/api/bills/:billId/reprint', authenticateToken, (req, res) => {
  const { billId } = req.params;
  
  db.run('UPDATE bills SET printed_count = printed_count + 1, last_printed_at = CURRENT_TIMESTAMP WHERE id = ? AND voided = 0',
    [billId], function(err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      
      logAuditEvent(req.user.id, 'BILL_REPRINTED', 'bills', billId, null, null, req);
      res.json({ message: 'Bill reprinted successfully' });
    });
});

// Void bill
app.post('/api/bills/:billId/void', authenticateToken, authorize(['manager', 'admin']), (req, res) => {
  const { billId } = req.params;
  const { void_reason } = req.body;
  
  if (!void_reason) {
    return res.status(400).json({ error: 'Void reason is required' });
  }
  
  db.get('SELECT * FROM bills WHERE id = ?', [billId], (err, bill) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    
    if (!bill) {
      return res.status(404).json({ error: 'Bill not found' });
    }
    
    if (bill.voided) {
      return res.status(400).json({ error: 'Bill already voided' });
    }
    
    db.run('UPDATE bills SET voided = 1, void_reason = ?, voided_by = ?, voided_at = CURRENT_TIMESTAMP WHERE id = ?',
      [void_reason, req.user.id, billId], function(err) {
        if (err) {
          return res.status(500).json({ error: err.message });
        }
        
        // Revert order and table status
        db.run('UPDATE orders SET status = "New" WHERE id = ?', [bill.order_id]);
        db.run('UPDATE tables SET status = "Occupied" WHERE current_order_id = ?', [bill.order_id]);
        
        logAuditEvent(req.user.id, 'BILL_VOIDED', 'bills', billId, bill, { void_reason }, req);
        res.json({ message: 'Bill voided successfully' });
      });
  });
});

// Split bill
app.post('/api/bills/:billId/split', authenticateToken, authorize(['cashier', 'manager', 'admin']), (req, res) => {
  const { billId } = req.params;
  const { split_count, split_amounts } = req.body;
  
  if (!split_count || split_count < 2) {
    return res.status(400).json({ error: 'Split count must be at least 2' });
  }
  
  db.get('SELECT * FROM bills WHERE id = ? AND voided = 0', [billId], (err, bill) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    
    if (!bill) {
      return res.status(404).json({ error: 'Bill not found' });
    }
    
    // Update main bill
    db.run('UPDATE bills SET is_split = 1, split_count = ? WHERE id = ?', [split_count, billId], (err) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      
      // Create split bill entries
      const amounts = split_amounts || Array(split_count).fill(bill.total_amount / split_count);
      let completed = 0;
      
      amounts.forEach((amount, index) => {
        const splitBillId = uuidv4();
        db.run('INSERT INTO split_bills (id, parent_bill_id, split_number, amount) VALUES (?, ?, ?, ?)',
          [splitBillId, billId, index + 1, amount], (err) => {
            if (err) {
              return res.status(500).json({ error: err.message });
            }
            
            completed++;
            if (completed === amounts.length) {
              logAuditEvent(req.user.id, 'BILL_SPLIT', 'bills', billId, null, { split_count, amounts }, req);
              res.json({ message: 'Bill split successfully', split_count, amounts });
            }
          });
      });
    });
  });
});

// Get split bills
app.get('/api/bills/:billId/splits', authenticateToken, (req, res) => {
  const { billId } = req.params;
  
  db.all('SELECT * FROM split_bills WHERE parent_bill_id = ? ORDER BY split_number', [billId], (err, splits) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(splits);
  });
});

// Update split bill payment
app.put('/api/bills/splits/:splitId/payment', authenticateToken, (req, res) => {
  const { splitId } = req.params;
  const { payment_method, payment_status } = req.body;
  
  db.run('UPDATE split_bills SET payment_method = ?, payment_status = ? WHERE id = ?',
    [payment_method, payment_status, splitId], function(err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      
      res.json({ message: 'Split bill payment updated successfully' });
    });
});

// Sales Reports and Analytics
app.get('/api/reports/sales', authenticateToken, authorize(['manager', 'admin']), (req, res) => {
  const { startDate, endDate, period = 'daily' } = req.query;
  const userShopId = req.user.shop_id;
  
  let dateFilter = '';
  let groupBy = '';
  
  if (startDate && endDate) {
    dateFilter = `WHERE DATE(b.created_at) BETWEEN '${startDate}' AND '${endDate}'`;
  }
  
  // Add shop filter
  if (userShopId) {
    dateFilter = dateFilter ? `${dateFilter} AND (b.shop_id = ${userShopId} OR b.shop_id IS NULL)` : `WHERE (b.shop_id = ${userShopId} OR b.shop_id IS NULL)`;
  }
  
  switch (period) {
    case 'daily':
      groupBy = 'DATE(b.created_at)';
      break;
    case 'weekly':
      groupBy = 'strftime("%Y-%W", b.created_at)';
      break;
    case 'monthly':
      groupBy = 'strftime("%Y-%m", b.created_at)';
      break;
    default:
      groupBy = 'DATE(b.created_at)';
  }
  
  const whereClause = dateFilter 
    ? `${dateFilter} AND b.payment_status = 'paid' AND b.voided = 0`
    : `WHERE b.payment_status = 'paid' AND b.voided = 0`;
    
  const query = `
    SELECT 
      ${groupBy} as period,
      SUM(b.total_amount) as total_sales,
      COUNT(DISTINCT b.order_id) as total_orders,
      SUM(oi.quantity) as total_items_sold,
      AVG(b.total_amount) as average_order_value,
      SUM(b.tax_amount) as total_tax,
      SUM(b.discount_amount) as total_discounts
    FROM bills b
    JOIN order_items oi ON b.order_id = oi.order_id
    ${whereClause}
    GROUP BY ${groupBy}
    ORDER BY period ASC
  `;
  
  db.all(query, (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
});

app.get('/api/reports/top-items', authenticateToken, authorize(['manager', 'admin']), (req, res) => {
  const { startDate, endDate, limit = 10 } = req.query;
  const userShopId = req.user.shop_id;
  
  let dateFilter = '';
  if (startDate && endDate) {
    dateFilter = `AND DATE(b.created_at) BETWEEN '${startDate}' AND '${endDate}'`;
  }
  
  // Add shop filter
  if (userShopId) {
    dateFilter += ` AND (b.shop_id = ${userShopId} OR b.shop_id IS NULL)`;
  }
  
  const query = `
    SELECT 
      mi.name,
      mi.category,
      SUM(oi.quantity) as total_quantity,
      SUM(oi.quantity * oi.price) as total_revenue,
      COUNT(DISTINCT oi.order_id) as order_count
    FROM order_items oi
    JOIN menu_items mi ON oi.menu_item_id = mi.id
    JOIN bills b ON oi.order_id = b.order_id
    WHERE b.payment_status = 'paid' ${dateFilter}
    GROUP BY mi.id, mi.name, mi.category
    ORDER BY total_quantity DESC
    LIMIT ?
  `;
  
  db.all(query, [limit], (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
});

app.get('/api/reports/staff-performance', authenticateToken, authorize(['manager', 'admin']), (req, res) => {
  const { startDate, endDate } = req.query;
  
  let dateFilter = '';
  if (startDate && endDate) {
    dateFilter = `WHERE DATE(b.created_at) BETWEEN '${startDate}' AND '${endDate}'`;
  }
  
  const query = `
    SELECT 
      u.first_name,
      u.last_name,
      u.username,
      COUNT(DISTINCT b.id) as bills_generated,
      SUM(b.total_amount) as total_sales,
      AVG(b.total_amount) as average_bill_value,
      COUNT(DISTINCT o.id) as orders_taken
    FROM users u
    LEFT JOIN bills b ON u.id = b.staff_id ${dateFilter ? `AND DATE(b.created_at) BETWEEN '${startDate}' AND '${endDate}'` : ''}
    LEFT JOIN orders o ON u.id = o.staff_id ${dateFilter ? `AND DATE(o.created_at) BETWEEN '${startDate}' AND '${endDate}'` : ''}
    WHERE u.role IN ('cashier', 'chef', 'manager', 'admin')
    GROUP BY u.id, u.first_name, u.last_name, u.username
    ORDER BY total_sales DESC
  `;
  
  db.all(query, (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
});

// Daily payments breakdown
app.get('/api/reports/daily-payments', authenticateToken, authorize(['manager', 'admin']), (req, res) => {
  const { startDate, endDate } = req.query;
  const userShopId = req.user.shop_id;
  
  let whereClause = 'WHERE payment_status = \'paid\' AND voided = 0';
  if (startDate && endDate) {
    whereClause = `WHERE DATE(created_at) BETWEEN '${startDate}' AND '${endDate}' AND payment_status = 'paid' AND voided = 0`;
  }
  
  // Add shop filter
  if (userShopId) {
    whereClause += ` AND (shop_id = ${userShopId} OR shop_id IS NULL)`;
  }
  
  const query = `
    SELECT 
      DATE(created_at) as date,
      SUM(CASE WHEN payment_method = 'Cash' THEN total_amount ELSE 0 END) as cash,
      SUM(CASE WHEN payment_method = 'Card' THEN total_amount ELSE 0 END) as card,
      SUM(CASE WHEN payment_method = 'UPI' THEN total_amount ELSE 0 END) as upi
    FROM bills
    ${whereClause}
    GROUP BY DATE(created_at)
    ORDER BY DATE(created_at) ASC
  `;
  
  db.all(query, (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
});

app.get('/api/reports/dashboard', authenticateToken, authorize(['manager', 'admin']), (req, res) => {
  const today = moment().format('YYYY-MM-DD');
  const yesterday = moment().subtract(1, 'day').format('YYYY-MM-DD');
  const thisMonth = moment().format('YYYY-MM');
  const lastMonth = moment().subtract(1, 'month').format('YYYY-MM');
  
  // Today's sales
  db.get(`SELECT 
    COALESCE(SUM(total_amount), 0) as today_sales,
    COALESCE(COUNT(*), 0) as today_orders
    FROM bills 
    WHERE DATE(created_at) = ? AND payment_status = 'paid'`, [today], (err, todayData) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    
    // Yesterday's sales
    db.get(`SELECT 
      COALESCE(SUM(total_amount), 0) as yesterday_sales,
      COALESCE(COUNT(*), 0) as yesterday_orders
      FROM bills 
      WHERE DATE(created_at) = ? AND payment_status = 'paid'`, [yesterday], (err, yesterdayData) => {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      
      // This month's sales
      db.get(`SELECT 
        COALESCE(SUM(total_amount), 0) as month_sales,
        COALESCE(COUNT(*), 0) as month_orders
        FROM bills 
        WHERE strftime("%Y-%m", created_at) = ? AND payment_status = 'paid'`, [thisMonth], (err, monthData) => {
        if (err) {
          res.status(500).json({ error: err.message });
          return;
        }
        
        // Last month's sales
        db.get(`SELECT 
          COALESCE(SUM(total_amount), 0) as last_month_sales,
          COALESCE(COUNT(*), 0) as last_month_orders
          FROM bills 
          WHERE strftime("%Y-%m", created_at) = ? AND payment_status = 'paid'`, [lastMonth], (err, lastMonthData) => {
          if (err) {
            res.status(500).json({ error: err.message });
            return;
          }
          
          // Low stock items
          db.all(`SELECT name, stock_quantity, low_stock_threshold 
            FROM menu_items 
            WHERE stock_quantity <= low_stock_threshold AND is_available = 1`, (err, lowStockItems) => {
            if (err) {
              res.status(500).json({ error: err.message });
              return;
            }
            
            res.json({
              today: todayData,
              yesterday: yesterdayData,
              thisMonth: monthData,
              lastMonth: lastMonthData,
              lowStockItems,
              salesGrowth: monthData.month_sales - lastMonthData.last_month_sales,
              ordersGrowth: monthData.month_orders - lastMonthData.last_month_orders
            });
          });
        });
      });
    });
  });
});

// Inventory Management
app.get('/api/inventory', authenticateToken, authorize(['manager', 'admin']), (req, res) => {
  db.all('SELECT * FROM menu_items ORDER BY category, name', (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
});

app.put('/api/inventory/:id', authenticateToken, authorize(['manager', 'admin']), (req, res) => {
  const { id } = req.params;
  const { stock_quantity, low_stock_threshold, price, is_available } = req.body;
  
  const updates = [];
  const values = [];
  
  if (stock_quantity !== undefined) {
    updates.push('stock_quantity = ?');
    values.push(stock_quantity);
  }
  if (low_stock_threshold !== undefined) {
    updates.push('low_stock_threshold = ?');
    values.push(low_stock_threshold);
  }
  if (price !== undefined) {
    updates.push('price = ?');
    values.push(price);
  }
  if (is_available !== undefined) {
    updates.push('is_available = ?');
    values.push(is_available);
  }
  
  if (updates.length === 0) {
    return res.status(400).json({ error: 'No valid fields to update' });
  }
  
  values.push(id);
  
  db.run(`UPDATE menu_items SET ${updates.join(', ')} WHERE id = ?`, values, function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    
    logAuditEvent(req.user.id, 'INVENTORY_UPDATED', 'menu_items', id, null, req.body, req);
    res.json({ message: 'Inventory updated successfully' });
  });
});

// ==================== SHOP MANAGEMENT ====================

// Get all shops
app.get('/api/shops', authenticateToken, authorize(['admin', 'manager', 'owner']), (req, res) => {
  db.all('SELECT * FROM shops ORDER BY is_primary DESC, created_at DESC', (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(rows);
  });
});

// Get single shop
app.get('/api/shops/:id', authenticateToken, (req, res) => {
  const { id } = req.params;
  
  db.get('SELECT * FROM shops WHERE id = ?', [id], (err, shop) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    
    if (!shop) {
      return res.status(404).json({ error: 'Shop not found' });
    }
    
    res.json(shop);
  });
});

// Create shop
app.post('/api/shops', authenticateToken, authorize(['admin', 'owner']), (req, res) => {
  const { name, address, city, state, zip_code, country, phone, email, tax_id, is_primary } = req.body;
  
  db.serialize(() => {
    db.run('BEGIN TRANSACTION');
    
    // If setting as primary, unset other primary shops
    if (is_primary) {
      db.run('UPDATE shops SET is_primary = 0', (err) => {
        if (err) {
          db.run('ROLLBACK');
          return res.status(500).json({ error: err.message });
        }
      });
    }
    
    db.run(`INSERT INTO shops (name, address, city, state, zip_code, country, phone, email, tax_id, is_primary) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [name, address, city, state, zip_code, country, phone, email, tax_id, is_primary || 0],
      function(err) {
        if (err) {
          db.run('ROLLBACK');
          return res.status(500).json({ error: err.message });
        }
        
        db.run('COMMIT', (err) => {
          if (err) {
            return res.status(500).json({ error: err.message });
          }
          
          logAuditEvent(req.user.id, 'SHOP_CREATED', 'shops', this.lastID, null, req.body, req);
          res.json({ id: this.lastID, message: 'Shop created successfully' });
        });
      });
  });
});

// Update shop
app.put('/api/shops/:id', authenticateToken, authorize(['admin', 'manager', 'owner']), (req, res) => {
  const { id } = req.params;
  const { name, address, city, state, zip_code, country, phone, email, tax_id, is_primary, is_active, admin_username } = req.body;
  
  const updates = [];
  const values = [];
  
  if (name !== undefined) {
    updates.push('name = ?');
    values.push(name);
  }
  if (address !== undefined) {
    updates.push('address = ?');
    values.push(address);
  }
  if (city !== undefined) {
    updates.push('city = ?');
    values.push(city);
  }
  if (state !== undefined) {
    updates.push('state = ?');
    values.push(state);
  }
  if (zip_code !== undefined) {
    updates.push('zip_code = ?');
    values.push(zip_code);
  }
  if (country !== undefined) {
    updates.push('country = ?');
    values.push(country);
  }
  if (phone !== undefined) {
    updates.push('phone = ?');
    values.push(phone);
  }
  if (email !== undefined) {
    updates.push('email = ?');
    values.push(email);
  }
  if (tax_id !== undefined) {
    updates.push('tax_id = ?');
    values.push(tax_id);
  }
  if (is_primary !== undefined) {
    updates.push('is_primary = ?');
    values.push(is_primary);
  }
  if (is_active !== undefined) {
    updates.push('is_active = ?');
    values.push(is_active);
  }
  if (admin_username !== undefined) {
    updates.push('admin_username = ?');
    values.push(admin_username);
  }
  
  if (updates.length === 0) {
    return res.status(400).json({ error: 'No valid fields to update' });
  }
  
  updates.push('updated_at = CURRENT_TIMESTAMP');
  values.push(id);
  
  db.serialize(() => {
    db.run('BEGIN TRANSACTION');
    
    // If setting as primary, unset other primary shops
    if (is_primary) {
      db.run('UPDATE shops SET is_primary = 0 WHERE id != ?', [id], (err) => {
        if (err) {
          db.run('ROLLBACK');
          return res.status(500).json({ error: err.message });
        }
      });
    }
    
    db.run(`UPDATE shops SET ${updates.join(', ')} WHERE id = ?`, values, function(err) {
      if (err) {
        db.run('ROLLBACK');
        return res.status(500).json({ error: err.message });
      }
      
      db.run('COMMIT', (err) => {
        if (err) {
          return res.status(500).json({ error: err.message });
        }
        
        logAuditEvent(req.user.id, 'SHOP_UPDATED', 'shops', id, null, req.body, req);
        res.json({ message: 'Shop updated successfully' });
      });
    });
  });
});

// Upload shop logo
app.post('/api/shops/:id/logo', authenticateToken, authorize(['admin', 'manager']), upload.single('logo'), (req, res) => {
  const { id } = req.params;
  
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }
  
  const logoUrl = `/uploads/shop-logos/${req.file.filename}`;
  
  // Get current logo to delete old file
  db.get('SELECT logo_url FROM shops WHERE id = ?', [id], (err, shop) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    
    if (!shop) {
      return res.status(404).json({ error: 'Shop not found' });
    }
    
    // Update shop with new logo URL
    db.run('UPDATE shops SET logo_url = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [logoUrl, id], (err) => {
        if (err) {
          return res.status(500).json({ error: err.message });
        }
        
        // Delete old logo file if exists
        if (shop.logo_url) {
          const oldFilePath = path.join(__dirname, shop.logo_url);
          if (fs.existsSync(oldFilePath)) {
            fs.unlinkSync(oldFilePath);
          }
        }
        
        logAuditEvent(req.user.id, 'SHOP_LOGO_UPDATED', 'shops', id, null, { logo_url: logoUrl }, req);
        res.json({ logo_url: logoUrl, message: 'Shop logo uploaded successfully' });
      });
  });
});

// Delete shop logo
app.delete('/api/shops/:id/logo', authenticateToken, authorize(['admin', 'manager']), (req, res) => {
  const { id } = req.params;
  
  db.get('SELECT logo_url FROM shops WHERE id = ?', [id], (err, shop) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    
    if (!shop || !shop.logo_url) {
      return res.status(404).json({ error: 'No logo to delete' });
    }
    
    // Delete logo file
    const filePath = path.join(__dirname, shop.logo_url);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
    
    // Update database
    db.run('UPDATE shops SET logo_url = NULL, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [id], (err) => {
        if (err) {
          return res.status(500).json({ error: err.message });
        }
        
        logAuditEvent(req.user.id, 'SHOP_LOGO_DELETED', 'shops', id, null, null, req);
        res.json({ message: 'Shop logo deleted successfully' });
      });
  });
});

// Delete shop
app.delete('/api/shops/:id', authenticateToken, authorize(['admin', 'owner']), (req, res) => {
  const { id } = req.params;
  
  db.get('SELECT * FROM shops WHERE id = ?', [id], (err, shop) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    
    if (!shop) {
      return res.status(404).json({ error: 'Shop not found' });
    }
    
    if (shop.is_primary) {
      return res.status(400).json({ error: 'Cannot delete primary shop. Set another shop as primary first.' });
    }
    
    db.serialize(() => {
      db.run('BEGIN TRANSACTION');
      
      // Delete all users associated with this shop
      db.run('DELETE FROM users WHERE shop_id = ?', [id], function(err) {
        if (err) {
          db.run('ROLLBACK');
          return res.status(500).json({ error: 'Failed to delete shop users' });
        }
        
        const deletedUsers = this.changes;
        console.log(`Deleted ${deletedUsers} users from shop ${id}`);
        
        // Delete all menu items for this shop
        db.run('DELETE FROM menu_items WHERE shop_id = ?', [id], function(err) {
          if (err) {
            db.run('ROLLBACK');
            return res.status(500).json({ error: 'Failed to delete shop menu' });
          }
          
          const deletedMenuItems = this.changes;
          console.log(`Deleted ${deletedMenuItems} menu items from shop ${id}`);
          
          // Delete all tables for this shop
          db.run('DELETE FROM tables WHERE shop_id = ?', [id], function(err) {
            if (err) {
              db.run('ROLLBACK');
              return res.status(500).json({ error: 'Failed to delete shop tables' });
            }
            
            const deletedTables = this.changes;
            console.log(`Deleted ${deletedTables} tables from shop ${id}`);
            
            // Delete logo file if exists
            if (shop.logo_url) {
              const filePath = path.join(__dirname, shop.logo_url);
              if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
              }
            }
            
            // Finally delete the shop
            db.run('DELETE FROM shops WHERE id = ?', [id], function(err) {
              if (err) {
                db.run('ROLLBACK');
                return res.status(500).json({ error: err.message });
              }
              
              db.run('COMMIT', (err) => {
                if (err) {
                  return res.status(500).json({ error: 'Failed to commit transaction' });
                }
                
                logAuditEvent(req.user.id, 'SHOP_DELETED', 'shops', id, shop, { 
                  deleted_users: deletedUsers,
                  deleted_menu_items: deletedMenuItems,
                  deleted_tables: deletedTables
                }, req);
                
                res.json({ 
                  message: 'Shop deleted successfully',
                  deleted_users: deletedUsers,
                  deleted_menu_items: deletedMenuItems,
                  deleted_tables: deletedTables
                });
              });
            });
          });
        });
      });
    });
  });
});

// ==================== USER PROFILE ====================

// Get user profile (own profile)
app.get('/api/profile', authenticateToken, (req, res) => {
  db.get(`SELECT id, username, email, role, first_name, last_name, phone, avatar_url, is_active, created_at, updated_at, company_name, shop_id 
    FROM users WHERE id = ?`, [req.user.id], (err, user) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json(user);
  });
});

// Update user profile (own profile)
app.put('/api/profile', authenticateToken, [
  body('first_name').optional().notEmpty().withMessage('First name cannot be empty'),
  body('last_name').optional().notEmpty().withMessage('Last name cannot be empty'),
  body('email').optional().isEmail().withMessage('Valid email is required'),
  body('phone').optional(),
  body('current_password').optional(),
  body('new_password').optional().isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  
  const { first_name, last_name, email, phone, current_password, new_password, company_name } = req.body;
  
  // Get current user data
  db.get('SELECT * FROM users WHERE id = ?', [req.user.id], (err, currentUser) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    
    if (!currentUser) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // If changing password, verify current password
    if (new_password) {
      if (!current_password) {
        return res.status(400).json({ error: 'Current password is required to set new password' });
      }
      
      if (!bcrypt.compareSync(current_password, currentUser.password_hash)) {
        return res.status(401).json({ error: 'Current password is incorrect' });
      }
    }
    
    const updates = [];
    const values = [];
    
    if (first_name !== undefined) {
      updates.push('first_name = ?');
      values.push(first_name);
    }
    if (last_name !== undefined) {
      updates.push('last_name = ?');
      values.push(last_name);
    }
    if (email !== undefined) {
      updates.push('email = ?');
      values.push(email);
    }
    if (phone !== undefined) {
      updates.push('phone = ?');
      values.push(phone);
    }
    if (new_password) {
      updates.push('password_hash = ?');
      values.push(bcrypt.hashSync(new_password, 10));
    }
    if (company_name !== undefined) {
      updates.push('company_name = ?');
      values.push(company_name);
    }
    
    if (updates.length === 0) {
      return res.status(400).json({ error: 'No valid fields to update' });
    }
    
    updates.push('updated_at = CURRENT_TIMESTAMP');
    values.push(req.user.id);
    
    db.run(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`, values, function(err) {
      if (err) {
        if (err.message.includes('UNIQUE constraint failed')) {
          return res.status(400).json({ error: 'Email already exists' });
        }
        return res.status(500).json({ error: err.message });
      }
      
      logAuditEvent(req.user.id, 'PROFILE_UPDATED', 'users', req.user.id, currentUser, req.body, req);
      res.json({ message: 'Profile updated successfully' });
    });
  });
});

// Upload user avatar
app.post('/api/profile/avatar', authenticateToken, upload.single('avatar'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }
  
  const avatarUrl = `/uploads/avatars/${req.file.filename}`;
  
  // Get current avatar to delete old file
  db.get('SELECT avatar_url FROM users WHERE id = ?', [req.user.id], (err, user) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    
    // Update user with new avatar URL
    db.run('UPDATE users SET avatar_url = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [avatarUrl, req.user.id], (err) => {
        if (err) {
          return res.status(500).json({ error: err.message });
        }
        
        // Delete old avatar file if exists
        if (user && user.avatar_url) {
          const oldFilePath = path.join(__dirname, user.avatar_url);
          if (fs.existsSync(oldFilePath)) {
            fs.unlinkSync(oldFilePath);
          }
        }
        
        logAuditEvent(req.user.id, 'AVATAR_UPDATED', 'users', req.user.id, null, { avatar_url: avatarUrl }, req);
        res.json({ avatar_url: avatarUrl, message: 'Avatar uploaded successfully' });
      });
  });
});

// Delete user avatar
app.delete('/api/profile/avatar', authenticateToken, (req, res) => {
  db.get('SELECT avatar_url FROM users WHERE id = ?', [req.user.id], (err, user) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    
    if (!user || !user.avatar_url) {
      return res.status(404).json({ error: 'No avatar to delete' });
    }
    
    // Delete avatar file
    const filePath = path.join(__dirname, user.avatar_url);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
    
    // Update database
    db.run('UPDATE users SET avatar_url = NULL, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [req.user.id], (err) => {
        if (err) {
          return res.status(500).json({ error: err.message });
        }
        
        logAuditEvent(req.user.id, 'AVATAR_DELETED', 'users', req.user.id, null, null, req);
        res.json({ message: 'Avatar deleted successfully' });
      });
  });
});

// Change user password (for other users - admin/owner)
app.put('/api/users/:id/password', authenticateToken, authorize(['admin', 'owner']), [
  body('new_password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  
  const { id } = req.params;
  const { new_password } = req.body;
  
  const passwordHash = bcrypt.hashSync(new_password, 10);
  
  db.run('UPDATE users SET password_hash = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', 
    [passwordHash, id], function(err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      
      if (this.changes === 0) {
        return res.status(404).json({ error: 'User not found' });
      }
      
      logAuditEvent(req.user.id, 'USER_PASSWORD_RESET', 'users', id, null, { reset_by: req.user.id }, req);
      res.json({ message: 'Password updated successfully' });
    });
});

// ==================== SETTINGS MANAGEMENT ====================

// Get all settings
app.get('/api/settings', authenticateToken, (req, res) => {
  db.all('SELECT * FROM settings', (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    
    const settings = {};
    rows.forEach(row => {
      settings[row.key] = row.value;
    });
    
    res.json(settings);
  });
});

// Update setting
app.put('/api/settings/:key', authenticateToken, authorize(['admin', 'manager']), (req, res) => {
  const { key } = req.params;
  const { value } = req.body;
  
  db.run('INSERT OR REPLACE INTO settings (key, value, updated_at) VALUES (?, ?, CURRENT_TIMESTAMP)',
    [key, value], function(err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      
      logAuditEvent(req.user.id, 'SETTING_UPDATED', 'settings', key, null, { key, value }, req);
      res.json({ message: 'Setting updated successfully' });
    });
});

// Bulk update settings
app.post('/api/settings/bulk', authenticateToken, authorize(['admin', 'manager']), (req, res) => {
  const settings = req.body;
  
  if (!settings || typeof settings !== 'object') {
    return res.status(400).json({ error: 'Invalid settings object' });
  }
  
  db.serialize(() => {
    db.run('BEGIN TRANSACTION');
    
    const stmt = db.prepare('INSERT OR REPLACE INTO settings (key, value, updated_at) VALUES (?, ?, CURRENT_TIMESTAMP)');
    
    Object.keys(settings).forEach(key => {
      stmt.run(key, settings[key]);
    });
    
    stmt.finalize((err) => {
      if (err) {
        db.run('ROLLBACK');
        return res.status(500).json({ error: err.message });
      }
      
      db.run('COMMIT', (err) => {
        if (err) {
          return res.status(500).json({ error: err.message });
        }
        
        logAuditEvent(req.user.id, 'SETTINGS_BULK_UPDATE', 'settings', null, null, settings, req);
        res.json({ message: 'Settings updated successfully' });
      });
    });
  });
});

// ==================== PRINT QUEUE & OFFLINE SUPPORT ====================

// Add to print queue
app.post('/api/print-queue', authenticateToken, (req, res) => {
  const { bill_id, printer_name, print_data } = req.body;
  
  db.run('INSERT INTO print_queue (bill_id, printer_name, print_data) VALUES (?, ?, ?)',
    [bill_id, printer_name, JSON.stringify(print_data)], function(err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      
      res.json({ id: this.lastID, message: 'Added to print queue' });
    });
});

// Get pending print jobs
app.get('/api/print-queue/pending', authenticateToken, (req, res) => {
  db.all('SELECT * FROM print_queue WHERE status = "pending" AND retry_count < 3 ORDER BY created_at ASC LIMIT 50',
    (err, rows) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      
      const jobs = rows.map(row => ({
        ...row,
        print_data: JSON.parse(row.print_data)
      }));
      
      res.json(jobs);
    });
});

// Update print job status
app.put('/api/print-queue/:id', authenticateToken, (req, res) => {
  const { id } = req.params;
  const { status, error_message } = req.body;
  
  const updates = ['status = ?'];
  const values = [status];
  
  if (status === 'completed') {
    updates.push('processed_at = CURRENT_TIMESTAMP');
  } else if (status === 'failed') {
    updates.push('retry_count = retry_count + 1');
    if (error_message) {
      updates.push('error_message = ?');
      values.push(error_message);
    }
  }
  
  values.push(id);
  
  db.run(`UPDATE print_queue SET ${updates.join(', ')} WHERE id = ?`, values, function(err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    
    res.json({ message: 'Print job updated successfully' });
  });
});

// Retry failed print jobs
app.post('/api/print-queue/retry-failed', authenticateToken, authorize(['admin', 'manager']), (req, res) => {
  db.run('UPDATE print_queue SET status = "pending", retry_count = 0, error_message = NULL WHERE status = "failed"',
    function(err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      
      res.json({ message: `Reset ${this.changes} failed print jobs`, affected: this.changes });
    });
});

// ==================== AUDIT LOGS ====================

// Get audit logs
app.get('/api/audit-logs', authenticateToken, authorize(['admin', 'manager']), (req, res) => {
  const { action, table_name, start_date, end_date, user_id, limit = 100 } = req.query;
  
  let whereClause = '';
  const params = [];
  
  if (action) {
    whereClause += 'WHERE action = ?';
    params.push(action);
  }
  
  if (table_name) {
    whereClause += (whereClause ? ' AND ' : 'WHERE ') + 'table_name = ?';
    params.push(table_name);
  }
  
  if (user_id) {
    whereClause += (whereClause ? ' AND ' : 'WHERE ') + 'user_id = ?';
    params.push(user_id);
  }
  
  if (start_date) {
    whereClause += (whereClause ? ' AND ' : 'WHERE ') + 'DATE(created_at) >= ?';
    params.push(start_date);
  }
  
  if (end_date) {
    whereClause += (whereClause ? ' AND ' : 'WHERE ') + 'DATE(created_at) <= ?';
    params.push(end_date);
  }
  
  params.push(parseInt(limit));
  
  const query = `
    SELECT a.*, u.username, u.first_name || ' ' || u.last_name as user_name
    FROM audit_logs a
    LEFT JOIN users u ON a.user_id = u.id
    ${whereClause}
    ORDER BY a.created_at DESC
    LIMIT ?
  `;
  
  db.all(query, params, (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    
    const logs = rows.map(row => ({
      ...row,
      old_values: row.old_values ? JSON.parse(row.old_values) : null,
      new_values: row.new_values ? JSON.parse(row.new_values) : null
    }));
    
    res.json(logs);
  });
});

// ==================== CSV EXPORT ====================

// Export sales report as CSV
app.get('/api/reports/export/sales', authenticateToken, authorize(['manager', 'admin']), (req, res) => {
  const { startDate, endDate } = req.query;
  
  let dateFilter = '';
  if (startDate && endDate) {
    dateFilter = `WHERE DATE(b.created_at) BETWEEN '${startDate}' AND '${endDate}'`;
  }
  
  const query = `
    SELECT 
      b.id as bill_id,
      b.created_at,
      b.table_number,
      b.subtotal,
      b.tax_amount,
      b.service_charge,
      b.discount_amount,
      b.total_amount,
      b.payment_method,
      b.payment_status,
      u.username as staff
    FROM bills b
    LEFT JOIN users u ON b.staff_id = u.id
    ${dateFilter}
    WHERE b.voided = 0
    ORDER BY b.created_at DESC
  `;
  
  db.all(query, (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    
    // Generate CSV
    const headers = ['Bill ID', 'Date', 'Table', 'Subtotal', 'Tax', 'Service Charge', 'Discount', 'Total', 'Payment Method', 'Status', 'Staff'];
    const csvRows = [headers.join(',')];
    
    rows.forEach(row => {
      const values = [
        row.bill_id,
        row.created_at,
        row.table_number,
        row.subtotal,
        row.tax_amount,
        row.service_charge,
        row.discount_amount,
        row.total_amount,
        row.payment_method,
        row.payment_status,
        row.staff || ''
      ];
      csvRows.push(values.join(','));
    });
    
    const csvContent = csvRows.join('\n');
    
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=sales-report-${Date.now()}.csv`);
    res.send(csvContent);
  });
});

// Serve React app (only in development, not on Render)
// On Render, frontend is deployed separately as Static Site
if (process.env.NODE_ENV !== 'production') {
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'client/build', 'index.html'));
  });
}

// Health check endpoint for production
app.get('/', (req, res) => {
  res.json({ 
    message: 'Restaurant POS Backend API',
    version: '1.0.0',
    status: 'running',
    timestamp: getCurrentISTTime().format('DD/MM/YYYY hh:mm A')
  });
});

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`\nDefault login credentials:`);
  console.log(`Admin: username=admin, password=admin123`);
  console.log(`Cashier: username=cashier, password=cashier123`);
  console.log(`Chef: username=chef, password=chef123`);
});
