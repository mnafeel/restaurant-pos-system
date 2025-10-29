import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { FaPlus, FaEdit, FaTrash, FaStore, FaStar, FaMapMarkerAlt, FaPhone, FaEnvelope, FaCamera, FaImage } from 'react-icons/fa';

const ShopManagement = () => {
  const [shops, setShops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [currentShop, setCurrentShop] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    city: '',
    state: '',
    zip_code: '',
    country: 'USA',
    phone: '',
    email: '',
    tax_id: '',
    is_primary: false
  });
  const [uploadingLogo, setUploadingLogo] = useState(null);
  const logoInputRef = useRef(null);

  useEffect(() => {
    fetchShops();
  }, []);

  const fetchShops = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/shops', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setShops(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching shops:', error);
      toast.error('Failed to fetch shops');
      setLoading(false);
    }
  };

  const handleAddShop = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post('/api/shops', formData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      toast.success('Shop created successfully');
      setShowAddModal(false);
      resetForm();
      
      // Force refresh shops list
      await fetchShops();
      
      // Clear any cached data and refresh window data after a short delay
      setTimeout(() => {
        // Trigger a custom event to notify other components to refresh
        window.dispatchEvent(new Event('shopCreated'));
      }, 500);
      
    } catch (error) {
      console.error('Error creating shop:', error);
      toast.error(error.response?.data?.error || 'Failed to create shop');
    }
  };

  const handleEditShop = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      await axios.put(`/api/shops/${currentShop.id}`, formData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      toast.success('Shop updated successfully');
      setShowEditModal(false);
      setCurrentShop(null);
      resetForm();
      fetchShops();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to update shop');
    }
  };

  const handleDeleteShop = async (shopId, shopName) => {
    if (!window.confirm(`Are you sure you want to delete "${shopName}"? This action cannot be undone.`)) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      await axios.delete(`/api/shops/${shopId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      toast.success('Shop deleted successfully');
      fetchShops();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to delete shop');
    }
  };

  const handleSetPrimary = async (shopId) => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(`/api/shops/${shopId}`, {
        is_primary: true
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      toast.success('Primary shop updated');
      fetchShops();
    } catch (error) {
      toast.error('Failed to set as primary');
    }
  };

  const openEditModal = (shop) => {
    setCurrentShop(shop);
    setFormData({
      name: shop.name,
      address: shop.address || '',
      city: shop.city || '',
      state: shop.state || '',
      zip_code: shop.zip_code || '',
      country: shop.country || 'USA',
      phone: shop.phone || '',
      email: shop.email || '',
      tax_id: shop.tax_id || '',
      is_primary: shop.is_primary
    });
    setShowEditModal(true);
  };

  const handleLogoUpload = async (shopId, file) => {
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size should be less than 5MB');
      return;
    }

    setUploadingLogo(shopId);

    try {
      const formData = new FormData();
      formData.append('logo', file);

      const token = localStorage.getItem('token');
      await axios.post(`/api/shops/${shopId}/logo`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });

      toast.success('Logo uploaded successfully');
      fetchShops();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to upload logo');
    } finally {
      setUploadingLogo(null);
    }
  };

  const handleDeleteLogo = async (shopId) => {
    if (!window.confirm('Remove shop logo?')) return;

    try {
      const token = localStorage.getItem('token');
      await axios.delete(`/api/shops/${shopId}/logo`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      toast.success('Logo removed successfully');
      fetchShops();
    } catch (error) {
      toast.error('Failed to delete logo');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      address: '',
      city: '',
      state: '',
      zip_code: '',
      country: 'USA',
      phone: '',
      email: '',
      tax_id: '',
      is_primary: false
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Shop Management</h1>
          <p className="text-gray-600 mt-1">Manage your restaurant locations</p>
        </div>
        
        <button
          onClick={() => setShowAddModal(true)}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center shadow-lg"
        >
          <FaPlus className="mr-2" />
          Add New Shop
        </button>
      </div>

      {/* Shops Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {shops.map(shop => (
          <div 
            key={shop.id} 
            className={`bg-white rounded-lg shadow-md overflow-hidden border-2 transition-all hover:shadow-lg ${
              shop.is_primary ? 'border-yellow-400' : 'border-gray-200'
            }`}
          >
            {/* Header with Logo */}
            <div className={`p-4 ${shop.is_primary ? 'bg-yellow-50' : 'bg-gray-50'}`}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center">
                  {shop.logo_url ? (
                    <div className="relative">
                      <img
                        src={`https://restaurant-pos-system-1-7h0m.onrender.com${shop.logo_url}`}
                        alt={shop.name}
                        className="h-12 w-12 rounded-full object-cover border-2 border-gray-300 mr-3"
                      />
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteLogo(shop.id);
                        }}
                        className="absolute -top-1 -right-1 bg-red-500 text-white p-1 rounded-full text-xs hover:bg-red-600"
                        title="Remove Logo"
                      >
                        <FaTrash size={8} />
                      </button>
                    </div>
                  ) : (
                    <FaStore className={`text-2xl mr-3 ${shop.is_primary ? 'text-yellow-600' : 'text-gray-600'}`} />
                  )}
                  
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">{shop.name}</h3>
                    {shop.is_primary && (
                      <span className="inline-flex items-center text-xs text-yellow-700">
                        <FaStar className="mr-1" />
                        Primary Location
                      </span>
                    )}
                  </div>
                </div>
                
                {/* Upload Logo Button */}
                <label className="cursor-pointer">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleLogoUpload(shop.id, e.target.files[0])}
                    className="hidden"
                  />
                  <div className={`p-2 rounded-full transition-colors ${
                    uploadingLogo === shop.id 
                      ? 'bg-gray-300 cursor-wait' 
                      : 'bg-blue-100 hover:bg-blue-200'
                  }`} title="Upload Logo">
                    {uploadingLogo === shop.id ? (
                      <div className="animate-spin h-4 w-4 border-2 border-blue-600 border-t-transparent rounded-full"></div>
                    ) : (
                      <FaCamera className="text-blue-600" size={16} />
                    )}
                  </div>
                </label>
              </div>
            </div>

            {/* Content */}
            <div className="p-4 space-y-3">
              {shop.address && (
                <div className="flex items-start">
                  <FaMapMarkerAlt className="text-gray-400 mt-1 mr-3 flex-shrink-0" />
                  <div className="text-sm text-gray-700">
                    <div>{shop.address}</div>
                    {shop.city && <div>{shop.city}, {shop.state} {shop.zip_code}</div>}
                    {shop.country && <div>{shop.country}</div>}
                  </div>
                </div>
              )}

              {shop.phone && (
                <div className="flex items-center">
                  <FaPhone className="text-gray-400 mr-3" />
                  <span className="text-sm text-gray-700">{shop.phone}</span>
                </div>
              )}

              {shop.email && (
                <div className="flex items-center">
                  <FaEnvelope className="text-gray-400 mr-3" />
                  <span className="text-sm text-gray-700">{shop.email}</span>
                </div>
              )}

              {shop.tax_id && (
                <div className="text-sm text-gray-600">
                  <span className="font-medium">Tax ID:</span> {shop.tax_id}
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="p-4 bg-gray-50 flex justify-between items-center">
              <div className="flex space-x-2">
                <button
                  onClick={() => openEditModal(shop)}
                  className="p-2 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                  title="Edit Shop"
                >
                  <FaEdit size={18} />
                </button>
                
                {!shop.is_primary && (
                  <button
                    onClick={() => handleDeleteShop(shop.id, shop.name)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded transition-colors"
                    title="Delete Shop"
                  >
                    <FaTrash size={18} />
                  </button>
                )}
              </div>

              {!shop.is_primary && (
                <button
                  onClick={() => handleSetPrimary(shop.id)}
                  className="px-3 py-1 text-sm bg-yellow-100 text-yellow-700 rounded hover:bg-yellow-200 transition-colors flex items-center"
                >
                  <FaStar className="mr-1" />
                  Set as Primary
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {shops.length === 0 && (
        <div className="text-center py-12">
          <FaStore className="text-6xl text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 text-lg">No shops added yet</p>
          <button
            onClick={() => setShowAddModal(true)}
            className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Add Your First Shop
          </button>
        </div>
      )}

      {/* Add Shop Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold mb-4">Add New Shop</h2>
            
            <form onSubmit={handleAddShop}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Shop Name *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Main Branch"
                    required
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Address
                  </label>
                  <input
                    type="text"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="123 Main Street"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    City
                  </label>
                  <input
                    type="text"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="New York"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    State
                  </label>
                  <input
                    type="text"
                    value={formData.state}
                    onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="NY"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    ZIP Code
                  </label>
                  <input
                    type="text"
                    value={formData.zip_code}
                    onChange={(e) => setFormData({ ...formData, zip_code: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="10001"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Country
                  </label>
                  <input
                    type="text"
                    value={formData.country}
                    onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="USA"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="+1 (555) 123-4567"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="shop@restaurant.com"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tax ID
                  </label>
                  <input
                    type="text"
                    value={formData.tax_id}
                    onChange={(e) => setFormData({ ...formData, tax_id: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="TAX123456"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.is_primary}
                      onChange={(e) => setFormData({ ...formData, is_primary: e.target.checked })}
                      className="mr-2 h-4 w-4"
                    />
                    <span className="text-sm">Set as Primary Location</span>
                  </label>
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    resetForm();
                  }}
                  className="px-4 py-2 border rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Add Shop
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Shop Modal */}
      {showEditModal && currentShop && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold mb-4">Edit Shop</h2>
            
            <form onSubmit={handleEditShop}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Shop Name *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Address
                  </label>
                  <input
                    type="text"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    City
                  </label>
                  <input
                    type="text"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    State
                  </label>
                  <input
                    type="text"
                    value={formData.state}
                    onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    ZIP Code
                  </label>
                  <input
                    type="text"
                    value={formData.zip_code}
                    onChange={(e) => setFormData({ ...formData, zip_code: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Country
                  </label>
                  <input
                    type="text"
                    value={formData.country}
                    onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tax ID
                  </label>
                  <input
                    type="text"
                    value={formData.tax_id}
                    onChange={(e) => setFormData({ ...formData, tax_id: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.is_primary}
                      onChange={(e) => setFormData({ ...formData, is_primary: e.target.checked })}
                      className="mr-2 h-4 w-4"
                    />
                    <span className="text-sm">Set as Primary Location</span>
                  </label>
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditModal(false);
                    setCurrentShop(null);
                    resetForm();
                  }}
                  className="px-4 py-2 border rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Update Shop
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ShopManagement;

