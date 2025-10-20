import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import axios from 'axios';
import './index.css';
import App from './App';
import { CurrencyProvider } from './contexts/CurrencyContext';
import { ThemeProvider } from './contexts/ThemeContext';
import * as serviceWorkerRegistration from './serviceWorkerRegistration';

// Configure axios base URL - Backend on Render
axios.defaults.baseURL = 'https://restaurant-pos-system-1-7h0m.onrender.com';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <BrowserRouter>
      <ThemeProvider>
        <CurrencyProvider>
          <App />
        </CurrencyProvider>
      </ThemeProvider>
    </BrowserRouter>
  </React.StrictMode>
);

// Register service worker for offline functionality
// Temporarily disabled to fix offline data deletion issue
// serviceWorkerRegistration.register({
//   onSuccess: () => {
//     console.log('✅ App is now available offline!');
//   },
//   onUpdate: (registration) => {
//     console.log('🔄 New version available! Please refresh.');
//     // Optional: Show notification to user about update
//   }
// });

// Unregister any existing service workers to prevent data issues
serviceWorkerRegistration.unregister();
