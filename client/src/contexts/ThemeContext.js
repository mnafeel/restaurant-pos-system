import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../shared/api/axios';
import { useLocation } from 'react-router-dom';

const ThemeContext = createContext();

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
};

// Utility function to determine if background is dark (for auto-contrast text)
const isBackgroundDark = (gradient) => {
  // Check if gradient contains dark color codes
  return gradient.includes('#0') || gradient.includes('#1') || gradient.includes('#2') || 
         gradient.includes('#3') || gradient.includes('gray-900') || gradient.includes('gray-800') ||
         gradient.includes('slate-900') || gradient.includes('black');
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
  },
  neon: {
    '/dashboard': {
      name: 'Dashboard',
      gradient: 'from-[#022C22] via-[#064E3B] to-[#065F46]', // Deep forest → glowing emerald
      navbarBg: 'from-[#022C22]/95 to-[#064E3B]/95',
      cardBg: 'bg-emerald-500/5 backdrop-blur-xl border border-emerald-500/20',
      accentColor: '#10B981',
      textColor: 'text-emerald-50',
      glowColor: 'shadow-emerald-500/50',
      neonGlow: true,
      icon: '🏠'
    },
    '/orders': {
      name: 'Orders',
      gradient: 'from-[#022C22] via-[#064E3B] to-[#065F46]',
      navbarBg: 'from-[#022C22]/95 to-[#064E3B]/95',
      cardBg: 'bg-emerald-500/5 backdrop-blur-xl border border-emerald-500/20',
      accentColor: '#10B981',
      textColor: 'text-emerald-50',
      glowColor: 'shadow-emerald-500/50',
      neonGlow: true,
      icon: '📦'
    },
    '/kitchen': {
      name: 'Kitchen',
      gradient: 'from-[#022C22] via-[#064E3B] to-[#065F46]',
      navbarBg: 'from-[#022C22]/95 to-[#064E3B]/95',
      cardBg: 'bg-emerald-500/5 backdrop-blur-xl border border-emerald-500/20',
      accentColor: '#10B981',
      textColor: 'text-emerald-50',
      glowColor: 'shadow-emerald-500/50',
      neonGlow: true,
      icon: '🍳'
    },
    '/tables': {
      name: 'Tables',
      gradient: 'from-[#022C22] via-[#064E3B] to-[#065F46]',
      navbarBg: 'from-[#022C22]/95 to-[#064E3B]/95',
      cardBg: 'bg-emerald-500/5 backdrop-blur-xl border border-emerald-500/20',
      accentColor: '#10B981',
      textColor: 'text-emerald-50',
      glowColor: 'shadow-emerald-500/50',
      neonGlow: true,
      icon: '🍽️'
    },
    '/settings': {
      name: 'Settings',
      gradient: 'from-[#022C22] via-[#064E3B] to-[#065F46]',
      navbarBg: 'from-[#022C22]/95 to-[#064E3B]/95',
      cardBg: 'bg-emerald-500/5 backdrop-blur-xl border border-emerald-500/20',
      accentColor: '#10B981',
      textColor: 'text-emerald-50',
      glowColor: 'shadow-emerald-500/50',
      neonGlow: true,
      icon: '⚙️'
    },
    '/bills': {
      name: 'Bills',
      gradient: 'from-[#022C22] via-[#064E3B] to-[#065F46]',
      navbarBg: 'from-[#022C22]/95 to-[#064E3B]/95',
      cardBg: 'bg-emerald-500/5 backdrop-blur-xl border border-emerald-500/20',
      accentColor: '#10B981',
      textColor: 'text-emerald-50',
      glowColor: 'shadow-emerald-500/50',
      neonGlow: true,
      icon: '🧾'
    },
    '/menu': {
      name: 'Menu',
      gradient: 'from-[#022C22] via-[#064E3B] to-[#065F46]',
      navbarBg: 'from-[#022C22]/95 to-[#064E3B]/95',
      cardBg: 'bg-emerald-500/5 backdrop-blur-xl border border-emerald-500/20',
      accentColor: '#10B981',
      textColor: 'text-emerald-50',
      glowColor: 'shadow-emerald-500/50',
      neonGlow: true,
      icon: '📋'
    },
    '/reports': {
      name: 'Reports',
      gradient: 'from-[#022C22] via-[#064E3B] to-[#065F46]',
      navbarBg: 'from-[#022C22]/95 to-[#064E3B]/95',
      cardBg: 'bg-emerald-500/5 backdrop-blur-xl border border-emerald-500/20',
      accentColor: '#10B981',
      textColor: 'text-emerald-50',
      glowColor: 'shadow-emerald-500/50',
      neonGlow: true,
      icon: '📊'
    },
    '/owner': {
      name: 'Owner Portal',
      gradient: 'from-[#022C22] via-[#064E3B] to-[#065F46]',
      navbarBg: 'from-[#022C22]/95 to-[#064E3B]/95',
      cardBg: 'bg-emerald-500/5 backdrop-blur-xl border border-emerald-500/20',
      accentColor: '#10B981',
      textColor: 'text-emerald-50',
      glowColor: 'shadow-emerald-500/50',
      neonGlow: true,
      icon: '👑'
    },
    '/profile': {
      name: 'Profile',
      gradient: 'from-[#022C22] via-[#064E3B] to-[#065F46]',
      navbarBg: 'from-[#022C22]/95 to-[#064E3B]/95',
      cardBg: 'bg-emerald-500/5 backdrop-blur-xl border border-emerald-500/20',
      accentColor: '#10B981',
      textColor: 'text-emerald-50',
      glowColor: 'shadow-emerald-500/50',
      neonGlow: true,
      icon: '👤'
    }
  },
  restaurant: {
    '/dashboard': {
      name: 'Dashboard',
      gradient: 'from-black/80 via-black/60 to-black/80', // Photo overlay
      navbarBg: 'from-black/90 to-black/80',
      cardBg: 'bg-white/10 backdrop-blur-2xl border border-white/20',
      accentColor: '#F97316',
      textColor: 'text-white',
      backgroundImage: 'url(https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1920)',
      hasPhoto: true,
      icon: '🏠'
    }
    // Photo backgrounds for other pages can be added similarly
  },
  cozy: {
    '/dashboard': {
      name: 'Dashboard',
      gradient: 'from-black/70 via-black/50 to-black/70',
      navbarBg: 'from-black/85 to-black/75',
      cardBg: 'bg-amber-900/20 backdrop-blur-2xl border border-amber-500/30',
      accentColor: '#D97706',
      textColor: 'text-amber-50',
      backgroundImage: 'url(https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=1920)',
      hasPhoto: true,
      icon: '🏠'
    }
  },
  glass: {
    '/dashboard': {
      name: 'Dashboard',
      gradient: 'from-[#E0F2FE] via-[#BAE6FD] to-[#7DD3FC]', // Sky blue glass
      navbarBg: 'from-white/30 to-white/20',
      cardBg: 'bg-white/20 backdrop-blur-3xl border border-white/40 shadow-2xl',
      accentColor: '#0EA5E9',
      textColor: 'text-gray-900',
      glassEffect: true,
      icon: '🏠'
    },
    '/orders': {
      name: 'Orders',
      gradient: 'from-[#FEF3C7] via-[#FDE68A] to-[#FCD34D]', // Amber glass
      navbarBg: 'from-white/30 to-white/20',
      cardBg: 'bg-white/20 backdrop-blur-3xl border border-white/40 shadow-2xl',
      accentColor: '#F59E0B',
      textColor: 'text-gray-900',
      glassEffect: true,
      icon: '📦'
    },
    '/kitchen': {
      name: 'Kitchen',
      gradient: 'from-[#FECACA] via-[#FCA5A5] to-[#F87171]', // Red glass
      navbarBg: 'from-white/30 to-white/20',
      cardBg: 'bg-white/20 backdrop-blur-3xl border border-white/40 shadow-2xl',
      accentColor: '#EF4444',
      textColor: 'text-gray-900',
      glassEffect: true,
      icon: '🍳'
    },
    '/tables': {
      name: 'Tables',
      gradient: 'from-[#D1FAE5] via-[#A7F3D0] to-[#6EE7B7]', // Emerald glass
      navbarBg: 'from-white/30 to-white/20',
      cardBg: 'bg-white/20 backdrop-blur-3xl border border-white/40 shadow-2xl',
      accentColor: '#10B981',
      textColor: 'text-gray-900',
      glassEffect: true,
      icon: '🍽️'
    },
    '/settings': {
      name: 'Settings',
      gradient: 'from-[#E2E8F0] via-[#CBD5E1] to-[#94A3B8]', // Slate glass
      navbarBg: 'from-white/30 to-white/20',
      cardBg: 'bg-white/20 backdrop-blur-3xl border border-white/40 shadow-2xl',
      accentColor: '#64748B',
      textColor: 'text-gray-900',
      glassEffect: true,
      icon: '⚙️'
    },
    '/bills': {
      name: 'Bills',
      gradient: 'from-[#E9D5FF] via-[#D8B4FE] to-[#C084FC]', // Purple glass
      navbarBg: 'from-white/30 to-white/20',
      cardBg: 'bg-white/20 backdrop-blur-3xl border border-white/40 shadow-2xl',
      accentColor: '#A855F7',
      textColor: 'text-gray-900',
      glassEffect: true,
      icon: '🧾'
    },
    '/menu': {
      name: 'Menu',
      gradient: 'from-[#FCE7F3] via-[#FBCFE8] to-[#F9A8D4]', // Pink glass
      navbarBg: 'from-white/30 to-white/20',
      cardBg: 'bg-white/20 backdrop-blur-3xl border border-white/40 shadow-2xl',
      accentColor: '#EC4899',
      textColor: 'text-gray-900',
      glassEffect: true,
      icon: '📋'
    },
    '/reports': {
      name: 'Reports',
      gradient: 'from-[#CFFAFE] via-[#A5F3FC] to-[#67E8F9]', // Cyan glass
      navbarBg: 'from-white/30 to-white/20',
      cardBg: 'bg-white/20 backdrop-blur-3xl border border-white/40 shadow-2xl',
      accentColor: '#06B6D4',
      textColor: 'text-gray-900',
      glassEffect: true,
      icon: '📊'
    },
    '/owner': {
      name: 'Owner Portal',
      gradient: 'from-[#FED7AA] via-[#FDBA74] to-[#FB923C]', // Orange glass
      navbarBg: 'from-white/30 to-white/20',
      cardBg: 'bg-white/20 backdrop-blur-3xl border border-white/40 shadow-2xl',
      accentColor: '#F97316',
      textColor: 'text-gray-900',
      glassEffect: true,
      icon: '👑'
    },
    '/profile': {
      name: 'Profile',
      gradient: 'from-[#DBEAFE] via-[#BFDBFE] to-[#93C5FD]', // Blue glass
      navbarBg: 'from-white/30 to-white/20',
      cardBg: 'bg-white/20 backdrop-blur-3xl border border-white/40 shadow-2xl',
      accentColor: '#3B82F6',
      textColor: 'text-gray-900',
      glassEffect: true,
      icon: '👤'
    }
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

  // Load theme from API (fallback to localStorage)
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const { data } = await api.get('/api/users/me/settings');
        const mode = data?.theme_mode;
        if (mounted && mode && themeModes[mode]) setThemeMode(mode);
      } catch (e) {
        const savedTheme = localStorage.getItem('themeMode');
        if (savedTheme && themeModes[savedTheme]) {
          setThemeMode(savedTheme);
        }
      }
    })();
    return () => { mounted = false; };
  }, []);

  // Update theme when path or mode changes
  useEffect(() => {
    const themes = themeModes[themeMode];
    const theme = themes?.[location.pathname] || defaultDarkTheme;
    setCurrentTheme(theme);
  }, [location.pathname, themeMode]);

  const changeTheme = async (newMode) => {
    setThemeMode(newMode);
    localStorage.setItem('themeMode', newMode);
    try {
      await api.put('/api/users/me/settings', { theme_mode: newMode });
    } catch (e) {
      // Non-blocking
    }
  };

  return (
    <ThemeContext.Provider value={{ currentTheme, themeMode, changeTheme, themeModes }}>
      {children}
    </ThemeContext.Provider>
  );
};

