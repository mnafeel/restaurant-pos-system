import React, { useState, useEffect } from 'react';
import axios from 'axios';
import io from 'socket.io-client';
import toast from 'react-hot-toast';
import { FaPlus, FaMinus, FaTrash, FaShoppingCart, FaPaperPlane } from 'react-icons/fa';

const OrderTaking = () => {
  const [tables, setTables] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [selectedTable, setSelectedTable] = useState(null);
  const [cart, setCart] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [showVariantModal, setShowVariantModal] = useState(false);
  const [selectedMenuItem, setSelectedMenuItem] = useState(null);
  const [tableManagementEnabled, setTableManagementEnabled] = useState(true);
  const [customerInfo, setCustomerInfo] = useState({
    customer_name: '',
    customer_phone: '',
    notes: ''
  });

  useEffect(() => {
    // Initialize socket connection
    const newSocket = io('http://localhost:5002');
    newSocket.emit('join-orders');

    newSocket.on('table-status-updated', () => {
      fetchTables();
    });

    // Fetch tables, menu, and settings
    fetchTables();
    fetchMenu();
    fetchSettings();

    return () => newSocket.close();
  }, []);

  const fetchSettings = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/settings', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const isEnabled = response.data.enable_table_management === 'true';
      setTableManagementEnabled(isEnabled);
    } catch (error) {
      console.error('Error fetching settings:', error);
      setTableManagementEnabled(true);
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
      toast.error('Failed to fetch tables');
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

  const handleItemClick = (item) => {
    if (item.variants && item.variants.length > 0) {
      // Show variant selection modal
      setSelectedMenuItem(item);
      setShowVariantModal(true);
    } else {
      // Add directly to cart
      addToCart(item, null);
    }
  };

  const addToCart = (item, variant = null) => {
    const cartItemKey = `${item.id}-${variant?.id || 'no-variant'}`;
    const existingItem = cart.find(cartItem => cartItem.key === cartItemKey);
    
    if (existingItem) {
      setCart(cart.map(cartItem =>
        cartItem.key === cartItemKey
          ? { ...cartItem, quantity: cartItem.quantity + 1 }
          : cartItem
      ));
    } else {
      const variantPriceAdjustment = variant ? variant.price_adjustment : 0;
      setCart([...cart, {
        key: cartItemKey,
        menu_item_id: item.id,
        variant_id: variant?.id || null,
        name: item.name,
        variant_name: variant?.name || null,
        price: item.price,
        variant_price_adjustment: variantPriceAdjustment,
        quantity: 1,
        special_instructions: ''
      }]);
    }
    
    setShowVariantModal(false);
    setSelectedMenuItem(null);
  };

  const removeFromCart = (cartItemKey) => {
    setCart(cart.filter(item => item.key !== cartItemKey));
  };

  const updateQuantity = (cartItemKey, quantity) => {
    if (quantity <= 0) {
      removeFromCart(cartItemKey);
      return;
    }
    setCart(cart.map(item =>
      item.key === cartItemKey
        ? { ...item, quantity }
        : item
    ));
  };

  const updateSpecialInstructions = (cartItemKey, instructions) => {
    setCart(cart.map(item =>
      item.key === cartItemKey
        ? { ...item, special_instructions: instructions }
        : item
    ));
  };

  const calculateTotal = () => {
    return cart.reduce((total, item) => 
      total + ((item.price + item.variant_price_adjustment) * item.quantity), 0
    );
  };

  const submitOrder = async () => {
    // Check if table is required (only when table management is enabled)
    if (tableManagementEnabled && !selectedTable) {
      toast.error('Please select a table');
      return;
    }
    
    if (cart.length === 0) {
      toast.error('Please add items to cart');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await axios.post('/api/orders', {
        tableNumber: selectedTable || 'Takeaway',
        items: cart,
        ...customerInfo
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      toast.success(`Order submitted successfully! Order ID: ${response.data.orderId.substring(0, 8)}`);
      setCart([]);
      setSelectedTable(null);
      setCustomerInfo({ customer_name: '', customer_phone: '', notes: '' });
      fetchTables();
    } catch (error) {
      console.error('Error submitting order:', error);
      toast.error(error.response?.data?.error || 'Error submitting order');
    }
  };

  const groupedMenuItems = menuItems.reduce((groups, item) => {
    const category = item.category;
    if (!groups[category]) {
      groups[category] = [];
    }
    groups[category].push(item);
    return groups;
  }, {});

  const categories = ['All', ...Object.keys(groupedMenuItems)];
  const filteredItems = selectedCategory === 'All' 
    ? menuItems 
    : menuItems.filter(item => item.category === selectedCategory);

  const freeTables = tables.filter(t => t.status === 'Free');

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Order Taking</h1>
        <p className="text-gray-600 mt-1">Take customer orders and send to kitchen</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Table Selection & Customer Info */}
        <div className="space-y-6">
          {/* Table Selection - Only show if table management is enabled */}
          {tableManagementEnabled && (
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold mb-4">Select Table</h2>
              <div className="grid grid-cols-3 gap-2">
                {freeTables.map(table => (
                  <button
                    key={table.id}
                    onClick={() => setSelectedTable(table.table_number)}
                    className={`p-3 rounded-lg border-2 transition-colors ${
                      selectedTable === table.table_number
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    <div className="font-semibold">{table.table_number}</div>
                    <div className="text-xs text-gray-600">{table.capacity} seats</div>
                  </button>
                ))}
              </div>
              
              {freeTables.length === 0 && (
                <p className="text-center text-gray-500 py-4">No free tables available</p>
              )}
            </div>
          )}

          {/* Customer Info */}
          {selectedTable && (
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold mb-4">Customer Info (Optional)</h2>
              
              <div className="space-y-3">
                <input
                  type="text"
                  placeholder="Customer Name"
                  value={customerInfo.customer_name}
                  onChange={(e) => setCustomerInfo({ ...customerInfo, customer_name: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                />
                
                <input
                  type="tel"
                  placeholder="Phone Number"
                  value={customerInfo.customer_phone}
                  onChange={(e) => setCustomerInfo({ ...customerInfo, customer_phone: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                />
                
                <textarea
                  placeholder="Order Notes"
                  value={customerInfo.notes}
                  onChange={(e) => setCustomerInfo({ ...customerInfo, notes: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  rows="2"
                />
              </div>
            </div>
          )}
        </div>

        {/* Middle: Menu Items */}
        <div className="lg:col-span-2 space-y-6">
          {/* Category Filter */}
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex flex-wrap gap-2">
              {categories.map(category => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`px-4 py-2 rounded-lg transition-colors ${
                    selectedCategory === category
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>

          {/* Menu Items Grid */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4">Menu</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {filteredItems.map(item => (
                <div key={item.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h4 className="font-medium text-gray-900">{item.name}</h4>
                      {item.variants && item.variants.length > 0 && (
                        <span className="text-xs text-blue-600">Has variants</span>
                      )}
                    </div>
                    <span className="text-green-600 font-semibold">${item.price.toFixed(2)}</span>
                  </div>
                  <p className="text-sm text-gray-600 mb-3">{item.description}</p>
                  <button
                    onClick={() => handleItemClick(item)}
                    disabled={!item.is_available}
                    className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                  >
                    {item.is_available ? 'Add to Cart' : 'Out of Stock'}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Cart (Bottom or Sidebar) */}
      {cart.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t-2 border-gray-200 shadow-2xl lg:static lg:mt-6 lg:rounded-lg lg:shadow lg:border-0">
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold flex items-center">
                <FaShoppingCart className="mr-2 text-blue-600" />
                Cart ({cart.length} items)
              </h2>
              <button
                onClick={() => setCart([])}
                className="text-red-600 hover:text-red-800 text-sm flex items-center"
              >
                <FaTrash className="mr-1" />
                Clear Cart
              </button>
            </div>

            <div className="space-y-3 max-h-64 overflow-y-auto mb-4">
              {cart.map(item => (
                <div key={item.key} className="flex items-center justify-between border-b pb-3">
                  <div className="flex-1">
                    <div className="flex justify-between items-center">
                      <h4 className="font-medium">
                        {item.name}
                        {item.variant_name && (
                          <span className="text-sm text-blue-600 ml-2">({item.variant_name})</span>
                        )}
                      </h4>
                      <span className="text-green-600 font-semibold">
                        ${(item.price + item.variant_price_adjustment).toFixed(2)}
                      </span>
                    </div>
                    
                    <div className="flex items-center space-x-4 mt-2">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => updateQuantity(item.key, item.quantity - 1)}
                          className="bg-gray-200 text-gray-700 w-7 h-7 rounded-full flex items-center justify-center hover:bg-gray-300"
                        >
                          <FaMinus size={12} />
                        </button>
                        <span className="w-8 text-center font-medium">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.key, item.quantity + 1)}
                          className="bg-gray-200 text-gray-700 w-7 h-7 rounded-full flex items-center justify-center hover:bg-gray-300"
                        >
                          <FaPlus size={12} />
                        </button>
                      </div>
                      
                      <input
                        type="text"
                        placeholder="Special instructions..."
                        value={item.special_instructions}
                        onChange={(e) => updateSpecialInstructions(item.key, e.target.value)}
                        className="flex-1 px-2 py-1 border rounded text-sm focus:ring-2 focus:ring-blue-500"
                      />
                      
                      <button
                        onClick={() => removeFromCart(item.key)}
                        className="text-red-600 hover:text-red-800"
                      >
                        <FaTrash />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="flex justify-between items-center pt-4 border-t-2">
              <div className="text-xl font-bold text-gray-900">
                Total: ${calculateTotal().toFixed(2)}
              </div>
              <button
                onClick={submitOrder}
                disabled={!selectedTable}
                className="bg-green-600 text-white py-3 px-6 rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center"
              >
                <FaPaperPlane className="mr-2" />
                Submit Order
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Variant Selection Modal */}
      {showVariantModal && selectedMenuItem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-2xl font-bold mb-4">{selectedMenuItem.name}</h2>
            <p className="text-gray-600 mb-4">Select a variant:</p>
            
            <div className="space-y-3">
              {/* No variant option */}
              <button
                onClick={() => addToCart(selectedMenuItem, null)}
                className="w-full p-4 border-2 rounded-lg text-left hover:border-blue-500 hover:bg-blue-50 transition-colors"
              >
                <div className="flex justify-between items-center">
                  <span className="font-medium">Regular (No variant)</span>
                  <span className="text-green-600 font-semibold">${selectedMenuItem.price.toFixed(2)}</span>
                </div>
              </button>
              
              {/* Variant options */}
              {selectedMenuItem.variants.map(variant => {
                const finalPrice = selectedMenuItem.price + variant.price_adjustment;
                return (
                  <button
                    key={variant.id}
                    onClick={() => addToCart(selectedMenuItem, variant)}
                    className="w-full p-4 border-2 rounded-lg text-left hover:border-blue-500 hover:bg-blue-50 transition-colors"
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <div className="font-medium">{variant.name}</div>
                        {variant.price_adjustment !== 0 && (
                          <div className="text-sm text-gray-600">
                            {variant.price_adjustment > 0 ? '+' : ''}${variant.price_adjustment.toFixed(2)}
                          </div>
                        )}
                      </div>
                      <span className="text-green-600 font-semibold">${finalPrice.toFixed(2)}</span>
                    </div>
                  </button>
                );
              })}
            </div>
            
            <button
              onClick={() => {
                setShowVariantModal(false);
                setSelectedMenuItem(null);
              }}
              className="w-full mt-4 px-4 py-2 border rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderTaking;
