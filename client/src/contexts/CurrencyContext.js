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

  useEffect(() => {
    fetchCurrency();
  }, []);

  const fetchCurrency = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await axios.get('/api/settings', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const selectedCurrency = response.data.currency || 'INR';
      setCurrencyCode(selectedCurrency);
      setCurrency(getCurrencySymbol(selectedCurrency));
    } catch (error) {
      console.error('Error fetching currency:', error);
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

