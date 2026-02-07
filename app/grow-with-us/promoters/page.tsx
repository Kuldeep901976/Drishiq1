'use client';

import React from 'react';
import {
  Megaphone,
  Globe2,
  Music,
  Sparkles,
  RefreshCw,
  Gift,
  Star,
  Share2,
  Users,
  BarChart3,
  Target,
  Heart,
  Waves,
  Eye,
  ArrowRight,
  MessageCircle,
  Calendar,
  Award,
  Zap,
  CheckCircle,
  Volume2,
  Send,
  TrendingUp,
} from 'lucide-react';
import Footer from '../../../components/Footer';
import { useLanguage } from '../../../lib/drishiq-i18n';

function SilverBar() {
  return (
    <div
      className="absolute inset-x-0 top-0 h-[3px]"
      style={{ background: 'linear-gradient(90deg, #c0c0c0, #e5e5e5, #c0c0c0)' }}
      aria-hidden
    />
  );
}

const FeatureCard = ({
  icon,
  title,
  description,
  example,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  example?: string;
}) => (
  <div className="group rounded-2xl bg-white/80 backdrop-blur-sm shadow-lg ring-1 ring-black/5 p-6 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 border border-gray-100">
    <div className="flex items-start gap-4">
      <div className="p-3 rounded-xl bg-gradient-to-br from-pink-50 to-pink-100 text-pink-600 group-hover:scale-110 transition-transform duration-300 flex-shrink-0">
        {icon}
      </div>
      <div className="flex-1">
        <h3 className="text-lg font-bold text-[color:var(--brand-green,#0B4422)] mb-2">{title}</h3>
        <p className="text-slate-600 leading-relaxed text-sm mb-3">{description}</p>
        {example && (
          <div className="bg-slate-50 p-3 rounded-lg border-l-4 border-pink-400">
            <p className="text-xs text-slate-700 italic">"{example}"</p>
          </div>
        )}
      </div>
    </div>
  </div>
);

const BenefitCard = ({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) => (
  <div className="group rounded-xl bg-white/70 backdrop-blur-sm shadow-md ring-1 ring-black/5 p-5 hover:shadow-lg hover:bg-white/90 transition-all duration-300">
    <div className="flex items-center gap-3 mb-3">
      <div className="p-2 rounded-lg bg-gradient-to-br from-pink-50 to-pink-100 text-pink-600 group-hover:scale-110 transition-transform duration-300">
        {icon}
      </div>
      <h3 className="font-bold text-[color:var(--brand-green,#0B4422)]">{title}</h3>
    </div>
    <p className="text-slate-600 text-sm leading-relaxed">{description}</p>
  </div>
);

export default function PromotersPage() {
  const { t } = useLanguage(['growwithus2']);

  return (
    <>
      <main className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-pink-50 relative overflow-hidden">
        {/* Background Elements */}
        <div className="absolute inset-0">
          <div className="absolute top-20 left-10 w-72 h-72 bg-gradient-to-br from-pink-200 to-pink-300 opacity-20 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute top-40 right-20 w-96 h-96 bg-gradient-to-br from-purple-200 to-purple-300 opacity-20 rounded-full blur-3xl animate-pulse delay-1000"></div>
          <div className="absolute bottom-20 left-1/3 w-64 h-64 bg-gradient-to-br from-indigo-200 to-indigo-300 opacity-20 rounded-full blur-2xl animate-pulse delay-2000"></div>
        </div>

        {/* HERO SECTION */}
        <section className="relative pt-16 pb-8 overflow-hidden">
          <SilverBar />
          <div className="relative z-10 mx-auto max-w-7xl px-6 pt-12 pb-4">
            <div className="text-center mb-8">
              <div className="inline-flex items-center gap-2 text-pink-700 font-semibold mb-4 px-6 py-3 bg-pink-50 rounded-full border border-pink-200">
                <Megaphone className="h-5 w-5" /> {t('growwithus2.promoters.hero.badge')}
              </div>
              <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight text-[color:var(--brand-green,#0B4422)] mb-4">
                {t('growwithus2.promoters.hero.title')}
              </h1>
              <p className="text-xl leading-relaxed text-slate-700 mb-6 max-w-4xl mx-auto">
                {t('growwithus2.promoters.hero.subtitle')}
              </p>
              <div className="flex flex-wrap justify-center gap-4">
                <a
                  href="/grow-with-us/interest?role=promoters"
                  className="inline-flex items-center gap-3 rounded-2xl bg-gradient-to-r from-[color:var(--brand-green,#0B4422)] to-emerald-700 text-white px-8 py-4 text-lg font-bold shadow-xl hover:shadow-2xl hover:-translate-y-1 transition-all duration-300"
                >
                  {t('growwithus2.promoters.hero.cta')} <ArrowRight className="h-5 w-5" />
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* WHY PROMOTE DRISHIQ */}
        <section className="py-4 px-6 relative z-10">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-8">
              <h2 className="text-4xl font-bold text-[color:var(--brand-green,#0B4422)] mb-4">
                {t('growwithus2.promoters.why_promote.title')}
              </h2>
              <p className="text-xl text-slate-600 max-w-4xl mx-auto leading-relaxed">
                {t('growwithus2.promoters.why_promote.subtitle')}
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8 mb-8">
              <FeatureCard
                icon={<Heart className="h-6 w-6" />}
                title={t('growwithus2.promoters.why_promote.ripple_title')}
                description={t('growwithus2.promoters.why_promote.ripple_desc')}
                example={t('growwithus2.promoters.why_promote.ripple_example')}
              />
              <FeatureCard
                icon={<Share2 className="h-6 w-6" />}
                title={t('growwithus2.promoters.why_promote.authentic_title')}
                description={t('growwithus2.promoters.why_promote.authentic_desc')}
                example={t('growwithus2.promoters.why_promote.authentic_example')}
              />
            </div>

            {/* CTA 1 */}
            <div className="text-center bg-gradient-to-r from-pink-50 to-purple-50 p-6 rounded-2xl border border-pink-200">
              <h3 className="text-xl font-bold text-[color:var(--brand-green,#0B4422)] mb-2">
                {t('growwithus2.promoters.why_promote.cta_title')}
              </h3>
              <p className="text-slate-600 mb-4">{t('growwithus2.promoters.why_promote.cta_desc')}</p>
              <a
                href="/grow-with-us/interest?role=promoters"
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[color:var(--brand-green,#0B4422)] to-emerald-700 text-white px-6 py-3 font-bold shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
              >
                {t('growwithus2.promoters.why_promote.cta_button')} <ArrowRight className="h-4 w-4" />
              </a>
            </div>
          </div>
        </section>

        {/* WHAT PROMOTERS DO */}
        <section className="py-8 px-6 relative z-10">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-8">
              <h2 className="text-4xl font-bold text-[color:var(--brand-green,#0B4422)] mb-4">
                {t('growwithus2.promoters.what_do.title')}
              </h2>
              <p className="text-xl text-slate-600 leading-relaxed">
                {t('growwithus2.promoters.what_do.subtitle')}
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-6 mb-8">
              <BenefitCard
                icon={<Share2 className="h-5 w-5" />}
                title={t('growwithus2.promoters.what_do.activity1_title')}
                description={t('growwithus2.promoters.what_do.activity1_desc')}
              />
              <BenefitCard
                icon={<Volume2 className="h-5 w-5" />}
                title={t('growwithus2.promoters.what_do.activity2_title')}
                description={t('growwithus2.promoters.what_do.activity2_desc')}
              />
              <BenefitCard
                icon={<Music className="h-5 w-5" />}
                title={t('growwithus2.promoters.what_do.activity3_title')}
                description={t('growwithus2.promoters.what_do.activity3_desc')}
              />
              <BenefitCard
                icon={<Send className="h-5 w-5" />}
                title={t('growwithus2.promoters.what_do.activity4_title')}
                description={t('growwithus2.promoters.what_do.activity4_desc')}
              />
              <BenefitCard
                icon={<Users className="h-5 w-5" />}
                title={t('growwithus2.promoters.what_do.activity5_title')}
                description={t('growwithus2.promoters.what_do.activity5_desc')}
              />
              <BenefitCard
                icon={<TrendingUp className="h-5 w-5" />}
                title={t('growwithus2.promoters.what_do.activity6_title')}
                description={t('growwithus2.promoters.what_do.activity6_desc')}
              />
            </div>

            {/* CTA 2 */}
            <div className="text-center bg-gradient-to-r from-purple-50 to-indigo-50 p-6 rounded-2xl border border-purple-200">
              <h3 className="text-xl font-bold text-[color:var(--brand-green,#0B4422)] mb-2">
                {t('growwithus2.promoters.what_do.cta_title')}
              </h3>
              <p className="text-slate-600 mb-4">{t('growwithus2.promoters.what_do.cta_desc')}</p>
              <a
                href="/grow-with-us/interest?role=promoters"
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-6 py-3 font-bold shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
              >
                {t('growwithus2.promoters.what_do.cta_button')} <ArrowRight className="h-4 w-4" />
              </a>
            </div>
          </div>
        </section>

        {/* WHO'S A GOOD FIT */}
        <section className="py-8 px-6 bg-gradient-to-r from-rose-50 to-pink-50 relative z-10">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-8">
              <h2 className="text-4xl font-bold text-[color:var(--brand-green,#0B4422)] mb-4">
                {t('growwithus2.promoters.good_fit.title')}
              </h2>
              <p className="text-xl text-slate-600 leading-relaxed">
                {t('growwithus2.promoters.good_fit.subtitle')}
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8 mb-8">
              <FeatureCard
                icon={<Heart className="h-6 w-6" />}
                title={t('growwithus2.promoters.good_fit.trait1_title')}
                description={t('growwithus2.promoters.good_fit.trait1_desc')}
                example={t('growwithus2.promoters.good_fit.trait1_example')}
              />
              <FeatureCard
                icon={<Users className="h-6 w-6" />}
                title={t('growwithus2.promoters.good_fit.trait2_title')}
                description={t('growwithus2.promoters.good_fit.trait2_desc')}
                example={t('growwithus2.promoters.good_fit.trait2_example')}
              />
              <FeatureCard
                icon={<Sparkles className="h-6 w-6" />}
                title={t('growwithus2.promoters.good_fit.trait3_title')}
                description={t('growwithus2.promoters.good_fit.trait3_desc')}
                example={t('growwithus2.promoters.good_fit.trait3_example')}
              />
              <FeatureCard
                icon={<Target className="h-6 w-6" />}
                title={t('growwithus2.promoters.good_fit.trait4_title')}
                description={t('growwithus2.promoters.good_fit.trait4_desc')}
                example={t('growwithus2.promoters.good_fit.trait4_example')}
              />
            </div>

            {/* CTA 3 */}
            <div className="text-center bg-gradient-to-r from-emerald-50 to-green-50 p-6 rounded-2xl border border-emerald-200">
              <h3 className="text-xl font-bold text-[color:var(--brand-green,#0B4422)] mb-2">
                {t('growwithus2.promoters.good_fit.cta_title')}
              </h3>
              <p className="text-slate-600 mb-4">{t('growwithus2.promoters.good_fit.cta_desc')}</p>
              <a
                href="/grow-with-us/interest?role=promoters"
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-green-600 text-white px-6 py-3 font-bold shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
              >
                {t('growwithus2.promoters.good_fit.cta_button')} <ArrowRight className="h-4 w-4" />
              </a>
            </div>
          </div>
        </section>

        {/* WHERE TO SHARE */}
        <section className="py-8 px-6 relative z-10">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-8">
              <h2 className="text-4xl font-bold text-[color:var(--brand-green,#0B4422)] mb-4">
                {t('growwithus2.promoters.where_share.title')}
              </h2>
              <p className="text-xl text-slate-600 leading-relaxed">
                {t('growwithus2.promoters.where_share.subtitle')}
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8 mb-8">
              <FeatureCard
                icon={<Send className="h-6 w-6" />}
                title={t('growwithus2.promoters.where_share.channel1_title')}
                description={t('growwithus2.promoters.where_share.channel1_desc')}
                example={t('growwithus2.promoters.where_share.channel1_example')}
              />
              <FeatureCard
                icon={<Share2 className="h-6 w-6" />}
                title={t('growwithus2.promoters.where_share.channel2_title')}
                description={t('growwithus2.promoters.where_share.channel2_desc')}
                example={t('growwithus2.promoters.where_share.channel2_example')}
              />
              <FeatureCard
                icon={<Globe2 className="h-6 w-6" />}
                title={t('growwithus2.promoters.where_share.channel3_title')}
                description={t('growwithus2.promoters.where_share.channel3_desc')}
                example={t('growwithus2.promoters.where_share.channel3_example')}
              />
              <FeatureCard
                icon={<Users className="h-6 w-6" />}
                title={t('growwithus2.promoters.where_share.channel4_title')}
                description={t('growwithus2.promoters.where_share.channel4_desc')}
                example={t('growwithus2.promoters.where_share.channel4_example')}
              />
            </div>

            {/* CTA 4 */}
            <div className="text-center bg-gradient-to-r from-blue-50 to-cyan-50 p-6 rounded-2xl border border-blue-200">
              <h3 className="text-xl font-bold text-[color:var(--brand-green,#0B4422)] mb-2">
                {t('growwithus2.promoters.where_share.cta_title')}
              </h3>
              <p className="text-slate-600 mb-4">{t('growwithus2.promoters.where_share.cta_desc')}</p>
              <a
                href="/grow-with-us/interest?role=promoters"
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 text-white px-6 py-3 font-bold shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
              >
                {t('growwithus2.promoters.where_share.cta_button')} <ArrowRight className="h-4 w-4" />
              </a>
            </div>
          </div>
        </section>

        {/* BENEFITS & EXPECTATIONS */}
        <section className="py-8 px-6 bg-gradient-to-r from-indigo-50 to-purple-50 relative z-10">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-8">
              <h2 className="text-4xl font-bold text-[color:var(--brand-green,#0B4422)] mb-4">
                {t('growwithus2.promoters.benefits.title')}
              </h2>
              <p className="text-xl text-slate-600 leading-relaxed">
                {t('growwithus2.promoters.benefits.subtitle')}
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8 mb-6">
              <div className="bg-gradient-to-r from-emerald-50 to-green-50 p-6 rounded-2xl border border-emerald-200">
                <h3 className="text-xl font-bold text-[color:var(--brand-green,#0B4422)] mb-4">
                  {t('growwithus2.promoters.benefits.what_you_get_title')}
                </h3>
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <Gift className="h-5 w-5 text-emerald-600 mt-1 flex-shrink-0" />
                    <span className="text-slate-700">
                      <strong>{t('growwithus2.promoters.benefits.benefit1_title')}</strong> —{' '}
                      {t('growwithus2.promoters.benefits.benefit1_desc')}
                    </span>
                  </div>
                  <div className="flex items-start gap-3">
                    <Eye className="h-5 w-5 text-emerald-600 mt-1 flex-shrink-0" />
                    <span className="text-slate-700">
                      <strong>{t('growwithus2.promoters.benefits.benefit2_title')}</strong> —{' '}
                      {t('growwithus2.promoters.benefits.benefit2_desc')}
                    </span>
                  </div>
                  <div className="flex items-start gap-3">
                    <Award className="h-5 w-5 text-emerald-600 mt-1 flex-shrink-0" />
                    <span className="text-slate-700">
                      <strong>{t('growwithus2.promoters.benefits.benefit3_title')}</strong> —{' '}
                      {t('growwithus2.promoters.benefits.benefit3_desc')}
                    </span>
                  </div>
                  <div className="flex items-start gap-3">
                    <Star className="h-5 w-5 text-emerald-600 mt-1 flex-shrink-0" />
                    <span className="text-slate-700">
                      <strong>{t('growwithus2.promoters.benefits.benefit4_title')}</strong> —{' '}
                      {t('growwithus2.promoters.benefits.benefit4_desc')}
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-r from-amber-50 to-orange-50 p-6 rounded-2xl border border-amber-200">
                <h3 className="text-xl font-bold text-[color:var(--brand-green,#0B4422)] mb-4">
                  {t('growwithus2.promoters.benefits.expectations_title')}
                </h3>
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-amber-600 mt-1 flex-shrink-0" />
                    <span className="text-slate-700">
                      {t('growwithus2.promoters.benefits.expectation1')}
                    </span>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-amber-600 mt-1 flex-shrink-0" />
                    <span className="text-slate-700">
                      {t('growwithus2.promoters.benefits.expectation2')}
                    </span>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-amber-600 mt-1 flex-shrink-0" />
                    <span className="text-slate-700">
                      {t('growwithus2.promoters.benefits.expectation3')}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* CTA 5 */}
            <div className="text-center bg-gradient-to-r from-emerald-50 to-green-50 p-6 rounded-2xl border border-emerald-200">
              <h3 className="text-xl font-bold text-[color:var(--brand-green,#0B4422)] mb-2">
                {t('growwithus2.promoters.benefits.cta_title')}
              </h3>
              <p className="text-slate-600 mb-4">{t('growwithus2.promoters.benefits.cta_desc')}</p>
              <a
                href="/grow-with-us/interest?role=promoters"
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-green-600 text-white px-6 py-3 font-bold shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
              >
                {t('growwithus2.promoters.benefits.cta_button')} <ArrowRight className="h-4 w-4" />
              </a>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="py-8 px-6 relative z-10">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-8">
              <h2 className="text-4xl font-bold text-[color:var(--brand-green,#0B4422)] mb-4">
                {t('growwithus2.promoters.faq.title')}
              </h2>
              <p className="text-xl text-slate-600 leading-relaxed">
                {t('growwithus2.promoters.faq.subtitle')}
              </p>
            </div>

            <div className="space-y-4 mb-6">
              <div className="bg-white/80 backdrop-blur-sm p-6 rounded-2xl border border-pink-200">
                <h3 className="text-lg font-bold text-[color:var(--brand-green,#0B4422)] mb-3">
                  {t('growwithus2.promoters.faq.q1')}
                </h3>
                <p className="text-slate-600">{t('growwithus2.promoters.faq.a1')}</p>
              </div>

              <div className="bg-white/80 backdrop-blur-sm p-6 rounded-2xl border border-pink-200">
                <h3 className="text-lg font-bold text-[color:var(--brand-green,#0B4422)] mb-3">
                  {t('growwithus2.promoters.faq.q2')}
                </h3>
                <p className="text-slate-600">{t('growwithus2.promoters.faq.a2')}</p>
              </div>

              <div className="bg-white/80 backdrop-blur-sm p-6 rounded-2xl border border-pink-200">
                <h3 className="text-lg font-bold text-[color:var(--brand-green,#0B4422)] mb-3">
                  {t('growwithus2.promoters.faq.q3')}
                </h3>
                <p className="text-slate-600">{t('growwithus2.promoters.faq.a3')}</p>
              </div>

              <div className="bg-white/80 backdrop-blur-sm p-6 rounded-2xl border border-pink-200">
                <h3 className="text-lg font-bold text-[color:var(--brand-green,#0B4422)] mb-3">
                  {t('growwithus2.promoters.faq.q4')}
                </h3>
                <p className="text-slate-600">{t('growwithus2.promoters.faq.a4')}</p>
              </div>
            </div>

            {/* CTA 6 */}
            <div className="text-center bg-gradient-to-r from-cyan-50 to-teal-50 p-6 rounded-2xl border border-cyan-200">
              <h3 className="text-xl font-bold text-[color:var(--brand-green,#0B4422)] mb-2">
                {t('growwithus2.promoters.faq.cta_title')}
              </h3>
              <p className="text-slate-600 mb-4">{t('growwithus2.promoters.faq.cta_desc')}</p>
              <a
                href="/contact"
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-600 to-teal-600 text-white px-6 py-3 font-bold shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
              >
                {t('growwithus2.promoters.faq.cta_button')} <MessageCircle className="h-4 w-4" />
              </a>
            </div>
          </div>
        </section>

        {/* CLOSING CTA */}
        <section className="py-8 px-6 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-4xl font-bold text-[color:var(--brand-green,#0B4422)] mb-4">
              {t('growwithus2.promoters.closing.title')}
            </h2>
            <p className="text-xl text-slate-600 mb-6 leading-relaxed">
              {t('growwithus2.promoters.closing.subtitle')}
            </p>
            <p className="text-lg text-slate-600 mb-6">
              {t('growwithus2.promoters.closing.description')}
            </p>
            <div className="flex flex-wrap justify-center gap-6">
              <a
                href="/grow-with-us/interest?role=promoters"
                className="inline-flex items-center gap-3 rounded-2xl bg-gradient-to-r from-[color:var(--brand-green,#0B4422)] to-emerald-700 text-white px-10 py-5 text-xl font-bold shadow-2xl hover:shadow-3xl hover:-translate-y-2 transition-all duration-300"
              >
                {t('growwithus2.promoters.closing.cta')} <ArrowRight className="h-6 w-6" />
              </a>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
