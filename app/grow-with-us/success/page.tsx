"use client";

import React from "react";
import { motion } from "framer-motion";
import { useSearchParams } from "next/navigation";
import { CheckCircle, ArrowRight, Mail, Phone, Calendar } from "lucide-react";
import Link from "next/link";
import Footer from "../../../components/Footer";

const fadeUp = {
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6 },
};

const roleDetails = {
  investor: {
    emoji: "💡",
    title: "Investment Application Complete!",
    subtitle: "Thank you for your interest in investing in DrishiQ",
    description: "Your investment application has been successfully submitted and verified. Our team will review your details and contact you within 24-48 hours with next steps.",
    nextSteps: [
      "Our investment team will review your application",
      "We'll schedule a call to discuss your investment thesis",
      "You'll receive detailed information about our funding rounds",
      "We'll keep you updated on our growth milestones"
    ],
    ctaText: "Explore Our Vision",
    ctaLink: "/about"
  },
  promoter: {
    emoji: "📢",
    title: "Promoter Application Complete!",
    subtitle: "Thank you for your interest in promoting DrishiQ",
    description: "Your promoter application has been successfully submitted and verified. Our team will review your platform and reach out within 24-48 hours.",
    nextSteps: [
      "Our marketing team will review your platform details",
      "We'll discuss collaboration opportunities and terms",
      "You'll receive promotional materials and guidelines",
      "We'll set up tracking for your promotional activities"
    ],
    ctaText: "See Our Products",
    ctaLink: "/products"
  },
  ambassador: {
    emoji: "🌍",
    title: "Ambassador Application Complete!",
    subtitle: "Thank you for your interest in becoming a DrishiQ ambassador",
    description: "Your ambassador application has been successfully submitted and verified. Our team will review your community details and contact you within 24-48 hours.",
    nextSteps: [
      "Our community team will review your application",
      "We'll discuss your community and outreach plans",
      "You'll receive ambassador materials and resources",
      "We'll set up regular check-ins and support"
    ],
    ctaText: "Join Our Community",
    ctaLink: "/community"
  },
  creator: {
    emoji: "🎨",
    title: "Creator Application Complete!",
    subtitle: "Thank you for your interest in creating with DrishiQ",
    description: "Your creator application has been successfully submitted and verified. Our team will review your portfolio and contact you within 24-48 hours.",
    nextSteps: [
      "Our creative team will review your portfolio",
      "We'll discuss collaboration opportunities and projects",
      "You'll receive creative briefs and guidelines",
      "We'll set up regular creative sessions and feedback"
    ],
    ctaText: "View Our Work",
    ctaLink: "/portfolio"
  },
  affiliate: {
    emoji: "🤝",
    title: "Affiliate Application Complete!",
    subtitle: "Thank you for your interest in our affiliate program",
    description: "Your affiliate application has been successfully submitted and verified. Our team will review your channels and contact you within 24-48 hours.",
    nextSteps: [
      "Our affiliate team will review your channels and reach",
      "We'll discuss commission rates and payment terms",
      "You'll receive affiliate links and promotional materials",
      "We'll set up tracking and reporting for your referrals"
    ],
    ctaText: "Learn More",
    ctaLink: "/affiliate"
  },
  referral: {
    emoji: "🔗",
    title: "Referral Application Complete!",
    subtitle: "Thank you for your interest in referring others to DrishiQ",
    description: "Your referral application has been successfully submitted and verified. Our team will review your referral details and contact you within 24-48 hours.",
    nextSteps: [
      "Our referral team will review your referral details",
      "We'll discuss referral rewards and tracking",
      "You'll receive referral links and materials",
      "We'll set up tracking for your successful referrals"
    ],
    ctaText: "Start Referring",
    ctaLink: "/referral"
  }
};

export default function SuccessPage() {
  const searchParams = useSearchParams();
  const role = searchParams.get('role') || 'general';
  const roleInfo = roleDetails[role as keyof typeof roleDetails] || roleDetails.investor;

  return (
    <>
      <main className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50 flex items-center justify-center p-6 pt-24">
        <motion.div
          {...fadeUp}
          className="relative w-full max-w-4xl bg-white/95 backdrop-blur-sm rounded-3xl shadow-2xl ring-1 ring-black/5 p-8 md:p-12"
        >
          {/* Success Header */}
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center shadow-2xl mx-auto mb-6">
              <CheckCircle className="h-12 w-12 text-white" />
            </div>
            
            <div className="text-6xl mb-4">{roleInfo.emoji}</div>
            <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-emerald-600 to-green-600 bg-clip-text text-transparent mb-4">
              {roleInfo.title}
            </h1>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
              {roleInfo.description}
            </p>
          </div>

          {/* Next Steps */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-2xl border border-blue-100 mb-8">
            <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
              <Calendar className="h-5 w-5 text-blue-600" />
              What happens next?
            </h2>
            <div className="space-y-3">
              {roleInfo.nextSteps.map((step, index) => (
                <div key={index} className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-xs font-bold text-blue-600">{index + 1}</span>
                  </div>
                  <p className="text-slate-700">{step}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Contact Information */}
          <div className="grid md:grid-cols-2 gap-6 mb-8">
            <div className="bg-gradient-to-r from-emerald-50 to-green-50 p-6 rounded-2xl border border-emerald-100">
              <div className="flex items-center gap-3 mb-3">
                <Mail className="h-5 w-5 text-emerald-600" />
                <h3 className="font-semibold text-slate-800">Email Confirmation</h3>
              </div>
              <p className="text-sm text-slate-600">
                You'll receive a confirmation email shortly with all the details of your application.
              </p>
            </div>
            
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-2xl border border-blue-100">
              <div className="flex items-center gap-3 mb-3">
                <Phone className="h-5 w-5 text-blue-600" />
                <h3 className="font-semibold text-slate-800">Phone Verification</h3>
              </div>
              <p className="text-sm text-slate-600">
                Your phone number has been verified and will be used for future communications.
              </p>
            </div>
          </div>

          {/* Call to Action */}
          <div className="text-center">
            <Link
              href={roleInfo.ctaLink}
              className="group inline-flex items-center gap-3 rounded-2xl bg-gradient-to-r from-emerald-600 to-green-600 text-white px-8 py-4 text-lg font-bold shadow-2xl hover:from-emerald-700 hover:to-green-700 transition-all duration-300 transform hover:scale-105"
            >
              <span>{roleInfo.ctaText}</span>
              <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform duration-200" />
            </Link>
            
            <p className="text-sm text-slate-500 mt-4">
              Questions? Contact us at{" "}
              <a href="mailto:support@drishiq.com" className="text-emerald-600 hover:text-emerald-700 font-medium">
                support@drishiq.com
              </a>
            </p>
          </div>

          {/* YouTube Playlist */}
          <div className="mt-8 bg-white rounded-xl p-4 border border-gray-200">
            <h4 className="text-base font-semibold text-[#0B4422] mb-3 text-center">Watch Real Stories from DrishiQ Users</h4>
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
        </motion.div>
      </main>
      <Footer />
    </>
  );
}
