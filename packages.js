const express = require('express');
const Package = require('../models/Package');
const auth = require('../middleware/auth');

const router = express.Router();

// @route   POST /api/packages
// @desc    Create a new package
// @access  Private
router.post('/', auth, async (req, res) => {
  try {
    const travelPackage = new Package({
      ...req.body,
      userId: req.user._id,
      participants: [req.user._id]
    });

    await travelPackage.save();
    await travelPackage.populate('userId', 'name email profilePicture');
    await travelPackage.populate('participants', 'name email profilePicture');
    res.status(201).json(travelPackage);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/packages
// @desc    Get all packages
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const { destination, userId, isActive, participantId } = req.query;
    const query = {};

    if (destination) query.destination = { $regex: destination, $options: 'i' };
    if (userId) query.userId = userId;
    if (participantId) query.participants = participantId;
    if (isActive !== undefined) query.isActive = isActive === 'true';

    const packages = await Package.find(query)
      .populate('userId', 'name email profilePicture')
      .populate('participants', 'name email profilePicture')
      .sort({ createdAt: -1 });

    res.json(packages);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/packages/:id
// @desc    Get package by ID
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    const travelPackage = await Package.findById(req.params.id)
      .populate('userId', 'name email profilePicture')
      .populate('participants', 'name email profilePicture');

    if (!travelPackage) {
      return res.status(404).json({ message: 'Package not found' });
    }

    res.json(travelPackage);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/packages/:id
// @desc    Update package
// @access  Private
router.put('/:id', auth, async (req, res) => {
  try {
    const travelPackage = await Package.findById(req.params.id);

    if (!travelPackage) {
      return res.status(404).json({ message: 'Package not found' });
    }

    if (travelPackage.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    Object.assign(travelPackage, req.body);
    await travelPackage.save();
    await travelPackage.populate('userId', 'name email profilePicture');
    await travelPackage.populate('participants', 'name email profilePicture');

    res.json(travelPackage);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/packages/:id
// @desc    Delete package
// @access  Private
router.delete('/:id', auth, async (req, res) => {
  try {
    const travelPackage = await Package.findById(req.params.id);

    if (!travelPackage) {
      return res.status(404).json({ message: 'Package not found' });
    }

    if (travelPackage.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    await travelPackage.deleteOne();
    res.json({ message: 'Package deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/:id/join', auth, async (req, res) => {
  try {
    const pkg = await Package.findById(req.params.id);

    if (!pkg) {
      return res.status(404).json({ message: 'Package not found' });
    }

    if (!Array.isArray(pkg.participants)) {
      pkg.participants = [];
    }

    const userId = req.user._id.toString();
    if (pkg.participants.some((participant) => participant.toString() === userId)) {
      return res.status(400).json({ message: 'You are already part of this package.' });
    }

    pkg.participants.push(req.user._id);
    await pkg.save();
    await pkg.populate('userId', 'name email profilePicture');
    await pkg.populate('participants', 'name email profilePicture');

    res.json(pkg);
  } catch (error) {
    console.error('Error joining package:', error);
    res.status(500).json({ message: 'Unable to join package right now.' });
  }
});

router.delete('/:id/join', auth, async (req, res) => {
  try {
    const pkg = await Package.findById(req.params.id);

    if (!pkg) {
      return res.status(404).json({ message: 'Package not found' });
    }

    if (!Array.isArray(pkg.participants)) {
      pkg.participants = [];
    }

    const userId = req.user._id.toString();
    if (pkg.userId.toString() === userId) {
      return res.status(400).json({ message: 'Creators cannot leave their own package.' });
    }

    const updatedParticipants = pkg.participants.filter(
      (participant) => participant.toString() !== userId
    );

    if (updatedParticipants.length === pkg.participants.length) {
      return res.status(400).json({ message: 'You are not part of this package.' });
    }

    pkg.participants = updatedParticipants;
    await pkg.save();
    await pkg.populate('userId', 'name email profilePicture');
    await pkg.populate('participants', 'name email profilePicture');

    res.json(pkg);
  } catch (error) {
    console.error('Error leaving package:', error);
    res.status(500).json({ message: 'Unable to leave package right now.' });
  }
});

module.exports = router;

