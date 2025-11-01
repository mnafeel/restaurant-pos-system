// IndexedDB utility for offline data storage

const DB_NAME = 'RestaurantPOS';
const DB_VERSION = 2;

// Store names
const STORES = {
  PENDING_ORDERS: 'pendingOrders',
  PAID_BILLS: 'paidBills',
  MENU_ITEMS: 'menuItems',
  CATEGORIES: 'categories',
  TABLES: 'tables',
  SETTINGS: 'settings',
  SYNC_QUEUE: 'syncQueue',
  REPORTS: 'reports',
  USER_DATA: 'userData'
};

// Initialize IndexedDB
export const initDB = () => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      console.error('IndexedDB error:', request.error);
      reject(request.error);
    };

    request.onsuccess = () => {
      console.log('IndexedDB initialized successfully');
      resolve(request.result);
    };

    request.onupgradeneeded = (event) => {
      const db = event.target.result;

      // Create object stores if they don't exist
      if (!db.objectStoreNames.contains(STORES.PENDING_ORDERS)) {
        const orderStore = db.createObjectStore(STORES.PENDING_ORDERS, { keyPath: 'id' });
        orderStore.createIndex('timestamp', 'timestamp', { unique: false });
        orderStore.createIndex('synced', 'synced', { unique: false });
        orderStore.createIndex('payment_status', 'payment_status', { unique: false });
      }

      if (!db.objectStoreNames.contains(STORES.PAID_BILLS)) {
        const billStore = db.createObjectStore(STORES.PAID_BILLS, { keyPath: 'id' });
        billStore.createIndex('timestamp', 'timestamp', { unique: false });
        billStore.createIndex('created_at', 'created_at', { unique: false });
      }

      if (!db.objectStoreNames.contains(STORES.MENU_ITEMS)) {
        const menuStore = db.createObjectStore(STORES.MENU_ITEMS, { keyPath: 'id' });
        menuStore.createIndex('category', 'category', { unique: false });
        menuStore.createIndex('timestamp', 'timestamp', { unique: false });
      }

      if (!db.objectStoreNames.contains(STORES.CATEGORIES)) {
        const categoryStore = db.createObjectStore(STORES.CATEGORIES, { keyPath: 'id' });
        categoryStore.createIndex('timestamp', 'timestamp', { unique: false });
      }

      if (!db.objectStoreNames.contains(STORES.TABLES)) {
        const tableStore = db.createObjectStore(STORES.TABLES, { keyPath: 'id' });
        tableStore.createIndex('status', 'status', { unique: false });
        tableStore.createIndex('timestamp', 'timestamp', { unique: false });
      }

      if (!db.objectStoreNames.contains(STORES.SETTINGS)) {
        db.createObjectStore(STORES.SETTINGS, { keyPath: 'key' });
      }

      if (!db.objectStoreNames.contains(STORES.SYNC_QUEUE)) {
        const syncStore = db.createObjectStore(STORES.SYNC_QUEUE, { keyPath: 'id', autoIncrement: true });
        syncStore.createIndex('timestamp', 'timestamp', { unique: false });
        syncStore.createIndex('type', 'type', { unique: false });
      }

      if (!db.objectStoreNames.contains(STORES.REPORTS)) {
        const reportStore = db.createObjectStore(STORES.REPORTS, { keyPath: 'key' });
        reportStore.createIndex('timestamp', 'timestamp', { unique: false });
      }

      if (!db.objectStoreNames.contains(STORES.USER_DATA)) {
        const userStore = db.createObjectStore(STORES.USER_DATA, { keyPath: 'key' });
        userStore.createIndex('timestamp', 'timestamp', { unique: false });
      }

      console.log('IndexedDB stores created');
    };
  });
};

// Generic function to add data to a store
export const addToStore = async (storeName, data) => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([storeName], 'readwrite');
    const store = transaction.objectStore(storeName);
    const request = store.add(data);

    request.onsuccess = () => {
      console.log(`Added to ${storeName}:`, data);
      resolve(request.result);
    };

    request.onerror = () => {
      console.error(`Error adding to ${storeName}:`, request.error);
      reject(request.error);
    };
  });
};

// Generic function to get all data from a store
export const getAllFromStore = async (storeName) => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([storeName], 'readonly');
    const store = transaction.objectStore(storeName);
    const request = store.getAll();

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onerror = () => {
      console.error(`Error reading from ${storeName}:`, request.error);
      reject(request.error);
    };
  });
};

// Generic function to update data in a store
export const updateInStore = async (storeName, data) => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([storeName], 'readwrite');
    const store = transaction.objectStore(storeName);
    const request = store.put(data);

    request.onsuccess = () => {
      console.log(`Updated in ${storeName}:`, data);
      resolve(request.result);
    };

    request.onerror = () => {
      console.error(`Error updating in ${storeName}:`, request.error);
      reject(request.error);
    };
  });
};

// Generic function to delete data from a store
export const deleteFromStore = async (storeName, key) => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([storeName], 'readwrite');
    const store = transaction.objectStore(storeName);
    const request = store.delete(key);

    request.onsuccess = () => {
      console.log(`Deleted from ${storeName}:`, key);
      resolve();
    };

    request.onerror = () => {
      console.error(`Error deleting from ${storeName}:`, request.error);
      reject(request.error);
    };
  });
};

// Save menu items for offline access
export const cacheMenuItems = async (menuItems) => {
  const db = await initDB();
  const transaction = db.transaction([STORES.MENU_ITEMS], 'readwrite');
  const store = transaction.objectStore(STORES.MENU_ITEMS);

  // Clear existing menu items
  store.clear();

  // Add new menu items with timestamp
  menuItems.forEach(item => {
    store.add({
      ...item,
      timestamp: Date.now()
    });
  });

  return new Promise((resolve, reject) => {
    transaction.oncomplete = () => {
      console.log('Menu items cached successfully');
      resolve();
    };

    transaction.onerror = () => {
      console.error('Error caching menu items:', transaction.error);
      reject(transaction.error);
    };
  });
};

// Get cached menu items
export const getCachedMenuItems = async () => {
  return getAllFromStore(STORES.MENU_ITEMS);
};

// Queue order for sync when online
export const queueOrderForSync = async (orderData) => {
  return addToStore(STORES.SYNC_QUEUE, {
    type: 'ORDER',
    data: orderData,
    timestamp: Date.now(),
    synced: false
  });
};

// Get all items in sync queue
export const getSyncQueue = async () => {
  const queue = await getAllFromStore(STORES.SYNC_QUEUE);
  return queue.filter(item => !item.synced);
};

// Mark sync item as synced
export const markAsSynced = async (id) => {
  const db = await initDB();
  const transaction = db.transaction([STORES.SYNC_QUEUE], 'readwrite');
  const store = transaction.objectStore(STORES.SYNC_QUEUE);
  
  const getRequest = store.get(id);
  
  return new Promise((resolve, reject) => {
    getRequest.onsuccess = () => {
      const item = getRequest.result;
      if (item) {
        item.synced = true;
        const updateRequest = store.put(item);
        
        updateRequest.onsuccess = () => {
          console.log('Marked as synced:', id);
          resolve();
        };
        
        updateRequest.onerror = () => {
          reject(updateRequest.error);
        };
      } else {
        resolve(); // Item doesn't exist, nothing to update
      }
    };
    
    getRequest.onerror = () => {
      reject(getRequest.error);
    };
  });
};

// Clear synced items from queue
export const clearSyncedItems = async () => {
  const db = await initDB();
  const transaction = db.transaction([STORES.SYNC_QUEUE], 'readwrite');
  const store = transaction.objectStore(STORES.SYNC_QUEUE);
  const index = store.index('type');
  const request = index.openCursor();

  return new Promise((resolve, reject) => {
    request.onsuccess = (event) => {
      const cursor = event.target.result;
      if (cursor) {
        if (cursor.value.synced) {
          cursor.delete();
        }
        cursor.continue();
      } else {
        console.log('Cleared synced items from queue');
        resolve();
      }
    };

    request.onerror = () => {
      reject(request.error);
    };
  });
};

// Save settings for offline access
export const cacheSetting = async (key, value) => {
  return updateInStore(STORES.SETTINGS, { key, value, timestamp: Date.now() });
};

// Get cached setting
export const getCachedSetting = async (key) => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORES.SETTINGS], 'readonly');
    const store = transaction.objectStore(STORES.SETTINGS);
    const request = store.get(key);

    request.onsuccess = () => {
      resolve(request.result?.value || null);
    };

    request.onerror = () => {
      reject(request.error);
    };
  });
};

// Cache pending orders
export const cachePendingOrders = async (orders) => {
  const db = await initDB();
  const transaction = db.transaction([STORES.PENDING_ORDERS], 'readwrite');
  const store = transaction.objectStore(STORES.PENDING_ORDERS);
  
  // Clear existing pending orders
  store.clear();
  
  // Add new pending orders with timestamp
  orders.forEach(order => {
    store.add({
      ...order,
      timestamp: Date.now(),
      cached: true
    });
  });
  
  return new Promise((resolve, reject) => {
    transaction.oncomplete = () => {
      console.log('Pending orders cached successfully');
      resolve();
    };
    transaction.onerror = () => {
      console.error('Error caching pending orders:', transaction.error);
      reject(transaction.error);
    };
  });
};

// Get cached pending orders
export const getCachedPendingOrders = async () => {
  return getAllFromStore(STORES.PENDING_ORDERS);
};

// Cache paid bills (can append or replace)
export const cachePaidBills = async (bills, append = false) => {
  const db = await initDB();
  const transaction = db.transaction([STORES.PAID_BILLS], 'readwrite');
  const store = transaction.objectStore(STORES.PAID_BILLS);
  
  // Clear existing paid bills only if not appending
  if (!append) {
    store.clear();
  }
  
  // Add new paid bills with timestamp
  bills.forEach(bill => {
    // Use put instead of add to update if exists (for offline bills)
    store.put({
      ...bill,
      timestamp: Date.now(),
      cached: true
    });
  });
  
  return new Promise((resolve, reject) => {
    transaction.oncomplete = () => {
      console.log('Paid bills cached successfully', append ? '(appended)' : '(replaced)');
      resolve();
    };
    transaction.onerror = () => {
      console.error('Error caching paid bills:', transaction.error);
      reject(transaction.error);
    };
  });
};

// Get cached paid bills
export const getCachedPaidBills = async () => {
  return getAllFromStore(STORES.PAID_BILLS);
};

// Cache tables
export const cacheTables = async (tables) => {
  const db = await initDB();
  const transaction = db.transaction([STORES.TABLES], 'readwrite');
  const store = transaction.objectStore(STORES.TABLES);
  
  // Clear existing tables
  store.clear();
  
  // Add new tables with timestamp
  tables.forEach(table => {
    store.add({
      ...table,
      timestamp: Date.now(),
      cached: true
    });
  });
  
  return new Promise((resolve, reject) => {
    transaction.oncomplete = () => {
      console.log('Tables cached successfully');
      resolve();
    };
    transaction.onerror = () => {
      console.error('Error caching tables:', transaction.error);
      reject(transaction.error);
    };
  });
};

// Get cached tables
export const getCachedTables = async () => {
  return getAllFromStore(STORES.TABLES);
};

// Cache categories
export const cacheCategories = async (categories) => {
  const db = await initDB();
  const transaction = db.transaction([STORES.CATEGORIES], 'readwrite');
  const store = transaction.objectStore(STORES.CATEGORIES);
  
  // Clear existing categories
  store.clear();
  
  // Add new categories with timestamp
  categories.forEach(category => {
    store.add({
      ...category,
      timestamp: Date.now(),
      cached: true
    });
  });
  
  return new Promise((resolve, reject) => {
    transaction.oncomplete = () => {
      console.log('Categories cached successfully');
      resolve();
    };
    transaction.onerror = () => {
      console.error('Error caching categories:', transaction.error);
      reject(transaction.error);
    };
  });
};

// Get cached categories
export const getCachedCategories = async () => {
  return getAllFromStore(STORES.CATEGORIES);
};

// Cache report data
export const cacheReportData = async (key, data) => {
  return updateInStore(STORES.REPORTS, { key, data, timestamp: Date.now() });
};

// Get cached report data
export const getCachedReportData = async (key) => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORES.REPORTS], 'readonly');
    const store = transaction.objectStore(STORES.REPORTS);
    const request = store.get(key);
    
    request.onsuccess = () => {
      resolve(request.result?.data || null);
    };
    request.onerror = () => {
      reject(request.error);
    };
  });
};

export { STORES };

