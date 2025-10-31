import React, { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { FiPlus, FiEdit, FiTrash, FiX, FiCheckCircle, FiAlertCircle, FiPackage, FiFilter, FiFolder } from 'react-icons/fi';
import { useCurrency } from '../contexts/CurrencyContext';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://restaurant-pos-system-1-7h0m.onrender.com';

const MenuManager = () => {
  const { formatCurrency } = useCurrency();
  const [menuItems, setMenuItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [currentItem, setCurrentItem] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortBy, setSortBy] = useState('name');
  const [categoryFormData, setCategoryFormData] = useState({
    id: null,
    name: '',
    description: ''
  });
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    category: '',
    preparation_time: '',
    stock_quantity: '',
    low_stock_threshold: '10',
    image: null
  });
  const [gstEnabled, setGstEnabled] = useState(true);

  useEffect(() => {
    fetchMenuItems();
    fetchCategories();
    fetchGstSetting();
  }, []);

  const fetchGstSetting = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get('/api/settings', { headers: { Authorization: `Bearer ${token}` } });
      const enabled = String(res.data?.gst_enabled ?? 'true').toLowerCase() === 'true';
      setGstEnabled(enabled);
    } catch (e) {
      setGstEnabled(true);
    }
  };

  const fetchMenuItems = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/menu?include_unavailable=true', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMenuItems(response.data);
    } catch (error) {
      console.error('Error fetching menu:', error);
      toast.error('Failed to fetch menu items');
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/categories', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCategories(response.data);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const handleAddItem = async (e) => {
    e.preventDefault();
    
    // Check file size before upload
    if (formData.image && formData.image.size > 10 * 1024 * 1024) {
      toast.error('Image size must be less than 10MB. Please compress your image.');
      return;
    }
    
    try {
      const token = localStorage.getItem('token');
      const data = new FormData();
      
      const payload = { ...formData };
      if (!gstEnabled) {
        delete payload.gst_applicable;
        delete payload.gst_rate;
      }
      Object.keys(payload).forEach(key => {
        if (payload[key] !== null && payload[key] !== '') {
          data.append(key, payload[key]);
        }
      });

      await axios.post('/api/menu', data, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });

      toast.success('Menu item added successfully!');
      setShowAddModal(false);
      resetForm();
      fetchMenuItems();
    } catch (error) {
      console.error('Error adding item:', error);
      const errorMsg = error.response?.data?.error || 'Failed to add menu item';
      if (errorMsg.includes('File too large')) {
        toast.error('Image is too large! Please use an image smaller than 10MB.');
      } else {
        toast.error(errorMsg);
      }
    }
  };

  const handleEditItem = async (e) => {
    e.preventDefault();
    
    try {
      const token = localStorage.getItem('token');
      const data = new FormData();
      
      const payload = { ...formData };
      if (!gstEnabled) {
        delete payload.gst_applicable;
        delete payload.gst_rate;
      }
      Object.keys(payload).forEach(key => {
        if (payload[key] !== null && payload[key] !== '') {
          data.append(key, payload[key]);
        }
      });

      await axios.put(`/api/menu/${currentItem.id}`, data, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });

      toast.success('Menu item updated successfully!');
      setShowEditModal(false);
      resetForm();
      fetchMenuItems();
    } catch (error) {
      console.error('Error updating item:', error);
      toast.error('Failed to update menu item');
    }
  };

  const handleDeleteItem = async (itemId, itemName) => {
    if (!window.confirm(`Delete "${itemName}"? This cannot be undone.`)) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      await axios.delete(`/api/menu/${itemId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      toast.success('Menu item deleted successfully!');
      fetchMenuItems();
    } catch (error) {
      console.error('Error deleting item:', error);
      toast.error('Failed to delete menu item');
    }
  };

  const toggleAvailability = async (item) => {
    // Find current item in state to get most up-to-date value
    const currentItem = menuItems.find(i => i.id === item.id) || item;
    const currentStatus = currentItem.is_available === true || currentItem.is_available === 1 || currentItem.is_available === '1';
    const newStatus = currentStatus ? 0 : 1;
    
    console.log('Toggling availability:', { 
      itemId: item.id, 
      currentStatus, 
      newStatus, 
      raw: currentItem.is_available,
      fromState: currentItem.is_available 
    });
    
    // Update local state immediately for instant feedback
    setMenuItems(prevItems => 
      prevItems.map(prevItem => 
        prevItem.id === item.id 
          ? { ...prevItem, is_available: newStatus }
          : prevItem
      )
    );
    
    try {
      const token = localStorage.getItem('token');
      
      const response = await axios.put(`/api/menu/${item.id}`, {
        is_available: newStatus
      }, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      toast.success(currentStatus ? 'Item marked as out of stock' : 'Item marked as available');
      
      // Update state from server response (don't refresh all items to avoid race conditions)
      // The optimistic update already set it correctly, but ensure it matches server
      setMenuItems(prevItems => 
        prevItems.map(prevItem => 
          prevItem.id === item.id 
            ? { ...prevItem, is_available: newStatus }
            : prevItem
        )
      );
    } catch (error) {
      console.error('Error toggling availability:', error);
      console.error('Error response:', error.response?.data);
      
      // Revert optimistic update on error - restore original status
      setMenuItems(prevItems => 
        prevItems.map(prevItem => 
          prevItem.id === item.id 
            ? { ...prevItem, is_available: currentStatus ? 1 : 0 }
            : prevItem
        )
      );
      
      toast.error('Failed to update availability: ' + (error.response?.data?.error || error.message));
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      price: '',
      category: '',
      preparation_time: '',
      stock_quantity: '',
      low_stock_threshold: '10',
      image: null
    });
    setImagePreview(null);
    setCurrentItem(null);
  };

  const openEditModal = (item) => {
    setCurrentItem(item);
    setFormData({
      name: item.name,
      description: item.description,
      price: item.price,
      category: item.category,
      preparation_time: item.preparation_time,
      stock_quantity: item.stock_quantity,
      low_stock_threshold: item.low_stock_threshold,
      image: null
    });
    setImagePreview(item.image_url ? `${API_BASE_URL}${item.image_url}` : null);
    setShowEditModal(true);
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData({ ...formData, image: file });
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleAddCategory = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      await axios.post('/api/categories', categoryFormData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Category added successfully!');
      setShowCategoryModal(false);
      setCategoryFormData({ id: null, name: '', description: '' });
      fetchCategories();
    } catch (error) {
      console.error('Error adding category:', error);
      toast.error('Failed to add category');
    }
  };

  const handleEditCategory = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      await axios.put(`/api/categories/${categoryFormData.id}`, categoryFormData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Category updated successfully!');
      setShowCategoryModal(false);
      setCategoryFormData({ id: null, name: '', description: '' });
      fetchCategories();
    } catch (error) {
      console.error('Error updating category:', error);
      toast.error('Failed to update category');
    }
  };

  const handleDeleteCategory = async (categoryId, categoryName) => {
    if (!window.confirm(`Delete category "${categoryName}"?`)) {
      return;
    }
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`/api/categories/${categoryId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Category deleted successfully!');
      fetchCategories();
      fetchMenuItems();
    } catch (error) {
      console.error('Error deleting category:', error);
      toast.error('Failed to delete category');
    }
  };

  const openCategoryModal = (category = null) => {
    if (category) {
      setCategoryFormData({
        id: category.id,
        name: category.name,
        description: category.description || ''
      });
    } else {
      setCategoryFormData({ id: null, name: '', description: '' });
    }
    setShowCategoryModal(true);
  };

  const getFilteredAndSortedItems = () => {
    let filtered = menuItems;
    
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(item => item.category === selectedCategory);
    }
    
    const sorted = [...filtered].sort((a, b) => {
      if (sortBy === 'name') {
        return a.name.localeCompare(b.name);
      } else if (sortBy === 'price') {
        return parseFloat(a.price) - parseFloat(b.price);
      } else if (sortBy === 'stock') {
        return (b.stock_quantity || 0) - (a.stock_quantity || 0);
      }
      return 0;
    });
    
    return sorted;
  };

  const totalItems = menuItems.length;
  const activeItems = menuItems.filter(item => item.is_available).length;
  const outOfStockItems = menuItems.filter(item => !item.is_available).length;
  const filteredItems = getFilteredAndSortedItems();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Menu Management</h1>
            <p className="text-gray-600 mt-1">Manage menu items, prices, and availability</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => openCategoryModal()}
              className="px-6 py-3 rounded-xl text-white bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 shadow-lg hover:shadow-xl transition flex items-center gap-2"
            >
              <FiFolder /> Categories
            </button>
            <button
              onClick={() => {
                resetForm();
                setShowAddModal(true);
              }}
              className="px-6 py-3 rounded-xl text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg hover:shadow-xl transition flex items-center gap-2"
            >
              <FiPlus /> Add Item
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-xl shadow-lg p-5 border-l-4 border-blue-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Items</p>
                <p className="text-3xl font-bold text-gray-900">{totalItems}</p>
              </div>
              <div className="bg-blue-100 p-3 rounded-lg">
                <FiPackage className="text-blue-600 text-2xl" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-5 border-l-4 border-green-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Active Items</p>
                <p className="text-3xl font-bold text-green-600">{activeItems}</p>
              </div>
              <div className="bg-green-100 p-3 rounded-lg">
                <FiCheckCircle className="text-green-600 text-2xl" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-5 border-l-4 border-red-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Out of Stock</p>
                <p className="text-3xl font-bold text-red-600">{outOfStockItems}</p>
              </div>
              <div className="bg-red-100 p-3 rounded-lg">
                <FiAlertCircle className="text-red-600 text-2xl" />
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <FiFilter className="text-gray-600" />
              <span className="text-sm font-semibold text-gray-700">Filter:</span>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setSelectedCategory('all')}
                className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${
                  selectedCategory === 'all'
                    ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                All ({totalItems})
              </button>
              {categories.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.name)}
                  className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${
                    selectedCategory === cat.name
                      ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {cat.name} ({menuItems.filter(item => item.category === cat.name).length})
                </button>
              ))}
            </div>
            
            <div className="ml-auto flex items-center gap-2">
              <span className="text-sm font-semibold text-gray-700">Sort:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-4 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm font-semibold"
              >
                <option value="name">Name</option>
                <option value="price">Price</option>
                <option value="stock">Stock</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredItems.map(item => (
          <div 
            key={item.id}
            className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-2xl transition-all border border-gray-100"
          >
            <div className="relative aspect-[4/3] bg-gray-100">
              {item.image_url ? (
                <img 
                  src={`${API_BASE_URL}${item.image_url}`}
                  alt={item.name}
                  className="w-full h-full object-cover"
                  crossOrigin="anonymous"
                  onError={(e) => {
                    console.error('❌ Image load error:', item.image_url);
                    console.error('   Full URL tried:', e.target.src);
                    console.error('   Status:', e.target.complete ? 'Loaded but invalid' : 'Failed to load');
                    e.target.style.display = 'none';
                    e.target.parentElement.innerHTML = '<div class="w-full h-full flex items-center justify-center text-gray-400 text-5xl">🍽️</div><div class="absolute top-2 right-2"></div>';
                  }}
                  onLoad={() => {
                    console.log('✅ Image loaded successfully:', item.image_url);
                    console.log('   Full URL:', `${API_BASE_URL}${item.image_url}`);
                  }}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400 text-5xl">
                  🍽️
                </div>
              )}
              
              <div className="absolute top-2 right-2">
                {(() => {
                  const isAvailable = item.is_available === true || item.is_available === 1 || item.is_available === '1';
                  return isAvailable ? (
                    <span className="bg-green-500 text-white px-3 py-1 rounded-full text-xs font-semibold shadow-lg">
                      Available
                    </span>
                  ) : (
                    <span className="bg-red-500 text-white px-3 py-1 rounded-full text-xs font-semibold shadow-lg">
                      Out of Stock
                    </span>
                  );
                })()}
              </div>
            </div>

            <div className="p-4">
              <div className="mb-2">
                <h3 className="font-bold text-lg text-gray-900 truncate">{item.name}</h3>
                <p className="text-sm text-gray-500 truncate">{item.description}</p>
              </div>

              <div className="flex items-center justify-between mb-3">
                <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full font-semibold">
                  {item.category}
                </span>
                <span className="text-xl font-bold text-green-600">
                  {formatCurrency(item.price)}
                </span>
              </div>

              <div className="flex items-center justify-between text-xs text-gray-600 mb-4">
                <span>Stock: {item.stock_quantity || 0}</span>
                <span>Prep: {item.preparation_time}min</span>
              </div>

              <div className="mb-3 pb-3 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-gray-700">Availability</span>
                  {(() => {
                    const isAvailable = item.is_available === true || item.is_available === 1 || item.is_available === '1';
                    return (
                      <button
                        onClick={() => toggleAvailability(item)}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                          isAvailable 
                            ? 'bg-green-500 focus:ring-green-500' 
                            : 'bg-gray-300 focus:ring-gray-400'
                        }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            isAvailable ? 'translate-x-6' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    );
                  })()}
                </div>
                {(() => {
                  const isAvailable = item.is_available === true || item.is_available === 1 || item.is_available === '1';
                  return (
                    <span className={`text-xs font-medium ${isAvailable ? 'text-green-600' : 'text-gray-500'}`}>
                      {isAvailable ? '● In Stock' : '● Out of Stock'}
                    </span>
                  );
                })()}
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => openEditModal(item)}
                  className="px-4 py-2.5 rounded-lg bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:from-blue-600 hover:to-blue-700 transition-all shadow-sm hover:shadow-md flex items-center justify-center gap-2 text-sm font-semibold"
                >
                  <FiEdit size={16} />
                  Edit
                </button>
                <button
                  onClick={() => handleDeleteItem(item.id, item.name)}
                  className="px-4 py-2.5 rounded-lg bg-gradient-to-r from-red-500 to-red-600 text-white hover:from-red-600 hover:to-red-700 transition-all shadow-sm hover:shadow-md flex items-center justify-center gap-2 text-sm font-semibold"
                >
                  <FiTrash size={16} />
                  Delete
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredItems.length === 0 && (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">🍽️</div>
          <div className="text-xl font-semibold text-gray-700">No Items Found</div>
          <div className="text-sm text-gray-500 mt-2">Try different filter or add new items</div>
        </div>
      )}

      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-5 rounded-t-2xl flex justify-between items-center">
              <h2 className="text-2xl font-bold">Add New Menu Item</h2>
              <button onClick={() => { setShowAddModal(false); resetForm(); }} className="text-white hover:bg-white/20 rounded-lg p-2">
                <FiX size={24} />
              </button>
            </div>

            <form onSubmit={handleAddItem} className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Item Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., Margherita Pizza"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                    rows="2"
                    placeholder="Brief description..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Category *</label>
                  <select
                    required
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select Category</option>
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.name}>{cat.name}</option>
                    ))}
                  </select>
                </div>

                {gstEnabled && (
                  <>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">GST Applicable</label>
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={!!formData.gst_applicable}
                          onChange={(e) => setFormData({ ...formData, gst_applicable: e.target.checked })}
                          className="mr-2 h-4 w-4"
                        />
                        <span className="text-sm">Enable GST for this item</span>
                      </label>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">GST %</label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={formData.gst_rate || ''}
                        onChange={(e) => setFormData({ ...formData, gst_rate: e.target.value })}
                        className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                        placeholder="e.g., 5, 12, 18"
                        disabled={!formData.gst_applicable}
                      />
                    </div>
                  </>
                )}

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Price *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="0.00"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Prep Time (min)</label>
                  <input
                    type="number"
                    value={formData.preparation_time}
                    onChange={(e) => setFormData({ ...formData, preparation_time: e.target.value })}
                    className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="15"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Stock</label>
                  <input
                    type="number"
                    value={formData.stock_quantity}
                    onChange={(e) => setFormData({ ...formData, stock_quantity: e.target.value })}
                    className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="50"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Photo <span className="text-xs text-gray-500">(Max 10MB - JPG, PNG, GIF, WEBP)</span>
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                  {formData.image && (
                    <p className="text-xs text-gray-600 mt-1">
                      Selected: {formData.image.name} ({(formData.image.size / 1024 / 1024).toFixed(2)} MB)
                      {formData.image.size > 10 * 1024 * 1024 && (
                        <span className="text-red-600 font-bold ml-2">⚠️ Too large! Must be under 10MB</span>
                      )}
                    </p>
                  )}
                  {imagePreview && (
                    <div className="mt-3">
                      <img src={imagePreview} alt="Preview" className="h-32 w-32 object-cover rounded-lg border-2 border-blue-200" />
                    </div>
                  )}
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  type="submit"
                  className="flex-1 px-6 py-3 rounded-xl text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg transition font-semibold"
                >
                  Add Item
                </button>
                <button
                  type="button"
                  onClick={() => { setShowAddModal(false); resetForm(); }}
                  className="px-6 py-3 rounded-xl border-2 border-gray-300 text-gray-700 hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showEditModal && currentItem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="bg-gradient-to-r from-green-600 to-emerald-600 text-white px-6 py-5 rounded-t-2xl flex justify-between items-center">
              <h2 className="text-2xl font-bold">Edit Menu Item</h2>
              <button onClick={() => { setShowEditModal(false); resetForm(); }} className="text-white hover:bg-white/20 rounded-lg p-2">
                <FiX size={24} />
              </button>
            </div>

            <form onSubmit={handleEditItem} className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Item Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500"
                    rows="2"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Category *</label>
                  <select
                    required
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500"
                  >
                    <option value="">Select Category</option>
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.name}>{cat.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Price *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Prep Time (min)</label>
                  <input
                    type="number"
                    value={formData.preparation_time}
                    onChange={(e) => setFormData({ ...formData, preparation_time: e.target.value })}
                    className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Stock</label>
                  <input
                    type="number"
                    value={formData.stock_quantity}
                    onChange={(e) => setFormData({ ...formData, stock_quantity: e.target.value })}
                    className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Update Photo <span className="text-xs text-gray-500">(Max 10MB - JPG, PNG, GIF, WEBP)</span>
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500"
                  />
                  {formData.image && (
                    <p className="text-xs text-gray-600 mt-1">
                      Selected: {formData.image.name} ({(formData.image.size / 1024 / 1024).toFixed(2)} MB)
                      {formData.image.size > 10 * 1024 * 1024 && (
                        <span className="text-red-600 font-bold ml-2">⚠️ Too large! Must be under 10MB</span>
                      )}
                    </p>
                  )}
                  {imagePreview && (
                    <div className="mt-3">
                      <img src={imagePreview} alt="Preview" className="h-32 w-32 object-cover rounded-lg border-2 border-green-200" />
                    </div>
                  )}
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  type="submit"
                  className="flex-1 px-6 py-3 rounded-xl text-white bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 shadow-lg transition font-semibold"
                >
                  Save Changes
                </button>
                <button
                  type="button"
                  onClick={() => { setShowEditModal(false); resetForm(); }}
                  className="px-6 py-3 rounded-xl border-2 border-gray-300 text-gray-700 hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showCategoryModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-4xl shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-5 rounded-t-2xl flex justify-between items-center">
              <h2 className="text-2xl font-bold">Manage Categories</h2>
              <button onClick={() => {
                setShowCategoryModal(false);
                setCategoryFormData({ id: null, name: '', description: '' });
              }} className="text-white hover:bg-white/20 rounded-lg p-2">
                <FiX size={24} />
              </button>
            </div>

            <div className="p-6">
              <form onSubmit={categoryFormData.id ? handleEditCategory : handleAddCategory} className="mb-6 bg-gray-50 rounded-xl p-4 border-2 border-purple-200">
                <h3 className="text-lg font-bold text-gray-900 mb-4">
                  {categoryFormData.id ? 'Edit Category' : 'Add New Category'}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Category Name *</label>
                    <input
                      type="text"
                      required
                      value={categoryFormData.name}
                      onChange={(e) => setCategoryFormData({ ...categoryFormData, name: e.target.value })}
                      className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500"
                      placeholder="e.g., Appetizers"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Description</label>
                    <input
                      type="text"
                      value={categoryFormData.description}
                      onChange={(e) => setCategoryFormData({ ...categoryFormData, description: e.target.value })}
                      className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500"
                      placeholder="Brief description"
                    />
                  </div>
                </div>
                <div className="flex gap-3 mt-4">
                  <button
                    type="submit"
                    className="px-6 py-2 rounded-lg text-white bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 shadow-md transition font-semibold"
                  >
                    {categoryFormData.id ? 'Update' : 'Add Category'}
                  </button>
                  {categoryFormData.id && (
                    <button
                      type="button"
                      onClick={() => setCategoryFormData({ id: null, name: '', description: '' })}
                      className="px-6 py-2 rounded-lg border-2 border-gray-300 text-gray-700 hover:bg-gray-50 transition"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </form>

              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-4">Existing Categories</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {categories.map(cat => (
                    <div key={cat.id} className="bg-white border-2 border-gray-200 rounded-xl p-4 hover:shadow-md transition">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-bold text-gray-900 text-lg">{cat.name}</h4>
                          {cat.description && (
                            <p className="text-sm text-gray-600 mt-1">{cat.description}</p>
                          )}
                          <p className="text-xs text-gray-500 mt-2">
                            {menuItems.filter(item => item.category === cat.name).length} items
                          </p>
                        </div>
                        <div className="flex gap-2 ml-4">
                          <button
                            onClick={() => openCategoryModal(cat)}
                            className="p-2 rounded-lg bg-blue-100 text-blue-600 hover:bg-blue-200 transition"
                          >
                            <FiEdit size={18} />
                          </button>
                          <button
                            onClick={() => handleDeleteCategory(cat.id, cat.name)}
                            className="p-2 rounded-lg bg-red-100 text-red-600 hover:bg-red-200 transition"
                          >
                            <FiTrash size={18} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                {categories.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <FiFolder className="mx-auto text-4xl mb-2" />
                    <p>No categories yet</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MenuManager;
