import React, { useEffect, useState } from 'react';
import api from '../../utils/api';
import { Users, Store, Star, UserPlus, Search, ChevronUp, ChevronDown, Edit, Trash2, X } from 'lucide-react';

interface DashboardStats {
  totalUsers: number;
  totalStores: number;
  totalRatings: number;
}

interface User {
  id: string;
  name: string;
  email: string;
  address: string;
  role: string;
  rating?: string | number;
}

const AdminDashboard = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [activeTab, setActiveTab] = useState<'users'|'stores'|'add_user'>('users');
  const [loading, setLoading] = useState(true);
  
  // Sort state
  const [sortField, setSortField] = useState<keyof User>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  
  // Search state
  const [searchTerm, setSearchTerm] = useState('');

  // Add User Form State
  const [form, setForm] = useState({ name: '', email: '', password: '', address: '', role: 'NORMAL_USER' });
  const [formMsg, setFormMsg] = useState({ type: '', text: '' });

  // Edit / Delete State
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editForm, setEditForm] = useState({ name: '', email: '', password: '', address: '', role: 'NORMAL_USER' });
  const [editMsg, setEditMsg] = useState({ type: '', text: '' });
  const [deletingUser, setDeletingUser] = useState<User | null>(null);

  useEffect(() => {
    fetchStats();
    fetchUsers();
  }, []);

  const fetchStats = async () => {
    try {
      const { data } = await api.get('/admin/dashboard');
      setStats(data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/admin/users');
      setUsers(data);
      setLoading(false);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormMsg({ type: '', text: '' });

    if (form.name.length < 20 || form.name.length > 60) {
      setFormMsg({ type: 'error', text: 'Name must be 20-60 characters' });
      return;
    }
    
    const pw = form.password;
    if (pw.length < 8 || pw.length > 16 || !/[A-Z]/.test(pw) || !/[!@#$%^&*(),.?":{}|<>]/.test(pw)) {
      setFormMsg({ type: 'error', text: 'Password must be 8-16 chars, 1 uppercase, 1 special char' });
      return;
    }

    try {
      await api.post('/admin/users', form);
      setFormMsg({ type: 'success', text: 'User added successfully!' });
      setForm({ name: '', email: '', password: '', address: '', role: 'NORMAL_USER' });
      fetchStats();
      fetchUsers();
    } catch (err: any) {
      setFormMsg({ type: 'error', text: err.response?.data?.error || 'Failed to add user' });
    }
  };

  const openEditModal = (user: User) => {
    setEditingUser(user);
    setEditForm({
      name: user.name,
      email: user.email,
      address: user.address,
      role: user.role,
      password: '' // empty so we don't display a hash and only update if changed
    });
    setEditMsg({ type: '', text: '' });
  };

  const handleEditUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    setEditMsg({ type: '', text: '' });

    if (editForm.name.length < 20 || editForm.name.length > 60) {
      setEditMsg({ type: 'error', text: 'Name must be 20-60 characters' });
      return;
    }
    
    if (editForm.password.trim() !== '') {
      const pw = editForm.password;
      if (pw.length < 8 || pw.length > 16 || !/[A-Z]/.test(pw) || !/[!@#$%^&*(),.?":{}|<>]/.test(pw)) {
        setEditMsg({ type: 'error', text: 'Password must be 8-16 chars, 1 uppercase, 1 special char' });
        return;
      }
    }

    try {
      await api.put(`/admin/users/${editingUser.id}`, editForm);
      setEditMsg({ type: 'success', text: 'User updated successfully!' });
      setTimeout(() => {
        setEditingUser(null);
        fetchUsers();
      }, 1000);
    } catch (err: any) {
      setEditMsg({ type: 'error', text: err.response?.data?.error || 'Failed to update user' });
    }
  };

  const triggerDelete = (user: User) => {
    setDeletingUser(user);
  };

  const confirmDeleteUser = async () => {
    if (!deletingUser) return;
    try {
      await api.delete(`/admin/users/${deletingUser.id}`);
      setDeletingUser(null);
      fetchStats();
      fetchUsers();
    } catch (err) {
      console.error('Failed to delete user', err);
      alert('Failed to delete user.');
    }
  };

  const handleSort = (field: keyof User) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  let filteredUsers = users;
  
  if (activeTab === 'users') {
    filteredUsers = users.filter(u => u.role !== 'STORE_OWNER');
  } else if (activeTab === 'stores') {
    filteredUsers = users.filter(u => u.role === 'STORE_OWNER');
  }

  if (searchTerm) {
    const term = searchTerm.toLowerCase();
    filteredUsers = filteredUsers.filter(u => 
      u.name.toLowerCase().includes(term) ||
      u.email.toLowerCase().includes(term) ||
      u.address.toLowerCase().includes(term) ||
      u.role.toLowerCase().includes(term)
    );
  }

  filteredUsers.sort((a, b) => {
    const valA = a[sortField] || '';
    const valB = b[sortField] || '';
    if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
    if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
    return 0;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 tracking-tight">System Dashboard</h1>
          <p className="text-slate-500 mt-1">Manage users, stores, and monitor activity</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="bg-blue-100 p-4 rounded-xl text-blue-600">
            <Users className="w-8 h-8" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">Total Users</p>
            <p className="text-3xl font-bold text-slate-800">{stats?.totalUsers || 0}</p>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="bg-emerald-100 p-4 rounded-xl text-emerald-600">
            <Store className="w-8 h-8" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">Registered Stores</p>
            <p className="text-3xl font-bold text-slate-800">{stats?.totalStores || 0}</p>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="bg-amber-100 p-4 rounded-xl text-amber-600">
            <Star className="w-8 h-8" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">Total Ratings</p>
            <p className="text-3xl font-bold text-slate-800">{stats?.totalRatings || 0}</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden mt-8">
        <div className="border-b border-slate-200 px-6 py-2 flex gap-6 overflow-x-auto">
          <button
            onClick={() => setActiveTab('users')}
            className={`py-3 px-1 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${activeTab === 'users' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
          >
            Normal & Admin Users
          </button>
          <button
            onClick={() => setActiveTab('stores')}
            className={`py-3 px-1 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${activeTab === 'stores' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
          >
            Store Listings
          </button>
          <button
            onClick={() => setActiveTab('add_user')}
            className={`py-3 px-1 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${activeTab === 'add_user' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
          >
            <span className="flex items-center gap-2"><UserPlus className="w-4 h-4" /> Add User/Store</span>
          </button>
        </div>

        <div className="p-6">
          {activeTab === 'add_user' ? (
            <div className="max-w-xl">
              <h3 className="text-lg font-bold text-slate-800 mb-4">Add New User</h3>
              {formMsg.text && (
                <div className={`p-4 rounded-xl mb-6 text-sm ${formMsg.type === 'error' ? 'bg-red-50 text-red-600 border border-red-100' : 'bg-green-50 text-green-600 border border-green-100'}`}>
                  {formMsg.text}
                </div>
              )}
              
              <form onSubmit={handleAddUser} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-slate-700 mb-1">Name (Min 20, Max 60)</label>
                    <input
                      type="text"
                      value={form.name}
                      onChange={(e) => setForm({...form, name: e.target.value})}
                      className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                      required
                    />
                  </div>
                  <div className="col-span-2 sm:col-span-1">
                    <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                    <input
                      type="email"
                      value={form.email}
                      onChange={(e) => setForm({...form, email: e.target.value})}
                      className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                      required
                    />
                  </div>
                  <div className="col-span-2 sm:col-span-1">
                    <label className="block text-sm font-medium text-slate-700 mb-1">Role</label>
                    <select
                      value={form.role}
                      onChange={(e) => setForm({...form, role: e.target.value})}
                      className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                    >
                      <option value="NORMAL_USER">Normal User</option>
                      <option value="STORE_OWNER">Store Owner</option>
                      <option value="SYSTEM_ADMIN">System Admin</option>
                    </select>
                  </div>
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
                    <input
                      type="password"
                      value={form.password}
                      onChange={(e) => setForm({...form, password: e.target.value})}
                      className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                      required
                    />
                    <p className="text-xs text-slate-500 mt-1">8-16 chars, 1 uppercase, 1 special char</p>
                  </div>
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-slate-700 mb-1">Address</label>
                    <textarea
                      value={form.address}
                      onChange={(e) => setForm({...form, address: e.target.value})}
                      className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                      rows={3}
                      required
                      maxLength={400}
                    ></textarea>
                  </div>
                </div>
                <button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 px-6 rounded-xl transition-colors shadow-sm mt-4 inline-flex items-center gap-2"
                >
                  <UserPlus className="w-4 h-4" /> Create User
                </button>
              </form>
            </div>
          ) : (
            <div>
              <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
                <h3 className="text-lg font-bold text-slate-800">
                  {activeTab === 'users' ? 'Registered Users' : 'Store Listings'}
                </h3>
                <div className="relative w-full sm:w-64">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="h-4 w-4 text-slate-400" />
                  </div>
                  <input
                    type="text"
                    placeholder="Search by name, email, etc."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                  />
                </div>
              </div>

              {loading ? (
                <div className="text-center py-10 text-slate-500">Loading data...</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-y border-slate-200">
                        {['name', 'email', 'role', 'address'].map(field => (
                          <th 
                            key={field}
                            onClick={() => handleSort(field as keyof User)}
                            className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider cursor-pointer hover:bg-slate-100 transition-colors"
                          >
                            <div className="flex items-center gap-1">
                              {field}
                              {sortField === field ? (
                                sortOrder === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />
                              ) : <span className="w-3 h-3" />}
                            </div>
                          </th>
                        ))}
                        {activeTab === 'stores' && (
                          <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Rating</th>
                        )}
                        <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredUsers.length === 0 ? (
                        <tr>
                          <td colSpan={activeTab === 'stores' ? 6 : 5} className="px-4 py-8 text-center text-slate-500">
                            No records found.
                          </td>
                        </tr>
                      ) : (
                        filteredUsers.map(u => (
                          <tr key={u.id} className="hover:bg-slate-50 transition-colors">
                            <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-slate-800">{u.name}</td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-600">{u.email}</td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-600">
                              <span className="bg-slate-100 border border-slate-200 text-slate-700 px-2 py-1 rounded-md text-xs font-medium">
                                {u.role.replace('_', ' ')}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-sm text-slate-600 max-w-xs truncate" title={u.address}>
                              {u.address}
                            </td>
                            {activeTab === 'stores' && (
                              <td className="px-4 py-3 whitespace-nowrap text-sm font-medium">
                                <div className="flex items-center gap-1 text-amber-500">
                                  <Star className="w-4 h-4 fill-current" />
                                  <span className="text-slate-700">{u.rating}</span>
                                </div>
                              </td>
                            )}
                            <td className="px-4 py-3 whitespace-nowrap text-right text-sm">
                              <button onClick={() => openEditModal(u)} className="text-blue-500 hover:text-blue-700 p-1 rounded transition-colors group" title="Edit">
                                <Edit className="w-4 h-4 group-hover:scale-110 transition-transform" />
                              </button>
                              <button onClick={() => triggerDelete(u)} className="text-red-500 hover:text-red-700 p-1 rounded transition-colors ml-1 group" title="Delete">
                                <Trash2 className="w-4 h-4 group-hover:scale-110 transition-transform" />
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {editingUser && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="border-b border-slate-100 p-5 flex justify-between items-center bg-slate-50">
              <h3 className="text-lg font-bold text-slate-800">Edit User Profile</h3>
              <button onClick={() => setEditingUser(null)} className="text-slate-400 hover:text-slate-600 p-1 rounded-full transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleEditUser} className="p-6">
              {editMsg.text && (
                <div className={`p-3 rounded-lg text-sm mb-4 border ${editMsg.type === 'error' ? 'bg-red-50 text-red-600 border-red-100' : 'bg-green-50 text-green-600 border-green-100'}`}>
                  {editMsg.text}
                </div>
              )}
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Name (Min 20, Max 60)</label>
                  <input
                    type="text"
                    value={editForm.name}
                    onChange={(e) => setEditForm({...editForm, name: e.target.value})}
                    className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                  <input
                    type="email"
                    value={editForm.email}
                    onChange={(e) => setEditForm({...editForm, email: e.target.value})}
                    className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Role</label>
                  <select
                    value={editForm.role}
                    onChange={(e) => setEditForm({...editForm, role: e.target.value})}
                    className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                  >
                    <option value="NORMAL_USER">Normal User</option>
                    <option value="STORE_OWNER">Store Owner</option>
                    <option value="SYSTEM_ADMIN">System Admin</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Password (Leave blank to keep current)</label>
                  <input
                    type="password"
                    value={editForm.password}
                    onChange={(e) => setEditForm({...editForm, password: e.target.value})}
                    className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Address</label>
                  <textarea
                    value={editForm.address}
                    onChange={(e) => setEditForm({...editForm, address: e.target.value})}
                    className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                    rows={2}
                    required
                    maxLength={400}
                  ></textarea>
                </div>
              </div>
              
              <div className="mt-6 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors shadow-sm shadow-blue-500/20"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {deletingUser && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trash2 className="w-8 h-8 text-red-500" />
              </div>
              <h3 className="text-xl font-bold text-slate-800 mb-2">Delete User?</h3>
              <p className="text-slate-500 text-sm mb-6">
                Are you sure you want to completely delete <strong>{deletingUser.name}</strong>? This action cannot be reversed.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setDeletingUser(null)}
                  className="flex-1 py-2.5 rounded-xl font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDeleteUser}
                  className="flex-1 py-2.5 rounded-xl font-medium text-white bg-red-600 hover:bg-red-700 transition-colors shadow-sm shadow-red-500/20"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default AdminDashboard;
