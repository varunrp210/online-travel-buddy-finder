const express = require('express');
const Plan = require('../models/Plan');
const auth = require('../middleware/auth');

const router = express.Router();

// @route   POST /api/plans
// @desc    Create a new plan
// @access  Private
router.post('/', auth, async (req, res) => {
  try {
    const plan = new Plan({
      ...req.body,
      userId: req.user._id,
      currentBuddies: [req.user._id]
    });

    await plan.save();
    await plan.populate('userId', 'name email profilePicture');
    await plan.populate('currentBuddies', 'name email profilePicture');
    res.status(201).json(plan);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/plans
// @desc    Get all plans
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const { status, destination, userId, participantId } = req.query;
    const query = {};

    if (status) query.status = status;
    if (destination) query.destination = { $regex: destination, $options: 'i' };
    if (userId) query.userId = userId;
    if (participantId) query.currentBuddies = participantId;

    const plans = await Plan.find(query)
      .populate('userId', 'name email profilePicture')
      .populate('currentBuddies', 'name email profilePicture')
      .sort({ createdAt: -1 });

    res.json(plans);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/plans/:id
// @desc    Get plan by ID
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    const plan = await Plan.findById(req.params.id)
      .populate('userId', 'name email profilePicture bio')
      .populate('currentBuddies', 'name email profilePicture');

    if (!plan) {
      return res.status(404).json({ message: 'Plan not found' });
    }

    res.json(plan);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/plans/:id
// @desc    Update plan
// @access  Private
router.put('/:id', auth, async (req, res) => {
  try {
    const plan = await Plan.findById(req.params.id);

    if (!plan) {
      return res.status(404).json({ message: 'Plan not found' });
    }

    if (plan.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    Object.assign(plan, req.body);
    await plan.save();
    await plan.populate('userId', 'name email profilePicture');
    await plan.populate('currentBuddies', 'name email profilePicture');

    res.json(plan);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/plans/:id
// @desc    Delete plan
// @access  Private
router.delete('/:id', auth, async (req, res) => {
  try {
    const plan = await Plan.findById(req.params.id);

    if (!plan) {
      return res.status(404).json({ message: 'Plan not found' });
    }

    if (plan.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    await plan.deleteOne();
    res.json({ message: 'Plan deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/:id/join', auth, async (req, res) => {
  try {
    const plan = await Plan.findById(req.params.id)
      .populate('userId', 'name email profilePicture')
      .populate('currentBuddies', 'name email profilePicture');

    if (!plan) {
      return res.status(404).json({ message: 'Plan not found' });
    }

    const userId = req.user._id.toString();
    if (plan.userId._id.toString() === userId) {
      return res.status(400).json({ message: 'You created this plan.' });
    }

    if (!Array.isArray(plan.currentBuddies)) {
      plan.currentBuddies = [];
    }

    if (plan.currentBuddies.some(buddy => buddy._id.toString() === userId)) {
      return res.status(400).json({ message: 'You already joined this plan.' });
    }

    if (plan.currentBuddies.length >= plan.maxBuddies) {
      return res.status(400).json({ message: 'Plan is full.' });
    }

    plan.currentBuddies.push(req.user._id);
    await plan.save();
    await plan.populate('currentBuddies', 'name email profilePicture');

    res.json(plan);
  } catch (error) {
    console.error('Error joining plan:', error);
    res.status(500).json({ message: 'Unable to join plan right now.' });
  }
});

router.delete('/:id/join', auth, async (req, res) => {
  try {
    const plan = await Plan.findById(req.params.id)
      .populate('userId', 'name email profilePicture')
      .populate('currentBuddies', 'name email profilePicture');

    if (!plan) {
      return res.status(404).json({ message: 'Plan not found' });
    }

    const userId = req.user._id.toString();
    if (plan.userId._id.toString() === userId) {
      return res.status(400).json({ message: 'Creators cannot leave their own plan.' });
    }

    if (!Array.isArray(plan.currentBuddies)) {
      plan.currentBuddies = [];
    }

    const updated = plan.currentBuddies.filter(buddy => buddy._id.toString() !== userId);

    if (updated.length === plan.currentBuddies.length) {
      return res.status(400).json({ message: 'You are not part of this plan.' });
    }

    plan.currentBuddies = updated;
    await plan.save();
    await plan.populate('currentBuddies', 'name email profilePicture');

    res.json(plan);
  } catch (error) {
    console.error('Error leaving plan:', error);
    res.status(500).json({ message: 'Unable to leave plan right now.' });
  }
});

module.exports = router;

