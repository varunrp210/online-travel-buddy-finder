import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import './Navbar.css';

const Navbar = () => {
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <Link to="/dashboard" className="navbar-brand">
          <h2>Travel Buddy Finder</h2>
        </Link>
        <div className="navbar-menu">
          <Link to="/dashboard" className="navbar-link">Dashboard</Link>
          <Link to="/plans" className="navbar-link">Plans</Link>
          <Link to="/packages" className="navbar-link">Packages</Link>
          <Link to="/find-buddy" className="navbar-link">Find Buddy</Link>
          <Link to="/buddy-requests" className="navbar-link">Requests</Link>
          <Link to="/chat" className="navbar-link">Chat</Link>
          <Link to="/profile" className="navbar-link">Profile</Link>
          <Link to="/reviews" className="navbar-link">Reviews</Link>
          {isAdmin() && (
            <Link to="/admin" className="navbar-link" style={{ background: '#ffc107', color: '#000', padding: '5px 10px', borderRadius: '5px' }}>
              Admin
            </Link>
          )}
          <button onClick={handleLogout} className="btn-logout">
            Logout
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;

