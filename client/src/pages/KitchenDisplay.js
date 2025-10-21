import React, { useState, useEffect } from 'react';
import axios from 'axios';
import io from 'socket.io-client';
import toast from 'react-hot-toast';

const KitchenDisplay = () => {
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    // Initialize socket connection
    const socketUrl = window.location.origin.includes('localhost') 
      ? 'http://localhost:5002' 
      : 'https://restaurant-pos-system-1-7h0m.onrender.com';
    const newSocket = io(socketUrl);
    newSocket.emit('join-kitchen');

    // Fetch initial orders
    fetchOrders();

    // Listen for new orders
    newSocket.on('new-order', (orderData) => {
      fetchOrders(); // Refresh orders when new order comes in
    });

    newSocket.on('item-status-updated', (data) => {
      fetchOrders(); // Refresh when item status changes
    });

    return () => newSocket.close();
  }, []);

  const fetchOrders = async () => {
    try {
      const response = await axios.get('/api/kitchen/orders');
      setOrders(response.data);
    } catch (error) {
      console.error('Error fetching orders:', error);
    }
  };

  const updateItemStatus = async (orderId, itemId, newStatus) => {
    try {
      await axios.put(`/api/orders/${orderId}/items/${itemId}/status`, { 
        status: newStatus,
        kds_status: newStatus
      });
      toast.success('Item status updated successfully');
      fetchOrders(); // Refresh orders after status update
    } catch (error) {
      console.error('Error updating item status:', error);
      toast.error('Failed to update item status');
    }
  };

  const getStatusColor = (status) => {
    const normalizedStatus = status?.toLowerCase() || 'new';
    switch (normalizedStatus) {
      case 'new':
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'in-progress':
      case 'preparing':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'ready':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'served':
      case 'completed':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusButtonColor = (status) => {
    const normalizedStatus = status?.toLowerCase() || 'new';
    switch (normalizedStatus) {
      case 'new':
      case 'pending':
        return 'bg-blue-600 hover:bg-blue-700';
      case 'in-progress':
      case 'preparing':
        return 'bg-green-600 hover:bg-green-700';
      case 'ready':
        return 'bg-gray-600 hover:bg-gray-700';
      default:
        return 'bg-gray-600 hover:bg-gray-700';
    }
  };

  const getNextStatus = (currentStatus) => {
    const normalizedStatus = currentStatus?.toLowerCase() || 'new';
    switch (normalizedStatus) {
      case 'new':
      case 'pending':
        return 'In-Progress';
      case 'in-progress':
      case 'preparing':
        return 'Ready';
      case 'ready':
        return 'Served';
      default:
        return 'New';
    }
  };

  const getStatusButtonText = (currentStatus) => {
    const normalizedStatus = currentStatus?.toLowerCase() || 'new';
    switch (normalizedStatus) {
      case 'new':
      case 'pending':
        return 'Start Preparing';
      case 'in-progress':
      case 'preparing':
        return 'Mark Ready';
      case 'ready':
        return 'Mark Served';
      default:
        return 'Start';
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Kitchen Display</h1>
        <p className="text-gray-600">Manage order preparation status</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {orders.map(order => (
          <div key={order.order_id} className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  Table {order.table_number}
                </h3>
                <p className="text-sm text-gray-600">
                  Order #{order.order_id.slice(-8)}
                </p>
                <p className="text-xs text-gray-500">
                  {new Date(order.created_at).toLocaleTimeString()}
                </p>
              </div>
              <div className="text-right">
                <div className="text-sm text-gray-600">
                  {order.items.length} item{order.items.length !== 1 ? 's' : ''}
                </div>
              </div>
            </div>

            <div className="space-y-3">
              {order.items.map(item => (
                <div key={item.item_id} className="border rounded-lg p-3">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-medium text-gray-900">{item.item_name}</h4>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(item.status)}`}>
                      {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                    </span>
                  </div>
                  
                  <div className="text-sm text-gray-600 mb-2">
                    Quantity: {item.quantity}
                  </div>
                  
                  {item.special_instructions && (
                    <div className="text-sm text-orange-600 mb-2">
                      <strong>Note:</strong> {item.special_instructions}
                    </div>
                  )}
                  
                  <button
                    onClick={() => updateItemStatus(order.order_id, item.item_id, getNextStatus(item.status))}
                    className={`w-full py-2 px-3 rounded text-white text-sm font-medium transition-colors ${getStatusButtonColor(item.status)}`}
                  >
                    {getStatusButtonText(item.status)}
                  </button>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {orders.length === 0 && (
        <div className="text-center py-12">
          <div className="text-gray-500 text-lg">No pending orders</div>
          <div className="text-gray-400 text-sm">Orders will appear here when customers place them</div>
        </div>
      )}
    </div>
  );
};

export default KitchenDisplay;
