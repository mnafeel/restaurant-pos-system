import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';

const Login = () => {
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [companyName, setCompanyName] = useState('Enterprise POS Solution');
  const [version, setVersion] = useState({ version: '1.0.0', name: 'Restaurant POS Pro' });
  const { login } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // Fetch owner's company name for branding (public endpoint, no auth)
    const fetchCompanyName = async () => {
      try {
        const response = await axios.get('/api/public/branding');
        if (response.data.company_name) {
          setCompanyName(response.data.company_name);
        }
      } catch (error) {
        // Silently fail - use default
        console.log('Could not fetch company name');
      }
    };
    
    // Fetch version info
    const fetchVersion = async () => {
      try {
        const response = await axios.get('/api/version');
        setVersion(response.data);
      } catch (error) {
        console.log('Could not fetch version');
      }
    };
    
    fetchCompanyName();
    fetchVersion();
  }, []);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const result = await login(formData.username, formData.password);
      
      if (result.success) {
        toast.success('Login successful!');
        // Small delay to ensure state is updated
        setTimeout(() => {
          navigate('/dashboard');
        }, 100);
      } else {
        toast.error(result.error);
        setLoading(false);
      }
    } catch (error) {
      toast.error('Login failed. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Restaurant Billing System
          </h1>
          <h2 className="text-xl text-gray-600 mb-8">
            {companyName}
          </h2>
        </div>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-700">
                Username
              </label>
              <div className="mt-1">
                <input
                  id="username"
                  name="username"
                  type="text"
                  required
                  value={formData.username}
                  onChange={handleChange}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="Enter your username"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <div className="mt-1">
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="Enter your password"
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {loading ? 'Signing in...' : 'Sign in'}
              </button>
            </div>
          </form>

          {/* Version Info */}
          <div className="mt-6 text-center">
            <p className="text-xs text-gray-500">
              {version.name} v{version.version}
            </p>
            <p className="text-xs text-gray-400 mt-1">
              Build {version.build}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
