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
    id: 2,
    title: 'Personal Growth Journeys',
    excerpt: 'Real stories from people who transformed their lives with DrishiQ.',
    slug: 'personal-growth-journeys'
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

const SelfAwarenessPage: React.FC = () => {
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
            <h1>How to Build Self-Awareness</h1>
            <div className="blog-meta">
              By Team Drishiq • July 6, 2025
            </div>
            
            <Image
              src="https://via.placeholder.com/800x600/0B4422/FFFFFF?text=Self+Awareness"
              alt="Self Awareness"
              width={800}
              height={600}
              className="w-full rounded-lg mb-6 aspect-video object-cover"
            />
            
            <div className="blog-content">
              <p>Self-awareness is the foundation of personal growth and emotional intelligence. It's the ability to see yourself clearly, understand your emotions, recognize your patterns, and know your strengths and weaknesses. But building self-awareness isn't always easy—it requires intentional practice and honest reflection.</p>
              
              <h2>What is Self-Awareness?</h2>
              <p>Self-awareness is more than just knowing your name and preferences. It's about understanding:</p>
              <ul>
                <li><strong>Your emotions:</strong> What triggers them, how they manifest, and how they influence your decisions</li>
                <li><strong>Your thoughts:</strong> The patterns in your thinking, your beliefs, and your mental models</li>
                <li><strong>Your behaviors:</strong> Your habits, reactions, and how you show up in different situations</li>
                <li><strong>Your impact:</strong> How your words and actions affect others</li>
              </ul>
              
              <h2>Why Self-Awareness Matters</h2>
              <p>When you're self-aware, you can:</p>
              <ul>
                <li>Make better decisions because you understand your motivations</li>
                <li>Build stronger relationships by recognizing how you affect others</li>
                <li>Manage stress more effectively by identifying your triggers</li>
                <li>Grow personally and professionally by knowing your areas for improvement</li>
                <li>Live more authentically by aligning your actions with your values</li>
              </ul>
              
              <h2>Practical Ways to Build Self-Awareness</h2>
              
              <h3>1. Practice Mindful Reflection</h3>
              <p>Set aside time each day to reflect on your experiences. Ask yourself:</p>
              <ul>
                <li>What emotions did I feel today?</li>
                <li>What triggered those emotions?</li>
                <li>How did I respond to challenges?</li>
                <li>What patterns do I notice in my behavior?</li>
              </ul>
              
              <h3>2. Seek Feedback</h3>
              <p>Ask trusted friends, family, or colleagues for honest feedback about how you come across. Be open to hearing both positive and constructive feedback.</p>
              
              <h3>3. Journal Your Thoughts</h3>
              <p>Writing helps you process your thoughts and identify patterns. Try free-writing or use prompts like:</p>
              <ul>
                <li>"Today I felt most alive when..."</li>
                <li>"I noticed I was triggered when..."</li>
                <li>"A pattern I see in myself is..."</li>
              </ul>
              
              <h3>4. Practice Active Listening</h3>
              <p>When you truly listen to others, you learn about yourself too. Notice your reactions, judgments, and the stories you tell yourself about what you're hearing.</p>
              
              <h3>5. Use Drishiq for Deep Reflection</h3>
              <p>Drishiq is designed to help you explore your inner world through thoughtful conversation. It can help you:</p>
              <ul>
                <li>Unpack complex emotions and situations</li>
                <li>Identify patterns you might not see on your own</li>
                <li>Gain clarity on your values and priorities</li>
                <li>Understand the impact of your choices</li>
              </ul>
              
              <h2>Common Barriers to Self-Awareness</h2>
              <p>Building self-awareness isn't always comfortable. Common barriers include:</p>
              <ul>
                <li><strong>Fear of what you'll discover:</strong> You might worry about finding flaws or uncomfortable truths</li>
                <li><strong>Defensiveness:</strong> It's natural to want to protect your self-image</li>
                <li><strong>Busyness:</strong> Reflection takes time, and it's easy to prioritize other things</li>
                <li><strong>Uncertainty about how to start:</strong> Self-reflection can feel abstract or overwhelming</li>
              </ul>
              
              <h2>Start Small, Think Deep</h2>
              <p>You don't need to have all the answers right away. Start with small moments of reflection:</p>
              <ul>
                <li>Pause before reacting to understand your emotions</li>
                <li>Ask yourself "why" when you make decisions</li>
                <li>Notice when you feel defensive and explore why</li>
                <li>Reflect on your day before going to sleep</li>
              </ul>
              
              <blockquote>
                Self-awareness is not about being perfect. It's about being honest with yourself about who you are, how you think, and how you show up in the world.
              </blockquote>
              
              <p><strong>Ready to deepen your self-awareness? Start a conversation with Drishiq and explore your inner world with curiosity and compassion.</strong></p>
            </div>
            
            {/* Tags */}
            <div className="blog-tags">
              <span className="blog-tag">Self-Awareness</span>
              <span className="blog-tag">Personal Growth</span>
              <span className="blog-tag">Emotional Intelligence</span>
              <span className="blog-tag">Reflection</span>
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

export default SelfAwarenessPage; 
