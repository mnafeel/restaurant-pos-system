import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const CurrencyContext = createContext();

export const useCurrency = () => {
  const context = useContext(CurrencyContext);
  if (!context) {
    throw new Error('useCurrency must be used within CurrencyProvider');
  }
  return context;
};

export const CurrencyProvider = ({ children }) => {
  const [currency, setCurrency] = useState('₹'); // Default to Rupee
  const [currencyCode, setCurrencyCode] = useState('INR');
  const [lastUserId, setLastUserId] = useState(null);

  useEffect(() => {
    // Initial fetch
    fetchCurrency();
    
    // Also fetch when user changes (login/logout)
    const intervalId = setInterval(() => {
      const token = localStorage.getItem('token');
      if (token) {
        fetchCurrency();
      }
    }, 5000); // Check every 5 seconds
    
    // Listen for currency changes (when shop settings are updated)
    const handleCurrencyChange = () => {
      console.log('Currency change detected, refreshing...');
      fetchCurrency();
    };
    
    window.addEventListener('currencyChanged', handleCurrencyChange);
    
    return () => {
      clearInterval(intervalId);
      window.removeEventListener('currencyChanged', handleCurrencyChange);
    };
  }, []);

  const fetchCurrency = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setCurrency('₹');
        setCurrencyCode('INR');
        return;
      }

      // First, get user info to determine shop_id
      const userResponse = await axios.get('/api/auth/me', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const user = userResponse.data;
      let selectedCurrency = 'INR'; // Default
      
      console.log('👤 User:', user.username, 'Role:', user.role, 'Shop ID:', user.shop_id);
      
      // If user belongs to a shop, get shop's currency
      if (user.shop_id) {
        try {
          const shopResponse = await axios.get(`/api/shops/${user.shop_id}`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          selectedCurrency = shopResponse.data.currency || 'INR';
          console.log('🏪 Shop currency:', selectedCurrency);
        } catch (shopErr) {
          console.log('⚠️ Could not fetch shop currency, using default INR');
          selectedCurrency = 'INR';
        }
      } else {
        // If owner or no shop, check global settings
        try {
          const settingsResponse = await axios.get('/api/settings', {
            headers: { Authorization: `Bearer ${token}` }
          });
          selectedCurrency = settingsResponse.data.currency || 'INR';
          console.log('⚙️ Global currency:', selectedCurrency);
        } catch (settingsErr) {
          console.log('⚠️ Could not fetch global currency, using default INR');
          selectedCurrency = 'INR';
        }
      }
      
      const symbol = getCurrencySymbol(selectedCurrency);
      console.log(`💰 Setting currency: ${selectedCurrency} (${symbol})`);
      
      setCurrencyCode(selectedCurrency);
      setCurrency(symbol);
    } catch (error) {
      console.error('❌ Error fetching currency:', error);
      // Use default
      setCurrency('₹');
      setCurrencyCode('INR');
    }
  };

  const getCurrencySymbol = (code) => {
    const currencyMap = {
      'USD': '$',
      'EUR': '€',
      'GBP': '£',
      'INR': '₹',
      'JPY': '¥',
      'CNY': '¥',
      'AUD': 'A$',
      'CAD': 'C$',
      'CHF': 'Fr',
      'HKD': 'HK$',
      'SGD': 'S$',
      'NZD': 'NZ$',
      'KRW': '₩',
      'MXN': 'Mex$',
      'BRL': 'R$',
      'ZAR': 'R',
      'RUB': '₽',
      'TRY': '₺',
      'AED': 'د.إ',
      'SAR': '﷼',
      'THB': '฿',
      'MYR': 'RM',
      'IDR': 'Rp',
      'PHP': '₱',
      'VND': '₫',
      'PKR': '₨',
      'BDT': '৳',
      'EGP': 'E£',
      'NGN': '₦',
      'KES': 'KSh',
      'LKR': 'රු'
    };
    
    return currencyMap[code] || code;
  };

  const formatCurrency = (amount) => {
    if (amount === null || amount === undefined || isNaN(amount)) {
      return `${currency}0.00`;
    }
    return `${currency}${Number(amount).toFixed(2)}`;
  };

  const value = {
    currency,
    currencyCode,
    formatCurrency,
    refreshCurrency: fetchCurrency
  };

  return (
    <CurrencyContext.Provider value={value}>
      {children}
    </CurrencyContext.Provider>
  );
};

