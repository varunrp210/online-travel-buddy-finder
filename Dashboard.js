import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import './Dashboard.css';

const Dashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    plans: 0,
    packages: 0,
    requests: 0,
    chats: 0
  });
  const [recentPlans, setRecentPlans] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [plansRes, packagesRes, requestsRes, chatsRes] = await Promise.all([
        axios.get(`/api/plans?participantId=${user.id}`),
        axios.get(`/api/packages?participantId=${user.id}`),
        axios.get('/api/buddies/requests?type=received'),
        axios.get('/api/chat')
      ]);

      setStats({
        plans: plansRes.data.length,
        packages: packagesRes.data.length,
        requests: requestsRes.data.filter(r => r.status === 'Pending').length,
        chats: chatsRes.data.length
      });

      setRecentPlans(plansRes.data.slice(0, 5));
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="loading">Loading dashboard...</div>;
  }

  return (
    <div className="container">
      <div className="dashboard-header">
        <h1>Welcome back, {user.name}!</h1>
        <p>Manage your travel plans and find your perfect travel buddy</p>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <h3>My Plans</h3>
          <p className="stat-number">{stats.plans}</p>
          <Link to="/plans" className="stat-link">View Plans</Link>
        </div>
        <div className="stat-card">
          <h3>My Packages</h3>
          <p className="stat-number">{stats.packages}</p>
          <Link to="/packages" className="stat-link">View Packages</Link>
        </div>
        <div className="stat-card">
          <h3>Pending Requests</h3>
          <p className="stat-number">{stats.requests}</p>
          <Link to="/buddy-requests" className="stat-link">View Requests</Link>
        </div>
        <div className="stat-card">
          <h3>Active Chats</h3>
          <p className="stat-number">{stats.chats}</p>
          <Link to="/chat" className="stat-link">Open Chats</Link>
        </div>
      </div>

      <div className="dashboard-section">
        <h2>Recent Plans</h2>
        {recentPlans.length > 0 ? (
          <div className="plans-list">
            {recentPlans.map(plan => (
              <div key={plan._id} className="plan-card">
                <h3>{plan.title}</h3>
                <p>{plan.description}</p>
                <div className="plan-details">
                  <span>📍 {plan.destination}</span>
                  <span>📅 {new Date(plan.startDate).toLocaleDateString()}</span>
                  <span>💰 ₹{plan.budget}</span>
                </div>
                <Link to={`/plans`} className="btn btn-primary">View Details</Link>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <p>No plans yet. Create your first travel plan!</p>
            <Link to="/plans" className="btn btn-primary">Create Plan</Link>
          </div>
        )}
      </div>

      <div className="quick-actions">
        <h2>Quick Actions</h2>
        <div className="actions-grid">
          <Link to="/plans" className="action-card">
            <h3>➕ Create Plan</h3>
            <p>Plan your next adventure</p>
          </Link>
          <Link to="/packages" className="action-card">
            <h3>📦 Add Package</h3>
            <p>Share travel packages</p>
          </Link>
          <Link to="/find-buddy" className="action-card">
            <h3>👥 Find Buddy</h3>
            <p>Discover travel companions</p>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

