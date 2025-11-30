const express = require('express');
const axios = require('axios');
const Place = require('../models/Place');
const auth = require('../middleware/auth');

const router = express.Router();

// @route   POST /api/places
// @desc    Add a new place
// @access  Private
router.post('/', auth, async (req, res) => {
  try {
    const place = new Place({
      ...req.body,
      addedBy: req.user._id
    });

    await place.save();
    res.status(201).json(place);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/places/nearby
// @desc    Find nearby places
// @access  Private
router.get('/nearby', auth, async (req, res) => {
  try {
    const { latitude, longitude, type, maxDistance = 10 } = req.query;

    if (!latitude || !longitude) {
      return res.status(400).json({ message: 'Latitude and longitude are required' });
    }

    const userLat = parseFloat(latitude);
    const userLon = parseFloat(longitude);
    const maxDist = parseFloat(maxDistance);

    const query = {};
    if (type) {
      query.type = type;
    }

    const places = await Place.find(query);

    // Calculate distance and filter
    const nearbyPlaces = places
      .map(place => {
        const distance = calculateDistance(
          userLat,
          userLon,
          place.location.latitude,
          place.location.longitude
        );
        return { ...place.toObject(), distance };
      })
      .filter(place => place.distance <= maxDist)
      .sort((a, b) => a.distance - b.distance);

    res.json(nearbyPlaces);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/places
// @desc    Get all places
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const { type, destination } = req.query;
    const query = {};

    if (type) query.type = type;
    if (destination) {
      query['location.address'] = { $regex: destination, $options: 'i' };
    }

    const places = await Place.find(query)
      .populate('addedBy', 'name email')
      .sort({ createdAt: -1 });

    res.json(places);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/places/google
// @desc    Get places from Google Maps API
// @access  Private
router.get('/google', auth, async (req, res) => {
  try {
    const { destination, type, latitude, longitude } = req.query;
    const apiKey = process.env.GOOGLE_MAPS_API_KEY;

    if (!apiKey || apiKey === 'your_google_maps_api_key_here') {
      return res.status(400).json({ 
        message: 'Google Maps API key not configured. Please add GOOGLE_MAPS_API_KEY to your server/.env file.',
        code: 'API_KEY_MISSING'
      });
    }

    if (!destination && !latitude) {
      return res.status(400).json({ message: 'Destination or location is required' });
    }

    let query = '';
    let location = null;

    // Map our types to Google Places types
    const typeMapping = {
      'Lodge': 'lodging',
      'Restaurant': 'restaurant',
      'Tourist Spot': 'tourist_attraction',
      'Other': 'point_of_interest'
    };

    const googleType = typeMapping[type] || 'point_of_interest';

    if (destination) {
      // Text search by destination
      if (type === 'Restaurant') {
        query = `restaurants in ${destination}`;
      } else if (type === 'Lodge') {
        query = `hotels in ${destination}`;
      } else if (type === 'Tourist Spot') {
        query = `tourist attractions in ${destination}`;
      } else {
        query = `places in ${destination}`;
      }
    }

    let url = '';
    if (latitude && longitude) {
      // Nearby search using coordinates
      location = `${latitude},${longitude}`;
      url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${location}&radius=5000&type=${googleType}&key=${apiKey}`;
    } else if (destination) {
      // Text search
      url = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(query)}&key=${apiKey}`;
    } else {
      return res.status(400).json({ message: 'Destination or location coordinates are required' });
    }

    const response = await axios.get(url);
    
    if (response.data.status === 'OK') {
      const places = response.data.results.map(place => ({
        googlePlaceId: place.place_id,
        name: place.name,
        type: type || 'Other',
        description: place.formatted_address || place.vicinity,
        location: {
          address: place.formatted_address || place.vicinity,
          latitude: place.geometry.location.lat,
          longitude: place.geometry.location.lng
        },
        rating: place.rating || 0,
        userRatingsTotal: place.user_ratings_total || 0,
        priceLevel: place.price_level ? ['Budget', 'Moderate', 'Expensive', 'Luxury'][place.price_level - 1] : null,
        photos: place.photos ? place.photos.slice(0, 3).map(photo => 
          `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photoreference=${photo.photo_reference}&key=${apiKey}`
        ) : [],
        openingHours: place.opening_hours ? place.opening_hours.open_now : null,
        contact: {
          phone: place.formatted_phone_number || null,
          website: place.website || null
        },
        googleMapsUrl: `https://www.google.com/maps/place/?q=place_id:${place.place_id}`,
        isFromGoogle: true
      }));

      res.json(places);
    } else if (response.data.status === 'ZERO_RESULTS') {
      res.json([]);
    } else if (response.data.status === 'REQUEST_DENIED') {
      return res.status(400).json({ 
        message: 'Google Maps API request denied. Please check your API key and ensure Places API is enabled.',
        code: 'REQUEST_DENIED',
        error: response.data.error_message || 'Invalid API key or API not enabled'
      });
    } else if (response.data.status === 'INVALID_REQUEST') {
      return res.status(400).json({ 
        message: 'Invalid request to Google Maps API. Please check your search parameters.',
        code: 'INVALID_REQUEST'
      });
    } else {
      return res.status(400).json({ 
        message: `Error fetching places from Google Maps: ${response.data.status}`,
        code: response.data.status,
        error: response.data.error_message || 'Unknown error'
      });
    }
  } catch (error) {
    console.error('Google Places API error:', error);
    if (error.response) {
      return res.status(500).json({ 
        message: 'Error fetching places from Google Maps',
        error: error.response.data?.error_message || error.message,
        code: 'API_ERROR'
      });
    }
    res.status(500).json({ 
      message: 'Error fetching places from Google Maps',
      error: error.message,
      code: 'NETWORK_ERROR'
    });
  }
});

// @route   GET /api/places/:id
// @desc    Get place by ID
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    const place = await Place.findById(req.params.id)
      .populate('addedBy', 'name email');

    if (!place) {
      return res.status(404).json({ message: 'Place not found' });
    }

    res.json(place);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Helper function to calculate distance
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Radius of the Earth in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

module.exports = router;

