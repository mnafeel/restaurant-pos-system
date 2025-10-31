import React, { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { FaSave, FaCog, FaPrint, FaStore, FaTags, FaEdit, FaTrash, FaPalette } from 'react-icons/fa';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';

const Settings = () => {
  const { user } = useAuth();
  const { themeMode, changeTheme } = useTheme();
  const [settings, setSettings] = useState({});
  const [shopData, setShopData] = useState(null);
  const [taxes, setTaxes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('shop');
  const [showAddTax, setShowAddTax] = useState(false);
  const [showEditTax, setShowEditTax] = useState(false);
  const [currentTax, setCurrentTax] = useState(null);
  const [newTax, setNewTax] = useState({
    name: '',
    rate: '',
    is_inclusive: false
  });

  useEffect(() => {
    if (user) {
      fetchSettings();
      fetchTaxes();
      if (user?.shop_id) {
        fetchShopData();
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const fetchSettings = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/settings', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSettings(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching settings:', error);
      toast.error('Failed to fetch settings');
      setLoading(false);
    }
  };

  const fetchShopData = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`/api/shops/${user.shop_id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setShopData(response.data);
    } catch (error) {
      console.error('Error fetching shop data:', error);
    }
  };

  const fetchTaxes = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/taxes', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTaxes(response.data);
    } catch (error) {
      console.error('Error fetching taxes:', error);
    }
  };

  const handleUpdateSetting = (key, value) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const apiBase = process.env.REACT_APP_API_URL || axios.defaults.baseURL || '';

  const handleSaveSettings = async () => {
    try {
      const token = localStorage.getItem('token');
      // 1) If shop-scoped, save shop info directly on shop record
      if (user?.shop_id && shopData) {
        const payload = {
          name: shopData.name || '',
          phone: shopData.phone || '',
          address: shopData.address || '',
          email: shopData.email || '',
          currency: shopData.currency || 'INR'
        };
        await axios.put(`${apiBase}/api/shops/${user.shop_id}`, payload, {
          headers: { Authorization: `Bearer ${token}` }
        });
      }
      // 2) Save feature toggles and other system settings (non-blocking)
      try {
        await axios.post(`${apiBase}/api/settings/bulk`, settings, {
          headers: { Authorization: `Bearer ${token}` }
        });
      } catch (bulkErr) {
        console.warn('Settings bulk save failed (non-blocking):', bulkErr);
        // Don't fail the whole save if feature toggles endpoint is temporarily unavailable
      }
      
      // Refresh local shop info and currency display
      if (user?.shop_id) await fetchShopData();
      window.dispatchEvent(new Event('currencyChanged'));
      window.dispatchEvent(new Event('shopUpdated'));
      
      toast.success('Settings saved successfully');
    } catch (error) {
      console.error('Save settings error:', error);
      toast.error('Failed to save settings');
    }
  };

  // ========= Backup/Restore/Reset =========
  const handleBackup = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`/api/shops/${user.shop_id}/backup`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const blob = new Blob([JSON.stringify(res.data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `shop-${user.shop_id}-backup.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('Backup downloaded');
    } catch (e) {
      toast.error(e.response?.data?.error || 'Backup failed');
    }
  };

  const handleRestore = async (file) => {
    try {
      const token = localStorage.getItem('token');
      const text = await file.text();
      const data = JSON.parse(text);
      await axios.post(`/api/shops/${user.shop_id}/restore`, data, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Restore completed');
    } catch (e) {
      toast.error(e.response?.data?.error || 'Restore failed');
    }
  };

  const handleReset = async () => {
    if (!window.confirm('This will delete categories, menu items, taxes, tables, orders and bills for this shop. Continue?')) return;
    try {
      const token = localStorage.getItem('token');
      await axios.post(`/api/shops/${user.shop_id}/reset`, { confirm: `RESET-${user.shop_id}` }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Shop data reset completed');
    } catch (e) {
      toast.error(e.response?.data?.error || 'Reset failed');
    }
  };

  const handleAddTax = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      await axios.post('/api/taxes', newTax, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      toast.success('Tax added successfully');
      setShowAddTax(false);
      setNewTax({ name: '', rate: '', is_inclusive: false });
      fetchTaxes();
    } catch (error) {
      toast.error('Failed to add tax');
    }
  };

  const handleUpdateTax = async (taxId, updates) => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(`/api/taxes/${taxId}`, updates, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      toast.success('Tax updated successfully');
      fetchTaxes();
    } catch (error) {
      toast.error('Failed to update tax');
    }
  };

  const handleEditTax = (tax) => {
    setCurrentTax(tax);
    setShowEditTax(true);
  };

  const handleUpdateTaxSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      await axios.put(`/api/taxes/${currentTax.id}`, {
        name: currentTax.name,
        rate: parseFloat(currentTax.rate),
        is_inclusive: currentTax.is_inclusive
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      toast.success('Tax updated successfully');
      setShowEditTax(false);
      setCurrentTax(null);
      fetchTaxes();
    } catch (error) {
      toast.error('Failed to update tax');
    }
  };

  const handleDeleteTax = async (taxId, taxName) => {
    if (!window.confirm(`Are you sure you want to delete the tax "${taxName}"? This action cannot be undone.`)) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      await axios.delete(`/api/taxes/${taxId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      toast.success('Tax deleted successfully');
      fetchTaxes();
    } catch (error) {
      toast.error('Failed to delete tax');
    }
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
        <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
        
        <button
          onClick={handleSaveSettings}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center"
        >
          <FaSave className="mr-2" />
          Save All Changes
        </button>
      </div>

      {/* Tabs */}
      <div className="mb-6 border-b border-gray-200">
        <nav className="flex space-x-8">
          <button
            onClick={() => setActiveTab('shop')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'shop'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <FaStore className="inline mr-2" />
            Shop Info
          </button>
          
          <button
            onClick={() => setActiveTab('taxes')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'taxes'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <FaTags className="inline mr-2" />
            Taxes & Charges
          </button>
          
          <button
            onClick={() => setActiveTab('printer')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'printer'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <FaPrint className="inline mr-2" />
            Printer Config
          </button>
          
          <button
            onClick={() => setActiveTab('general')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'general'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <FaCog className="inline mr-2" />
            General
          </button>

          <button
            onClick={() => setActiveTab('maintenance')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'maintenance'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <FaCog className="inline mr-2" />
            Maintenance
          </button>

          <button
            onClick={() => setActiveTab('appearance')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'appearance'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <FaPalette className="inline mr-2" />
            Appearance
          </button>
        </nav>
      </div>

      {/* Shop Info Tab */}
      {activeTab === 'shop' && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Shop Information</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Shop Name
              </label>
              <input
                type="text"
                value={shopData?.name || ''}
                onChange={(e) => setShopData(prev => ({ ...(prev||{}), name: e.target.value }))}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Phone
              </label>
              <input
                type="text"
                value={shopData?.phone || ''}
                onChange={(e) => setShopData(prev => ({ ...(prev||{}), phone: e.target.value }))}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Address
              </label>
              <textarea
                value={shopData?.address || ''}
                onChange={(e) => setShopData(prev => ({ ...(prev||{}), address: e.target.value }))}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                rows="3"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <input
                type="email"
                value={shopData?.email || ''}
                onChange={(e) => setShopData(prev => ({ ...(prev||{}), email: e.target.value }))}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Shop Currency {user?.shop_id && '(Updates Your Shop)'}
              </label>
              <select
                value={shopData?.currency || 'INR'}
                onChange={async (e) => {
                  const newCurrency = e.target.value;
                  if (user?.shop_id) {
                    // Update shop currency
                    try {
                      await axios.put(`/api/shops/${user.shop_id}`, { currency: newCurrency });
                      toast.success('Shop currency updated!');
                      fetchShopData();
                      window.dispatchEvent(new Event('currencyChanged'));
                    } catch (error) {
                      toast.error('Failed to update currency');
                    }
                  } else {
                    // Fallback to global settings for users without shop
                    handleUpdateSetting('currency_symbol', newCurrency);
                  }
                }}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="INR">₹ INR - Indian Rupee</option>
                <option value="USD">$ USD - US Dollar</option>
                <option value="EUR">€ EUR - Euro</option>
                <option value="GBP">£ GBP - British Pound</option>
                <option value="JPY">¥ JPY - Japanese Yen</option>
                <option value="CNY">¥ CNY - Chinese Yuan</option>
                <option value="PKR">₨ PKR - Pakistani Rupee</option>
                <option value="BDT">৳ BDT - Bangladeshi Taka</option>
                <option value="LKR">රු LKR - Sri Lankan Rupee</option>
                <option value="PHP">₱ PHP - Philippine Peso</option>
                <option value="THB">฿ THB - Thai Baht</option>
                <option value="VND">₫ VND - Vietnamese Dong</option>
                <option value="KRW">₩ KRW - South Korean Won</option>
                <option value="BRL">R$ BRL - Brazilian Real</option>
                <option value="ZAR">R ZAR - South African Rand</option>
                <option value="RUB">₽ RUB - Russian Ruble</option>
                <option value="TRY">₺ TRY - Turkish Lira</option>
                <option value="SAR">﷼ SAR - Saudi Riyal</option>
                <option value="AED">د.إ AED - UAE Dirham</option>
                <option value="MYR">RM MYR - Malaysian Ringgit</option>
                <option value="SGD">S$ SGD - Singapore Dollar</option>
                <option value="HKD">HK$ HKD - Hong Kong Dollar</option>
                <option value="AUD">A$ AUD - Australian Dollar</option>
                <option value="CAD">C$ CAD - Canadian Dollar</option>
                <option value="CHF">CHF CHF - Swiss Franc</option>
                <option value="KES">Ksh KES - Kenyan Shilling</option>
                <option value="NGN">₦ NGN - Nigerian Naira</option>
              </select>
              <p className="text-sm text-gray-500 mt-1">
                {user?.shop_id 
                  ? '💡 This updates your shop\'s default currency. Changes apply immediately to all pages.'
                  : 'This currency will be used throughout the system for pricing and billing'}
              </p>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Receipt Header
              </label>
              <input
                type="text"
                value={settings.receipt_header || ''}
                onChange={(e) => handleUpdateSetting('receipt_header', e.target.value)}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Receipt Footer
              </label>
              <input
                type="text"
                value={settings.receipt_footer || ''}
                onChange={(e) => handleUpdateSetting('receipt_footer', e.target.value)}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>
      )}

      {/* Taxes Tab */}
      {activeTab === 'taxes' && (
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Taxes & Charges</h2>
            
            <button
              onClick={() => setShowAddTax(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Add Tax
            </button>
          </div>

          {/* GST Global Toggle */}
          <div className="mb-6 p-4 border rounded-lg bg-gray-50 flex items-center justify-between">
            <div>
              <div className="font-medium">Enable GST</div>
              <div className="text-sm text-gray-600">Turn GST calculation on or off globally</div>
            </div>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={(settings.gst_enabled || 'true') === 'true'}
                onChange={(e) => handleUpdateSetting('gst_enabled', e.target.checked ? 'true' : 'false')}
                className="mr-2 h-4 w-4"
              />
              <span className="text-sm">GST Enabled</span>
            </label>
          </div>

          <div className="space-y-4">
            {taxes.map(tax => (
              <div key={tax.id} className="flex items-center justify-between p-4 border rounded-lg hover:border-blue-300 transition-colors">
                <div className="flex-1">
                  <div className="font-medium text-lg">{tax.name}</div>
                  <div className="text-sm text-gray-600 mt-1">
                    Rate: {tax.rate}% {tax.is_inclusive ? '(Inclusive)' : '(Exclusive)'}
                  </div>
                </div>
                
                <div className="flex items-center space-x-4">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={tax.is_active}
                      onChange={(e) => handleUpdateTax(tax.id, { is_active: e.target.checked })}
                      className="mr-2 h-4 w-4"
                    />
                    <span className="text-sm">Active</span>
                  </label>
                  
                  <button
                    onClick={() => handleEditTax(tax)}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                    title="Edit Tax"
                  >
                    <FaEdit size={18} />
                  </button>
                  
                  <button
                    onClick={() => handleDeleteTax(tax.id, tax.name)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded transition-colors"
                    title="Delete Tax"
                  >
                    <FaTrash size={18} />
                  </button>
                </div>
              </div>
            ))}

            {/* Service Charge */}
            <div className="p-4 border rounded-lg bg-gray-50">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Service Charge (%)
              </label>
              <input
                type="number"
                value={settings.service_charge_rate || 5}
                onChange={(e) => handleUpdateSetting('service_charge_rate', e.target.value)}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                step="0.01"
              />
            </div>
          </div>

          {/* Add Tax Modal */}
          {showAddTax && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg p-6 w-full max-w-md">
                <h2 className="text-2xl font-bold mb-4">Add New Tax</h2>
                
                <form onSubmit={handleAddTax}>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Tax Name
                    </label>
                    <input
                      type="text"
                      value={newTax.name}
                      onChange={(e) => setNewTax({ ...newTax, name: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="e.g., VAT, GST, Sales Tax"
                      required
                    />
                  </div>

                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Rate (%)
                    </label>
                    <input
                      type="number"
                      value={newTax.rate}
                      onChange={(e) => setNewTax({ ...newTax, rate: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                      step="0.01"
                      min="0"
                      max="100"
                      placeholder="e.g., 10.00"
                      required
                    />
                  </div>

                  <div className="mb-4">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={newTax.is_inclusive}
                        onChange={(e) => setNewTax({ ...newTax, is_inclusive: e.target.checked })}
                        className="mr-2 h-4 w-4"
                      />
                      <span className="text-sm">
                        Inclusive Tax (already included in item price)
                      </span>
                    </label>
                  </div>

                  <div className="flex justify-end space-x-3">
                    <button
                      type="button"
                      onClick={() => setShowAddTax(false)}
                      className="px-4 py-2 border rounded-lg hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                      Add Tax
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Edit Tax Modal */}
          {showEditTax && currentTax && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg p-6 w-full max-w-md">
                <h2 className="text-2xl font-bold mb-4">Edit Tax</h2>
                
                <form onSubmit={handleUpdateTaxSubmit}>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Tax Name
                    </label>
                    <input
                      type="text"
                      value={currentTax.name}
                      onChange={(e) => setCurrentTax({ ...currentTax, name: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>

                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Rate (%)
                    </label>
                    <input
                      type="number"
                      value={currentTax.rate}
                      onChange={(e) => setCurrentTax({ ...currentTax, rate: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                      step="0.01"
                      min="0"
                      max="100"
                      required
                    />
                  </div>

                  <div className="mb-4">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={currentTax.is_inclusive}
                        onChange={(e) => setCurrentTax({ ...currentTax, is_inclusive: e.target.checked })}
                        className="mr-2 h-4 w-4"
                      />
                      <span className="text-sm">
                        Inclusive Tax (already included in item price)
                      </span>
                    </label>
                  </div>

                  <div className="flex justify-end space-x-3">
                    <button
                      type="button"
                      onClick={() => {
                        setShowEditTax(false);
                        setCurrentTax(null);
                      }}
                      className="px-4 py-2 border rounded-lg hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                      Update Tax
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Printer Tab */}
      {activeTab === 'printer' && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <FaPrint className="text-blue-600" />
            Printer Configuration
          </h2>
          
          {/* Auto-Print Setting - Prominent (Toggle) */}
          <div className="mb-8 p-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border-2 border-blue-200">
            <div className="flex items-center justify-between">
              <div className="mr-4">
                <span className="text-lg font-bold text-gray-900 block mb-1">
                  🖨️ Auto-Print Bills After Payment
                </span>
                <p className="text-sm text-gray-700">
                  <strong>ON:</strong> Bills automatically print after payment (no popup). 
                  <strong>OFF:</strong> Bills don't print.
                </p>
                <div className="mt-2 flex gap-4 text-xs">
                  <span className="px-2 py-1 bg-green-100 text-green-700 rounded">⚡ Faster checkout</span>
                  <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded">🏃 Busy hours</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => handleUpdateSetting('auto_print_bill', (settings.auto_print_bill || 'false') === 'true' ? 'false' : 'true')}
                aria-pressed={(settings.auto_print_bill || 'false') === 'true'}
                className={`relative inline-flex h-7 w-14 items-center rounded-full transition-colors duration-200 ${(settings.auto_print_bill || 'false') === 'true' ? 'bg-green-500' : 'bg-gray-300'}`}
                title={(settings.auto_print_bill || 'false') === 'true' ? 'Turn off auto-print' : 'Turn on auto-print'}
              >
                <span
                  className={`inline-block h-6 w-6 transform rounded-full bg-white shadow transition-transform duration-200 ${(settings.auto_print_bill || 'false') === 'true' ? 'translate-x-7' : 'translate-x-1'}`}
                />
              </button>
            </div>
          </div>
          
          <h3 className="text-lg font-semibold mb-4 text-gray-700">Printer Hardware Settings</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Printer Type
              </label>
              <select
                value={settings.printer_type || 'network'}
                onChange={(e) => handleUpdateSetting('printer_type', e.target.value)}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="network">Network (IPP/TCP)</option>
                <option value="usb">USB</option>
              </select>
            </div>

            {settings.printer_type === 'network' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Printer IP Address
                  </label>
                  <input
                    type="text"
                    value={settings.printer_ip || ''}
                    onChange={(e) => handleUpdateSetting('printer_ip', e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="192.168.1.100"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Printer Port
                  </label>
                  <input
                    type="text"
                    value={settings.printer_port || '9100'}
                    onChange={(e) => handleUpdateSetting('printer_port', e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </>
            )}

            <div className="md:col-span-2 flex items-center justify-between py-2">
              <span className="text-sm font-medium text-gray-700">Auto-print bills on generation</span>
              <button
                type="button"
                onClick={() => handleUpdateSetting('auto_print_bill', (settings.auto_print_bill || 'false') === 'true' ? 'false' : 'true')}
                aria-pressed={(settings.auto_print_bill || 'false') === 'true'}
                className={`relative inline-flex h-6 w-12 items-center rounded-full transition-colors duration-200 ${(settings.auto_print_bill || 'false') === 'true' ? 'bg-green-500' : 'bg-gray-300'}`}
              >
                <span
                  className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform duration-200 ${(settings.auto_print_bill || 'false') === 'true' ? 'translate-x-7' : 'translate-x-1'}`}
                />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* General Tab */}
      {activeTab === 'general' && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">General Settings</h2>
          
          <div className="space-y-4">
            <div>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={settings.enable_table_management === 'true'}
                  onChange={(e) => handleUpdateSetting('enable_table_management', e.target.checked ? 'true' : 'false')}
                  className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <span className="ml-2 text-sm font-medium text-gray-700">Enable Table Management</span>
              </label>
              <p className="text-sm text-gray-500 ml-6 mt-1">
                When disabled, the Tables page will be hidden and orders won't require table selection
              </p>
            </div>

            <div>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={settings.enable_kds === 'true'}
                  onChange={(e) => handleUpdateSetting('enable_kds', e.target.checked ? 'true' : 'false')}
                  className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <span className="ml-2 text-sm font-medium text-gray-700">Enable Kitchen System</span>
              </label>
              <p className="text-sm text-gray-500 ml-6 mt-1">
                When disabled, the "Send to Kitchen" button and Kitchen Display page will be hidden
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Default Payment Method
              </label>
              <select
                value={settings.default_payment_method || 'Cash'}
                onChange={(e) => handleUpdateSetting('default_payment_method', e.target.value)}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="Cash">Cash</option>
                <option value="Card">Card</option>
                <option value="UPI">UPI</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Business Day Start Hour (24-hour format)
              </label>
              <select
                value={settings.business_day_start_hour || '6'}
                onChange={(e) => handleUpdateSetting('business_day_start_hour', e.target.value)}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="0">12:00 AM (Midnight)</option>
                <option value="1">1:00 AM</option>
                <option value="2">2:00 AM</option>
                <option value="3">3:00 AM</option>
                <option value="4">4:00 AM</option>
                <option value="5">5:00 AM</option>
                <option value="6">6:00 AM (Default)</option>
                <option value="7">7:00 AM</option>
                <option value="8">8:00 AM</option>
                <option value="9">9:00 AM</option>
                <option value="10">10:00 AM</option>
                <option value="11">11:00 AM</option>
                <option value="12">12:00 PM (Noon)</option>
              </select>
              <p className="text-sm text-gray-500 mt-1">
                Sales before this hour will count as the previous day. For example, if set to 6 AM, sales at 2:59 AM will show in yesterday's report.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Maintenance Tab */}
      {activeTab === 'maintenance' && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Maintenance</h2>
          <div className="p-4 border rounded-lg bg-yellow-50">
            <div className="font-semibold mb-2">Shop Data Backup & Restore</div>
            <div className="flex flex-wrap gap-3">
              <button onClick={handleBackup} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Download Backup</button>
              <label className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 cursor-pointer">
                Restore from File
                <input type="file" accept="application/json" className="hidden" onChange={(e) => e.target.files && e.target.files[0] && handleRestore(e.target.files[0])} />
              </label>
              <button onClick={handleReset} className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">Full Data Reset (Shop)</button>
            </div>
            <p className="text-xs text-gray-600 mt-2">Backup/restore includes categories, menu items, taxes, and tables for this shop. Reset removes these plus orders and bills.</p>
          </div>
        </div>
      )}

      {/* Appearance Tab - Theme Switcher */}
      {activeTab === 'appearance' && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <FaPalette className="text-blue-600" />
            Theme & Appearance
          </h2>
          
          <div className="space-y-6">
            {/* Theme Mode Selector */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Color Theme
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Dark Mode */}
                <button
                  onClick={() => {
                    changeTheme('dark');
                    toast.success('Dark theme applied!');
                  }}
                  className={`p-6 rounded-2xl border-2 transition-all duration-300 ${
                    themeMode === 'dark'
                      ? 'border-blue-500 bg-gradient-to-br from-gray-900 to-gray-800 shadow-lg shadow-blue-500/50'
                      : 'border-gray-200 bg-gradient-to-br from-gray-900 to-gray-800 hover:border-blue-300'
                  }`}
                >
                  <div className="text-center">
                    <div className="text-4xl mb-2">🌑</div>
                    <h3 className="font-bold text-white">Dark Mode</h3>
                    <p className="text-xs text-gray-400 mt-1">Elegant & Sophisticated</p>
                    <p className="text-xs text-gray-500 mt-2">Spotify-inspired dark gradients</p>
                  </div>
                </button>

                {/* Light Mode */}
                <button
                  onClick={() => {
                    changeTheme('light');
                    toast.success('Light theme applied!');
                  }}
                  className={`p-6 rounded-2xl border-2 transition-all duration-300 ${
                    themeMode === 'light'
                      ? 'border-blue-500 bg-gradient-to-br from-blue-50 to-indigo-50 shadow-lg shadow-blue-500/50'
                      : 'border-gray-200 bg-gradient-to-br from-blue-50 to-indigo-50 hover:border-blue-300'
                  }`}
                >
                  <div className="text-center">
                    <div className="text-4xl mb-2">☀️</div>
                    <h3 className="font-bold text-gray-900">Light Mode</h3>
                    <p className="text-xs text-gray-600 mt-1">Clean & Bright</p>
                    <p className="text-xs text-gray-500 mt-2">Soft pastel gradients</p>
                  </div>
                </button>

                {/* Gold Theme */}
                <button
                  onClick={() => {
                    changeTheme('gold');
                    toast.success('Gold theme applied!');
                  }}
                  className={`p-6 rounded-2xl border-2 transition-all duration-300 ${
                    themeMode === 'gold'
                      ? 'border-amber-500 bg-gradient-to-br from-amber-900 to-orange-900 shadow-lg shadow-amber-500/50'
                      : 'border-gray-200 bg-gradient-to-br from-amber-900 to-orange-900 hover:border-amber-300'
                  }`}
                >
                  <div className="text-center">
                    <div className="text-4xl mb-2">✨</div>
                    <h3 className="font-bold text-amber-50">Gold</h3>
                    <p className="text-xs text-amber-200 mt-1">Luxury & Premium</p>
                    <p className="text-xs text-amber-300 mt-2">Rich golden gradients</p>
                  </div>
                </button>

                {/* Teal Theme */}
                <button
                  onClick={() => {
                    changeTheme('teal');
                    toast.success('Teal theme applied!');
                  }}
                  className={`p-6 rounded-2xl border-2 transition-all duration-300 ${
                    themeMode === 'teal'
                      ? 'border-teal-500 bg-gradient-to-br from-teal-900 to-cyan-900 shadow-lg shadow-teal-500/50'
                      : 'border-gray-200 bg-gradient-to-br from-teal-900 to-cyan-900 hover:border-teal-300'
                  }`}
                >
                  <div className="text-center">
                    <div className="text-4xl mb-2">🌊</div>
                    <h3 className="font-bold text-teal-50">Teal</h3>
                    <p className="text-xs text-teal-200 mt-1">Ocean & Calm</p>
                    <p className="text-xs text-teal-300 mt-2">Refreshing teal tones</p>
                  </div>
                </button>

                {/* Cafe Theme */}
                <button
                  onClick={() => {
                    changeTheme('cafe');
                    toast.success('Cafe theme applied!');
                  }}
                  className={`p-6 rounded-2xl border-2 transition-all duration-300 ${
                    themeMode === 'cafe'
                      ? 'border-amber-700 bg-gradient-to-br from-[#3E2723] to-[#5D4037] shadow-lg shadow-amber-700/50'
                      : 'border-gray-200 bg-gradient-to-br from-[#3E2723] to-[#5D4037] hover:border-amber-500'
                  }`}
                >
                  <div className="text-center">
                    <div className="text-4xl mb-2">☕</div>
                    <h3 className="font-bold text-amber-50">Cafe</h3>
                    <p className="text-xs text-amber-200 mt-1">Warm & Cozy</p>
                    <p className="text-xs text-amber-300 mt-2">Coffee-inspired browns</p>
                  </div>
                </button>

                {/* Neon Green Theme */}
                <button
                  onClick={() => {
                    changeTheme('neon');
                    toast.success('Neon theme applied!');
                  }}
                  className={`p-6 rounded-2xl border-2 transition-all duration-300 ${
                    themeMode === 'neon'
                      ? 'border-emerald-500 bg-gradient-to-br from-[#022C22] to-[#065F46] shadow-lg shadow-emerald-500/50 ring-2 ring-emerald-500/30'
                      : 'border-gray-200 bg-gradient-to-br from-[#022C22] to-[#065F46] hover:border-emerald-400'
                  }`}
                >
                  <div className="text-center">
                    <div className="text-4xl mb-2">💚</div>
                    <h3 className="font-bold text-emerald-50">Neon Green</h3>
                    <p className="text-xs text-emerald-200 mt-1">Electric & Vibrant</p>
                    <p className="text-xs text-emerald-300 mt-2">Glowing green accents</p>
                  </div>
                </button>

                {/* Restaurant Photo Theme */}
                <button
                  onClick={() => {
                    changeTheme('restaurant');
                    toast.success('Restaurant photo theme applied!');
                  }}
                  className={`p-6 rounded-2xl border-2 transition-all duration-300 relative overflow-hidden ${
                    themeMode === 'restaurant'
                      ? 'border-orange-500 shadow-lg shadow-orange-500/50'
                      : 'border-gray-200 hover:border-orange-400'
                  }`}
                  style={{
                    backgroundImage: 'url(https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400)',
                    backgroundSize: 'cover',
                    backgroundPosition: 'center'
                  }}
                >
                  <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px]" />
                  <div className="text-center relative z-10">
                    <div className="text-4xl mb-2">🍽️</div>
                    <h3 className="font-bold text-white">Restaurant</h3>
                    <p className="text-xs text-gray-200 mt-1">Photo Background</p>
                    <p className="text-xs text-gray-300 mt-2">Live restaurant ambiance</p>
                  </div>
                </button>

                {/* Cozy Photo Theme */}
                <button
                  onClick={() => {
                    changeTheme('cozy');
                    toast.success('Cozy theme applied!');
                  }}
                  className={`p-6 rounded-2xl border-2 transition-all duration-300 relative overflow-hidden ${
                    themeMode === 'cozy'
                      ? 'border-amber-600 shadow-lg shadow-amber-600/50'
                      : 'border-gray-200 hover:border-amber-500'
                  }`}
                  style={{
                    backgroundImage: 'url(https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=400)',
                    backgroundSize: 'cover',
                    backgroundPosition: 'center'
                  }}
                >
                  <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px]" />
                  <div className="text-center relative z-10">
                    <div className="text-4xl mb-2">🕯️</div>
                    <h3 className="font-bold text-white">Cozy</h3>
                    <p className="text-xs text-gray-200 mt-1">Photo Background</p>
                    <p className="text-xs text-gray-300 mt-2">Warm cafe ambiance</p>
                  </div>
                </button>

                {/* Glassmorphism Theme */}
                <button
                  onClick={() => {
                    changeTheme('glass');
                    toast.success('Glass theme applied! ✨');
                  }}
                  className={`p-6 rounded-2xl border-2 transition-all duration-300 relative overflow-hidden ${
                    themeMode === 'glass'
                      ? 'border-sky-500 shadow-2xl shadow-sky-500/50'
                      : 'border-gray-200 hover:border-sky-400'
                  }`}
                  style={{
                    background: 'linear-gradient(135deg, rgba(224, 242, 254, 0.8) 0%, rgba(186, 230, 253, 0.8) 50%, rgba(125, 211, 252, 0.8) 100%)',
                    backdropFilter: 'blur(20px)'
                  }}
                >
                  <div className="text-center relative z-10">
                    <div className="text-4xl mb-2">💎</div>
                    <h3 className="font-bold text-gray-900">Glass</h3>
                    <p className="text-xs text-gray-700 mt-1">Frosted & Modern</p>
                    <p className="text-xs text-gray-600 mt-2">Transparent glassmorphism</p>
                  </div>
                </button>
              </div>
            </div>

            <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>✨ Premium Themes:</strong> Each theme changes the entire app's color palette. 
                Navigate between pages to see unique gradients for each section!
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Settings;

