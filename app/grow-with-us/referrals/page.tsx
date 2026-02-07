'use client';

import React from 'react';
import {
  Gift,
  Globe2,
  Music,
  Sparkles,
  RefreshCw,
  Star,
  Share2,
  Users,
  Target,
  Heart,
  Waves,
  Eye,
  ArrowRight,
  MessageCircle,
  Award,
  CheckCircle,
  Send,
  TrendingUp,
  Lightbulb,
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
      <div className="p-3 rounded-xl bg-gradient-to-br from-blue-50 to-blue-100 text-blue-600 group-hover:scale-110 transition-transform duration-300 flex-shrink-0">
        {icon}
      </div>
      <div className="flex-1">
        <h3 className="text-lg font-bold text-[color:var(--brand-green,#0B4422)] mb-2">{title}</h3>
        <p className="text-slate-600 leading-relaxed text-sm mb-3">{description}</p>
        {example && (
          <div className="bg-slate-50 p-3 rounded-lg border-l-4 border-blue-400">
            <p className="text-xs text-slate-700 italic">"{example}"</p>
          </div>
        )}
      </div>
    </div>
  </div>
);

export default function ReferralsPage() {
  const { t } = useLanguage(['growwithus2']);

  return (
    <>
      <main className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 relative overflow-hidden">
        {/* Background Elements */}
        <div className="absolute inset-0">
          <div className="absolute top-20 left-10 w-72 h-72 bg-gradient-to-br from-blue-200 to-blue-300 opacity-20 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute top-40 right-20 w-96 h-96 bg-gradient-to-br from-cyan-200 to-cyan-300 opacity-20 rounded-full blur-3xl animate-pulse delay-1000"></div>
          <div className="absolute bottom-20 left-1/3 w-64 h-64 bg-gradient-to-br from-teal-200 to-teal-300 opacity-20 rounded-full blur-2xl animate-pulse delay-2000"></div>
        </div>

        {/* HERO SECTION */}
        <section className="relative pt-16 pb-8 overflow-hidden">
          <SilverBar />
          <div className="relative z-10 mx-auto max-w-7xl px-6 pt-12 pb-4">
            <div className="text-center mb-8">
              <div className="inline-flex items-center gap-2 text-blue-700 font-semibold mb-4 px-6 py-3 bg-blue-50 rounded-full border border-blue-200">
                <Gift className="h-5 w-5" /> {t('growwithus2.referrals.hero.badge')}
              </div>
              <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight text-[color:var(--brand-green,#0B4422)] mb-4">
                {t('growwithus2.referrals.hero.title')}
              </h1>
              <p className="text-xl leading-relaxed text-slate-700 mb-6 max-w-4xl mx-auto">
                {t('growwithus2.referrals.hero.subtitle')}
              </p>
              <div className="flex flex-wrap justify-center gap-4">
                <a
                  href="/grow-with-us/interest?role=referrals"
                  className="inline-flex items-center gap-3 rounded-2xl bg-gradient-to-r from-[color:var(--brand-green,#0B4422)] to-emerald-700 text-white px-8 py-4 text-lg font-bold shadow-xl hover:shadow-2xl hover:-translate-y-1 transition-all duration-300"
                >
                  {t('growwithus2.referrals.hero.cta')} <ArrowRight className="h-5 w-5" />
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* WHY MATTER */}
        <section className="py-4 px-6 relative z-10">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-8">
              <h2 className="text-4xl font-bold text-[color:var(--brand-green,#0B4422)] mb-4">
                {t('growwithus2.referrals.why_matter.title')}
              </h2>
              <p className="text-xl text-slate-600 max-w-4xl mx-auto leading-relaxed">
                {t('growwithus2.referrals.why_matter.subtitle')}
              </p>
            </div>

              <FeatureCard
              icon={<Waves className="h-6 w-6" />}
              title="Ripple Effect"
              description={t('growwithus2.referrals.why_matter.ripple_effect')}
              example={t('growwithus2.referrals.why_matter.example')}
            />

            {/* CTA 1 */}
            <div className="text-center bg-gradient-to-r from-blue-50 to-cyan-50 p-6 rounded-2xl border border-blue-200 mt-8">
              <h3 className="text-xl font-bold text-[color:var(--brand-green,#0B4422)] mb-2">
                {t('growwithus2.referrals.why_matter.cta_title')}
              </h3>
              <p className="text-slate-600 mb-4">{t('growwithus2.referrals.why_matter.cta_desc')}</p>
              <a
                href="/grow-with-us/interest?role=referrals"
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[color:var(--brand-green,#0B4422)] to-emerald-700 text-white px-6 py-3 font-bold shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
              >
                {t('growwithus2.referrals.why_matter.cta_button')} <ArrowRight className="h-4 w-4" />
              </a>
            </div>
          </div>
        </section>

        {/* HOW IT WORKS */}
        <section className="py-4 px-6 relative z-10">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-8">
              <h2 className="text-4xl font-bold text-[color:var(--brand-green,#0B4422)] mb-4">
                {t('growwithus2.referrals.how_it_works.title')}
              </h2>
              <p className="text-xl text-slate-600 leading-relaxed">
                {t('growwithus2.referrals.how_it_works.subtitle')}
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-6 mb-8">
              <div className="bg-white/70 backdrop-blur-sm p-6 rounded-xl border border-blue-200">
                <div className="text-3xl font-bold text-blue-600 mb-3">1</div>
                <h3 className="font-bold text-[color:var(--brand-green,#0B4422)] mb-2">
                  {t('growwithus2.referrals.how_it_works.step1_title')}
                </h3>
                <p className="text-slate-600 text-sm">
                  {t('growwithus2.referrals.how_it_works.step1_desc')}
                </p>
              </div>

              <div className="bg-white/70 backdrop-blur-sm p-6 rounded-xl border border-blue-200">
                <div className="text-3xl font-bold text-blue-600 mb-3">2</div>
                <h3 className="font-bold text-[color:var(--brand-green,#0B4422)] mb-2">
                  {t('growwithus2.referrals.how_it_works.step2_title')}
                </h3>
                <p className="text-slate-600 text-sm">
                  {t('growwithus2.referrals.how_it_works.step2_desc')}
                </p>
              </div>

              <div className="bg-white/70 backdrop-blur-sm p-6 rounded-xl border border-blue-200">
                <div className="text-3xl font-bold text-blue-600 mb-3">3</div>
                <h3 className="font-bold text-[color:var(--brand-green,#0B4422)] mb-2">
                  {t('growwithus2.referrals.how_it_works.step3_title')}
                </h3>
                <p className="text-slate-600 text-sm">
                  {t('growwithus2.referrals.how_it_works.step3_desc')}
                </p>
              </div>
            </div>

            <div className="bg-gradient-to-r from-blue-100 to-cyan-100 p-6 rounded-xl border border-blue-300 mb-8 text-center">
              <p className="text-lg text-slate-800 italic font-semibold">
                💡 {t('growwithus2.referrals.how_it_works.philosophy')}
              </p>
            </div>

            {/* CTA 2 */}
            <div className="text-center bg-gradient-to-r from-blue-50 to-cyan-50 p-6 rounded-2xl border border-blue-200">
              <h3 className="text-xl font-bold text-[color:var(--brand-green,#0B4422)] mb-2">
                {t('growwithus2.referrals.how_it_works.cta_title')}
              </h3>
              <p className="text-slate-600 mb-4">{t('growwithus2.referrals.how_it_works.cta_desc')}</p>
              <a
                href="/grow-with-us/interest?role=referrals"
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 text-white px-6 py-3 font-bold shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
              >
                {t('growwithus2.referrals.how_it_works.cta_button')} <ArrowRight className="h-4 w-4" />
              </a>
            </div>
          </div>
        </section>

        {/* MAKE A DIFFERENCE */}
        <section className="py-8 px-6 bg-gradient-to-r from-blue-50 to-cyan-50 relative z-10">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-8">
              <h2 className="text-4xl font-bold text-[color:var(--brand-green,#0B4422)] mb-4">
                {t('growwithus2.referrals.make_difference.title')}
              </h2>
              <p className="text-xl text-slate-600 leading-relaxed">
                {t('growwithus2.referrals.make_difference.subtitle')}
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8 mb-8">
              <FeatureCard
                icon={<Heart className="h-6 w-6" />}
                title={t('growwithus2.referrals.make_difference.feature1_title')}
                description={t('growwithus2.referrals.make_difference.feature1_desc')}
              />
              <FeatureCard
                icon={<Music className="h-6 w-6" />}
                title={t('growwithus2.referrals.make_difference.feature2_title')}
                description={t('growwithus2.referrals.make_difference.feature2_desc')}
              />
              <FeatureCard
                icon={<Waves className="h-6 w-6" />}
                title={t('growwithus2.referrals.make_difference.feature3_title')}
                description={t('growwithus2.referrals.make_difference.feature3_desc')}
              />
              <FeatureCard
                icon={<Globe2 className="h-6 w-6" />}
                title={t('growwithus2.referrals.make_difference.feature4_title')}
                description={t('growwithus2.referrals.make_difference.feature4_desc')}
                example={t('growwithus2.referrals.make_difference.example')}
              />
            </div>

            {/* CTA 3 */}
            <div className="text-center bg-gradient-to-r from-emerald-50 to-green-50 p-6 rounded-2xl border border-emerald-200">
              <h3 className="text-xl font-bold text-[color:var(--brand-green,#0B4422)] mb-2">
                {t('growwithus2.referrals.make_difference.cta_title')}
              </h3>
              <p className="text-slate-600 mb-4">{t('growwithus2.referrals.make_difference.cta_desc')}</p>
              <a
                href="/grow-with-us/interest?role=referrals"
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-green-600 text-white px-6 py-3 font-bold shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
              >
                {t('growwithus2.referrals.make_difference.cta_button')} <ArrowRight className="h-4 w-4" />
              </a>
            </div>
          </div>
        </section>

        {/* GLOBAL REACH */}
        <section className="py-8 px-6 relative z-10">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-8">
              <h2 className="text-4xl font-bold text-[color:var(--brand-green,#0B4422)] mb-4">
                {t('growwithus2.referrals.global_reach.title')}
              </h2>
              <p className="text-xl text-slate-600 leading-relaxed">
                {t('growwithus2.referrals.global_reach.subtitle')}
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-6 mb-8">
              <div className="bg-gradient-to-br from-teal-50 to-cyan-50 p-6 rounded-xl border border-teal-200">
                <p className="text-slate-700">{t('growwithus2.referrals.global_reach.feature1')}</p>
              </div>
              <div className="bg-gradient-to-br from-teal-50 to-cyan-50 p-6 rounded-xl border border-teal-200">
                <p className="text-slate-700">{t('growwithus2.referrals.global_reach.feature2')}</p>
              </div>
              <div className="bg-gradient-to-br from-teal-50 to-cyan-50 p-6 rounded-xl border border-teal-200">
                <p className="text-slate-700">{t('growwithus2.referrals.global_reach.impact')}</p>
              </div>
            </div>

            {/* CTA 4 */}
            <div className="text-center bg-gradient-to-r from-teal-50 to-cyan-50 p-6 rounded-2xl border border-teal-200">
              <h3 className="text-xl font-bold text-[color:var(--brand-green,#0B4422)] mb-2">
                {t('growwithus2.referrals.global_reach.cta_title')}
              </h3>
              <p className="text-slate-600 mb-4">{t('growwithus2.referrals.global_reach.cta_desc')}</p>
              <a
                href="/grow-with-us/interest?role=referrals"
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-teal-600 to-cyan-600 text-white px-6 py-3 font-bold shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
              >
                {t('growwithus2.referrals.global_reach.cta_button')} <ArrowRight className="h-4 w-4" />
              </a>
            </div>
          </div>
        </section>

        {/* UNIQUE HOOKS */}
        <section className="py-8 px-6 bg-gradient-to-r from-indigo-50 to-blue-50 relative z-10">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-8">
              <h2 className="text-4xl font-bold text-[color:var(--brand-green,#0B4422)] mb-4">
                {t('growwithus2.referrals.unique_hooks.title')}
              </h2>
              <p className="text-xl text-slate-600 leading-relaxed">
                {t('growwithus2.referrals.unique_hooks.subtitle')}
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-6 mb-8">
              <FeatureCard
                icon={<Music className="h-6 w-6" />}
                title={t('growwithus2.referrals.unique_hooks.hook1_title')}
                description={t('growwithus2.referrals.unique_hooks.hook1_desc')}
              />
              <FeatureCard
                icon={<RefreshCw className="h-6 w-6" />}
                title={t('growwithus2.referrals.unique_hooks.hook2_title')}
                description={t('growwithus2.referrals.unique_hooks.hook2_desc')}
              />
              <FeatureCard
                icon={<Send className="h-6 w-6" />}
                title={t('growwithus2.referrals.unique_hooks.hook3_title')}
                description={t('growwithus2.referrals.unique_hooks.hook3_desc')}
                example={t('growwithus2.referrals.unique_hooks.example')}
              />
            </div>

            {/* CTA 5 */}
            <div className="text-center bg-gradient-to-r from-indigo-50 to-blue-50 p-6 rounded-2xl border border-indigo-200">
              <h3 className="text-xl font-bold text-[color:var(--brand-green,#0B4422)] mb-2">
                {t('growwithus2.referrals.unique_hooks.cta_title')}
              </h3>
              <p className="text-slate-600 mb-4">{t('growwithus2.referrals.unique_hooks.cta_desc')}</p>
              <a
                href="/grow-with-us/interest?role=referrals"
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 text-white px-6 py-3 font-bold shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
              >
                {t('growwithus2.referrals.unique_hooks.cta_button')} <ArrowRight className="h-4 w-4" />
              </a>
            </div>
          </div>
        </section>

        {/* REGULAR UPDATES */}
        <section className="py-8 px-6 relative z-10">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-8">
              <h2 className="text-4xl font-bold text-[color:var(--brand-green,#0B4422)] mb-4">
                {t('growwithus2.referrals.regular_updates.title')}
              </h2>
              <p className="text-xl text-slate-600 leading-relaxed">
                {t('growwithus2.referrals.regular_updates.subtitle')}
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-6 mb-8">
              <FeatureCard
                icon={<Sparkles className="h-6 w-6" />}
                title={t('growwithus2.referrals.regular_updates.feature1_title')}
                description={t('growwithus2.referrals.regular_updates.feature1_desc')}
              />
              <FeatureCard
                icon={<RefreshCw className="h-6 w-6" />}
                title={t('growwithus2.referrals.regular_updates.feature2_title')}
                description={t('growwithus2.referrals.regular_updates.feature2_desc')}
              />
              <FeatureCard
                icon={<Target className="h-6 w-6" />}
                title={t('growwithus2.referrals.regular_updates.feature3_title')}
                description={t('growwithus2.referrals.regular_updates.feature3_desc')}
              />
            </div>

            <div className="bg-gradient-to-r from-slate-100 to-gray-100 p-6 rounded-xl border border-slate-300 mb-8 text-center">
              <p className="text-lg text-slate-800 italic font-semibold">
                {t('growwithus2.referrals.regular_updates.philosophy')}
              </p>
            </div>

            {/* CTA 6 */}
            <div className="text-center bg-gradient-to-r from-slate-50 to-gray-50 p-6 rounded-2xl border border-slate-200">
              <h3 className="text-xl font-bold text-[color:var(--brand-green,#0B4422)] mb-2">
                {t('growwithus2.referrals.regular_updates.cta_title')}
              </h3>
              <p className="text-slate-600 mb-4">{t('growwithus2.referrals.regular_updates.cta_desc')}</p>
              <a
                href="/grow-with-us/interest?role=referrals"
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-slate-600 to-gray-600 text-white px-6 py-3 font-bold shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
              >
                {t('growwithus2.referrals.regular_updates.cta_button')} <ArrowRight className="h-4 w-4" />
              </a>
            </div>
          </div>
        </section>

        {/* WHAT YOU GET & EXPECTATIONS */}
        <section className="py-8 px-6 bg-gradient-to-r from-amber-50 to-yellow-50 relative z-10">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-8">
              <h2 className="text-4xl font-bold text-[color:var(--brand-green,#0B4422)] mb-4">
                {t('growwithus2.referrals.what_you_get.title')}
              </h2>
              <p className="text-xl text-slate-600 leading-relaxed">
                {t('growwithus2.referrals.what_you_get.subtitle')}
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8 mb-6">
              <div className="bg-gradient-to-r from-emerald-50 to-green-50 p-6 rounded-2xl border border-emerald-200">
                <h3 className="text-lg font-bold text-[color:var(--brand-green,#0B4422)] mb-4">Benefits</h3>
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <Gift className="h-5 w-5 text-emerald-600 mt-1 flex-shrink-0" />
                    <div>
                      <p className="font-semibold text-slate-700">{t('growwithus2.referrals.what_you_get.feature1_title')}</p>
                      <p className="text-slate-600 text-sm">{t('growwithus2.referrals.what_you_get.feature1_desc')}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Eye className="h-5 w-5 text-emerald-600 mt-1 flex-shrink-0" />
                    <div>
                      <p className="font-semibold text-slate-700">{t('growwithus2.referrals.what_you_get.feature2_title')}</p>
                      <p className="text-slate-600 text-sm">{t('growwithus2.referrals.what_you_get.feature2_desc')}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Award className="h-5 w-5 text-emerald-600 mt-1 flex-shrink-0" />
                    <div>
                      <p className="font-semibold text-slate-700">{t('growwithus2.referrals.what_you_get.feature3_title')}</p>
                      <p className="text-slate-600 text-sm">{t('growwithus2.referrals.what_you_get.feature3_desc')}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-r from-amber-50 to-orange-50 p-6 rounded-2xl border border-amber-200">
                <h3 className="text-lg font-bold text-[color:var(--brand-green,#0B4422)] mb-2">
                  {t('growwithus2.referrals.expectations.title')}
                </h3>
                <p className="text-slate-600 text-sm mb-4">
                  {t('growwithus2.referrals.expectations.subtitle')}
                </p>
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-amber-600 mt-1 flex-shrink-0" />
                    <span className="text-slate-700">
                      {t('growwithus2.referrals.expectations.expectation1')}
                    </span>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-amber-600 mt-1 flex-shrink-0" />
                    <span className="text-slate-700">
                      {t('growwithus2.referrals.expectations.expectation2')}
                    </span>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-amber-600 mt-1 flex-shrink-0" />
                    <span className="text-slate-700">
                      {t('growwithus2.referrals.expectations.expectation3')}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-r from-amber-100 to-orange-100 p-6 rounded-xl border border-amber-300 mb-8 text-center">
              <p className="text-lg text-slate-800 italic font-semibold">
                {t('growwithus2.referrals.what_you_get.bigger_reward')}
              </p>
            </div>

            {/* Expectations CTA */}
            <div className="text-center bg-gradient-to-r from-amber-50 to-orange-50 p-6 rounded-2xl border border-amber-200 mb-8">
              <h3 className="text-xl font-bold text-[color:var(--brand-green,#0B4422)] mb-2">
                {t('growwithus2.referrals.expectations.cta_title')}
              </h3>
              <p className="text-slate-600 mb-4">{t('growwithus2.referrals.expectations.cta_desc')}</p>
              <a
                href="/grow-with-us/interest?role=referrals"
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 text-white px-6 py-3 font-bold shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
              >
                {t('growwithus2.referrals.expectations.cta_button')} <ArrowRight className="h-4 w-4" />
              </a>
            </div>

            {/* What You Get CTA */}
            <div className="text-center bg-gradient-to-r from-emerald-50 to-green-50 p-6 rounded-2xl border border-emerald-200">
              <h3 className="text-xl font-bold text-[color:var(--brand-green,#0B4422)] mb-2">
                {t('growwithus2.referrals.what_you_get.cta_title')}
              </h3>
              <p className="text-slate-600 mb-4">{t('growwithus2.referrals.what_you_get.cta_desc')}</p>
              <a
                href="/grow-with-us/interest?role=referrals"
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-green-600 text-white px-6 py-3 font-bold shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
              >
                {t('growwithus2.referrals.what_you_get.cta_button')} <ArrowRight className="h-4 w-4" />
              </a>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="py-8 px-6 relative z-10">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-8">
              <h2 className="text-4xl font-bold text-[color:var(--brand-green,#0B4422)] mb-4">
                {t('growwithus2.referrals.faq.title')}
              </h2>
              <p className="text-xl text-slate-600 leading-relaxed">
                {t('growwithus2.referrals.faq.subtitle')}
              </p>
              </div>

            <div className="space-y-4 mb-6">
              <div className="bg-white/80 backdrop-blur-sm p-6 rounded-2xl border border-blue-200">
                  <h3 className="text-lg font-bold text-[color:var(--brand-green,#0B4422)] mb-3">
                  {t('growwithus2.referrals.faq.q1')}
                  </h3>
                <p className="text-slate-600">{t('growwithus2.referrals.faq.a1')}</p>
                </div>

              <div className="bg-white/80 backdrop-blur-sm p-6 rounded-2xl border border-blue-200">
                  <h3 className="text-lg font-bold text-[color:var(--brand-green,#0B4422)] mb-3">
                  {t('growwithus2.referrals.faq.q2')}
                  </h3>
                <p className="text-slate-600">{t('growwithus2.referrals.faq.a2')}</p>
                </div>

              <div className="bg-white/80 backdrop-blur-sm p-6 rounded-2xl border border-blue-200">
                  <h3 className="text-lg font-bold text-[color:var(--brand-green,#0B4422)] mb-3">
                  {t('growwithus2.referrals.faq.q3')}
                  </h3>
                <p className="text-slate-600">{t('growwithus2.referrals.faq.a3')}</p>
                </div>

              <div className="bg-white/80 backdrop-blur-sm p-6 rounded-2xl border border-blue-200">
                  <h3 className="text-lg font-bold text-[color:var(--brand-green,#0B4422)] mb-3">
                  {t('growwithus2.referrals.faq.q4')}
                  </h3>
                <p className="text-slate-600">{t('growwithus2.referrals.faq.a4')}</p>
              </div>
            </div>

            {/* CTA 8 */}
            <div className="text-center bg-gradient-to-r from-cyan-50 to-teal-50 p-6 rounded-2xl border border-cyan-200">
              <h3 className="text-xl font-bold text-[color:var(--brand-green,#0B4422)] mb-2">
                {t('growwithus2.referrals.faq.cta_title')}
              </h3>
              <p className="text-slate-600 mb-4">{t('growwithus2.referrals.faq.cta_desc')}</p>
              <a
                href="/contact"
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-600 to-teal-600 text-white px-6 py-3 font-bold shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
              >
                {t('growwithus2.referrals.faq.cta_button')} <MessageCircle className="h-4 w-4" />
              </a>
            </div>
          </div>
        </section>

        {/* CLOSING CTA */}
        <section className="py-8 px-6 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-4xl font-bold text-[color:var(--brand-green,#0B4422)] mb-4">
              {t('growwithus2.referrals.closing.title')}
            </h2>
            <p className="text-xl text-slate-600 mb-6 leading-relaxed">
              {t('growwithus2.referrals.closing.subtitle')}
            </p>
            <p className="text-lg text-slate-600 mb-6">
              {t('growwithus2.referrals.closing.description')}
            </p>
            <div className="flex flex-wrap justify-center gap-6">
              <a
                href="/grow-with-us/interest?role=referrals"
                className="inline-flex items-center gap-3 rounded-2xl bg-gradient-to-r from-[color:var(--brand-green,#0B4422)] to-emerald-700 text-white px-10 py-5 text-xl font-bold shadow-2xl hover:shadow-3xl hover:-translate-y-2 transition-all duration-300"
              >
                {t('growwithus2.referrals.closing.cta')} <ArrowRight className="h-6 w-6" />
              </a>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}