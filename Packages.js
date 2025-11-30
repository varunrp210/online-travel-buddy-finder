import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import './Packages.css';

const curatedPackages = [
  {
    name: 'Goa Beach Escape',
    destination: 'Goa',
    description: '4-day beach break covering Baga, Anjuna, and Old Goa heritage walk with water sports.',
    duration: 4,
    price: 18999,
    inclusions: ['3-star beach resort', 'Daily breakfast', 'Airport transfers', 'North Goa sightseeing', 'Water sports voucher'],
    exclusions: ['Flights', 'Lunch & Dinner', 'Personal expenses'],
    badge: 'Popular'
  },
  {
    name: 'Hampi Heritage Trail',
    destination: 'Hampi',
    description: '3-day guided tour exploring UNESCO ruins, sunrise coracle ride, and Anjanadri Hill trek.',
    duration: 3,
    price: 12999,
    inclusions: ['Boutique homestay', 'Guided ruins tour', 'Local transfers', 'Breakfast & Dinner'],
    exclusions: ['Lunch', 'Monuments entry fee'],
    badge: 'Culture'
  },
  {
    name: 'Mumbai City Lights',
    destination: 'Mumbai',
    description: 'Weekend escape covering Gateway of India, Colaba walk, Bollywood studio visit, and Marine Drive.',
    duration: 3,
    price: 15999,
    inclusions: ['City hotel', 'Breakfast', 'City sightseeing', 'Bollywood studio pass'],
    exclusions: ['Flights', 'Dinner'],
    badge: 'Weekend'
  },
  {
    name: 'Chennai Coastal Culture',
    destination: 'Chennai',
    description: '5-day coastal trail covering Mahabalipuram, Pondicherry day trip, and Marina food crawl.',
    duration: 5,
    price: 20999,
    inclusions: ['Hotel stay', 'Breakfast & Dinner', 'AC coach transfers', 'Cultural guide'],
    exclusions: ['Flights', 'Lunch'],
    badge: 'New'
  }
];

const normalizeId = (value) => {
  if (!value) return '';
  if (typeof value === 'string') return value;
  if (typeof value === 'object' && value._id) return value._id.toString();
  if (typeof value === 'object' && value.id) return value.id.toString();
  return value.toString();
};

const Packages = () => {
  const { user } = useAuth();
  const [packages, setPackages] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [packageActionId, setPackageActionId] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    destination: '',
    duration: '',
    price: '',
    inclusions: '',
    exclusions: ''
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPackages();
  }, []);

  const fetchPackages = async () => {
    try {
      const response = await axios.get('/api/packages');
      setPackages(response.data);
    } catch (error) {
      console.error('Error fetching packages:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post('/api/packages', {
        ...formData,
        inclusions: formData.inclusions.split(',').map(item => item.trim()).filter(item => item),
        exclusions: formData.exclusions.split(',').map(item => item.trim()).filter(item => item),
        duration: parseInt(formData.duration),
        price: parseFloat(formData.price)
      });
      setShowForm(false);
      setFormData({
        name: '',
        description: '',
        destination: '',
        duration: '',
        price: '',
        inclusions: '',
        exclusions: ''
      });
      fetchPackages();
    } catch (error) {
      console.error('Error creating package:', error);
      alert('Error creating package');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this package?')) {
      try {
        await axios.delete(`/api/packages/${id}`);
        fetchPackages();
      } catch (error) {
        console.error('Error deleting package:', error);
        alert('Error deleting package');
      }
    }
  };

  const currentUserId = normalizeId(user?.id);

  const handleQuickAddPackage = async (pkg) => {
    try {
      await axios.post('/api/packages', pkg);
      fetchPackages();
      alert(`${pkg.name} added to your packages!`);
    } catch (error) {
      console.error('Error adding sample package:', error);
      alert('Unable to add this package. Please try again.');
    }
  };

  const handleJoinPackage = async (packageId) => {
    try {
      setPackageActionId(packageId);
      const response = await axios.post(`/api/packages/${packageId}/join`);
      setPackages(prev => prev.map(pkg => (pkg._id === packageId ? response.data : pkg)));
    } catch (error) {
      alert(error.response?.data?.message || 'Unable to join this package.');
    } finally {
      setPackageActionId(null);
    }
  };

  const handleLeavePackage = async (packageId) => {
    try {
      setPackageActionId(packageId);
      const response = await axios.delete(`/api/packages/${packageId}/join`);
      setPackages(prev => prev.map(pkg => (pkg._id === packageId ? response.data : pkg)));
    } catch (error) {
      alert(error.response?.data?.message || 'Unable to leave this package.');
    } finally {
      setPackageActionId(null);
    }
  };

  if (loading) {
    return <div className="loading">Loading packages...</div>;
  }

  return (
    <div className="container">
      <div className="page-header">
        <h1>Travel Packages</h1>
        <button onClick={() => setShowForm(!showForm)} className="btn btn-primary">
          {showForm ? 'Cancel' : '+ Add New Package'}
        </button>
      </div>

      <div className="sample-packages card">
        <div className="sample-packages-header">
          <div>
            <h2>Popular Ready-to-Use Packages</h2>
            <p>One click to add curated itineraries for top student destinations.</p>
          </div>
        </div>
        <div className="sample-packages-grid">
          {curatedPackages.map(pkg => (
            <div key={pkg.name} className="sample-package-card">
              <div className="sample-badge">{pkg.badge}</div>
              <h3>{pkg.name}</h3>
              <p className="sample-destination">📍 {pkg.destination} • {pkg.duration} days</p>
              <p className="sample-description">{pkg.description}</p>
              <p className="sample-price">₹{pkg.price.toLocaleString()}</p>
              <button
                className="btn btn-secondary"
                onClick={() => handleQuickAddPackage(pkg)}
              >
                Add this package
              </button>
            </div>
          ))}
        </div>
      </div>

      {showForm && (
        <div className="card">
          <h2>Create New Package</h2>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Package Name *</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
              />
            </div>
            <div className="form-group">
              <label>Description *</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                required
              />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Destination *</label>
                <input
                  type="text"
                  name="destination"
                  value={formData.destination}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="form-group">
                <label>Duration (days) *</label>
                <input
                  type="number"
                  name="duration"
                  value={formData.duration}
                  onChange={handleChange}
                  min="1"
                  required
                />
              </div>
            </div>
            <div className="form-group">
              <label>Price *</label>
              <input
                type="number"
                name="price"
                value={formData.price}
                onChange={handleChange}
                min="0"
                step="0.01"
                required
              />
            </div>
            <div className="form-group">
              <label>Inclusions (comma separated)</label>
              <input
                type="text"
                name="inclusions"
                value={formData.inclusions}
                onChange={handleChange}
                placeholder="Hotel, Meals, Transport"
              />
            </div>
            <div className="form-group">
              <label>Exclusions (comma separated)</label>
              <input
                type="text"
                name="exclusions"
                value={formData.exclusions}
                onChange={handleChange}
                placeholder="Flights, Insurance"
              />
            </div>
            <button type="submit" className="btn btn-primary">Create Package</button>
          </form>
        </div>
      )}

      <div className="packages-grid">
        {packages.map(pkg => {
          const participants = Array.isArray(pkg.participants) ? pkg.participants : [];
          const isOwner = normalizeId(pkg.userId) === currentUserId;
          const isJoined = participants.some(participant => normalizeId(participant) === currentUserId);
          const ownerName =
            typeof pkg.userId === 'object' && pkg.userId !== null
              ? pkg.userId.name
              : (isOwner ? 'You' : 'Unknown');

          return (
            <div key={pkg._id} className="package-item">
              <div className="package-header">
                <h3>{pkg.name}</h3>
                <div className="package-actions">
                  {isOwner ? (
                  <button
                    onClick={() => handleDelete(pkg._id)}
                    className="btn btn-danger btn-sm"
                  >
                    Delete
                  </button>
                  ) : isJoined ? (
                    <button
                      onClick={() => handleLeavePackage(pkg._id)}
                      className="btn btn-secondary btn-sm"
                      disabled={packageActionId === pkg._id}
                    >
                      {packageActionId === pkg._id ? 'Leaving...' : 'Leave Package'}
                    </button>
                  ) : (
                    <button
                      onClick={() => handleJoinPackage(pkg._id)}
                      className="btn btn-success btn-sm"
                      disabled={packageActionId === pkg._id}
                    >
                      {packageActionId === pkg._id ? 'Joining...' : 'Join Package'}
                    </button>
                  )}
                </div>
              </div>
              <p>{pkg.description}</p>
              <div className="package-info">
                <span>📍 {pkg.destination}</span>
                <span>⏱️ {pkg.duration} days</span>
                <span>💰 ₹{pkg.price}</span>
                <span>👥 {participants.length} joined</span>
              </div>
            {pkg.inclusions && pkg.inclusions.length > 0 && (
              <div className="package-section">
                <strong>Inclusions:</strong>
                <ul>
                  {pkg.inclusions.map((item, idx) => (
                    <li key={idx}>{item}</li>
                  ))}
                </ul>
              </div>
            )}
            {pkg.exclusions && pkg.exclusions.length > 0 && (
              <div className="package-section">
                <strong>Exclusions:</strong>
                <ul>
                  {pkg.exclusions.map((item, idx) => (
                    <li key={idx}>{item}</li>
                  ))}
                </ul>
              </div>
            )}
              <div className="package-footer">
                <span>By: {ownerName}</span>
                {participants.length > 0 && (
                  <div className="package-participants">
                    {participants.map(participant => (
                      <span key={normalizeId(participant)} className="participant-chip">
                        {normalizeId(participant) === currentUserId ? 'You' : participant.name || 'Traveler'}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {packages.length === 0 && !showForm && (
        <div className="empty-state">
          <p>No packages yet. Use the curated packages above or create your own!</p>
        </div>
      )}
    </div>
  );
};

export default Packages;

