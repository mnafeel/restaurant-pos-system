// Local API service for Electron desktop app
// Uses IPC to communicate with local SQLite database

const isElectron = () => {
  return window && window.process && window.process.type === 'renderer';
};

const { ipcRenderer } = isElectron() ? window.require('electron') : {};

// Helper to check if we're in desktop mode
export const isDesktopApp = () => {
  return isElectron();
};

// Local database query wrapper
const dbQuery = async (sql, params = []) => {
  if (!isElectron()) {
    throw new Error('Not running in Electron');
  }
  return await ipcRenderer.invoke('db-query', sql, params);
};

const dbRun = async (sql, params = []) => {
  if (!isElectron()) {
    throw new Error('Not running in Electron');
  }
  return await ipcRenderer.invoke('db-run', sql, params);
};

// Local API implementations
export const localAPI = {
  // Auth
  login: async (username, password) => {
    const users = await dbQuery(
      'SELECT * FROM users WHERE username = ? AND is_active = 1',
      [username]
    );
    
    if (users.length === 0) {
      throw new Error('Invalid credentials');
    }
    
    const user = users[0];
    // In production, use bcrypt to verify password
    if (user.password === password) {
      return {
        token: 'local-token-' + user.id,
        user: user
      };
    } else {
      throw new Error('Invalid credentials');
    }
  },

  // Get current user
  getMe: async (userId) => {
    const users = await dbQuery('SELECT * FROM users WHERE id = ?', [userId]);
    return users[0];
  },

  // Menu items
  getMenu: async () => {
    return await dbQuery(`
      SELECT m.*, 
        GROUP_CONCAT(v.id || ':' || v.name || ':' || v.price_adjustment) as variants
      FROM menu_items m
      LEFT JOIN menu_variants v ON m.id = v.menu_item_id
      WHERE m.is_active = 1
      GROUP BY m.id
      ORDER BY m.category, m.name
    `);
  },

  // Categories
  getCategories: async () => {
    return await dbQuery('SELECT * FROM categories WHERE is_active = 1 ORDER BY display_order, name');
  },

  // Tables
  getTables: async () => {
    return await dbQuery('SELECT * FROM tables ORDER BY table_number');
  },

  // Pending orders
  getPendingOrders: async () => {
    return await dbQuery(`
      SELECT o.*, 
        GROUP_CONCAT(
          oi.id || ':' || oi.menu_item_id || ':' || oi.quantity || ':' || 
          oi.price || ':' || COALESCE(m.name, 'Unknown')
        ) as items
      FROM orders o
      LEFT JOIN order_items oi ON o.id = oi.order_id
      LEFT JOIN menu_items m ON oi.menu_item_id = m.id
      WHERE o.payment_status = 'pending'
      GROUP BY o.id
      ORDER BY o.created_at DESC
    `);
  },

  // Paid bills
  getPaidBills: async () => {
    return await dbQuery(`
      SELECT * FROM bills 
      WHERE DATE(created_at) = DATE('now', 'localtime')
      ORDER BY created_at DESC
    `);
  },

  // Create order
  createOrder: async (orderData) => {
    const { tableNumber, order_type, payment_status, items } = orderData;
    const orderId = 'ORD-' + Date.now();
    const totalAmount = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    // Insert order
    await dbRun(`
      INSERT INTO orders (id, table_number, order_type, payment_status, total_amount, created_at)
      VALUES (?, ?, ?, ?, ?, datetime('now', 'localtime'))
    `, [orderId, tableNumber, order_type, payment_status, totalAmount]);

    // Insert order items
    for (const item of items) {
      await dbRun(`
        INSERT INTO order_items (order_id, menu_item_id, quantity, price, created_at)
        VALUES (?, ?, ?, ?, datetime('now', 'localtime'))
      `, [orderId, item.menu_item_id, item.quantity, item.price]);
    }

    return { orderId, success: true };
  },

  // Create bill
  createBill: async (billData) => {
    const { orderId, payment_method } = billData;
    const billId = 'BILL-' + Date.now();

    // Get order details
    const orders = await dbQuery('SELECT * FROM orders WHERE id = ?', [orderId]);
    if (orders.length === 0) {
      throw new Error('Order not found');
    }
    const order = orders[0];

    // Create bill
    await dbRun(`
      INSERT INTO bills (
        id, order_id, table_number, subtotal, total_amount, 
        payment_method, payment_status, created_at
      )
      VALUES (?, ?, ?, ?, ?, ?, 'paid', datetime('now', 'localtime'))
    `, [billId, orderId, order.table_number, order.total_amount, order.total_amount, payment_method]);

    // Update order status
    await dbRun('UPDATE orders SET payment_status = ? WHERE id = ?', ['paid', orderId]);

    return { billId, success: true };
  },

  // Settings
  getSettings: async () => {
    const rows = await dbQuery('SELECT * FROM settings');
    const settings = {};
    rows.forEach(row => {
      settings[row.key] = row.value;
    });
    return settings;
  },

  // Update table status
  updateTableStatus: async (tableNumber, status, orderId = null) => {
    await dbRun(
      'UPDATE tables SET status = ?, current_order_id = ? WHERE table_number = ?',
      [status, orderId, tableNumber]
    );
  }
};

export default localAPI;

