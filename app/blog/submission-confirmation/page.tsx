'use client';

import Link from 'next/link';
import Footer from '@/components/Footer';
import { useLanguage } from '@/lib/drishiq-i18n';
import { Sparkles, PenLine, BookOpen, MessageCircle, Sprout, Home } from 'lucide-react';

// Force dynamic rendering to prevent SSR issues
export const dynamic = 'force-dynamic';
export const dynamicParams = true;

export default function BlogSubmissionConfirmationPage() {
  const { t } = useLanguage(['blog_create', 'common']);
  
  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
        {/* Success Header */}
        <div className="text-center pt-20 pb-12 px-6">
          <div className="max-w-4xl mx-auto">
            {/* Success Icon */}
            <div className="mb-8">
              <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Success Message */}
            <h1 className="text-4xl font-bold text-[#1A3D2D] mb-6 flex items-center justify-center gap-3">
              <Sparkles className="text-amber-500" size={36} />
              {t('blog_create.submission.title') ?? 'Your Blog Post Has Been Submitted!'}
            </h1>
            
            <p className="text-xl text-gray-700 mb-8 leading-relaxed">
              {t('blog_create.submission.message') ?? 'Thank you for sharing your knowledge with the DrishiQ community. Your blog post will be reviewed by our team and published soon.'}
            </p>

            {/* What Happens Next */}
            <div className="bg-white rounded-2xl p-8 mb-12 shadow-lg">
              <h2 className="text-2xl font-semibold text-[#0B4422] mb-6">
                {t('blog_create.submission.what_happens_next') ?? 'What Happens Next?'}
              </h2>
              <div className="grid md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h3 className="font-semibold text-gray-800 mb-2">{t('blog_create.submission.review_process_title') ?? 'Review Process'}</h3>
                  <p className="text-gray-600 text-sm">{t('blog_create.submission.review_process_desc') ?? 'Our team will review your submission within 24-48 hours'}</p>
                </div>
                
                <div className="text-center">
                  <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4V2a1 1 0 011-1h8a1 1 0 011 1v2m-9 0h10m-10 0a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V6a2 2 0 00-2-2" />
                    </svg>
                  </div>
                  <h3 className="font-semibold text-gray-800 mb-2">{t('blog_create.submission.publication_title') ?? 'Publication'}</h3>
                  <p className="text-gray-600 text-sm">{t('blog_create.submission.publication_desc') ?? 'Once approved, your post will be published on our blog'}</p>
                </div>
                
                <div className="text-center">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                  </div>
                  <h3 className="font-semibold text-gray-800 mb-2">{t('blog_create.submission.community_impact_title') ?? 'Community Impact'}</h3>
                  <p className="text-gray-600 text-sm">{t('blog_create.submission.community_impact_desc') ?? 'Your insights will help others on their clarity journey'}</p>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
              <Link 
                href="/blog"
                className="px-8 py-4 bg-[#1A3D2D] text-white rounded-lg font-semibold hover:bg-[#0F2A1E] transition-colors duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-1 flex items-center gap-2"
              >
                <BookOpen size={20} />
                {t('blog_create.submission.view_blog') ?? 'View Blog'}
              </Link>
              
              <Link 
                href="/blog/create"
                className="px-8 py-4 bg-white text-[#1A3D2D] border-2 border-[#1A3D2D] rounded-lg font-semibold hover:bg-[#1A3D2D] hover:text-white transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-1 flex items-center gap-2"
              >
                <PenLine size={20} />
                {t('blog_create.submission.write_another') ?? 'Write Another Post'}
              </Link>
            </div>
          </div>
        </div>

        {/* Community Feedback Section */}
        <div className="bg-white py-16 px-6">
          <div className="max-w-6xl mx-auto">
            {/* Community Feedback Section */}
            <div className="bg-gradient-to-r from-blue-50 to-green-50 rounded-2xl p-8 border-2 border-[#1A3D2D]">
              <h3 className="text-2xl font-bold text-[#1A3D2D] mb-6 text-center flex items-center justify-center gap-2">
                <MessageCircle size={24} />
                {t('blog_create.submission.help_build_community') ?? 'Help Us Build a Better Community'}
              </h3>
              
              {/* Feedback Request */}
              <div className="text-center bg-white rounded-xl p-6 border border-gray-200">
                <h4 className="text-lg font-semibold text-[#1A3D2D] mb-3 flex items-center justify-center gap-2">
                  <Sparkles size={20} className="text-amber-500" />
                  {t('blog_create.submission.join_vision_title') ?? 'Join Our Vision: A Community of Shared Experiences'}
                </h4>
                <p className="text-gray-600 mb-4">
                  {t('blog_create.submission.join_vision_desc') ?? "We're building something bigger than just a platform. This is the foundation of a community where people who share your pain, happiness, failures, and successes can connect, support, and grow together. Your feedback shapes this important mission."}
                </p>
                
                <div className="bg-gradient-to-r from-green-50 to-blue-50 p-4 rounded-lg mb-4 border-l-4 border-[#0B4422]">
                  <p className="text-sm text-gray-700 italic">
                    <strong>{t('blog_create.submission.pipeline_vision_title') ?? 'Our Pipeline Vision:'}</strong> {t('blog_create.submission.pipeline_vision_desc') ?? "A space where your story becomes someone else's hope, where shared struggles create collective strength, and where every experience contributes to building a community that truly understands."}
                  </p>
                </div>
                
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <Link 
                    href="/support-details"
                    className="px-6 py-3 bg-[#1A3D2D] text-white rounded-lg font-semibold hover:bg-[#0F2A1E] transition-colors duration-200 text-sm flex items-center gap-2"
                  >
                    <MessageCircle size={16} />
                    {t('blog_create.submission.share_vision') ?? 'Share Your Vision'}
                  </Link>
                  <Link 
                    href="/community"
                    className="px-6 py-3 bg-white text-[#1A3D2D] border-2 border-[#1A3D2D] rounded-lg font-semibold hover:bg-[#1A3D2D] hover:text-white transition-all duration-200 text-sm flex items-center gap-2"
                  >
                    <Sprout size={16} />
                    {t('blog_create.submission.join_movement') ?? 'Join the Movement'}
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom CTA */}
        <div className="bg-gradient-to-r from-green-50 to-blue-50 py-16 px-6">
          <div className="max-w-4xl mx-auto text-center">
            <h3 className="text-2xl font-bold text-[#1A3D2D] mb-4">
              {t('blog_create.submission.next_session_title') ?? 'Ready for Your Next Clarity Session?'}
            </h3>
            <p className="text-lg text-gray-600 mb-8">
              {t('blog_create.submission.next_session_desc') ?? 'Continue your journey of self-discovery with DrishiQ'}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link 
                href="http://localhost:3001"
                className="px-8 py-4 bg-[#1A3D2D] text-white rounded-lg font-semibold hover:bg-[#0F2A1E] transition-colors duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-1 flex items-center gap-2"
              >
                <MessageCircle size={20} />
                {t('blog_create.submission.start_session') ?? 'Start a New Session'}
              </Link>
              <Link 
                href="/"
                className="px-8 py-4 bg-white text-[#1A3D2D] border-2 border-[#1A3D2D] rounded-lg font-semibold hover:bg-[#1A3D2D] hover:text-white transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-1 flex items-center gap-2"
              >
                <Home size={20} />
                {t('blog_create.submission.return_home') ?? 'Return Home'}
              </Link>
            </div>
          </div>
        </div>

        {/* YouTube Video */}
        <div className="bg-white py-16 px-6">
          <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-xl p-4 border border-gray-200">
              <h4 className="text-base font-semibold text-[#0B4422] mb-3 text-center">Watch Real Stories from DrishiQ Users</h4>
              <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
                <iframe
                  className="absolute top-0 left-0 w-full h-full rounded-lg"
                  src="https://www.youtube.com/embed/BoGI6nn3Mz0?list=PLkvOieJ_pAbDGUm6laWiJtbxTGoNZjKkN"
                  title="DrishiQ User Stories"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}


