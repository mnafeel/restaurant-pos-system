import React, { createContext, useContext, useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const ThemeContext = createContext();

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
};

// Premium gradient themes for each page
const pageThemes = {
  '/dashboard': {
    name: 'Home',
    gradient: 'from-[#6D28D9] via-[#5B21B6] to-[#4F46E5]', // Deep violet → electric indigo
    navbarBg: 'from-[#6D28D9]/90 to-[#4F46E5]/90',
    cardBg: 'from-[#6D28D9]/10 to-[#4F46E5]/10',
    accentColor: '#6D28D9',
    textColor: 'text-white',
    icon: '🏠'
  },
  '/orders': {
    name: 'Orders',
    gradient: 'from-[#FBBF24] via-[#F59E0B] to-[#F97316]', // Amber gold → soft orange
    navbarBg: 'from-[#FBBF24]/90 to-[#F97316]/90',
    cardBg: 'from-[#FBBF24]/10 to-[#F97316]/10',
    accentColor: '#F59E0B',
    textColor: 'text-white',
    icon: '📦'
  },
  '/kitchen': {
    name: 'Kitchen',
    gradient: 'from-[#FB7185] via-[#F472B6] to-[#F43F5E]', // Bright coral → sunset red
    navbarBg: 'from-[#FB7185]/90 to-[#F43F5E]/90',
    cardBg: 'from-[#FB7185]/10 to-[#F43F5E]/10',
    accentColor: '#F43F5E',
    textColor: 'text-white',
    icon: '🍳'
  },
  '/tables': {
    name: 'Tables',
    gradient: 'from-[#10B981] via-[#14B8A6] to-[#0EA5E9]', // Emerald green → teal blue
    navbarBg: 'from-[#10B981]/90 to-[#0EA5E9]/90',
    cardBg: 'from-[#10B981]/10 to-[#0EA5E9]/10',
    accentColor: '#10B981',
    textColor: 'text-white',
    icon: '🍽️'
  },
  '/settings': {
    name: 'Settings',
    gradient: 'from-[#1E293B] via-[#334155] to-[#2563EB]', // Slate gray → royal blue
    navbarBg: 'from-[#1E293B]/90 to-[#2563EB]/90',
    cardBg: 'from-[#1E293B]/10 to-[#2563EB]/10',
    accentColor: '#2563EB',
    textColor: 'text-white',
    icon: '⚙️'
  },
  '/bills': {
    name: 'Bills',
    gradient: 'from-[#8B5CF6] via-[#7C3AED] to-[#6366F1]', // Purple → indigo
    navbarBg: 'from-[#8B5CF6]/90 to-[#6366F1]/90',
    cardBg: 'from-[#8B5CF6]/10 to-[#6366F1]/10',
    accentColor: '#8B5CF6',
    textColor: 'text-white',
    icon: '🧾'
  },
  '/menu': {
    name: 'Menu',
    gradient: 'from-[#EC4899] via-[#D946EF] to-[#A855F7]', // Pink → purple
    navbarBg: 'from-[#EC4899]/90 to-[#A855F7]/90',
    cardBg: 'from-[#EC4899]/10 to-[#A855F7]/10',
    accentColor: '#EC4899',
    textColor: 'text-white',
    icon: '📋'
  },
  '/reports': {
    name: 'Reports',
    gradient: 'from-[#14B8A6] via-[#06B6D4] to-[#3B82F6]', // Teal → sky blue
    navbarBg: 'from-[#14B8A6]/90 to-[#3B82F6]/90',
    cardBg: 'from-[#14B8A6]/10 to-[#3B82F6]/10',
    accentColor: '#14B8A6',
    textColor: 'text-white',
    icon: '📊'
  },
  '/owner': {
    name: 'Owner Portal',
    gradient: 'from-[#DC2626] via-[#EA580C] to-[#F59E0B]', // Red → orange → gold
    navbarBg: 'from-[#DC2626]/90 to-[#F59E0B]/90',
    cardBg: 'from-[#DC2626]/10 to-[#F59E0B]/10',
    accentColor: '#DC2626',
    textColor: 'text-white',
    icon: '👑'
  },
  '/profile': {
    name: 'Profile',
    gradient: 'from-[#0891B2] via-[#0284C7] to-[#2563EB]', // Cyan → blue
    navbarBg: 'from-[#0891B2]/90 to-[#2563EB]/90',
    cardBg: 'from-[#0891B2]/10 to-[#2563EB]/10',
    accentColor: '#0891B2',
    textColor: 'text-white',
    icon: '👤'
  }
};

// Default theme for unknown pages
const defaultTheme = {
  name: 'Restaurant POS',
  gradient: 'from-gray-900 via-gray-800 to-gray-900',
  navbarBg: 'from-gray-900/90 to-gray-800/90',
  cardBg: 'from-gray-800/10 to-gray-700/10',
  accentColor: '#3B82F6',
  textColor: 'text-white',
  icon: '🍽️'
};

export const ThemeProvider = ({ children }) => {
  const location = useLocation();
  const [currentTheme, setCurrentTheme] = useState(defaultTheme);

  useEffect(() => {
    // Find theme based on current path
    const theme = pageThemes[location.pathname] || defaultTheme;
    setCurrentTheme(theme);
  }, [location.pathname]);

  return (
    <ThemeContext.Provider value={{ currentTheme, pageThemes }}>
      {children}
    </ThemeContext.Provider>
  );
};

