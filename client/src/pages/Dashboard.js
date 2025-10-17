import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useCurrency } from '../contexts/CurrencyContext';
import axios from 'axios';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import { format, subDays } from 'date-fns';
import toast from 'react-hot-toast';
import {
  FiTrendingUp,
  FiTrendingDown,
  FiShoppingCart,
  FiAlertTriangle,
  FiDollarSign,
  FiCalendar,
  FiBarChart2
} from 'react-icons/fi';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

const Dashboard = () => {
  const { user, hasRole } = useAuth();
  const { formatCurrency } = useCurrency();
  const [dashboardData, setDashboardData] = useState(null);
  const [salesData, setSalesData] = useState([]);
  const [topItems, setTopItems] = useState([]);
  const [staffPerformance, setStaffPerformance] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState({
    startDate: format(subDays(new Date(), 30), 'yyyy-MM-dd'),
    endDate: format(new Date(), 'yyyy-MM-dd')
  });

  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      
      const [dashboardRes, salesRes, topItemsRes, staffRes] = await Promise.all([
        axios.get('/api/reports/dashboard'),
        axios.get(`/api/reports/sales?startDate=${dateRange.startDate}&endDate=${dateRange.endDate}&period=daily`),
        axios.get(`/api/reports/top-items?startDate=${dateRange.startDate}&endDate=${dateRange.endDate}&limit=5`),
        axios.get(`/api/reports/staff-performance?startDate=${dateRange.startDate}&endDate=${dateRange.endDate}`)
      ]);

      setDashboardData(dashboardRes.data);
      setSalesData(salesRes.data);
      setTopItems(topItemsRes.data);
      setStaffPerformance(staffRes.data);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  }, [dateRange]);

  useEffect(() => {
    if (hasRole(['manager', 'admin'])) {
      fetchDashboardData();
    }
  }, [hasRole, fetchDashboardData]);

  const handleDateRangeChange = (e) => {
    const { name, value } = e.target;
    setDateRange(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const applyDateRange = () => {
    fetchDashboardData();
  };

  if (!hasRole(['manager', 'admin'])) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h1>
          <p className="text-gray-600">You don't have permission to view the dashboard.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  const salesChartData = {
    labels: salesData.map(item => format(new Date(item.period), 'MMM dd')),
    datasets: [
      {
        label: 'Sales ($)',
        data: salesData.map(item => item.total_sales),
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        tension: 0.1,
      },
    ],
  };

  const ordersChartData = {
    labels: salesData.map(item => format(new Date(item.period), 'MMM dd')),
    datasets: [
      {
        label: 'Orders',
        data: salesData.map(item => item.total_orders),
        backgroundColor: 'rgba(16, 185, 129, 0.8)',
        borderColor: 'rgb(16, 185, 129)',
        borderWidth: 1,
      },
    ],
  };

  const topItemsChartData = {
    labels: topItems.map(item => item.name),
    datasets: [
      {
        data: topItems.map(item => item.total_quantity),
        backgroundColor: [
          '#3B82F6',
          '#10B981',
          '#F59E0B',
          '#EF4444',
          '#8B5CF6',
        ],
        borderWidth: 0,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
    },
    scales: {
      y: {
        beginAtZero: true,
      },
    },
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-2">Welcome back, {user?.first_name}!</p>
      </div>

      {/* Date Range Filter */}
      <div className="bg-white rounded-lg shadow p-6 mb-8">
        <div className="flex items-center space-x-4">
          <FiCalendar className="text-gray-500" />
          <div className="flex items-center space-x-2">
            <input
              type="date"
              name="startDate"
              value={dateRange.startDate}
              onChange={handleDateRangeChange}
              className="border border-gray-300 rounded-md px-3 py-2 text-sm"
            />
            <span className="text-gray-500">to</span>
            <input
              type="date"
              name="endDate"
              value={dateRange.endDate}
              onChange={handleDateRangeChange}
              className="border border-gray-300 rounded-md px-3 py-2 text-sm"
            />
            <button
              onClick={applyDateRange}
              className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm hover:bg-blue-700"
            >
              Apply
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <FiDollarSign className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Today's Sales</p>
              <p className="text-2xl font-semibold text-gray-900">
                {formatCurrency(dashboardData?.today.today_sales || 0)}
              </p>
              <div className="flex items-center mt-1">
                {dashboardData?.salesGrowth >= 0 ? (
                  <FiTrendingUp className="h-4 w-4 text-green-500" />
                ) : (
                  <FiTrendingDown className="h-4 w-4 text-red-500" />
                )}
                <span className={`text-sm ml-1 ${
                  dashboardData?.salesGrowth >= 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {dashboardData?.salesGrowth >= 0 ? '+' : ''}{formatCurrency(dashboardData?.salesGrowth || 0)}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <FiShoppingCart className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Today's Orders</p>
              <p className="text-2xl font-semibold text-gray-900">
                {dashboardData?.today.today_orders || 0}
              </p>
              <div className="flex items-center mt-1">
                {dashboardData?.ordersGrowth >= 0 ? (
                  <FiTrendingUp className="h-4 w-4 text-green-500" />
                ) : (
                  <FiTrendingDown className="h-4 w-4 text-red-500" />
                )}
                <span className={`text-sm ml-1 ${
                  dashboardData?.ordersGrowth >= 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {dashboardData?.ordersGrowth >= 0 ? '+' : ''}{dashboardData?.ordersGrowth || 0}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <FiBarChart2 className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Monthly Sales</p>
              <p className="text-2xl font-semibold text-gray-900">
                {formatCurrency(dashboardData?.thisMonth.month_sales || 0)}
              </p>
              <p className="text-sm text-gray-500">
                {dashboardData?.thisMonth.month_orders || 0} orders
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-orange-100 rounded-lg">
              <FiAlertTriangle className="h-6 w-6 text-orange-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Low Stock Items</p>
              <p className="text-2xl font-semibold text-gray-900">
                {dashboardData?.lowStockItems?.length || 0}
              </p>
              <p className="text-sm text-gray-500">Items need restocking</p>
            </div>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Sales Chart */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Sales Trend</h3>
          <Line data={salesChartData} options={chartOptions} />
        </div>

        {/* Orders Chart */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Orders Trend</h3>
          <Bar data={ordersChartData} options={chartOptions} />
        </div>
      </div>

      {/* Bottom Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Top Items */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Selling Items</h3>
          {topItems.length > 0 ? (
            <div className="space-y-4">
              <div className="h-64">
                <Doughnut data={topItemsChartData} options={chartOptions} />
              </div>
              <div className="space-y-2">
                {topItems.map((item, index) => (
                  <div key={index} className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">{item.name}</span>
                    <span className="text-sm font-medium text-gray-900">{item.total_quantity} sold</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">No data available</p>
          )}
        </div>

        {/* Staff Performance */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Staff Performance</h3>
          {staffPerformance.length > 0 ? (
            <div className="space-y-4">
              {staffPerformance.map((staff, index) => (
                <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">
                      {staff.first_name} {staff.last_name}
                    </p>
                    <p className="text-sm text-gray-600">@{staff.username}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900">
                      {formatCurrency(staff.total_sales || 0)}
                    </p>
                    <p className="text-xs text-gray-600">
                      {staff.orders_taken || 0} orders
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">No data available</p>
          )}
        </div>
      </div>

      {/* Low Stock Alert */}
      {dashboardData?.lowStockItems?.length > 0 && (
        <div className="mt-8 bg-orange-50 border border-orange-200 rounded-lg p-6">
          <div className="flex items-center mb-4">
            <FiAlertTriangle className="h-5 w-5 text-orange-600 mr-2" />
            <h3 className="text-lg font-semibold text-orange-900">Low Stock Alert</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {dashboardData.lowStockItems.map((item, index) => (
              <div key={index} className="bg-white rounded-lg p-4 border border-orange-200">
                <p className="font-medium text-gray-900">{item.name}</p>
                <p className="text-sm text-orange-600">
                  Stock: {item.stock_quantity} (Threshold: {item.low_stock_threshold})
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
