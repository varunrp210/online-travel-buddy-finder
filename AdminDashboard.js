import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import './AdminDashboard.css';

const formatCurrency = (value) => `₹${(Number(value) || 0).toLocaleString('en-IN')}`;

const AdminDashboard = () => {
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [activeTab, setActiveTab] = useState('stats');
  const [users, setUsers] = useState([]);
  const [plans, setPlans] = useState([]);
  const [packages, setPackages] = useState([]);
  const [requests, setRequests] = useState([]);
  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (!isAdmin()) {
      navigate('/dashboard');
      return;
    }
    fetchStats();
  }, []);

  useEffect(() => {
    if (activeTab === 'users') fetchUsers();
    if (activeTab === 'plans') fetchPlans();
    if (activeTab === 'packages') fetchPackages();
    if (activeTab === 'requests') fetchRequests();
    if (activeTab === 'chats') fetchChats();
  }, [activeTab]);

  const fetchStats = async () => {
    try {
      const response = await axios.get('/api/admin/stats');
      setStats(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching stats:', error);
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await axios.get(`/api/admin/users?search=${searchTerm}`);
      setUsers(response.data.users);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const fetchPlans = async () => {
    try {
      const response = await axios.get('/api/admin/plans');
      setPlans(response.data);
    } catch (error) {
      console.error('Error fetching plans:', error);
    }
  };

  const fetchPackages = async () => {
    try {
      const response = await axios.get('/api/admin/packages');
      setPackages(response.data);
    } catch (error) {
      console.error('Error fetching packages:', error);
    }
  };

  const fetchRequests = async () => {
    try {
      const response = await axios.get('/api/admin/requests');
      setRequests(response.data);
    } catch (error) {
      console.error('Error fetching requests:', error);
    }
  };

  const fetchChats = async () => {
    try {
      const response = await axios.get('/api/admin/chats');
      setChats(response.data);
    } catch (error) {
      console.error('Error fetching chats:', error);
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Are you sure you want to delete this user? This will delete all their data.')) return;
    try {
      await axios.delete(`/api/admin/users/${userId}`);
      fetchUsers();
      fetchStats();
    } catch (error) {
      alert(error.response?.data?.message || 'Error deleting user');
    }
  };

  const handleDeletePlan = async (planId) => {
    if (!window.confirm('Are you sure you want to delete this plan?')) return;
    try {
      await axios.delete(`/api/admin/plans/${planId}`);
      fetchPlans();
      fetchStats();
    } catch (error) {
      alert('Error deleting plan');
    }
  };

  const handleDeletePackage = async (packageId) => {
    if (!window.confirm('Are you sure you want to delete this package?')) return;
    try {
      await axios.delete(`/api/admin/packages/${packageId}`);
      fetchPackages();
      fetchStats();
    } catch (error) {
      alert('Error deleting package');
    }
  };


  if (loading) {
    return <div className="loading">Loading admin dashboard...</div>;
  }

  if (!isAdmin()) {
    return null;
  }

  return (
    <div className="container">
      <div className="admin-header">
        <h1>Admin Dashboard</h1>
        <div className="admin-badge">
          {user.role === 'owner' ? '👑 Owner' : '🛡️ Admin'}
        </div>
      </div>

      {stats && (
        <div className="stats-grid">
          <div className="stat-card">
            <h3>Total Users</h3>
            <p className="stat-number">{stats.totalUsers}</p>
            <p className="stat-sub">Active: {stats.activeUsers}</p>
          </div>
          <div className="stat-card">
            <h3>Travel Plans</h3>
            <p className="stat-number">{stats.totalPlans}</p>
          </div>
          <div className="stat-card">
            <h3>Packages</h3>
            <p className="stat-number">{stats.totalPackages}</p>
          </div>
          <div className="stat-card">
            <h3>Buddy Requests</h3>
            <p className="stat-number">{stats.totalRequests}</p>
          </div>
          <div className="stat-card">
            <h3>Chats</h3>
            <p className="stat-number">{stats.totalChats}</p>
          </div>
        </div>
      )}

      <div className="admin-tabs">
        <button
          className={activeTab === 'stats' ? 'active' : ''}
          onClick={() => setActiveTab('stats')}
        >
          Statistics
        </button>
        <button
          className={activeTab === 'users' ? 'active' : ''}
          onClick={() => setActiveTab('users')}
        >
          Users
        </button>
        <button
          className={activeTab === 'plans' ? 'active' : ''}
          onClick={() => setActiveTab('plans')}
        >
          Plans
        </button>
        <button
          className={activeTab === 'packages' ? 'active' : ''}
          onClick={() => setActiveTab('packages')}
        >
          Packages
        </button>
        <button
          className={activeTab === 'requests' ? 'active' : ''}
          onClick={() => setActiveTab('requests')}
        >
          Requests
        </button>
        <button
          className={activeTab === 'chats' ? 'active' : ''}
          onClick={() => setActiveTab('chats')}
        >
          Chats
        </button>
      </div>

      <div className="admin-content">
        {activeTab === 'users' && (
          <div>
            <div className="search-bar">
              <input
                type="text"
                placeholder="Search users..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setTimeout(() => fetchUsers(), 500);
                }}
              />
            </div>
            <div className="table-container">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th>University</th>
                    <th>Joined</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map(user => (
                    <tr key={user._id}>
                      <td>{user.name}</td>
                      <td>{user.email}</td>
                      <td>
                        <span className={`role-badge role-${user.role}`}>
                          {user.role}
                        </span>
                      </td>
                      <td>{user.university || '-'}</td>
                      <td>{new Date(user.createdAt).toLocaleDateString()}</td>
                      <td>
                        {user.role !== 'owner' && (
                          <button
                            onClick={() => handleDeleteUser(user._id)}
                            className="btn btn-danger btn-sm"
                          >
                            Delete
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'plans' && (
          <div className="table-container">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Destination</th>
                  <th>Creator</th>
                  <th>Budget</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {plans.map(plan => (
                  <tr key={plan._id}>
                    <td>{plan.title}</td>
                    <td>{plan.destination}</td>
                    <td>{plan.userId?.name || 'Unknown'}</td>
                    <td>{formatCurrency(plan.budget)}</td>
                    <td>{plan.status}</td>
                    <td>
                      <button
                        onClick={() => handleDeletePlan(plan._id)}
                        className="btn btn-danger btn-sm"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'packages' && (
          <div className="table-container">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Destination</th>
                  <th>Creator</th>
                  <th>Price</th>
                  <th>Duration</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {packages.map(pkg => (
                  <tr key={pkg._id}>
                    <td>{pkg.name}</td>
                    <td>{pkg.destination}</td>
                    <td>{pkg.userId?.name || 'Unknown'}</td>
                    <td>{formatCurrency(pkg.price)}</td>
                    <td>{pkg.duration} days</td>
                    <td>
                      <button
                        onClick={() => handleDeletePackage(pkg._id)}
                        className="btn btn-danger btn-sm"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'requests' && (
          <div className="table-container">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>From</th>
                  <th>To</th>
                  <th>Plan</th>
                  <th>Status</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {requests.map(request => (
                  <tr key={request._id}>
                    <td>{request.fromUser?.name || 'Unknown'}</td>
                    <td>{request.toUser?.name || 'Unknown'}</td>
                    <td>{request.planId?.title || 'General'}</td>
                    <td>{request.status}</td>
                    <td>{new Date(request.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'chats' && (
          <div className="table-container">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Participants</th>
                  <th>Last Message</th>
                  <th>Last Message Time</th>
                  <th>Messages Count</th>
                </tr>
              </thead>
              <tbody>
                {chats.map(chat => (
                  <tr key={chat._id}>
                    <td>
                      {chat.participants.map(p => p.name).join(', ')}
                    </td>
                    <td>{chat.lastMessage || '-'}</td>
                    <td>{new Date(chat.lastMessageTime).toLocaleString()}</td>
                    <td>{chat.messages?.length || 0}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;

