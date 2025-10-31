import React, { useState, useEffect } from 'react';
import axios from 'axios';
import io from 'socket.io-client';
import toast from 'react-hot-toast';
import { FaPlus, FaMinus, FaTrash } from 'react-icons/fa';
import { FiSearch, FiSend, FiDollarSign, FiPrinter, FiClock, FiUser, FiX, FiShoppingCart, FiCheckCircle } from 'react-icons/fi';
import { useAuth } from '../contexts/AuthContext';
import { useCurrency } from '../contexts/CurrencyContext';
import { formatIndianDate } from '../hooks/useServerTime';

const OrderTaking = () => {
  const { user } = useAuth();
  const { currency, formatCurrency } = useCurrency();
  const [tables, setTables] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [selectedTable, setSelectedTable] = useState(null);
  const [cart, setCart] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [showVariantModal, setShowVariantModal] = useState(false);
  const [selectedMenuItem, setSelectedMenuItem] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [orderType, setOrderType] = useState('Dine-In'); // Dine-In, Takeaway, Delivery
  const [paymentMethod, setPaymentMethod] = useState('Cash'); // Cash, Card, UPI
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showPendingOrders, setShowPendingOrders] = useState(false);
  const [pendingOrders, setPendingOrders] = useState([]);
  const [showPaidBills, setShowPaidBills] = useState(false);
  const [paidBills, setPaidBills] = useState([]);
  const [billSearchQuery, setBillSearchQuery] = useState('');
  const [currentOrderId, setCurrentOrderId] = useState(null);
  const [tableManagementEnabled, setTableManagementEnabled] = useState(true);
  const [kitchenSystemEnabled, setKitchenSystemEnabled] = useState(true);
  const [sentToKitchen, setSentToKitchen] = useState(false);
  const [defaultPaymentMethod, setDefaultPaymentMethod] = useState('Cash');
  const [customerInfo, setCustomerInfo] = useState({
    customer_name: '',
    customer_phone: '',
    notes: ''
  });
  const [shopInfo, setShopInfo] = useState({
    company_name: 'Restaurant POS',
    owner_name: ''
  });

  useEffect(() => {
    const newSocket = io('https://restaurant-pos-system-1-7h0m.onrender.com');
    newSocket.emit('join-orders');

    newSocket.on('table-status-updated', () => {
      fetchTables();
    });

    fetchTables();
    fetchMenu();
    fetchSettings();
    fetchPendingOrders();
    fetchShopInfo();

    return () => newSocket.close();
  }, []);

  const fetchSettings = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/settings', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const isEnabled = response.data.enable_table_management === 'true';
      const isKitchenEnabled = response.data.enable_kitchen_system === 'true';
      const defaultPaymentRaw = response.data.default_payment_method || 'Cash';
      // Normalize payment method: handle UPI specially (all caps)
      let defaultPayment;
      if (defaultPaymentRaw.toLowerCase() === 'upi') {
        defaultPayment = 'UPI';
      } else {
        defaultPayment = defaultPaymentRaw.charAt(0).toUpperCase() + defaultPaymentRaw.slice(1).toLowerCase();
      }
      console.log('Table management setting:', response.data.enable_table_management, '→ isEnabled:', isEnabled);
      console.log('Kitchen system setting:', response.data.enable_kitchen_system, '→ isKitchenEnabled:', isKitchenEnabled);
      console.log('Default payment method:', defaultPaymentRaw, '→ normalized:', defaultPayment);
      setTableManagementEnabled(isEnabled);
      setKitchenSystemEnabled(isKitchenEnabled);
      setDefaultPaymentMethod(defaultPayment);
      setPaymentMethod(defaultPayment);
    } catch (error) {
      console.error('Error fetching settings:', error);
      setTableManagementEnabled(true);
      setKitchenSystemEnabled(true);
      setPaymentMethod('Cash');
    }
  };

  const fetchTables = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/tables', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTables(response.data);
    } catch (error) {
      console.error('Error fetching tables:', error);
    }
  };

  const fetchMenu = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/menu', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMenuItems(response.data);
    } catch (error) {
      console.error('Error fetching menu:', error);
      toast.error('Failed to fetch menu');
    }
  };

  const fetchShopInfo = async () => {
    try {
      const token = localStorage.getItem('token');
      
      // For shop admin/staff, use their shop name
      // For owner, use company name
      if (user?.shop_id) {
        // User belongs to a shop - fetch shop info
        const shopResponse = await axios.get(`/api/shops/${user.shop_id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setShopInfo({
          company_name: shopResponse.data.name,
          owner_name: ''
        });
      } else if (user?.role === 'owner' && user?.company_name) {
        // Owner - use company name
        setShopInfo({
          company_name: user.company_name,
          owner_name: `${user.first_name} ${user.last_name}`
        });
      }
    } catch (error) {
      console.error('Error fetching shop info:', error);
    }
  };

  const fetchPaidBills = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/bills?filter=today', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPaidBills(response.data);
    } catch (error) {
      console.error('Error fetching paid bills:', error);
    }
  };

  const handleEditBill = async (bill) => {
    try {
      const token = localStorage.getItem('token');
      // Fetch full bill details with items
      const response = await axios.get(`/api/bills/${bill.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const billDetails = response.data;
      
      // Load bill into order form for editing
      setCurrentOrderId(billDetails.order_id);
      setSelectedTable(billDetails.table_number !== 'Takeaway' ? billDetails.table_number : null);
      setOrderType(billDetails.order_type || 'Dine-In');
      setPaymentMethod(billDetails.payment_method || defaultPaymentMethod);
      setSentToKitchen(true); // Already paid, so assume sent
      setCustomerInfo({
        customer_name: billDetails.customer_name || '',
        customer_phone: billDetails.customer_phone || '',
        notes: billDetails.notes || ''
      });
      
      // Map bill items to cart
      const cartItems = (billDetails.items || []).map(item => ({
        id: item.menu_item_id,
        name: item.item_name,
        price: parseFloat(item.price),
        quantity: parseInt(item.quantity),
        variant_price_adjustment: 0,
        category: item.category || '',
        description: item.description || '',
        is_available: true
      }));
      
      setCart(cartItems);
      setShowPaidBills(false);
      toast.success(`Bill loaded! You can now edit items.`);
    } catch (error) {
      console.error('Error loading bill:', error);
      toast.error('Failed to load bill');
    }
  };

  const fetchPendingOrders = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/orders/pending', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPendingOrders(response.data);
    } catch (error) {
      console.error('Error fetching pending orders:', error);
      console.error('Error details:', error.response?.data);
      // Set empty array on error to prevent UI issues
      setPendingOrders([]);
    }
  };

  const addToCart = (item) => {
    // Ensure price is a number
    const itemPrice = parseFloat(item.price) || 0;
    const variantAdjustment = parseFloat(item.variant_price_adjustment) || 0;
    
    const existingItem = cart.find(cartItem => 
      cartItem.id === item.id && 
      (cartItem.variant_price_adjustment || 0) === variantAdjustment
    );
    
    if (existingItem) {
      setCart(cart.map(cartItem =>
        cartItem.id === item.id && (cartItem.variant_price_adjustment || 0) === variantAdjustment
          ? { ...cartItem, quantity: parseInt(cartItem.quantity) + 1 }
          : cartItem
      ));
    } else {
      setCart([...cart, { 
        ...item, 
        price: itemPrice,
        quantity: 1, 
        variant_price_adjustment: variantAdjustment 
      }]);
    }
  };

  const updateQuantity = (itemId, newQuantity) => {
    const quantity = parseInt(newQuantity) || 0;
    if (quantity === 0) {
      setCart(cart.filter(item => item.id !== itemId));
    } else {
      setCart(cart.map(item =>
        item.id === itemId ? { ...item, quantity: quantity } : item
      ));
    }
  };

  const removeFromCart = (itemId) => {
    setCart(cart.filter(item => item.id !== itemId));
  };

  const calculateTotal = () => {
    return cart.reduce((total, item) => {
      const price = parseFloat(item.price) || 0;
      const variantAdjustment = parseFloat(item.variant_price_adjustment) || 0;
      const quantity = parseInt(item.quantity) || 0;
      return total + ((price + variantAdjustment) * quantity);
    }, 0);
  };

  const handleSendToKitchen = async () => {
    if (cart.length === 0) {
      toast.error('No items to send to kitchen!');
      return;
    }

    if (!currentOrderId) {
      toast.error('Please create order first!');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      await axios.put(`/api/orders/${currentOrderId}/status`, {
        kds_status: 'Sent to Kitchen'
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setSentToKitchen(true);
      toast.success('Order sent to kitchen!');
    } catch (error) {
      console.error('Error sending to kitchen:', error);
      toast.error('Failed to send to kitchen');
    }
  };

  const handleNewOrder = async () => {
    if (cart.length > 0) {
      // Save current order to pending before starting new
      await handleSaveOrderToPending();
      setCart([]);
      setSelectedTable(null);
      setCustomerInfo({ customer_name: '', customer_phone: '', notes: '' });
      setCurrentOrderId(null);
      setOrderType('Dine-In');
      setSentToKitchen(false);
      setPaymentMethod(defaultPaymentMethod);
      toast.success('Current order saved! Ready for new order.');
    } else {
      // No items in cart - just alert user
      toast.error('No items in cart! Please add items first.');
    }
  };

  const handleSaveOrderToPending = async () => {
    if (cart.length === 0) {
      toast.error('Please add items to cart');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const orderData = {
        tableNumber: selectedTable || 'Takeaway',
        order_type: orderType,
        payment_status: 'pending',
        items: cart.map(item => ({
          menu_item_id: item.id,
          quantity: item.quantity,
          price: item.price,
          variant_price_adjustment: item.variant_price_adjustment || 0
        })),
        ...customerInfo
      };

      if (currentOrderId) {
        await axios.put(`/api/orders/${currentOrderId}/items`, orderData, {
          headers: { Authorization: `Bearer ${token}` }
        });
        toast.success('Order updated and held in pending!');
      } else {
        await axios.post('/api/orders', orderData, {
          headers: { Authorization: `Bearer ${token}` }
        });
        toast.success('Order held! Available in Pending Orders.');
      }

      // Clear cart and reset
      setCart([]);
      setSelectedTable(null);
      setCurrentOrderId(null);
      setCustomerInfo({ customer_name: '', customer_phone: '', notes: '' });
      
      fetchPendingOrders();
    } catch (error) {
      console.error('Error saving order:', error);
      toast.error('Failed to hold order: ' + (error.response?.data?.error || error.message));
    }
  };

  const submitOrder = async () => {
    // Validate table selection for Dine-In when table management is enabled
    if (tableManagementEnabled && orderType === 'Dine-In' && !selectedTable) {
      toast.error('Please select a table for Dine-In orders');
      return;
    }

    if (cart.length === 0) {
      toast.error('Please add items to cart');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const orderData = {
        tableNumber: selectedTable || 'Takeaway',
        order_type: orderType,
        payment_status: 'pending',
        items: cart.map(item => ({
          menu_item_id: item.id,
          quantity: item.quantity,
          price: item.price,
          variant_price_adjustment: item.variant_price_adjustment || 0
        })),
        ...customerInfo
      };

      console.log('Submitting order:', orderData);

      let response;
      if (currentOrderId) {
        response = await axios.put(`/api/orders/${currentOrderId}/items`, orderData, {
          headers: { Authorization: `Bearer ${token}` }
        });
        response.data = { orderId: currentOrderId };
      } else {
        response = await axios.post('/api/orders', orderData, {
          headers: { Authorization: `Bearer ${token}` }
        });
      }

      console.log('Order response:', response.data);
      setCurrentOrderId(response.data.orderId);
      setShowPaymentModal(true);
      fetchPendingOrders();
    } catch (error) {
      console.error('Error submitting order:', error);
      console.error('Error details:', error.response?.data);
      toast.error(error.response?.data?.error || 'Error submitting order');
    }
  };

  const handleCompletePayment = async (selectedPaymentMethod) => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(`/api/orders/${currentOrderId}/payment`, {
        payment_method: selectedPaymentMethod,
        payment_status: 'paid'
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      toast.success('Payment completed successfully!');
      setShowPaymentModal(false);
      setCart([]);
      setSelectedTable(null);
      setCustomerInfo({ customer_name: '', customer_phone: '', notes: '' });
      setCurrentOrderId(null);
      setPaymentMethod(defaultPaymentMethod);
      fetchTables();
      fetchPendingOrders();
    } catch (error) {
      console.error('Error completing payment:', error);
      toast.error('Failed to complete payment');
    }
  };

  const handlePrintBill = async () => {
    try {
      const total = calculateTotal();
      const currentDate = formatIndianDate(new Date());

      // Generate thermal receipt HTML
      const receiptHTML = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Bill Receipt</title>
          <meta charset="UTF-8">
          <style>
            @page {
              size: 80mm auto;
              margin: 0;
            }
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            body {
              width: 80mm;
              font-family: 'Courier New', monospace;
              font-size: 11px;
              padding: 3mm;
              line-height: 1.3;
              color: #000;
              background: white;
            }
            .center { 
              text-align: center; 
              width: 100%;
            }
            .bold { font-weight: bold; }
            .line { 
              border-top: 1px dashed #000; 
              margin: 4px 0; 
              width: 100%;
            }
            .double-line { 
              border-top: 2px solid #000; 
              margin: 6px 0; 
              width: 100%;
            }
            .row { 
              display: table;
              width: 100%;
              margin: 1px 0;
            }
            .row span:first-child {
              display: table-cell;
              text-align: left;
              width: 60%;
            }
            .row span:last-child {
              display: table-cell;
              text-align: right;
              width: 40%;
            }
            .header { 
              text-align: center; 
              font-weight: bold; 
              margin-bottom: 8px; 
              border-bottom: 2px dashed #000; 
              padding-bottom: 8px; 
            }
            .item-name {
              font-weight: bold;
              margin-bottom: 2px;
            }
            .item-detail {
              font-size: 10px;
              padding-left: 8px;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div style="font-size: 16px;">${shopInfo.company_name.toUpperCase()}</div>
            <div style="font-size: 12px;">Order Bill</div>
            <div style="font-size: 10px; margin-top: 5px;">${currentDate}</div>
          </div>

          <div class="row">
            <span>Order Type:</span>
            <span class="bold">${orderType}</span>
          </div>
          ${selectedTable ? `
          <div class="row">
            <span>Table:</span>
            <span class="bold">${selectedTable}</span>
          </div>` : ''}
          ${customerInfo.customer_name ? `
          <div class="row">
            <span>Customer:</span>
            <span class="bold">${customerInfo.customer_name}</span>
          </div>` : ''}

          <div class="line"></div>

          <div class="section">
            ${cart.map(item => `
              <div style="margin-bottom: 6px;">
                <div class="item-name">${item.name}</div>
                <div class="row item-detail">
                  <span>${item.quantity} x ${currency}${item.price.toFixed(2)}</span>
                  <span>${currency}${(item.quantity * item.price).toFixed(2)}</span>
                </div>
              </div>
            `).join('')}
          </div>

          <div class="double-line"></div>

          <div class="row bold" style="font-size: 16px; margin-top: 10px;">
            <span>TOTAL</span>
            <span>${currency}${total.toFixed(2)}</span>
          </div>

          <div class="center" style="margin-top: 15px; font-size: 10px;">================================</div>
          <div class="center" style="margin-top: 5px; font-size: 10px;">Thank you for your order!</div>
          <div class="center" style="margin-top: 5px; font-size: 10px;">================================</div>
        </body>
        </html>
      `;

      // Open in new window and print
      const printWindow = window.open('', '', 'width=302,height=600');
      printWindow.document.write(receiptHTML);
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => {
        printWindow.print();
        printWindow.close();
      }, 250);
      
      toast.success('Opening print dialog...');
    } catch (error) {
      console.error('Print error:', error);
      toast.error('Failed to print bill');
    }
  };

  const handlePayPendingOrder = (order) => {
    console.log('Loading pending order:', order);
    console.log('Order items:', order.items);
    
    setCurrentOrderId(order.id);
    setSelectedTable(order.table_number !== 'Takeaway' ? order.table_number : null);
    setOrderType(order.order_type || 'Dine-In');
    setSentToKitchen(order.kds_status === 'Sent to Kitchen' || order.kds_status === 'In Progress' || order.kds_status === 'Ready');
    setCustomerInfo({
      customer_name: order.customer_name || '',
      customer_phone: order.customer_phone || '',
      notes: order.notes || ''
    });
    
    // Map pending order items to cart format with all required fields
    const orderItems = (order.items || []).map(item => {
      console.log('Mapping item:', item);
      return {
        id: item.menu_item_id,
        name: item.name,
        price: parseFloat(item.price),
        quantity: parseInt(item.quantity),
        variant_price_adjustment: 0,
        category: item.category || '',
        description: item.description || '',
        is_available: true
      };
    });
    
    console.log('Mapped cart items:', orderItems);
    setCart(orderItems);
    setShowPendingOrders(false);
    toast.success(`Order loaded with ${orderItems.length} items!`);
  };

  const freeTables = tables.filter(t => t.status === 'Available' || t.status === 'Free');
  console.log('Order Type:', orderType, 'Table Management:', tableManagementEnabled, 'Free Tables:', freeTables.length, 'All Tables:', tables.length);
  
  const categories = ['All', ...new Set(menuItems.map(item => item.category))];
  const filteredItems = menuItems.filter(item => {
    const matchesCategory = selectedCategory === 'All' || item.category === selectedCategory;
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="h-full bg-[#f7f9fb] flex flex-col">
      {/* Premium Header */}
      <div className="flex-shrink-0 bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 text-white shadow-lg">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <FiShoppingCart className="text-3xl" />
              <div>
                <h1 className="text-2xl font-bold">New Order</h1>
                <p className="text-blue-100 text-sm">Staff: {user?.first_name || 'Cashier'}</p>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowPendingOrders(true)}
                className="relative px-6 py-2 rounded-lg bg-orange-500 hover:bg-orange-600 text-white font-semibold transition shadow-lg flex items-center gap-2"
              >
                <FiClock />
                Pending Orders
                {pendingOrders.length > 0 && (
                  <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full h-6 w-6 flex items-center justify-center">
                    {pendingOrders.length}
                  </span>
                )}
              </button>
              <button
                onClick={() => {
                  fetchPaidBills();
                  setShowPaidBills(true);
                }}
                className="relative px-6 py-2 rounded-lg bg-green-500 hover:bg-green-600 text-white font-semibold transition shadow-lg flex items-center gap-2"
              >
                <FiPrinter />
                Paid Bills
              </button>
              <button
                onClick={handleNewOrder}
                className="px-6 py-2 rounded-lg bg-green-500 hover:bg-green-600 text-white font-semibold transition shadow-lg flex items-center gap-2"
              >
                <FiSend />
                New Order
                </button>
            </div>
            </div>
          </div>
        </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        <div className="grid grid-cols-12 gap-6 p-6 h-full">
          {/* Left Panel - Menu & Controls */}
          <div className="col-span-12 lg:col-span-8 space-y-4">
            {/* Order Type Selection */}
            <div className="bg-white rounded-xl shadow-lg p-4">
              <div className="flex items-center gap-2 mb-3">
                <div className="bg-blue-100 p-2 rounded-lg">
                  <FiDollarSign className="text-blue-600" />
                </div>
                <h3 className="font-bold text-gray-800">Order Type</h3>
                      </div>
              <div className="grid grid-cols-2 gap-3">
                {['Dine-In', 'Takeaway'].map(type => (
                      <button
                    key={type}
                    onClick={() => {
                      setOrderType(type);
                      if (type !== 'Dine-In') {
                        setSelectedTable(null);
                      }
                    }}
                    className={`py-3 px-4 rounded-lg font-semibold transition-all ${
                      orderType === type
                        ? 'bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-md'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {type}
                      </button>
                ))}
              </div>
            </div>

            {/* Table Selection - Only for Dine-In when enabled */}
            {tableManagementEnabled && orderType === 'Dine-In' && (
              <div className="bg-white rounded-xl shadow-lg p-4">
                <div className="flex items-center gap-2 mb-3">
                  <div className="bg-orange-100 p-2 rounded-lg">
                    <FiUser className="text-orange-600" />
                  </div>
                  <h3 className="font-bold text-gray-800">Select Table</h3>
                    </div>
                <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2">
                  {freeTables.map(table => (
                    <button
                      key={table.id}
                      onClick={() => setSelectedTable(table.table_number)}
                      className={`px-3 py-2 rounded-lg text-sm font-bold transition-all ${
                        selectedTable === table.table_number
                          ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-md'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {table.table_number}
                    </button>
                  ))}
                </div>
                {freeTables.length === 0 && (
                  <p className="text-center text-gray-500 py-4">No tables available</p>
                )}
              </div>
            )}

            {/* Takeaway Confirmation - Only show when table management is enabled */}
            {tableManagementEnabled && orderType === 'Takeaway' && (
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-xl p-4 text-center">
                <p className="text-green-700 font-semibold">✓ Takeaway Order - No table required</p>
              </div>
            )}

            {/* Category Filter */}
            <div className="bg-white rounded-xl shadow-lg overflow-hidden">
              <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-4 py-3 border-b border-gray-200 flex items-center gap-2">
                <div className="bg-blue-100 p-2 rounded-lg">
                  <FiSearch className="text-blue-600" />
                </div>
                <h3 className="font-bold text-gray-800">Menu Categories</h3>
              </div>
              <div className="p-4 flex flex-wrap gap-2">
                {categories.map(cat => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                      selectedCategory === cat
                        ? 'bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-lg'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Menu Items Grid */}
            <div className="bg-white rounded-xl shadow-lg overflow-hidden">
              <div className="bg-gradient-to-r from-purple-500 to-purple-600 text-white px-4 py-3 flex items-center gap-2">
                <div className="bg-white/20 p-2 rounded-lg">
                  <FiDollarSign />
                </div>
                <h3 className="font-bold">Available Items</h3>
              </div>
              <div className="p-4 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 max-h-[400px] overflow-y-auto">
                {filteredItems.map(item => (
                  <button
                    key={item.id}
                    onClick={() => addToCart(item)}
                    disabled={!item.is_available}
                    className="bg-white border-2 border-gray-200 rounded-xl overflow-hidden hover:shadow-lg transition-all transform hover:scale-105 text-left disabled:opacity-50 disabled:cursor-not-allowed hover:border-blue-400 active:scale-95"
                  >
                    {/* Item Image */}
                    <div className="aspect-square bg-gray-100 relative">
                      {item.image_url ? (
                        <img 
                          src={`https://restaurant-pos-system-1-7h0m.onrender.com${item.image_url}`}
                          alt={item.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-4xl">
                          🍽️
                        </div>
                      )}
                      {!item.is_available && (
                        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                          <span className="text-white text-xs font-bold">Out of Stock</span>
                        </div>
                      )}
                    </div>
                    {/* Item Info */}
                    <div className="p-3">
                      <div className="font-bold text-sm text-gray-900 truncate">{item.name}</div>
                      <div className="text-xs text-gray-500 truncate mt-1">{item.category}</div>
                      <div className="text-lg font-bold text-green-600 mt-2">{formatCurrency(item.price)}</div>
                    </div>
                  </button>
            ))}
          </div>
        </div>
      </div>

          {/* Right Panel - Billing */}
          <div className="col-span-12 lg:col-span-4">
            <div className="bg-white rounded-2xl shadow-2xl border-4 border-blue-200 sticky top-6 overflow-hidden">
              {/* Billing Header */}
              <div className="bg-gradient-to-r from-blue-600 via-blue-700 to-purple-600 text-white p-6 text-center">
                <FiShoppingCart className="text-4xl mx-auto mb-2" />
                <h2 className="text-2xl font-extrabold">Current Order</h2>
              </div>

              <div className="p-6 space-y-6">
                {/* Order Type & Table Display */}
                <div className="border-b-2 border-dashed border-gray-200 pb-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="bg-blue-100 p-2 rounded-lg">
                      <FiDollarSign className="text-blue-600" />
                    </div>
                    <span className="font-bold text-gray-800">Order Details</span>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Type:</span>
                      <span className="text-lg font-semibold text-blue-600">{orderType}</span>
                    </div>
                    {orderType === 'Dine-In' && selectedTable && (
                      <div className="flex items-center justify-between bg-orange-50 border-2 border-orange-200 rounded-lg p-3">
                        <span className="text-sm font-semibold text-orange-800">Table Number:</span>
                        <span className="text-2xl font-extrabold text-orange-600">{selectedTable}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Cart Items */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <div className="bg-green-100 p-2 rounded-lg">
                      <FiSend className="text-green-600" />
                    </div>
                    <span className="font-bold text-gray-800">Items</span>
                    {cart.length > 0 && (
                      <button
                        onClick={() => {
                          if (window.confirm('Clear all items from cart?')) {
                            setCart([]);
                            toast.success('Cart cleared!');
                          }
                        }}
                        className="ml-auto bg-red-100 text-red-600 px-3 py-1 rounded-lg text-sm font-semibold hover:bg-red-200 transition flex items-center gap-1"
                      >
                        <FaTrash size={12} />
                        Clear All
                      </button>
                    )}
                  </div>

                  {cart.length === 0 ? (
                    <div className="text-center py-10">
                      <FiShoppingCart className="text-5xl text-gray-300 mx-auto mb-4" />
                      <p className="text-gray-500 text-lg">No items</p>
                      <p className="text-gray-400 text-sm mt-2">Add from menu</p>
                    </div>
                  ) : (
                    <div className="space-y-4 max-h-72 overflow-y-auto">
                      {cart.map(item => (
                        <div key={item.id} className="border-b border-gray-200 pb-4">
                          <div className="flex justify-between items-start mb-2">
                            <div className="flex-1">
                              <div className="font-semibold text-gray-900">{item.name}</div>
                              <div className="text-sm text-gray-600">{formatCurrency(item.price)} each</div>
                            </div>
                            <button
                              onClick={() => removeFromCart(item.id)}
                              className="bg-red-100 text-red-600 p-1 rounded-full hover:bg-red-200"
                            >
                              <FaTrash size={12} />
                            </button>
                          </div>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                className="bg-gray-200 text-gray-700 p-1 rounded-full hover:bg-gray-300"
                              >
                                <FaMinus size={12} />
                              </button>
                              <span className="font-bold text-gray-900 w-8 text-center">{item.quantity}</span>
                              <button
                                onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                className="bg-gray-200 text-gray-700 p-1 rounded-full hover:bg-gray-300"
                              >
                                <FaPlus size={12} />
                              </button>
                            </div>
                            <div className="font-bold text-gray-900">
                              {formatCurrency((item.price + (item.variant_price_adjustment || 0)) * item.quantity)}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Total */}
                {cart.length > 0 && (
                  <>
                    <div className="border-t-2 border-dashed border-gray-200 pt-6">
                      <div className="flex justify-between items-center text-2xl font-extrabold">
                        <span className="text-gray-900">Total</span>
                        <span className="text-green-600">{formatCurrency(calculateTotal())}</span>
                      </div>
                    </div>

                    {/* Customer Info */}
                    <div className="space-y-4">
                      <input
                        type="text"
                        placeholder="Customer Name (Optional)"
                        value={customerInfo.customer_name}
                        onChange={(e) => setCustomerInfo({ ...customerInfo, customer_name: e.target.value })}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                      <input
                        type="text"
                        placeholder="Customer Phone (Optional)"
                        value={customerInfo.customer_phone}
                        onChange={(e) => setCustomerInfo({ ...customerInfo, customer_phone: e.target.value })}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    {/* Send to Kitchen Button */}
                    {kitchenSystemEnabled && currentOrderId && !sentToKitchen && (
                      <button
                        onClick={handleSendToKitchen}
                        className="w-full bg-gradient-to-r from-orange-600 to-orange-700 hover:from-orange-700 hover:to-orange-800 text-white py-4 px-6 rounded-xl text-lg font-bold shadow-lg hover:shadow-xl transition-all transform hover:scale-105 flex items-center justify-center gap-2"
                      >
                        <FiSend className="text-xl" />
                        Send to Kitchen
                      </button>
                    )}

                    {kitchenSystemEnabled && sentToKitchen && (
                      <div className="w-full bg-green-100 border-2 border-green-500 text-green-800 py-3 px-4 rounded-xl text-center font-bold flex items-center justify-center gap-2">
                        <FiCheckCircle className="text-xl" />
                        ✅ Sent to Kitchen
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="grid grid-cols-2 gap-3">
                      {/* Hold Order Button */}
                      <button
                        onClick={handleSaveOrderToPending}
                        className="bg-gradient-to-r from-yellow-500 to-amber-500 hover:from-yellow-600 hover:to-amber-600 text-white py-5 px-4 rounded-xl text-lg font-bold shadow-lg hover:shadow-xl transition-all transform hover:scale-105 flex items-center justify-center gap-2"
                        title="Hold"
                      >
                        <FiClock className="text-xl" />
                      </button>
                      
                      {/* Submit/Pay Button */}
                      <button
                        onClick={submitOrder}
                        className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white py-5 px-4 rounded-xl text-lg font-bold shadow-lg hover:shadow-xl transition-all transform hover:scale-105 flex items-center justify-center gap-2"
                      >
                        <FiCheckCircle className="text-xl" />
                        {currentOrderId ? 'Update & Pay' : 'Pay Now'}
                      </button>
                    </div>

                    {currentOrderId && (
                      <button
                        onClick={handleNewOrder}
                        className="w-full bg-gray-500 hover:bg-gray-600 text-white py-3 px-6 rounded-lg font-semibold shadow-md transition"
                      >
                        Cancel & New Order
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Payment Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
            <div className="bg-gradient-to-r from-green-600 to-emerald-600 text-white px-6 py-5 rounded-t-2xl">
              <h2 className="text-2xl font-bold text-center">Complete Payment</h2>
            </div>

            <div className="p-6 space-y-6">
              <div className="text-center">
                <p className="text-gray-600 text-sm mb-2">Total Amount</p>
                <p className="text-4xl font-extrabold text-green-600">{formatCurrency(calculateTotal())}</p>
                    </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-3">Payment Method</label>
                <div className="grid grid-cols-3 gap-3">
                  {['Cash', 'Card', 'UPI'].map(method => (
                    <button
                      key={method}
                      onClick={() => setPaymentMethod(method)}
                      className={`py-4 px-5 rounded-xl font-bold transition-all duration-300 transform ${
                        paymentMethod === method
                          ? 'bg-gradient-to-r from-green-600 via-green-500 to-emerald-500 text-white shadow-2xl scale-105 ring-4 ring-green-300 ring-opacity-50 animate-pulse'
                          : 'bg-white text-gray-600 hover:bg-gray-50 border-2 border-gray-200 hover:border-gray-300 shadow-sm'
                      }`}
                    >
                      {paymentMethod === method && '✓ '}
                      {method}
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={handlePrintBill}
                className="w-full py-3 px-6 rounded-lg bg-blue-100 text-blue-700 hover:bg-blue-200 font-semibold transition flex items-center justify-center gap-2"
              >
                <FiPrinter />
                Print Bill (Before Payment)
              </button>

              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setShowPaymentModal(false)}
                  className="py-3 px-6 rounded-lg border-2 border-gray-300 text-gray-700 hover:bg-gray-50 font-semibold transition"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleCompletePayment(paymentMethod)}
                  className="py-3 px-6 rounded-lg bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-semibold shadow-lg transition"
                >
                  Complete Payment
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Pending Orders Modal */}
      {showPendingOrders && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-4xl shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="bg-gradient-to-r from-orange-600 to-orange-500 text-white px-6 py-5 rounded-t-2xl flex justify-between items-center">
              <h2 className="text-2xl font-bold">Pending Orders</h2>
              <button onClick={() => setShowPendingOrders(false)} className="text-white hover:bg-white/20 rounded-lg p-2">
                <FiX size={24} />
              </button>
            </div>

            <div className="p-6">
              {pendingOrders.length === 0 ? (
                <div className="text-center py-12">
                  <FiClock className="text-6xl text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 text-lg">No pending orders</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {pendingOrders.map(order => (
                    <div key={order.id} className="bg-gray-50 rounded-xl p-4 border-2 border-gray-200 hover:border-orange-400 transition">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <div className="font-bold text-lg text-gray-900">
                            {order.order_type || 'Dine-In'} - {order.table_number}
                          </div>
                          <div className="text-sm text-gray-600">{order.customer_name || 'Guest'}</div>
                          <div className="text-xs text-gray-500 mt-1">
                            {formatIndianDate(order.created_at)}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold text-green-600">{formatCurrency(order.total_amount)}</div>
            <button
                            onClick={() => handlePayPendingOrder(order)}
                            className="mt-2 px-4 py-2 rounded-lg bg-gradient-to-r from-blue-600 to-blue-500 text-white font-semibold hover:from-blue-700 hover:to-blue-600 transition shadow-md text-sm"
            >
                            Open Order
            </button>
                        </div>
                      </div>
                      <div className="border-t border-gray-300 pt-3 mt-3">
                        <div className="text-sm font-semibold text-gray-700 mb-2">Items:</div>
                        <div className="space-y-1">
                          {order.items && order.items.map((item, idx) => (
                            <div key={idx} className="flex justify-between text-sm">
                              <span className="text-gray-600">{item.quantity}x {item.name}</span>
                              <span className="text-gray-900 font-semibold">{formatCurrency(item.price * item.quantity)}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Paid Bills Modal */}
      {showPaidBills && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-6xl shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="bg-gradient-to-r from-green-600 to-emerald-500 text-white px-6 py-5 rounded-t-2xl flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold">Paid Bills - Edit Order</h2>
                <p className="text-green-100">Click on any bill to edit its items</p>
              </div>
              <button
                onClick={() => setShowPaidBills(false)}
                className="p-2 hover:bg-white hover:bg-opacity-20 rounded-lg transition"
              >
                <FiX className="text-2xl" />
              </button>
            </div>

            <div className="p-6">
              {/* Search Bar */}
              <div className="mb-6">
                <div className="relative">
                  <FiSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 text-xl" />
                  <input
                    type="text"
                    placeholder="Search by Order ID, Bill #, Table, Customer..."
                    value={billSearchQuery}
                    onChange={(e) => setBillSearchQuery(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 text-lg"
                  />
                </div>
                <p className="text-sm text-gray-500 mt-2">
                  Found: <strong className="text-green-600">{paidBills.filter(bill => 
                    !billSearchQuery || 
                    bill.id?.toLowerCase().includes(billSearchQuery.toLowerCase()) ||
                    bill.order_id?.toLowerCase().includes(billSearchQuery.toLowerCase()) ||
                    bill.table_number?.toLowerCase().includes(billSearchQuery.toLowerCase()) ||
                    bill.customer_name?.toLowerCase().includes(billSearchQuery.toLowerCase())
                  ).length}</strong> bills
                </p>
              </div>

              {paidBills.length === 0 ? (
                <div className="text-center py-12">
                  <FiPrinter className="text-6xl text-gray-300 mx-auto mb-4" />
                  <p className="text-xl text-gray-600">No paid bills found</p>
                  <p className="text-gray-400 mt-2">Complete some orders to see bills here</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4">
                  {paidBills.filter(bill => 
                    !billSearchQuery || 
                    bill.id?.toLowerCase().includes(billSearchQuery.toLowerCase()) ||
                    bill.order_id?.toLowerCase().includes(billSearchQuery.toLowerCase()) ||
                    bill.table_number?.toLowerCase().includes(billSearchQuery.toLowerCase()) ||
                    bill.customer_name?.toLowerCase().includes(billSearchQuery.toLowerCase())
                  ).map((bill) => (
                    <div
                      key={bill.id}
                      onClick={() => handleEditBill(bill)}
                      className="bg-white border-2 border-gray-200 hover:border-green-400 hover:shadow-xl rounded-xl p-5 transition-all cursor-pointer"
                    >
                      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 items-center">
                        <div>
                          <p className="text-xs text-gray-500 mb-1">Order ID</p>
                          <p className="font-bold text-blue-600 text-sm">#{bill.order_id ? bill.order_id.substring(0, 8).toUpperCase() : 'N/A'}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 mb-1">Bill Number</p>
                          <p className="font-bold text-gray-900 text-sm">#{bill.id ? bill.id.substring(0, 8).toUpperCase() : 'N/A'}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 mb-1">Table</p>
                          <p className="font-semibold text-gray-800">{bill.table_number || 'N/A'}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 mb-1">Date & Time</p>
                          <p className="font-semibold text-gray-800 text-sm">{formatIndianDate(bill.created_at)}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 mb-1">Total</p>
                          <p className="font-bold text-green-600 text-xl">{formatCurrency(parseFloat(bill.total_amount))}</p>
                        </div>
                      </div>
                      <div className="mt-3 flex items-center justify-between">
                        {bill.customer_name && (
                          <p className="text-sm text-gray-600">Customer: {bill.customer_name}</p>
                        )}
                        <span className="ml-auto bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-semibold">
                          Click to Edit Items →
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderTaking;
