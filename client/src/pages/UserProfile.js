import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { FaUser, FaEnvelope, FaPhone, FaLock, FaSave, FaIdBadge, FaClock, FaCamera, FaTrash } from 'react-icons/fa';
import { useAuth } from '../contexts/AuthContext';

const UserProfile = () => {
  const { user: authUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: ''
  });
  const [passwordData, setPasswordData] = useState({
    current_password: '',
    new_password: '',
    confirm_password: ''
  });
  const [showPasswordSection, setShowPasswordSection] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/profile', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setProfile(response.data);
      setFormData({
        first_name: response.data.first_name,
        last_name: response.data.last_name,
        email: response.data.email,
        phone: response.data.phone || ''
      });
      setLoading(false);
    } catch (error) {
      console.error('Error fetching profile:', error);
      toast.error('Failed to load profile');
      setLoading(false);
    }
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    
    try {
      const token = localStorage.getItem('token');
      await axios.put('/api/profile', formData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      toast.success('Profile updated successfully');
      fetchProfile();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to update profile');
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    
    if (passwordData.new_password !== passwordData.confirm_password) {
      toast.error('New passwords do not match');
      return;
    }

    if (passwordData.new_password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      await axios.put('/api/profile', {
        current_password: passwordData.current_password,
        new_password: passwordData.new_password
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      toast.success('Password changed successfully');
      setPasswordData({
        current_password: '',
        new_password: '',
        confirm_password: ''
      });
      setShowPasswordSection(false);
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to change password');
    }
  };

  const handleAvatarUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file');
      return;
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size should be less than 5MB');
      return;
    }

    setUploadingAvatar(true);

    try {
      const formData = new FormData();
      formData.append('avatar', file);

      const token = localStorage.getItem('token');
      const response = await axios.post('/api/profile/avatar', formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });

      toast.success('Avatar uploaded successfully');
      fetchProfile();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to upload avatar');
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleDeleteAvatar = async () => {
    if (!window.confirm('Are you sure you want to remove your avatar?')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      await axios.delete('/api/profile/avatar', {
        headers: { Authorization: `Bearer ${token}` }
      });

      toast.success('Avatar removed successfully');
      fetchProfile();
    } catch (error) {
      toast.error('Failed to delete avatar');
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getRoleBadgeColor = (role) => {
    const colors = {
      admin: 'bg-purple-100 text-purple-800',
      manager: 'bg-blue-100 text-blue-800',
      cashier: 'bg-green-100 text-green-800',
      chef: 'bg-orange-100 text-orange-800'
    };
    return colors[role] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-gray-500">Failed to load profile</p>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">My Profile</h1>
        <p className="text-gray-600 mt-1">Manage your personal information and security settings</p>
      </div>

      {/* Profile Header Card */}
      <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg shadow-lg p-6 mb-6 text-white">
        <div className="flex items-center">
          {/* Avatar with Upload */}
          <div className="relative">
            {profile.avatar_url ? (
              <img
                src={`http://localhost:5002${profile.avatar_url}`}
                alt="Avatar"
                className="h-20 w-20 rounded-full object-cover border-4 border-white shadow-lg"
              />
            ) : (
              <div className="h-20 w-20 rounded-full bg-white flex items-center justify-center text-blue-600 text-3xl font-bold shadow-lg">
                {profile.first_name.charAt(0)}{profile.last_name.charAt(0)}
              </div>
            )}
            
            {/* Upload Button */}
            <button
              onClick={() => fileInputRef.current.click()}
              className="absolute bottom-0 right-0 bg-blue-700 hover:bg-blue-800 text-white p-2 rounded-full shadow-lg transition-colors"
              title="Upload Avatar"
              disabled={uploadingAvatar}
            >
              {uploadingAvatar ? (
                <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
              ) : (
                <FaCamera size={14} />
              )}
            </button>
            
            {/* Delete Avatar Button */}
            {profile.avatar_url && (
              <button
                onClick={handleDeleteAvatar}
                className="absolute top-0 right-0 bg-red-500 hover:bg-red-600 text-white p-2 rounded-full shadow-lg transition-colors"
                title="Remove Avatar"
              >
                <FaTrash size={12} />
              </button>
            )}
            
            {/* Hidden File Input */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleAvatarUpload}
              className="hidden"
            />
          </div>
          
          <div className="ml-6">
            <h2 className="text-2xl font-bold">{profile.first_name} {profile.last_name}</h2>
            <p className="text-blue-100">@{profile.username}</p>
            <span className={`inline-block mt-2 px-3 py-1 rounded-full text-sm font-medium ${getRoleBadgeColor(profile.role)}`}>
              {profile.role.charAt(0).toUpperCase() + profile.role.slice(1)}
            </span>
          </div>
        </div>
        
        <p className="text-sm text-blue-100 mt-4">
          Click the camera icon to upload your profile picture (max 5MB)
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Information */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-xl font-bold mb-4 flex items-center">
              <FaUser className="mr-2 text-blue-600" />
              Personal Information
            </h3>
            
            <form onSubmit={handleUpdateProfile}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    First Name
                  </label>
                  <input
                    type="text"
                    value={formData.first_name}
                    onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Last Name
                  </label>
                  <input
                    type="text"
                    value={formData.last_name}
                    onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="+1 (555) 123-4567"
                  />
                </div>
              </div>

              <div className="mt-6 flex justify-end">
                <button
                  type="submit"
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center"
                >
                  <FaSave className="mr-2" />
                  Save Changes
                </button>
              </div>
            </form>
          </div>

          {/* Password Change Section */}
          <div className="bg-white rounded-lg shadow-md p-6 mt-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold flex items-center">
                <FaLock className="mr-2 text-blue-600" />
                Security
              </h3>
              
              {!showPasswordSection && (
                <button
                  onClick={() => setShowPasswordSection(true)}
                  className="px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                >
                  Change Password
                </button>
              )}
            </div>

            {showPasswordSection && (
              <form onSubmit={handleChangePassword}>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Current Password
                    </label>
                    <input
                      type="password"
                      value={passwordData.current_password}
                      onChange={(e) => setPasswordData({ ...passwordData, current_password: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      New Password
                    </label>
                    <input
                      type="password"
                      value={passwordData.new_password}
                      onChange={(e) => setPasswordData({ ...passwordData, new_password: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                      required
                      minLength="6"
                    />
                    <p className="text-xs text-gray-500 mt-1">Minimum 6 characters</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Confirm New Password
                    </label>
                    <input
                      type="password"
                      value={passwordData.confirm_password}
                      onChange={(e) => setPasswordData({ ...passwordData, confirm_password: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                </div>

                <div className="mt-6 flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => {
                      setShowPasswordSection(false);
                      setPasswordData({
                        current_password: '',
                        new_password: '',
                        confirm_password: ''
                      });
                    }}
                    className="px-4 py-2 border rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Update Password
                  </button>
                </div>
              </form>
            )}

            {!showPasswordSection && (
              <p className="text-sm text-gray-600">
                Keep your account secure by using a strong password
              </p>
            )}
          </div>
        </div>

        {/* Account Details Sidebar */}
        <div className="space-y-6">
          {/* Account Info */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-bold mb-4 flex items-center">
              <FaIdBadge className="mr-2 text-blue-600" />
              Account Details
            </h3>
            
            <div className="space-y-3">
              <div>
                <p className="text-xs text-gray-500">Username</p>
                <p className="text-sm font-medium text-gray-900">@{profile.username}</p>
              </div>

              <div>
                <p className="text-xs text-gray-500">Role</p>
                <p className="text-sm font-medium text-gray-900 capitalize">{profile.role}</p>
              </div>

              <div>
                <p className="text-xs text-gray-500">Account Status</p>
                <span className={`text-sm font-medium ${profile.is_active ? 'text-green-600' : 'text-red-600'}`}>
                  {profile.is_active ? 'Active' : 'Inactive'}
                </span>
              </div>

              <div>
                <p className="text-xs text-gray-500">User ID</p>
                <p className="text-sm font-medium text-gray-900">#{profile.id}</p>
              </div>
            </div>
          </div>

          {/* Activity Timeline */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-bold mb-4 flex items-center">
              <FaClock className="mr-2 text-blue-600" />
              Activity
            </h3>
            
            <div className="space-y-3">
              <div>
                <p className="text-xs text-gray-500">Account Created</p>
                <p className="text-sm text-gray-900">{formatDate(profile.created_at)}</p>
              </div>

              <div>
                <p className="text-xs text-gray-500">Last Updated</p>
                <p className="text-sm text-gray-900">{formatDate(profile.updated_at)}</p>
              </div>
            </div>
          </div>

          {/* Contact Info */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-bold mb-4">Contact Information</h3>
            
            <div className="space-y-3">
              <div className="flex items-center">
                <FaEnvelope className="text-gray-400 mr-3" />
                <div>
                  <p className="text-xs text-gray-500">Email</p>
                  <p className="text-sm text-gray-900">{profile.email}</p>
                </div>
              </div>

              {profile.phone && (
                <div className="flex items-center">
                  <FaPhone className="text-gray-400 mr-3" />
                  <div>
                    <p className="text-xs text-gray-500">Phone</p>
                    <p className="text-sm text-gray-900">{profile.phone}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserProfile;

