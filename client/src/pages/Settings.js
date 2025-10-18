import React, { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { FaSave, FaCog, FaPrint, FaStore, FaTags, FaEdit, FaTrash } from 'react-icons/fa';
import { useAuth } from '../contexts/AuthContext';

const Settings = () => {
  const { user } = useAuth();
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
    fetchSettings();
    fetchTaxes();
    if (user?.shop_id) {
      fetchShopData();
    }
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

  const handleSaveSettings = async () => {
    try {
      const token = localStorage.getItem('token');
      await axios.post('/api/settings/bulk', settings, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Trigger currency change event to refresh currency display
      window.dispatchEvent(new Event('currencyChanged'));
      
      toast.success('Settings saved successfully');
    } catch (error) {
      toast.error('Failed to save settings');
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
                value={settings.shop_name || ''}
                onChange={(e) => handleUpdateSetting('shop_name', e.target.value)}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Phone
              </label>
              <input
                type="text"
                value={settings.shop_phone || ''}
                onChange={(e) => handleUpdateSetting('shop_phone', e.target.value)}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Address
              </label>
              <textarea
                value={settings.shop_address || ''}
                onChange={(e) => handleUpdateSetting('shop_address', e.target.value)}
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
                value={settings.shop_email || ''}
                onChange={(e) => handleUpdateSetting('shop_email', e.target.value)}
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
          <h2 className="text-xl font-semibold mb-4">Printer Configuration</h2>
          
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

            <div className="md:col-span-2">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={settings.auto_print_bill === 'true'}
                  onChange={(e) => handleUpdateSetting('auto_print_bill', e.target.checked ? 'true' : 'false')}
                  className="mr-2"
                />
                Auto-print bills on generation
              </label>
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
                  checked={settings.enable_kitchen_system === 'true'}
                  onChange={(e) => handleUpdateSetting('enable_kitchen_system', e.target.checked ? 'true' : 'false')}
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
          </div>
        </div>
      )}
    </div>
  );
};

export default Settings;

