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

// Theme modes with dark-focused elegant gradients
const themeModes = {
  dark: {
    '/dashboard': {
      name: 'Dashboard',
      gradient: 'from-[#0F172A] via-[#1E293B] to-[#334155]', // Dark slate (Spotify-style)
      navbarBg: 'from-[#0F172A]/95 to-[#1E293B]/95',
      cardBg: 'bg-white/5 backdrop-blur-xl',
      accentColor: '#3B82F6',
      textColor: 'text-white',
      icon: '🏠'
    },
    '/orders': {
      name: 'Orders',
      gradient: 'from-[#1E1B4B] via-[#312E81] to-[#3730A3]', // Midnight indigo
      navbarBg: 'from-[#1E1B4B]/95 to-[#312E81]/95',
      cardBg: 'bg-white/5 backdrop-blur-xl',
      accentColor: '#6366F1',
      textColor: 'text-white',
      icon: '📦'
    },
    '/kitchen': {
      name: 'Kitchen',
      gradient: 'from-[#3F1F1F] via-[#7F1D1D] to-[#991B1B]', // Deep crimson
      navbarBg: 'from-[#3F1F1F]/95 to-[#7F1D1D]/95',
      cardBg: 'bg-white/5 backdrop-blur-xl',
      accentColor: '#EF4444',
      textColor: 'text-white',
      icon: '🍳'
    },
    '/tables': {
      name: 'Tables',
      gradient: 'from-[#064E3B] via-[#065F46] to-[#047857]', // Dark emerald
      navbarBg: 'from-[#064E3B]/95 to-[#065F46]/95',
      cardBg: 'bg-white/5 backdrop-blur-xl',
      accentColor: '#10B981',
      textColor: 'text-white',
      icon: '🍽️'
    },
    '/settings': {
      name: 'Settings',
      gradient: 'from-[#111827] via-[#1F2937] to-[#374151]', // Neutral graphite
      navbarBg: 'from-[#111827]/95 to-[#1F2937]/95',
      cardBg: 'bg-white/5 backdrop-blur-xl',
      accentColor: '#6B7280',
      textColor: 'text-white',
      icon: '⚙️'
    },
    '/bills': {
      name: 'Bills',
      gradient: 'from-[#1E1B4B] via-[#4C1D95] to-[#5B21B6]', // Deep purple
      navbarBg: 'from-[#1E1B4B]/95 to-[#4C1D95]/95',
      cardBg: 'bg-white/5 backdrop-blur-xl',
      accentColor: '#8B5CF6',
      textColor: 'text-white',
      icon: '🧾'
    },
    '/menu': {
      name: 'Menu',
      gradient: 'from-[#4C0519] via-[#831843] to-[#9F1239]', // Dark rose
      navbarBg: 'from-[#4C0519]/95 to-[#831843]/95',
      cardBg: 'bg-white/5 backdrop-blur-xl',
      accentColor: '#F43F5E',
      textColor: 'text-white',
      icon: '📋'
    },
    '/reports': {
      name: 'Reports',
      gradient: 'from-[#164E63] via-[#0E7490] to-[#0891B2]', // Deep cyan
      navbarBg: 'from-[#164E63]/95 to-[#0E7490]/95',
      cardBg: 'bg-white/5 backdrop-blur-xl',
      accentColor: '#06B6D4',
      textColor: 'text-white',
      icon: '📊'
    },
    '/owner': {
      name: 'Owner Portal',
      gradient: 'from-[#7C2D12] via-[#9A3412] to-[#C2410C]', // Dark amber/bronze
      navbarBg: 'from-[#7C2D12]/95 to-[#9A3412]/95',
      cardBg: 'bg-white/5 backdrop-blur-xl',
      accentColor: '#EA580C',
      textColor: 'text-white',
      icon: '👑'
    },
    '/profile': {
      name: 'Profile',
      gradient: 'from-[#0C4A6E] via-[#075985] to-[#0369A1]', // Deep sky blue
      navbarBg: 'from-[#0C4A6E]/95 to-[#075985]/95',
      cardBg: 'bg-white/5 backdrop-blur-xl',
      accentColor: '#0EA5E9',
      textColor: 'text-white',
      icon: '👤'
    }
  },
  light: {
    '/dashboard': {
      name: 'Dashboard',
      gradient: 'from-blue-50 via-indigo-50 to-purple-50',
      navbarBg: 'from-white/95 to-blue-50/95',
      cardBg: 'bg-white/80 backdrop-blur-xl',
      accentColor: '#3B82F6',
      textColor: 'text-gray-900',
      icon: '🏠'
    },
    // Add light themes for other pages...
    '/orders': {
      name: 'Orders',
      gradient: 'from-amber-50 via-orange-50 to-yellow-50',
      navbarBg: 'from-white/95 to-amber-50/95',
      cardBg: 'bg-white/80 backdrop-blur-xl',
      accentColor: '#F59E0B',
      textColor: 'text-gray-900',
      icon: '📦'
    },
    '/kitchen': {
      name: 'Kitchen',
      gradient: 'from-red-50 via-rose-50 to-pink-50',
      navbarBg: 'from-white/95 to-red-50/95',
      cardBg: 'bg-white/80 backdrop-blur-xl',
      accentColor: '#EF4444',
      textColor: 'text-gray-900',
      icon: '🍳'
    },
    '/tables': {
      name: 'Tables',
      gradient: 'from-emerald-50 via-teal-50 to-cyan-50',
      navbarBg: 'from-white/95 to-emerald-50/95',
      cardBg: 'bg-white/80 backdrop-blur-xl',
      accentColor: '#10B981',
      textColor: 'text-gray-900',
      icon: '🍽️'
    },
    '/settings': {
      name: 'Settings',
      gradient: 'from-slate-50 via-gray-50 to-zinc-50',
      navbarBg: 'from-white/95 to-slate-50/95',
      cardBg: 'bg-white/80 backdrop-blur-xl',
      accentColor: '#64748B',
      textColor: 'text-gray-900',
      icon: '⚙️'
    },
    '/bills': {
      name: 'Bills',
      gradient: 'from-violet-50 via-purple-50 to-indigo-50',
      navbarBg: 'from-white/95 to-violet-50/95',
      cardBg: 'bg-white/80 backdrop-blur-xl',
      accentColor: '#8B5CF6',
      textColor: 'text-gray-900',
      icon: '🧾'
    },
    '/menu': {
      name: 'Menu',
      gradient: 'from-pink-50 via-rose-50 to-red-50',
      navbarBg: 'from-white/95 to-pink-50/95',
      cardBg: 'bg-white/80 backdrop-blur-xl',
      accentColor: '#EC4899',
      textColor: 'text-gray-900',
      icon: '📋'
    },
    '/reports': {
      name: 'Reports',
      gradient: 'from-cyan-50 via-sky-50 to-blue-50',
      navbarBg: 'from-white/95 to-cyan-50/95',
      cardBg: 'bg-white/80 backdrop-blur-xl',
      accentColor: '#06B6D4',
      textColor: 'text-gray-900',
      icon: '📊'
    },
    '/owner': {
      name: 'Owner Portal',
      gradient: 'from-orange-50 via-amber-50 to-yellow-50',
      navbarBg: 'from-white/95 to-orange-50/95',
      cardBg: 'bg-white/80 backdrop-blur-xl',
      accentColor: '#F97316',
      textColor: 'text-gray-900',
      icon: '👑'
    },
    '/profile': {
      name: 'Profile',
      gradient: 'from-sky-50 via-blue-50 to-indigo-50',
      navbarBg: 'from-white/95 to-sky-50/95',
      cardBg: 'bg-white/80 backdrop-blur-xl',
      accentColor: '#0EA5E9',
      textColor: 'text-gray-900',
      icon: '👤'
    }
  },
  gold: {
    '/dashboard': {
      name: 'Dashboard',
      gradient: 'from-[#78350F] via-[#92400E] to-[#A16207]', // Gold/Bronze
      navbarBg: 'from-[#78350F]/95 to-[#92400E]/95',
      cardBg: 'bg-amber-900/10 backdrop-blur-xl',
      accentColor: '#F59E0B',
      textColor: 'text-amber-50',
      icon: '🏠'
    }
    // ... other gold theme pages
  },
  teal: {
    '/dashboard': {
      name: 'Dashboard',
      gradient: 'from-[#134E4A] via-[#115E59] to-[#0F766E]', // Deep teal
      navbarBg: 'from-[#134E4A]/95 to-[#115E59]/95',
      cardBg: 'bg-teal-900/10 backdrop-blur-xl',
      accentColor: '#14B8A6',
      textColor: 'text-teal-50',
      icon: '🏠'
    }
    // ... other teal theme pages
  },
  cafe: {
    '/dashboard': {
      name: 'Dashboard',
      gradient: 'from-[#3E2723] via-[#4E342E] to-[#5D4037]', // Cafe brown
      navbarBg: 'from-[#3E2723]/95 to-[#4E342E]/95',
      cardBg: 'bg-amber-100/5 backdrop-blur-xl',
      accentColor: '#A1887F',
      textColor: 'text-amber-50',
      icon: '🏠'
    }
    // ... other cafe theme pages
  }
};

// Default theme for unknown pages (dark mode)
const defaultDarkTheme = {
  name: 'Restaurant POS',
  gradient: 'from-[#0F172A] via-[#1E293B] to-[#334155]',
  navbarBg: 'from-[#0F172A]/95 to-[#1E293B]/95',
  cardBg: 'bg-white/5 backdrop-blur-xl',
  accentColor: '#3B82F6',
  textColor: 'text-white',
  icon: '🍽️'
};

export const ThemeProvider = ({ children }) => {
  const location = useLocation();
  const [themeMode, setThemeMode] = useState('dark'); // dark, light, gold, teal, cafe
  const [currentTheme, setCurrentTheme] = useState(defaultDarkTheme);

  // Load theme from localStorage on mount
  useEffect(() => {
    const savedTheme = localStorage.getItem('themeMode');
    if (savedTheme && themeModes[savedTheme]) {
      setThemeMode(savedTheme);
    }
  }, []);

  // Update theme when path or mode changes
  useEffect(() => {
    const themes = themeModes[themeMode];
    const theme = themes?.[location.pathname] || defaultDarkTheme;
    setCurrentTheme(theme);
  }, [location.pathname, themeMode]);

  const changeTheme = (newMode) => {
    setThemeMode(newMode);
    localStorage.setItem('themeMode', newMode);
  };

  return (
    <ThemeContext.Provider value={{ currentTheme, themeMode, changeTheme, themeModes }}>
      {children}
    </ThemeContext.Provider>
  );
};

