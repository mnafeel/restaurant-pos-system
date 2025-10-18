import React, { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useCurrency } from '../contexts/CurrencyContext';
import { formatIndianDate, formatIndianDateOnly, formatIndianTimeOnly } from '../hooks/useServerTime';
import { 
  FiSearch, FiCalendar, FiFilter, FiPrinter, FiEdit, 
  FiTrash2, FiEye, FiX, FiChevronDown, FiDownload, FiPlus 
} from 'react-icons/fi';
import { FaPlus, FaMinus } from 'react-icons/fa';

const Bills = () => {
  const { formatCurrency, currency } = useCurrency();
  const [bills, setBills] = useState([]);
  const [filteredBills, setFilteredBills] = useState([]);
  const [selectedBill, setSelectedBill] = useState(null);
  const [showBillModal, setShowBillModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [editForm, setEditForm] = useState({
    discount_amount: 0,
    discount_type: 'fixed',
    discount_reason: '',
    service_charge: 0,
    tax_amount: 0
  });
  const [editItems, setEditItems] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  
  // Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [filterPeriod, setFilterPeriod] = useState('today'); // today, yesterday, week, month
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [sortBy, setSortBy] = useState('date_desc'); // date_desc, date_asc, amount_desc, amount_asc

  useEffect(() => {
    fetchBills();
    fetchMenu();
  }, []);

  useEffect(() => {
    filterAndSortBills();
  }, [bills, searchQuery, filterPeriod, dateFrom, dateTo, sortBy]);

  const fetchBills = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      console.log('Fetching bills...');
      const response = await axios.get('/api/bills', {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log('Bills response:', response.data);
      console.log('Number of bills:', response.data.length);
      setBills(response.data);
    } catch (error) {
      console.error('Error fetching bills:', error);
      console.error('Error details:', error.response?.data);
      toast.error('Failed to fetch bills');
    } finally {
      setLoading(false);
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
    }
  };

  const filterAndSortBills = () => {
    let filtered = [...bills];

    // Search by bill number, table, or customer
    if (searchQuery) {
      filtered = filtered.filter(bill => 
        bill.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        bill.table_number?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        bill.customer_name?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Filter by period
    const now = new Date();
    if (filterPeriod === 'today') {
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      filtered = filtered.filter(bill => new Date(bill.created_at) >= today);
    } else if (filterPeriod === 'yesterday') {
      const yesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      filtered = filtered.filter(bill => {
        const billDate = new Date(bill.created_at);
        return billDate >= yesterday && billDate < today;
      });
    } else if (filterPeriod === 'week') {
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      filtered = filtered.filter(bill => new Date(bill.created_at) >= weekAgo);
    } else if (filterPeriod === 'month') {
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      filtered = filtered.filter(bill => new Date(bill.created_at) >= monthStart);
    }

    // Filter by custom date range
    if (dateFrom) {
      filtered = filtered.filter(bill => new Date(bill.created_at) >= new Date(dateFrom));
    }
    if (dateTo) {
      const endDate = new Date(dateTo);
      endDate.setHours(23, 59, 59);
      filtered = filtered.filter(bill => new Date(bill.created_at) <= endDate);
    }

    // Sort bills
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'date_desc':
          return new Date(b.created_at) - new Date(a.created_at);
        case 'date_asc':
          return new Date(a.created_at) - new Date(b.created_at);
        case 'amount_desc':
          return parseFloat(b.total_amount) - parseFloat(a.total_amount);
        case 'amount_asc':
          return parseFloat(a.total_amount) - parseFloat(b.total_amount);
        default:
          return new Date(b.created_at) - new Date(a.created_at);
      }
    });

    setFilteredBills(filtered);
  };

  const handleViewBill = async (billId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`/api/bills/${billId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSelectedBill(response.data);
      setShowBillModal(true);
    } catch (error) {
      console.error('Error fetching bill details:', error);
      toast.error('Failed to load bill details');
    }
  };

  const handlePrintBill = async (bill) => {
    // Fetch full bill details with items
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`/api/bills/${bill.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const fullBill = response.data;
      const items = fullBill.items || [];
      
      const printWindow = window.open('', '_blank');
    
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Bill #${bill.id ? bill.id.substring(0, 8) : 'N/A'}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; max-width: 800px; margin: 0 auto; }
            .header { text-align: center; border-bottom: 2px solid #000; padding-bottom: 20px; margin-bottom: 20px; }
            .shop-name { font-size: 24px; font-weight: bold; margin-bottom: 5px; }
            .bill-info { margin-bottom: 20px; background: #f9f9f9; padding: 15px; border-radius: 8px; }
            .bill-info p { margin: 5px 0; }
            table { width: 100%; border-collapse: collapse; margin: 20px 0; }
            th, td { border-bottom: 1px solid #ddd; padding: 12px 8px; text-align: left; }
            th { background-color: #f2f2f2; font-weight: bold; }
            .text-right { text-align: right; }
            .totals { margin-top: 20px; border-top: 2px solid #000; padding-top: 15px; }
            .total-row { display: flex; justify-content: space-between; margin: 8px 0; padding: 5px 0; }
            .grand-total { font-weight: bold; font-size: 1.3em; border-top: 2px solid #000; padding-top: 10px; margin-top: 10px; }
            .footer { text-align: center; margin-top: 30px; border-top: 1px solid #ddd; padding-top: 20px; font-size: 14px; color: #666; }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="shop-name">Restaurant POS</div>
            <p>Your Favorite Restaurant</p>
          </div>
          
          <div class="bill-info">
            <p><strong>Bill Number:</strong> #${bill.id ? bill.id.substring(0, 8).toUpperCase() : 'N/A'}</p>
            <p><strong>Table:</strong> ${bill.table_number || 'N/A'}</p>
            <p><strong>Date:</strong> ${formatIndianDate(bill.created_at)}</p>
            ${bill.customer_name ? `<p><strong>Customer:</strong> ${bill.customer_name}</p>` : ''}
          </div>
          
          <table>
            <thead>
              <tr>
                <th>Item</th>
                <th class="text-right">Qty</th>
                <th class="text-right">Price</th>
                <th class="text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              ${items.map(item => `
                <tr>
                  <td>${item.name || item.item_name}</td>
                  <td class="text-right">${item.quantity}</td>
                  <td class="text-right">${parseFloat(item.price).toFixed(2)}</td>
                  <td class="text-right">${(item.quantity * item.price).toFixed(2)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          
          <div class="totals">
            <div class="total-row">
              <span>Subtotal:</span>
              <span>${currency}${parseFloat(fullBill.subtotal).toFixed(2)}</span>
            </div>
            ${fullBill.tax_amount > 0 ? `
            <div class="total-row">
              <span>Tax:</span>
              <span>${currency}${parseFloat(fullBill.tax_amount).toFixed(2)}</span>
            </div>
            ` : ''}
            ${fullBill.service_charge > 0 ? `
            <div class="total-row">
              <span>Service Charge:</span>
              <span>${currency}${parseFloat(fullBill.service_charge).toFixed(2)}</span>
            </div>
            ` : ''}
            ${fullBill.discount_amount > 0 ? `
            <div class="total-row">
              <span>Discount:</span>
              <span>-${currency}${parseFloat(fullBill.discount_amount).toFixed(2)}</span>
            </div>
            ` : ''}
            <div class="total-row grand-total">
              <span>GRAND TOTAL:</span>
              <span>${currency}${parseFloat(fullBill.total_amount).toFixed(2)}</span>
            </div>
          </div>
          
          <div class="footer">
            <p>Thank you for dining with us!</p>
            <p>Visit us again</p>
          </div>
          
          <script>
            window.onload = function() {
              window.print();
              window.onafterprint = function() { window.close(); }
            }
          </script>
        </body>
      </html>
    `);
      printWindow.document.close();
    } catch (error) {
      console.error('Error printing bill:', error);
      toast.error('Failed to print bill');
    }
  };

  const handleEditBill = async (bill) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`/api/bills/${bill.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSelectedBill(response.data);
      setEditItems(response.data.items || []);
      setEditForm({
        discount_amount: bill.discount_amount || 0,
        discount_type: bill.discount_type || 'fixed',
        discount_reason: bill.discount_reason || '',
        service_charge: bill.service_charge || 0,
        tax_amount: bill.tax_amount || 0
      });
      setShowEditModal(true);
    } catch (error) {
      console.error('Error loading bill for edit:', error);
      toast.error('Failed to load bill');
    }
  };

  const handleAddItemToEdit = (menuItem) => {
    const existingItem = editItems.find(item => item.menu_item_id === menuItem.id);
    if (existingItem) {
      setEditItems(editItems.map(item =>
        item.menu_item_id === menuItem.id
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ));
    } else {
      setEditItems([...editItems, {
        menu_item_id: menuItem.id,
        item_name: menuItem.name,
        price: menuItem.price,
        quantity: 1
      }]);
    }
  };

  const handleRemoveItemFromEdit = (menuItemId) => {
    setEditItems(editItems.filter(item => item.menu_item_id !== menuItemId));
  };

  const handleUpdateItemQuantity = (menuItemId, newQuantity) => {
    if (newQuantity <= 0) {
      handleRemoveItemFromEdit(menuItemId);
    } else {
      setEditItems(editItems.map(item =>
        item.menu_item_id === menuItemId
          ? { ...item, quantity: newQuantity }
          : item
      ));
    }
  };

  const calculateEditTotal = () => {
    const itemsTotal = editItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    return itemsTotal + parseFloat(editForm.tax_amount) + parseFloat(editForm.service_charge) - parseFloat(editForm.discount_amount);
  };

  const handleSaveEdit = async () => {
    if (!selectedBill) return;

    try {
      const token = localStorage.getItem('token');
      
      // Update order items first
      await axios.put(`/api/orders/${selectedBill.order_id}/items`, {
        items: editItems.map(item => ({
          menu_item_id: item.menu_item_id,
          quantity: item.quantity,
          price: item.price,
          variant_price_adjustment: 0
        })),
        tableNumber: selectedBill.table_number,
        order_type: 'Dine-In'
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Calculate new totals
      const itemsSubtotal = editItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      const newTotal = itemsSubtotal + parseFloat(editForm.tax_amount) + parseFloat(editForm.service_charge) - parseFloat(editForm.discount_amount);
      
      // Update bill
      await axios.put(`/api/bills/${selectedBill.id}`, {
        ...editForm,
        subtotal: itemsSubtotal,
        total_amount: newTotal
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      toast.success('Bill updated successfully');
      setShowEditModal(false);
      fetchBills();
    } catch (error) {
      console.error('Error updating bill:', error);
      toast.error('Failed to update bill');
    }
  };

  const handleDeleteBill = async (billId) => {
    if (!window.confirm('Are you sure you want to delete this bill? This action cannot be undone.')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      await axios.delete(`/api/bills/${billId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Bill deleted successfully');
      fetchBills();
      if (showBillModal) setShowBillModal(false);
    } catch (error) {
      console.error('Error deleting bill:', error);
      toast.error('Failed to delete bill');
    }
  };

  const resetFilters = () => {
    setSearchQuery('');
    setFilterPeriod('today');
    setDateFrom('');
    setDateTo('');
    setSortBy('date_desc');
  };

  return (
    <div className="h-full bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 via-blue-700 to-purple-600 text-white px-4 sm:px-6 py-4 sm:py-6 shadow-xl">
        <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold mb-1 sm:mb-2">Bills Management</h1>
        <p className="text-sm sm:text-base text-blue-100">View, search, and manage all your bills</p>
      </div>

      {/* Filters Section */}
      <div className="bg-white shadow-lg border-b border-gray-200 px-3 sm:px-6 py-3 sm:py-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4">
          {/* Search */}
          <div className="relative">
            <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search by bill #, table, customer..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-sm border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Period Filter */}
          <div className="relative">
            <FiFilter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <select
              value={filterPeriod}
              onChange={(e) => setFilterPeriod(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none"
            >
              <option value="today">Today</option>
              <option value="yesterday">Yesterday</option>
              <option value="week">This Week</option>
              <option value="month">This Month</option>
            </select>
            <FiChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" />
          </div>

          {/* Date From */}
          <div className="relative">
            <FiCalendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              placeholder="From Date"
              className="w-full pl-10 pr-4 py-2 text-sm border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Date To */}
          <div className="relative">
            <FiCalendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              placeholder="To Date"
              className="w-full pl-10 pr-4 py-2 text-sm border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        {/* Sort and Reset */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-4 mt-3 sm:mt-4">
          <div className="flex-1">
            <label className="text-xs sm:text-sm font-medium text-gray-700 mb-1 block">Sort By:</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full px-3 sm:px-4 py-2 text-sm border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="date_desc">Date (Newest First)</option>
              <option value="date_asc">Date (Oldest First)</option>
              <option value="amount_desc">Amount (Highest First)</option>
              <option value="amount_asc">Amount (Lowest First)</option>
            </select>
          </div>

          <button
            onClick={resetFilters}
            className="sm:mt-6 px-4 sm:px-6 py-2 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-lg transition"
          >
            Reset Filters
          </button>

          <div className="sm:mt-6 text-xs sm:text-sm text-gray-600 bg-blue-50 px-3 sm:px-4 py-2 rounded-lg border border-blue-200 text-center">
            <strong className="text-blue-700">{filteredBills.length}</strong> bills found
          </div>
        </div>
      </div>

      {/* Bills List */}
      <div className="flex-1 overflow-auto p-3 sm:p-4 lg:p-6">
        {loading ? (
          <div className="text-center py-20">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <p className="mt-4 text-gray-600">Loading bills...</p>
          </div>
        ) : filteredBills.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-xl shadow-lg">
            <FiDownload className="text-6xl text-gray-300 mx-auto mb-4" />
            <p className="text-xl text-gray-600 mb-2">No bills found</p>
            <p className="text-gray-400">Try adjusting your filters</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {filteredBills.map((bill) => (
              <div
                key={bill.id}
                className="bg-white rounded-xl shadow-lg border-2 border-gray-100 hover:border-blue-300 hover:shadow-xl transition-all duration-200 overflow-hidden"
              >
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between p-3 sm:p-4 lg:p-6 gap-3 sm:gap-4">
                  {/* Bill Info */}
                  <div className="flex-1 grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Bill Number</p>
                      <p className="font-bold text-gray-900 text-lg">#{bill.id ? bill.id.substring(0, 8).toUpperCase() : 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Table / Customer</p>
                      <p className="font-semibold text-gray-800">{bill.table_number || 'N/A'}</p>
                      {bill.customer_name && <p className="text-sm text-gray-600">{bill.customer_name}</p>}
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Date & Time</p>
                      <p className="font-semibold text-gray-800">{formatIndianDateOnly(bill.created_at)}</p>
                      <p className="text-sm text-gray-600">{formatIndianTimeOnly(bill.created_at)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Total Amount</p>
                      <p className="font-bold text-green-600 text-2xl">{formatCurrency(parseFloat(bill.total_amount))}</p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-center sm:justify-start gap-2 sm:ml-4">
                    <button
                      onClick={() => handleViewBill(bill.id)}
                      className="p-2 sm:p-3 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-lg transition"
                      title="View Details"
                    >
                      <FiEye className="text-lg sm:text-xl" />
                    </button>
                    <button
                      onClick={() => handleEditBill(bill)}
                      className="p-2 sm:p-3 bg-yellow-100 hover:bg-yellow-200 text-yellow-700 rounded-lg transition"
                      title="Edit Bill"
                    >
                      <FiEdit className="text-lg sm:text-xl" />
                    </button>
                    <button
                      onClick={() => handlePrintBill(bill)}
                      className="p-2 sm:p-3 bg-green-100 hover:bg-green-200 text-green-700 rounded-lg transition"
                      title="Print Bill"
                    >
                      <FiPrinter className="text-lg sm:text-xl" />
                    </button>
                    <button
                      onClick={() => handleDeleteBill(bill.id)}
                      className="p-2 sm:p-3 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg transition"
                      title="Delete Bill"
                    >
                      <FiTrash2 className="text-lg sm:text-xl" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* View Bill Modal */}
      {showBillModal && selectedBill && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-5 rounded-t-2xl flex justify-between items-center sticky top-0 z-10">
              <div>
                <h2 className="text-2xl font-bold">Bill Details</h2>
                <p className="text-blue-100">#{selectedBill.id ? selectedBill.id.substring(0, 8).toUpperCase() : 'N/A'}</p>
              </div>
              <button
                onClick={() => setShowBillModal(false)}
                className="p-2 hover:bg-white hover:bg-opacity-20 rounded-lg transition"
              >
                <FiX className="text-2xl" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6">
              {/* Bill Info */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 bg-gray-50 p-4 rounded-lg">
                <div>
                  <p className="text-sm text-gray-500">Table</p>
                  <p className="font-semibold text-gray-900">{selectedBill.table_number || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Date</p>
                  <p className="font-semibold text-gray-900">{formatIndianDate(selectedBill.created_at)}</p>
                </div>
                {selectedBill.customer_name && (
                  <div>
                    <p className="text-sm text-gray-500">Customer</p>
                    <p className="font-semibold text-gray-900">{selectedBill.customer_name}</p>
                  </div>
                )}
                <div>
                  <p className="text-sm text-gray-500">Staff</p>
                  <p className="font-semibold text-gray-900">{selectedBill.staff_name || 'N/A'}</p>
                </div>
              </div>

              {/* Items Table */}
              <div className="mb-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Order Items</h3>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-gray-100 border-b-2 border-gray-300">
                        <th className="text-left py-3 px-4 font-bold text-gray-700">Item</th>
                        <th className="text-center py-3 px-4 font-bold text-gray-700">Quantity</th>
                        <th className="text-right py-3 px-4 font-bold text-gray-700">Unit Price</th>
                        <th className="text-right py-3 px-4 font-bold text-gray-700">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(selectedBill.items || []).map((item, index) => (
                        <tr key={index} className="border-b border-gray-200 hover:bg-gray-50">
                          <td className="py-3 px-4 text-gray-900">{item.name || item.item_name}</td>
                          <td className="py-3 px-4 text-center">
                            <span className="inline-block bg-blue-100 text-blue-700 px-3 py-1 rounded-full font-semibold">
                              {item.quantity}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right text-gray-900">{formatCurrency(item.price)}</td>
                          <td className="py-3 px-4 text-right font-semibold text-gray-900">
                            {formatCurrency(item.quantity * item.price)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Totals */}
              <div className="border-t-2 border-gray-300 pt-4">
                <div className="flex justify-end">
                  <div className="w-full md:w-1/2 space-y-3">
                    <div className="flex justify-between text-gray-700">
                      <span>Subtotal:</span>
                      <span className="font-semibold">{formatCurrency(selectedBill.subtotal)}</span>
                    </div>
                    {selectedBill.tax_amount > 0 && (
                      <div className="flex justify-between text-gray-700">
                        <span>Tax:</span>
                        <span className="font-semibold">{formatCurrency(selectedBill.tax_amount)}</span>
                      </div>
                    )}
                    {selectedBill.service_charge > 0 && (
                      <div className="flex justify-between text-gray-700">
                        <span>Service Charge:</span>
                        <span className="font-semibold">{formatCurrency(selectedBill.service_charge)}</span>
                      </div>
                    )}
                    {selectedBill.discount_amount > 0 && (
                      <div className="flex justify-between text-red-600">
                        <span>Discount:</span>
                        <span className="font-semibold">-{formatCurrency(selectedBill.discount_amount)}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-xl font-bold text-green-600 pt-3 border-t-2 border-gray-300">
                      <span>GRAND TOTAL:</span>
                      <span>{formatCurrency(selectedBill.total_amount)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 mt-6 pt-6 border-t-2 border-gray-200">
                <button
                  onClick={() => handlePrintBill(selectedBill)}
                  className="flex-1 bg-gradient-to-r from-green-600 to-green-500 hover:from-green-700 hover:to-green-600 text-white py-3 px-6 rounded-lg font-semibold shadow-lg transition flex items-center justify-center gap-2"
                >
                  <FiPrinter className="text-xl" />
                  Print Bill
                </button>
                <button
                  onClick={() => handleDeleteBill(selectedBill.id)}
                  className="flex-1 bg-gradient-to-r from-red-600 to-red-500 hover:from-red-700 hover:to-red-600 text-white py-3 px-6 rounded-lg font-semibold shadow-lg transition flex items-center justify-center gap-2"
                >
                  <FiTrash2 className="text-xl" />
                  Delete Bill
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Bill Modal */}
      {showEditModal && selectedBill && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-yellow-600 to-orange-600 text-white px-6 py-5 rounded-t-2xl flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold">Edit Bill</h2>
                <p className="text-yellow-100">#{selectedBill.id ? selectedBill.id.substring(0, 8).toUpperCase() : 'N/A'}</p>
              </div>
              <button
                onClick={() => setShowEditModal(false)}
                className="p-2 hover:bg-white hover:bg-opacity-20 rounded-lg transition"
              >
                <FiX className="text-2xl" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 max-h-[80vh] overflow-y-auto">
              {/* Current Items */}
              <div className="mb-6">
                <h3 className="text-lg font-bold text-gray-900 mb-3">Current Items</h3>
                {editItems.length === 0 ? (
                  <p className="text-gray-500 text-center py-4">No items in bill</p>
                ) : (
                  <div className="space-y-2">
                    {editItems.map((item, index) => (
                      <div key={index} className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
                        <div className="flex-1">
                          <p className="font-semibold text-gray-900">{item.item_name || item.name}</p>
                          <p className="text-sm text-gray-600">{formatCurrency(item.price)} each</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => handleUpdateItemQuantity(item.menu_item_id, item.quantity - 1)}
                            className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-2 py-1 rounded"
                          >
                            -
                          </button>
                          <span className="font-bold text-gray-900 min-w-[30px] text-center">{item.quantity}</span>
                          <button
                            onClick={() => handleUpdateItemQuantity(item.menu_item_id, item.quantity + 1)}
                            className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-2 py-1 rounded"
                          >
                            +
                          </button>
                          <span className="font-semibold text-gray-900 min-w-[80px] text-right">{formatCurrency(item.price * item.quantity)}</span>
                          <button
                            onClick={() => handleRemoveItemFromEdit(item.menu_item_id)}
                            className="bg-red-100 hover:bg-red-200 text-red-600 px-2 py-1 rounded"
                          >
                            <FiTrash2 />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Add Items from Menu */}
              <div className="mb-6">
                <h3 className="text-lg font-bold text-gray-900 mb-3">Add Items from Menu</h3>
                <div className="grid grid-cols-2 gap-2 max-h-60 overflow-y-auto border border-gray-200 p-3 rounded-lg">
                  {menuItems.map((menuItem) => (
                    <button
                      key={menuItem.id}
                      onClick={() => handleAddItemToEdit(menuItem)}
                      className="text-left bg-white border-2 border-gray-200 hover:border-yellow-400 hover:bg-yellow-50 p-3 rounded-lg transition"
                    >
                      <p className="font-semibold text-sm text-gray-900">{menuItem.name}</p>
                      <p className="text-xs text-gray-600">{formatCurrency(menuItem.price)}</p>
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                {/* Tax Amount */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Tax Amount ({currency})</label>
                  <input
                    type="number"
                    step="0.01"
                    value={editForm.tax_amount}
                    onChange={(e) => setEditForm({ ...editForm, tax_amount: parseFloat(e.target.value) || 0 })}
                    className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-yellow-500"
                  />
                </div>

                {/* Service Charge */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Service Charge ({currency})</label>
                  <input
                    type="number"
                    step="0.01"
                    value={editForm.service_charge}
                    onChange={(e) => setEditForm({ ...editForm, service_charge: parseFloat(e.target.value) || 0 })}
                    className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-yellow-500"
                  />
                </div>

                {/* Discount Amount */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Discount Amount ({currency})</label>
                  <input
                    type="number"
                    step="0.01"
                    value={editForm.discount_amount}
                    onChange={(e) => setEditForm({ ...editForm, discount_amount: parseFloat(e.target.value) || 0 })}
                    className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-yellow-500"
                  />
                </div>

                {/* Discount Reason */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Discount Reason (Optional)</label>
                  <input
                    type="text"
                    value={editForm.discount_reason}
                    onChange={(e) => setEditForm({ ...editForm, discount_reason: e.target.value })}
                    placeholder="e.g., Senior citizen discount, Loyalty card"
                    className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-yellow-500"
                  />
                </div>

                {/* New Total Preview */}
                <div className="bg-blue-50 p-4 rounded-lg border-2 border-blue-200">
                  <div className="flex justify-between text-sm text-gray-600 mb-1">
                    <span>Items Subtotal:</span>
                    <span>{formatCurrency(editItems.reduce((sum, item) => sum + (item.price * item.quantity), 0))}</span>
                  </div>
                  <div className="flex justify-between text-sm text-gray-600 mb-1">
                    <span>Tax:</span>
                    <span>{formatCurrency(editForm.tax_amount)}</span>
                  </div>
                  <div className="flex justify-between text-sm text-gray-600 mb-1">
                    <span>Service Charge:</span>
                    <span>{formatCurrency(editForm.service_charge)}</span>
                  </div>
                  <div className="flex justify-between text-sm text-red-600 mb-2">
                    <span>Discount:</span>
                    <span>-{formatCurrency(editForm.discount_amount)}</span>
                  </div>
                  <div className="flex justify-between text-lg font-bold text-green-600 pt-2 border-t-2 border-blue-300">
                    <span>NEW TOTAL:</span>
                    <span>{formatCurrency(calculateEditTotal())}</span>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 mt-6 pt-6 border-t-2 border-gray-200">
                <button
                  onClick={() => setShowEditModal(false)}
                  className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-3 px-6 rounded-lg font-semibold transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveEdit}
                  className="flex-1 bg-gradient-to-r from-yellow-600 to-orange-600 hover:from-yellow-700 hover:to-orange-700 text-white py-3 px-6 rounded-lg font-semibold shadow-lg transition"
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

export default Bills;

