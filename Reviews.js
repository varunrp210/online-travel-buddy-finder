import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './Reviews.css';
import { buildMediaUrl as mediaUrl } from '../../utils/network';

const normalizePhotos = (review) => {
  if (Array.isArray(review.photos) && review.photos.length > 0) {
    return review.photos;
  }
  if (review.photoUrl) {
    return [review.photoUrl];
  }
  return [];
};

const ReviewCarousel = ({ photos }) => {
  const [index, setIndex] = useState(0);
  if (!photos || photos.length === 0) return null;

  const prev = () => {
    setIndex((prevIndex) => (prevIndex - 1 + photos.length) % photos.length);
  };

  const next = () => {
    setIndex((prevIndex) => (prevIndex + 1) % photos.length);
  };

  return (
    <div className="review-carousel">
      <img src={mediaUrl(photos[index])} alt="Trip upload" />
      {photos.length > 1 && (
        <div className="carousel-controls">
          <button type="button" onClick={prev} aria-label="Previous photo">‹</button>
          <span>{index + 1}/{photos.length}</span>
          <button type="button" onClick={next} aria-label="Next photo">›</button>
        </div>
      )}
    </div>
  );
};

const Reviews = () => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [photoError, setPhotoError] = useState('');
  const [formData, setFormData] = useState({
    rating: '5',
    comment: ''
  });
  const [photos, setPhotos] = useState([]);
  const [fileInputKey, setFileInputKey] = useState(0);

  const fetchReviews = async () => {
    try {
      const response = await axios.get('/api/reviews');
      setReviews(response.data);
    } catch (err) {
      console.error('Error fetching reviews', err);
      setError('Unable to load reviews right now.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      const payload = new FormData();
      payload.append('rating', formData.rating);
      payload.append('comment', formData.comment);
      photos.forEach((file) => payload.append('photos', file));

      await axios.post('/api/reviews', payload, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      setFormData({ rating: '5', comment: '' });
      setPhotos([]);
      setPhotoError('');
      setFileInputKey((prev) => prev + 1);
      fetchReviews();
    } catch (err) {
      console.error('Error submitting review', err);
      setError(err.response?.data?.message || 'Unable to post review.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="container">
      <div className="reviews-page">
        <div className="page-header">
          <div>
            <h1>Community Reviews</h1>
            <p>Share your experience, upload snaps, and inspire fellow explorers.</p>
          </div>
        </div>

        <div className="card review-form-card">
          <h2>Post a new review</h2>
          <p className="muted">
            Reviews (with photos) appear on the public landing page, so keep it positive and real.
          </p>
          {error && <div className="error">{error}</div>}
          <form onSubmit={handleSubmit} className="review-form">
            <div className="form-group">
              <label>Rating</label>
              <select
                name="rating"
                value={formData.rating}
                onChange={(e) => setFormData({ ...formData, rating: e.target.value })}
              >
                {[5, 4, 3, 2, 1].map((value) => (
                  <option key={value} value={value}>{value} Stars</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>What made this trip memorable?</label>
              <textarea
                name="comment"
                value={formData.comment}
                onChange={(e) => setFormData({ ...formData, comment: e.target.value })}
                placeholder="Talk about your route, company, and highlights..."
                required
              />
            </div>
            <div className="form-group">
              <label>Upload a photo (optional)</label>
              <input
                key={fileInputKey}
                type="file"
                accept="image/*"
                multiple
                onChange={(e) => {
                  const selected = Array.from(e.target.files || []);
                  if (selected.length > 5) {
                    setPhotoError('You can upload up to 5 photos per review.');
                    setPhotos(selected.slice(0, 5));
                  } else {
                    setPhotoError('');
                    setPhotos(selected);
                  }
                }}
              />
              <small className="muted">Attach up to 5 photos • Max 4 MB each.</small>
              {photos.length > 0 && (
                <small className="muted">{photos.length} selected</small>
              )}
              {photoError && <div className="error">{photoError}</div>}
            </div>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? 'Sharing...' : 'Share Review'}
            </button>
          </form>
        </div>

        <div className="card">
          <div className="review-list-header">
            <h2>Latest uploads</h2>
            <span>{reviews.length} review(s)</span>
          </div>

          {loading && <div className="loading">Loading reviews...</div>}

          {!loading && reviews.length === 0 && (
            <div className="empty-state">
              No reviews yet. Be the first to post a memory!
            </div>
          )}

          <div className="review-list">
            {reviews.map((review) => (
              <article key={review._id} className="review-tile">
                <div className="tile-head">
                  <div>
                    <h3>{review.user?.name || 'Explorer'}</h3>
                    <p>{review.user?.university || 'Independent traveler'}</p>
                  </div>
                  <div className="rating">
                    {Array.from({ length: 5 }).map((_, idx) => (
                      <span key={idx} className={idx < review.rating ? 'filled' : ''}>★</span>
                    ))}
                  </div>
                </div>
                <p>{review.comment}</p>
                <ReviewCarousel photos={normalizePhotos(review)} />
                <small className="muted">
                  {new Date(review.createdAt).toLocaleString('en-IN', {
                    dateStyle: 'medium'
                  })}
                </small>
              </article>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Reviews;


