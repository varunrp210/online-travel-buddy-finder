const express = require('express');
const User = require('../models/User');
const Plan = require('../models/Plan');
const Package = require('../models/Package');
const BuddyRequest = require('../models/BuddyRequest');
const Chat = require('../models/Chat');
const Place = require('../models/Place');
const auth = require('../middleware/auth');
const { admin, owner } = require('../middleware/admin');

const router = express.Router();

// All admin routes require authentication and admin role
router.use(auth);
router.use(admin);

// @route   GET /api/admin/stats
// @desc    Get overall statistics
// @access  Private (Admin/Owner)
router.get('/stats', async (req, res) => {
  try {
    const [
      totalUsers,
      totalPlans,
      totalPackages,
      totalRequests,
      totalChats,
      totalPlaces,
      activeUsers,
      recentUsers
    ] = await Promise.all([
      User.countDocuments(),
      Plan.countDocuments(),
      Package.countDocuments(),
      BuddyRequest.countDocuments(),
      Chat.countDocuments(),
      Place.countDocuments(),
      User.countDocuments({ isOnline: true }),
      User.find().sort({ createdAt: -1 }).limit(10).select('name email role createdAt')
    ]);

    res.json({
      totalUsers,
      totalPlans,
      totalPackages,
      totalRequests,
      totalChats,
      totalPlaces,
      activeUsers,
      recentUsers
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/admin/users
// @desc    Get all users
// @access  Private (Admin/Owner)
router.get('/users', async (req, res) => {
  try {
    const { page = 1, limit = 20, search = '' } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const query = {};
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    const users = await User.find(query)
      .select('-password')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await User.countDocuments(query);

    res.json({
      users,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / parseInt(limit))
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/admin/users/:id
// @desc    Get user by ID
// @access  Private (Admin/Owner)
router.get('/users/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/admin/users/:id
// @desc    Update user (admin can update any user)
// @access  Private (Admin/Owner)
router.put('/users/:id', async (req, res) => {
  try {
    const { role, ...updates } = req.body;
    
    // Only owner can change roles
    if (role && req.user.role !== 'owner') {
      return res.status(403).json({ message: 'Only owner can change user roles' });
    }

    // Prevent changing owner role
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.role === 'owner' && role !== 'owner' && req.user._id.toString() !== user._id.toString()) {
      return res.status(403).json({ message: 'Cannot change owner role' });
    }

    // Prevent creating multiple owners
    if (role === 'owner') {
      const existingOwner = await User.findOne({ role: 'owner', _id: { $ne: req.params.id } });
      if (existingOwner) {
        return res.status(400).json({ message: 'Only one owner is allowed' });
      }
    }

    const updateData = { ...updates };
    if (role && req.user.role === 'owner') {
      updateData.role = role;
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      { $set: updateData },
      { new: true, runValidators: true }
    ).select('-password');

    res.json(updatedUser);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/admin/users/:id
// @desc    Delete user
// @access  Private (Owner only)
router.delete('/users/:id', owner, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Prevent deleting owner
    if (user.role === 'owner') {
      return res.status(403).json({ message: 'Cannot delete owner account' });
    }

    // Delete user's related data
    await Promise.all([
      Plan.deleteMany({ userId: req.params.id }),
      Package.deleteMany({ userId: req.params.id }),
      BuddyRequest.deleteMany({ $or: [{ fromUser: req.params.id }, { toUser: req.params.id }] }),
      Chat.deleteMany({ participants: req.params.id }),
      Place.deleteMany({ addedBy: req.params.id })
    ]);

    await User.findByIdAndDelete(req.params.id);

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/admin/plans
// @desc    Get all plans
// @access  Private (Admin/Owner)
router.get('/plans', async (req, res) => {
  try {
    const plans = await Plan.find()
      .populate('userId', 'name email')
      .populate('currentBuddies', 'name email')
      .sort({ createdAt: -1 });

    res.json(plans);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/admin/packages
// @desc    Get all packages
// @access  Private (Admin/Owner)
router.get('/packages', async (req, res) => {
  try {
    const packages = await Package.find()
      .populate('userId', 'name email')
      .sort({ createdAt: -1 });

    res.json(packages);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/admin/requests
// @desc    Get all buddy requests
// @access  Private (Admin/Owner)
router.get('/requests', async (req, res) => {
  try {
    const requests = await BuddyRequest.find()
      .populate('fromUser', 'name email')
      .populate('toUser', 'name email')
      .populate('planId', 'title destination')
      .sort({ createdAt: -1 });

    res.json(requests);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/admin/chats
// @desc    Get all chats
// @access  Private (Admin/Owner)
router.get('/chats', async (req, res) => {
  try {
    const chats = await Chat.find()
      .populate('participants', 'name email')
      .sort({ lastMessageTime: -1 });

    res.json(chats);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/admin/places
// @desc    Get all places
// @access  Private (Admin/Owner)
router.get('/places', async (req, res) => {
  try {
    const places = await Place.find()
      .populate('addedBy', 'name email')
      .sort({ createdAt: -1 });

    res.json(places);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/admin/plans/:id
// @desc    Delete any plan
// @access  Private (Admin/Owner)
router.delete('/plans/:id', async (req, res) => {
  try {
    await Plan.findByIdAndDelete(req.params.id);
    res.json({ message: 'Plan deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/admin/packages/:id
// @desc    Delete any package
// @access  Private (Admin/Owner)
router.delete('/packages/:id', async (req, res) => {
  try {
    await Package.findByIdAndDelete(req.params.id);
    res.json({ message: 'Package deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/admin/places/:id
// @desc    Delete any place
// @access  Private (Admin/Owner)
router.delete('/places/:id', async (req, res) => {
  try {
    await Place.findByIdAndDelete(req.params.id);
    res.json({ message: 'Place deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;

