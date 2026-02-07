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
    id: 2,
    title: 'Personal Growth Journeys',
    excerpt: 'Real stories from people who transformed their lives with DrishiQ.',
    slug: 'personal-growth-journeys'
  },
  {
    id: 4,
    title: 'Why We Struggle With Everyday Problems',
    excerpt: 'Understanding the hidden layers of everyday challenges.',
    slug: 'why-we-struggle-with-everyday-problems'
  }
];

const MindfulDecisionMakingPage: React.FC = () => {
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
            <h1>Mindful Decision Making</h1>
            <div className="blog-meta">
              By Team Drishiq • July 6, 2025
            </div>
            
            <Image
              src="https://via.placeholder.com/800x600/0B4422/FFFFFF?text=Mindful+Decisions"
              alt="Mindful Decision Making"
              width={800}
              height={600}
              className="w-full rounded-lg mb-6 aspect-video object-cover"
            />
            
            <div className="blog-content">
              <p>Every day, we make countless decisions—from what to eat for breakfast to whether to change careers. Some decisions feel automatic, while others keep us up at night. Mindful decision making is about bringing awareness and intention to our choices, rather than reacting impulsively or getting stuck in analysis paralysis.</p>
              
              <h2>What is Mindful Decision Making?</h2>
              <p>Mindful decision making combines self-awareness, emotional intelligence, and practical wisdom. It's about:</p>
              <ul>
                <li><strong>Pausing before acting:</strong> Taking a moment to consider your options</li>
                <li><strong>Understanding your motivations:</strong> Knowing why you're making a particular choice</li>
                <li><strong>Considering the impact:</strong> Thinking about how your decision affects you and others</li>
                <li><strong>Trusting your intuition:</strong> Balancing logic with your inner wisdom</li>
              </ul>
              
              <h2>Why We Struggle with Decisions</h2>
              <p>Decision-making challenges often stem from:</p>
              
              <h3>Fear of Making the Wrong Choice</h3>
              <p>We worry about making mistakes or missing out on better opportunities. This fear can lead to:</p>
              <ul>
                <li>Overthinking and analysis paralysis</li>
                <li>Seeking endless opinions and advice</li>
                <li>Delaying decisions until they're made for us</li>
                <li>Regretting choices we do make</li>
              </ul>
              
              <h3>Emotional Overwhelm</h3>
              <p>When emotions are high, our decision-making capacity decreases. We might:</p>
              <ul>
                <li>React impulsively based on fear or anger</li>
                <li>Make choices that don't align with our values</li>
                <li>Ignore important information</li>
                <li>Regret our decisions later</li>
              </ul>
              
              <h3>Lack of Clarity</h3>
              <p>Sometimes we don't know what we truly want or what matters most to us. This can lead to:</p>
              <ul>
                <li>Indecision and procrastination</li>
                <li>Making choices based on others' expectations</li>
                <li>Feeling unsatisfied with our decisions</li>
                <li>Constantly second-guessing ourselves</li>
              </ul>
              
              <h2>The Mindful Decision-Making Process</h2>
              <p>Here's a framework for making decisions more mindfully:</p>
              
              <h3>Step 1: Pause and Breathe</h3>
              <p>Before making any significant decision, take a moment to pause. This helps you:</p>
              <ul>
                <li>Step back from emotional reactions</li>
                <li>Access your rational thinking</li>
                <li>Connect with your intuition</li>
                <li>Consider the bigger picture</li>
              </ul>
              
              <h3>Step 2: Clarify What You Want</h3>
              <p>Ask yourself:</p>
              <ul>
                <li>What outcome am I hoping for?</li>
                <li>What values are most important to me in this situation?</li>
                <li>What would success look like?</li>
                <li>What am I willing to compromise on?</li>
              </ul>
              
              <h3>Step 3: Gather Information</h3>
              <p>Collect the facts and perspectives you need, but don't get lost in endless research. Consider:</p>
              <ul>
                <li>What do I know for certain?</li>
                <li>What assumptions am I making?</li>
                <li>What perspectives might I be missing?</li>
                <li>What are the potential consequences?</li>
              </ul>
              
              <h3>Step 4: Listen to Your Intuition</h3>
              <p>Your intuition is often wiser than you think. Pay attention to:</p>
              <ul>
                <li>Your gut feelings about different options</li>
                <li>What feels right versus what looks good on paper</li>
                <li>Your energy levels when thinking about each option</li>
                <li>What your body is telling you</li>
              </ul>
              
              <h3>Step 5: Make the Decision</h3>
              <p>When you're ready, make your choice with confidence. Remember:</p>
              <ul>
                <li>No decision is perfect</li>
                <li>You can always adjust your course</li>
                <li>Every choice is an opportunity to learn</li>
                <li>Trust yourself and your process</li>
              </ul>
              
              <h2>How Drishiq Helps with Decision Making</h2>
              <p>Drishiq is designed to support mindful decision making by helping you:</p>
              
              <h3>Clarify Your Values and Priorities</h3>
              <p>Through thoughtful conversation, Drishiq helps you identify what truly matters to you, so you can make decisions that align with your authentic self.</p>
              
              <h3>Explore Different Perspectives</h3>
              <p>Drishiq asks questions that help you see your situation from multiple angles, revealing options and considerations you might have missed.</p>
              
              <h3>Process Emotions</h3>
              <p>When emotions are clouding your judgment, Drishiq helps you understand and work through them, so you can make decisions from a place of clarity.</p>
              
              <h3>Build Confidence</h3>
              <p>By helping you understand your motivations and values, Drishiq builds your confidence in your decision-making abilities.</p>
              
              <h2>Practical Tips for Mindful Decisions</h2>
              <p>Here are some simple practices you can start using today:</p>
              
              <ul>
                <li><strong>Use the 10-10-10 rule:</strong> How will this decision affect you in 10 minutes, 10 months, and 10 years?</li>
                <li><strong>Sleep on it:</strong> For important decisions, give yourself time to process</li>
                <li><strong>Write it out:</strong> Journal about your options and how you feel about each one</li>
                <li><strong>Consider the worst case:</strong> What's the worst that could happen, and could you handle it?</li>
                <li><strong>Trust your future self:</strong> What would your future self thank you for deciding?</li>
              </ul>
              
              <h2>Remember: Decisions Are Learning Opportunities</h2>
              <p>Every decision you make teaches you something about yourself and the world. Even "wrong" decisions provide valuable information for future choices.</p>
              
              <p>The goal isn't to make perfect decisions every time—it's to make decisions mindfully, learn from the process, and trust yourself to handle whatever comes next.</p>
              
              <blockquote>
                The quality of your decisions determines the quality of your life. Make them mindfully.
              </blockquote>
              
              <p><strong>Ready to improve your decision-making skills? Start a conversation with Drishiq and discover how mindful reflection can lead to better choices.</strong></p>
            </div>
            
            {/* Tags */}
            <div className="blog-tags">
              <span className="blog-tag">Decision Making</span>
              <span className="blog-tag">Mindfulness</span>
              <span className="blog-tag">Clarity</span>
              <span className="blog-tag">Intuition</span>
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

export default MindfulDecisionMakingPage; 
