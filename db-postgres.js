// PostgreSQL Database Configuration for Vercel
const { Pool } = require('pg');

// Use Vercel Postgres connection string or fallback to local
const pool = new Pool({
  connectionString: process.env.POSTGRES_URL || process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// Initialize database tables
async function initDatabase() {
  const client = await pool.connect();
  
  try {
    console.log('🔄 Initializing PostgreSQL database...');
    
    // Create tables
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(255) UNIQUE NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        role VARCHAR(50) NOT NULL,
        first_name VARCHAR(255),
        last_name VARCHAR(255),
        phone VARCHAR(50),
        avatar_url TEXT,
        company_name VARCHAR(255),
        shop_id INTEGER,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS shops (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        address TEXT,
        city VARCHAR(255),
        state VARCHAR(255),
        zip_code VARCHAR(20),
        phone VARCHAR(50),
        email VARCHAR(255),
        tax_id VARCHAR(100),
        logo_url TEXT,
        is_primary BOOLEAN DEFAULT false,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS menu_items (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        price DECIMAL(10, 2) NOT NULL,
        category VARCHAR(100),
        preparation_time INTEGER,
        stock_quantity INTEGER DEFAULT 0,
        image_url TEXT,
        is_available BOOLEAN DEFAULT true,
        shop_id INTEGER,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS tables (
        id SERIAL PRIMARY KEY,
        table_number VARCHAR(50) NOT NULL,
        capacity INTEGER DEFAULT 4,
        location VARCHAR(100),
        status VARCHAR(50) DEFAULT 'Free',
        current_order_id INTEGER,
        merged_with INTEGER,
        shop_id INTEGER,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS orders (
        id SERIAL PRIMARY KEY,
        order_number VARCHAR(50) UNIQUE NOT NULL,
        table_id INTEGER,
        order_type VARCHAR(50) DEFAULT 'dine_in',
        customer_name VARCHAR(255),
        status VARCHAR(50) DEFAULT 'pending',
        payment_method VARCHAR(50),
        payment_status VARCHAR(50) DEFAULT 'pending',
        subtotal DECIMAL(10, 2) DEFAULT 0,
        tax_amount DECIMAL(10, 2) DEFAULT 0,
        service_charge DECIMAL(10, 2) DEFAULT 0,
        discount_amount DECIMAL(10, 2) DEFAULT 0,
        total_amount DECIMAL(10, 2) DEFAULT 0,
        notes TEXT,
        created_by INTEGER,
        shop_id INTEGER,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        completed_at TIMESTAMP
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS order_items (
        id SERIAL PRIMARY KEY,
        order_id INTEGER NOT NULL,
        menu_item_id INTEGER NOT NULL,
        quantity INTEGER NOT NULL,
        unit_price DECIMAL(10, 2) NOT NULL,
        variant_name VARCHAR(255),
        variant_price_adjustment DECIMAL(10, 2) DEFAULT 0,
        notes TEXT,
        status VARCHAR(50) DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS taxes (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        rate DECIMAL(5, 2) NOT NULL,
        is_inclusive BOOLEAN DEFAULT false,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS settings (
        id SERIAL PRIMARY KEY,
        key VARCHAR(255) UNIQUE NOT NULL,
        value TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS audit_logs (
        id SERIAL PRIMARY KEY,
        user_id INTEGER,
        action VARCHAR(255) NOT NULL,
        table_name VARCHAR(255),
        record_id INTEGER,
        old_values TEXT,
        new_values TEXT,
        ip_address VARCHAR(100),
        user_agent TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Check if we need to create default accounts
    const userCount = await client.query('SELECT COUNT(*) as count FROM users');
    
    if (parseInt(userCount.rows[0].count) === 0) {
      console.log('🔄 Creating default accounts...');
      const bcrypt = require('bcryptjs');
      
      // Create owner
      const ownerHash = bcrypt.hashSync('owner123', 10);
      await client.query(`
        INSERT INTO users (username, email, password_hash, role, first_name, last_name, company_name, is_active)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      `, ['owner', 'owner@restaurant.com', ownerHash, 'owner', 'System', 'Owner', 'MNA POS SYSTEMS', true]);
      
      // Create default shop
      const shopResult = await client.query(`
        INSERT INTO shops (name, address, city, state, zip_code, phone, email, tax_id, is_primary, is_active)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        RETURNING id
      `, ['Restaurant POS Main', '123 Main Street', 'New York', 'NY', '10001', '+1234567890', 'info@restaurant.com', 'TAX123456', true, true]);
      
      const shopId = shopResult.rows[0].id;
      
      // Create admin
      const adminHash = bcrypt.hashSync('admin123', 10);
      await client.query(`
        INSERT INTO users (username, email, password_hash, role, first_name, last_name, shop_id, is_active)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      `, ['admin', 'admin@restaurant.com', adminHash, 'admin', 'Admin', 'User', shopId, true]);
      
      // Create cashier
      const cashierHash = bcrypt.hashSync('cashier123', 10);
      await client.query(`
        INSERT INTO users (username, email, password_hash, role, first_name, last_name, shop_id, is_active)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      `, ['cashier', 'cashier@restaurant.com', cashierHash, 'cashier', 'Cashier', 'User', shopId, true]);
      
      // Insert default settings
      const settings = [
        ['shop_name', 'Restaurant POS'],
        ['shop_address', '123 Main Street, City, State'],
        ['shop_phone', '+1234567890'],
        ['shop_email', 'info@restaurant.com'],
        ['tax_rate', '9.0'],
        ['service_charge_rate', '5.0'],
        ['currency_symbol', '$'],
        ['printer_type', 'network'],
        ['printer_ip', '192.168.1.100'],
        ['printer_port', '9100'],
        ['receipt_header', 'Thank you for dining with us!'],
        ['receipt_footer', 'Please visit again!'],
        ['enable_kds', 'true'],
        ['auto_print_bill', 'false'],
        ['default_payment_method', 'cash']
      ];
      
      for (const [key, value] of settings) {
        await client.query(
          'INSERT INTO settings (key, value) VALUES ($1, $2) ON CONFLICT (key) DO NOTHING',
          [key, value]
        );
      }
      
      console.log('✅ Default accounts created!');
      console.log('   Owner: owner / owner123');
      console.log('   Admin: admin / admin123');
      console.log('   Cashier: cashier / cashier123');
    }
    
    console.log('✅ Database initialized successfully!');
  } catch (error) {
    console.error('❌ Database initialization error:', error);
    throw error;
  } finally {
    client.release();
  }
}

module.exports = { pool, initDatabase };

