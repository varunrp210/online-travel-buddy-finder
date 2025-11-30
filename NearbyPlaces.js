import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import './NearbyPlaces.css';

const NearbyPlaces = () => {
  const { user } = useAuth();
  const [places, setPlaces] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [type, setType] = useState('all');
  const [useLocation, setUseLocation] = useState(false);
  const [useGoogleMaps, setUseGoogleMaps] = useState(true);
  const [destination, setDestination] = useState('');
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    type: 'Tourist Spot',
    description: '',
    address: '',
    latitude: '',
    longitude: '',
    priceRange: '',
    contact: {
      phone: '',
      email: '',
      website: ''
    }
  });

  useEffect(() => {
    // Only fetch if we have the necessary parameters
    if (useGoogleMaps) {
      if (destination) {
        // Has destination, fetch Google places
        fetchGooglePlaces(destination);
      } else if (useLocation && navigator.geolocation) {
        // Has location permission, fetch nearby Google places
        navigator.geolocation.getCurrentPosition(
          (position) => {
            fetchGooglePlaces(null, position.coords.latitude, position.coords.longitude);
          },
          (error) => {
            console.error('Error getting location:', error);
            // If location fails and no destination, show message
            if (!destination) {
              setPlaces([]);
              setLoading(false);
            }
          }
        );
      } else {
        // Google Maps enabled but no destination or location - wait for user input
        setPlaces([]);
        setLoading(false);
      }
    } else if (useLocation && navigator.geolocation) {
      // Custom places with location
      navigator.geolocation.getCurrentPosition(
        (position) => {
          fetchNearbyPlaces(position.coords.latitude, position.coords.longitude);
        },
        (error) => {
          console.error('Error getting location:', error);
          fetchPlaces(); // Fallback to all custom places
        }
      );
    } else {
      // Custom places without location
      fetchPlaces();
    }
  }, [type, useLocation, useGoogleMaps, destination]);

  const fetchPlaces = async () => {
    setLoading(true);
    try {
      const params = {};
      if (type !== 'all') params.type = type;

      const response = await axios.get('/api/places', { params });
      setPlaces(response.data);
    } catch (error) {
      console.error('Error fetching places:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchGooglePlaces = async (dest, lat = null, lon = null) => {
    setLoading(true);
    try {
      const params = {};
      if (dest) params.destination = dest;
      if (lat && lon) {
        params.latitude = lat;
        params.longitude = lon;
      }
      if (type !== 'all') params.type = type;

      const response = await axios.get('/api/places/google', { params });
      setPlaces(response.data);
      
      if (response.data.length === 0) {
        // No results found, show message but don't error
        console.log('No places found for the search criteria');
      }
    } catch (error) {
      console.error('Error fetching Google places:', error);
      
      // Handle specific error cases
      if (error.response?.data?.code === 'API_KEY_MISSING') {
        alert('Google Maps API key is not configured.\n\nPlease:\n1. Get a Google Maps API key from Google Cloud Console\n2. Enable "Places API"\n3. Add GOOGLE_MAPS_API_KEY to server/.env file\n4. Restart the server\n\nSee SETUP_GOOGLE_MAPS.md for detailed instructions.');
        // Fallback to custom places
        setUseGoogleMaps(false);
        fetchPlaces();
      } else if (error.response?.data?.code === 'REQUEST_DENIED') {
        alert(`Google Maps API Error: ${error.response.data.message}\n\nPlease check:\n- API key is correct\n- Places API is enabled\n- API key restrictions allow this request`);
        setUseGoogleMaps(false);
        fetchPlaces();
      } else if (error.response?.data?.message) {
        alert(`Error: ${error.response.data.message}`);
        // Fallback to custom places
        setUseGoogleMaps(false);
        fetchPlaces();
      } else {
        alert('Error fetching places from Google Maps. Falling back to custom places.');
        setUseGoogleMaps(false);
        fetchPlaces();
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchNearbyPlaces = async (lat, lon) => {
    setLoading(true);
    try {
      const params = {
        latitude: lat,
        longitude: lon,
        maxDistance: 10
      };
      if (type !== 'all') params.type = type;

      const response = await axios.get('/api/places/nearby', { params });
      setPlaces(response.data);
    } catch (error) {
      console.error('Error fetching nearby places:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    if (e.target.name.startsWith('contact.')) {
      const field = e.target.name.split('.')[1];
      setFormData({
        ...formData,
        contact: {
          ...formData.contact,
          [field]: e.target.value
        }
      });
    } else {
      setFormData({
        ...formData,
        [e.target.name]: e.target.value
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post('/api/places', {
        ...formData,
        location: {
          latitude: parseFloat(formData.latitude),
          longitude: parseFloat(formData.longitude),
          address: formData.address
        }
      });
      setShowForm(false);
      setFormData({
        name: '',
        type: 'Tourist Spot',
        description: '',
        address: '',
        latitude: '',
        longitude: '',
        priceRange: '',
        contact: {
          phone: '',
          email: '',
          website: ''
        }
      });
      fetchPlaces();
    } catch (error) {
      console.error('Error creating place:', error);
      alert('Error creating place');
    }
  };

  const getLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setFormData({
            ...formData,
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          });
        },
        (error) => {
          console.error('Error getting location:', error);
          alert('Could not get your location');
        }
      );
    }
  };

  if (loading) {
    return <div className="loading">Loading places...</div>;
  }

  return (
    <div className="container">
      <div className="page-header">
        <h1>Nearby Places</h1>
        <button onClick={() => setShowForm(!showForm)} className="btn btn-primary">
          {showForm ? 'Cancel' : '+ Add Place'}
        </button>
      </div>

      <div className="filter-section">
        <div className="filter-row">
          <label>
            <input
              type="checkbox"
              checked={useGoogleMaps}
              onChange={(e) => {
                setUseGoogleMaps(e.target.checked);
                if (!e.target.checked) {
                  setDestination('');
                }
              }}
            />
            Use Google Maps Recommendations
          </label>
          <label>
            <input
              type="checkbox"
              checked={useLocation}
              onChange={(e) => setUseLocation(e.target.checked)}
              disabled={useGoogleMaps && !destination}
            />
            Use My Location
          </label>
        </div>
        {useGoogleMaps && (
          <div className="form-group" style={{ marginTop: '15px' }}>
            <label>Search Destination (e.g., "Paris", "New York", "Tokyo") *</label>
            <input
              type="text"
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              placeholder="Enter destination name..."
              style={{ width: '100%', padding: '10px', marginTop: '5px' }}
              required
            />
            <small style={{ color: '#666', fontSize: '12px', marginTop: '5px', display: 'block' }}>
              Enter a city or location name to search for places from Google Maps
            </small>
          </div>
        )}
        <select value={type} onChange={(e) => setType(e.target.value)} style={{ marginTop: '15px' }}>
          <option value="all">All Types</option>
          <option value="Lodge">Lodges</option>
          <option value="Restaurant">Restaurants</option>
          <option value="Tourist Spot">Tourist Spots</option>
          <option value="Other">Other</option>
        </select>
        {!useGoogleMaps && (
          <div style={{ marginTop: '15px', padding: '10px', background: '#fff3cd', borderRadius: '5px', fontSize: '14px' }}>
            <strong>Note:</strong> Showing custom places from database. Enable "Google Maps Recommendations" to see real places from Google Maps.
          </div>
        )}
      </div>

      {showForm && (
        <div className="card">
          <h2>Add New Place</h2>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Name *</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
              />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Type *</label>
                <select name="type" value={formData.type} onChange={handleChange} required>
                  <option value="Lodge">Lodge</option>
                  <option value="Restaurant">Restaurant</option>
                  <option value="Tourist Spot">Tourist Spot</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div className="form-group">
                <label>Price Range</label>
                <select name="priceRange" value={formData.priceRange} onChange={handleChange}>
                  <option value="">Select</option>
                  <option value="Budget">Budget</option>
                  <option value="Moderate">Moderate</option>
                  <option value="Expensive">Expensive</option>
                  <option value="Luxury">Luxury</option>
                </select>
              </div>
            </div>
            <div className="form-group">
              <label>Description</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
              />
            </div>
            <div className="form-group">
              <label>Address *</label>
              <input
                type="text"
                name="address"
                value={formData.address}
                onChange={handleChange}
                required
              />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Latitude *</label>
                <input
                  type="number"
                  name="latitude"
                  value={formData.latitude}
                  onChange={handleChange}
                  step="any"
                  required
                />
              </div>
              <div className="form-group">
                <label>Longitude *</label>
                <input
                  type="number"
                  name="longitude"
                  value={formData.longitude}
                  onChange={handleChange}
                  step="any"
                  required
                />
              </div>
            </div>
            <button type="button" onClick={getLocation} className="btn btn-secondary">
              Use My Location
            </button>
            <div className="form-row">
              <div className="form-group">
                <label>Phone</label>
                <input
                  type="tel"
                  name="contact.phone"
                  value={formData.contact.phone}
                  onChange={handleChange}
                />
              </div>
              <div className="form-group">
                <label>Email</label>
                <input
                  type="email"
                  name="contact.email"
                  value={formData.contact.email}
                  onChange={handleChange}
                />
              </div>
            </div>
            <div className="form-group">
              <label>Website</label>
              <input
                type="url"
                name="contact.website"
                value={formData.contact.website}
                onChange={handleChange}
              />
            </div>
            <button type="submit" className="btn btn-primary">Add Place</button>
          </form>
        </div>
      )}

      <div className="places-grid">
        {places.map((place, index) => (
          <div key={place._id || place.googlePlaceId || index} className="place-card">
            {place.isFromGoogle && place.photos && place.photos.length > 0 && (
              <div className="place-image">
                <img src={place.photos[0]} alt={place.name} />
              </div>
            )}
            <div className="place-header">
              <h3>{place.name}</h3>
              <span className="place-type">{place.type}</span>
            </div>
            {place.description && <p className="place-description">{place.description}</p>}
            <div className="place-info">
              <p>📍 {place.location.address}</p>
              {place.distance && <p>📏 {place.distance.toFixed(2)} km away</p>}
              {place.priceLevel && <p>💰 {place.priceLevel}</p>}
              {place.rating > 0 && (
                <div className="place-rating">
                  <span>⭐ {place.rating.toFixed(1)}/5</span>
                  {place.userRatingsTotal > 0 && (
                    <span className="rating-count">({place.userRatingsTotal} reviews)</span>
                  )}
                </div>
              )}
              {place.openingHours !== null && (
                <p className={place.openingHours ? 'open-now' : 'closed-now'}>
                  {place.openingHours ? '🟢 Open Now' : '🔴 Closed Now'}
                </p>
              )}
            </div>
            {place.contact && (place.contact.phone || place.contact.website) && (
              <div className="place-contact">
                {place.contact.phone && <p>📞 {place.contact.phone}</p>}
                {place.contact.website && (
                  <p>
                    <a href={place.contact.website} target="_blank" rel="noopener noreferrer">
                      🌐 Website
                    </a>
                  </p>
                )}
              </div>
            )}
            {place.isFromGoogle && place.googleMapsUrl && (
              <div className="place-actions">
                <a
                  href={place.googleMapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-primary"
                  style={{ textDecoration: 'none', display: 'inline-block' }}
                >
                  View on Google Maps
                </a>
              </div>
            )}
          </div>
        ))}
      </div>

      {places.length === 0 && !showForm && !loading && (
        <div className="empty-state">
          {useGoogleMaps && !destination ? (
            <div>
              <p>Enter a destination name above to search for places from Google Maps.</p>
              <p style={{ marginTop: '10px', fontSize: '14px', color: '#666' }}>
                Or uncheck "Use Google Maps Recommendations" to see custom places from the database.
              </p>
            </div>
          ) : (
            <div>
              <p>No places found.</p>
              {useGoogleMaps && (
                <p style={{ marginTop: '10px', fontSize: '14px', color: '#666' }}>
                  Try a different destination or check if Google Maps API is properly configured.
                </p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default NearbyPlaces;

