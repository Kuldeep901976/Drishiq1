'use client';

import dynamic from 'next/dynamic';
import Footer from '../../../components/Footer';
import { useLanguage } from '@/lib/drishiq-i18n';

const TestimonialSubmissionForm = dynamic(
  () => import('../../../components/TestimonialSubmissionForm'),
  {
    loading: () => (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#0B4422]"></div>
      </div>
    ),
    ssr: false
  }
);

export default function SubmitTestimonialPage() {
  const { t } = useLanguage(['testimonials_main']);

  return (
    <>
      <main className="min-h-screen bg-gray-50 pb-16">
        {/* Hero Section */}
        <section className="hero-section py-5" style={{ minHeight: '250px' }}>
          <div className="hero-section__container">
                  <h1 className="text-5xl font-bold text-white mb-2">{t('testimonials_main.form.title')}</h1>
                  <p className="text-white text-lg">
                    {t('testimonials_main.form.subtitle')}
                  </p>
          </div>
        </section>
        
        <TestimonialSubmissionForm />
      </main>
      <Footer />
    </>
  );
}


