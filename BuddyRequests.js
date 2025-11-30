import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import './BuddyRequests.css';

const BuddyRequests = () => {
  const { user } = useAuth();
  const [requests, setRequests] = useState([]);
  const [filter, setFilter] = useState('all'); // all, sent, received
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRequests();
  }, [filter]);

  const fetchRequests = async () => {
    try {
      const response = await axios.get(`/api/buddies/requests?type=${filter}`);
      setRequests(response.data);
    } catch (error) {
      console.error('Error fetching requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRequestAction = async (requestId, action) => {
    try {
      await axios.put(`/api/buddies/requests/${requestId}`, {
        status: action
      });
      fetchRequests();
    } catch (error) {
      console.error('Error updating request:', error);
      alert('Error updating request');
    }
  };

  if (loading) {
    return <div className="loading">Loading requests...</div>;
  }

  const receivedRequests = requests.filter(r => r.toUser._id === user.id);
  const sentRequests = requests.filter(r => r.fromUser._id === user.id);

  return (
    <div className="container">
      <h1>Buddy Requests</h1>

      <div className="filter-tabs">
        <button
          className={filter === 'all' ? 'active' : ''}
          onClick={() => setFilter('all')}
        >
          All ({requests.length})
        </button>
        <button
          className={filter === 'received' ? 'active' : ''}
          onClick={() => setFilter('received')}
        >
          Received ({receivedRequests.length})
        </button>
        <button
          className={filter === 'sent' ? 'active' : ''}
          onClick={() => setFilter('sent')}
        >
          Sent ({sentRequests.length})
        </button>
      </div>

      <div className="requests-list">
        {requests.map(request => {
          const isReceived = request.toUser._id === user.id;
          const otherUser = isReceived ? request.fromUser : request.toUser;

          return (
            <div key={request._id} className="request-card">
              <div className="request-header">
                <div>
                  <h3>{otherUser.name}</h3>
                  <p className="request-meta">
                    {isReceived ? 'Sent you a request' : 'You sent a request'}
                    {request.planId && ` for plan: ${request.planId.title}`}
                  </p>
                </div>
                <span className={`status-badge status-${request.status.toLowerCase()}`}>
                  {request.status}
                </span>
              </div>

              {request.message && (
                <div className="request-message">
                  <strong>Message:</strong> {request.message}
                </div>
              )}

              {request.planId && (
                <div className="request-plan">
                  <strong>Plan:</strong> {request.planId.title}
                  <br />
                  <span>📍 {request.planId.destination}</span>
                  <br />
                  <span>📅 {new Date(request.planId.startDate).toLocaleDateString()}</span>
                </div>
              )}

              {isReceived && request.status === 'Pending' && (
                <div className="request-actions">
                  <button
                    onClick={() => handleRequestAction(request._id, 'Accepted')}
                    className="btn btn-success"
                  >
                    Accept
                  </button>
                  <button
                    onClick={() => handleRequestAction(request._id, 'Rejected')}
                    className="btn btn-danger"
                  >
                    Reject
                  </button>
                </div>
              )}

              {!isReceived && request.status === 'Pending' && (
                <div className="request-info">
                  <p>Waiting for response...</p>
                </div>
              )}

              {request.status === 'Accepted' && (
                <div className="request-success">
                  <p>✓ Request accepted! You can now chat with {otherUser.name}.</p>
                </div>
              )}

              {request.status === 'Rejected' && (
                <div className="request-rejected">
                  <p>Request was rejected.</p>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {requests.length === 0 && (
        <div className="empty-state">
          <p>No buddy requests found.</p>
        </div>
      )}
    </div>
  );
};

export default BuddyRequests;

