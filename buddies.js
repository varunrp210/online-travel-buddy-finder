const express = require('express');
const BuddyRequest = require('../models/BuddyRequest');
const Plan = require('../models/Plan');
const User = require('../models/User');
const auth = require('../middleware/auth');

const router = express.Router();

// @route   POST /api/buddies/request
// @desc    Send buddy request
// @access  Private
router.post('/request', auth, async (req, res) => {
  try {
    const { toUser, planId, message } = req.body;

    if (toUser === req.user._id.toString()) {
      return res.status(400).json({ message: 'Cannot send request to yourself' });
    }

    const existingRequest = await BuddyRequest.findOne({
      fromUser: req.user._id,
      toUser,
      planId: planId || null
    });

    if (existingRequest) {
      return res.status(400).json({ message: 'Request already sent' });
    }

    const buddyRequest = new BuddyRequest({
      fromUser: req.user._id,
      toUser,
      planId,
      message
    });

    await buddyRequest.save();
    await buddyRequest.populate('fromUser', 'name email profilePicture');
    await buddyRequest.populate('toUser', 'name email profilePicture');
    if (planId) {
      await buddyRequest.populate('planId', 'title destination');
    }

    res.status(201).json(buddyRequest);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/buddies/requests
// @desc    Get buddy requests
// @access  Private
router.get('/requests', auth, async (req, res) => {
  try {
    const { type } = req.query; // 'sent' or 'received'

    let query = {};
    if (type === 'sent') {
      query.fromUser = req.user._id;
    } else if (type === 'received') {
      query.toUser = req.user._id;
    } else {
      query.$or = [
        { fromUser: req.user._id },
        { toUser: req.user._id }
      ];
    }

    const requests = await BuddyRequest.find(query)
      .populate('fromUser', 'name email profilePicture')
      .populate('toUser', 'name email profilePicture')
      .populate('planId', 'title destination startDate endDate')
      .sort({ createdAt: -1 });

    res.json(requests);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/buddies/requests/:id
// @desc    Accept/Reject buddy request
// @access  Private
router.put('/requests/:id', auth, async (req, res) => {
  try {
    const { status } = req.body;
    const request = await BuddyRequest.findById(req.params.id);

    if (!request) {
      return res.status(404).json({ message: 'Request not found' });
    }

    if (request.toUser.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    if (status === 'Accepted') {
      request.status = 'Accepted';
      
      // If there's a plan, add user to plan
      if (request.planId) {
        const plan = await Plan.findById(request.planId);
        if (plan && plan.currentBuddies.length < plan.maxBuddies) {
          if (!plan.currentBuddies.includes(request.fromUser)) {
            plan.currentBuddies.push(request.fromUser);
            await plan.save();
          }
        }
      }
    } else if (status === 'Rejected') {
      request.status = 'Rejected';
    }

    await request.save();
    await request.populate('fromUser', 'name email profilePicture');
    await request.populate('toUser', 'name email profilePicture');
    if (request.planId) {
      await request.populate('planId', 'title destination');
    }

    res.json(request);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/buddies/nearby
// @desc    Find nearby buddies
// @access  Private
router.get('/nearby', auth, async (req, res) => {
  try {
    const { latitude, longitude, maxDistance = 50 } = req.query; // maxDistance in km

    if (!latitude || !longitude) {
      return res.status(400).json({ message: 'Latitude and longitude are required' });
    }

    const userLat = parseFloat(latitude);
    const userLon = parseFloat(longitude);
    const maxDist = parseFloat(maxDistance);

    // Find users with location data
    const users = await User.find({
      _id: { $ne: req.user._id },
      'location.latitude': { $exists: true },
      'location.longitude': { $exists: true }
    }).select('-password');

    // Calculate distance and filter
    const nearbyUsers = users
      .map(user => {
        const distance = calculateDistance(
          userLat,
          userLon,
          user.location.latitude,
          user.location.longitude
        );
        return { ...user.toObject(), distance };
      })
      .filter(user => user.distance <= maxDist)
      .sort((a, b) => a.distance - b.distance)
      .slice(0, 20);

    res.json(nearbyUsers);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Helper function to calculate distance between two coordinates (Haversine formula)
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

