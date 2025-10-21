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
      {/* Offline Warning Banner */}
      <AnimatePresence>
        {showOfflineWarning && !isDismissed && (
          <motion.div
            initial={{ y: -100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -100, opacity: 0 }}
            className="fixed top-0 left-0 right-0 z-40 bg-gradient-to-r from-red-500 to-orange-500 text-white px-4 py-2 shadow-lg"
            style={{ marginTop: '0px' }}
          >
            <div className="max-w-7xl mx-auto flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FiWifiOff className="text-lg animate-pulse" />
                <div>
                  <p className="font-bold text-xs">You are offline</p>
                  <p className="text-xs opacity-90">
                    Orders will be saved locally and synced when online
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsDismissed(true)}
                className="text-white hover:bg-white hover:bg-opacity-20 rounded-full p-1 transition-colors"
                aria-label="Dismiss offline warning"
              >
                <FiX className="text-sm" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Back Online Notification */}
      <AnimatePresence>
        {justCameOnline && (
          <motion.div
            initial={{ y: -100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -100, opacity: 0 }}
            className="fixed top-0 left-0 right-0 z-40 bg-gradient-to-r from-green-500 to-emerald-500 text-white px-4 py-2 shadow-lg"
          >
            <div className="max-w-7xl mx-auto flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FiWifi className="text-lg" />
                <div>
                  <p className="font-bold text-xs">You're back online!</p>
                  <p className="text-xs opacity-90">
                    Syncing offline changes...
                  </p>
                </div>
              </div>
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                className="text-sm"
              >
                ⟳
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Subtle Status Indicator (always visible in corner) */}
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        className="fixed bottom-4 right-4 z-40"
      >
        <div className={`flex items-center gap-2 px-3 py-2 rounded-full shadow-lg ${
          isOnline 
            ? 'bg-green-100 text-green-700 border border-green-300' 
            : 'bg-red-100 text-red-700 border border-red-300'
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

