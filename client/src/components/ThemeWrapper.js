import React from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { motion } from 'framer-motion';

/**
 * ThemeWrapper - Wraps page content with theme-aware styling
 * Ensures all text and components are visible on any theme
 */
const ThemeWrapper = ({ children, className = '' }) => {
  const { currentTheme } = useTheme();

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      className={`h-full ${currentTheme.textColor} ${className}`}
      style={{
        // Apply theme colors via CSS variables for maximum flexibility
        '--accent-color': currentTheme.accentColor,
        '--card-bg': currentTheme.cardBg
      }}
    >
      {children}
    </motion.div>
  );
};

export default ThemeWrapper;

