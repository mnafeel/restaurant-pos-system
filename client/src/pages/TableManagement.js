import React, { useState, useEffect } from 'react';
import axios from 'axios';
import io from 'socket.io-client';
import toast from 'react-hot-toast';
import { FaPlus, FaEdit, FaTrash, FaUsers, FaMapMarkerAlt } from 'react-icons/fa';

const TableManagement = () => {
  const [tables, setTables] = useState([]);
  const [selectedTables, setSelectedTables] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [currentTable, setCurrentTable] = useState(null);
  const [newTable, setNewTable] = useState({
    table_number: '',
    capacity: 4,
    location: 'main'
  });
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    const newSocket = io('https://restaurant-pos-system-1-7h0m.onrender.com');
    setSocket(newSocket);

    newSocket.on('table-status-updated', (data) => {
      fetchTables();
    });

    newSocket.on('tables-merged', (data) => {
      fetchTables();
      toast.success('Tables merged successfully');
    });

    newSocket.on('tables-split', (data) => {
      fetchTables();
      toast.success('Tables split successfully');
    });

    fetchTables();

    return () => newSocket.close();
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
      toast.error('Failed to fetch tables');
    }
  };

  const handleAddTable = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      await axios.post('/api/tables', newTable, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      toast.success('Table created successfully');
      setShowAddModal(false);
      setNewTable({ table_number: '', capacity: 4, location: 'main' });
      fetchTables();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to create table');
    }
  };

  const handleUpdateStatus = async (tableId, newStatus) => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(`/api/tables/${tableId}/status`, 
        { status: newStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      toast.success('Table status updated');
      fetchTables();
    } catch (error) {
      toast.error('Failed to update table status');
    }
  };

  const handleDeleteTable = async (tableId) => {
    if (!window.confirm('Are you sure you want to delete this table?')) return;
    
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`/api/tables/${tableId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      toast.success('Table deleted successfully');
      fetchTables();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to delete table');
    }
  };

  const handleSelectTable = (tableId) => {
    setSelectedTables(prev => {
      if (prev.includes(tableId)) {
        return prev.filter(id => id !== tableId);
      } else {
        return [...prev, tableId];
      }
    });
  };

  const handleMergeTables = async () => {
    if (selectedTables.length < 2) {
      toast.error('Select at least 2 tables to merge');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      await axios.post('/api/tables/merge', {
        table_ids: selectedTables,
        primary_table_id: selectedTables[0]
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      toast.success('Tables merged successfully');
      setSelectedTables([]);
      fetchTables();
    } catch (error) {
      toast.error('Failed to merge tables');
    }
  };

  const handleSplitTable = async (primaryTableId) => {
    if (!window.confirm('Split this table and all merged tables?')) return;

    try {
      const token = localStorage.getItem('token');
      await axios.post('/api/tables/split', {
        primary_table_id: primaryTableId
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      toast.success('Tables split successfully');
      fetchTables();
    } catch (error) {
      toast.error('Failed to split tables');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Free':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'Occupied':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'Billed':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const groupedTables = tables.reduce((groups, table) => {
    const location = table.location || 'main';
    if (!groups[location]) {
      groups[location] = [];
    }
    groups[location].push(table);
    return groups;
  }, {});

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Table Management</h1>
        
        <div className="flex space-x-3">
          {selectedTables.length >= 2 && (
            <button
              onClick={handleMergeTables}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
            >
              Merge Selected ({selectedTables.length})
            </button>
          )}
          
          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center"
          >
            <FaPlus className="mr-2" />
            Add Table
          </button>
        </div>
      </div>

      {/* Table Grid by Location */}
      {Object.keys(groupedTables).map(location => (
        <div key={location} className="mb-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-4 capitalize flex items-center">
            <FaMapMarkerAlt className="mr-2 text-blue-600" />
            {location}
          </h2>
          
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {groupedTables[location].map(table => (
              <div
                key={table.id}
                className={`relative p-4 rounded-lg border-2 cursor-pointer transition-all ${
                  selectedTables.includes(table.id)
                    ? 'ring-4 ring-purple-400'
                    : ''
                } ${getStatusColor(table.status)}`}
                onClick={() => handleSelectTable(table.id)}
              >
                {/* Merged indicator */}
                {table.merged_with && (
                  <span className="absolute top-1 right-1 text-xs bg-purple-500 text-white px-2 py-1 rounded">
                    Merged
                  </span>
                )}

                <div className="text-center">
                  <div className="text-2xl font-bold mb-2">{table.table_number}</div>
                  
                  <div className="flex items-center justify-center text-sm text-gray-600 mb-2">
                    <FaUsers className="mr-1" />
                    {table.capacity}
                  </div>
                  
                  <div className="text-xs font-semibold mb-3">{table.status}</div>

                  {/* Action buttons */}
                  <div className="flex justify-center space-x-2" onClick={(e) => e.stopPropagation()}>
                    {table.status === 'Free' && (
                      <button
                        onClick={() => handleUpdateStatus(table.id, 'Occupied')}
                        className="px-2 py-1 text-xs bg-yellow-500 text-white rounded hover:bg-yellow-600"
                      >
                        Occupy
                      </button>
                    )}
                    
                    {table.status === 'Occupied' && (
                      <button
                        onClick={() => handleUpdateStatus(table.id, 'Free')}
                        className="px-2 py-1 text-xs bg-green-500 text-white rounded hover:bg-green-600"
                      >
                        Free
                      </button>
                    )}

                    {table.merged_with === null && table.status !== 'Occupied' && (
                      <button
                        onClick={() => handleDeleteTable(table.id)}
                        className="px-2 py-1 text-xs bg-red-500 text-white rounded hover:bg-red-600"
                      >
                        <FaTrash />
                      </button>
                    )}

                    {table.merged_with !== null && (
                      <button
                        onClick={() => handleSplitTable(table.merged_with)}
                        className="px-2 py-1 text-xs bg-indigo-500 text-white rounded hover:bg-indigo-600"
                      >
                        Split
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}

      {/* Add Table Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-2xl font-bold mb-4">Add New Table</h2>
            
            <form onSubmit={handleAddTable}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Table Number/Name
                </label>
                <input
                  type="text"
                  value={newTable.table_number}
                  onChange={(e) => setNewTable({ ...newTable, table_number: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Capacity
                </label>
                <input
                  type="number"
                  value={newTable.capacity}
                  onChange={(e) => setNewTable({ ...newTable, capacity: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  min="1"
                  required
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Location
                </label>
                <select
                  value={newTable.location}
                  onChange={(e) => setNewTable({ ...newTable, location: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="main">Main Hall</option>
                  <option value="patio">Patio</option>
                  <option value="private">Private Room</option>
                  <option value="bar">Bar Area</option>
                </select>
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Add Table
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TableManagement;

