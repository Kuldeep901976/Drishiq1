'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Footer from '@/components/Footer';
import { useLanguage } from '@/lib/drishiq-i18n';

export default function TestimonialSuccessPage() {
  const router = useRouter();
  const { t } = useLanguage(['testimonials_main']);

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
                  <h1 className="text-4xl font-bold text-[#0B4422] mb-6">
                    {t('testimonials_main.success_page.hero.title')}
                  </h1>

                  <p className="text-xl text-gray-700 mb-8 leading-relaxed">
                    {t('testimonials_main.success_page.hero.message')}
                  </p>

          {/* What Happens Next */}
          <div className="bg-white rounded-2xl p-8 mb-12 shadow-lg">
            <h2 className="text-2xl font-semibold text-[#0B4422] mb-6">
              {t('testimonials_main.success_page.what_happens_next.title')}
            </h2>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="font-semibold text-gray-800 mb-2">{t('testimonials_main.success_page.what_happens_next.steps.0.title')}</h3>
                <p className="text-gray-600 text-sm">{t('testimonials_main.success_page.what_happens_next.steps.0.description')}</p>
              </div>
              
              <div className="text-center">
                <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4V2a1 1 0 011-1h8a1 1 0 011 1v2m-9 0h10m-10 0a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V6a2 2 0 00-2-2" />
                  </svg>
                </div>
                <h3 className="font-semibold text-gray-800 mb-2">{t('testimonials_main.success_page.what_happens_next.steps.1.title')}</h3>
                <p className="text-gray-600 text-sm">{t('testimonials_main.success_page.what_happens_next.steps.1.description')}</p>
              </div>
              
              <div className="text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                </div>
                <h3 className="font-semibold text-gray-800 mb-2">{t('testimonials_main.success_page.what_happens_next.steps.2.title')}</h3>
                <p className="text-gray-600 text-sm">{t('testimonials_main.success_page.what_happens_next.steps.2.description')}</p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
                  <Link
                    href="/"
                    className="px-8 py-4 bg-[#0B4422] text-white rounded-lg font-semibold hover:bg-[#083318] transition-colors duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
                  >
                    {t('testimonials_main.success_page.action_buttons.go_home')}
                  </Link>
            
            <button 
              onClick={() => router.back()}
              className="px-8 py-4 bg-white text-[#0B4422] border-2 border-[#0B4422] rounded-lg font-semibold hover:bg-[#0B4422] hover:text-white transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
            >
              {t('testimonials_main.success_page.action_buttons.submit_another')}
            </button>
            </div>
          </div>
        </div>
      </div>

       {/* Community Feedback Section */}
       <div className="bg-white py-16 px-6">
         <div className="max-w-6xl mx-auto">
           {/* Community Feedback Section */}
           <div className="bg-gradient-to-r from-blue-50 to-green-50 rounded-2xl p-8 border-2 border-[#0B4422]">
             <h3 className="text-2xl font-bold text-[#0B4422] mb-6 text-center">
               {t('testimonials_main.success_page.community_feedback.title')}
             </h3>
             
             {/* Feedback Request */}
             <div className="text-center bg-white rounded-xl p-6 border border-gray-200">
               <h4 className="text-lg font-semibold text-[#0B4422] mb-3">
                 {t('testimonials_main.success_page.community_feedback.vision_title')}
               </h4>
               <p className="text-gray-600 mb-4">
                 {t('testimonials_main.success_page.community_feedback.vision_description')}
               </p>
               
               <div className="bg-gradient-to-r from-green-50 to-blue-50 p-4 rounded-lg mb-4 border-l-4 border-[#0B4422]">
                 <p className="text-sm text-gray-700 italic">
                   <strong>{t('testimonials_main.success_page.community_feedback.pipeline_vision')}</strong>
                 </p>
               </div>
               
               <div className="flex flex-col sm:flex-row gap-3 justify-center">
                 <Link 
                   href={t('testimonials_main.success_page.community_feedback.links.share_vision')}
                   className="px-6 py-3 bg-[#0B4422] text-white rounded-lg font-semibold hover:bg-[#083318] transition-colors duration-200 text-sm"
                 >
                   {t('testimonials_main.success_page.community_feedback.buttons.share_vision')}
                 </Link>
                 <Link 
                   href={t('testimonials_main.success_page.community_feedback.links.join_movement')}
                   className="px-6 py-3 bg-white text-[#0B4422] border-2 border-[#0B4422] rounded-lg font-semibold hover:bg-[#0B4422] hover:text-white transition-all duration-200 text-sm"
                 >
                   {t('testimonials_main.success_page.community_feedback.buttons.join_movement')}
                 </Link>
               </div>
             </div>
           </div>
         </div>
       </div>

      {/* Bottom CTA */}
      <div className="bg-gradient-to-r from-green-50 to-blue-50 py-16 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h3 className="text-2xl font-bold text-[#0B4422] mb-4">
            {t('testimonials_main.success_page.bottom_cta.title')}
          </h3>
          <p className="text-lg text-gray-600 mb-8">
            {t('testimonials_main.success_page.bottom_cta.description')}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link 
              href={t('testimonials_main.success_page.bottom_cta.links.start_session')}
              className="px-8 py-4 bg-[#0B4422] text-white rounded-lg font-semibold hover:bg-[#083318] transition-colors duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
            >
              {t('testimonials_main.success_page.bottom_cta.buttons.start_session')}
            </Link>
            <Link 
              href={t('testimonials_main.success_page.bottom_cta.links.return_home')}
              className="px-8 py-4 bg-white text-[#0B4422] border-2 border-[#0B4422] rounded-lg font-semibold hover:bg-[#0B4422] hover:text-white transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
            >
              {t('testimonials_main.success_page.bottom_cta.buttons.return_home')}
            </Link>
          </div>
        </div>
      </div>

      {/* YouTube Playlist */}
      <div className="bg-white py-16 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-xl p-4 border border-gray-200">
            <h4 className="text-base font-semibold text-[#0B4422] mb-3 text-center">{t('testimonials_main.sidebar.playlist.title')}</h4>
            <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
              <iframe
                className="absolute top-0 left-0 w-full h-full rounded-lg"
                src="https://www.youtube.com/embed/videoseries?list=PLkvOieJ_pAbDGUm6laWiJtbxTGoNZjKkN"
                title="DrishiQ Testimonials Playlist"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}
