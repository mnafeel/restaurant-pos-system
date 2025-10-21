import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiWifiOff, FiWifi, FiAlertCircle, FiX } from 'react-icons/fi';

const OfflineIndicator = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showOfflineWarning, setShowOfflineWarning] = useState(false);
  const [justCameOnline, setJustCameOnline] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setShowOfflineWarning(false);
      setJustCameOnline(true);
      setIsDismissed(false); // Reset dismissal when back online
      
      // Hide "back online" message after 5 seconds
      setTimeout(() => {
        setJustCameOnline(false);
      }, 5000);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShowOfflineWarning(true);
      setJustCameOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Check initial status
    if (!navigator.onLine) {
      setShowOfflineWarning(true);
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return (
    <>
      {/* Offline Warning - Right Side */}
      <AnimatePresence>
        {showOfflineWarning && !isDismissed && (
          <motion.div
            initial={{ x: 300, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 300, opacity: 0 }}
            className="fixed top-20 right-4 z-40 bg-gradient-to-br from-orange-500 to-red-500 text-white rounded-xl shadow-2xl max-w-xs"
          >
            <div className="p-4">
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <FiWifiOff className="text-xl animate-pulse" />
                  <p className="font-bold text-sm">Offline Mode</p>
                </div>
                <button
                  onClick={() => setIsDismissed(true)}
                  className="text-white hover:bg-white hover:bg-opacity-20 rounded-full p-1 transition-colors"
                  aria-label="Dismiss offline warning"
                >
                  <FiX className="text-sm" />
                </button>
              </div>
              <p className="text-xs opacity-90 leading-relaxed">
                You're working offline. Orders will be saved locally and synced automatically when you're back online.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Back Online Notification - Right Side */}
      <AnimatePresence>
        {justCameOnline && (
          <motion.div
            initial={{ x: 300, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 300, opacity: 0 }}
            className="fixed top-20 right-4 z-40 bg-gradient-to-br from-green-500 to-emerald-500 text-white rounded-xl shadow-2xl max-w-xs"
          >
            <div className="p-4">
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <FiWifi className="text-xl" />
                  <p className="font-bold text-sm">Back Online!</p>
                </div>
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  className="text-lg"
                >
                  ⟳
                </motion.div>
              </div>
              <p className="text-xs opacity-90 leading-relaxed">
                Connection restored. Syncing your offline orders now...
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Small Status Indicator (always visible in corner) */}
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        className="fixed bottom-4 right-4 z-30"
      >
        <div className={`flex items-center gap-2 px-3 py-2 rounded-full shadow-lg transition-all ${
          isOnline 
            ? 'bg-green-100 text-green-700 border border-green-300' 
            : 'bg-orange-100 text-orange-700 border border-orange-300'
        }`}>
          {isOnline ? (
            <>
              <FiWifi className="text-sm" />
              <span className="text-xs font-medium">Online</span>
            </>
          ) : (
            <>
              <FiWifiOff className="text-sm animate-pulse" />
              <span className="text-xs font-medium">Offline</span>
            </>
          )}
        </div>
      </motion.div>
    </>
  );
};

export default OfflineIndicator;

