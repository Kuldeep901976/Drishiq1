'use client';

import Image from 'next/image';
import Link from 'next/link';
import React, { useState } from 'react';
import Footer from '../../../components/Footer';
import Header from '../../../components/Header';
import { useLanguage } from '../../../lib/drishiq-i18n';

interface VideoSlide {
  id: string;
  title: string;
  thumbnail: string;
  videoId: string;
}

interface RelatedArticle {
  id: number;
  title: string;
  excerpt: string;
  slug: string;
}

const mockVideos: VideoSlide[] = [
  {
    id: '1',
    title: 'Understanding Emotional Clarity',
    thumbnail: 'https://img.youtube.com/vi/Ks-_Mh1QhMc/0.jpg',
    videoId: 'Ks-_Mh1QhMc'
  },
  {
    id: '2',
    title: 'The Power of Self-Reflection',
    thumbnail: 'https://img.youtube.com/vi/lTTajzrSkCw/0.jpg',
    videoId: 'lTTajzrSkCw'
  },
  {
    id: '3',
    title: 'Making Better Decisions',
    thumbnail: 'https://img.youtube.com/vi/3fumBcKC6RE/0.jpg',
    videoId: '3fumBcKC6RE'
  }
];

const mockRelatedArticles: RelatedArticle[] = [
  {
    id: 1,
    title: 'How to Build Self-Awareness',
    excerpt: 'Explore practical tips to deepen your self-understanding.',
    slug: 'how-to-build-self-awareness'
  },
  {
    id: 3,
    title: 'Mindful Decision Making',
    excerpt: 'Learn techniques for making better decisions through mindful reflection.',
    slug: 'mindful-decision-making'
  },
  {
    id: 4,
    title: 'Why We Struggle With Everyday Problems',
    excerpt: 'Understanding the hidden layers of everyday challenges.',
    slug: 'why-we-struggle-with-everyday-problems'
  }
];

const PersonalGrowthPage: React.FC = () => {
  const { t } = useLanguage();
  const [rating, setRating] = useState(0);
  const [feedback, setFeedback] = useState('');
  const [videoSearch, setVideoSearch] = useState('');
  const [articleSearch, setArticleSearch] = useState('');

  const playVideo = (videoId: string) => {
    window.open(`https://www.youtube.com/watch?v=${videoId}`, '_blank');
  };

  const handleFeedbackSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Feedback submitted:', { rating, feedback });
    setFeedback('');
    setRating(0);
  };

  const filteredVideos = mockVideos.filter(video =>
    video.title.toLowerCase().includes(videoSearch.toLowerCase())
  );

  const filteredArticles = mockRelatedArticles.filter(article =>
    article.title.toLowerCase().includes(articleSearch.toLowerCase())
  );

  return (
    <>
      <Header />
      <div className="flex-grow pt-20">
        <main className="blog-article-container">
          {/* Main Blog Content */}
          <div className="blog-content">
            <h1>Personal Growth Journeys</h1>
            <div className="blog-meta">
              By Team Drishiq • July 6, 2025
            </div>
            
            <Image
              src="https://via.placeholder.com/800x600/0B4422/FFFFFF?text=Personal+Growth"
              alt="Personal Growth"
              width={800}
              height={600}
              className="w-full rounded-lg mb-6 aspect-video object-cover"
            />
            
            <div className="blog-content">
              <p>Every personal growth journey is unique, yet they all share common elements: moments of clarity, periods of struggle, and the gradual transformation that comes from honest self-reflection. Through Drishiq, we've witnessed countless individuals navigate their own paths to growth, and their stories offer valuable insights for anyone on a similar journey.</p>
              
              <h2>What Makes a Growth Journey Successful?</h2>
              <p>Successful personal growth isn't about achieving perfection or following a predetermined path. It's about:</p>
              <ul>
                <li><strong>Authenticity:</strong> Being honest with yourself about where you are and where you want to go</li>
                <li><strong>Curiosity:</strong> Approaching challenges with a desire to learn rather than a need to be right</li>
                <li><strong>Persistence:</strong> Continuing to show up even when progress feels slow</li>
                <li><strong>Compassion:</strong> Treating yourself with kindness during difficult moments</li>
              </ul>
              
              <h2>Real Stories from Drishiq Users</h2>
              
              <h3>Sarah's Story: From Overwhelm to Clarity</h3>
              <p>Sarah came to Drishiq feeling overwhelmed by her career choices. She was successful but felt stuck, unsure of her next steps. Through conversations with Drishiq, she discovered that her confusion wasn't about the options themselves, but about her fear of making the "wrong" choice.</p>
              
              <p>"Drishiq helped me see that I was paralyzed by perfectionism," Sarah shared. "Once I understood that, I could make decisions based on what I actually wanted, not what I thought I should want."</p>
              
              <h3>Michael's Journey: Breaking Through Emotional Barriers</h3>
              <p>Michael struggled with expressing his emotions in relationships. He came to Drishiq after a particularly difficult argument with his partner, feeling frustrated and misunderstood.</p>
              
              <p>"I realized I wasn't just bad at communication—I was afraid of being vulnerable," Michael explained. "Drishiq helped me understand that vulnerability isn't weakness; it's the foundation of real connection."</p>
              
              <h2>Common Patterns in Growth Journeys</h2>
              <p>While every journey is unique, we've noticed some common patterns:</p>
              
              <h3>The Awareness Phase</h3>
              <p>This is when you first recognize that something needs to change. You might feel:</p>
              <ul>
                <li>Uncomfortable with your current situation</li>
                <li>Curious about what's possible</li>
                <li>Ready to explore new perspectives</li>
              </ul>
              
              <h3>The Exploration Phase</h3>
              <p>During this phase, you're actively seeking understanding. You might:</p>
              <ul>
                <li>Ask deeper questions about yourself</li>
                <li>Try new approaches to old problems</li>
                <li>Discover patterns you hadn't noticed before</li>
              </ul>
              
              <h3>The Integration Phase</h3>
              <p>This is when insights become part of who you are. You start to:</p>
              <ul>
                <li>Respond differently to familiar situations</li>
                <li>Feel more confident in your decisions</li>
                <li>Experience greater peace and clarity</li>
              </ul>
              
              <h2>How Drishiq Supports Your Growth Journey</h2>
              <p>Drishiq is designed to be your thinking partner throughout your growth journey:</p>
              
              <h3>In the Awareness Phase</h3>
              <p>Drishiq helps you identify what's not working and what you truly want. It asks the questions that help you see your situation more clearly.</p>
              
              <h3>In the Exploration Phase</h3>
              <p>Drishiq guides you through deeper reflection, helping you understand your patterns, beliefs, and motivations. It provides a safe space to explore difficult emotions and complex situations.</p>
              
              <h3>In the Integration Phase</h3>
              <p>Drishiq helps you solidify your insights and apply them to real-life situations. It supports you as you practice new ways of thinking and being.</p>
              
              <h2>Tips for Your Own Growth Journey</h2>
              <p>Based on the stories we've heard, here are some tips for making the most of your growth journey:</p>
              
              <ul>
                <li><strong>Start where you are:</strong> Don't wait for the perfect moment or complete clarity</li>
                <li><strong>Be patient with yourself:</strong> Growth takes time and happens in small steps</li>
                <li><strong>Celebrate progress:</strong> Notice and appreciate the small changes</li>
                <li><strong>Stay curious:</strong> Approach challenges as opportunities to learn</li>
                <li><strong>Seek support:</strong> Whether through Drishiq, friends, or professionals, don't go it alone</li>
              </ul>
              
              <h2>Your Journey is Unique</h2>
              <p>Remember that your growth journey is yours alone. Don't compare your progress to others or feel pressured to follow someone else's path. What matters is that you're moving toward greater self-understanding and authenticity.</p>
              
              <blockquote>
                Growth isn't about becoming someone else. It's about becoming more fully yourself.
              </blockquote>
              
              <p><strong>Ready to begin or continue your growth journey? Start a conversation with Drishiq and discover what's possible for you.</strong></p>
            </div>
            
            {/* Tags */}
            <div className="blog-tags">
              <span className="blog-tag">Personal Growth</span>
              <span className="blog-tag">Transformation</span>
              <span className="blog-tag">Self-Discovery</span>
              <span className="blog-tag">Journey</span>
            </div>
            
            {/* Footer Note */}
            <div className="blog-footer-note">
              Want to experience Drishiq?{' '}
              <Link href="/sessions">
                Start your session →
              </Link>
            </div>
            
            {/* Feedback Section */}
            <div className="feedback-section">
              <h3 className="text-lg font-semibold text-[#0B4422] mb-3">
                Was this article helpful?
              </h3>
              <form onSubmit={handleFeedbackSubmit} className="space-y-3">
                <div className="star-rating">
                  {[1, 2, 3, 4, 5].map(star => (
                    <span
                      key={star}
                      onClick={() => setRating(star)}
                      className={`cursor-pointer ${rating >= star ? 'active' : ''}`}
                    >
                      ★
                    </span>
                  ))}
                </div>
                <textarea
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  placeholder="Share your thoughts (optional)..."
                  rows={3}
                />
                <button type="submit">
                  Submit Feedback
                </button>
              </form>
            </div>
          </div>

          {/* Sidebar */}
          <div className="blog-sidebar">
            {/* Video Search */}
            <div className="search-videos" style={{ marginBottom: '-18px', maxWidth: '216px' }}>
              <input
                type="text"
                placeholder="Search videos..."
                value={videoSearch}
                onChange={(e) => setVideoSearch(e.target.value)}
              />
            </div>

            {/* Video Slider */}
            <div className="video-slider-container">
              {filteredVideos.map(video => (
                <div
                  key={video.id}
                  className="video-slide"
                  onClick={() => playVideo(video.videoId)}
                >
                  <Image
                    src={video.thumbnail}
                    alt={video.title}
                    width={300}
                    height={180}
                    className="w-full aspect-video object-cover"
                  />
                </div>
              ))}
            </div>
            
            {/* Article Search */}
            <div className="search-articles" style={{ maxWidth: '216px', marginBottom: '-16px', marginTop: '8px' }}>
              <input
                type="text"
                placeholder="Search for more articles..."
                value={articleSearch}
                onChange={(e) => setArticleSearch(e.target.value)}
              />
            </div>

            {/* Related Articles */}
            <div className="related-articles">
              <h3>More Articles</h3>
              <div className="article-links">
                {filteredArticles.map(article => (
                  <div key={article.id}>
                    <Link href={`/blog/${article.slug}`}>
                      {article.title}
                    </Link>
                    <span>{article.excerpt}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </main>
      </div>
      <Footer />
    </>
  );
};

export default PersonalGrowthPage; 
