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
  FiEyeOff
} from 'react-icons/fi';

const OwnerDashboard = () => {
  const { user, updateUser } = useAuth();
  const [shops, setShops] = useState([]);
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddShop, setShowAddShop] = useState(false);
  const [showEditShop, setShowEditShop] = useState(false);
  const [showAddStaff, setShowAddStaff] = useState(false);
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteShopId, setDeleteShopId] = useState(null);
  const [ownerPassword, setOwnerPassword] = useState('');
  const [currentShop, setCurrentShop] = useState(null);
  const [selectedShopForStaff, setSelectedShopForStaff] = useState(null);
  
  const [companyName, setCompanyName] = useState(user?.company_name || '');
  
  const [newShop, setNewShop] = useState({
    name: '',
    address: '',
    city: '',
    phone: '',
    email: '',
    admin_username: '',
    admin_password: '',
    admin_first_name: '',
    admin_last_name: ''
  });

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
    fetchShops();
    fetchAllStaff();
  }, []);

  const fetchShops = async () => {
    try {
      const response = await axios.get('/api/shops');
      setShops(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching shops:', error);
      toast.error('Failed to load shops');
      setLoading(false);
    }
  };

  const fetchAllStaff = async () => {
    try {
      const response = await axios.get('/api/users');
      setStaff(response.data.filter(u => u.role !== 'owner'));
    } catch (error) {
      console.error('Error fetching staff:', error);
    }
  };

  const handleAddShop = async (e) => {
    e.preventDefault();
    try {
      // Create shop first
      const shopRes = await axios.post('/api/shops', {
        name: newShop.name,
        address: newShop.address,
        city: newShop.city,
        phone: newShop.phone,
        email: newShop.email,
        is_active: true
      });

      const shopId = shopRes.data.id;

      // Create admin user for this shop
      await axios.post('/api/users', {
        username: newShop.admin_username,
        email: newShop.email,
        password: newShop.admin_password,
        role: 'admin',
        first_name: newShop.admin_first_name,
        last_name: newShop.admin_last_name,
        shop_id: shopId
      });

      // Update shop with admin username
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
        admin_last_name: ''
      });
      fetchShops();
      fetchAllStaff();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to create shop');
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
      // Verify owner password
      await axios.post('/api/auth/verify-password', { password: ownerPassword });

      // Delete shop
      await axios.delete(`/api/shops/${deleteShopId.id}`);
      
      toast.success('Shop deleted successfully');
      setShowDeleteConfirm(false);
      setDeleteShopId(null);
      setOwnerPassword('');
      fetchShops();
      fetchAllStaff();
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
      fetchAllStaff();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to add staff');
    }
  };

  const handleDeleteStaff = async (staffId, staffName) => {
    if (!window.confirm(`Delete staff member "${staffName}"?`)) {
      return;
    }

    try {
      await axios.delete(`/api/users/${staffId}`);
      toast.success('Staff deleted successfully');
      fetchAllStaff();
    } catch (error) {
      toast.error('Failed to delete staff');
    }
  };

  const handleUpdateCompanyName = async () => {
    try {
      await axios.put('/api/profile', { company_name: companyName });
      toast.success('Company name updated');
      setShowEditProfile(false);
      if (updateUser) {
        updateUser({ ...user, company_name: companyName });
      }
    } catch (error) {
      toast.error('Failed to update company name');
    }
  };

  const handleResetAdminPassword = async (adminUsername) => {
    const newPassword = prompt(`Enter new password for ${adminUsername}:`);
    if (!newPassword || newPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    try {
      const userRes = await axios.get('/api/users');
      const adminUser = userRes.data.find(u => u.username === adminUsername);
      
      if (adminUser) {
        await axios.put(`/api/users/${adminUser.id}/password`, { new_password: newPassword });
        toast.success('Password updated successfully');
      }
    } catch (error) {
      toast.error('Failed to update password');
    }
  };

  const getShopStaff = (shopId) => {
    return staff.filter(s => s.shop_id === shopId);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 md:p-6">
      {/* Header */}
      <div className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900">Owner Portal</h1>
          <p className="text-gray-600 mt-2">Manage your restaurant empire</p>
        </div>
        <button
          onClick={() => setShowAddShop(true)}
          className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-3 rounded-lg hover:from-blue-700 hover:to-blue-800 shadow-lg transition-all transform hover:scale-105"
        >
          <FiPlus className="h-5 w-5" />
          Add New Shop
        </button>
      </div>

      {/* Owner Profile Card */}
      <div className="mb-8 bg-gradient-to-r from-purple-600 via-purple-700 to-indigo-700 rounded-xl shadow-2xl p-6 text-white">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="bg-white/20 p-4 rounded-full">
              <FiUser className="h-12 w-12" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">{user?.first_name} {user?.last_name}</h2>
              <p className="text-purple-100">{user?.email}</p>
              {user?.company_name && (
                <p className="text-purple-200 text-sm mt-1 font-semibold">🏢 {user.company_name}</p>
              )}
              <p className="text-purple-200 text-xs mt-1">Owner Account - ID#{user?.id}</p>
            </div>
          </div>
          <button
            onClick={() => setShowEditProfile(true)}
            className="bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-lg transition flex items-center gap-2"
          >
            <FiEdit2 />
            Edit Profile
          </button>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-xl p-6 text-white transform hover:scale-105 transition-all">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm font-medium uppercase">Total Shops</p>
              <p className="text-4xl font-bold mt-2">{shops.length}</p>
            </div>
            <div className="bg-blue-400 bg-opacity-30 rounded-full p-4">
              <FiShoppingBag className="h-10 w-10" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-xl p-6 text-white transform hover:scale-105 transition-all">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm font-medium uppercase">Active Shops</p>
              <p className="text-4xl font-bold mt-2">{shops.filter(s => s.is_active).length}</p>
            </div>
            <div className="bg-green-400 bg-opacity-30 rounded-full p-4">
              <FiUnlock className="h-10 w-10" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-xl shadow-xl p-6 text-white transform hover:scale-105 transition-all">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-red-100 text-sm font-medium uppercase">Closed Shops</p>
              <p className="text-4xl font-bold mt-2">{shops.filter(s => !s.is_active).length}</p>
            </div>
            <div className="bg-red-400 bg-opacity-30 rounded-full p-4">
              <FiLock className="h-10 w-10" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl shadow-xl p-6 text-white transform hover:scale-105 transition-all">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-orange-100 text-sm font-medium uppercase">Total Staff</p>
              <p className="text-4xl font-bold mt-2">{staff.length}</p>
            </div>
            <div className="bg-orange-400 bg-opacity-30 rounded-full p-4">
              <FiUsers className="h-10 w-10" />
            </div>
          </div>
        </div>
      </div>

      {/* Shops Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {shops.map(shop => {
          const shopStaff = getShopStaff(shop.id);
          return (
            <div key={shop.id} className="bg-white rounded-xl shadow-lg border-2 border-gray-200 overflow-hidden hover:shadow-2xl transition-all">
              {/* Shop Header */}
              <div className={`${shop.is_active ? 'bg-gradient-to-r from-blue-600 to-blue-700' : 'bg-gradient-to-r from-gray-600 to-gray-700'} text-white p-4`}>
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <FiShoppingBag className="h-5 w-5" />
                      <h3 className="text-xl font-bold">{shop.name}</h3>
                    </div>
                    {user?.company_name && (
                      <p className="text-xs text-blue-100 mt-1 opacity-90">{user.company_name}</p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleToggleShop(shop.id, shop.is_active)}
                      className={`${shop.is_active ? 'bg-green-500' : 'bg-red-500'} text-white text-xs px-3 py-1 rounded-full flex items-center gap-1`}
                      title={shop.is_active ? 'Close Shop' : 'Open Shop'}
                    >
                      {shop.is_active ? <><FiUnlock size={12} /> Open</> : <><FiLock size={12} /> Closed</>}
                    </button>
                  </div>
                </div>
              </div>

              {/* Shop Details */}
              <div className="p-4">
                <div className="space-y-2 mb-4">
                  {shop.address && (
                    <div className="flex items-start gap-2 text-sm">
                      <FiMapPin className="text-gray-400 mt-1 flex-shrink-0" />
                      <span className="text-gray-700">{shop.address}, {shop.city}</span>
                    </div>
                  )}
                  {shop.phone && (
                    <div className="flex items-center gap-2 text-sm">
                      <FiPhone className="text-gray-400 flex-shrink-0" />
                      <span className="text-gray-700">{shop.phone}</span>
                    </div>
                  )}
                  {shop.email && (
                    <div className="flex items-center gap-2 text-sm">
                      <FiMail className="text-gray-400 flex-shrink-0" />
                      <span className="text-gray-700">{shop.email}</span>
                    </div>
                  )}
                  {shop.admin_username && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-2 mt-2">
                      <div className="text-xs text-gray-600">Admin Login</div>
                      <div className="font-semibold text-blue-700">@{shop.admin_username}</div>
                      <div className="text-xs text-gray-500 mt-1">Path: /{shop.admin_username}</div>
                    </div>
                  )}
                </div>

                {/* Staff Count */}
                <div className="bg-gray-50 rounded-lg p-3 mb-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Staff Members</span>
                    <span className="font-bold text-gray-900">{shopStaff.length}</span>
                  </div>
                  <div className="flex gap-2 mt-2 text-xs">
                    <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded">Cashiers: {shopStaff.filter(s => s.role === 'cashier').length}</span>
                    <span className="bg-green-100 text-green-700 px-2 py-1 rounded">Chefs: {shopStaff.filter(s => s.role === 'chef').length}</span>
                    <span className="bg-purple-100 text-purple-700 px-2 py-1 rounded">Managers: {shopStaff.filter(s => s.role === 'manager').length}</span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={() => {
                      setSelectedShopForStaff(shop);
                      setNewStaff({ ...newStaff, shop_id: shop.id });
                      setShowAddStaff(true);
                    }}
                    className="flex items-center justify-center gap-1 bg-green-100 text-green-700 py-2 rounded-lg hover:bg-green-200 transition text-sm"
                  >
                    <FiUserPlus size={14} />
                    Staff
                  </button>
                  <button
                    onClick={() => {
                      setCurrentShop(shop);
                      setShowEditShop(true);
                    }}
                    className="flex items-center justify-center gap-1 bg-blue-100 text-blue-700 py-2 rounded-lg hover:bg-blue-200 transition text-sm"
                  >
                    <FiEdit2 size={14} />
                    Edit
                  </button>
                  <button
                    onClick={() => handleDeleteShop(shop.id, shop.name)}
                    className="flex items-center justify-center gap-1 bg-red-100 text-red-700 py-2 rounded-lg hover:bg-red-200 transition text-sm"
                  >
                    <FiTrash2 size={14} />
                    Delete
                  </button>
                </div>

                {/* Shop Staff List */}
                {shopStaff.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <div className="text-xs font-semibold text-gray-700 mb-2">Staff:</div>
                    <div className="space-y-2 max-h-32 overflow-y-auto">
                      {shopStaff.map(member => (
                        <div key={member.id} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                          <div>
                            <div className="text-sm font-medium">{member.first_name} {member.last_name}</div>
                            <div className="text-xs text-gray-600">{member.role} - @{member.username}</div>
                          </div>
                          <button
                            onClick={() => handleDeleteStaff(member.id, `${member.first_name} ${member.last_name}`)}
                            className="text-red-600 hover:bg-red-100 p-1 rounded"
                          >
                            <FiTrash2 size={14} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {shops.length === 0 && (
        <div className="text-center py-20 bg-white rounded-xl shadow-lg">
          <FiShoppingBag className="text-6xl text-gray-300 mx-auto mb-4" />
          <h3 className="text-2xl font-bold text-gray-700 mb-2">No Shops Yet</h3>
          <p className="text-gray-500 mb-6">Create your first restaurant location</p>
          <button
            onClick={() => setShowAddShop(true)}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700"
          >
            Add First Shop
          </button>
        </div>
      )}

      {/* Add Shop Modal */}
      {showAddShop && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl my-8">
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6 flex justify-between items-center">
              <h2 className="text-2xl font-bold">Add New Shop</h2>
              <button onClick={() => setShowAddShop(false)} className="text-white hover:bg-white/20 p-2 rounded">
                <FiX size={24} />
              </button>
            </div>
            
            <form onSubmit={handleAddShop} className="p-6">
              <div className="mb-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4 border-b pb-2">Shop Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Shop Name *
                    </label>
                    <input
                      type="text"
                      value={newShop.name}
                      onChange={(e) => setNewShop({ ...newShop, name: e.target.value })}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="e.g., Downtown Branch"
                      required
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Address *
                    </label>
                    <input
                      type="text"
                      value={newShop.address}
                      onChange={(e) => setNewShop({ ...newShop, address: e.target.value })}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="Street address"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      City *
                    </label>
                    <input
                      type="text"
                      value={newShop.city}
                      onChange={(e) => setNewShop({ ...newShop, city: e.target.value })}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Phone *
                    </label>
                    <input
                      type="tel"
                      value={newShop.phone}
                      onChange={(e) => setNewShop({ ...newShop, phone: e.target.value })}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email *
                    </label>
                    <input
                      type="email"
                      value={newShop.email}
                      onChange={(e) => setNewShop({ ...newShop, email: e.target.value })}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="mb-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4 border-b pb-2">Shop Admin Account</h3>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                  <p className="text-sm text-blue-800">This admin will manage only this shop's operations, staff, and menu.</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Admin Username * (Shop Path)
                    </label>
                    <input
                      type="text"
                      value={newShop.admin_username}
                      onChange={(e) => setNewShop({ ...newShop, admin_username: e.target.value.toLowerCase().replace(/[^a-z0-9]/g, '') })}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="e.g., downtown"
                      required
                    />
                    <p className="text-xs text-gray-500 mt-1">Login path: /{newShop.admin_username || 'username'}</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Admin Password *
                    </label>
                    <input
                      type="password"
                      value={newShop.admin_password}
                      onChange={(e) => setNewShop({ ...newShop, admin_password: e.target.value })}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="Min 6 characters"
                      minLength="6"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      First Name *
                    </label>
                    <input
                      type="text"
                      value={newShop.admin_first_name}
                      onChange={(e) => setNewShop({ ...newShop, admin_first_name: e.target.value })}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Last Name *
                    </label>
                    <input
                      type="text"
                      value={newShop.admin_last_name}
                      onChange={(e) => setNewShop({ ...newShop, admin_last_name: e.target.value })}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 px-6 pb-6">
                <button
                  type="button"
                  onClick={() => setShowAddShop(false)}
                  className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
                >
                  <FiShoppingBag />
                  Create Shop & Admin
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Shop Modal */}
      {showEditShop && currentShop && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6 flex justify-between items-center sticky top-0">
              <h2 className="text-2xl font-bold">Edit Shop</h2>
              <button onClick={() => { setShowEditShop(false); setCurrentShop(null); }} className="text-white hover:bg-white/20 p-2 rounded">
                <FiX size={24} />
              </button>
            </div>
            
            <form onSubmit={(e) => {
              e.preventDefault();
              axios.put(`/api/shops/${currentShop.id}`, currentShop)
                .then(() => {
                  toast.success('Shop updated');
                  setShowEditShop(false);
                  setCurrentShop(null);
                  fetchShops();
                })
                .catch(() => toast.error('Update failed'));
            }} className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Shop Name *</label>
                  <input
                    type="text"
                    value={currentShop.name}
                    onChange={(e) => setCurrentShop({ ...currentShop, name: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Address</label>
                  <input
                    type="text"
                    value={currentShop.address || ''}
                    onChange={(e) => setCurrentShop({ ...currentShop, address: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">City</label>
                  <input
                    type="text"
                    value={currentShop.city || ''}
                    onChange={(e) => setCurrentShop({ ...currentShop, city: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
                  <input
                    type="tel"
                    value={currentShop.phone || ''}
                    onChange={(e) => setCurrentShop({ ...currentShop, phone: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                  <input
                    type="email"
                    value={currentShop.email || ''}
                    onChange={(e) => setCurrentShop({ ...currentShop, email: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {currentShop.admin_username && (
                  <div className="md:col-span-2 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Reset Admin Password</label>
                    <button
                      type="button"
                      onClick={() => handleResetAdminPassword(currentShop.admin_username)}
                      className="bg-yellow-600 text-white px-4 py-2 rounded-lg hover:bg-yellow-700"
                    >
                      Change Password for @{currentShop.admin_username}
                    </button>
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => { setShowEditShop(false); setCurrentShop(null); }}
                  className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Update Shop
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Staff Modal */}
      {showAddStaff && selectedShopForStaff && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl">
            <div className="bg-gradient-to-r from-green-600 to-green-700 text-white p-6 flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold">Add Staff Member</h2>
                <p className="text-green-100 text-sm">For: {selectedShopForStaff.name}</p>
              </div>
              <button onClick={() => { setShowAddStaff(false); setSelectedShopForStaff(null); }} className="text-white hover:bg-white/20 p-2 rounded">
                <FiX size={24} />
              </button>
            </div>
            
            <form onSubmit={handleAddStaff} className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Role *</label>
                  <select
                    value={newStaff.role}
                    onChange={(e) => setNewStaff({ ...newStaff, role: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="cashier">Cashier</option>
                    <option value="chef">Chef</option>
                    <option value="manager">Manager</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Username *</label>
                  <input
                    type="text"
                    value={newStaff.username}
                    onChange={(e) => setNewStaff({ ...newStaff, username: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Password *</label>
                  <input
                    type="password"
                    value={newStaff.password}
                    onChange={(e) => setNewStaff({ ...newStaff, password: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    minLength="6"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Email *</label>
                  <input
                    type="email"
                    value={newStaff.email}
                    onChange={(e) => setNewStaff({ ...newStaff, email: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">First Name *</label>
                  <input
                    type="text"
                    value={newStaff.first_name}
                    onChange={(e) => setNewStaff({ ...newStaff, first_name: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Last Name *</label>
                  <input
                    type="text"
                    value={newStaff.last_name}
                    onChange={(e) => setNewStaff({ ...newStaff, last_name: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
                  <input
                    type="tel"
                    value={newStaff.phone}
                    onChange={(e) => setNewStaff({ ...newStaff, phone: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => { setShowAddStaff(false); setSelectedShopForStaff(null); }}
                  className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2"
                >
                  <FiUserPlus />
                  Add Staff
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && deleteShopId && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
            <div className="bg-gradient-to-r from-red-600 to-red-700 text-white p-6">
              <h2 className="text-2xl font-bold">⚠️ Delete Shop</h2>
            </div>
            
            <div className="p-6">
              <div className="mb-6">
                <p className="text-gray-700 mb-2">You are about to delete:</p>
                <p className="text-xl font-bold text-red-600 mb-4">{deleteShopId.name}</p>
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="text-sm text-red-800 font-semibold">⚠️ Warning:</p>
                  <ul className="text-sm text-red-700 mt-2 space-y-1">
                    <li>• All shop data will be permanently deleted</li>
                    <li>• Staff accounts will be removed</li>
                    <li>• This action cannot be undone</li>
                  </ul>
                </div>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Enter Your Owner Password to Confirm *
                </label>
                <input
                  type="password"
                  value={ownerPassword}
                  onChange={(e) => setOwnerPassword(e.target.value)}
                  className="w-full px-4 py-2 border-2 border-red-300 rounded-lg focus:ring-2 focus:ring-red-500"
                  placeholder="Owner password"
                  autoFocus
                />
              </div>

              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowDeleteConfirm(false);
                    setDeleteShopId(null);
                    setOwnerPassword('');
                  }}
                  className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDeleteShop}
                  className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center gap-2"
                >
                  <FiTrash2 />
                  Confirm Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Profile Modal */}
      {showEditProfile && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
            <div className="bg-gradient-to-r from-purple-600 to-purple-700 text-white p-6 flex justify-between items-center">
              <h2 className="text-2xl font-bold">Edit Owner Profile</h2>
              <button onClick={() => setShowEditProfile(false)} className="text-white hover:bg-white/20 p-2 rounded">
                <FiX size={24} />
              </button>
            </div>
            
            <div className="p-6">
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Company Name
                </label>
                <input
                  type="text"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
                  placeholder="e.g., Restaurant Group Inc."
                />
                <p className="text-xs text-gray-500 mt-1">This will appear under all shop names</p>
              </div>

              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setShowEditProfile(false)}
                  className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpdateCompanyName}
                  className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OwnerDashboard;
