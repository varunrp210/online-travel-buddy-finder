import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import './Landing.css';
import { buildMediaUrl } from '../../utils/network';

const getReviewPhotos = (review) => {
  if (Array.isArray(review.photos) && review.photos.length > 0) {
    return review.photos;
  }
  if (review.photoUrl) {
    return [review.photoUrl];
  }
  return [];
};

const MiniCarousel = ({ photos }) => {
  const [index, setIndex] = useState(0);

  if (!photos || photos.length === 0) return null;

  const prev = () => setIndex((current) => (current - 1 + photos.length) % photos.length);
  const next = () => setIndex((current) => (current + 1) % photos.length);

  return (
    <div className="mini-carousel">
      <img src={buildMediaUrl(photos[index])} alt="Review upload" />
      {photos.length > 1 && (
        <div className="mini-carousel-controls">
          <button onClick={prev} aria-label="Previous photo">‹</button>
          <span>{index + 1}/{photos.length}</span>
          <button onClick={next} aria-label="Next photo">›</button>
        </div>
      )}
    </div>
  );
};

const Landing = () => {
  const [highlights, setHighlights] = useState({
    userCount: 0,
    featuredPhotos: [],
    reviews: []
  });
  const [activeSlide, setActiveSlide] = useState(0);

  const fetchHighlights = async () => {
    try {
      const response = await axios.get('/api/public/highlights');
      setHighlights(response.data);
    } catch (error) {
      console.error('Error loading highlights:', error);
    }
  };

  useEffect(() => {
    fetchHighlights();
    const refreshInterval = setInterval(fetchHighlights, 45000);
    return () => clearInterval(refreshInterval);
  }, []);

  useEffect(() => {
    if (!highlights.featuredPhotos.length) {
      setActiveSlide(0);
      return;
    }
    setActiveSlide((prev) => prev % highlights.featuredPhotos.length);
  }, [highlights.featuredPhotos.length]);

  useEffect(() => {
    if (!highlights.featuredPhotos.length) {
      return undefined;
    }

    const slideInterval = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % highlights.featuredPhotos.length);
    }, 4000);

    return () => clearInterval(slideInterval);
  }, [highlights.featuredPhotos]);

  const activePhoto = useMemo(() => {
    if (!highlights.featuredPhotos.length) {
      return null;
    }
    return highlights.featuredPhotos[activeSlide];
  }, [activeSlide, highlights.featuredPhotos]);

  return (
    <div className="landing-page">
      <header className="landing-nav">
        <div className="logo-stack">
          <div className="logo-circle">TB</div>
          <div>
            <p className="logo-subtitle">Travel Buddy Finder</p>
            <h1>Travel Buddy</h1>
          </div>
        </div>
        <div className="nav-actions">
          <span className="live-count">
            {highlights.userCount.toLocaleString('en-IN')} explorers online
          </span>
          <Link to="/login" className="btn ghost">Login</Link>
          <Link to="/signup" className="btn solid">Join Now</Link>
        </div>
      </header>

      <section className="hero-section">
        <div className="hero-content">
          <p className="hero-tag">Find your next adventure squad</p>
          <h2>Plan trips with trusted students across India</h2>
          <p className="hero-copy">
            Match with explorers nearby, split itineraries, share memories, and keep your parents at
            ease—all from a single dashboard designed for students on the move.
          </p>
          <div className="hero-cta">
            <Link to="/signup" className="btn solid">Get Started</Link>
            <Link to="/login" className="btn ghost">Explore Dashboard</Link>
          </div>
          <div className="hero-stats">
            <div>
              <strong>{highlights.userCount.toLocaleString('en-IN')}</strong>
              <span>registered travelers</span>
            </div>
            <div>
              <strong>{highlights.reviews.length}</strong>
              <span>fresh reviews</span>
            </div>
            <div>
              <strong>{highlights.featuredPhotos.length}</strong>
              <span>live photo stories</span>
            </div>
          </div>
        </div>

        <div className="hero-slider">
          {activePhoto ? (
            <>
              <img src={buildMediaUrl(activePhoto.photoUrl)} alt={activePhoto.caption} />
              <div className="slide-caption">
                <p>{activePhoto.caption || 'Community highlight'}</p>
                <span>Shared by {activePhoto.user}</span>
              </div>
            </>
          ) : (
            <div className="placeholder-slide">
              <p>Share your first travel photo and inspire others!</p>
            </div>
          )}
        </div>
      </section>

      <section className="travelers-gallery">
        <div className="section-header">
          <div>
            <p className="section-kicker">User photo stream</p>
            <h3>Recent memories from the community</h3>
          </div>
          <span>Uploads refresh automatically</span>
        </div>
        <div className="gallery-grid">
          {highlights.featuredPhotos.length === 0 && (
            <div className="empty-state">
              No uploads yet. Be the first to add your story once you login!
            </div>
          )}
          {highlights.featuredPhotos.map((photo) => (
            <figure key={photo.id} className="gallery-card">
              <img src={buildMediaUrl(photo.photoUrl)} alt={photo.caption} />
              <figcaption>
                <p>{photo.caption || 'Epic adventure moment'}</p>
                <small>— {photo.user}</small>
              </figcaption>
            </figure>
          ))}
        </div>
      </section>

      <section className="reviews-section">
        <div className="section-header">
          <div>
            <p className="section-kicker">Real voices</p>
            <h3>Reviews that include travel snaps</h3>
          </div>
          <Link to="/signup" className="link">
            Start sharing your trips →
          </Link>
        </div>
        <div className="reviews-grid">
          {highlights.reviews.length === 0 && (
            <div className="empty-state">
              Reviews will appear here as soon as users post their journeys.
            </div>
          )}
          {highlights.reviews.map((review) => (
            <article key={review.id} className="review-card">
              <div className="review-head">
                <div className="avatar">
                  {review.user?.profilePicture ? (
                    <img src={buildMediaUrl(review.user.profilePicture)} alt={review.user?.name} />
                  ) : (
                    <span>{(review.user?.name || 'T')[0]}</span>
                  )}
                </div>
                <div>
                  <h4>{review.user?.name || 'Explorer'}</h4>
                  <p>{review.user?.university || 'Independent traveler'}</p>
                </div>
                <div className="rating">
                  {Array.from({ length: 5 }).map((_, idx) => (
                    <span key={idx} className={idx < review.rating ? 'filled' : ''}>★</span>
                  ))}
                </div>
              </div>
              <p className="review-comment">{review.comment}</p>
              <MiniCarousel photos={getReviewPhotos(review)} />
              <p className="review-date">
                {new Date(review.createdAt).toLocaleDateString('en-IN', {
                  month: 'short',
                  day: 'numeric'
                })}
              </p>
            </article>
          ))}
        </div>
      </section>

      <footer className="landing-footer">
        <div>
          <h4>Travel Buddy Finder</h4>
          <p>Verified students, authentic plans, and photo-led stories.</p>
        </div>
        <div className="footer-links">
          <a href="mailto:support@travelbuddy.com">support@travelbuddy.com</a>
          <span>Made for campus explorers</span>
        </div>
      </footer>
    </div>
  );
};

export default Landing;


