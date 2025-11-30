import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import './FindBuddy.css';

const FindBuddy = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [buddies, setBuddies] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [university, setUniversity] = useState('');
  const [interests, setInterests] = useState('');
  const [useLocation, setUseLocation] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (useLocation && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          fetchNearbyBuddies(position.coords.latitude, position.coords.longitude);
        },
        (error) => {
          console.error('Error getting location:', error);
          alert('Could not get your location. Please enable location services.');
        }
      );
    } else {
      fetchBuddies();
    }
  }, [useLocation]);

  const fetchBuddies = async () => {
    setLoading(true);
    try {
      const params = {};
      if (searchQuery) params.query = searchQuery;
      if (university) params.university = university;
      if (interests) params.interests = interests;

      const response = await axios.get('/api/users/search', { params });
      setBuddies(response.data);
    } catch (error) {
      console.error('Error fetching buddies:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchNearbyBuddies = async (lat, lon) => {
    setLoading(true);
    try {
      const response = await axios.get('/api/buddies/nearby', {
        params: { latitude: lat, longitude: lon, maxDistance: 50 }
      });
      setBuddies(response.data);
    } catch (error) {
      console.error('Error fetching nearby buddies:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (useLocation && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          fetchNearbyBuddies(position.coords.latitude, position.coords.longitude);
        },
        (error) => {
          console.error('Error getting location:', error);
          fetchBuddies();
        }
      );
    } else {
      fetchBuddies();
    }
  };

  const sendBuddyRequest = async (toUserId, planId = null) => {
    const message = window.prompt('Add a message (optional):');
    if (message === null) return;

    try {
      await axios.post('/api/buddies/request', {
        toUser: toUserId,
        planId,
        message
      });
      alert('Buddy request sent successfully!');
    } catch (error) {
      console.error('Error sending request:', error);
      alert(error.response?.data?.message || 'Error sending request');
    }
  };

  const openChat = async (userId) => {
    try {
      // First ensure chat exists
      await axios.get(`/api/chat/${userId}`);
      navigate(`/chat/${userId}`);
    } catch (error) {
      console.error('Error opening chat:', error);
      navigate(`/chat/${userId}`); // Navigate anyway, chat will be created
    }
  };

  return (
    <div className="container">
      <h1>Find Travel Buddy</h1>

      <div className="search-section">
        <form onSubmit={handleSearch} className="search-form">
          <div className="form-row">
            <div className="form-group">
              <label>Search by name or email</label>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search..."
              />
            </div>
            <div className="form-group">
              <label>University</label>
              <input
                type="text"
                value={university}
                onChange={(e) => setUniversity(e.target.value)}
                placeholder="University name"
              />
            </div>
            <div className="form-group">
              <label>Interests (comma separated)</label>
              <input
                type="text"
                value={interests}
                onChange={(e) => setInterests(e.target.value)}
                placeholder="adventure, photography"
              />
            </div>
          </div>
          <div className="form-group">
            <label>
              <input
                type="checkbox"
                checked={useLocation}
                onChange={(e) => setUseLocation(e.target.checked)}
              />
              Find nearby buddies (uses your location)
            </label>
          </div>
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Searching...' : 'Search'}
          </button>
        </form>
      </div>

      <div className="buddies-grid">
        {buddies.map(buddy => (
          <div key={buddy._id} className="buddy-card">
            <div className="buddy-header">
              <div>
                <h3>{buddy.name}</h3>
                {buddy.isOnline && <span className="online-badge">Online</span>}
              </div>
            </div>
            <div className="buddy-info">
              {buddy.email && <p>📧 {buddy.email}</p>}
              {buddy.university && <p>🎓 {buddy.university}</p>}
              {buddy.age && <p>👤 Age: {buddy.age}</p>}
              {buddy.gender && <p>⚧️ {buddy.gender}</p>}
              {buddy.distance && <p>📍 {buddy.distance.toFixed(2)} km away</p>}
              {buddy.bio && <p className="buddy-bio">{buddy.bio}</p>}
            </div>
            {buddy.interests && buddy.interests.length > 0 && (
              <div className="buddy-interests">
                {buddy.interests.map((interest, idx) => (
                  <span key={idx} className="interest-tag">{interest}</span>
                ))}
              </div>
            )}
            <div className="buddy-actions">
              <button
                onClick={() => sendBuddyRequest(buddy._id)}
                className="btn btn-primary"
              >
                Send Request
              </button>
              <button
                onClick={() => openChat(buddy._id)}
                className="btn btn-secondary"
              >
                Chat
              </button>
            </div>
          </div>
        ))}
      </div>

      {buddies.length === 0 && !loading && (
        <div className="empty-state">
          <p>No buddies found. Try adjusting your search criteria.</p>
        </div>
      )}
    </div>
  );
};

export default FindBuddy;

