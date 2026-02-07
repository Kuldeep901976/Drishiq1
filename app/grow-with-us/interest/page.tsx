"use client";

import React, { useMemo, useState, useRef, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import {
  ArrowRight,
  User,
  Mail,
  Phone,
  FileText,
  CheckCircle,
  Link as LinkIcon,
  Globe,
  Wallet,
  Calendar,
  Users,
  Sparkles,
  DollarSign,
} from "lucide-react";
import Footer from "../../../components/Footer";
import CountryCodeSelector from "../../../components/CountryCodeSelector";
import { supabase } from "@/lib/supabase";
import { auth } from "@/lib/firebase";
import { signInWithPhoneNumber, RecaptchaVerifier } from "firebase/auth";
import { useLanguage } from "../../../lib/drishiq-i18n";

/**
 * DrishiQ – Unified Interest Form (role-adaptive + phone OTP verification)
 * Drop in as: app/interest/page.tsx  or  pages/interest.tsx
 * Backend TODOs:
 *  - Implement POST /api/otp/send  { phone }
 *  - Implement POST /api/otp/verify { phone, code }
 *  Return { success: boolean }
 */

const fadeUp = {
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6 },
};

function SilverBar() {
  return (
    <div
      className="absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r from-slate-300 via-slate-200 to-slate-300"
      aria-hidden
    />
  );
}

const roleCopy: Record<string, { title: string; tagline: string }> = {
  investor: {
    title: "✨ Invest in Clarity",
    tagline: "Share your details and let's explore how your investment can shape clarity.",
  },
  investors: {
    title: "✨ Invest in Clarity",
    tagline: "Share your details and let's explore how your investment can shape clarity.",
  },
  promoter: {
    title: "📣 Use Your Voice to Amplify Clarity",
    tagline: "Tell us about your platform and how you'd like to amplify clarity.",
  },
  promoters: {
    title: "📣 Use Your Voice to Amplify Clarity",
    tagline: "Tell us about your platform and how you'd like to amplify clarity.",
  },
  ambassador: {
    title: "🌍 Be the Face of Clarity in Your World",
    tagline: "Let's know your community and how you'd like to represent clarity.",
  },
  ambassadors: {
    title: "🌍 Be the Face of Clarity in Your World",
    tagline: "Let's know your community and how you'd like to represent clarity.",
  },
  creator: {
    title: "✨ Create for Clarity. Collaborate for Change.",
    tagline: "Show us your craft and how you'd like to contribute your creativity.",
  },
  collaborators: {
    title: "✨ Create for Clarity. Collaborate for Change.",
    tagline: "Show us your craft and how you'd like to contribute your creativity.",
  },
  affiliate: {
    title: "🌱 Join the Circle of Change",
    tagline: "Tell us how you'll share DrishiQ and be part of our affiliate circle.",
  },
  affiliates: {
    title: "🌱 Join the Circle of Change",
    tagline: "Tell us how you'll share DrishiQ and be part of our affiliate circle.",
  },
  referral: {
    title: "🔗 Share Clarity, Share Care",
    tagline: "Tell us who you'd like to invite or how you plan to use referrals to support others.",
  },
  referrals: {
    title: "🔗 Share Clarity, Share Care",
    tagline: "Tell us who you'd like to invite or how you plan to use referrals to support others.",
  },
};

export default function InterestForm() {
  const searchParams = useSearchParams();
  const { t } = useLanguage(['growwithuscommon']);
  const [role, setRole] = useState<keyof typeof roleCopy>("investors");
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [verifyingOtp, setVerifyingOtp] = useState(false);
  const [confirmationResult, setConfirmationResult] = useState<any>(null);
  const recaptchaVerifierRef = useRef<RecaptchaVerifier | null>(null);

  // common fields
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [countryCode, setCountryCode] = useState("+91");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [notes, setNotes] = useState("");


  // role-specific state
  const [investmentStage, setInvestmentStage] = useState(""); // investor
  const [ticketSize, setTicketSize] = useState(""); // investor
  const [investTimeline, setInvestTimeline] = useState(""); // investor
  const [platforms, setPlatforms] = useState(""); // promoter
  const [audience, setAudience] = useState(""); // promoter
  const [sampleLinks, setSampleLinks] = useState(""); // promoter
  const [community, setCommunity] = useState(""); // ambassador
  const [activities, setActivities] = useState(""); // ambassador
  const [region, setRegion] = useState(""); // ambassador
  const [craftArea, setCraftArea] = useState(""); // creator
  const [portfolio, setPortfolio] = useState(""); // creator
  const [affiliateChannels, setAffiliateChannels] = useState(""); // affiliate
  const [trafficEstimate, setTrafficEstimate] = useState(""); // affiliate
  const [payoutPref, setPayoutPref] = useState(""); // affiliate
  const [refName, setRefName] = useState(""); // referral
  const [refEmail, setRefEmail] = useState(""); // referral
  const [relationship, setRelationship] = useState(""); // referral

  const copy = roleCopy[role];

  const phone = `${countryCode}${phoneNumber}`.replace(/\s+/g, '');
  
  // Read role from URL parameter
  useEffect(() => {
    const roleParam = searchParams.get('role');
    if (roleParam && roleCopy[roleParam]) {
      setRole(roleParam as keyof typeof roleCopy);
    }
  }, [searchParams]);
  
  // Initialize reCAPTCHA
  useEffect(() => {
    if (typeof window !== 'undefined' && !recaptchaVerifierRef.current) {
      recaptchaVerifierRef.current = new RecaptchaVerifier(auth, 'recaptcha-container', {
        size: 'invisible',
        callback: () => console.log('reCAPTCHA solved'),
        'expired-callback': () => console.log('reCAPTCHA expired')
      });
    }
  }, []);

  const canSubmit = useMemo(() => {
    const basic = name.trim() && email.trim() && phoneNumber.trim();
    return Boolean(basic && !submitting);
  }, [name, email, phoneNumber, submitting]);

  async function verifyOtp() {
    if (!confirmationResult || !otpCode.trim()) return;
    
    setVerifyingOtp(true);
    try {
      await confirmationResult.confirm(otpCode);
      await saveToDatabase();
      setSubmitted(true);
    } catch (error: any) {
      console.error('OTP verification failed:', error);
      alert('Invalid code. Please try again.');
    } finally {
      setVerifyingOtp(false);
    }
  }

  async function saveToDatabase() {
    const payload: any = {
      role,
      name,
      email,
      phone,
      notes,
      created_at: new Date().toISOString(),
    };

    // Add role-specific fields
    if (role === "investor" || role === "investors") {
      payload.investment_stage = investmentStage;
      payload.ticket_size = ticketSize;
      payload.invest_timeline = investTimeline;
    } else if (role === "promoter" || role === "promoters") {
      payload.platforms = platforms;
      payload.audience = audience;
      payload.sample_links = sampleLinks;
    } else if (role === "ambassador" || role === "ambassadors") {
      payload.community = community;
      payload.activities = activities;
      payload.region = region;
    } else if (role === "creator" || role === "collaborators") {
      payload.craft_area = craftArea;
      payload.portfolio = portfolio;
    } else if (role === "affiliate" || role === "affiliates") {
      payload.affiliate_channels = affiliateChannels;
      payload.traffic_estimate = trafficEstimate;
      payload.payout_pref = payoutPref;
    } else if (role === "referral" || role === "referrals") {
      payload.ref_name = refName;
      payload.ref_email = refEmail;
      payload.relationship = relationship;
    }

    const { error } = await supabase.from("interest_forms").insert([payload]);
    if (error) {
      console.error("Supabase insert error:", error);
      throw error;
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    
    setSubmitting(true);
    try {
      if (!recaptchaVerifierRef.current) {
        throw new Error('reCAPTCHA not initialized');
      }

      const confirmationResult = await signInWithPhoneNumber(
        auth,
        phone,
        recaptchaVerifierRef.current
      );
      
      setConfirmationResult(confirmationResult);
      setOtpSent(true);
    } catch (error: any) {
      console.error('Error sending OTP:', error);
      alert(`Failed to send verification code: ${error.message}`);
      
      // Reset reCAPTCHA on error
      if (recaptchaVerifierRef.current) {
        recaptchaVerifierRef.current.clear();
        recaptchaVerifierRef.current = new RecaptchaVerifier(auth, 'recaptcha-container', {
          size: 'invisible',
          callback: () => console.log('reCAPTCHA solved'),
          'expired-callback': () => console.log('reCAPTCHA expired')
        });
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <main className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-green-50 relative overflow-hidden">
        {/* Backdrop */}
        <div className="absolute inset-0">
          <div className="absolute top-20 left-10 w-72 h-72 bg-gradient-to-br from-green-200 to-green-300 opacity-20 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute top-40 right-20 w-96 h-96 bg-gradient-to-br from-blue-200 to-blue-300 opacity-20 rounded-full blur-3xl animate-pulse delay-1000"></div>
          <div className="absolute bottom-20 left-1/3 w-64 h-64 bg-gradient-to-br from-purple-200 to-purple-300 opacity-20 rounded-full blur-2xl animate-pulse delay-2000"></div>
        </div>

        <motion.div {...fadeUp} className="relative z-10 max-w-4xl mx-auto px-4 py-12">
          <SilverBar />
          <div className="pt-6 text-center mb-4">
            <h1 className="text-4xl font-bold text-[color:var(--brand-green,#0B4422)]">{copy.title}</h1>
            <p className="text-slate-600 text-lg mt-2">{copy.tagline}</p>
          </div>

          {!otpSent && !submitted ? (
            <form onSubmit={handleSubmit} className="space-y-6 bg-white/80 backdrop-blur-sm p-8 rounded-2xl border border-green-100 shadow-lg">
              {/* Common Fields */}
              <div className="space-y-6">
                <div className="flex flex-col">
                  <label className="mb-1 font-semibold text-slate-700 flex items-center gap-2">
                    <User className="h-4 w-4" /> {t('growwithuscommon.interest.form.name_label')}
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    className="rounded-lg border-slate-300 shadow-sm focus:ring-2 focus:ring-green-600"
                    placeholder={t('growwithuscommon.interest.form.name_placeholder')}
                  />
                </div>

                <div className="flex flex-col">
                  <label className="mb-1 font-semibold text-slate-700 flex items-center gap-2">
                    <Mail className="h-4 w-4" /> {t('growwithuscommon.interest.form.email_label')}
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="rounded-lg border-slate-300 shadow-sm focus:ring-2 focus:ring-green-600"
                    placeholder={t('growwithuscommon.interest.form.email_placeholder')}
                  />
                </div>

                <div className="flex flex-col">
                  <label className="mb-1 font-semibold text-slate-700 flex items-center gap-2">
                    <Phone className="h-4 w-4" /> {t('growwithuscommon.interest.form.phone_label')}
                  </label>
                  <div className="flex gap-2">
                    <CountryCodeSelector
                      value={countryCode}
                      onChange={setCountryCode}
                    />
                    <input
                      type="tel"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      required
                      className="flex-1 rounded-lg border-slate-300 shadow-sm focus:ring-2 focus:ring-green-600"
                      placeholder={t('growwithuscommon.interest.form.phone_placeholder')}
                    />
                  </div>
                </div>
              </div>

              {/* Role-Specific Fields */}
              {(role === "investor" || role === "investors") && (
                <div className="bg-gradient-to-r from-blue-50 to-cyan-50 p-8 rounded-2xl border border-blue-100">
                  <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
                    <DollarSign className="h-6 w-6 text-blue-600" />
                    {t('growwithuscommon.interest.form.investor_details')}
                  </h3>
                  <div className="space-y-6">
                    <div className="grid sm:grid-cols-2 gap-6">
                      <div className="flex flex-col">
                        <label className="mb-3 text-lg font-semibold text-slate-700">{t('growwithuscommon.interest.form.investment_stage')}</label>
                        <input
                          type="text"
                          value={investmentStage}
                          onChange={(e) => setInvestmentStage(e.target.value)}
                          placeholder={t('growwithuscommon.interest.form.investment_stage_placeholder')}
                          className="w-full px-6 py-4 text-lg border-2 border-slate-200 rounded-xl shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                        />
                      </div>
                      <div className="flex flex-col">
                        <label className="mb-3 text-lg font-semibold text-slate-700">{t('growwithuscommon.interest.form.ticket_size')}</label>
                        <input
                          type="text"
                          value={ticketSize}
                          onChange={(e) => setTicketSize(e.target.value)}
                          placeholder={t('growwithuscommon.interest.form.ticket_size_placeholder')}
                          className="w-full px-6 py-4 text-lg border-2 border-slate-200 rounded-xl shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                        />
                      </div>
                    </div>
                    <div className="flex flex-col">
                      <label className="mb-3 text-lg font-semibold text-slate-700">{t('growwithuscommon.interest.form.invest_timeline')}</label>
                      <input
                        type="text"
                        value={investTimeline}
                        onChange={(e) => setInvestTimeline(e.target.value)}
                        placeholder={t('growwithuscommon.interest.form.invest_timeline_placeholder')}
                        className="w-full px-6 py-4 text-lg border-2 border-slate-200 rounded-xl shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                      />
                    </div>
                  </div>
                </div>
              )}

              {(role === "promoter" || role === "promoters") && (
                <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-8 rounded-2xl border border-purple-100">
                  <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
                    <Globe className="h-6 w-6 text-purple-600" />
                    {t('growwithuscommon.interest.form.promoter_details')}
                  </h3>
                  <div className="space-y-6">
                    <div className="grid sm:grid-cols-2 gap-6">
                      <div className="flex flex-col">
                        <label className="mb-3 text-lg font-semibold text-slate-700">{t('growwithuscommon.interest.form.platforms')}</label>
                        <input
                          type="text"
                          value={platforms}
                          onChange={(e) => setPlatforms(e.target.value)}
                          placeholder={t('growwithuscommon.interest.form.platforms_placeholder')}
                          className="w-full px-6 py-4 text-lg border-2 border-slate-200 rounded-xl shadow-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200"
                        />
                      </div>
                      <div className="flex flex-col">
                        <label className="mb-3 text-lg font-semibold text-slate-700">{t('growwithuscommon.interest.form.audience')}</label>
                        <input
                          type="text"
                          value={audience}
                          onChange={(e) => setAudience(e.target.value)}
                          placeholder={t('growwithuscommon.interest.form.audience_placeholder')}
                          className="w-full px-6 py-4 text-lg border-2 border-slate-200 rounded-xl shadow-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200"
                        />
                      </div>
                    </div>
                    <div className="flex flex-col">
                      <label className="mb-3 text-lg font-semibold text-slate-700">{t('growwithuscommon.interest.form.sample_links')}</label>
                      <input
                        type="text"
                        value={sampleLinks}
                        onChange={(e) => setSampleLinks(e.target.value)}
                        placeholder={t('growwithuscommon.interest.form.sample_links_placeholder')}
                        className="w-full px-6 py-4 text-lg border-2 border-slate-200 rounded-xl shadow-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200"
                      />
                    </div>
                  </div>
                </div>
              )}

              {(role === "ambassador" || role === "ambassadors") && (
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-8 rounded-2xl border border-green-100">
                  <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
                    <Users className="h-6 w-6 text-green-600" />
                    {t('growwithuscommon.interest.form.ambassador_details')}
                  </h3>
                  <div className="space-y-6">
                    <div className="grid sm:grid-cols-2 gap-6">
                      <div className="flex flex-col">
                        <label className="mb-3 text-lg font-semibold text-slate-700">{t('growwithuscommon.interest.form.community')}</label>
                        <input
                          type="text"
                          value={community}
                          onChange={(e) => setCommunity(e.target.value)}
                          placeholder={t('growwithuscommon.interest.form.community_placeholder')}
                          className="w-full px-6 py-4 text-lg border-2 border-slate-200 rounded-xl shadow-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200"
                        />
                      </div>
                      <div className="flex flex-col">
                        <label className="mb-3 text-lg font-semibold text-slate-700">{t('growwithuscommon.interest.form.region')}</label>
                        <input
                          type="text"
                          value={region}
                          onChange={(e) => setRegion(e.target.value)}
                          placeholder={t('growwithuscommon.interest.form.region_placeholder')}
                          className="w-full px-6 py-4 text-lg border-2 border-slate-200 rounded-xl shadow-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200"
                        />
                      </div>
                    </div>
                    <div className="flex flex-col">
                      <label className="mb-3 text-lg font-semibold text-slate-700">{t('growwithuscommon.interest.form.activities')}</label>
                      <input
                        type="text"
                        value={activities}
                        onChange={(e) => setActivities(e.target.value)}
                        placeholder={t('growwithuscommon.interest.form.activities_placeholder')}
                        className="w-full px-6 py-4 text-lg border-2 border-slate-200 rounded-xl shadow-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200"
                      />
                    </div>
                  </div>
                </div>
              )}

              {(role === "creator" || role === "collaborators") && (
                <div className="bg-gradient-to-r from-rose-50 to-pink-50 p-8 rounded-2xl border border-rose-100">
                  <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
                    <Sparkles className="h-6 w-6 text-rose-600" />
                    {t('growwithuscommon.interest.form.creator_details')}
                  </h3>
                  <div className="space-y-6">
                    <div className="grid sm:grid-cols-2 gap-6">
                      <div className="flex flex-col">
                        <label className="mb-3 text-lg font-semibold text-slate-700">{t('growwithuscommon.interest.form.craft_area')}</label>
                        <input
                          type="text"
                          value={craftArea}
                          onChange={(e) => setCraftArea(e.target.value)}
                          placeholder={t('growwithuscommon.interest.form.craft_area_placeholder')}
                          className="w-full px-6 py-4 text-lg border-2 border-slate-200 rounded-xl shadow-sm focus:ring-2 focus:ring-pink-500 focus:border-pink-500 transition-all duration-200"
                        />
                      </div>
                      <div className="flex flex-col">
                        <label className="mb-3 text-lg font-semibold text-slate-700">{t('growwithuscommon.interest.form.portfolio')}</label>
                        <input
                          type="text"
                          value={portfolio}
                          onChange={(e) => setPortfolio(e.target.value)}
                          placeholder={t('growwithuscommon.interest.form.portfolio_placeholder')}
                          className="w-full px-6 py-4 text-lg border-2 border-slate-200 rounded-xl shadow-sm focus:ring-2 focus:ring-pink-500 focus:border-pink-500 transition-all duration-200"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {(role === "affiliate" || role === "affiliates") && (
                <div className="bg-gradient-to-r from-orange-50 to-amber-50 p-8 rounded-2xl border border-orange-100">
                  <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
                    <Wallet className="h-6 w-6 text-orange-600" />
                    {t('growwithuscommon.interest.form.affiliate_details')}
                  </h3>
                  <div className="space-y-6">
                    <div className="grid sm:grid-cols-2 gap-6">
                      <div className="flex flex-col">
                        <label className="mb-3 text-lg font-semibold text-slate-700">{t('growwithuscommon.interest.form.affiliate_channels')}</label>
                        <input
                          type="text"
                          value={affiliateChannels}
                          onChange={(e) => setAffiliateChannels(e.target.value)}
                          placeholder={t('growwithuscommon.interest.form.affiliate_channels_placeholder')}
                          className="w-full px-6 py-4 text-lg border-2 border-slate-200 rounded-xl shadow-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all duration-200"
                        />
                      </div>
                      <div className="flex flex-col">
                        <label className="mb-3 text-lg font-semibold text-slate-700">{t('growwithuscommon.interest.form.traffic_estimate')}</label>
                        <input
                          type="text"
                          value={trafficEstimate}
                          onChange={(e) => setTrafficEstimate(e.target.value)}
                          placeholder={t('growwithuscommon.interest.form.traffic_estimate_placeholder')}
                          className="w-full px-6 py-4 text-lg border-2 border-slate-200 rounded-xl shadow-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all duration-200"
                        />
                      </div>
                    </div>
                    <div className="flex flex-col">
                      <label className="mb-3 text-lg font-semibold text-slate-700">{t('growwithuscommon.interest.form.payout_preference')}</label>
                      <input
                        type="text"
                        value={payoutPref}
                        onChange={(e) => setPayoutPref(e.target.value)}
                        placeholder={t('growwithuscommon.interest.form.payout_preference_placeholder')}
                        className="w-full px-6 py-4 text-lg border-2 border-slate-200 rounded-xl shadow-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all duration-200"
                      />
                    </div>
                  </div>
                </div>
              )}

              {(role === "referral" || role === "referrals") && (
                <div className="bg-gradient-to-r from-indigo-50 to-purple-50 p-8 rounded-2xl border border-indigo-100">
                  <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
                    <LinkIcon className="h-6 w-6 text-indigo-600" />
                    {t('growwithuscommon.interest.form.referral_details')}
                  </h3>
                  <div className="space-y-6">
                    <div className="grid sm:grid-cols-2 gap-6">
                      <div className="flex flex-col">
                        <label className="mb-3 text-lg font-semibold text-slate-700">{t('growwithuscommon.interest.form.person_name')}</label>
                        <input
                          type="text"
                          value={refName}
                          onChange={(e) => setRefName(e.target.value)}
                          placeholder={t('growwithuscommon.interest.form.person_name_placeholder')}
                          className="w-full px-6 py-4 text-lg border-2 border-slate-200 rounded-xl shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200"
                        />
                      </div>
                      <div className="flex flex-col">
                        <label className="mb-3 text-lg font-semibold text-slate-700">{t('growwithuscommon.interest.form.person_email')}</label>
                        <input
                          type="email"
                          value={refEmail}
                          onChange={(e) => setRefEmail(e.target.value)}
                          placeholder={t('growwithuscommon.interest.form.person_email_placeholder')}
                          className="w-full px-6 py-4 text-lg border-2 border-slate-200 rounded-xl shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200"
                        />
                      </div>
                    </div>
                    <div className="flex flex-col">
                      <label className="mb-3 text-lg font-semibold text-slate-700">{t('growwithuscommon.interest.form.relationship')}</label>
                      <input
                        type="text"
                        value={relationship}
                        onChange={(e) => setRelationship(e.target.value)}
                        placeholder={t('growwithuscommon.interest.form.relationship_placeholder')}
                        className="w-full px-6 py-4 text-lg border-2 border-slate-200 rounded-xl shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Notes */}
              <div className="flex flex-col">
                <label className="mb-1 font-semibold text-slate-700 flex items-center gap-2">
                  <FileText className="h-4 w-4" /> {t('growwithuscommon.interest.form.notes_label')}
                </label>
                <textarea
                  rows={4}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="rounded-lg border-slate-300 shadow-sm focus:ring-2 focus:ring-green-600"
                  placeholder={t('growwithuscommon.interest.form.notes_placeholder')}
                />
              </div>

              <div className="pt-2 flex items-center justify-between text-sm text-slate-500">
                <p>
                  {t('growwithuscommon.interest.form.privacy_notice')}
                </p>
              </div>

              <div id="recaptcha-container"></div>
              <button
                type="submit"
                disabled={!canSubmit}
                className="mt-1 inline-flex items-center gap-2 rounded-full bg-[color:var(--brand-green,#0B4422)] text-white px-6 py-3 text-base font-semibold shadow hover:bg-green-900 transition-colors disabled:opacity-50"
              >
                {t('growwithuscommon.interest.form.submit_button')} <ArrowRight className="h-4 w-4" />
              </button>
            </form>
          ) : otpSent && !submitted ? (
            <div className="text-center space-y-6">
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-8 rounded-2xl border border-blue-100">
                <h2 className="text-2xl font-bold text-slate-800 mb-4">{t('growwithuscommon.interest.otp.title')}</h2>
                <p className="text-slate-600 mb-6">
                  {t('growwithuscommon.interest.otp.message')} <strong>{phone}</strong>
                </p>
                <div className="max-w-xs mx-auto">
                  <input
                    type="text"
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value)}
                    placeholder={t('growwithuscommon.interest.otp.placeholder')}
                    className="w-full px-6 py-4 text-lg border-2 border-slate-200 rounded-xl shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-center"
                    maxLength={6}
                  />
                </div>
                <button
                  onClick={verifyOtp}
                  disabled={!otpCode.trim() || verifyingOtp}
                  className="mt-4 inline-flex items-center gap-2 rounded-full bg-blue-600 text-white px-6 py-3 text-base font-semibold shadow hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  {verifyingOtp ? t('growwithuscommon.interest.otp.verifying') : t('growwithuscommon.interest.otp.verify_button')} <CheckCircle className="h-4 w-4" />
                </button>
              </div>
            </div>
          ) : (
            <motion.div {...fadeUp} className="flex flex-col items-center text-center space-y-4">
              <CheckCircle className="h-12 w-12 text-green-600" />
              <h2 className="text-2xl font-bold text-[color:var(--brand-green,#0B4422)]">
                {role === "investor" && t('growwithuscommon.interest.success.investor')}
                {role === "promoter" && t('growwithuscommon.interest.success.promoter')}
                {role === "ambassador" && t('growwithuscommon.interest.success.ambassador')}
                {role === "creator" && t('growwithuscommon.interest.success.creator')}
                {role === "affiliate" && t('growwithuscommon.interest.success.affiliate')}
                {role === "referral" && t('growwithuscommon.interest.success.referral')}
              </h2>
              <p className="text-slate-600 max-w-md">
                {t('growwithuscommon.interest.success.message')}
              </p>
            </motion.div>
          )}
        </motion.div>
      </main>
      <Footer />
    </>
  );
}