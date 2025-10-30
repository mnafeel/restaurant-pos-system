import React, { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FiSearch, FiShoppingCart, FiX, FiPlus, FiMinus, FiCheck, FiClock, 
  FiPackage, FiHome, FiSend, FiPause, FiDollarSign, FiCreditCard,
  FiList, FiCheckCircle, FiPrinter, FiEdit, FiRefreshCw, FiTrash2, FiWifiOff
} from 'react-icons/fi';
import { useAuth } from '../contexts/AuthContext';
import { useCurrency } from '../contexts/CurrencyContext';
import { useTheme } from '../contexts/ThemeContext';
import { formatIndianDate } from '../hooks/useServerTime';
import { 
  queueOrderForSync, 
  getCachedMenuItems, 
  cacheMenuItems,
  getCachedSetting,
  cacheSetting,
  cachePendingOrders,
  getCachedPendingOrders,
  cachePaidBills,
  getCachedPaidBills,
  cacheTables,
  getCachedTables
} from '../utils/offlineStorage';
import io from 'socket.io-client';

const OrderTakingComplete = () => {
  const { user } = useAuth();
  const { formatCurrency } = useCurrency();
  const { currentTheme } = useTheme();
  
  // State
  const [menuItems, setMenuItems] = useState([]);
  const [cart, setCart] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [orderType, setOrderType] = useState('dine-in');
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showCart, setShowCart] = useState(false);
  const [view, setView] = useState('menu'); // 'menu', 'pending', 'paid'
  const [pendingOrders, setPendingOrders] = useState([]);
  const [paidBills, setPaidBills] = useState([]);
  const [kitchenSystemEnabled, setKitchenSystemEnabled] = useState(true);
  const [tableManagementEnabled, setTableManagementEnabled] = useState(true);
  const [autoPrintEnabled, setAutoPrintEnabled] = useState(false);
  const [tables, setTables] = useState([]);
  const [selectedTable, setSelectedTable] = useState(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [pendingPaymentOrderId, setPendingPaymentOrderId] = useState(null);
  const [isLoadingMenu, setIsLoadingMenu] = useState(true);
  const [isLoadingTables, setIsLoadingTables] = useState(true);
  const [isLoadingSettings, setIsLoadingSettings] = useState(true);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [offlineOrders, setOfflineOrders] = useState([]);
  const [defaultPaymentMethod, setDefaultPaymentMethod] = useState('Cash');

  const normalizePaymentMethod = (val) => {
    if (!val) return 'Cash';
    const s = String(val).toLowerCase();
    if (s === 'cash') return 'Cash';
    if (s === 'card') return 'Card';
    if (s === 'upi') return 'UPI';
    return 'Cash';
  };

  useEffect(() => {
    fetchMenu();
    fetchSettings();
    fetchPendingOrders();
    fetchPaidBills();
    fetchTables();
    // Live updates via sockets
    try {
      const socketUrl = axios.defaults.baseURL || 'https://restaurant-pos-system-1-7h0m.onrender.com';
      const socket = io(socketUrl);
      socket.emit('join-orders');
      const handlePaid = () => {
        fetchPendingOrders();
        fetchPaidBills();
        fetchTables();
      };
      socket.on('order-paid', handlePaid);
      socket.on('bill-created', handlePaid);
      socket.on('stats-updated', handlePaid);
      // Cleanup
      return () => {
        try {
          socket.off('order-paid', handlePaid);
          socket.off('bill-created', handlePaid);
          socket.off('stats-updated', handlePaid);
          socket.disconnect();
        } catch (_) {}
      };
    } catch (_) {}
    
    // Add online/offline event listeners
    const handleOnline = () => {
      setIsOnline(true);
      console.log('Back online - syncing offline orders...');
      syncOfflineOrders();
    };
    
    const handleOffline = () => {
      setIsOnline(false);
      console.log('Gone offline - switching to offline mode');
    };
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const fetchTables = async () => {
    try {
      setIsLoadingTables(true);
      
      if (!navigator.onLine) {
        // Use cached tables when offline
        const cachedTables = await getCachedTables();
        if (cachedTables && cachedTables.length > 0) {
          setTables(cachedTables);
          console.log('Using cached tables:', cachedTables.length);
          return;
        }
      }
      
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/tables', {
        headers: { Authorization: `Bearer ${token}` }
      });
      // Normalize tables: status capitalization and table_number as string
      const normalized = (response.data || []).map(t => ({
        ...t,
        status: typeof t.status === 'string' ? t.status.trim() : 'Free',
        table_number: String(t.table_number)
      }));
      setTables(normalized);
      
      // Cache tables for offline use
      await cacheTables(normalized);
    } catch (error) {
      console.error('Error fetching tables:', error);
      
      // Try to use cached tables as fallback
      try {
        const cachedTables = await getCachedTables();
        if (cachedTables && cachedTables.length > 0) {
          setTables(cachedTables);
          console.log('Using cached tables as fallback:', cachedTables.length);
        }
      } catch (cacheError) {
        console.error('Error loading cached tables:', cacheError);
      }
    } finally {
      setIsLoadingTables(false);
    }
  };

  const fetchMenu = async () => {
    try {
      setIsLoadingMenu(true);
      
      if (!navigator.onLine) {
        // Use cached menu when offline
        const cachedMenu = await getCachedMenuItems();
        if (cachedMenu && cachedMenu.length > 0) {
          setMenuItems(cachedMenu);
          console.log('Using cached menu items:', cachedMenu.length);
          return;
        }
      }
      
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/menu', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMenuItems(response.data);
      
      // Cache menu items for offline use
      await cacheMenuItems(response.data);
    } catch (error) {
      console.error('Error fetching menu:', error);
      
      // Try to use cached menu as fallback
      try {
        const cachedMenu = await getCachedMenuItems();
        if (cachedMenu && cachedMenu.length > 0) {
          setMenuItems(cachedMenu);
          console.log('Using cached menu as fallback:', cachedMenu.length);
          toast.info('Using cached menu - some items may be outdated');
        } else {
          toast.error('Failed to load menu');
        }
      } catch (cacheError) {
        console.error('Error loading cached menu:', cacheError);
        toast.error('Failed to load menu');
      }
    } finally {
      setIsLoadingMenu(false);
    }
  };

  const fetchSettings = async () => {
    try {
      setIsLoadingSettings(true);
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/settings', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setKitchenSystemEnabled(response.data.enable_kds === 'true');
      setTableManagementEnabled(response.data.enable_table_management === 'true');
      setAutoPrintEnabled(response.data.auto_print_bill === 'true');
    const defaultPayment = normalizePaymentMethod(response.data.default_payment_method || 'Cash');
    setDefaultPaymentMethod(defaultPayment);
    setPaymentMethod(prev => prev || defaultPayment);

      // Per-user override for auto print
      try {
        const me = await axios.get('/api/users/me/settings', { headers: { Authorization: `Bearer ${token}` } });
        if (me.data && Object.prototype.hasOwnProperty.call(me.data, 'auto_print_bill_user')) {
          const val = String(me.data.auto_print_bill_user).toLowerCase() === 'true';
          setAutoPrintEnabled(val);
        }
      } catch (_) {
        // ignore per-user settings fetch errors
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
    } finally {
      setIsLoadingSettings(false);
    }
  };

  const fetchPendingOrders = async () => {
    try {
      if (!navigator.onLine) {
        // Use cached pending orders when offline
        const cachedOrders = await getCachedPendingOrders();
        if (cachedOrders && cachedOrders.length > 0) {
          // Combine cached orders with offline orders
          const allOrders = [...cachedOrders.filter(o => !o.cached || o.payment_status === 'pending')];
          setPendingOrders(allOrders);
          console.log('Using cached pending orders:', allOrders.length);
          return;
        }
      }
      
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/orders?status=pending', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPendingOrders(response.data);
      
      // Cache pending orders for offline use
      await cachePendingOrders(response.data);
    } catch (error) {
      console.error('Error fetching pending orders:', error);
      
      // Try to use cached orders as fallback
      try {
        const cachedOrders = await getCachedPendingOrders();
        if (cachedOrders && cachedOrders.length > 0) {
          setPendingOrders(cachedOrders);
          console.log('Using cached pending orders as fallback:', cachedOrders.length);
          toast.info('Showing cached orders - some may be outdated');
        }
      } catch (cacheError) {
        console.error('Error loading cached pending orders:', cacheError);
      }
    }
  };

  const fetchPaidBills = async () => {
    try {
      if (!navigator.onLine) {
        // Use cached paid bills when offline
        const cachedBills = await getCachedPaidBills();
        if (cachedBills && cachedBills.length > 0) {
          setPaidBills(cachedBills);
          console.log('Using cached paid bills:', cachedBills.length);
          return;
        }
      }
      
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/bills?filter=today', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPaidBills(response.data);
      
      // Cache paid bills for offline use
      await cachePaidBills(response.data);
    } catch (error) {
      console.error('Error fetching paid bills:', error);
      
      // Try to use cached bills as fallback
      try {
        const cachedBills = await getCachedPaidBills();
        if (cachedBills && cachedBills.length > 0) {
          setPaidBills(cachedBills);
          console.log('Using cached paid bills as fallback:', cachedBills.length);
          toast.info('Showing cached bills - some may be outdated');
        }
      } catch (cacheError) {
        console.error('Error loading cached paid bills:', cacheError);
      }
    }
  };

  // Get unique categories
  const categories = ['All', ...new Set(menuItems.map(item => item.category).filter(Boolean))];

  // Filter menu items
  const filteredItems = menuItems.filter(item => {
    const matchesCategory = selectedCategory === 'All' || item.category === selectedCategory;
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // Add to cart
  const addToCart = (item) => {
    const existingItem = cart.find(cartItem => cartItem.id === item.id);
    if (existingItem) {
      setCart(cart.map(cartItem =>
        cartItem.id === item.id
          ? { ...cartItem, quantity: cartItem.quantity + 1 }
          : cartItem
      ));
    } else {
      setCart([...cart, { ...item, quantity: 1 }]);
    }
    toast.success(`${item.name} added!`, { duration: 1000 });
  };

  // Update quantity
  const updateQuantity = (itemId, delta) => {
    setCart(cart.map(item => {
      if (item.id === itemId) {
        const newQuantity = item.quantity + delta;
        return newQuantity > 0 ? { ...item, quantity: newQuantity } : null;
      }
      return item;
    }).filter(Boolean));
  };

  // Remove from cart
  const removeFromCart = (itemId) => {
    setCart(cart.filter(item => item.id !== itemId));
  };

  // Calculate total
  const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  // Hold Order (save as pending)
  const handleHoldOrder = async () => {
    if (cart.length === 0) {
      toast.error('Cart is empty!');
      return;
    }

    // Check table selection for dine-in (only if tables exist)
    if (tableManagementEnabled && orderType === 'dine-in' && tables.length > 0 && !selectedTable) {
      toast.error('Please select a table!');
      return;
    }

    setIsSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      const tableNumber = orderType === 'takeaway' ? 'Takeaway' : (selectedTable || 'Table');
      
      await axios.post('/api/orders', {
        tableNumber: tableNumber,
        order_type: orderType === 'dine-in' ? 'Dine-In' : 'Takeaway',
        payment_status: 'pending',
        items: cart.map(item => ({
          menu_item_id: item.id,
          quantity: item.quantity,
          price: item.price,
          variant_price_adjustment: 0,
          special_instructions: ''
        }))
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      toast.success('Order held successfully!', { icon: '⏸️' });
      setCart([]);
      setSelectedTable(null);
      fetchPendingOrders();
      fetchTables();
    } catch (error) {
      console.error('Error holding order:', error);
      toast.error(error.response?.data?.error || 'Failed to hold order');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Sync offline orders when back online
  const syncOfflineOrders = async () => {
    try {
      const { getSyncQueue, markAsSynced } = await import('../utils/offlineStorage');
      const queue = await getSyncQueue();
      
      if (queue.length > 0) {
        console.log(`Syncing ${queue.length} offline orders...`);
        
        for (const item of queue) {
          try {
            const token = localStorage.getItem('token');
            await axios.post('/api/orders', item.data, {
              headers: { Authorization: `Bearer ${token}` }
            });
            
            await markAsSynced(item.id);
            console.log('Synced order:', item.id);
          } catch (error) {
            console.error('Failed to sync order:', item.id, error);
          }
        }
        
        toast.success(`Synced ${queue.length} offline orders`);
        fetchPendingOrders();
      }
    } catch (error) {
      console.error('Error syncing offline orders:', error);
    }
  };

  // Send to Kitchen
  const handleSendToKitchen = async () => {
    if (cart.length === 0) {
      toast.error('Cart is empty!');
      return;
    }

    // Check table selection for dine-in (only if tables exist)
    if (tableManagementEnabled && orderType === 'dine-in' && tables.length > 0 && !selectedTable) {
      toast.error('Please select a table!');
      return;
    }

    setIsSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      const tableNumber = orderType === 'takeaway' ? 'Takeaway' : (selectedTable || 'Table');
      
      const orderData = {
        tableNumber: tableNumber,
        order_type: orderType === 'dine-in' ? 'Dine-In' : 'Takeaway',
        payment_status: 'pending',
        items: cart.map(item => ({
          menu_item_id: item.id,
          quantity: item.quantity,
          price: item.price,
          variant_price_adjustment: 0,
          special_instructions: ''
        }))
      };

      if (navigator.onLine) {
        // Online: Send to server
        try {
          await axios.post('/api/orders', orderData, {
            headers: { Authorization: `Bearer ${token}` }
          });
          toast.success('Sent to kitchen!', { icon: '👨‍🍳' });
          fetchPendingOrders();
          fetchTables();
        } catch (onlineError) {
          // If online request fails, treat as offline
          console.log('Online request failed, switching to offline mode:', onlineError);
          await queueOrderForSync(orderData);
          toast.success('Order saved offline! Will sync when online.', { icon: '💾' });
          
          const offlineOrder = {
            id: Date.now(),
            tableNumber,
            order_type: orderData.order_type,
            items: orderData.items,
            timestamp: new Date().toISOString(),
            status: 'offline'
          };
          setOfflineOrders(prev => [...prev, offlineOrder]);
        }
      } else {
        // Offline: Queue for sync
        await queueOrderForSync(orderData);
        toast.success('Order saved offline! Will sync when online.', { icon: '💾' });
        
        // Add to local offline orders display
        const offlineOrder = {
          id: Date.now(),
          tableNumber,
          order_type: orderData.order_type,
          items: orderData.items,
          timestamp: new Date().toISOString(),
          status: 'offline'
        };
        setOfflineOrders(prev => [...prev, offlineOrder]);
      }

      setCart([]);
      setSelectedTable(null);
    } catch (error) {
      console.error('Error sending to kitchen:', error);
      toast.error(error.response?.data?.error || 'Failed to send to kitchen');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Pay Now (create bill)
  const handlePayNow = async () => {
    if (cart.length === 0) {
      toast.error('Cart is empty!');
      return;
    }

    // Check table selection for dine-in (only if tables exist)
    if (tableManagementEnabled && orderType === 'dine-in' && tables.length > 0 && !selectedTable) {
      toast.error('Please select a table!');
      return;
    }

    setIsSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      const tableNumber = orderType === 'takeaway' ? 'Takeaway' : (selectedTable || 'Table');
      
      const orderData = {
        tableNumber: tableNumber,
        order_type: orderType === 'dine-in' ? 'Dine-In' : 'Takeaway',
        payment_status: 'paid',
        payment_method: paymentMethod,
        items: cart.map(item => ({
          menu_item_id: item.id,
          quantity: item.quantity,
          price: item.price,
          variant_price_adjustment: 0,
          special_instructions: ''
        }))
      };

      let billResponse = null;

      if (navigator.onLine) {
        // Online: Process payment normally
        try {
          const orderResponse = await axios.post('/api/orders', orderData, {
            headers: { Authorization: `Bearer ${token}` }
          });

          // Create bill
          billResponse = await axios.post('/api/bills', {
            orderId: orderResponse.data.orderId,
            payment_method: paymentMethod
          }, {
            headers: { Authorization: `Bearer ${token}` }
          });

          toast.success('Payment completed!', { icon: '✅' });
          fetchPaidBills();
          fetchTables();
        } catch (onlineError) {
          // If online request fails, treat as offline
          console.log('Online request failed, switching to offline mode:', onlineError);
          await queueOrderForSync(orderData);
          toast.success('Payment saved offline! Will sync when online.', { icon: '💾' });
          
          const offlineOrder = {
            id: Date.now(),
            tableNumber,
            order_type: orderData.order_type,
            items: orderData.items,
            timestamp: new Date().toISOString(),
            status: 'offline_paid',
            payment_method: paymentMethod
          };
          setOfflineOrders(prev => [...prev, offlineOrder]);
        }
      } else {
        // Offline: Queue for sync
        await queueOrderForSync(orderData);
        toast.success('Payment saved offline! Will sync when online.', { icon: '💾' });
        
        // Add to local offline orders display
        const offlineOrder = {
          id: Date.now(),
          tableNumber,
          order_type: orderData.order_type,
          items: orderData.items,
          timestamp: new Date().toISOString(),
          status: 'offline_paid',
          payment_method: paymentMethod
        };
        setOfflineOrders(prev => [...prev, offlineOrder]);
      }

      setCart([]);
      setSelectedTable(null);
      
      // Simple auto-print - only if enabled and online
      if (autoPrintEnabled && navigator.onLine && billResponse) {
        handlePrintBillById(billResponse.data.billId);
        toast.success('Bill printed!', { icon: '🖨️', duration: 2000 });
      }
      // If disabled, don't print and don't ask - clean and simple!
    } catch (error) {
      console.error('Error processing payment:', error);
      console.error('Error response:', error.response?.data);
      const errorMsg = error.response?.data?.error || error.message || 'Failed to process payment';
      toast.error(errorMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Print bill by ID
  const handlePrintBillById = async (billId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`/api/bills/${billId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      handlePrintBill(response.data);
    } catch (error) {
      console.error('Error fetching bill:', error);
    }
  };

  // Show payment modal for pending order
  const showPendingPaymentModal = (orderId) => {
    setPendingPaymentOrderId(orderId);
    // Ensure a payment method is selected (use default if empty)
    setPaymentMethod(prev => prev || defaultPaymentMethod || 'Cash');
    setShowPaymentModal(true);
  };

  // Pay from pending order with selected payment method
  const handlePayPendingOrder = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post('/api/bills', {
        orderId: pendingPaymentOrderId,
        payment_method: paymentMethod
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      toast.success('Payment completed!');
      setShowPaymentModal(false);
      setPendingPaymentOrderId(null);
      fetchPendingOrders();
      fetchPaidBills();
      fetchTables(); // Refresh tables to update status
    } catch (error) {
      console.error('Error paying order:', error);
      console.error('Error response:', error.response?.data);
      const errorMsg = error.response?.data?.error || error.message || 'Failed to process payment';
      toast.error(errorMsg);
    }
  };

  // Print pending order (KOT style)
  const handlePrintPendingOrder = (order) => {
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Order #${order.id.substring(0, 8)}</title>
        <style>
          @page { size: 80mm auto; margin: 0; }
          body { width: 80mm; font-family: 'Courier New', monospace; font-size: 12px; padding: 5mm; }
          .center { text-align: center; }
          .bold { font-weight: bold; }
          .line { border-top: 1px dashed #000; margin: 5px 0; }
        </style>
      </head>
      <body>
        <div class="center bold">
          <h2>PENDING ORDER</h2>
          <p>Order #${order.id.substring(0, 8)}</p>
          <p>${formatIndianDate(order.created_at)}</p>
        </div>
        <div class="line"></div>
        ${order.items.map(item => `
          <div>${item.quantity}x ${item.item_name}</div>
        `).join('')}
        <div class="line"></div>
        <div class="center bold">
          <p>TOTAL: ${formatCurrency(order.total_amount)}</p>
          <p>Status: PENDING</p>
        </div>
      </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  // Open/Resume pending order (load to cart)
  const handleOpenPendingOrder = async (order) => {
    try {
      // Load order items to cart
      const cartItems = order.items.map(item => ({
        id: item.menu_item_id,
        name: item.item_name,
        price: item.unit_price,
        quantity: item.quantity,
        image_url: item.image_url
      }));
      
      setCart(cartItems);
      setView('menu');
      toast.success('Order loaded to cart!', { icon: '📝' });
      
      // Delete the pending order
      const token = localStorage.getItem('token');
      await axios.delete(`/api/orders/${order.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      fetchPendingOrders();
    } catch (error) {
      console.error('Error opening order:', error);
      toast.error('Failed to load order');
    }
  };

  // Delete pending order
  const handleDeletePendingOrder = async (orderId) => {
    if (!window.confirm('Delete this pending order?')) return;
    
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`/api/orders/${orderId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      toast.success('Order deleted');
      fetchPendingOrders();
    } catch (error) {
      console.error('Error deleting order:', error);
      toast.error('Failed to delete order');
    }
  };

  // Print bill
  const handlePrintBill = (bill) => {
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Bill #${bill.id.substring(0, 8)}</title>
        <style>
          @page { size: 80mm auto; margin: 0; }
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { 
            width: 80mm; 
            font-family: 'Courier New', monospace; 
            font-size: 12px; 
            padding: 5mm;
            line-height: 1.4;
          }
          .center { text-align: center; }
          .bold { font-weight: bold; }
          .line { border-top: 1px dashed #000; margin: 5px 0; }
          .double-line { border-top: 2px solid #000; margin: 8px 0; }
          .row { display: flex; justify-content: space-between; margin: 2px 0; }
          .total { font-size: 16px; font-weight: bold; margin: 10px 0; }
          h1 { font-size: 18px; margin-bottom: 5px; }
          h2 { font-size: 14px; margin-bottom: 3px; }
        </style>
      </head>
      <body>
        <div class="center">
          <h1>BILL</h1>
          <p>Bill #${bill.id.substring(0, 8)}</p>
          <p>${formatIndianDate(bill.created_at)}</p>
        </div>
        <div class="line"></div>
        <div>
          <p><strong>Table:</strong> ${bill.table_number || 'Takeaway'}</p>
          <p><strong>Order Type:</strong> ${bill.order_type || 'Dine-In'}</p>
          <p><strong>Payment:</strong> ${bill.payment_method}</p>
        </div>
        <div class="double-line"></div>
        <div class="bold row">
          <span>Item</span>
          <span>Qty</span>
          <span>Price</span>
        </div>
        <div class="line"></div>
        ${bill.items.map(item => `
          <div class="row">
            <span>${item.item_name}</span>
            <span>${item.quantity}</span>
            <span>${formatCurrency(item.total_price)}</span>
          </div>
        `).join('')}
        <div class="double-line"></div>
        <div class="row total center">
          <span>TOTAL:</span>
          <span>${formatCurrency(bill.total_amount)}</span>
        </div>
        <div class="line"></div>
        <div class="center">
          <p>Thank you for your visit!</p>
          <p>Please visit again</p>
        </div>
      </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  // Edit paid bill (reopen to cart)
  const handleEditBill = async (bill) => {
    if (!window.confirm('Edit this bill? It will be moved to pending orders.')) return;
    
    try {
      // Load bill items to cart
      const cartItems = bill.items.map(item => ({
        id: item.menu_item_id,
        name: item.item_name,
        price: item.unit_price,
        quantity: item.quantity
      }));
      
      setCart(cartItems);
      setPaymentMethod(bill.payment_method);
      setView('menu');
      
      // Delete the bill (optional - or keep as history)
      const token = localStorage.getItem('token');
      await axios.delete(`/api/bills/${bill.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      toast.success('Bill loaded for editing!', { icon: '✏️' });
      fetchPaidBills();
    } catch (error) {
      console.error('Error editing bill:', error);
      toast.error('Failed to edit bill');
    }
  };

  return (
    <div className="h-full flex flex-col gap-4 p-4 max-w-[2000px] mx-auto">
      {/* Top Navigation */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={() => setView('menu')}
          className={`px-6 py-3 rounded-xl font-semibold whitespace-nowrap transition-all ${
            view === 'menu' ? 'text-white shadow-lg' : `${currentTheme.cardBg} ${currentTheme.textColor} opacity-60`
          }`}
          style={view === 'menu' ? {
            background: `linear-gradient(to right, ${currentTheme.accentColor}, ${currentTheme.accentColor}DD)`,
            boxShadow: `0 4px 20px ${currentTheme.accentColor}50`
          } : {}}
        >
          <FiShoppingCart className="inline mr-2" />
          New Order
        </motion.button>

        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={() => setView('pending')}
          className={`px-6 py-3 rounded-xl font-semibold whitespace-nowrap transition-all ${
            view === 'pending' ? 'text-white shadow-lg' : `${currentTheme.cardBg} ${currentTheme.textColor} opacity-60`
          }`}
          style={view === 'pending' ? {
            background: `linear-gradient(to right, ${currentTheme.accentColor}, ${currentTheme.accentColor}DD)`,
            boxShadow: `0 4px 20px ${currentTheme.accentColor}50`
          } : {}}
        >
          <FiClock className="inline mr-2" />
          Pending ({pendingOrders.length})
        </motion.button>

        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={() => setView('paid')}
          className={`px-6 py-3 rounded-xl font-semibold whitespace-nowrap transition-all ${
            view === 'paid' ? 'text-white shadow-lg' : `${currentTheme.cardBg} ${currentTheme.textColor} opacity-60`
          }`}
          style={view === 'paid' ? {
            background: `linear-gradient(to right, ${currentTheme.accentColor}, ${currentTheme.accentColor}DD)`,
            boxShadow: `0 4px 20px ${currentTheme.accentColor}50`
          } : {}}
        >
          <FiCheckCircle className="inline mr-2" />
          Paid Bills ({paidBills.length})
        </motion.button>
      </div>

      {/* NEW ORDER VIEW */}
      {view === 'menu' && (
        <div className="flex-1 flex flex-col lg:flex-row gap-4 min-h-0">
          {/* LEFT SIDE - Menu */}
          <div className="flex-1 flex flex-col gap-4 min-h-0">
            {/* Order Type */}
            <div className="flex gap-3">
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => setOrderType('dine-in')}
                className={`flex-1 py-4 px-6 rounded-2xl font-semibold text-lg transition-all ${
                  orderType === 'dine-in' ? 'text-white shadow-lg border-2' : `${currentTheme.cardBg} ${currentTheme.textColor} opacity-60 border-2 border-transparent`
                }`}
                style={orderType === 'dine-in' ? {
                  background: `linear-gradient(to right, ${currentTheme.accentColor}, ${currentTheme.accentColor}DD)`,
                  borderColor: currentTheme.accentColor,
                  boxShadow: `0 4px 20px ${currentTheme.accentColor}50`
                } : {}}
              >
                <FiHome className="inline mr-2" />
                Dine-In
              </motion.button>
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => setOrderType('takeaway')}
                className={`flex-1 py-4 px-6 rounded-2xl font-semibold text-lg transition-all ${
                  orderType === 'takeaway' ? 'text-white shadow-lg border-2' : `${currentTheme.cardBg} ${currentTheme.textColor} opacity-60 border-2 border-transparent`
                }`}
                style={orderType === 'takeaway' ? {
                  background: `linear-gradient(to right, ${currentTheme.accentColor}, ${currentTheme.accentColor}DD)`,
                  borderColor: currentTheme.accentColor,
                  boxShadow: `0 4px 20px ${currentTheme.accentColor}50`
                } : {}}
              >
                <FiPackage className="inline mr-2" />
                Takeaway
              </motion.button>
            </div>

            {/* Table Selection (Dine-In only) */}
            {tableManagementEnabled && orderType === 'dine-in' && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-2"
              >
                <label className={`text-sm font-medium ${currentTheme.textColor}`}>Select Table:</label>
                <div className="flex gap-2 overflow-x-auto pb-2">
                  {tables.length === 0 ? (
                    <p className={`${currentTheme.textColor} opacity-60 text-sm`}>No tables available</p>
                  ) : (
                    tables.map((table) => (
                      <motion.button
                        key={table.id}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => (table.status === 'Free') ? setSelectedTable(String(table.table_number)) : null}
                        disabled={table.status === 'Occupied' || table.status === 'Billed'}
                        className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-all ${
                          selectedTable === table.table_number 
                            ? 'text-white' 
                            : table.status === 'Free'
                              ? `${currentTheme.textColor} opacity-60 hover:opacity-100`
                              : (table.status === 'Occupied' || table.status === 'Billed')
                                 ? `${currentTheme.textColor} opacity-30`
                                 : `${currentTheme.textColor} opacity-60 hover:opacity-100`
                        }`}
                        style={selectedTable === table.table_number ? {
                          background: currentTheme.accentColor
                        } : table.status === 'Free' ? { 
                          background: 'rgba(255,255,255,0.1)' 
                        } : (table.status === 'Occupied' || table.status === 'Billed') ? { 
                          background: 'rgba(255,0,0,0.1)',
                          cursor: 'not-allowed'
                        } : { 
                          background: 'rgba(255,255,255,0.1)'
                        }}
                      >
                        {table.table_number}
                        {(table.status === 'Occupied' || table.status === 'Billed') && (
                          <span className="ml-1 text-xs">🔒</span>
                        )}
                      </motion.button>
                    ))
                  )}
                </div>
              </motion.div>
            )}

            {/* Search & Categories */}
            <div className="space-y-3">
              <div className="relative">
                <FiSearch 
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-xl" 
                  style={{ color: currentTheme.textColor === 'text-white' ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)' }}
                />
                <input
                  type="text"
                  placeholder="Search menu..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className={`w-full pl-12 pr-4 py-4 ${currentTheme.cardBg} border rounded-2xl ${currentTheme.textColor} text-lg focus:outline-none focus:ring-2`}
                  style={{ borderColor: `${currentTheme.accentColor}40` }}
                />
              </div>

              <div className="flex gap-2 overflow-x-auto pb-2">
                {categories.map((category) => (
                  <motion.button
                    key={category}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setSelectedCategory(category)}
                    className={`px-6 py-2 rounded-full font-medium whitespace-nowrap transition-all ${
                      selectedCategory === category ? 'text-white shadow-lg' : `${currentTheme.cardBg} ${currentTheme.textColor} opacity-60`
                    }`}
                    style={selectedCategory === category ? {
                      background: `linear-gradient(to right, ${currentTheme.accentColor}, ${currentTheme.accentColor}CC)`,
                      boxShadow: `0 4px 15px ${currentTheme.accentColor}50`
                    } : {}}
                  >
                    {category}
                  </motion.button>
                ))}
              </div>
            </div>

            {/* Menu Grid */}
            <div className="flex-1 overflow-y-auto">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {filteredItems.map((item) => (
                  <motion.div
                    key={item.id}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => addToCart(item)}
                    className={`${currentTheme.cardBg} rounded-2xl p-4 cursor-pointer border transition-all`}
                    style={{ borderColor: `${currentTheme.accentColor}30` }}
                  >
                    <div className="aspect-square rounded-xl overflow-hidden mb-3 bg-gradient-to-br from-gray-800 to-gray-700">
                      {item.image_url ? (
                        <img
                          src={`https://restaurant-pos-system-1-7h0m.onrender.com${item.image_url}`}
                          alt={item.name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.target.style.display = 'none';
                            e.target.nextSibling.style.display = 'flex';
                          }}
                        />
                      ) : null}
                      <div
                        className="w-full h-full flex items-center justify-center text-6xl font-bold"
                        style={{ 
                          display: item.image_url ? 'none' : 'flex',
                          color: currentTheme.accentColor 
                        }}
                      >
                        {item.name.charAt(0)}
                      </div>
                    </div>
                    
                    <h3 className={`font-bold text-lg ${currentTheme.textColor} mb-1 line-clamp-1`}>
                      {item.name}
                    </h3>
                    
                    <div className="flex items-center justify-between">
                      <span 
                        className="text-2xl font-bold"
                        style={{ color: currentTheme.accentColor }}
                      >
                        {formatCurrency(item.price)}
                      </span>
                      <motion.button
                        whileTap={{ scale: 0.9 }}
                        className="text-white p-3 rounded-xl"
                        style={{
                          background: `linear-gradient(to right, ${currentTheme.accentColor}, ${currentTheme.accentColor}DD)`
                        }}
                      >
                        <FiPlus className="text-xl" />
                      </motion.button>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>

          {/* RIGHT SIDE - Cart */}
          <div className="lg:w-96">
            <div className={`${currentTheme.cardBg} rounded-2xl border p-6 gap-4 flex flex-col h-full`} style={{ borderColor: `${currentTheme.accentColor}40` }}>
              <h2 className={`text-2xl font-bold ${currentTheme.textColor} flex items-center gap-2`}>
                <FiShoppingCart style={{ color: currentTheme.accentColor }} />
                Cart ({cart.length})
              </h2>

              <div className="flex-1 overflow-y-auto space-y-3">
                {cart.length === 0 ? (
                  <div className={`text-center ${currentTheme.textColor} opacity-50 py-12`}>
                    <FiShoppingCart className="text-6xl mx-auto mb-4 opacity-30" style={{ color: currentTheme.accentColor }} />
                    <p>Cart is empty</p>
                  </div>
                ) : (
                  cart.map((item) => (
                    <div key={item.id} className="bg-white/5 rounded-xl p-4 border border-white/10">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className={`font-semibold ${currentTheme.textColor} flex-1`}>{item.name}</h4>
                        <button onClick={() => removeFromCart(item.id)} className="text-red-400 p-1">
                          <FiX />
                        </button>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3 bg-white/10 rounded-lg p-1">
                          <button onClick={() => updateQuantity(item.id, -1)} className="p-2">
                            <FiMinus className={currentTheme.textColor} />
                          </button>
                          <span className={`${currentTheme.textColor} font-bold w-8 text-center`}>{item.quantity}</span>
                          <button onClick={() => updateQuantity(item.id, 1)} className="p-2">
                            <FiPlus className={currentTheme.textColor} />
                          </button>
                        </div>
                        <span className="font-bold text-lg" style={{ color: currentTheme.accentColor }}>
                          {formatCurrency(item.price * item.quantity)}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {cart.length > 0 && (
                <div className="space-y-4 pt-4 border-t" style={{ borderColor: `${currentTheme.accentColor}40` }}>
                  {/* Payment Method */}
                  <div>
                    <label className={`block text-sm ${currentTheme.textColor} mb-2`}>Payment Method</label>
                    <div className="grid grid-cols-3 gap-2">
                      {['Cash', 'Card', 'UPI'].map((method) => (
                        <button
                          key={method}
                          onClick={() => setPaymentMethod(method)}
                          className={`py-2 rounded-lg font-medium transition-all ${
                            paymentMethod === method ? 'text-white' : `${currentTheme.textColor} opacity-60`
                          }`}
                          style={paymentMethod === method ? {
                            background: currentTheme.accentColor
                          } : { background: 'rgba(255,255,255,0.1)' }}
                        >
                          {method === 'Cash' && <FiDollarSign className="inline mr-1" />}
                          {method === 'Card' && <FiCreditCard className="inline mr-1" />}
                          {method}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className={`flex justify-between items-center ${currentTheme.textColor}`}>
                    <span className="text-lg">Total:</span>
                    <span className="text-3xl font-bold" style={{ color: currentTheme.accentColor }}>
                      {formatCurrency(total)}
                    </span>
                  </div>
                  
                  {/* Quick Action Buttons */}
                  <div className={`grid ${kitchenSystemEnabled ? 'grid-cols-3' : 'grid-cols-2'} gap-2`}>
                    <button
                      onClick={handleHoldOrder}
                      disabled={isSubmitting}
                      className={`py-3 rounded-xl font-semibold transition-all ${currentTheme.textColor} opacity-80 hover:opacity-100`}
                      style={{ background: 'rgba(255,193,7,0.2)', border: '2px solid rgb(255,193,7)' }}
                      title="Hold order"
                    >
                      <FiPause className="inline text-lg" />
                    </button>

                    {kitchenSystemEnabled && (
                      <button
                        onClick={handleSendToKitchen}
                        disabled={isSubmitting}
                        className={`py-3 rounded-xl font-semibold transition-all ${currentTheme.textColor} opacity-80 hover:opacity-100`}
                        style={{ background: 'rgba(255,87,34,0.2)', border: '2px solid rgb(255,87,34)' }}
                        title="Send to kitchen"
                      >
                        <FiSend className="inline text-lg" />
                      </button>
                    )}

                    <button
                      onClick={() => {
                        const previewBill = {
                          id: 'PREVIEW',
                          created_at: new Date().toISOString(),
                          table_number: orderType === 'takeaway' ? 'Takeaway' : selectedTable,
                          order_type: orderType === 'dine-in' ? 'Dine-In' : 'Takeaway',
                          payment_method: paymentMethod,
                          total_amount: total,
                          items: cart.map(item => ({
                            item_name: item.name,
                            quantity: item.quantity,
                            total_price: item.price * item.quantity
                          }))
                        };
                        handlePrintBill(previewBill);
                      }}
                      className={`py-3 rounded-xl font-semibold transition-all ${currentTheme.textColor} opacity-80 hover:opacity-100`}
                      style={{ background: 'rgba(156,39,176,0.2)', border: '2px solid rgb(156,39,176)' }}
                      title="Print preview"
                    >
                      <FiPrinter className="inline text-lg" />
                    </button>
                  </div>

                  <button
                    onClick={handlePayNow}
                    disabled={isSubmitting}
                    className="w-full py-4 text-white font-bold text-lg rounded-xl shadow-lg"
                    style={{
                      background: `linear-gradient(to right, ${currentTheme.accentColor}, ${currentTheme.accentColor}DD)`,
                      boxShadow: `0 8px 30px ${currentTheme.accentColor}50`
                    }}
                  >
                    <FiCheck className="inline mr-2" />
                    Pay Now
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* PENDING ORDERS VIEW */}
      {view === 'pending' && (
        <div className="flex-1 overflow-y-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {pendingOrders.map((order) => (
              <div key={order.id} className={`${currentTheme.cardBg} rounded-2xl p-6 border`} style={{ borderColor: `${currentTheme.accentColor}40` }}>
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className={`font-bold text-lg ${currentTheme.textColor}`}>Order #{order.id.substring(0, 8)}</h3>
                    <p className={`text-sm ${currentTheme.textColor} opacity-60`}>{formatIndianDate(order.created_at)}</p>
                  </div>
                  <span className="px-3 py-1 rounded-full bg-yellow-500/20 text-yellow-400 text-sm font-semibold">
                    Pending
                  </span>
                </div>

                <div className="space-y-2 mb-4">
                  {order.items && order.items.map((item, idx) => (
                    <div key={idx} className="flex justify-between text-sm">
                      <span className={currentTheme.textColor}>{item.quantity}x {item.item_name}</span>
                      <span style={{ color: currentTheme.accentColor }}>{formatCurrency(item.total_price)}</span>
                    </div>
                  ))}
                </div>

                <div className="flex justify-between items-center mb-4 pt-4 border-t" style={{ borderColor: `${currentTheme.accentColor}40` }}>
                  <span className={currentTheme.textColor}>Total:</span>
                  <span className="text-2xl font-bold" style={{ color: currentTheme.accentColor }}>
                    {formatCurrency(order.total_amount)}
                  </span>
                </div>

                <div className="grid grid-cols-4 gap-2">
                  <button
                    onClick={() => handlePrintPendingOrder(order)}
                    className={`py-3 rounded-xl font-semibold ${currentTheme.textColor}`}
                    style={{ background: 'rgba(156,39,176,0.2)', border: '2px solid rgb(156,39,176)' }}
                    title="Print KOT"
                  >
                    <FiPrinter className="inline text-lg" />
                  </button>

                  <button
                    onClick={() => handleOpenPendingOrder(order)}
                    className={`py-3 rounded-xl font-semibold ${currentTheme.textColor}`}
                    style={{ background: 'rgba(33,150,243,0.2)', border: '2px solid rgb(33,150,243)' }}
                    title="Open in cart"
                  >
                    <FiRefreshCw className="inline" />
                  </button>

                  <button
                    onClick={() => handleDeletePendingOrder(order.id)}
                    className={`py-3 rounded-xl font-semibold ${currentTheme.textColor}`}
                    style={{ background: 'rgba(244,67,54,0.2)', border: '2px solid rgb(244,67,54)' }}
                    title="Delete order"
                  >
                    <FiTrash2 className="inline" />
                  </button>

                  <button
                    onClick={() => showPendingPaymentModal(order.id)}
                    className="py-3 text-white font-semibold rounded-xl"
                    style={{ background: `linear-gradient(to right, ${currentTheme.accentColor}, ${currentTheme.accentColor}DD)` }}
                    title="Pay now"
                  >
                    <FiCheck className="inline" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* OFFLINE ORDERS VIEW */}
      {view === 'pending' && offlineOrders.length > 0 && (
        <div className="mt-6">
          <h3 className={`text-lg font-bold ${currentTheme.textColor} mb-4 flex items-center gap-2`}>
            <FiWifiOff className="text-orange-500" />
            Offline Orders ({offlineOrders.length})
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {offlineOrders.map((order) => (
              <div key={order.id} className={`${currentTheme.cardBg} rounded-2xl p-6 border border-orange-500/40`}>
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className={`font-bold text-lg ${currentTheme.textColor}`}>Offline Order #{order.id}</h3>
                    <p className={`text-sm ${currentTheme.textColor} opacity-60`}>
                      {new Date(order.timestamp).toLocaleString()}
                    </p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                    order.status === 'offline_paid' 
                      ? 'bg-green-500/20 text-green-400' 
                      : 'bg-orange-500/20 text-orange-400'
                  }`}>
                    {order.status === 'offline_paid' ? 'Paid (Offline)' : 'Pending (Offline)'}
                  </span>
                </div>

                <div className="space-y-2 mb-4">
                  <p className={`text-sm ${currentTheme.textColor}`}>
                    <strong>Table:</strong> {order.tableNumber}
                  </p>
                  <p className={`text-sm ${currentTheme.textColor}`}>
                    <strong>Type:</strong> {order.order_type}
                  </p>
                  {order.payment_method && (
                    <p className={`text-sm ${currentTheme.textColor}`}>
                      <strong>Payment:</strong> {order.payment_method}
                    </p>
                  )}
                </div>

                <div className="space-y-1 mb-4">
                  {order.items.map((item, index) => (
                    <div key={index} className="flex justify-between items-center text-sm">
                      <span className={`${currentTheme.textColor}`}>
                        {item.quantity}x {item.name || `Item ${item.menu_item_id}`}
                      </span>
                      <span className={`font-semibold ${currentTheme.textColor}`}>
                        {formatCurrency(item.price * item.quantity)}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="flex items-center gap-2 text-xs text-orange-400">
                  <FiWifiOff className="animate-pulse" />
                  <span>Will sync when online</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* PAID BILLS VIEW */}
      {view === 'paid' && (
        <div className="flex-1 overflow-y-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {paidBills.map((bill) => (
              <div key={bill.id} className={`${currentTheme.cardBg} rounded-2xl p-6 border`} style={{ borderColor: `${currentTheme.accentColor}40` }}>
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className={`font-bold text-lg ${currentTheme.textColor}`}>Bill #{bill.id.substring(0, 8)}</h3>
                    <p className={`text-sm ${currentTheme.textColor} opacity-60`}>{formatIndianDate(bill.created_at)}</p>
                  </div>
                  <span className="px-3 py-1 rounded-full bg-green-500/20 text-green-400 text-sm font-semibold">
                    Paid
                  </span>
                </div>

                <div className="space-y-2 mb-4">
                  {bill.items && bill.items.map((item, idx) => (
                    <div key={idx} className="flex justify-between text-sm">
                      <span className={currentTheme.textColor}>{item.quantity}x {item.item_name}</span>
                      <span style={{ color: currentTheme.accentColor }}>{formatCurrency(item.total_price)}</span>
                    </div>
                  ))}
                </div>

                <div className="flex justify-between items-center mb-4 pt-4 border-t" style={{ borderColor: `${currentTheme.accentColor}40` }}>
                  <span className={currentTheme.textColor}>Total:</span>
                  <span className="text-2xl font-bold" style={{ color: currentTheme.accentColor }}>
                    {formatCurrency(bill.total_amount)}
                  </span>
                </div>

                <div className="flex justify-between items-center text-sm mb-4">
                  <span className={`${currentTheme.textColor} opacity-60`}>Payment:</span>
                  <span className={currentTheme.textColor}>{bill.payment_method}</span>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => handlePrintBill(bill)}
                    className="py-3 text-white font-semibold rounded-xl"
                    style={{ background: `linear-gradient(to right, ${currentTheme.accentColor}, ${currentTheme.accentColor}DD)` }}
                  >
                    <FiPrinter className="inline mr-1" />
                    Print
                  </button>

                  <button
                    onClick={() => handleEditBill(bill)}
                    className={`py-3 rounded-xl font-semibold ${currentTheme.textColor}`}
                    style={{ background: 'rgba(255,152,0,0.2)', border: '2px solid rgb(255,152,0)' }}
                  >
                    <FiEdit className="inline mr-1" />
                    Edit
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Payment Method Modal (for Pending Orders) */}
      <AnimatePresence>
        {showPaymentModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowPaymentModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className={`${currentTheme.cardBg} rounded-2xl p-6 max-w-md w-full border`}
              style={{ borderColor: `${currentTheme.accentColor}40` }}
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className={`text-2xl font-bold ${currentTheme.textColor}`}>Select Payment Method</h3>
                <button
                  onClick={() => setShowPaymentModal(false)}
                  className={`p-2 rounded-full hover:bg-white/10 ${currentTheme.textColor}`}
                >
                  <FiX className="text-xl" />
                </button>
              </div>

              <div className="grid grid-cols-3 gap-3 mb-6">
                {['Cash', 'Card', 'UPI'].map((method) => (
                  <button
                    key={method}
                    onClick={() => setPaymentMethod(method)}
                    className={`py-4 rounded-xl font-semibold transition-all ${
                      paymentMethod === method ? 'text-white shadow-lg' : `${currentTheme.textColor} opacity-60`
                    }`}
                    style={paymentMethod === method ? {
                      background: currentTheme.accentColor,
                      boxShadow: `0 4px 20px ${currentTheme.accentColor}50`
                    } : { background: 'rgba(255,255,255,0.1)' }}
                  >
                    {method === 'Cash' && <FiDollarSign className="block mx-auto text-2xl mb-1" />}
                    {method === 'Card' && <FiCreditCard className="block mx-auto text-2xl mb-1" />}
                    {method === 'UPI' && <div className="block mx-auto text-2xl mb-1">📱</div>}
                    {method}
                  </button>
                ))}
              </div>

              <button
                onClick={handlePayPendingOrder}
                className="w-full py-4 text-white font-bold text-lg rounded-xl shadow-lg"
                style={{
                  background: `linear-gradient(to right, ${currentTheme.accentColor}, ${currentTheme.accentColor}DD)`,
                  boxShadow: `0 8px 30px ${currentTheme.accentColor}50`
                }}
              >
                <FiCheck className="inline mr-2" />
                Confirm Payment
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default OrderTakingComplete;

