// Axios configuration for desktop/web mode
import axios from 'axios';

// Check if running in Electron
const isElectron = () => {
  try {
    // Multiple ways to detect Electron
    return (
      (window && window.isElectronApp) ||
      (window && window.electronAPI) ||
      (window && window.process && window.process.type === 'renderer') ||
      (window && window.require && typeof window.require === 'function') ||
      (typeof process !== 'undefined' && process.versions && process.versions.electron) ||
      (navigator && navigator.userAgent && navigator.userAgent.includes('Electron'))
    );
  } catch (e) {
    console.log('Electron detection error:', e);
    return false;
  }
};

// Get IPC renderer lazily
const getIpcRenderer = () => {
  if (!isElectron()) return null;
  try {
    return window.require('electron').ipcRenderer;
  } catch (e) {
    console.log('IPC not available');
    return null;
  }
};

// Helper function to query local database
const queryLocalDB = async (sql, params = []) => {
  if (window.electronAPI) {
    return await window.electronAPI.queryDB(sql, params);
  }
  throw new Error('Electron API not available');
};

const runLocalDB = async (sql, params = []) => {
  if (window.electronAPI) {
    return await window.electronAPI.runDB(sql, params);
  }
  throw new Error('Electron API not available');
};

// Setup axios interceptor for desktop mode
export const setupAxios = () => {
  console.log('🔍 Electron detection check:');
  console.log('  window.isElectronApp:', window && window.isElectronApp);
  console.log('  window.electronAPI:', window && window.electronAPI);
  console.log('  window.process:', window && window.process);
  console.log('  window.require:', window && window.require);
  console.log('  process.versions:', typeof process !== 'undefined' && process.versions);
  console.log('  navigator.userAgent:', navigator && navigator.userAgent);
  console.log('  isElectron result:', isElectron());
  
  if (isElectron()) {
    console.log('🖥️ Desktop mode detected - using local database');
    
    // Intercept all axios requests
    axios.interceptors.request.use(async (config) => {
      const url = config.url;
      
      try {
        // Handle different API endpoints
        if (url.includes('/api/menu')) {
          console.log('🍽️ Fetching menu from local DB...');
          const items = await queryLocalDB(`
            SELECT m.*, 
              GROUP_CONCAT(v.id || ':' || v.name || ':' || COALESCE(v.price_adjustment, 0)) as variants
            FROM menu_items m
            LEFT JOIN menu_variants v ON m.id = v.menu_item_id
            WHERE m.is_available = 1
            GROUP BY m.id
            ORDER BY m.category, m.name
          `);
          
          // Parse variants for each item
          const processedItems = items.map(item => ({
            ...item,
            variants: item.variants ? item.variants.split(',').map(v => {
              const [id, name, price_adjustment] = v.split(':');
              return { id: parseInt(id), name, price_adjustment: parseFloat(price_adjustment) || 0 };
            }) : []
          }));
          
          console.log('🍽️ Menu items fetched:', processedItems.length);
          return {
            data: processedItems,
            status: 200,
            statusText: 'OK (Local)',
            headers: {},
            config: config
          };
        }
        
        else if (url.includes('/api/tables')) {
          const tables = await queryLocalDB('SELECT * FROM tables ORDER BY table_number');
          return {
            data: tables,
            status: 200,
            statusText: 'OK (Local)',
            headers: {},
            config: config
          };
        }
        
        else if (url.includes('/api/orders') && url.includes('status=pending')) {
          const orders = await queryLocalDB(`
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
          
          // Parse items for each order
          const processedOrders = orders.map(order => ({
            ...order,
            items: order.items ? order.items.split(',').map(i => {
              const [id, menu_item_id, quantity, price, name] = i.split(':');
              return { id: parseInt(id), menu_item_id: parseInt(menu_item_id), quantity: parseInt(quantity), price: parseFloat(price), name };
            }) : []
          }));
          
          return {
            data: processedOrders,
            status: 200,
            statusText: 'OK (Local)',
            headers: {},
            config: config
          };
        }
        
        else if (url.includes('/api/bills')) {
          const bills = await queryLocalDB(`
            SELECT * FROM bills 
            WHERE DATE(created_at) = DATE('now', 'localtime')
            ORDER BY created_at DESC
          `);
          return {
            data: bills,
            status: 200,
            statusText: 'OK (Local)',
            headers: {},
            config: config
          };
        }
        
        else if (url.includes('/api/settings')) {
          const rows = await queryLocalDB('SELECT * FROM settings');
          const settings = {};
          rows.forEach(row => {
            settings[row.key] = row.value;
          });
          return {
            data: settings,
            status: 200,
            statusText: 'OK (Local)',
            headers: {},
            config: config
          };
        }
        
        else if (url.includes('/api/orders') && config.method === 'post') {
          const orderData = config.data;
          const orderId = 'ORD-' + Date.now();
          const totalAmount = orderData.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
          
          // Insert order
          await runLocalDB(`
            INSERT INTO orders (id, table_number, order_type, payment_status, total_amount, created_at)
            VALUES (?, ?, ?, ?, ?, datetime('now', 'localtime'))
          `, [orderId, orderData.tableNumber, orderData.order_type, orderData.payment_status, totalAmount]);
          
          // Insert order items
          for (const item of orderData.items) {
            await runLocalDB(`
              INSERT INTO order_items (order_id, menu_item_id, quantity, price, created_at)
              VALUES (?, ?, ?, ?, datetime('now', 'localtime'))
            `, [orderId, item.menu_item_id, item.quantity, item.price]);
          }
          
          // Update table status if needed
          if (orderData.tableNumber && orderData.tableNumber !== 'Takeaway') {
            await runLocalDB(
              'UPDATE tables SET status = ?, current_order_id = ? WHERE table_number = ?',
              ['Occupied', orderId, orderData.tableNumber]
            );
          }
          
          return {
            data: { orderId, success: true, message: 'Order created locally' },
            status: 200,
            statusText: 'OK (Local)',
            headers: {},
            config: config
          };
        }
        
        else if (url.includes('/api/kitchen/orders')) {
          const orders = await queryLocalDB(`
            SELECT o.*, 
              GROUP_CONCAT(
                oi.id || ':' || oi.menu_item_id || ':' || oi.quantity || ':' || 
                oi.price || ':' || COALESCE(m.name, 'Unknown') || ':' || COALESCE(oi.kds_status, 'Pending')
              ) as items
            FROM orders o
            LEFT JOIN order_items oi ON o.id = oi.order_id
            LEFT JOIN menu_items m ON oi.menu_item_id = m.id
            WHERE o.payment_status = 'pending' AND oi.kds_status IN ('Pending', 'Preparing')
            GROUP BY o.id
            ORDER BY o.created_at DESC
          `);
          
          // Parse items for each order
          const processedOrders = orders.map(order => ({
            ...order,
            items: order.items ? order.items.split(',').map(i => {
              const [id, menu_item_id, quantity, price, name, kds_status] = i.split(':');
              return { 
                id: parseInt(id), 
                menu_item_id: parseInt(menu_item_id), 
                quantity: parseInt(quantity), 
                price: parseFloat(price), 
                name,
                kds_status: kds_status || 'Pending'
              };
            }) : []
          }));
          
          return {
            data: processedOrders,
            status: 200,
            statusText: 'OK (Local)',
            headers: {},
            config: config
          };
        }
        
        else if (url.includes('/api/orders') && config.method === 'put' && url.includes('/status')) {
          const urlParts = url.split('/');
          const orderId = urlParts[urlParts.indexOf('orders') + 1];
          const itemId = urlParts[urlParts.indexOf('items') + 1];
          const newStatus = config.data.status;
          
          await runLocalDB(
            'UPDATE order_items SET kds_status = ? WHERE order_id = ? AND id = ?',
            [newStatus, orderId, itemId]
          );
          
          return {
            data: { success: true, message: 'Status updated locally' },
            status: 200,
            statusText: 'OK (Local)',
            headers: {},
            config: config
          };
        }
        
        else if (url.includes('/api/orders') && config.method === 'delete') {
          const urlParts = url.split('/');
          const orderId = urlParts[urlParts.indexOf('orders') + 1];
          
          await runLocalDB('DELETE FROM order_items WHERE order_id = ?', [orderId]);
          await runLocalDB('DELETE FROM orders WHERE id = ?', [orderId]);
          
          return {
            data: { success: true, message: 'Order deleted locally' },
            status: 200,
            statusText: 'OK (Local)',
            headers: {},
            config: config
          };
        }
        
        else if (url.includes('/api/bills') && config.method === 'delete') {
          const urlParts = url.split('/');
          const billId = urlParts[urlParts.indexOf('bills') + 1];
          
          await runLocalDB('DELETE FROM bills WHERE id = ?', [billId]);
          
          return {
            data: { success: true, message: 'Bill deleted locally' },
            status: 200,
            statusText: 'OK (Local)',
            headers: {},
            config: config
          };
        }
        
        else if (url.includes('/api/auth/login')) {
          const { username, password } = config.data;
          
          const users = await queryLocalDB('SELECT * FROM users WHERE username = ? AND password = ?', [username, password]);
          
          if (users.length > 0) {
            const user = users[0];
            const token = 'local-token-' + Date.now();
            
            return {
              data: { 
                token, 
                user: {
                  id: user.id,
                  username: user.username,
                  email: user.email,
                  first_name: user.first_name,
                  last_name: user.last_name,
                  role: user.role
                }
              },
              status: 200,
              statusText: 'OK (Local)',
              headers: {},
              config: config
            };
          } else {
            return Promise.reject({
              response: {
                data: { error: 'Invalid credentials' },
                status: 401,
                statusText: 'Unauthorized'
              }
            });
          }
        }
        
        else if (url.includes('/api/auth/me')) {
          // For now, return a default user - in real implementation, decode token
          const users = await queryLocalDB('SELECT * FROM users WHERE username = ?', ['admin']);
          
          if (users.length > 0) {
            const user = users[0];
            return {
              data: {
                id: user.id,
                username: user.username,
                email: user.email,
                first_name: user.first_name,
                last_name: user.last_name,
                role: user.role
              },
              status: 200,
              statusText: 'OK (Local)',
              headers: {},
              config: config
            };
          } else {
            return Promise.reject({
              response: {
                data: { error: 'User not found' },
                status: 404,
                statusText: 'Not Found'
              }
            });
          }
        }
        
        else if (url.includes('/api/bills') && config.method === 'post') {
          const billData = config.data;
          const billId = 'BILL-' + Date.now();
          
          // Get order details
          const orders = await queryLocalDB('SELECT * FROM orders WHERE id = ?', [billData.orderId]);
          if (orders.length === 0) {
            throw new Error('Order not found');
          }
          const order = orders[0];
          
          // Create bill
          await runLocalDB(`
            INSERT INTO bills (
              id, order_id, table_number, subtotal, total_amount, 
              payment_method, payment_status, created_at
            )
            VALUES (?, ?, ?, ?, ?, ?, 'paid', datetime('now', 'localtime'))
          `, [billId, billData.orderId, order.table_number, order.total_amount, order.total_amount, billData.payment_method]);
          
          // Update order status
          await runLocalDB('UPDATE orders SET payment_status = ? WHERE id = ?', ['paid', billData.orderId]);
          
          // Free table
          if (order.table_number && order.table_number !== 'Takeaway') {
            await runLocalDB(
              'UPDATE tables SET status = ?, current_order_id = NULL WHERE table_number = ?',
              ['Free', order.table_number]
            );
          }
          
          return {
            data: { billId, success: true, message: 'Bill created locally' },
            status: 200,
            statusText: 'OK (Local)',
            headers: {},
            config: config
          };
        }
        
      } catch (error) {
        console.error('Local DB error:', error);
      }
      
      // If not intercepted, continue with normal request
      return config;
    });
  } else {
    console.log('🌐 Web mode detected - using cloud API');
  }
};

export default setupAxios;

