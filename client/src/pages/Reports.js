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
import { format, subDays, getWeek, parseISO } from 'date-fns';
import toast from 'react-hot-toast';
import {
  FiDownload,
  FiCalendar,
  FiFilter,
  FiBarChart2,
  FiShoppingCart,
  FiPrinter,
  FiTrendingUp,
  FiDollarSign,
  FiCreditCard
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

const Reports = () => {
  const { hasRole } = useAuth();
  const { currency, formatCurrency } = useCurrency();
  const [activeTab, setActiveTab] = useState('sales');
  const [loading, setLoading] = useState(false);
  const [dateRange, setDateRange] = useState({
    startDate: format(subDays(new Date(), 30), 'yyyy-MM-dd'),
    endDate: format(new Date(), 'yyyy-MM-dd')
  });
  const [period, setPeriod] = useState('daily');
  const [sortBy, setSortBy] = useState('total_revenue'); // For items sorting
  const [sortOrder, setSortOrder] = useState('desc');
  const [topItemsLimit, setTopItemsLimit] = useState(10);
  
  // Data states
  const [salesData, setSalesData] = useState([]);
  const [topItemsData, setTopItemsData] = useState([]);
  const [staffPerformanceData, setStaffPerformanceData] = useState([]);
  const [salesSummary, setSalesSummary] = useState({
    totalSales: 0,
    totalOrders: 0,
    totalItems: 0
  });
  const [dailyPayments, setDailyPayments] = useState([]);

  useEffect(() => {
    if (hasRole(['manager', 'admin'])) {
      fetchData();
    }
  }, [hasRole, dateRange, period, topItemsLimit]);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      console.log('Fetching reports data...', { dateRange, period, topItemsLimit });
      
      const [salesRes, topItemsRes, paymentsRes] = await Promise.all([
        axios.get(`/api/reports/sales?startDate=${dateRange.startDate}&endDate=${dateRange.endDate}&period=${period}`),
        axios.get(`/api/reports/top-items?startDate=${dateRange.startDate}&endDate=${dateRange.endDate}&limit=${topItemsLimit}`),
        axios.get(`/api/reports/daily-payments?startDate=${dateRange.startDate}&endDate=${dateRange.endDate}`)
      ]);

      console.log('Sales data:', salesRes.data);
      console.log('Top items data:', topItemsRes.data);
      console.log('Payments data:', paymentsRes.data);

      setSalesData(salesRes.data || []);
      setTopItemsData(topItemsRes.data || []);
      setDailyPayments(paymentsRes.data || []);
      
      // Calculate summary
      const totalSales = (salesRes.data || []).reduce((sum, item) => sum + (item.total_sales || 0), 0);
      const totalOrders = (salesRes.data || []).reduce((sum, item) => sum + (item.total_orders || 0), 0);
      const totalItems = (salesRes.data || []).reduce((sum, item) => sum + (item.total_items_sold || 0), 0);
      
      setSalesSummary({
        totalSales,
        totalOrders,
        totalItems
      });
      
      toast.success('Reports data loaded successfully');
    } catch (error) {
      console.error('Error fetching reports data:', error);
      console.error('Error details:', error.response?.data);
      toast.error(`Failed to load reports: ${error.response?.data?.error || error.message}`);
    } finally {
      setLoading(false);
    }
  }, [dateRange, period, topItemsLimit]);

  const handleDateRangeChange = (e) => {
    const { name, value } = e.target;
    setDateRange(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const setQuickDateRange = (range) => {
    const today = new Date();
    let start, end;

    switch(range) {
      case 'today':
        start = end = format(today, 'yyyy-MM-dd');
        break;
      case 'yesterday':
        const yesterday = subDays(today, 1);
        start = end = format(yesterday, 'yyyy-MM-dd');
        break;
      case 'week':
        start = format(subDays(today, 7), 'yyyy-MM-dd');
        end = format(today, 'yyyy-MM-dd');
        break;
      case 'month':
        start = format(subDays(today, 30), 'yyyy-MM-dd');
        end = format(today, 'yyyy-MM-dd');
        break;
      default:
        return;
    }

    setDateRange({ startDate: start, endDate: end });
  };

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  const getSortedItems = () => {
    return [...topItemsData].sort((a, b) => {
      const aVal = a[sortBy] || 0;
      const bVal = b[sortBy] || 0;
      return sortOrder === 'asc' ? aVal - bVal : bVal - aVal;
    });
  };

  const exportToCSV = (data, filename) => {
    if (!data || data.length === 0) {
      toast.error('No data to export');
      return;
    }

    const headers = Object.keys(data[0]).join(',');
    const rows = data.map(row => Object.values(row).join(','));
    const csvContent = [headers, ...rows].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${filename}_${format(new Date(), 'yyyy-MM-dd')}.csv`;
    link.click();
    window.URL.revokeObjectURL(url);
    
    toast.success('Report exported successfully');
  };

  const handlePrint = () => {
    let receiptHTML = '';

    // Generate different receipts based on active tab
    if (activeTab === 'sales') {
      receiptHTML = generateSalesReceipt();
    } else if (activeTab === 'payments') {
      receiptHTML = generateDailyReportReceipt();
    } else if (activeTab === 'items') {
      receiptHTML = generateTopItemsReceipt();
    }

    // Open in new window and print
    const printWindow = window.open('', '', 'width=302,height=600');
    printWindow.document.write(receiptHTML);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 250);
  };

  const generateSalesReceipt = () => {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Sales Report</title>
        <meta charset="UTF-8">
        <style>
          @page {
            size: 80mm auto;
            margin: 0;
          }
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          body {
            width: 80mm;
            font-family: 'Courier New', monospace;
            font-size: 11px;
            padding: 3mm;
            line-height: 1.3;
            color: #000;
            background: white;
          }
          .center { 
            text-align: center; 
            width: 100%;
          }
          .bold { font-weight: bold; }
          .line { 
            border-top: 1px dashed #000; 
            margin: 4px 0; 
            width: 100%;
          }
          .double-line { 
            border-top: 2px solid #000; 
            margin: 6px 0; 
            width: 100%;
          }
          .row { 
            display: table;
            width: 100%;
            margin: 1px 0;
          }
          .row span:first-child {
            display: table-cell;
            text-align: left;
          }
          .row span:last-child {
            display: table-cell;
            text-align: right;
          }
          .header { 
            text-align: center; 
            font-weight: bold; 
            margin-bottom: 8px; 
            border-bottom: 2px dashed #000; 
            padding-bottom: 8px; 
          }
          .section { 
            margin: 8px 0; 
            width: 100%;
          }
          .section-title { 
            text-align: center; 
            font-weight: bold; 
            margin: 8px 0;
            font-size: 11px;
          }
          .total { 
            font-size: 14px; 
            font-weight: bold; 
            text-align: center; 
            margin: 8px 0; 
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div style="font-size: 16px;">SALES REPORT</div>
          <div style="font-size: 12px;">Restaurant POS</div>
          <div style="font-size: 10px; margin-top: 5px;">${format(parseISO(dateRange.startDate), 'MMM dd, yyyy')} - ${format(parseISO(dateRange.endDate), 'MMM dd, yyyy')}</div>
          <div style="font-size: 10px;">${format(new Date(), 'MMM dd, yyyy hh:mm a')}</div>
        </div>

        <div class="section">
          <div class="row"><span>Total Sales:</span><span class="bold">$${salesSummary.totalSales.toFixed(2)}</span></div>
          <div class="row"><span>Total Orders:</span><span class="bold">${salesSummary.totalOrders}</span></div>
          <div class="row"><span>Items Sold:</span><span class="bold">${salesSummary.totalItems}</span></div>
        </div>

        <div class="line"></div>

        <div class="section">
          <div class="section-title">DAILY SALES</div>
          ${salesData.map(item => `
            <div style="margin-bottom: 6px;">
              <div class="bold" style="font-size: 11px; margin-bottom: 2px;">${format(parseISO(item.period), 'MMM dd, yyyy')}</div>
              <div class="row" style="font-size: 10px;"><span>Sales:</span><span>${currency}${item.total_sales?.toFixed(2) || '0.00'}</span></div>
              <div class="row" style="font-size: 10px;"><span>Orders:</span><span>${item.total_orders || 0}</span></div>
              <div class="row" style="font-size: 10px;"><span>Items:</span><span>${item.total_items_sold || 0}</span></div>
            </div>
          `).join('')}
        </div>

        <div class="line"></div>

        <div class="section">
          <div class="section-title">PAYMENT BREAKDOWN</div>
          ${dailyPayments.map(payment => `
            <div style="margin-bottom: 6px;">
              <div class="bold" style="font-size: 11px; margin-bottom: 2px;">${format(parseISO(payment.date), 'MMM dd, yyyy')}</div>
              <div class="row" style="font-size: 10px;"><span>Cash:</span><span>${currency}${(payment.cash || 0).toFixed(2)}</span></div>
              <div class="row" style="font-size: 10px;"><span>Card:</span><span>${currency}${(payment.card || 0).toFixed(2)}</span></div>
              <div class="row" style="font-size: 10px;"><span>UPI:</span><span>${currency}${(payment.upi || 0).toFixed(2)}</span></div>
              <div class="row bold" style="font-size: 10px; margin-top: 2px;"><span>Day Total:</span><span>${currency}${((payment.cash || 0) + (payment.card || 0) + (payment.upi || 0)).toFixed(2)}</span></div>
            </div>
          `).join('')}
        </div>

        <div class="line"></div>

        <div class="section">
          <div class="section-title">TOP SELLING ITEMS</div>
          ${getSortedItems().slice(0, 5).map((item, index) => `
            <div style="margin-bottom: 6px;">
              <div class="bold" style="font-size: 11px; margin-bottom: 2px;">#${index + 1} ${item.name}</div>
              <div class="row" style="font-size: 10px; padding-left: 8px;"><span>Qty:</span><span>${item.total_quantity}</span></div>
              <div class="row" style="font-size: 10px; padding-left: 8px;"><span>Revenue:</span><span>${currency}${item.total_revenue?.toFixed(2) || '0.00'}</span></div>
            </div>
          `).join('')}
        </div>

        <div class="double-line"></div>

        <div class="total">
          <div style="font-size: 14px;">GRAND TOTAL</div>
          <div style="font-size: 18px; margin-top: 5px;">${currency}${salesSummary.totalSales.toFixed(2)}</div>
        </div>

        <div class="center" style="margin-top: 15px; font-size: 10px;">================================</div>
        <div class="center" style="margin-top: 5px; font-size: 10px;">Thank you for your business!</div>
        <div class="center" style="margin-top: 5px; font-size: 10px;">================================</div>
      </body>
      </html>
    `;
  };

  const generateDailyReportReceipt = () => {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Daily Report</title>
        <meta charset="UTF-8">
        <style>
          @page { size: 80mm auto; margin: 0; }
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { width: 80mm; font-family: 'Courier New', monospace; font-size: 11px; padding: 3mm; line-height: 1.3; }
          .center { text-align: center; width: 100%; }
          .bold { font-weight: bold; }
          .line { border-top: 1px dashed #000; margin: 4px 0; width: 100%; }
          .double-line { border-top: 2px solid #000; margin: 6px 0; width: 100%; }
          .row { display: table; width: 100%; margin: 1px 0; }
          .row span:first-child { display: table-cell; text-align: left; width: 60%; }
          .row span:last-child { display: table-cell; text-align: right; width: 40%; }
          .header { text-align: center; font-weight: bold; margin-bottom: 8px; border-bottom: 2px dashed #000; padding-bottom: 8px; }
          .section { margin: 8px 0; }
        </style>
      </head>
      <body>
        <div class="header">
          <div style="font-size: 16px;">DAILY REPORT</div>
          <div style="font-size: 12px;">Payment Breakdown</div>
          <div style="font-size: 10px; margin-top: 5px;">${format(parseISO(dateRange.startDate), 'MMM dd, yyyy')} - ${format(parseISO(dateRange.endDate), 'MMM dd, yyyy')}</div>
          <div style="font-size: 10px;">${format(new Date(), 'MMM dd, yyyy hh:mm a')}</div>
        </div>

        <div class="section">
          ${dailyPayments.map(payment => `
            <div style="margin-bottom: 6px;">
              <div class="bold" style="font-size: 11px; margin-bottom: 2px;">${format(parseISO(payment.date), 'MMM dd, yyyy')}</div>
              <div class="row" style="font-size: 10px;"><span>Cash:</span><span>${currency}${(payment.cash || 0).toFixed(2)}</span></div>
              <div class="row" style="font-size: 10px;"><span>Card:</span><span>${currency}${(payment.card || 0).toFixed(2)}</span></div>
              <div class="row" style="font-size: 10px;"><span>UPI:</span><span>${currency}${(payment.upi || 0).toFixed(2)}</span></div>
              <div class="row bold" style="font-size: 10px; margin-top: 2px;"><span>Day Total:</span><span>${currency}${((payment.cash || 0) + (payment.card || 0) + (payment.upi || 0)).toFixed(2)}</span></div>
              <div class="line"></div>
            </div>
          `).join('')}
        </div>

        <div class="double-line"></div>

        <div style="text-align: center; margin: 8px 0;">
          <div class="bold" style="font-size: 12px;">TOTAL SUMMARY</div>
          <div class="row" style="margin-top: 4px;"><span>Total Cash:</span><span class="bold">${currency}${dailyPayments.reduce((sum, p) => sum + (p.cash || 0), 0).toFixed(2)}</span></div>
          <div class="row"><span>Total Card:</span><span class="bold">${currency}${dailyPayments.reduce((sum, p) => sum + (p.card || 0), 0).toFixed(2)}</span></div>
          <div class="row"><span>Total UPI:</span><span class="bold">${currency}${dailyPayments.reduce((sum, p) => sum + (p.upi || 0), 0).toFixed(2)}</span></div>
        </div>

        <div class="double-line"></div>

        <div class="center" style="font-size: 16px; font-weight: bold; margin: 10px 0;">
          GRAND TOTAL<br>
          <span style="font-size: 20px;">${currency}${dailyPayments.reduce((sum, p) => sum + (p.cash || 0) + (p.card || 0) + (p.upi || 0), 0).toFixed(2)}</span>
        </div>

        <div class="center" style="margin-top: 15px; font-size: 10px;">================================</div>
        <div class="center" style="margin-top: 5px; font-size: 10px;">Thank you for your business!</div>
        <div class="center" style="margin-top: 5px; font-size: 10px;">================================</div>
      </body>
      </html>
    `;
  };

  const generateTopItemsReceipt = () => {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Top Selling Items</title>
        <meta charset="UTF-8">
        <style>
          @page { size: 80mm auto; margin: 0; }
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { width: 80mm; font-family: 'Courier New', monospace; font-size: 11px; padding: 3mm; line-height: 1.3; }
          .center { text-align: center; width: 100%; }
          .bold { font-weight: bold; }
          .line { border-top: 1px dashed #000; margin: 4px 0; width: 100%; }
          .double-line { border-top: 2px solid #000; margin: 6px 0; width: 100%; }
          .row { display: table; width: 100%; margin: 1px 0; }
          .row span:first-child { display: table-cell; text-align: left; width: 60%; }
          .row span:last-child { display: table-cell; text-align: right; width: 40%; }
          .header { text-align: center; font-weight: bold; margin-bottom: 8px; border-bottom: 2px dashed #000; padding-bottom: 8px; }
          .section { margin: 8px 0; }
        </style>
      </head>
      <body>
        <div class="header">
          <div style="font-size: 16px;">TOP SELLING ITEMS</div>
          <div style="font-size: 12px;">Best Performers</div>
          <div style="font-size: 10px; margin-top: 5px;">${format(parseISO(dateRange.startDate), 'MMM dd, yyyy')} - ${format(parseISO(dateRange.endDate), 'MMM dd, yyyy')}</div>
          <div style="font-size: 10px;">${format(new Date(), 'MMM dd, yyyy hh:mm a')}</div>
        </div>

        <div class="section">
          ${getSortedItems().map((item, index) => `
            <div style="margin-bottom: 8px;">
              <div class="bold" style="font-size: 12px; margin-bottom: 2px;">
                <span style="display: inline-block; width: 25px; text-align: center; background: #000; color: #fff; border-radius: 3px; margin-right: 5px;">#${index + 1}</span>
                ${item.name}
              </div>
              <div class="row" style="font-size: 10px; padding-left: 8px;"><span>Category:</span><span>${item.category}</span></div>
              <div class="row" style="font-size: 10px; padding-left: 8px;"><span>Qty Sold:</span><span>${item.total_quantity}</span></div>
              <div class="row" style="font-size: 10px; padding-left: 8px;"><span>Revenue:</span><span>${currency}${item.total_revenue?.toFixed(2) || '0.00'}</span></div>
              <div class="row" style="font-size: 10px; padding-left: 8px;"><span>Orders:</span><span>${item.order_count}</span></div>
              <div class="line"></div>
            </div>
          `).join('')}
        </div>

        <div class="double-line"></div>

        <div class="center" style="font-size: 14px; font-weight: bold; margin: 10px 0;">
          TOTAL ITEMS SOLD<br>
          <span style="font-size: 18px;">${getSortedItems().reduce((sum, item) => sum + item.total_quantity, 0)}</span>
        </div>

        <div class="center" style="font-size: 14px; font-weight: bold; margin: 10px 0;">
          TOTAL REVENUE<br>
          <span style="font-size: 18px;">${currency}${getSortedItems().reduce((sum, item) => sum + (item.total_revenue || 0), 0).toFixed(2)}</span>
        </div>

        <div class="center" style="margin-top: 15px; font-size: 10px;">================================</div>
        <div class="center" style="margin-top: 5px; font-size: 10px;">Thank you for your business!</div>
        <div class="center" style="margin-top: 5px; font-size: 10px;">================================</div>
      </body>
      </html>
    `;
  };

  if (!hasRole(['manager', 'admin'])) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h1>
          <p className="text-gray-600">You don't have permission to view reports.</p>
        </div>
      </div>
    );
  }

  const salesChartData = {
    labels: salesData.map(item => {
      const date = parseISO(item.period);
      return period === 'daily' ? format(date, 'MMM dd') : 
             period === 'weekly' ? `Week ${getWeek(date)}` :
             format(date, 'MMM yyyy');
    }),
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
    labels: salesData.map(item => {
      const date = parseISO(item.period);
      return period === 'daily' ? format(date, 'MMM dd') : 
             period === 'weekly' ? `Week ${getWeek(date)}` :
             format(date, 'MMM yyyy');
    }),
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
    labels: topItemsData.map(item => item.name),
    datasets: [
      {
        data: topItemsData.map(item => item.total_quantity),
        backgroundColor: [
          '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6',
          '#06B6D4', '#84CC16', '#F97316', '#EC4899', '#6366F1'
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

  const tabs = [
    { id: 'sales', name: 'Sales Report', icon: FiBarChart2 },
    { id: 'payments', name: 'Daily Report', icon: FiDollarSign },
    { id: 'items', name: 'Top Selling Items', icon: FiTrendingUp },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Print Header - Only visible when printing */}
      <div className="hidden print:block mb-8 border-b-2 border-gray-800 pb-4">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900">SALES REPORT</h1>
          <p className="text-gray-700 mt-2 text-lg">Restaurant Billing System</p>
          <p className="text-gray-600 mt-1">
            Period: {format(new Date(dateRange.startDate), 'MMM dd, yyyy')} - {format(new Date(dateRange.endDate), 'MMM dd, yyyy')}
          </p>
          <p className="text-gray-600">Generated on: {format(new Date(), 'MMM dd, yyyy hh:mm a')}</p>
        </div>
      </div>

      {/* Header */}
      <div className="mb-8 flex justify-between items-start no-print">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Reports & Analytics</h1>
          <p className="text-gray-600 mt-2">Comprehensive business insights and analytics</p>
        </div>
        <button
          onClick={handlePrint}
          className="flex items-center space-x-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-3 rounded-lg hover:from-blue-700 hover:to-blue-800 shadow-lg transition-all transform hover:scale-105"
        >
          <FiPrinter className="h-5 w-5" />
          <span className="font-medium">Print Report</span>
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-lg p-6 mb-8 no-print">
        {/* Quick Date Filters */}
        <div className="flex flex-wrap gap-3 mb-4 pb-4 border-b border-gray-200">
          <button
            onClick={() => setQuickDateRange('today')}
            className="px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all shadow-md transform hover:scale-105 text-sm font-medium"
          >
            Today
          </button>
          <button
            onClick={() => setQuickDateRange('yesterday')}
            className="px-4 py-2 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-lg hover:from-purple-600 hover:to-purple-700 transition-all shadow-md transform hover:scale-105 text-sm font-medium"
          >
            Yesterday
          </button>
          <button
            onClick={() => setQuickDateRange('week')}
            className="px-4 py-2 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg hover:from-green-600 hover:to-green-700 transition-all shadow-md transform hover:scale-105 text-sm font-medium"
          >
            Last 7 Days
          </button>
          <button
            onClick={() => setQuickDateRange('month')}
            className="px-4 py-2 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-lg hover:from-orange-600 hover:to-orange-700 transition-all shadow-md transform hover:scale-105 text-sm font-medium"
          >
            Last 30 Days
          </button>
        </div>

        {/* Custom Date Range */}
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center space-x-2">
            <FiCalendar className="text-gray-500" />
            <label className="text-sm font-medium text-gray-700">From:</label>
            <input
              type="date"
              name="startDate"
              value={dateRange.startDate}
              onChange={handleDateRangeChange}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div className="flex items-center space-x-2">
            <label className="text-sm font-medium text-gray-700">To:</label>
            <input
              type="date"
              name="endDate"
              value={dateRange.endDate}
              onChange={handleDateRangeChange}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <button
            onClick={fetchData}
            disabled={loading}
            className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-2 rounded-lg text-sm font-medium hover:from-blue-700 hover:to-blue-800 disabled:bg-gray-400 shadow-md transition-all transform hover:scale-105"
          >
            {loading ? 'Loading...' : 'Refresh Data'}
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-8">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon className="h-4 w-4" />
                <span>{tab.name}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'sales' && (
        <div className="space-y-8">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-xl p-6 text-white transform hover:scale-105 transition-all">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm font-medium uppercase tracking-wide">Total Sales</p>
                  <p className="text-4xl font-bold mt-3">${salesSummary.totalSales.toFixed(2)}</p>
                  <p className="text-blue-200 text-xs mt-2">Revenue Generated</p>
                </div>
                <div className="bg-blue-400 bg-opacity-30 rounded-full p-4">
                  <FiDollarSign className="h-10 w-10" />
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-xl p-6 text-white transform hover:scale-105 transition-all">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100 text-sm font-medium uppercase tracking-wide">Total Orders</p>
                  <p className="text-4xl font-bold mt-3">{salesSummary.totalOrders}</p>
                  <p className="text-green-200 text-xs mt-2">Orders Completed</p>
                </div>
                <div className="bg-green-400 bg-opacity-30 rounded-full p-4">
                  <FiShoppingCart className="h-10 w-10" />
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-xl p-6 text-white transform hover:scale-105 transition-all">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-100 text-sm font-medium uppercase tracking-wide">Items Sold</p>
                  <p className="text-4xl font-bold mt-3">{salesSummary.totalItems}</p>
                  <p className="text-purple-200 text-xs mt-2">Total Products</p>
                </div>
                <div className="bg-purple-400 bg-opacity-30 rounded-full p-4">
                  <FiBarChart2 className="h-10 w-10" />
                </div>
              </div>
            </div>
          </div>

          {/* Sales Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-white rounded-xl shadow-xl p-6 border border-gray-100">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className="text-xl font-bold text-gray-900">Sales Trend</h3>
                  <p className="text-sm text-gray-600 mt-1">Revenue over time (Last {salesData.length} days)</p>
                </div>
                <button
                  onClick={() => exportToCSV(salesData, 'sales_trend')}
                  className="no-print flex items-center space-x-2 bg-blue-50 text-blue-600 px-4 py-2 rounded-lg hover:bg-blue-100 transition-colors"
                >
                  <FiDownload className="h-4 w-4" />
                  <span className="text-sm font-medium">CSV</span>
                </button>
              </div>
              <div className="h-72">
                <Line data={salesChartData} options={{
                  ...chartOptions,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: { display: false },
                    tooltip: {
                      backgroundColor: 'rgba(0, 0, 0, 0.8)',
                      padding: 12,
                      titleFont: { size: 14, weight: 'bold' },
                      bodyFont: { size: 13 }
                    }
                  }
                }} />
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-xl p-6 border border-gray-100">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className="text-xl font-bold text-gray-900">Orders Trend</h3>
                  <p className="text-sm text-gray-600 mt-1">Order count over time (Last {salesData.length} days)</p>
                </div>
                <button
                  onClick={() => exportToCSV(salesData, 'orders_trend')}
                  className="no-print flex items-center space-x-2 bg-green-50 text-green-600 px-4 py-2 rounded-lg hover:bg-green-100 transition-colors"
                >
                  <FiDownload className="h-4 w-4" />
                  <span className="text-sm font-medium">CSV</span>
                </button>
              </div>
              <div className="h-72">
                <Bar data={ordersChartData} options={{
                  ...chartOptions,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: { display: false },
                    tooltip: {
                      backgroundColor: 'rgba(0, 0, 0, 0.8)',
                      padding: 12,
                      titleFont: { size: 14, weight: 'bold' },
                      bodyFont: { size: 13 }
                    }
                  }
                }} />
              </div>
            </div>
          </div>

          {/* Daily Sales Summary Table */}
          <div className="bg-white rounded-xl shadow-xl border border-gray-100">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-xl font-bold text-gray-900">Daily Sales Summary</h3>
              <p className="text-sm text-gray-600 mt-1">Detailed breakdown by date</p>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                      Total Sales
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                      Orders
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                      Items Sold
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {salesData.map((item, index) => (
                    <tr key={index} className="hover:bg-blue-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {period === 'daily' ? format(parseISO(item.period), 'MMM dd, yyyy') : 
                         period === 'weekly' ? `Week ${getWeek(parseISO(item.period))}` :
                         format(parseISO(item.period), 'MMM yyyy')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-base font-bold text-green-600">
                        {formatCurrency(item.total_sales || 0)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full font-medium">
                          {item.total_orders || 0}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {item.total_items_sold || 0}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'payments' && (
        <div className="space-y-8">
          {/* Daily Payments Table */}
          <div className="bg-white rounded-xl shadow-xl border border-gray-100">
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
              <div>
                <h3 className="text-xl font-bold text-gray-900">Daily Payment Breakdown</h3>
                <p className="text-sm text-gray-600 mt-1">Payment method wise collection</p>
              </div>
              <button
                onClick={() => exportToCSV(dailyPayments, 'daily_payments')}
                className="no-print flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                <FiDownload className="h-4 w-4" />
                <span className="text-sm font-medium">Export CSV</span>
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                      <div className="flex items-center space-x-2">
                        <FiDollarSign className="h-4 w-4 text-green-600" />
                        <span>Cash</span>
                      </div>
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                      <div className="flex items-center space-x-2">
                        <FiCreditCard className="h-4 w-4 text-blue-600" />
                        <span>Card</span>
                      </div>
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                      <div className="flex items-center space-x-2">
                        <FiCreditCard className="h-4 w-4 text-purple-600" />
                        <span>UPI</span>
                      </div>
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider bg-blue-50">
                      Total Amount
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {dailyPayments.map((payment, index) => {
                    const total = (payment.cash || 0) + (payment.card || 0) + (payment.upi || 0);
                    return (
                      <tr key={index} className="hover:bg-blue-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {format(parseISO(payment.date), 'MMM dd, yyyy')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <span className="text-green-700 font-semibold">{formatCurrency(payment.cash || 0)}</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <span className="text-blue-700 font-semibold">{formatCurrency(payment.card || 0)}</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <span className="text-purple-700 font-semibold">{formatCurrency(payment.upi || 0)}</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-base font-bold text-gray-900 bg-blue-50">
                          {formatCurrency(total)}
                        </td>
                      </tr>
                    );
                  })}
                  {dailyPayments.length > 0 && (
                    <tr className="bg-gradient-to-r from-gray-100 to-gray-200 font-bold">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        TOTAL
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-green-700">
                        {formatCurrency(dailyPayments.reduce((sum, p) => sum + (p.cash || 0), 0))}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-700">
                        {formatCurrency(dailyPayments.reduce((sum, p) => sum + (p.card || 0), 0))}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-purple-700">
                        {formatCurrency(dailyPayments.reduce((sum, p) => sum + (p.upi || 0), 0))}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-lg font-bold text-gray-900">
                        {formatCurrency(dailyPayments.reduce((sum, p) => sum + (p.cash || 0) + (p.card || 0) + (p.upi || 0), 0))}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Payment Method Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-xl p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100 text-sm font-medium uppercase tracking-wide">Cash Payments</p>
                  <p className="text-4xl font-bold mt-3">
                    {formatCurrency(dailyPayments.reduce((sum, p) => sum + (p.cash || 0), 0))}
                  </p>
                  <p className="text-green-200 text-xs mt-2">Total Cash Collected</p>
                </div>
                <div className="bg-green-400 bg-opacity-30 rounded-full p-4">
                  <FiDollarSign className="h-10 w-10" />
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-xl p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm font-medium uppercase tracking-wide">Card Payments</p>
                  <p className="text-4xl font-bold mt-3">
                    {formatCurrency(dailyPayments.reduce((sum, p) => sum + (p.card || 0), 0))}
                  </p>
                  <p className="text-blue-200 text-xs mt-2">Total Card Payments</p>
                </div>
                <div className="bg-blue-400 bg-opacity-30 rounded-full p-4">
                  <FiCreditCard className="h-10 w-10" />
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-xl p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-100 text-sm font-medium uppercase tracking-wide">UPI Payments</p>
                  <p className="text-4xl font-bold mt-3">
                    {formatCurrency(dailyPayments.reduce((sum, p) => sum + (p.upi || 0), 0))}
                  </p>
                  <p className="text-purple-200 text-xs mt-2">Total UPI Transactions</p>
                </div>
                <div className="bg-purple-400 bg-opacity-30 rounded-full p-4">
                  <FiCreditCard className="h-10 w-10" />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'items' && (
        <div className="space-y-8">
          {/* Controls */}
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex flex-wrap items-center gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Show Top</label>
                <select
                  value={topItemsLimit}
                  onChange={(e) => setTopItemsLimit(parseInt(e.target.value))}
                  className="border border-gray-300 rounded-md px-3 py-2 text-sm"
                >
                  <option value="5">5 Items</option>
                  <option value="10">10 Items</option>
                  <option value="20">20 Items</option>
                  <option value="50">50 Items</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Sort By</label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="border border-gray-300 rounded-md px-3 py-2 text-sm"
                >
                  <option value="total_revenue">Revenue</option>
                  <option value="total_quantity">Quantity Sold</option>
                  <option value="order_count">Order Count</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Order</label>
                <select
                  value={sortOrder}
                  onChange={(e) => setSortOrder(e.target.value)}
                  className="border border-gray-300 rounded-md px-3 py-2 text-sm"
                >
                  <option value="desc">Highest First</option>
                  <option value="asc">Lowest First</option>
                </select>
              </div>

              <div className="ml-auto">
                <label className="block text-sm font-medium text-gray-700 mb-1 opacity-0">Export</label>
                <button
                  onClick={() => exportToCSV(getSortedItems(), 'top_items_report')}
                  className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
                >
                  <FiDownload className="h-4 w-4" />
                  <span className="text-sm">Export CSV</span>
                </button>
              </div>
            </div>
          </div>

          {/* Top Items Chart */}
          <div className="bg-white rounded-xl shadow-xl p-6 border border-gray-100">
            <h3 className="text-xl font-bold text-gray-900 mb-6">Top Selling Items by Rank</h3>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="h-80 flex items-center justify-center">
                <Doughnut data={topItemsChartData} options={{
                  ...chartOptions,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      position: 'bottom',
                      labels: {
                        font: {
                          size: 12,
                          weight: 'bold'
                        },
                        padding: 15
                      }
                    }
                  }
                }} />
              </div>
              <div className="space-y-3">
                {getSortedItems().slice(0, 10).map((item, index) => {
                  const rankColors = [
                    'from-yellow-400 to-yellow-600',
                    'from-gray-300 to-gray-500',
                    'from-orange-400 to-orange-600',
                    'from-blue-400 to-blue-600',
                    'from-purple-400 to-purple-600'
                  ];
                  const rankColor = rankColors[index] || 'from-gray-400 to-gray-600';
                  
                  return (
                    <div key={index} className="flex justify-between items-center p-4 bg-gradient-to-r from-gray-50 to-white rounded-xl border border-gray-200 hover:shadow-lg transition-all transform hover:-translate-y-1">
                      <div className="flex items-center space-x-4">
                        <div className={`bg-gradient-to-br ${rankColor} text-white rounded-full w-12 h-12 flex items-center justify-center font-bold shadow-lg text-lg`}>
                          #{index + 1}
                        </div>
                        <div>
                          <p className="font-bold text-gray-900 text-base">{item.name}</p>
                          <p className="text-sm text-gray-600">{item.category}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-base font-bold text-green-600">{formatCurrency(item.total_revenue || 0)}</p>
                        <p className="text-sm text-gray-600">{item.total_quantity} sold</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Top Items Table */}
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Detailed Items Report</h3>
              <p className="text-sm text-gray-600 mt-1">Complete breakdown of all menu items performance</p>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Rank
                    </th>
                    <th 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:text-gray-700"
                      onClick={() => handleSort('name')}
                    >
                      Item Name {sortBy === 'name' && (sortOrder === 'asc' ? '↑' : '↓')}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Category
                    </th>
                    <th 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:text-gray-700"
                      onClick={() => handleSort('total_quantity')}
                    >
                      Quantity Sold {sortBy === 'total_quantity' && (sortOrder === 'asc' ? '↑' : '↓')}
                    </th>
                    <th 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:text-gray-700"
                      onClick={() => handleSort('total_revenue')}
                    >
                      Total Revenue {sortBy === 'total_revenue' && (sortOrder === 'asc' ? '↑' : '↓')}
                    </th>
                    <th 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:text-gray-700"
                      onClick={() => handleSort('order_count')}
                    >
                      Order Count {sortBy === 'order_count' && (sortOrder === 'asc' ? '↑' : '↓')}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Avg Price
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {getSortedItems().map((item, index) => (
                    <tr key={index} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        #{index + 1}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {item.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                          {item.category}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                        {item.total_quantity}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-600">
                        {formatCurrency(item.total_revenue || 0)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {item.order_count}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatCurrency(item.total_revenue / item.total_quantity)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default Reports;
