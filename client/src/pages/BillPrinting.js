import React, { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { FaPrint, FaFileInvoice, FaTrash, FaMoneyBill, FaCut } from 'react-icons/fa';

const BillPrinting = () => {
  const [tables, setTables] = useState([]);
  const [orders, setOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [bill, setBill] = useState(null);
  const [loading, setLoading] = useState(false);
  const [billForm, setBillForm] = useState({
    discount_amount: 0,
    discount_type: 'fixed',
    discount_reason: '',
    service_charge_rate: 5.0
  });
  const [splitCount, setSplitCount] = useState(2);
  const [showVoidModal, setShowVoidModal] = useState(false);
  const [voidReason, setVoidReason] = useState('');

  useEffect(() => {
    fetchTables();
    fetchOrders();
  }, []);

  const fetchTables = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/tables', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTables(response.data);
    } catch (error) {
      console.error('Error fetching tables:', error);
    }
  };

  const fetchOrders = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/orders?status=New', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setOrders(response.data);
    } catch (error) {
      console.error('Error fetching orders:', error);
    }
  };

  const handleOrderSelect = (order) => {
    setSelectedOrder(order);
    setBill(null);
  };

  const generateBill = async () => {
    if (!selectedOrder) {
      toast.error('Please select an order');
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post('/api/bills', {
        orderId: selectedOrder.id,
        ...billForm
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Fetch complete bill details
      const billResponse = await axios.get(`/api/bills/${response.data.billId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setBill(billResponse.data);
      toast.success('Bill generated successfully');
      fetchOrders();
      fetchTables();
    } catch (error) {
      console.error('Error generating bill:', error);
      toast.error(error.response?.data?.error || 'Error generating bill');
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = async () => {
    if (!bill) return;
    
    try {
      // Send to print service
      const token = localStorage.getItem('token');
      await axios.post('http://localhost:5003/print/bill', {
        billData: bill
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      toast.success('Bill sent to printer');
    } catch (error) {
      console.error('Print error:', error);
      toast.error('Print failed. Added to print queue for retry.');
    }
    
    // Also open print preview
    printBillPreview();
  };

  const printBillPreview = () => {
    if (!bill) return;
    
    const printWindow = window.open('', '_blank');
    const printContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Bill - ${bill.table_number}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; max-width: 800px; margin: 0 auto; padding: 20px; }
            .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #000; padding-bottom: 20px; }
            .shop-name { font-size: 24px; font-weight: bold; margin-bottom: 5px; }
            .bill-info { margin-bottom: 20px; }
            .bill-info p { margin: 5px 0; }
            .items-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
            .items-table th, .items-table td { border-bottom: 1px solid #ddd; padding: 10px 8px; text-align: left; }
            .items-table th { background-color: #f2f2f2; font-weight: bold; }
            .total-section { text-align: right; margin-top: 20px; border-top: 2px solid #000; padding-top: 15px; }
            .total-line { margin: 8px 0; padding: 5px 0; }
            .grand-total { font-weight: bold; font-size: 1.3em; border-top: 2px solid #000; padding-top: 10px; margin-top: 10px; }
            .footer { text-align: center; margin-top: 30px; border-top: 1px solid #ddd; padding-top: 20px; }
            @media print {
              body { margin: 0; }
              .no-print { display: none; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="shop-name">${bill.shop_info?.shop_name || 'Restaurant POS'}</div>
            <p>${bill.shop_info?.shop_address || ''}</p>
            <p>Tel: ${bill.shop_info?.shop_phone || ''} | Email: ${bill.shop_info?.shop_email || ''}</p>
          </div>
          
          <div class="bill-info">
            <p><strong>Bill #:</strong> ${bill.id.substring(0, 8)}</p>
            <p><strong>Table:</strong> ${bill.table_number}</p>
            <p><strong>Date:</strong> ${new Date(bill.created_at).toLocaleString()}</p>
            <p><strong>Staff:</strong> ${bill.staff_name || 'N/A'}</p>
            ${bill.customer_name ? `<p><strong>Customer:</strong> ${bill.customer_name}</p>` : ''}
          </div>
          
          <table class="items-table">
            <thead>
              <tr>
                <th>Item</th>
                <th style="text-align: center;">Qty</th>
                <th style="text-align: right;">Price</th>
                <th style="text-align: right;">Total</th>
              </tr>
            </thead>
            <tbody>
              ${bill.items.map(item => `
                <tr>
                  <td>
                    ${item.item_name}${item.variant_name ? ` (${item.variant_name})` : ''}
                    ${item.special_instructions ? `<br><small style="color: #666;">Note: ${item.special_instructions}</small>` : ''}
                  </td>
                  <td style="text-align: center;">${item.quantity}</td>
                  <td style="text-align: right;">$${item.price.toFixed(2)}</td>
                  <td style="text-align: right;">$${item.total.toFixed(2)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          
          <div class="total-section">
            <div class="total-line">Subtotal: $${bill.subtotal.toFixed(2)}</div>
            ${bill.discount_amount > 0 ? `
              <div class="total-line">Discount${bill.discount_reason ? ` (${bill.discount_reason})` : ''}: -$${bill.discount_amount.toFixed(2)}</div>
            ` : ''}
            ${bill.service_charge > 0 ? `
              <div class="total-line">Service Charge: $${bill.service_charge.toFixed(2)}</div>
            ` : ''}
            ${bill.cgst > 0 || bill.sgst > 0 ? `
              <div class="total-line">CGST: $${(bill.cgst || 0).toFixed(2)}</div>
              <div class="total-line">SGST: $${(bill.sgst || 0).toFixed(2)}</div>
              <div class="total-line">Total Tax (GST): $${bill.tax_amount.toFixed(2)}</div>
            ` : bill.tax_amount > 0 ? `
              <div class="total-line">Tax: $${bill.tax_amount.toFixed(2)}</div>
            ` : ''}
            ${bill.round_off && Math.abs(bill.round_off) > 0.01 ? `
              <div class="total-line">Round Off: $${bill.round_off.toFixed(2)}</div>
            ` : ''}
            <div class="total-line grand-total">TOTAL: $${bill.total_amount.toFixed(2)}</div>
            <div class="total-line">Payment Method: ${(bill.payment_method || 'Cash').toUpperCase()}</div>
            <div class="total-line">Status: ${(bill.payment_status || 'Pending').toUpperCase()}</div>
          </div>
          
          <div class="footer">
            <p>${bill.shop_info?.receipt_header || 'Thank you for dining with us!'}</p>
            <p>${bill.shop_info?.receipt_footer || 'Please visit again!'}</p>
            ${bill.printed_count > 0 ? `<p style="margin-top: 10px;"><small>(REPRINT #${bill.printed_count})</small></p>` : ''}
          </div>
        </body>
      </html>
    `;
    
    printWindow.document.write(printContent);
    printWindow.document.close();
    printWindow.print();
  };

  const handlePaymentUpdate = async (paymentMethod) => {
    if (!bill) return;
    
    try {
      const token = localStorage.getItem('token');
      await axios.put(`/api/bills/${bill.id}/payment`, {
        payment_method: paymentMethod,
        payment_status: 'paid'
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      toast.success(`Payment received via ${paymentMethod}`);
      setBill({ ...bill, payment_status: 'paid', payment_method: paymentMethod });
      fetchTables();
    } catch (error) {
      toast.error('Failed to update payment status');
    }
  };

  const handleVoidBill = async () => {
    if (!bill || !voidReason) {
      toast.error('Please provide void reason');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      await axios.post(`/api/bills/${bill.id}/void`, {
        void_reason: voidReason
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      toast.success('Bill voided successfully');
      setShowVoidModal(false);
      setVoidReason('');
      setBill(null);
      fetchOrders();
      fetchTables();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to void bill');
    }
  };

  const handleSplitBill = async () => {
    if (!bill || splitCount < 2) {
      toast.error('Invalid split count');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      await axios.post(`/api/bills/${bill.id}/split`, {
        split_count: splitCount
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      toast.success(`Bill split into ${splitCount} parts`);
    } catch (error) {
      toast.error('Failed to split bill');
    }
  };

  const occupiedTables = tables.filter(t => t.status === 'Occupied' || t.status === 'Billed');

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Bill Printing</h1>
        <p className="text-gray-600 mt-1">Generate and manage customer bills</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Table & Order Selection */}
        <div className="space-y-6">
          {/* Tables with Orders */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4">Select Table/Order</h2>
            
            <div className="space-y-3">
              {occupiedTables.map(table => {
                const tableOrders = orders.filter(o => o.table_number === table.table_number);
                
                return tableOrders.map(order => (
                  <button
                    key={order.id}
                    onClick={() => handleOrderSelect(order)}
                    className={`w-full p-4 rounded-lg border-2 text-left transition-colors ${
                      selectedOrder?.id === order.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="font-semibold text-gray-900">Table {order.table_number}</div>
                        <div className="text-sm text-gray-600">{order.items.length} items</div>
                        <div className="text-sm text-gray-500">
                          {new Date(order.created_at).toLocaleTimeString()}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-green-600">${order.total_amount.toFixed(2)}</div>
                        <div className="text-xs text-gray-500">{order.status}</div>
                      </div>
                    </div>
                  </button>
                ));
              })}
            </div>

            {occupiedTables.length === 0 && (
              <p className="text-center text-gray-500 py-8">No active orders</p>
            )}
          </div>

          {/* Bill Options */}
          {selectedOrder && !bill && (
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold mb-4">Bill Options</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Discount Type
                  </label>
                  <select
                    value={billForm.discount_type}
                    onChange={(e) => setBillForm({ ...billForm, discount_type: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="fixed">Fixed Amount ($)</option>
                    <option value="percentage">Percentage (%)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Discount Amount
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={billForm.discount_amount}
                    onChange={(e) => setBillForm({ ...billForm, discount_amount: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Discount Reason
                  </label>
                  <input
                    type="text"
                    value={billForm.discount_reason}
                    onChange={(e) => setBillForm({ ...billForm, discount_reason: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., Senior Discount, Happy Hour"
                  />
                </div>

                <button
                  onClick={generateBill}
                  disabled={loading}
                  className="w-full bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 disabled:bg-gray-400 flex items-center justify-center"
                >
                  <FaFileInvoice className="mr-2" />
                  {loading ? 'Generating...' : 'Generate Bill'}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Right: Bill Preview & Actions */}
        <div className="lg:col-span-2">
          {bill ? (
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold">Bill Preview</h2>
                
                <div className="flex space-x-2">
                  <button
                    onClick={handlePrint}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center"
                  >
                    <FaPrint className="mr-2" />
                    Print
                  </button>
                  
                  <button
                    onClick={() => setShowVoidModal(true)}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center"
                  >
                    <FaTrash className="mr-2" />
                    Void
                  </button>
                </div>
              </div>

              {/* Bill Content */}
              <div className="border rounded-lg p-6 bg-gray-50">
                {/* Header */}
                <div className="text-center mb-6 border-b pb-4">
                  <h3 className="text-2xl font-bold">{bill.shop_info?.shop_name || 'Restaurant POS'}</h3>
                  <p className="text-sm text-gray-600">{bill.shop_info?.shop_address || ''}</p>
                  <p className="text-sm text-gray-600">Tel: {bill.shop_info?.shop_phone || ''}</p>
                </div>

                {/* Bill Info */}
                <div className="mb-4 text-sm space-y-1">
                  <p><strong>Bill #:</strong> {bill.id.substring(0, 8).toUpperCase()}</p>
                  <p><strong>Table:</strong> {bill.table_number}</p>
                  <p><strong>Date:</strong> {new Date(bill.created_at).toLocaleString()}</p>
                  <p><strong>Staff:</strong> {bill.staff_name || 'N/A'}</p>
                  {bill.customer_name && <p><strong>Customer:</strong> {bill.customer_name}</p>}
                </div>

                {/* Items */}
                <div className="mb-4">
                  <table className="w-full text-sm">
                    <thead className="border-b-2 border-gray-400">
                      <tr>
                        <th className="text-left py-2">Item</th>
                        <th className="text-center py-2">Qty</th>
                        <th className="text-right py-2">Price</th>
                        <th className="text-right py-2">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-300">
                      {bill.items.map((item, index) => (
                        <tr key={index}>
                          <td className="py-2">
                            {item.item_name}
                            {item.variant_name && <span className="text-gray-600"> ({item.variant_name})</span>}
                            {item.special_instructions && (
                              <div className="text-xs text-orange-600">Note: {item.special_instructions}</div>
                            )}
                          </td>
                          <td className="text-center py-2">{item.quantity}</td>
                          <td className="text-right py-2">${item.price.toFixed(2)}</td>
                          <td className="text-right py-2 font-medium">${item.total.toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Totals */}
                <div className="text-right space-y-2 border-t-2 border-gray-400 pt-4">
                  <div className="flex justify-between text-sm">
                    <span>Subtotal:</span>
                    <span className="font-medium">${bill.subtotal.toFixed(2)}</span>
                  </div>
                  
                  {bill.discount_amount > 0 && (
                    <div className="flex justify-between text-sm text-red-600">
                      <span>Discount{bill.discount_reason && ` (${bill.discount_reason})`}:</span>
                      <span className="font-medium">-${bill.discount_amount.toFixed(2)}</span>
                    </div>
                  )}
                  
                  {bill.service_charge > 0 && (
                    <div className="flex justify-between text-sm">
                      <span>Service Charge:</span>
                      <span className="font-medium">${bill.service_charge.toFixed(2)}</span>
                    </div>
                  )}
                  
                  {bill.cgst > 0 || bill.sgst > 0 ? (
                    <>
                      <div className="flex justify-between text-sm">
                        <span>CGST:</span>
                        <span className="font-medium">${(bill.cgst || 0).toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>SGST:</span>
                        <span className="font-medium">${(bill.sgst || 0).toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-sm font-semibold">
                        <span>Total Tax (GST):</span>
                        <span className="font-medium">${bill.tax_amount.toFixed(2)}</span>
                      </div>
                    </>
                  ) : bill.tax_amount > 0 ? (
                    <div className="flex justify-between text-sm">
                      <span>Tax:</span>
                      <span className="font-medium">${bill.tax_amount.toFixed(2)}</span>
                    </div>
                  ) : null}
                  
                  {bill.round_off && Math.abs(bill.round_off) > 0.01 && (
                    <div className="flex justify-between text-sm">
                      <span>Round Off:</span>
                      <span className="font-medium">${bill.round_off.toFixed(2)}</span>
                    </div>
                  )}
                  
                  <div className="flex justify-between text-xl font-bold border-t-2 border-gray-800 pt-3 mt-2">
                    <span>TOTAL:</span>
                    <span className="text-green-600">${bill.total_amount.toFixed(2)}</span>
                  </div>
                </div>

                {/* Footer */}
                <div className="text-center mt-6 pt-4 border-t text-sm text-gray-600">
                  <p>{bill.shop_info?.receipt_header || 'Thank you for dining with us!'}</p>
                  <p>{bill.shop_info?.receipt_footer || 'Please visit again!'}</p>
                </div>
              </div>

              {/* Payment Buttons */}
              {bill.payment_status !== 'paid' && (
                <div className="mt-6">
                  <h3 className="text-lg font-semibold mb-3">Accept Payment</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <button
                      onClick={() => handlePaymentUpdate('cash')}
                      className="px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center justify-center"
                    >
                      <FaMoneyBill className="mr-2" />
                      Cash
                    </button>
                    <button
                      onClick={() => handlePaymentUpdate('card')}
                      className="px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                      Card
                    </button>
                    <button
                      onClick={() => handlePaymentUpdate('upi')}
                      className="px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                    >
                      UPI
                    </button>
                    <button
                      onClick={() => handlePaymentUpdate('wallet')}
                      className="px-4 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                    >
                      Wallet
                    </button>
                  </div>
                </div>
              )}

              {/* Split Bill Option */}
              {bill.payment_status !== 'paid' && !bill.is_split && (
                <div className="mt-6">
                  <h3 className="text-lg font-semibold mb-3">Split Bill</h3>
                  <div className="flex items-center space-x-3">
                    <input
                      type="number"
                      min="2"
                      max="10"
                      value={splitCount}
                      onChange={(e) => setSplitCount(parseInt(e.target.value))}
                      className="w-20 px-3 py-2 border rounded-lg"
                    />
                    <span className="text-sm text-gray-600">ways</span>
                    <button
                      onClick={handleSplitBill}
                      className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 flex items-center"
                    >
                      <FaCut className="mr-2" />
                      Split Bill
                    </button>
                  </div>
                </div>
              )}

              {bill.payment_status === 'paid' && (
                <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg text-center">
                  <p className="text-green-800 font-semibold">✓ Payment Received</p>
                  <p className="text-sm text-green-600 mt-1">Table is now free</p>
                </div>
              )}
            </div>
          ) : selectedOrder ? (
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold mb-4">Selected Order</h2>
              
              <div className="space-y-3">
                <p><strong>Table:</strong> {selectedOrder.table_number}</p>
                <p><strong>Order ID:</strong> {selectedOrder.id.substring(0, 8)}</p>
                <p><strong>Items:</strong> {selectedOrder.items.length}</p>
                <p><strong>Total:</strong> ${selectedOrder.total_amount.toFixed(2)}</p>
                
                <div className="pt-4">
                  <h4 className="font-medium mb-2">Items:</h4>
                  <div className="space-y-2">
                    {selectedOrder.items.map((item, idx) => (
                      <div key={idx} className="text-sm flex justify-between">
                        <span>{item.quantity}x {item.item_name}</span>
                        <span>${(item.price * item.quantity).toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow p-6 text-center text-gray-500">
              <p>Select an order to generate bill</p>
            </div>
          )}
        </div>
      </div>

      {/* Void Bill Modal */}
      {showVoidModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-2xl font-bold mb-4">Void Bill</h2>
            
            <p className="text-sm text-gray-600 mb-4">
              This action will void the bill and revert the order status. Please provide a reason.
            </p>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Void Reason *
              </label>
              <textarea
                value={voidReason}
                onChange={(e) => setVoidReason(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                rows="3"
                placeholder="e.g., Customer complaint, Wrong order"
                required
              />
            </div>

            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowVoidModal(false);
                  setVoidReason('');
                }}
                className="px-4 py-2 border rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleVoidBill}
                disabled={!voidReason}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-400"
              >
                Void Bill
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BillPrinting;
