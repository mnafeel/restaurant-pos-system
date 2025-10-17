import React, { useState, useEffect } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
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

        // If user belongs to a shop, fetch shop name
        if (user.shop_id) {
          const response = await axios.get(`/api/shops/${user.shop_id}`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          setShopName(response.data.name);
        } else if (user.company_name) {
          // Owner - use company name
          setShopName(user.company_name);
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

  return (
    <div className="flex h-screen bg-gray-100 overflow-hidden">
      {/* Mobile sidebar */}
      <div className={`fixed inset-0 z-50 lg:hidden ${sidebarOpen ? 'block' : 'hidden'}`}>
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={() => setSidebarOpen(false)} />
        <div className="relative flex-1 flex flex-col max-w-xs w-full bg-white">
          <div className="absolute top-0 right-0 -mr-12 pt-2">
            <button
              type="button"
              className="ml-1 flex items-center justify-center h-10 w-10 rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
              onClick={() => setSidebarOpen(false)}
            >
              <FiX className="h-6 w-6 text-white" />
            </button>
          </div>
          <div className="flex-1 h-0 pt-5 pb-4 overflow-y-auto">
            <div className="flex-shrink-0 flex items-center px-4">
              <h1 className="text-xl font-bold text-gray-900">{shopName}</h1>
            </div>
            <nav className="mt-5 px-2 space-y-1">
              {filteredNavigation.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.name}
                    onClick={() => {
                      navigate(item.href);
                      setSidebarOpen(false);
                    }}
                    className={`${
                      isCurrentPath(item.href)
                        ? 'bg-blue-100 text-blue-900'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    } group flex items-center px-2 py-2 text-base font-medium rounded-md w-full text-left`}
                  >
                    <Icon className="mr-4 h-6 w-6" />
                    {item.name}
                  </button>
                );
              })}
            </nav>
          </div>
        </div>
      </div>

      {/* Desktop sidebar */}
      <div className="hidden lg:flex lg:flex-shrink-0">
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
      <div className="flex-1 min-w-0 flex flex-col">
        {/* Top bar */}
        <div className="sticky top-0 z-10 lg:hidden pl-1 pt-1 sm:pl-3 sm:pt-3 bg-gray-100">
          <button
            type="button"
            className="-ml-0.5 -mt-0.5 h-12 w-12 inline-flex items-center justify-center rounded-md text-gray-500 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
            onClick={() => setSidebarOpen(true)}
          >
            <FiMenu className="h-6 w-6" />
          </button>
        </div>

        {/* Page content */}
        <main className="flex-1 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;
