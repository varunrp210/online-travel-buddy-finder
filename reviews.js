const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Review = require('../models/Review');
const auth = require('../middleware/auth');

const router = express.Router();

const uploadsRoot = path.join(__dirname, '..', 'uploads');
const reviewUploadsDir = path.join(uploadsRoot, 'reviews');
fs.mkdirSync(reviewUploadsDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_, __, cb) => {
    cb(null, reviewUploadsDir);
  },
  filename: (_, file, cb) => {
    const ext = path.extname(file.originalname) || '.jpg';
    const safeName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
    cb(null, safeName);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 4 * 1024 * 1024 },
  fileFilter: (_, file, cb) => {
    if (file.mimetype && file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image uploads are allowed.'));
    }
  }
});

const uploadFields = upload.fields([
  { name: 'photos', maxCount: 5 },
  { name: 'photo', maxCount: 1 }
]);

router.get('/', auth, async (req, res) => {
  try {
    const reviews = await Review.find()
      .populate('user', 'name university profilePicture')
      .sort({ createdAt: -1 });
    res.json(reviews);
  } catch (error) {
    console.error('Error fetching reviews:', error);
    res.status(500).json({ message: 'Unable to fetch reviews.' });
  }
});

router.get('/me', auth, async (req, res) => {
  try {
    const reviews = await Review.find({ user: req.user._id })
      .sort({ createdAt: -1 });
    res.json(reviews);
  } catch (error) {
    console.error('Error fetching user reviews:', error);
    res.status(500).json({ message: 'Unable to fetch your reviews.' });
  }
});

router.post('/', auth, uploadFields, async (req, res) => {
  try {
    const { rating, comment } = req.body;

    if (!rating || !comment) {
      return res.status(400).json({ message: 'Rating and comment are required.' });
    }

    const numericRating = Number(rating);
    if (Number.isNaN(numericRating) || numericRating < 1 || numericRating > 5) {
      return res.status(400).json({ message: 'Rating must be between 1 and 5.' });
    }

    const photoFiles = [
      ...(req.files?.photos || []),
      ...(req.files?.photo || [])
    ]
      .slice(0, 5);

    const photos = photoFiles.map(file => `/uploads/reviews/${file.filename}`);
    const photoUrl = photos[0] || '';

    const review = new Review({
      user: req.user._id,
      rating: numericRating,
      comment,
      photoUrl,
      photos
    });

    await review.save();
    await review.populate('user', 'name university profilePicture');

    res.status(201).json(review);
  } catch (error) {
    console.error('Error creating review:', error);
    res.status(500).json({ message: error.message || 'Unable to save review.' });
  }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    const review = await Review.findOne({ _id: req.params.id, user: req.user._id });

    if (!review) {
      return res.status(404).json({ message: 'Review not found.' });
    }

    const removeFiles = (paths = []) => {
      paths.forEach((filePath) => {
        if (!filePath) return;
        const relativePath = filePath.replace(/^\//, '');
        const absolutePath = path.join(__dirname, '..', relativePath);
        fs.unlink(absolutePath, () => {});
      });
    };

    if (Array.isArray(review.photos) && review.photos.length > 0) {
      removeFiles(review.photos);
    } else if (review.photoUrl) {
      removeFiles([review.photoUrl]);
    }

    await Review.deleteOne({ _id: review._id });
    res.json({ message: 'Review deleted successfully.' });
  } catch (error) {
    console.error('Error deleting review:', error);
    res.status(500).json({ message: 'Unable to delete review.' });
  }
});

module.exports = router;


