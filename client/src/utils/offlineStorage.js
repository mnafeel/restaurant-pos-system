// IndexedDB utility for offline data storage

const DB_NAME = 'RestaurantPOS';
const DB_VERSION = 1;

// Store names
const STORES = {
  PENDING_ORDERS: 'pendingOrders',
  MENU_ITEMS: 'menuItems',
  SETTINGS: 'settings',
  SYNC_QUEUE: 'syncQueue'
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
        const orderStore = db.createObjectStore(STORES.PENDING_ORDERS, { keyPath: 'id', autoIncrement: true });
        orderStore.createIndex('timestamp', 'timestamp', { unique: false });
        orderStore.createIndex('synced', 'synced', { unique: false });
      }

      if (!db.objectStoreNames.contains(STORES.MENU_ITEMS)) {
        const menuStore = db.createObjectStore(STORES.MENU_ITEMS, { keyPath: 'id' });
        menuStore.createIndex('category', 'category', { unique: false });
        menuStore.createIndex('timestamp', 'timestamp', { unique: false });
      }

      if (!db.objectStoreNames.contains(STORES.SETTINGS)) {
        db.createObjectStore(STORES.SETTINGS, { keyPath: 'key' });
      }

      if (!db.objectStoreNames.contains(STORES.SYNC_QUEUE)) {
        const syncStore = db.createObjectStore(STORES.SYNC_QUEUE, { keyPath: 'id', autoIncrement: true });
        syncStore.createIndex('timestamp', 'timestamp', { unique: false });
        syncStore.createIndex('type', 'type', { unique: false });
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

export { STORES };

