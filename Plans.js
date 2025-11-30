import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import './Plans.css';

const transportSchedules = [
  {
    destinations: ['Goa', 'Gokarna'],
    mode: 'Bus',
    options: [
      { name: 'VRL Goa Express', departure: '07:30 PM', from: 'Bengaluru', duration: '12h', price: '₹1,800', operator: 'VRL Travels' },
      { name: 'Paulo Luxury Coach', departure: '08:15 PM', from: 'Mumbai', duration: '14h', price: '₹1,650', operator: 'Paulo Travels' }
    ]
  },
  {
    destinations: ['Goa'],
    mode: 'Train',
    options: [
      { name: 'Madgaon Express', departure: '06:15 AM', from: 'Mumbai CST', duration: '10h', price: '₹1,200', operator: 'Indian Railways' },
      { name: 'Konkan Queen', departure: '04:45 PM', from: 'Mangaluru', duration: '9h', price: '₹980', operator: 'Indian Railways' }
    ]
  },
  {
    destinations: ['Hampi'],
    mode: 'Bus',
    options: [
      { name: 'KSRTC Rajahamsa', departure: '10:00 PM', from: 'Bengaluru', duration: '7h', price: '₹750', operator: 'KSRTC' },
      { name: 'Sugama Tourist', departure: '09:30 PM', from: 'Mysuru', duration: '9h', price: '₹900', operator: 'Sugama' }
    ]
  },
  {
    destinations: ['Hampi'],
    mode: 'Train',
    options: [
      { name: 'Hampi Express', departure: '10:20 PM', from: 'Mysuru', duration: '9h 40m', price: '₹620', operator: 'Indian Railways' },
      { name: 'Gol Gumbaz Exp', departure: '02:30 PM', from: 'Bengaluru', duration: '8h 30m', price: '₹580', operator: 'Indian Railways' }
    ]
  },
  {
    destinations: ['Mumbai'],
    mode: 'Train',
    options: [
      { name: 'Deccan Queen', departure: '07:00 AM', from: 'Pune', duration: '3h', price: '₹550', operator: 'Indian Railways' },
      { name: 'Rajdhani Express', departure: '04:45 PM', from: 'Delhi', duration: '16h', price: '₹2,450', operator: 'Indian Railways' }
    ]
  },
  {
    destinations: ['Chennai'],
    mode: 'Train',
    options: [
      { name: 'Chennai Express', departure: '06:00 AM', from: 'Bengaluru', duration: '5h 30m', price: '₹480', operator: 'Indian Railways' },
      { name: 'Coromandel Express', departure: '08:45 PM', from: 'Kolkata', duration: '26h', price: '₹1,950', operator: 'Indian Railways' }
    ]
  },
  {
    destinations: ['Mumbai', 'Goa', 'Chennai', 'Hampi'],
    mode: 'Bus',
    options: [
      { name: 'RedBus Premium', departure: '09:00 PM', from: 'Any Major City', duration: '8-14h', price: '₹999 - ₹1,999', operator: 'RedBus Partners' }
    ]
  }
];

const formatCurrency = (value) => {
  const amount = Number(value) || 0;
  return amount.toLocaleString('en-IN');
};

const normalizeId = (value) => {
  if (!value) return '';
  if (typeof value === 'string') return value;
  if (typeof value === 'object' && value._id) return value._id.toString();
  if (typeof value === 'object' && value.id) return value.id.toString();
  return value.toString();
};

const Plans = () => {
  const { user } = useAuth();
  const [plans, setPlans] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [planActionId, setPlanActionId] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    destination: '',
    startDate: '',
    endDate: '',
    budget: '',
    maxBuddies: 1,
    tags: '',
    transportMode: 'Bike',
    transportNotes: ''
  });
  const [transportOptions, setTransportOptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const currentUserId = normalizeId(user?.id);

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    try {
      const response = await axios.get('/api/plans');
      setPlans(response.data);
    } catch (error) {
      console.error('Error fetching plans:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleJoinPlan = async (planId) => {
    try {
      setPlanActionId(planId);
      const response = await axios.post(`/api/plans/${planId}/join`);
      setPlans(prev =>
        prev.map(plan => (plan._id === planId ? response.data : plan))
      );
    } catch (error) {
      alert(error.response?.data?.message || 'Unable to join this plan.');
    } finally {
      setPlanActionId(null);
    }
  };

  const handleLeavePlan = async (planId) => {
    try {
      setPlanActionId(planId);
      const response = await axios.delete(`/api/plans/${planId}/join`);
      setPlans(prev =>
        prev.map(plan => (plan._id === planId ? response.data : plan))
      );
    } catch (error) {
      alert(error.response?.data?.message || 'Unable to leave this plan.');
    } finally {
      setPlanActionId(null);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  useEffect(() => {
    if (!formData.destination || !['Bus', 'Train'].includes(formData.transportMode)) {
      setTransportOptions([]);
      return;
    }
    const destination = formData.destination.toLowerCase();
    const matches = transportSchedules.filter(schedule =>
      schedule.mode === formData.transportMode &&
      schedule.destinations.some(dest => destination.includes(dest.toLowerCase()))
    );
    if (matches.length > 0) {
      setTransportOptions(matches[0].options);
    } else {
      // fallback general options
      const general = transportSchedules.find(schedule =>
        schedule.mode === formData.transportMode && schedule.destinations.includes(formData.transportMode === 'Bus' ? 'Goa' : 'Mumbai')
      );
      setTransportOptions(general ? general.options : []);
    }
  }, [formData.destination, formData.transportMode]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post('/api/plans', {
        ...formData,
        tags: formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag)
      });
      setShowForm(false);
      setFormData({
        title: '',
        description: '',
        destination: '',
        startDate: '',
        endDate: '',
        budget: '',
        maxBuddies: 1,
        tags: '',
        transportMode: 'Bike',
        transportNotes: ''
      });
      setTransportOptions([]);
      fetchPlans();
    } catch (error) {
      console.error('Error creating plan:', error);
      alert('Error creating plan');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this plan?')) {
      try {
        await axios.delete(`/api/plans/${id}`);
        fetchPlans();
      } catch (error) {
        console.error('Error deleting plan:', error);
        alert('Error deleting plan');
      }
    }
  };

  if (loading) {
    return <div className="loading">Loading plans...</div>;
  }

  return (
    <div className="container">
      <div className="page-header">
        <h1>Travel Plans</h1>
        <button onClick={() => setShowForm(!showForm)} className="btn btn-primary">
          {showForm ? 'Cancel' : '+ Add New Plan'}
        </button>
      </div>

      {showForm && (
        <div className="card">
          <h2>Create New Plan</h2>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Title *</label>
              <input
                type="text"
                name="title"
                value={formData.title}
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
                <label>Budget *</label>
                <input
                  type="number"
                  name="budget"
                  value={formData.budget}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Start Date *</label>
                <input
                  type="date"
                  name="startDate"
                  value={formData.startDate}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="form-group">
                <label>End Date *</label>
                <input
                  type="date"
                  name="endDate"
                  value={formData.endDate}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Max Buddies</label>
                <input
                  type="number"
                  name="maxBuddies"
                  value={formData.maxBuddies}
                  onChange={handleChange}
                  min="1"
                />
              </div>
              <div className="form-group">
                <label>Tags (comma separated)</label>
                <input
                  type="text"
                  name="tags"
                  value={formData.tags}
                  onChange={handleChange}
                  placeholder="adventure, budget, solo"
                />
              </div>
              <div className="form-group">
                <label>Transport Mode</label>
                <select
                  name="transportMode"
                  value={formData.transportMode}
                  onChange={handleChange}
                >
                  <option value="Bike">Bike</option>
                  <option value="Car">Car</option>
                  <option value="Bus">Bus</option>
                  <option value="Train">Train</option>
                </select>
              </div>
            </div>
            {['Bus', 'Train'].includes(formData.transportMode) && transportOptions.length > 0 && (
              <div className="transport-suggestions">
                <h4>Suggested {formData.transportMode === 'Bus' ? 'Bus' : 'Train'} Options</h4>
                <div className="transport-cards">
                  {transportOptions.map((option, idx) => (
                    <div key={idx} className="transport-card">
                      <div className="transport-card-header">
                        <strong>{option.name}</strong>
                        <span>{option.operator}</span>
                      </div>
                      <p>Departure: {option.departure}</p>
                      <p>From: {option.from}</p>
                      <p>Duration: {option.duration}</p>
                      <p>Approx Fare: {option.price}</p>
                      <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        onClick={() => setFormData(prev => ({ ...prev, transportNotes: `₹{option.name} - ₹{option.departure}, ₹{option.from} (₹{option.price})` }))}
                      >
                        Use this option
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
            <div className="form-group">
              <label>Transport Notes</label>
              <textarea
                name="transportNotes"
                value={formData.transportNotes}
                onChange={handleChange}
                placeholder="Add bus/train details, meeting point, etc."
              />
            </div>
            <button type="submit" className="btn btn-primary">Create Plan</button>
          </form>
        </div>
      )}

      <div className="plans-grid">
        {plans.map(plan => {
          const buddies = Array.isArray(plan.currentBuddies) ? plan.currentBuddies : [];
          const isOwner = normalizeId(plan.userId) === currentUserId;
          const isJoined = buddies.some(buddy => normalizeId(buddy) === currentUserId);
          const isFull = buddies.length >= plan.maxBuddies;
          const ownerName =
            typeof plan.userId === 'object' && plan.userId !== null
              ? plan.userId.name
              : (isOwner ? 'You' : 'Unknown');

          return (
            <div key={plan._id} className="plan-item">
              <div className="plan-header">
                <h3>{plan.title}</h3>
                <div className="plan-actions">
                  {isOwner ? (
                  <button
                    onClick={() => handleDelete(plan._id)}
                    className="btn btn-danger btn-sm"
                  >
                    Delete
                  </button>
                  ) : (
                    <>
                      {isJoined ? (
                        <button
                          onClick={() => handleLeavePlan(plan._id)}
                          className="btn btn-secondary btn-sm"
                          disabled={planActionId === plan._id}
                        >
                          {planActionId === plan._id ? 'Leaving...' : 'Leave Plan'}
                        </button>
                      ) : (
                        <button
                          onClick={() => handleJoinPlan(plan._id)}
                          className="btn btn-success btn-sm"
                          disabled={planActionId === plan._id || isFull}
                        >
                          {planActionId === plan._id
                            ? 'Joining...'
                            : isFull
                              ? 'Plan Full'
                              : 'Join Plan'}
                        </button>
                      )}
                    </>
                  )}
                </div>
              </div>
              <p>{plan.description}</p>
              <div className="plan-info">
                <span>📍 {plan.destination}</span>
                <span>📅 {new Date(plan.startDate).toLocaleDateString()} - {new Date(plan.endDate).toLocaleDateString()}</span>
                <span>💰 ₹{formatCurrency(plan.budget)}</span>
                <span>👥 {buddies.length}/{plan.maxBuddies} buddies</span>
                <span>🚗 Transport: {plan.transportMode || 'Bike'}</span>
              </div>
              {buddies.length > 0 && (
                <div className="plan-participants">
                  {buddies.map((buddy) => (
                    <span key={normalizeId(buddy)} className="participant-chip">
                      {normalizeId(buddy) === currentUserId ? 'You' : buddy.name || 'Traveler'}
                    </span>
                  ))}
                </div>
              )}
              {plan.transportNotes && (
                <div className="transport-note">
                  <strong>Travel Plan:</strong> {plan.transportNotes}
                </div>
              )}
              <div className="plan-footer">
                <span className="plan-status">{plan.status}</span>
                <span className="plan-creator">By: {ownerName}</span>
              </div>
              {plan.tags && plan.tags.length > 0 && (
                <div className="plan-tags">
                  {plan.tags.map((tag, idx) => (
                    <span key={idx} className="tag">{tag}</span>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {plans.length === 0 && !showForm && (
        <div className="empty-state">
          <p>No plans yet. Create your first travel plan!</p>
        </div>
      )}
    </div>
  );
};

export default Plans;

