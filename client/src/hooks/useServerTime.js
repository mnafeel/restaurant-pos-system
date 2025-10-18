import { useState, useEffect } from 'react';
import axios from 'axios';

/**
 * Custom hook to sync with server's IST time
 * @returns {Object} { currentTime, formatted, date, time, timezone, loading, error }
 */
export const useServerTime = () => {
  const [serverTime, setServerTime] = useState(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch server time on mount
  useEffect(() => {
    const fetchServerTime = async () => {
      try {
        const response = await axios.get('/api/server-time');
        setServerTime(response.data);
        setCurrentTime(new Date(response.data.timestamp));
        setLoading(false);
      } catch (err) {
        console.error('Error fetching server time:', err);
        setError(err);
        setLoading(false);
        // Fallback to local time
        setCurrentTime(new Date());
      }
    };

    fetchServerTime();
  }, []);

  // Update current time every second
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(prevTime => new Date(prevTime.getTime() + 1000));
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Format time in Indian format
  const formatIndianDateTime = (date) => {
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    
    let hours = date.getHours();
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    
    hours = hours % 12;
    hours = hours ? hours : 12; // 0 should be 12
    const formattedHours = String(hours).padStart(2, '0');
    
    return {
      date: `${day}/${month}/${year}`,
      time: `${formattedHours}:${minutes}:${seconds} ${ampm}`,
      formatted: `${day}/${month}/${year} ${formattedHours}:${minutes} ${ampm}`,
      timeShort: `${formattedHours}:${minutes} ${ampm}`
    };
  };

  const formatted = formatIndianDateTime(currentTime);

  return {
    currentTime,
    formatted: formatted.formatted,
    date: formatted.date,
    time: formatted.time,
    timeShort: formatted.timeShort,
    timezone: serverTime?.timezone || 'Asia/Kolkata',
    offset: serverTime?.offset || '+05:30',
    loading,
    error
  };
};

/**
 * Format a date string to Indian format with IST timezone
 * @param {string|Date} date - Date to format
 * @returns {string} Formatted date string
 */
export const formatIndianDate = (dateInput) => {
  // Handle different date formats
  let d;
  if (typeof dateInput === 'string') {
    // SQLite CURRENT_TIMESTAMP stores UTC time (e.g., '2025-10-18 13:55:30')
    // Parse as UTC by adding 'Z' suffix
    d = new Date(dateInput + (dateInput.includes('Z') ? '' : 'Z'));
  } else if (dateInput instanceof Date) {
    d = dateInput;
  } else {
    d = new Date();
  }
  
  // Check if date is valid
  if (isNaN(d.getTime())) {
    console.error('Invalid date:', dateInput);
    return 'Invalid Date';
  }
  
  // Convert UTC to IST (UTC+5:30 = 330 minutes)
  const istOffset = 330 * 60 * 1000;
  const istTime = new Date(d.getTime() + istOffset);
  
  // Extract IST date/time components using UTC methods
  // (since we've already added the offset)
  const day = String(istTime.getUTCDate()).padStart(2, '0');
  const month = String(istTime.getUTCMonth() + 1).padStart(2, '0');
  const year = istTime.getUTCFullYear();
  
  let hours = istTime.getUTCHours();
  const minutes = String(istTime.getUTCMinutes()).padStart(2, '0');
  const ampm = hours >= 12 ? 'PM' : 'AM';
  
  hours = hours % 12;
  hours = hours ? hours : 12;
  const formattedHours = String(hours).padStart(2, '0');
  
  return `${day}/${month}/${year} ${formattedHours}:${minutes} ${ampm}`;
};

/**
 * Format a date string to Indian date only (no time)
 * @param {string|Date} date - Date to format
 * @returns {string} Formatted date string
 */
export const formatIndianDateOnly = (dateInput) => {
  let d;
  if (typeof dateInput === 'string') {
    d = new Date(dateInput + (dateInput.includes('Z') ? '' : 'Z'));
  } else if (dateInput instanceof Date) {
    d = dateInput;
  } else {
    d = new Date();
  }
  
  if (isNaN(d.getTime())) {
    return 'Invalid Date';
  }
  
  // Add IST offset (UTC+5:30)
  const istOffset = 330 * 60 * 1000;
  const istTime = new Date(d.getTime() + istOffset);
  
  const day = String(istTime.getUTCDate()).padStart(2, '0');
  const month = String(istTime.getUTCMonth() + 1).padStart(2, '0');
  const year = istTime.getUTCFullYear();
  
  return `${day}/${month}/${year}`;
};

/**
 * Format a date string to Indian time only (no date)
 * @param {string|Date} date - Date to format
 * @returns {string} Formatted time string
 */
export const formatIndianTimeOnly = (dateInput) => {
  let d;
  if (typeof dateInput === 'string') {
    d = new Date(dateInput + (dateInput.includes('Z') ? '' : 'Z'));
  } else if (dateInput instanceof Date) {
    d = dateInput;
  } else {
    d = new Date();
  }
  
  if (isNaN(d.getTime())) {
    return 'Invalid Time';
  }
  
  // Add IST offset (UTC+5:30)
  const istOffset = 330 * 60 * 1000;
  const istTime = new Date(d.getTime() + istOffset);
  
  let hours = istTime.getUTCHours();
  const minutes = String(istTime.getUTCMinutes()).padStart(2, '0');
  const ampm = hours >= 12 ? 'PM' : 'AM';
  
  hours = hours % 12;
  hours = hours ? hours : 12;
  const formattedHours = String(hours).padStart(2, '0');
  
  return `${formattedHours}:${minutes} ${ampm}`;
};

