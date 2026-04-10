import React, { useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LogOut, User as UserIcon, Shield, Store, Menu, X, KeyRound } from 'lucide-react';
import api from '../utils/api';

const Layout = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordData, setPasswordData] = useState({ current: '', new: '' });
  const [pwdMessage, setPwdMessage] = useState('');
  const [pwdError, setPwdError] = useState('');

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getRoleIcon = () => {
    switch (user?.role) {
      case 'SYSTEM_ADMIN': return <Shield className="w-5 h-5" />;
      case 'STORE_OWNER': return <Store className="w-5 h-5" />;
      default: return <UserIcon className="w-5 h-5" />;
    }
  };

  const getRoleBadge = () => {
    switch (user?.role) {
      case 'SYSTEM_ADMIN': return <span className="bg-purple-100 text-purple-700 text-xs px-2 py-1 rounded-full font-semibold">Admin</span>;
      case 'STORE_OWNER': return <span className="bg-amber-100 text-amber-700 text-xs px-2 py-1 rounded-full font-semibold">Store</span>;
      default: return <span className="bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded-full font-semibold">User</span>;
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwdMessage('');
    setPwdError('');
    
    // validation
    const pw = passwordData.new;
    if (pw.length < 8 || pw.length > 16 || !/[A-Z]/.test(pw) || !/[!@#$%^&*(),.?":{}|<>]/.test(pw)) {
      setPwdError("New password must be 8-16 chars, 1 uppercase, 1 special character");
      return;
    }

    try {
      await api.post('/auth/change-password', {
        currentPassword: passwordData.current,
        newPassword: passwordData.new
      });
      setPwdMessage("Password updated successfully!");
      setPasswordData({ current: '', new: '' });
      setTimeout(() => setIsChangingPassword(false), 2000);
    } catch (err: any) {
      setPwdError(err.response?.data?.error || "Error changing password");
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      {/* Navigation Bar */}
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center gap-2">
              <div className="bg-blue-600 p-2 rounded-lg shadow-sm shadow-blue-500/20">
                <Shield className="w-5 h-5 text-white" />
              </div>
              <span className="font-bold text-xl text-slate-800 tracking-tight">TrustVibe</span>
            </div>
            
            {/* Desktop Menu */}
            <div className="hidden md:flex items-center space-x-6">
              <div className="flex items-center space-x-3 text-sm">
                <div className="flex flex-col items-end">
                  <span className="font-medium text-slate-800">{user?.name}</span>
                  {getRoleBadge()}
                </div>
                <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center border border-slate-200 text-slate-500">
                  {getRoleIcon()}
                </div>
              </div>
              
              <div className="h-8 w-px bg-slate-200"></div>
              
              <button
                onClick={() => setIsChangingPassword(true)}
                className="text-slate-600 hover:text-blue-600 transition-colors flex items-center gap-1.5 text-sm font-medium"
              >
                <KeyRound className="w-4 h-4" /> Change Password
              </button>
              
              <button
                onClick={handleLogout}
                className="text-slate-600 hover:text-red-600 transition-colors flex items-center gap-1.5 text-sm font-medium"
              >
                <LogOut className="w-4 h-4" /> Logout
              </button>
            </div>

            {/* Mobile menu button */}
            <div className="flex items-center md:hidden">
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="text-slate-500 hover:text-slate-700 focus:outline-none"
              >
                {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden bg-white border-t border-slate-200 py-2">
            <div className="px-4 py-3 border-b border-slate-100 flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center border border-slate-200 text-slate-500">
                {getRoleIcon()}
              </div>
              <div>
                <div className="font-medium text-slate-800">{user?.name}</div>
                <div>{getRoleBadge()}</div>
              </div>
            </div>
            <button
              onClick={() => { setIsChangingPassword(true); setIsMobileMenuOpen(false); }}
              className="block w-full text-left px-4 py-3 text-slate-600 hover:bg-slate-50 font-medium border-b border-slate-100 flex items-center gap-2"
            >
              <KeyRound className="w-4 h-4" /> Change Password
            </button>
            <button
              onClick={handleLogout}
              className="block w-full text-left px-4 py-3 text-red-600 hover:bg-red-50 font-medium flex items-center gap-2"
            >
              <LogOut className="w-4 h-4" /> Logout
            </button>
          </div>
        )}
      </nav>

      {/* Main Content */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Outlet />
      </main>

      {/* Change Password Modal */}
      {isChangingPassword && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="border-b border-slate-100 p-5 flex justify-between items-center">
              <h3 className="text-lg font-bold text-slate-800">Change Password</h3>
              <button 
                onClick={() => setIsChangingPassword(false)}
                className="text-slate-400 hover:text-slate-600 bg-slate-100 hover:bg-slate-200 p-1 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleChangePassword} className="p-6">
              {pwdMessage && <div className="bg-green-50 text-green-600 p-3 rounded-lg text-sm mb-4">{pwdMessage}</div>}
              {pwdError && <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm mb-4">{pwdError}</div>}
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Current Password</label>
                  <input
                    type="password"
                    value={passwordData.current}
                    onChange={(e) => setPasswordData({...passwordData, current: e.target.value})}
                    className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">New Password</label>
                  <input
                    type="password"
                    value={passwordData.new}
                    onChange={(e) => setPasswordData({...passwordData, new: e.target.value})}
                    className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                    required
                  />
                  <p className="text-xs text-slate-500 mt-1">8-16 chars, 1 uppercase, 1 special char</p>
                </div>
              </div>
              
              <div className="mt-6 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsChangingPassword(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors shadow-sm shadow-blue-500/20"
                >
                  Update Password
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Layout;
