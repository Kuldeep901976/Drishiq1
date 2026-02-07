'use client';

import { useRouter } from 'next/navigation';
import Footer from '@/components/Footer';

export default function ThankYouPage() {
  const router = useRouter();

  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 flex items-center justify-center p-4 pt-24">
        <div className="max-w-2xl w-full">
          <div className="bg-white rounded-3xl shadow-2xl p-8 md:p-12 text-center">
            {/* Success Icon */}
            <div className="mb-8">
              <div className="w-24 h-24 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg animate-bounce">
                <span className="text-5xl">✅</span>
              </div>
              <div className="w-32 h-1 bg-gradient-to-r from-emerald-500 to-teal-600 mx-auto rounded-full"></div>
            </div>

            {/* Thank You Message */}
            <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-4">
              Thank You! 🙏
            </h1>
            <p className="text-xl md:text-2xl text-gray-700 mb-6 font-semibold">
              Your Story Has Been Submitted Successfully
            </p>

            {/* Description */}
            <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-2xl p-6 md:p-8 mb-8 border-2 border-emerald-200">
              <p className="text-gray-700 text-base md:text-lg leading-relaxed mb-4">
                We've received your unique challenge and our team will review it carefully.
              </p>
              <p className="text-gray-600 text-sm md:text-base">
                If your challenge is truly unique, we'll reach out to you with a personalized solution to help you overcome it.
              </p>
            </div>

            {/* What Happens Next */}
            <div className="bg-white border-2 border-gray-200 rounded-2xl p-6 mb-8">
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center justify-center gap-2">
                <span>📋</span>
                What Happens Next?
              </h2>
              <div className="space-y-3 text-left">
                <div className="flex items-start gap-3">
                  <span className="text-2xl">1️⃣</span>
                  <div>
                    <p className="font-semibold text-gray-900">Review Process</p>
                    <p className="text-sm text-gray-600">Our team will carefully review your submission</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-2xl">2️⃣</span>
                  <div>
                    <p className="font-semibold text-gray-900">Evaluation</p>
                    <p className="text-sm text-gray-600">We'll assess if your challenge is unique and requires our specialized approach</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-2xl">3️⃣</span>
                  <div>
                    <p className="font-semibold text-gray-900">Contact</p>
                    <p className="text-sm text-gray-600">If approved, we'll reach out to you via email with next steps</p>
                  </div>
                </div>
              </div>
            </div>

            {/* YouTube Video Section */}
            <div className="mb-8">
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center justify-center gap-2">
                <span>🎥</span>
                Watch Our Latest Video
              </h2>
              <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
                <iframe
                  className="absolute top-0 left-0 w-full h-full rounded-xl shadow-lg"
                  src="https://www.youtube.com/embed/BoGI6nn3Mz0?list=PLkvOieJ_pAbDGUm6laWiJtbxTGoNZjKkN&index=2"
                  title="DrishiQ Video"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                ></iframe>
              </div>
              <p className="text-sm text-gray-600 mt-2 text-center">
                <a 
                  href="https://www.youtube.com/playlist?list=PLkvOieJ_pAbDGUm6laWiJtbxTGoNZjKkN" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-emerald-600 hover:text-emerald-700 underline"
                >
                  View Full Playlist →
                </a>
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => router.push('/')}
                className="px-8 py-4 bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-semibold rounded-xl hover:from-emerald-700 hover:to-teal-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              >
                <span className="flex items-center gap-2 justify-center">
                  <span>🏠</span>
                  Go to Home
                </span>
              </button>
              <button
                onClick={() => router.push('/blog')}
                className="px-8 py-4 border-2 border-gray-300 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 hover:border-gray-400 transition-all duration-300"
              >
                <span className="flex items-center gap-2 justify-center">
                  <span>📖</span>
                  Read and Share Blogs
                </span>
              </button>
            </div>

          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}

