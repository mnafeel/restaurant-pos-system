import React, { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { FiSearch, FiShoppingCart, FiX, FiPlus, FiMinus, FiCheck, FiClock, FiPackage, FiHome } from 'react-icons/fi';
import { useAuth } from '../contexts/AuthContext';
import { useCurrency } from '../contexts/CurrencyContext';
import { useTheme } from '../contexts/ThemeContext';

const OrderTakingNew = () => {
  const { user } = useAuth();
  const { formatCurrency } = useCurrency();
  const { currentTheme } = useTheme();
  
  // State
  const [menuItems, setMenuItems] = useState([]);
  const [cart, setCart] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [orderType, setOrderType] = useState('dine-in'); // 'dine-in', 'takeaway'
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showCart, setShowCart] = useState(false);

  useEffect(() => {
    fetchMenu();
  }, []);

  const fetchMenu = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/menu', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMenuItems(response.data);
    } catch (error) {
      console.error('Error fetching menu:', error);
      toast.error('Failed to load menu');
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

  // Submit order
  const handleSubmit = async () => {
    if (cart.length === 0) {
      toast.error('Cart is empty!');
      return;
    }

    setIsSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      await axios.post('/api/orders', {
        tableNumber: orderType === 'takeaway' ? 'Takeaway' : 'Table',
        order_type: orderType === 'dine-in' ? 'Dine-In' : 'Takeaway',
        payment_status: 'pending',
        items: cart.map(item => ({
          menu_item_id: item.id,
          quantity: item.quantity,
          unit_price: item.price,
          notes: ''
        }))
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      toast.success('Order created successfully!');
      setCart([]);
      setShowCart(false);
    } catch (error) {
      console.error('Error creating order:', error);
      toast.error('Failed to create order');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="h-full flex flex-col lg:flex-row gap-4 p-4 max-w-[2000px] mx-auto">
      {/* LEFT SIDE - Menu */}
      <div className="flex-1 flex flex-col gap-4 min-h-0">
        {/* Order Type Selector - Theme-Aware Premium Pills */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex gap-3"
        >
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => setOrderType('dine-in')}
            className={`flex-1 py-4 px-6 rounded-2xl font-semibold text-lg transition-all duration-300 ${
              orderType === 'dine-in'
                ? `${currentTheme.cardBg} text-white shadow-lg border-2`
                : `${currentTheme.cardBg} ${currentTheme.textColor} opacity-60 hover:opacity-100 border-2 border-transparent`
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
            className={`flex-1 py-4 px-6 rounded-2xl font-semibold text-lg transition-all duration-300 ${
              orderType === 'takeaway'
                ? `${currentTheme.cardBg} text-white shadow-lg border-2`
                : `${currentTheme.cardBg} ${currentTheme.textColor} opacity-60 hover:opacity-100 border-2 border-transparent`
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
        </motion.div>

        {/* Search & Categories */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="space-y-3"
        >
          {/* Search - Theme-Aware */}
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
              style={{ 
                borderColor: `${currentTheme.accentColor}40`,
                '--tw-ring-color': currentTheme.accentColor
              }}
            />
          </div>

          {/* Categories - Theme-Aware Horizontal Scroll */}
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-white/20">
            {categories.map((category, index) => (
              <motion.button
                key={category}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setSelectedCategory(category)}
                className={`px-6 py-2 rounded-full font-medium whitespace-nowrap transition-all duration-300 ${
                  selectedCategory === category
                    ? `text-white shadow-lg`
                    : `${currentTheme.cardBg} ${currentTheme.textColor} opacity-60 hover:opacity-100`
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
        </motion.div>

        {/* Menu Grid - Responsive */}
        <div className="flex-1 overflow-y-auto">
          <motion.div 
            layout
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
          >
            <AnimatePresence>
              {filteredItems.map((item, index) => (
                <motion.div
                  key={item.id}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ delay: index * 0.02 }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => addToCart(item)}
                  className={`${currentTheme.cardBg} rounded-2xl p-4 cursor-pointer border transition-all duration-300 hover:shadow-xl`}
                  style={{
                    borderColor: `${currentTheme.accentColor}30`,
                    ':hover': { borderColor: `${currentTheme.accentColor}60` }
                  }}
                >
                  {/* Image - Always Show */}
                  <div className="aspect-square rounded-xl overflow-hidden mb-3 bg-gradient-to-br from-gray-800 to-gray-700">
                    {item.image_url ? (
                      <img
                        src={`https://restaurant-pos-system-1-7h0m.onrender.com${item.image_url}`}
                        alt={item.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.target.style.display = 'none';
                          e.target.parentElement.innerHTML = `<div class="w-full h-full flex items-center justify-center text-4xl">${item.name.charAt(0)}</div>`;
                        }}
                      />
                    ) : (
                      <div 
                        className="w-full h-full flex items-center justify-center text-6xl font-bold"
                        style={{ color: currentTheme.accentColor }}
                      >
                        {item.name.charAt(0)}
                      </div>
                    )}
                  </div>
                  
                  {/* Info */}
                  <h3 className={`font-bold text-lg ${currentTheme.textColor} mb-1 line-clamp-1`}>
                    {item.name}
                  </h3>
                  {item.description && (
                    <p className={`${currentTheme.textColor} opacity-60 text-sm mb-3 line-clamp-2`}>
                      {item.description}
                    </p>
                  )}
                  
                  {/* Price & Add Button */}
                  <div className="flex items-center justify-between">
                    <span 
                      className="text-2xl font-bold"
                      style={{ color: currentTheme.accentColor }}
                    >
                      {formatCurrency(item.price)}
                    </span>
                    <motion.button
                      whileTap={{ scale: 0.9 }}
                      className="text-white p-3 rounded-xl transition-colors"
                      style={{
                        background: `linear-gradient(to right, ${currentTheme.accentColor}, ${currentTheme.accentColor}DD)`
                      }}
                    >
                      <FiPlus className="text-xl" />
                    </motion.button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        </div>
      </div>

      {/* RIGHT SIDE - Cart (Desktop) / Floating Button (Mobile) */}
      <div className="lg:w-96 flex-shrink-0">
        {/* Desktop Cart - Theme-Aware */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className={`hidden lg:flex flex-col h-full ${currentTheme.cardBg} rounded-2xl border p-6 gap-4`}
          style={{ borderColor: `${currentTheme.accentColor}40` }}
        >
          <div className="flex items-center justify-between">
            <h2 className={`text-2xl font-bold ${currentTheme.textColor} flex items-center gap-2`}>
              <FiShoppingCart style={{ color: currentTheme.accentColor }} />
              Cart ({cart.length})
            </h2>
          </div>

          {/* Cart Items */}
          <div className="flex-1 overflow-y-auto space-y-3">
            <AnimatePresence>
              {cart.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className={`text-center ${currentTheme.textColor} opacity-50 py-12`}
                >
                  <FiShoppingCart 
                    className="text-6xl mx-auto mb-4 opacity-30"
                    style={{ color: currentTheme.accentColor }}
                  />
                  <p>Cart is empty</p>
                </motion.div>
              ) : (
                cart.map((item) => (
                  <motion.div
                    key={item.id}
                    layout
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    className="bg-white/5 rounded-xl p-4 border border-white/10"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-semibold text-white flex-1">{item.name}</h4>
                      <button
                        onClick={() => removeFromCart(item.id)}
                        className="text-red-400 hover:text-red-300 p-1"
                      >
                        <FiX />
                      </button>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 bg-white/10 rounded-lg p-1">
                        <motion.button
                          whileTap={{ scale: 0.9 }}
                          onClick={() => updateQuantity(item.id, -1)}
                          className="p-2 hover:bg-white/10 rounded"
                        >
                          <FiMinus className="text-white" />
                        </motion.button>
                        <span className="text-white font-bold w-8 text-center">{item.quantity}</span>
                        <motion.button
                          whileTap={{ scale: 0.9 }}
                          onClick={() => updateQuantity(item.id, 1)}
                          className="p-2 hover:bg-white/10 rounded"
                        >
                          <FiPlus className="text-white" />
                        </motion.button>
                      </div>
                      <span className="text-emerald-400 font-bold text-lg">
                        {formatCurrency(item.price * item.quantity)}
                      </span>
                    </div>
                  </motion.div>
                ))
              )}
            </AnimatePresence>
          </div>

          {/* Total & Submit */}
          {cart.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4 pt-4 border-t border-white/20"
            >
              <div className={`flex justify-between items-center ${currentTheme.textColor}`}>
                <span className="text-lg">Total:</span>
                <span 
                  className="text-3xl font-bold"
                  style={{ color: currentTheme.accentColor }}
                >
                  {formatCurrency(total)}
                </span>
              </div>
              
              <motion.button
                whileTap={{ scale: 0.98 }}
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="w-full py-4 text-white font-bold text-lg rounded-xl disabled:opacity-50 disabled:cursor-not-allowed shadow-lg transition-all duration-300"
                style={{
                  background: `linear-gradient(to right, ${currentTheme.accentColor}, ${currentTheme.accentColor}DD)`,
                  boxShadow: `0 8px 30px ${currentTheme.accentColor}50`
                }}
              >
                {isSubmitting ? (
                  <FiClock className="inline animate-spin mr-2" />
                ) : (
                  <FiCheck className="inline mr-2" />
                )}
                {isSubmitting ? 'Processing...' : 'Place Order'}
              </motion.button>
            </motion.div>
          )}
        </motion.div>

        {/* Mobile Floating Cart Button - Theme-Aware */}
        <motion.button
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => setShowCart(true)}
          className="lg:hidden fixed bottom-6 right-6 text-white p-5 rounded-full shadow-2xl z-50"
          style={{
            background: `linear-gradient(to right, ${currentTheme.accentColor}, ${currentTheme.accentColor}DD)`,
            boxShadow: `0 8px 30px ${currentTheme.accentColor}80`
          }}
        >
          <FiShoppingCart className="text-2xl" />
          {cart.length > 0 && (
            <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center">
              {cart.length}
            </span>
          )}
        </motion.button>
      </div>

      {/* Mobile Cart Modal */}
      <AnimatePresence>
        {showCart && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="lg:hidden fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-end"
            onClick={() => setShowCart(false)}
          >
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 30 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full bg-gradient-to-b from-gray-900 to-gray-800 rounded-t-3xl max-h-[80vh] flex flex-col"
            >
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-white/10">
                <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                  <FiShoppingCart />
                  Cart ({cart.length})
                </h2>
                <button
                  onClick={() => setShowCart(false)}
                  className="p-2 hover:bg-white/10 rounded-full"
                >
                  <FiX className="text-2xl text-white" />
                </button>
              </div>

              {/* Cart Items */}
              <div className="flex-1 overflow-y-auto p-6 space-y-3">
                {cart.length === 0 ? (
                  <div className="text-center text-white/50 py-12">
                    <FiShoppingCart className="text-6xl mx-auto mb-4 opacity-30" />
                    <p>Cart is empty</p>
                  </div>
                ) : (
                  cart.map((item) => (
                    <div
                      key={item.id}
                      className="bg-white/5 rounded-xl p-4 border border-white/10"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-semibold text-white flex-1">{item.name}</h4>
                        <button
                          onClick={() => removeFromCart(item.id)}
                          className="text-red-400 hover:text-red-300 p-1"
                        >
                          <FiX />
                        </button>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3 bg-white/10 rounded-lg p-1">
                          <button
                            onClick={() => updateQuantity(item.id, -1)}
                            className="p-2 hover:bg-white/10 rounded"
                          >
                            <FiMinus className="text-white" />
                          </button>
                          <span className="text-white font-bold w-8 text-center">{item.quantity}</span>
                          <button
                            onClick={() => updateQuantity(item.id, 1)}
                            className="p-2 hover:bg-white/10 rounded"
                          >
                            <FiPlus className="text-white" />
                          </button>
                        </div>
                        <span className="text-emerald-400 font-bold text-lg">
                          {formatCurrency(item.price * item.quantity)}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Total & Submit */}
              {cart.length > 0 && (
                <div className="p-6 border-t border-white/10 space-y-4 bg-gray-900/50">
                  <div className="flex justify-between items-center text-white">
                    <span className="text-lg">Total:</span>
                    <span className="text-3xl font-bold text-emerald-400">{formatCurrency(total)}</span>
                  </div>
                  
                  <button
                    onClick={() => {
                      handleSubmit();
                      setShowCart(false);
                    }}
                    disabled={isSubmitting}
                    className="w-full py-4 bg-gradient-to-r from-emerald-600 to-emerald-500 text-white font-bold text-lg rounded-xl disabled:opacity-50 shadow-lg"
                  >
                    {isSubmitting ? 'Processing...' : 'Place Order'}
                  </button>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default OrderTakingNew;

