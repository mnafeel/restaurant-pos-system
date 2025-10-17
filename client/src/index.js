import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import axios from 'axios';
import './index.css';
import App from './App';
import { CurrencyProvider } from './contexts/CurrencyContext';

// Configure axios base URL
// On Vercel, both frontend and backend are on same domain, so use relative URL
// For local development, use localhost
axios.defaults.baseURL = process.env.REACT_APP_API_URL || (process.env.NODE_ENV === 'production' ? '' : 'http://localhost:5002');

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <BrowserRouter>
      <CurrencyProvider>
        <App />
      </CurrencyProvider>
    </BrowserRouter>
  </React.StrictMode>
);
