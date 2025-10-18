import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import toast from 'react-hot-toast';
import { 
  FiShoppingBag, 
  FiUsers, 
  FiEdit2, 
  FiTrash2, 
  FiPlus,
  FiUser,
  FiMail,
  FiPhone,
  FiMapPin,
  FiX,
  FiPower,
  FiLock,
  FiUnlock,
  FiUserPlus,
  FiEye,
  FiEyeOff,
  FiDollarSign,
  FiTrendingUp,
  FiShoppingCart,
  FiSettings,
  FiDatabase,
  FiActivity,
  FiBarChart2,
  FiPieChart,
  FiPackage
} from 'react-icons/fi';

const OwnerPortal = () => {
  const { user, updateUser } = useAuth();
  const [shops, setShops] = useState([]);
  const [staff, setStaff] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [systemStats, setSystemStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview'); // overview, shops, users, analytics, system
  
  const [showAddShop, setShowAddShop] = useState(false);
  const [showEditShop, setShowEditShop] = useState(false);
  const [editShopData, setEditShopData] = useState(null);
  const [editShopLogo, setEditShopLogo] = useState(null);
  const [editShopLogoPreview, setEditShopLogoPreview] = useState(null);
  const [showShopMenu, setShowShopMenu] = useState(false);
  const [selectedShopMenu, setSelectedShopMenu] = useState(null);
  const [shopMenuItems, setShopMenuItems] = useState([]);
  const [showClearMenuConfirm, setShowClearMenuConfirm] = useState(false);
  const [clearMenuPassword, setClearMenuPassword] = useState('');
  const [showAddStaff, setShowAddStaff] = useState(false);
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteShopId, setDeleteShopId] = useState(null);
  const [ownerPassword, setOwnerPassword] = useState('');
  const [currentShop, setCurrentShop] = useState(null);
  const [selectedShopForStaff, setSelectedShopForStaff] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [companyName, setCompanyName] = useState(user?.company_name || '');
  const [ownerUsername, setOwnerUsername] = useState(user?.username || '');
  const [companyLogo, setCompanyLogo] = useState(null);
  const [previewLogo, setPreviewLogo] = useState(user?.avatar_url || null);
  
  const [newShop, setNewShop] = useState({
    name: '',
    address: '',
    city: '',
    phone: '',
    email: '',
    admin_username: '',
    admin_password: '',
    admin_first_name: '',
    admin_last_name: '',
    logo: null,
    currency: 'INR'
  });
  const [shopLogoPreview, setShopLogoPreview] = useState(null);

  const [newStaff, setNewStaff] = useState({
    shop_id: null,
    username: '',
    email: '',
    password: '',
    first_name: '',
    last_name: '',
    phone: '',
    role: 'cashier'
  });

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    try {
      await Promise.all([
        fetchShops(),
        fetchAllUsers(),
        fetchSystemStats()
      ]);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching data:', error);
      setLoading(false);
    }
  };

  const fetchShops = async () => {
    try {
      const response = await axios.get('/api/shops');
      setShops(response.data);
    } catch (error) {
      console.error('Error fetching shops:', error);
      toast.error('Failed to load shops');
    }
  };

  const fetchAllUsers = async () => {
    try {
      const response = await axios.get('/api/users');
      // Filter out owner from all users list
      const nonOwnerUsers = response.data.filter(u => u.role !== 'owner');
      setAllUsers(nonOwnerUsers);
      setStaff(nonOwnerUsers);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const fetchSystemStats = async () => {
    try {
      // Note: Owner should NOT see aggregated order/bill/revenue data
      // Each shop's data should remain isolated
      // Owner can view individual shop performance by logging into each shop's admin
      setSystemStats({
        totalMenuItems: 0, // Not displayed
        totalTables: 0,    // Not displayed
        totalOrders: 0,    // Not displayed
        totalBills: 0,     // Not displayed
        totalRevenue: 0,   // Not displayed
        activeOrders: 0    // Not displayed
      });
    } catch (error) {
      console.error('Error fetching system stats:', error);
    }
  };

  const handleAddShop = async (e) => {
    e.preventDefault();
    
    // Prevent multiple submissions
    if (isSubmitting) {
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const shopRes = await axios.post('/api/shops', {
        name: newShop.name,
        address: newShop.address,
        city: newShop.city,
        phone: newShop.phone,
        email: newShop.email,
        currency: newShop.currency || 'INR',
        is_active: true
      });

      const shopId = shopRes.data.id;

      // Upload shop logo if selected
      if (newShop.logo) {
        const formData = new FormData();
        formData.append('logo', newShop.logo);
        await axios.post(`/api/shops/${shopId}/logo`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      }

      await axios.post('/api/users', {
        username: newShop.admin_username,
        email: newShop.email,
        password: newShop.admin_password,
        role: 'admin',
        first_name: newShop.admin_first_name,
        last_name: newShop.admin_last_name,
        shop_id: shopId
      });

      await axios.put(`/api/shops/${shopId}`, {
        admin_username: newShop.admin_username
      });

      toast.success('Shop and admin account created successfully');
      setShowAddShop(false);
      setNewShop({
        name: '',
        address: '',
        city: '',
        phone: '',
        email: '',
        admin_username: '',
        admin_password: '',
        admin_first_name: '',
        admin_last_name: '',
        logo: null,
        currency: 'INR'
      });
      setShopLogoPreview(null);
      
      // Trigger currency change event
      window.dispatchEvent(new Event('currencyChanged'));
      
      fetchAllData();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to create shop');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleShopLogoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Logo size must be less than 5MB');
        return;
      }
      
      setNewShop({ ...newShop, logo: file });
      
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setShopLogoPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleEditShop = async (e) => {
    e.preventDefault();
    try {
      // Update shop details
      await axios.put(`/api/shops/${editShopData.id}`, {
        name: editShopData.name,
        address: editShopData.address,
        city: editShopData.city,
        phone: editShopData.phone,
        email: editShopData.email,
        currency: editShopData.currency || 'INR'
      });

      // Upload new logo if selected
      if (editShopLogo) {
        const formData = new FormData();
        formData.append('logo', editShopLogo);
        await axios.post(`/api/shops/${editShopData.id}/logo`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      }

      toast.success('Shop updated successfully');
      setShowEditShop(false);
      setEditShopData(null);
      setEditShopLogo(null);
      setEditShopLogoPreview(null);
      
      // Trigger currency change event if currency was updated
      window.dispatchEvent(new Event('currencyChanged'));
      
      fetchAllData();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to update shop');
    }
  };

  const handleEditShopLogoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Logo size must be less than 5MB');
        return;
      }
      
      setEditShopLogo(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setEditShopLogoPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleToggleShop = async (shopId, currentStatus) => {
    try {
      await axios.put(`/api/shops/${shopId}`, {
        is_active: !currentStatus
      });
      toast.success(currentStatus ? 'Shop closed' : 'Shop opened');
      fetchShops();
    } catch (error) {
      toast.error('Failed to toggle shop status');
    }
  };

  const handleDeleteShop = (shopId, shopName) => {
    setDeleteShopId({ id: shopId, name: shopName });
    setShowDeleteConfirm(true);
  };

  const confirmDeleteShop = async () => {
    if (!ownerPassword) {
      toast.error('Please enter your owner password');
      return;
    }

    try {
      await axios.post('/api/auth/verify-password', { password: ownerPassword });
      await axios.delete(`/api/shops/${deleteShopId.id}`);
      
      toast.success('Shop deleted successfully');
      setShowDeleteConfirm(false);
      setDeleteShopId(null);
      setOwnerPassword('');
      fetchAllData();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Incorrect password or failed to delete shop');
    }
  };

  const handleAddStaff = async (e) => {
    e.preventDefault();
    try {
      await axios.post('/api/users', newStaff);
      toast.success('Staff member added successfully');
      setShowAddStaff(false);
      setSelectedShopForStaff(null);
      setNewStaff({
        shop_id: null,
        username: '',
        email: '',
        password: '',
        first_name: '',
        last_name: '',
        phone: '',
        role: 'cashier'
      });
      fetchAllUsers();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to add staff');
    }
  };

  const handleDeleteUser = async (userId, userName, userRole, userShopId) => {
    // Check if user is an admin with a shop
    const isShopAdmin = userRole === 'admin' && userShopId;
    const shop = isShopAdmin ? shops.find(s => s.id === userShopId) : null;
    
    let confirmMessage = `Delete user "${userName}"?`;
    if (isShopAdmin && shop) {
      confirmMessage = `⚠️ WARNING: "${userName}" is the admin for "${shop.name}" shop!\n\nDeleting this admin will also DELETE:\n• The entire "${shop.name}" shop\n• All shop staff\n• All menu items\n• All tables\n• All shop data\n\nThis action CANNOT be undone!\n\nAre you sure?`;
    } else {
      confirmMessage = `Delete user "${userName}"? This action cannot be undone.`;
    }

    if (!window.confirm(confirmMessage)) {
      return;
    }

    try {
      await axios.delete(`/api/users/${userId}`);
      
      if (isShopAdmin && shop) {
        toast.success(`User and shop "${shop.name}" deleted successfully`);
      } else {
        toast.success('User deleted successfully');
      }
      
      fetchAllData(); // Refresh both users and shops
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to delete user');
    }
  };

  const handleUpdateCompanyName = async () => {
    try {
      // Validate username
      if (ownerUsername && ownerUsername.trim() === '') {
        toast.error('Username cannot be empty');
        return;
      }
      
      // Update company name and username
      const updateData = {};
      if (companyName !== user?.company_name) {
        updateData.company_name = companyName;
      }
      if (ownerUsername && ownerUsername !== user?.username) {
        updateData.username = ownerUsername.toLowerCase().trim();
      }
      
      if (Object.keys(updateData).length > 0) {
        await axios.put('/api/profile', updateData);
      }
      
      // Upload logo if selected
      if (companyLogo) {
        const formData = new FormData();
        formData.append('avatar', companyLogo);
        
        await axios.post('/api/profile/avatar', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      }
      
      toast.success('Profile updated successfully');
      setShowEditProfile(false);
      setCompanyLogo(null);
      
      // Refresh user data
      if (updateUser) {
        const response = await axios.get('/api/profile');
        updateUser(response.data);
        setPreviewLogo(response.data.avatar_url);
        setOwnerUsername(response.data.username);
      }
    } catch (error) {
      const errorMsg = error.response?.data?.error || 'Failed to update profile';
      toast.error(errorMsg);
    }
  };

  const handleLogoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Logo size must be less than 5MB');
        return;
      }
      
      setCompanyLogo(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewLogo(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleResetPassword = async (userId, username) => {
    const newPassword = prompt(`Enter new password for ${username}:`);
    if (!newPassword || newPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    try {
      await axios.put(`/api/users/${userId}/password`, { new_password: newPassword });
      toast.success('Password updated successfully');
    } catch (error) {
      toast.error('Failed to update password');
    }
  };

  const handleViewShopMenu = async (shop) => {
    try {
      const response = await axios.get(`/api/shops/${shop.id}/menu`);
      setShopMenuItems(response.data);
      setSelectedShopMenu(shop);
      setShowShopMenu(true);
    } catch (error) {
      toast.error('Failed to load shop menu');
    }
  };

  const handleDeleteMenuItem = async (itemId, itemName) => {
    if (!window.confirm(`Delete menu item "${itemName}"? This cannot be undone.`)) {
      return;
    }

    try {
      await axios.delete(`/api/menu/${itemId}`);
      toast.success('Menu item deleted');
      // Refresh shop menu
      handleViewShopMenu(selectedShopMenu);
    } catch (error) {
      toast.error('Failed to delete menu item');
    }
  };

  const handleClearShopMenu = () => {
    setShowClearMenuConfirm(true);
  };

  const confirmClearShopMenu = async () => {
    if (!clearMenuPassword) {
      toast.error('Please enter your owner password');
      return;
    }

    try {
      // Use axios.request for DELETE with body
      await axios.request({
        method: 'DELETE',
        url: `/api/shops/${selectedShopMenu.id}/menu`,
        data: { password: clearMenuPassword }
      });
      
      toast.success('Shop menu cleared successfully');
      setShowClearMenuConfirm(false);
      setClearMenuPassword('');
      setShowShopMenu(false);
      setSelectedShopMenu(null);
      setShopMenuItems([]);
    } catch (error) {
      console.error('Clear menu error:', error);
      toast.error(error.response?.data?.error || 'Failed to clear menu');
    }
  };

  const getShopStaff = (shopId) => {
    return staff.filter(s => s.shop_id === shopId);
  };

  const getShopName = (shopId) => {
    const shop = shops.find(s => s.id === shopId);
    return shop ? shop.name : 'No Shop';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-br from-purple-50 to-blue-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-4 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Loading Owner Portal...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50 p-4 md:p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="bg-gradient-to-r from-purple-600 via-purple-700 to-indigo-700 rounded-2xl shadow-2xl p-8 text-white">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="flex items-center gap-6">
              <div className="relative">
                {user?.avatar_url ? (
                  <img
                    src={`https://restaurant-pos-system-1-7h0m.onrender.com${user.avatar_url}`}
                    alt="Company Logo"
                    className="w-20 h-20 rounded-2xl object-cover border-4 border-white/30 shadow-xl"
                    onError={(e) => {
                      e.target.style.display = 'none';
                      e.target.parentElement.innerHTML = '<div class="bg-white/20 backdrop-blur-sm p-5 rounded-2xl"><svg class="h-16 w-16" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg></div>';
                    }}
                  />
                ) : (
                  <div className="bg-white/20 backdrop-blur-sm p-5 rounded-2xl">
                    <FiPower className="h-16 w-16" />
                  </div>
                )}
              </div>
              <div>
                <h1 className="text-5xl font-bold mb-2">
                  {user?.company_name ? `${user.company_name} - Owner Dashboard` : '👑 Owner Dashboard'}
                </h1>
                <p className="text-purple-100 text-lg">Centralized Control & Management (Not a Shop)</p>
                <div className="mt-3 flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <FiUser className="h-4 w-4" />
                    <span className="font-semibold">{user?.first_name} {user?.last_name}</span>
                  </div>
                  {!user?.company_name && (
                    <div className="bg-orange-500/80 px-3 py-1 rounded-full text-sm animate-pulse">
                      <span>⚠️ Set company name in profile</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
            <button
              onClick={() => setShowEditProfile(true)}
              className="bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white px-6 py-3 rounded-xl transition flex items-center gap-2 font-semibold"
            >
              <FiEdit2 className="h-5 w-5" />
              Edit Profile
            </button>
          </div>
        </div>
      </div>

      {/* Global Statistics Dashboard - Shop Management Only */}
      <div className="mb-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-xl p-6 text-white transform hover:scale-105 transition-all">
          <div className="flex items-center justify-between mb-3">
            <FiShoppingBag className="h-10 w-10" />
            <span className="text-4xl font-bold">{shops.length}</span>
          </div>
          <p className="text-blue-100 font-semibold text-lg">Total Shops</p>
          <p className="text-blue-200 text-sm mt-1">All restaurant locations</p>
        </div>

        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-xl p-6 text-white transform hover:scale-105 transition-all">
          <div className="flex items-center justify-between mb-3">
            <FiUnlock className="h-10 w-10" />
            <span className="text-4xl font-bold">{shops.filter(s => s.is_active).length}</span>
          </div>
          <p className="text-green-100 font-semibold text-lg">Active Shops</p>
          <p className="text-green-200 text-sm mt-1">Currently operational</p>
        </div>

        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-xl p-6 text-white transform hover:scale-105 transition-all">
          <div className="flex items-center justify-between mb-3">
            <FiUsers className="h-10 w-10" />
            <span className="text-4xl font-bold">{allUsers.length}</span>
          </div>
          <p className="text-purple-100 font-semibold text-lg">Total Users</p>
          <p className="text-purple-200 text-sm mt-1">All system accounts</p>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="mb-6 bg-white rounded-xl shadow-lg p-2 flex flex-wrap gap-2">
        <button
          onClick={() => setActiveTab('overview')}
          className={`flex items-center gap-2 px-6 py-3 rounded-lg font-semibold transition-all ${
            activeTab === 'overview'
              ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          <FiActivity className="h-5 w-5" />
          Overview
        </button>

        <button
          onClick={() => setActiveTab('shops')}
          className={`flex items-center gap-2 px-6 py-3 rounded-lg font-semibold transition-all ${
            activeTab === 'shops'
              ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          <FiShoppingBag className="h-5 w-5" />
          Shops ({shops.length})
        </button>

        <button
          onClick={() => setActiveTab('users')}
          className={`flex items-center gap-2 px-6 py-3 rounded-lg font-semibold transition-all ${
            activeTab === 'users'
              ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          <FiUsers className="h-5 w-5" />
          All Users ({allUsers.length})
        </button>

        <button
          onClick={() => setActiveTab('analytics')}
          className={`flex items-center gap-2 px-6 py-3 rounded-lg font-semibold transition-all ${
            activeTab === 'analytics'
              ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          <FiBarChart2 className="h-5 w-5" />
          Analytics
        </button>

        <button
          onClick={() => setActiveTab('system')}
          className={`flex items-center gap-2 px-6 py-3 rounded-lg font-semibold transition-all ${
            activeTab === 'system'
              ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          <FiDatabase className="h-5 w-5" />
          System
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Quick Actions */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-2xl font-bold mb-4 text-gray-900">Quick Actions</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <button
                onClick={() => setShowAddShop(true)}
                className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-4 rounded-xl hover:from-blue-700 hover:to-blue-800 shadow-lg transition-all transform hover:scale-105 flex items-center gap-3 justify-center font-semibold"
              >
                <FiPlus className="h-6 w-6" />
                Add New Shop
              </button>

              <button
                onClick={() => setShowAddStaff(true)}
                className="bg-gradient-to-r from-green-600 to-green-700 text-white px-6 py-4 rounded-xl hover:from-green-700 hover:to-green-800 shadow-lg transition-all transform hover:scale-105 flex items-center gap-3 justify-center font-semibold"
              >
                <FiUserPlus className="h-6 w-6" />
                Add Staff
              </button>

              <button
                onClick={() => setActiveTab('shops')}
                className="bg-gradient-to-r from-purple-600 to-purple-700 text-white px-6 py-4 rounded-xl hover:from-purple-700 hover:to-purple-800 shadow-lg transition-all transform hover:scale-105 flex items-center gap-3 justify-center font-semibold"
              >
                <FiShoppingBag className="h-6 w-6" />
                Manage Shops
              </button>

              <button
                onClick={() => setActiveTab('users')}
                className="bg-gradient-to-r from-orange-600 to-orange-700 text-white px-6 py-4 rounded-xl hover:from-orange-700 hover:to-orange-800 shadow-lg transition-all transform hover:scale-105 flex items-center gap-3 justify-center font-semibold"
              >
                <FiUsers className="h-6 w-6" />
                View All Users
              </button>
            </div>
          </div>

          {/* Recent Activity Summary */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-xl font-bold mb-4 text-gray-900 flex items-center gap-2">
                <FiShoppingBag className="text-blue-600" />
                Shop Status Overview
              </h3>
              <div className="space-y-3">
                {shops.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">No shops created yet. Click "Add New Shop" to get started!</p>
                ) : (
                  shops.map(shop => (
                    <div key={shop.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition">
                      <div>
                        <p className="font-semibold text-gray-900">{shop.name}</p>
                        <p className="text-sm text-gray-600">{shop.city || 'N/A'}</p>
                      </div>
                      <span className={`px-4 py-2 rounded-full text-sm font-semibold ${
                        shop.is_active
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {shop.is_active ? 'Active' : 'Closed'}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-xl font-bold mb-4 text-gray-900 flex items-center gap-2">
                <FiUsers className="text-purple-600" />
                User Distribution
              </h3>
              <div className="space-y-3">
                {['admin', 'manager', 'cashier', 'chef'].map(role => {
                  const count = allUsers.filter(u => u.role === role).length;
                  return (
                    <div key={role} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          role === 'admin' ? 'bg-blue-100 text-blue-600' :
                          role === 'manager' ? 'bg-purple-100 text-purple-600' :
                          role === 'cashier' ? 'bg-green-100 text-green-600' :
                          'bg-orange-100 text-orange-600'
                        }`}>
                          <FiUser />
                        </div>
                        <span className="font-semibold text-gray-900 capitalize">{role}s</span>
                      </div>
                      <span className="text-2xl font-bold text-gray-700">{count}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'shops' && (
        <div>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">All Shops</h2>
            <button
              onClick={() => setShowAddShop(true)}
              className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-3 rounded-xl hover:from-blue-700 hover:to-blue-800 shadow-lg transition-all transform hover:scale-105"
            >
              <FiPlus className="h-5 w-5" />
              Add New Shop
            </button>
          </div>

          {shops.length === 0 ? (
            <div className="bg-white rounded-xl shadow-lg p-12 text-center">
              <FiShoppingBag className="h-24 w-24 text-gray-300 mx-auto mb-4" />
              <h3 className="text-2xl font-bold text-gray-900 mb-2">No Shops Yet</h3>
              <p className="text-gray-600 mb-6">Create your first shop to start managing your restaurant empire!</p>
              <button
                onClick={() => setShowAddShop(true)}
                className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-8 py-3 rounded-xl hover:from-blue-700 hover:to-blue-800 shadow-lg transition-all inline-flex items-center gap-2 font-semibold"
              >
                <FiPlus />
                Create First Shop
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {shops.map(shop => (
                <div key={shop.id} className="bg-white rounded-xl shadow-lg p-6 hover:shadow-2xl transition-all">
                  <div className="flex items-start gap-4 mb-4">
                    {/* Shop Logo */}
                    <div className="flex-shrink-0">
                      {shop.logo_url ? (
                        <img
                          src={`https://restaurant-pos-system-1-7h0m.onrender.com${shop.logo_url}`}
                          alt={shop.name}
                          className="w-16 h-16 rounded-xl object-cover border-2 border-gray-200"
                        />
                      ) : (
                        <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center border-2 border-blue-200">
                          <FiShoppingBag className="h-8 w-8 text-blue-600" />
                        </div>
                      )}
                    </div>
                    
                    {/* Shop Info */}
                    <div className="flex-1">
                      <h3 className="text-2xl font-bold text-gray-900 mb-1">{shop.name}</h3>
                      {user?.company_name && (
                        <p className="text-xs text-gray-500 mb-2">🏢 {user.company_name}</p>
                      )}
                      <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                        shop.is_active
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {shop.is_active ? '● Active' : '● Closed'}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-2 mb-4 text-sm text-gray-600">
                    <div className="flex items-start gap-2">
                      <FiMapPin className="h-4 w-4 mt-1 flex-shrink-0" />
                      <span>{shop.address || 'No address'}, {shop.city || 'N/A'}</span>
                    </div>
                    {shop.phone && (
                      <div className="flex items-center gap-2">
                        <FiPhone className="h-4 w-4" />
                        <span>{shop.phone}</span>
                      </div>
                    )}
                    {shop.email && (
                      <div className="flex items-center gap-2">
                        <FiMail className="h-4 w-4" />
                        <span>{shop.email}</span>
                      </div>
                    )}
                    {shop.admin_username && (
                      <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-200">
                        <FiUser className="h-4 w-4" />
                        <span className="font-semibold">Admin: {shop.admin_username}</span>
                      </div>
                    )}
                  </div>

                  <div className="mb-4">
                    <p className="text-sm font-semibold text-gray-700 mb-2">Staff ({getShopStaff(shop.id).length})</p>
                    {getShopStaff(shop.id).length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {getShopStaff(shop.id).slice(0, 3).map(s => (
                          <span key={s.id} className="px-2 py-1 bg-gray-100 rounded text-xs">
                            {s.first_name} ({s.role})
                          </span>
                        ))}
                        {getShopStaff(shop.id).length > 3 && (
                          <span className="px-2 py-1 bg-gray-200 rounded text-xs font-semibold">
                            +{getShopStaff(shop.id).length - 3} more
                          </span>
                        )}
                      </div>
                    ) : (
                      <p className="text-xs text-gray-500">No staff assigned</p>
                    )}
                  </div>

                  <div className="grid grid-cols-3 gap-2 mb-2">
                    <button
                      onClick={() => {
                        setEditShopData(shop);
                        setEditShopLogoPreview(shop.logo_url);
                        setShowEditShop(true);
                      }}
                      className="flex items-center justify-center gap-2 bg-blue-100 text-blue-700 px-4 py-2 rounded-lg hover:bg-blue-200 transition font-semibold"
                    >
                      <FiEdit2 className="h-4 w-4" />
                      Edit
                    </button>

                    <button
                      onClick={() => handleViewShopMenu(shop)}
                      className="flex items-center justify-center gap-2 bg-orange-100 text-orange-700 px-4 py-2 rounded-lg hover:bg-orange-200 transition font-semibold"
                    >
                      <FiPackage className="h-4 w-4" />
                      Menu
                    </button>

                    <button
                      onClick={() => handleToggleShop(shop.id, shop.is_active)}
                      className={`flex items-center justify-center gap-2 px-4 py-2 rounded-lg transition font-semibold ${
                        shop.is_active
                          ? 'bg-red-100 text-red-700 hover:bg-red-200'
                          : 'bg-green-100 text-green-700 hover:bg-green-200'
                      }`}
                    >
                      {shop.is_active ? <FiLock className="h-4 w-4" /> : <FiUnlock className="h-4 w-4" />}
                      {shop.is_active ? 'Close' : 'Open'}
                    </button>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <button
                      onClick={() => {
                        setSelectedShopForStaff(shop.id);
                        setNewStaff({ ...newStaff, shop_id: shop.id });
                        setShowAddStaff(true);
                      }}
                      className="flex items-center justify-center gap-2 bg-green-100 text-green-700 px-4 py-2 rounded-lg hover:bg-green-200 transition font-semibold"
                    >
                      <FiUserPlus className="h-4 w-4" />
                      Staff
                    </button>

                    {shop.admin_username && (
                      <button
                        onClick={() => handleResetPassword(
                          allUsers.find(u => u.username === shop.admin_username)?.id,
                          shop.admin_username
                        )}
                        className="flex items-center justify-center gap-2 bg-purple-100 text-purple-700 px-4 py-2 rounded-lg hover:bg-purple-200 transition font-semibold"
                        title="Reset Admin Password"
                      >
                        <FiLock className="h-4 w-4" />
                        Reset
                      </button>
                    )}

                    <button
                      onClick={() => handleDeleteShop(shop.id, shop.name)}
                      className="flex items-center justify-center gap-2 bg-red-100 text-red-700 px-4 py-2 rounded-lg hover:bg-red-200 transition font-semibold"
                    >
                      <FiTrash2 className="h-4 w-4" />
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'users' && (
        <div>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">All Users ({allUsers.length})</h2>
            <button
              onClick={() => setShowAddStaff(true)}
              className="flex items-center gap-2 bg-gradient-to-r from-green-600 to-green-700 text-white px-6 py-3 rounded-xl hover:from-green-700 hover:to-green-800 shadow-lg transition-all transform hover:scale-105"
            >
              <FiUserPlus className="h-5 w-5" />
              Add User
            </button>
          </div>

          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">User</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Role</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Shop</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Contact</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {allUsers.map(u => (
                    <tr key={u.id} className="hover:bg-gray-50 transition">
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-semibold text-gray-900">{u.first_name} {u.last_name}</p>
                          <p className="text-sm text-gray-500">@{u.username}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          u.role === 'owner' ? 'bg-purple-100 text-purple-800' :
                          u.role === 'admin' ? 'bg-blue-100 text-blue-800' :
                          u.role === 'manager' ? 'bg-indigo-100 text-indigo-800' :
                          u.role === 'cashier' ? 'bg-green-100 text-green-800' :
                          'bg-orange-100 text-orange-800'
                        }`}>
                          {u.role}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700">
                        {u.shop_id ? getShopName(u.shop_id) : '-'}
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm">
                          <p className="text-gray-700">{u.email}</p>
                          {u.phone && <p className="text-gray-500">{u.phone}</p>}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          u.is_active
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {u.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        {u.role !== 'owner' && (
                          <div className="flex items-center justify-end gap-2">
                            {u.role === 'admin' && u.shop_id && (
                              <button
                                onClick={() => {
                                  const shop = shops.find(s => s.id === u.shop_id);
                                  if (shop) handleViewShopMenu(shop);
                                }}
                                className="p-2 text-orange-600 hover:bg-orange-50 rounded-lg transition"
                                title="View Shop Menu"
                              >
                                <FiPackage className="h-5 w-5" />
                              </button>
                            )}
                            <button
                              onClick={() => handleResetPassword(u.id, u.username)}
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                              title="Reset Password"
                            >
                              <FiLock className="h-5 w-5" />
                            </button>
                            <button
                              onClick={() => handleDeleteUser(u.id, `${u.first_name} ${u.last_name}`, u.role, u.shop_id)}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                              title="Delete User"
                            >
                              <FiTrash2 className="h-5 w-5" />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'analytics' && (
        <div className="space-y-6">
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl shadow-2xl p-8 text-white">
            <h3 className="text-2xl font-bold mb-4 flex items-center gap-2">
              <FiBarChart2 className="h-8 w-8" />
              Shop Performance Analytics
            </h3>
            <p className="mb-6 text-blue-100 text-lg">
              📊 Each shop's data is isolated and private. To view detailed analytics, reports, and revenue for a specific shop, login using that shop's admin account.
            </p>
            
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 mb-6">
              <h4 className="text-xl font-bold mb-4">🔐 Why Data is Private:</h4>
              <div className="space-y-3 text-blue-100">
                <p>• <strong>Data Isolation:</strong> Each shop's orders, bills, and revenue remain completely separate</p>
                <p>• <strong>Privacy Protection:</strong> Shop admins cannot see other shops' financial data</p>
                <p>• <strong>Independent Operations:</strong> Each location operates as its own business unit</p>
                <p>• <strong>Owner Oversight:</strong> You manage shops, users, and permissions - not individual transactions</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white/20 backdrop-blur-sm rounded-lg p-4">
                <p className="text-sm text-blue-100 mb-1">Sales Reports</p>
                <p className="text-xl font-bold">Per Shop Only</p>
                <p className="text-xs text-blue-200 mt-1">Login as shop admin</p>
              </div>
              <div className="bg-white/20 backdrop-blur-sm rounded-lg p-4">
                <p className="text-sm text-blue-100 mb-1">Order Analytics</p>
                <p className="text-xl font-bold">Shop-Specific</p>
                <p className="text-xs text-blue-200 mt-1">Accessible by shop admin</p>
              </div>
              <div className="bg-white/20 backdrop-blur-sm rounded-lg p-4">
                <p className="text-sm text-blue-100 mb-1">Revenue Data</p>
                <p className="text-xl font-bold">Private & Isolated</p>
                <p className="text-xs text-blue-200 mt-1">Shop admins only</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
              <FiPieChart className="text-purple-600" />
              How to View Shop Analytics
            </h3>
            <div className="space-y-4">
              <div className="flex items-start gap-4 p-4 bg-blue-50 rounded-lg">
                <div className="bg-blue-600 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold flex-shrink-0">1</div>
                <div>
                  <p className="font-semibold text-gray-900">Logout from Owner Account</p>
                  <p className="text-sm text-gray-600">Exit the Owner Portal</p>
                </div>
              </div>
              
              <div className="flex items-start gap-4 p-4 bg-green-50 rounded-lg">
                <div className="bg-green-600 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold flex-shrink-0">2</div>
                <div>
                  <p className="font-semibold text-gray-900">Login as Shop Admin</p>
                  <p className="text-sm text-gray-600">Use the shop's admin username and password</p>
                </div>
              </div>
              
              <div className="flex items-start gap-4 p-4 bg-purple-50 rounded-lg">
                <div className="bg-purple-600 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold flex-shrink-0">3</div>
                <div>
                  <p className="font-semibold text-gray-900">Access Shop Dashboard & Reports</p>
                  <p className="text-sm text-gray-600">View orders, sales, revenue, top items, and all analytics for that shop</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-r from-orange-500 to-red-500 rounded-xl shadow-xl p-6 text-white">
            <h4 className="text-lg font-bold mb-2 flex items-center gap-2">
              <FiSettings />
              Your Role as Owner
            </h4>
            <p className="text-orange-100">
              As the owner, your focus is on <strong>system management</strong>: creating shops, managing users, controlling access, and overseeing operations. 
              Financial data and analytics remain private within each shop to maintain data security and operational independence.
            </p>
          </div>
        </div>
      )}

      {activeTab === 'system' && (
        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
              <FiDatabase className="text-purple-600" />
              System Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">Database Status</p>
                <p className="text-lg font-semibold text-green-600">✓ Connected</p>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">System Version</p>
                <p className="text-lg font-semibold text-gray-900">v1.0.0</p>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">Total Shops</p>
                <p className="text-lg font-semibold text-gray-900">{shops.length}</p>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">Total Users</p>
                <p className="text-lg font-semibold text-gray-900">{allUsers.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-r from-orange-500 to-red-500 rounded-xl shadow-xl p-6 text-white">
            <h3 className="text-xl font-bold mb-2 flex items-center gap-2">
              <FiPower />
              Owner Privileges
            </h3>
            <p className="text-orange-100 mb-4">You have complete control over the entire system.</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              <div className="bg-white/20 backdrop-blur-sm rounded-lg p-3">
                <p className="font-semibold">✓ Create/Delete Shops</p>
              </div>
              <div className="bg-white/20 backdrop-blur-sm rounded-lg p-3">
                <p className="font-semibold">✓ Manage All Users</p>
              </div>
              <div className="bg-white/20 backdrop-blur-sm rounded-lg p-3">
                <p className="font-semibold">✓ Reset Passwords</p>
              </div>
              <div className="bg-white/20 backdrop-blur-sm rounded-lg p-3">
                <p className="font-semibold">✓ View All Data</p>
              </div>
              <div className="bg-white/20 backdrop-blur-sm rounded-lg p-3">
                <p className="font-semibold">✓ System Configuration</p>
              </div>
              <div className="bg-white/20 backdrop-blur-sm rounded-lg p-3">
                <p className="font-semibold">✓ Full Analytics Access</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Shop Modal */}
      {showAddShop && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6 rounded-t-2xl flex items-center justify-between">
              <h2 className="text-2xl font-bold">Add New Shop</h2>
              <button onClick={() => setShowAddShop(false)} className="p-2 hover:bg-white/20 rounded-lg transition">
                <FiX className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={handleAddShop} className="p-6 space-y-4">
              {/* Shop Logo Upload */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Shop Logo (Optional)</label>
                <div className="flex items-center gap-4">
                  <div className="relative">
                    {shopLogoPreview ? (
                      <img
                        src={shopLogoPreview}
                        alt="Shop Logo Preview"
                        className="w-20 h-20 rounded-xl object-cover border-2 border-blue-200"
                      />
                    ) : (
                      <div className="w-20 h-20 rounded-xl bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center border-2 border-blue-200">
                        <FiShoppingBag className="h-10 w-10 text-blue-600" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleShopLogoChange}
                      className="hidden"
                      id="shop-logo-upload"
                    />
                    <label
                      htmlFor="shop-logo-upload"
                      className="cursor-pointer inline-flex items-center gap-2 bg-blue-100 text-blue-700 px-4 py-2 rounded-lg hover:bg-blue-200 transition font-semibold"
                    >
                      <FiShoppingBag className="h-5 w-5" />
                      Choose Shop Logo
                    </label>
                    <p className="text-xs text-gray-500 mt-2">Max 5MB (PNG, JPG, GIF)</p>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Shop Name *</label>
                <input
                  type="text"
                  required
                  value={newShop.name}
                  onChange={(e) => setNewShop({ ...newShop, name: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Downtown Branch"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Address *</label>
                  <input
                    type="text"
                    required
                    value={newShop.address}
                    onChange={(e) => setNewShop({ ...newShop, address: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="123 Main St"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">City *</label>
                  <input
                    type="text"
                    required
                    value={newShop.city}
                    onChange={(e) => setNewShop({ ...newShop, city: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="New York"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Default Currency *</label>
                <select
                  required
                  value={newShop.currency}
                  onChange={(e) => setNewShop({ ...newShop, currency: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="INR">₹ INR - Indian Rupee</option>
                  <option value="USD">$ USD - US Dollar</option>
                  <option value="EUR">€ EUR - Euro</option>
                  <option value="GBP">£ GBP - British Pound</option>
                  <option value="AUD">A$ AUD - Australian Dollar</option>
                  <option value="CAD">C$ CAD - Canadian Dollar</option>
                  <option value="SGD">S$ SGD - Singapore Dollar</option>
                  <option value="AED">د.إ AED - UAE Dirham</option>
                  <option value="SAR">﷼ SAR - Saudi Riyal</option>
                  <option value="MYR">RM MYR - Malaysian Ringgit</option>
                  <option value="THB">฿ THB - Thai Baht</option>
                  <option value="PHP">₱ PHP - Philippine Peso</option>
                  <option value="IDR">Rp IDR - Indonesian Rupiah</option>
                  <option value="VND">₫ VND - Vietnamese Dong</option>
                  <option value="PKR">₨ PKR - Pakistani Rupee</option>
                  <option value="BDT">৳ BDT - Bangladeshi Taka</option>
                  <option value="LKR">රු LKR - Sri Lankan Rupee</option>
                  <option value="NPR">रू NPR - Nepalese Rupee</option>
                  <option value="JPY">¥ JPY - Japanese Yen</option>
                  <option value="CNY">¥ CNY - Chinese Yuan</option>
                  <option value="KRW">₩ KRW - South Korean Won</option>
                  <option value="HKD">HK$ HKD - Hong Kong Dollar</option>
                  <option value="TWD">NT$ TWD - Taiwan Dollar</option>
                </select>
                <p className="text-xs text-gray-500 mt-1">This currency will be used throughout the shop for all prices and reports</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Phone</label>
                  <input
                    type="tel"
                    value={newShop.phone}
                    onChange={(e) => setNewShop({ ...newShop, phone: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="(555) 123-4567"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Email</label>
                  <input
                    type="email"
                    value={newShop.email}
                    onChange={(e) => setNewShop({ ...newShop, email: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="shop@restaurant.com"
                  />
                </div>
              </div>

              <div className="border-t border-gray-200 pt-4 mt-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Shop Admin Account</h3>
                
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Admin Username * (becomes URL path)</label>
                  <input
                    type="text"
                    required
                    value={newShop.admin_username}
                    onChange={(e) => setNewShop({ ...newShop, admin_username: e.target.value.toLowerCase().replace(/\s+/g, '') })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="downtown"
                  />
                  <p className="text-xs text-gray-500 mt-1">This will be the login username and URL: /{newShop.admin_username || 'username'}</p>
                </div>

                <div className="mt-4">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Admin Password *</label>
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={newShop.admin_password}
                    onChange={(e) => setNewShop({ ...newShop, admin_password: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Minimum 6 characters"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">First Name *</label>
                    <input
                      type="text"
                      required
                      value={newShop.admin_first_name}
                      onChange={(e) => setNewShop({ ...newShop, admin_first_name: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="John"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Last Name *</label>
                    <input
                      type="text"
                      required
                      value={newShop.admin_last_name}
                      onChange={(e) => setNewShop({ ...newShop, admin_last_name: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Doe"
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddShop(false)}
                  className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-3 rounded-xl hover:from-blue-700 hover:to-blue-800 shadow-lg transition font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? 'Creating...' : 'Create Shop & Admin'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Staff Modal */}
      {showAddStaff && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-gradient-to-r from-green-600 to-green-700 text-white p-6 rounded-t-2xl flex items-center justify-between">
              <h2 className="text-2xl font-bold">Add Staff Member</h2>
              <button onClick={() => {
                setShowAddStaff(false);
                setSelectedShopForStaff(null);
              }} className="p-2 hover:bg-white/20 rounded-lg transition">
                <FiX className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={handleAddStaff} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Shop *</label>
                <select
                  required
                  value={newStaff.shop_id || ''}
                  onChange={(e) => setNewStaff({ ...newStaff, shop_id: parseInt(e.target.value) })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                  <option value="">Select a shop</option>
                  {shops.map(shop => (
                    <option key={shop.id} value={shop.id}>{shop.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Role *</label>
                <select
                  required
                  value={newStaff.role}
                  onChange={(e) => setNewStaff({ ...newStaff, role: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                  <option value="cashier">Cashier</option>
                  <option value="chef">Chef</option>
                  <option value="manager">Manager</option>
                </select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">First Name *</label>
                  <input
                    type="text"
                    required
                    value={newStaff.first_name}
                    onChange={(e) => setNewStaff({ ...newStaff, first_name: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="John"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Last Name *</label>
                  <input
                    type="text"
                    required
                    value={newStaff.last_name}
                    onChange={(e) => setNewStaff({ ...newStaff, last_name: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="Doe"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Username *</label>
                <input
                  type="text"
                  required
                  value={newStaff.username}
                  onChange={(e) => setNewStaff({ ...newStaff, username: e.target.value.toLowerCase().replace(/\s+/g, '') })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="johndoe"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Password *</label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={newStaff.password}
                  onChange={(e) => setNewStaff({ ...newStaff, password: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="Minimum 6 characters"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Email *</label>
                <input
                  type="email"
                  required
                  value={newStaff.email}
                  onChange={(e) => setNewStaff({ ...newStaff, email: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="john@restaurant.com"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Phone</label>
                <input
                  type="tel"
                  value={newStaff.phone}
                  onChange={(e) => setNewStaff({ ...newStaff, phone: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="(555) 123-4567"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddStaff(false);
                    setSelectedShopForStaff(null);
                  }}
                  className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-gradient-to-r from-green-600 to-green-700 text-white px-6 py-3 rounded-xl hover:from-green-700 hover:to-green-800 shadow-lg transition font-semibold"
                >
                  Add Staff Member
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Profile Modal */}
      {showEditProfile && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full">
            <div className="bg-gradient-to-r from-purple-600 to-purple-700 text-white p-6 rounded-t-2xl flex items-center justify-between">
              <h2 className="text-2xl font-bold">Edit Owner Profile</h2>
              <button onClick={() => {
                setShowEditProfile(false);
                setCompanyLogo(null);
                setPreviewLogo(user?.avatar_url || null);
                setOwnerUsername(user?.username || '');
              }} className="p-2 hover:bg-white/20 rounded-lg transition">
                <FiX className="h-6 w-6" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {/* Company Logo Upload */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Company Logo</label>
                <div className="flex items-center gap-4">
                  <div className="relative">
                    {previewLogo ? (
                      <img
                        src={previewLogo.startsWith('blob:') || previewLogo.startsWith('data:') ? previewLogo : `https://restaurant-pos-system-1-7h0m.onrender.com${previewLogo}`}
                        alt="Company Logo"
                        className="w-24 h-24 rounded-full object-cover border-4 border-purple-200"
                      />
                    ) : (
                      <div className="w-24 h-24 rounded-full bg-gradient-to-br from-purple-100 to-purple-200 flex items-center justify-center border-4 border-purple-200">
                        <FiUser className="h-12 w-12 text-purple-600" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleLogoChange}
                      className="hidden"
                      id="logo-upload"
                    />
                    <label
                      htmlFor="logo-upload"
                      className="cursor-pointer inline-flex items-center gap-2 bg-purple-100 text-purple-700 px-4 py-2 rounded-lg hover:bg-purple-200 transition font-semibold"
                    >
                      <FiUser className="h-5 w-5" />
                      Choose Logo
                    </label>
                    <p className="text-xs text-gray-500 mt-2">Max 5MB (PNG, JPG, GIF)</p>
                  </div>
                </div>
              </div>

              {/* Owner Username */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Owner Username <span className="text-xs text-gray-500">(used for login)</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 font-semibold">@</span>
                  <input
                    type="text"
                    value={ownerUsername}
                    onChange={(e) => setOwnerUsername(e.target.value.toLowerCase().replace(/\s+/g, ''))}
                    className="w-full pl-9 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="owner"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  ⚠️ Important: This is your login username. Change it carefully.
                </p>
              </div>

              {/* Company Name */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Company Name</label>
                <input
                  type="text"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="My Restaurant Group"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => {
                    setShowEditProfile(false);
                    setCompanyLogo(null);
                    setPreviewLogo(user?.avatar_url || null);
                    setOwnerUsername(user?.username || '');
                  }}
                  className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition font-semibold"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpdateCompanyName}
                  className="flex-1 bg-gradient-to-r from-purple-600 to-purple-700 text-white px-6 py-3 rounded-xl hover:from-purple-700 hover:to-purple-800 shadow-lg transition font-semibold"
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Shop Modal */}
      {showEditShop && editShopData && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6 rounded-t-2xl flex items-center justify-between">
              <h2 className="text-2xl font-bold">Edit Shop</h2>
              <button onClick={() => {
                setShowEditShop(false);
                setEditShopData(null);
                setEditShopLogo(null);
                setEditShopLogoPreview(null);
              }} className="p-2 hover:bg-white/20 rounded-lg transition">
                <FiX className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={handleEditShop} className="p-6 space-y-4">
              {/* Shop Logo Upload */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Shop Logo</label>
                <div className="flex items-center gap-4">
                  <div className="relative">
                    {editShopLogoPreview ? (
                      <img
                        src={editShopLogoPreview.startsWith('blob:') || editShopLogoPreview.startsWith('data:') ? editShopLogoPreview : `https://restaurant-pos-system-1-7h0m.onrender.com${editShopLogoPreview}`}
                        alt="Shop Logo"
                        className="w-20 h-20 rounded-xl object-cover border-2 border-blue-200"
                      />
                    ) : (
                      <div className="w-20 h-20 rounded-xl bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center border-2 border-blue-200">
                        <FiShoppingBag className="h-10 w-10 text-blue-600" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleEditShopLogoChange}
                      className="hidden"
                      id="edit-shop-logo-upload"
                    />
                    <label
                      htmlFor="edit-shop-logo-upload"
                      className="cursor-pointer inline-flex items-center gap-2 bg-blue-100 text-blue-700 px-4 py-2 rounded-lg hover:bg-blue-200 transition font-semibold"
                    >
                      <FiShoppingBag className="h-5 w-5" />
                      Change Logo
                    </label>
                    <p className="text-xs text-gray-500 mt-2">Max 5MB (PNG, JPG, GIF)</p>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Shop Name *</label>
                <input
                  type="text"
                  required
                  value={editShopData.name}
                  onChange={(e) => setEditShopData({ ...editShopData, name: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Downtown Branch"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Address</label>
                  <input
                    type="text"
                    value={editShopData.address || ''}
                    onChange={(e) => setEditShopData({ ...editShopData, address: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="123 Main St"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">City</label>
                  <input
                    type="text"
                    value={editShopData.city || ''}
                    onChange={(e) => setEditShopData({ ...editShopData, city: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="New York"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Default Currency</label>
                <select
                  value={editShopData.currency || 'INR'}
                  onChange={(e) => setEditShopData({ ...editShopData, currency: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="INR">₹ INR - Indian Rupee</option>
                  <option value="USD">$ USD - US Dollar</option>
                  <option value="EUR">€ EUR - Euro</option>
                  <option value="GBP">£ GBP - British Pound</option>
                  <option value="AUD">A$ AUD - Australian Dollar</option>
                  <option value="CAD">C$ CAD - Canadian Dollar</option>
                  <option value="SGD">S$ SGD - Singapore Dollar</option>
                  <option value="AED">د.إ AED - UAE Dirham</option>
                  <option value="SAR">﷼ SAR - Saudi Riyal</option>
                  <option value="MYR">RM MYR - Malaysian Ringgit</option>
                  <option value="THB">฿ THB - Thai Baht</option>
                  <option value="PHP">₱ PHP - Philippine Peso</option>
                  <option value="IDR">Rp IDR - Indonesian Rupiah</option>
                  <option value="VND">₫ VND - Vietnamese Dong</option>
                  <option value="PKR">₨ PKR - Pakistani Rupee</option>
                  <option value="BDT">৳ BDT - Bangladeshi Taka</option>
                  <option value="LKR">රු LKR - Sri Lankan Rupee</option>
                  <option value="NPR">रू NPR - Nepalese Rupee</option>
                  <option value="JPY">¥ JPY - Japanese Yen</option>
                  <option value="CNY">¥ CNY - Chinese Yuan</option>
                  <option value="KRW">₩ KRW - South Korean Won</option>
                  <option value="HKD">HK$ HKD - Hong Kong Dollar</option>
                  <option value="TWD">NT$ TWD - Taiwan Dollar</option>
                </select>
                <p className="text-xs text-gray-500 mt-1">This currency will be used throughout the shop for all prices and reports</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Phone</label>
                  <input
                    type="tel"
                    value={editShopData.phone || ''}
                    onChange={(e) => setEditShopData({ ...editShopData, phone: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="(555) 123-4567"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Email</label>
                  <input
                    type="email"
                    value={editShopData.email || ''}
                    onChange={(e) => setEditShopData({ ...editShopData, email: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="shop@restaurant.com"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditShop(false);
                    setEditShopData(null);
                    setEditShopLogo(null);
                    setEditShopLogoPreview(null);
                  }}
                  className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-3 rounded-xl hover:from-blue-700 hover:to-blue-800 shadow-lg transition font-semibold"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Shop Menu Modal */}
      {showShopMenu && selectedShopMenu && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-gradient-to-r from-orange-600 to-orange-700 text-white p-6 rounded-t-2xl flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold">{selectedShopMenu.name} - Menu</h2>
                <p className="text-orange-100 text-sm mt-1">{shopMenuItems.length} items</p>
              </div>
              <button onClick={() => {
                setShowShopMenu(false);
                setSelectedShopMenu(null);
                setShopMenuItems([]);
              }} className="p-2 hover:bg-white/20 rounded-lg transition">
                <FiX className="h-6 w-6" />
              </button>
            </div>

            <div className="p-6">
              {shopMenuItems.length === 0 ? (
                <div className="text-center py-12">
                  <FiPackage className="h-24 w-24 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-xl font-bold text-gray-900 mb-2">No Menu Items</h3>
                  <p className="text-gray-600">This shop hasn't added any menu items yet.</p>
                </div>
              ) : (
                <>
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-bold text-gray-900">Menu Items ({shopMenuItems.length})</h3>
                    <button
                      onClick={handleClearShopMenu}
                      className="bg-red-100 text-red-700 px-4 py-2 rounded-lg hover:bg-red-200 transition font-semibold flex items-center gap-2"
                    >
                      <FiTrash2 />
                      Clear All Menu
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {shopMenuItems.map(item => (
                      <div key={item.id} className="bg-white border-2 border-gray-200 rounded-xl overflow-hidden hover:shadow-lg transition">
                        {/* Item Image */}
                        <div className="aspect-square bg-gray-100 relative">
                          {item.image_url ? (
                            <img 
                              src={`https://restaurant-pos-system-1-7h0m.onrender.com${item.image_url}`}
                              alt={item.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-6xl">
                              🍽️
                            </div>
                          )}
                          {!item.is_available && (
                            <div className="absolute inset-0 bg-black bg-opacity-60 flex items-center justify-center">
                              <span className="text-white text-sm font-bold">Out of Stock</span>
                            </div>
                          )}
                        </div>
                        
                        {/* Item Info */}
                        <div className="p-4">
                          <h4 className="font-bold text-gray-900 mb-1">{item.name}</h4>
                          <p className="text-sm text-gray-600 mb-2">{item.category}</p>
                          <p className="text-lg font-bold text-green-600 mb-3">₹{item.price}</p>
                          
                          <button
                            onClick={() => handleDeleteMenuItem(item.id, item.name)}
                            className="w-full bg-red-100 text-red-700 px-4 py-2 rounded-lg hover:bg-red-200 transition font-semibold flex items-center justify-center gap-2"
                          >
                            <FiTrash2 className="h-4 w-4" />
                            Delete Item
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Clear Menu Confirmation */}
      {showClearMenuConfirm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full">
            <div className="bg-gradient-to-r from-red-600 to-red-700 text-white p-6 rounded-t-2xl">
              <h2 className="text-2xl font-bold">⚠️ Clear Entire Menu</h2>
            </div>

            <div className="p-6 space-y-4">
              <p className="text-gray-700">
                You are about to clear <strong>ALL {shopMenuItems.length} menu items</strong> from <strong>{selectedShopMenu?.name}</strong>.
              </p>
              <p className="text-red-600 font-semibold">
                This action cannot be undone! All menu items will be permanently deleted.
              </p>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Enter Owner Password to Confirm *</label>
                <input
                  type="password"
                  value={clearMenuPassword}
                  onChange={(e) => setClearMenuPassword(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  placeholder="Your owner password"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => {
                    setShowClearMenuConfirm(false);
                    setClearMenuPassword('');
                  }}
                  className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition font-semibold"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmClearShopMenu}
                  className="flex-1 bg-gradient-to-r from-red-600 to-red-700 text-white px-6 py-3 rounded-xl hover:from-red-700 hover:to-red-800 shadow-lg transition font-semibold"
                >
                  Clear All Menu
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Shop Confirmation */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full">
            <div className="bg-gradient-to-r from-red-600 to-red-700 text-white p-6 rounded-t-2xl">
              <h2 className="text-2xl font-bold">⚠️ Confirm Shop Deletion</h2>
            </div>

            <div className="p-6 space-y-4">
              <p className="text-gray-700">
                You are about to permanently delete <strong>{deleteShopId?.name}</strong>.
              </p>
              <p className="text-red-600 font-semibold">
                This action cannot be undone! All data for this shop will be lost.
              </p>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Enter Owner Password to Confirm *</label>
                <input
                  type="password"
                  value={ownerPassword}
                  onChange={(e) => setOwnerPassword(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  placeholder="Your owner password"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => {
                    setShowDeleteConfirm(false);
                    setDeleteShopId(null);
                    setOwnerPassword('');
                  }}
                  className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition font-semibold"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDeleteShop}
                  className="flex-1 bg-gradient-to-r from-red-600 to-red-700 text-white px-6 py-3 rounded-xl hover:from-red-700 hover:to-red-800 shadow-lg transition font-semibold"
                >
                  Delete Shop
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OwnerPortal;

