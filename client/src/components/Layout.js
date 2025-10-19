import React, { useState, useEffect } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiHome,
  FiShoppingCart,
  FiMonitor,
  FiPrinter,
  FiBarChart2,
  FiUsers,
  FiPackage,
  FiLogOut,
  FiMenu,
  FiX,
  FiUser,
  FiGrid,
  FiSettings,
  FiShoppingBag,
  FiAward
} from 'react-icons/fi';

const Layout = () => {
  const { user, logout, hasRole } = useAuth();
  const { currentTheme } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [tableManagementEnabled, setTableManagementEnabled] = useState(true);
  const [kitchenSystemEnabled, setKitchenSystemEnabled] = useState(true);
  const [shopName, setShopName] = useState('Restaurant POS');

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) return;
        
        const response = await axios.get('/api/settings', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setTableManagementEnabled(response.data.enable_table_management === 'true');
        setKitchenSystemEnabled(response.data.enable_kitchen_system === 'true');
      } catch (error) {
        console.error('Error fetching settings:', error);
        setTableManagementEnabled(true);
        setKitchenSystemEnabled(true);
      }
    };

    const fetchShopName = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token || !user) return;

        // If user is owner, show Owner Dashboard
        if (user.role === 'owner') {
          setShopName(user.company_name ? `${user.company_name} - Owner Dashboard` : '👑 Owner Dashboard');
        } else if (user.shop_id) {
          // If user belongs to a shop, fetch shop name
          const response = await axios.get(`/api/shops/${user.shop_id}`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          setShopName(response.data.name);
        } else {
          setShopName('Restaurant POS');
        }
      } catch (error) {
        console.error('Error fetching shop name:', error);
      }
    };
    
    if (user) {
      fetchSettings();
      fetchShopName();
    }
  }, [user]);

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: FiHome, roles: ['manager', 'admin'] },
    { name: 'Orders', href: '/orders', icon: FiShoppingCart, roles: ['cashier', 'chef', 'manager', 'admin'] },
    { name: 'Tables', href: '/tables', icon: FiGrid, roles: ['cashier', 'manager', 'admin'], requireTableManagement: true },
    { name: 'Kitchen', href: '/kitchen', icon: FiMonitor, roles: ['chef', 'cashier', 'manager', 'admin'], requireKitchenSystem: true },
    { name: 'Bills', href: '/bills', icon: FiPrinter, roles: ['cashier', 'manager', 'admin'] },
    { name: 'Menu', href: '/menu', icon: FiPackage, roles: ['manager', 'admin'] },
    { name: 'Reports', href: '/reports', icon: FiBarChart2, roles: ['manager', 'admin'] },
    { name: 'Owner Portal', href: '/owner', icon: FiAward, roles: ['owner'] },
    { name: 'Settings', href: '/settings', icon: FiSettings, roles: ['manager', 'admin'] },
  ];

  const filteredNavigation = navigation.filter(item => {
    const hasRolePermission = item.roles.some(role => hasRole(role));
    
    // Hide Tables page if table management is disabled
    if (item.requireTableManagement && !tableManagementEnabled) {
      return false;
    }
    
    // Hide Kitchen page if kitchen system is disabled
    if (item.requireKitchenSystem && !kitchenSystemEnabled) {
      return false;
    }
    
    return hasRolePermission;
  });

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isCurrentPath = (path) => {
    return location.pathname === path;
  };

  // Framer Motion variants for animations
  const sidebarVariants = {
    open: {
      x: 0,
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 30
      }
    },
    closed: {
      x: "-100%",
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 30
      }
    }
  };

  const backdropVariants = {
    open: { opacity: 1 },
    closed: { opacity: 0 }
  };

  return (
    <motion.div 
      key={location.pathname}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
      className={`flex h-screen bg-gradient-to-br ${currentTheme.gradient} overflow-hidden relative`}
      style={{
        ...(currentTheme.hasPhoto ? {
          backgroundImage: currentTheme.backgroundImage,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundAttachment: 'fixed'
        } : {}),
        // CSS variables for theme-aware styling throughout the app
        '--theme-text-color': currentTheme.textColor === 'text-white' ? '#ffffff' : '#111827',
        '--theme-accent-color': currentTheme.accentColor,
        '--theme-card-bg-color': currentTheme.cardBg.includes('white/5') ? 'rgba(255, 255, 255, 0.05)' : currentTheme.cardBg.includes('white/80') ? 'rgba(255, 255, 255, 0.8)' : 'rgba(255, 255, 255, 0.05)',
        '--theme-card-border-color': currentTheme.neonGlow ? currentTheme.accentColor + '40' : 'rgba(229, 231, 235, 0.2)',
        '--theme-card-shadow': currentTheme.neonGlow ? `0 0 20px ${currentTheme.accentColor}40` : '0 1px 3px 0 rgb(0 0 0 / 0.1)',
        '--theme-is-dark': currentTheme.textColor === 'text-white' ? '1' : '0'
      }}
    >
      {/* Gradient overlay for photo backgrounds */}
      {currentTheme.hasPhoto && (
        <div className={`absolute inset-0 bg-gradient-to-br ${currentTheme.gradient} z-0`} />
      )}
      {/* Animated Mobile/Tablet/Desktop Sidebar with Framer Motion */}
      <AnimatePresence>
        {sidebarOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial="closed"
              animate="open"
              exit="closed"
              variants={backdropVariants}
              className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
              onClick={() => setSidebarOpen(false)}
            />
            
            {/* Sidebar with theme-aware glow */}
            <motion.div
              initial="closed"
              animate="open"
              exit="closed"
              variants={sidebarVariants}
              className={`fixed inset-y-0 left-0 z-50 w-72 bg-gradient-to-b from-gray-900 to-gray-800 shadow-2xl ${currentTheme.neonGlow ? 'ring-2 ring-emerald-500/50' : ''}`}
            >
              {/* Close Button */}
              <div className="absolute top-4 right-4">
                <motion.button
                  whileHover={{ scale: 1.1, rotate: 90 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setSidebarOpen(false)}
                  className="flex items-center justify-center h-10 w-10 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-sm transition-colors"
                >
                  <FiX className="h-6 w-6 text-white" />
                </motion.button>
              </div>

              {/* Sidebar Content */}
              <div className="flex-1 flex flex-col h-full overflow-y-auto scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-transparent">
                {/* Shop Name Header */}
                <div className="px-6 py-8 border-b border-gray-700/50">
                  <motion.h1 
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-emerald-400 bg-clip-text text-transparent"
                  >
                    {shopName}
                  </motion.h1>
                  <p className="text-gray-400 text-sm mt-1">Restaurant Management</p>
                </div>

                {/* Navigation */}
                <nav className="flex-1 px-4 py-6 space-y-2">
                  {filteredNavigation.map((item, index) => {
                    const Icon = item.icon;
                    const isActive = isCurrentPath(item.href);
                    return (
                      <motion.button
                        key={item.name}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        whileHover={{ scale: 1.02, x: 4 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => {
                          navigate(item.href);
                          setSidebarOpen(false);
                        }}
                        className={`${
                          isActive
                            ? 'bg-gradient-to-r from-blue-600 to-emerald-600 text-white shadow-lg shadow-blue-500/50'
                            : 'text-gray-300 hover:bg-white/5 hover:text-white'
                        } group flex items-center px-4 py-3 text-base font-semibold rounded-xl w-full text-left transition-all duration-200 relative overflow-hidden`}
                      >
                        {isActive && (
                          <motion.div
                            layoutId="activeTab"
                            className="absolute inset-0 bg-gradient-to-r from-blue-600 to-emerald-600 rounded-xl"
                            transition={{ type: "spring", stiffness: 300, damping: 30 }}
                          />
                        )}
                        <Icon className={`mr-3 h-5 w-5 relative z-10 ${isActive ? 'text-white' : 'text-gray-400 group-hover:text-white'}`} />
                        <span className="relative z-10">{item.name}</span>
                      </motion.button>
                    );
                  })}
                </nav>

                {/* Profile Section */}
                <div className="px-4 pb-6 border-t border-gray-700/50">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {
                      navigate('/profile');
                      setSidebarOpen(false);
                    }}
                    className="flex items-center w-full hover:bg-white/5 p-4 rounded-xl transition-all mt-4"
                  >
                    <div className="flex-shrink-0">
                      {user?.avatar_url ? (
                        <img
                          src={`https://restaurant-pos-system-1-7h0m.onrender.com${user.avatar_url}`}
                          alt="Avatar"
                          className="h-10 w-10 rounded-full object-cover border-2 border-blue-500 ring-2 ring-blue-500/30"
                        />
                      ) : (
                        <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-emerald-500 flex items-center justify-center shadow-lg">
                          <FiUser className="h-5 w-5 text-white" />
                        </div>
                      )}
                    </div>
                    <div className="ml-3 flex-1 text-left">
                      <p className="text-sm font-semibold text-white">{user?.first_name} {user?.last_name}</p>
                      <p className="text-xs text-gray-400">{user?.role.charAt(0).toUpperCase() + user?.role.slice(1)}</p>
                    </div>
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleLogout();
                      }}
                      className="ml-3 text-gray-400 hover:text-red-400 transition-colors p-2 hover:bg-red-500/10 rounded-lg"
                      title="Logout"
                    >
                      <FiLogOut className="h-5 w-5" />
                    </motion.button>
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Desktop sidebar - same toggle on all screens */}
      <div className="hidden">
        <div className="flex flex-col w-64">
          <div className="flex flex-col h-0 flex-1 bg-white border-r border-gray-200">
            <div className="flex-1 flex flex-col pt-5 pb-4 overflow-y-auto">
              <div className="flex items-center flex-shrink-0 px-4">
                <h1 className="text-xl font-bold text-gray-900">{shopName}</h1>
              </div>
              <nav className="mt-5 flex-1 px-2 space-y-1">
                {filteredNavigation.map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.name}
                      onClick={() => navigate(item.href)}
                      className={`${
                        isCurrentPath(item.href)
                          ? 'bg-blue-100 text-blue-900'
                          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                      } group flex items-center px-2 py-2 text-sm font-medium rounded-md w-full text-left`}
                    >
                      <Icon className="mr-3 h-5 w-5" />
                      {item.name}
                    </button>
                  );
                })}
              </nav>
            </div>
            <div className="flex-shrink-0 border-t border-gray-200">
              <button
                onClick={() => navigate('/profile')}
                className="flex items-center w-full hover:bg-gray-50 p-4 transition-colors"
              >
                <div className="flex-shrink-0">
                  {user?.avatar_url ? (
                    <img
                      src={`https://restaurant-pos-system-1-7h0m.onrender.com${user.avatar_url}`}
                      alt="Avatar"
                      className="h-8 w-8 rounded-full object-cover border-2 border-blue-200"
                    />
                  ) : (
                    <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                      <FiUser className="h-5 w-5 text-blue-600" />
                    </div>
                  )}
                </div>
                <div className="ml-3 flex-1 text-left">
                  <p className="text-sm font-medium text-gray-700">{user?.first_name} {user?.last_name}</p>
                  <p className="text-xs text-gray-500">{user?.role.charAt(0).toUpperCase() + user?.role.slice(1)}</p>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleLogout();
                  }}
                  className="ml-3 text-gray-400 hover:text-gray-600"
                  title="Logout"
                >
                  <FiLogOut className="h-5 w-5" />
                </button>
              </button>
              {/* Version Info */}
              <div className="px-4 py-2 bg-gray-50 border-t border-gray-200">
                <p className="text-xs text-center text-gray-500">POS Pro v1.0.0</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 min-w-0 flex flex-col relative z-10">
        {/* Premium Top Bar - Visible on ALL screen sizes with Dynamic Theme */}
        <motion.div 
          layout
          className={`sticky top-0 z-30 bg-gradient-to-r ${currentTheme.navbarBg} border-b border-white/10 backdrop-blur-xl ${currentTheme.neonGlow ? 'shadow-2xl shadow-emerald-500/20' : 'shadow-2xl'}`}
        >
          <div className="flex items-center justify-between px-4 py-3">
            {/* Toggle Button - Works on all screens with theme color */}
            <motion.button
              whileHover={{ scale: 1.05, rotate: 90 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setSidebarOpen(true)}
              className={`h-12 w-12 inline-flex items-center justify-center rounded-xl ${currentTheme.textColor} bg-white/10 hover:bg-white/20 backdrop-blur-md focus:outline-none focus:ring-2 focus:ring-white/50 shadow-lg transition-all duration-200`}
              title="Open Menu"
            >
              <FiMenu className="h-6 w-6" />
            </motion.button>

            {/* Shop Name on Desktop with theme gradient */}
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="hidden md:flex items-center gap-2"
            >
              <span className="text-2xl">{currentTheme.icon}</span>
              <div>
                <h2 className={`text-lg font-bold ${currentTheme.textColor}`}>
                  {shopName}
                </h2>
                <p className="text-xs text-white/60">{currentTheme.name}</p>
              </div>
            </motion.div>

            {/* User Info on Desktop */}
            <div className="hidden md:flex items-center gap-4">
              <div className="text-right">
                <p className="text-sm font-semibold text-white">{user?.first_name} {user?.last_name}</p>
                <p className="text-xs text-gray-400">{user?.role.charAt(0).toUpperCase() + user?.role.slice(1)}</p>
              </div>
              {user?.avatar_url ? (
                <img
                  src={`https://restaurant-pos-system-1-7h0m.onrender.com${user.avatar_url}`}
                  alt="Avatar"
                  className="h-10 w-10 rounded-full object-cover border-2 border-blue-500 ring-2 ring-blue-500/30"
                />
              ) : (
                <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-emerald-500 flex items-center justify-center shadow-lg">
                  <FiUser className="h-5 w-5 text-white" />
                </div>
              )}
            </div>
          </div>
        </motion.div>

        {/* Page content with glassmorphism */}
        <main className="flex-1 overflow-auto p-6">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.4, ease: "easeInOut" }}
            className="h-full"
          >
            <Outlet />
          </motion.div>
        </main>
      </div>
    </motion.div>
  );
};

export default Layout;
