const express = require('express');
const User = require('../models/User');
const Review = require('../models/Review');

const router = express.Router();

router.get('/highlights', async (_, res) => {
  try {
    const [userCount, reviewDocs] = await Promise.all([
      User.countDocuments(),
      Review.find()
        .populate('user', 'name university profilePicture')
        .sort({ createdAt: -1 })
        .limit(12)
    ]);

    const resolvePhotos = (review) => {
      if (review.photos && review.photos.length > 0) {
        return review.photos;
      }
      if (review.photoUrl) {
        return [review.photoUrl];
      }
      return [];
    };

    const reviews = reviewDocs.slice(0, 6).map((review) => ({
      id: review._id,
      rating: review.rating,
      comment: review.comment,
      createdAt: review.createdAt,
      user: {
        name: review.user?.name || 'Explorer',
        university: review.user?.university || '',
        profilePicture: review.user?.profilePicture || ''
      },
      photos: resolvePhotos(review)
    }));

    const featuredPhotos = [];
    reviewDocs.forEach((review) => {
      resolvePhotos(review).forEach((photo, index) => {
        if (featuredPhotos.length < 10) {
          featuredPhotos.push({
            id: `${review._id}-${index}`,
            photoUrl: photo,
            caption: review.comment?.slice(0, 80) || '',
            user: review.user?.name || 'Explorer'
          });
        }
      });
    });

    res.json({
      userCount,
      featuredPhotos,
      reviews
    });
  } catch (error) {
    console.error('Error fetching highlights:', error);
    res.status(500).json({ message: 'Unable to fetch public highlights.' });
  }
});

module.exports = router;


