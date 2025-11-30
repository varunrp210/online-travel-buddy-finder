const express = require('express');
const Chat = require('../models/Chat');
const auth = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/chat
// @desc    Get all chats for user
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const chats = await Chat.find({
      participants: req.user._id
    })
      .populate('participants', 'name email profilePicture isOnline')
      .sort({ lastMessageTime: -1 });

    res.json(chats);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/chat/:userId
// @desc    Get or create chat with specific user
// @access  Private
router.get('/:userId', auth, async (req, res) => {
  try {
    const { userId } = req.params;

    let chat = await Chat.findOne({
      participants: { $all: [req.user._id, userId] }
    }).populate('participants', 'name email profilePicture isOnline');

    if (!chat) {
      chat = new Chat({
        participants: [req.user._id, userId],
        messages: []
      });
      await chat.save();
      await chat.populate('participants', 'name email profilePicture isOnline');
    }

    res.json(chat);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/chat/:chatId/message
// @desc    Send a message
// @access  Private
router.post('/:chatId/message', auth, async (req, res) => {
  try {
    const { chatId } = req.params;
    const { message } = req.body;

    const chat = await Chat.findById(chatId);

    if (!chat) {
      return res.status(404).json({ message: 'Chat not found' });
    }

    // Check if user is a participant
    const isParticipant = chat.participants.some(
      p => p.toString() === req.user._id.toString()
    );
    if (!isParticipant) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    chat.messages.push({
      sender: req.user._id,
      message,
      timestamp: new Date()
    });

    chat.lastMessage = message;
    chat.lastMessageTime = new Date();

    await chat.save();
    
    // Populate participants and messages
    await chat.populate('participants', 'name email profilePicture isOnline');
    await chat.populate('messages.sender', 'name email profilePicture');

    // Emit socket event for real-time updates
    const io = req.app.get('io');
    if (io) {
      io.to(chat._id.toString()).emit('receive-message', {
        roomId: chat._id.toString(),
        sender: req.user._id.toString(),
        senderName: req.user.name,
        message: message,
        timestamp: new Date()
      });
    }

    res.json(chat);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;

