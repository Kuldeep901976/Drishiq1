'use client';

import React from 'react';
import {
  TrendingUp,
  Globe2,
  Music,
  Sparkles,
  RefreshCw,
  Gift,
  Star,
  Shield,
  Clock,
  CheckCircle,
  Zap,
  ArrowRight,
  MessageCircle,
  Calendar,
  Award,
  Users,
  BarChart3,
  Target,
  Heart,
  Waves,
  Eye,
  DollarSign,
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
      <div className="p-2 rounded-lg bg-gradient-to-br from-blue-50 to-blue-100 text-blue-600 group-hover:scale-110 transition-transform duration-300">
        {icon}
      </div>
      <h3 className="font-bold text-[color:var(--brand-green,#0B4422)]">{title}</h3>
    </div>
    <p className="text-slate-600 text-sm leading-relaxed">{description}</p>
  </div>
);

export default function InvestorsPage() {
  const { t } = useLanguage(['growwithus2']);

  return (
    <>
      <main className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 relative overflow-hidden">
        {/* Background Elements */}
        <div className="absolute inset-0">
          <div className="absolute top-20 left-10 w-72 h-72 bg-gradient-to-br from-blue-200 to-blue-300 opacity-20 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute top-40 right-20 w-96 h-96 bg-gradient-to-br from-indigo-200 to-indigo-300 opacity-20 rounded-full blur-3xl animate-pulse delay-1000"></div>
          <div className="absolute bottom-20 left-1/3 w-64 h-64 bg-gradient-to-br from-purple-200 to-purple-300 opacity-20 rounded-full blur-2xl animate-pulse delay-2000"></div>
        </div>

        {/* HERO SECTION */}
        <section className="relative pt-16 pb-8 overflow-hidden">
          <SilverBar />
          <div className="relative z-10 mx-auto max-w-7xl px-6 pt-12 pb-4">
            <div className="text-center mb-8">
              <div className="inline-flex items-center gap-2 text-blue-700 font-semibold mb-4 px-6 py-3 bg-blue-50 rounded-full border border-blue-200">
                <TrendingUp className="h-5 w-5" /> {t('growwithus2.investors.hero.badge')}
              </div>
              <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight text-[color:var(--brand-green,#0B4422)] mb-4">
                {t('growwithus2.investors.hero.title')}
              </h1>
              <p className="text-xl leading-relaxed text-slate-700 mb-6 max-w-4xl mx-auto">
                {t('growwithus2.investors.hero.subtitle')}
              </p>
              <div className="flex flex-wrap justify-center gap-4">
                <a
                  href="/grow-with-us/interest?role=investors"
                  className="inline-flex items-center gap-3 rounded-2xl bg-gradient-to-r from-[color:var(--brand-green,#0B4422)] to-emerald-700 text-white px-8 py-4 text-lg font-bold shadow-xl hover:shadow-2xl hover:-translate-y-1 transition-all duration-300"
                >
                  {t('growwithus2.investors.hero.cta')} <ArrowRight className="h-5 w-5" />
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* WHY INVEST IN DRISHIQ */}
        <section className="py-4 px-6 relative z-10">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-8">
              <h2 className="text-4xl font-bold text-[color:var(--brand-green,#0B4422)] mb-4">
                {t('growwithus2.investors.why_invest.title')}
              </h2>
              <p className="text-xl text-slate-600 max-w-4xl mx-auto leading-relaxed">
                {t('growwithus2.investors.why_invest.subtitle')}
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8 mb-8">
              <FeatureCard
                icon={<Users className="h-6 w-6" />}
                title={t('growwithus2.investors.why_invest.retention_title')}
                description={t('growwithus2.investors.why_invest.retention_desc')}
                example={t('growwithus2.investors.why_invest.retention_example')}
              />
              <FeatureCard
                icon={<Globe2 className="h-6 w-6" />}
                title={t('growwithus2.investors.why_invest.global_title')}
                description={t('growwithus2.investors.why_invest.global_desc')}
                example={t('growwithus2.investors.why_invest.global_example')}
              />
              <FeatureCard
                icon={<TrendingUp className="h-6 w-6" />}
                title={t('growwithus2.investors.why_invest.mission_title')}
                description={t('growwithus2.investors.why_invest.mission_desc')}
              />
            </div>

            {/* CTA 1 */}
            <div className="text-center bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-2xl border border-blue-200">
              <h3 className="text-xl font-bold text-[color:var(--brand-green,#0B4422)] mb-2">
                {t('growwithus2.investors.why_invest.cta_title')}
              </h3>
              <p className="text-slate-600 mb-4">{t('growwithus2.investors.why_invest.cta_desc')}</p>
              <a
                href="/grow-with-us/interest?role=investors"
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[color:var(--brand-green,#0B4422)] to-emerald-700 text-white px-6 py-3 font-bold shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
              >
                {t('growwithus2.investors.why_invest.cta_button')} <ArrowRight className="h-4 w-4" />
              </a>
            </div>
          </div>
        </section>

        {/* OUR APPROACH */}
        <section className="py-8 px-6 relative z-10">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-8">
              <h2 className="text-4xl font-bold text-[color:var(--brand-green,#0B4422)] mb-4">
                {t('growwithus2.investors.approach.title')}
              </h2>
              <p className="text-xl text-slate-600 leading-relaxed">
                {t('growwithus2.investors.approach.subtitle')}
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-6 mb-8">
              <BenefitCard
                icon={<Heart className="h-5 w-5" />}
                title={t('growwithus2.investors.approach.principle1_title')}
                description={t('growwithus2.investors.approach.principle1_desc')}
              />
              <BenefitCard
                icon={<Sparkles className="h-5 w-5" />}
                title={t('growwithus2.investors.approach.principle2_title')}
                description={t('growwithus2.investors.approach.principle2_desc')}
              />
              <BenefitCard
                icon={<RefreshCw className="h-5 w-5" />}
                title={t('growwithus2.investors.approach.principle3_title')}
                description={t('growwithus2.investors.approach.principle3_desc')}
              />
              <BenefitCard
                icon={<Globe2 className="h-5 w-5" />}
                title={t('growwithus2.investors.approach.principle4_title')}
                description={t('growwithus2.investors.approach.principle4_desc')}
              />
              <BenefitCard
                icon={<BarChart3 className="h-5 w-5" />}
                title={t('growwithus2.investors.approach.principle5_title')}
                description={t('growwithus2.investors.approach.principle5_desc')}
              />
              <BenefitCard
                icon={<Shield className="h-5 w-5" />}
                title={t('growwithus2.investors.approach.principle6_title')}
                description={t('growwithus2.investors.approach.principle6_desc')}
              />
            </div>

            {/* CTA 2 */}
            <div className="text-center bg-gradient-to-r from-indigo-50 to-purple-50 p-6 rounded-2xl border border-indigo-200">
              <h3 className="text-xl font-bold text-[color:var(--brand-green,#0B4422)] mb-2">
                {t('growwithus2.investors.approach.cta_title')}
              </h3>
              <p className="text-slate-600 mb-4">{t('growwithus2.investors.approach.cta_desc')}</p>
              <a
                href="/grow-with-us/interest?role=investors"
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-3 font-bold shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
              >
                {t('growwithus2.investors.approach.cta_button')} <ArrowRight className="h-4 w-4" />
              </a>
            </div>
          </div>
        </section>

        {/* MARKET OPPORTUNITY */}
        <section className="py-8 px-6 bg-gradient-to-r from-cyan-50 to-blue-50 relative z-10">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-8">
              <h2 className="text-4xl font-bold text-[color:var(--brand-green,#0B4422)] mb-4">
                {t('growwithus2.investors.opportunity.title')}
              </h2>
              <p className="text-xl text-slate-600 leading-relaxed">
                {t('growwithus2.investors.opportunity.subtitle')}
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8 mb-8">
              <FeatureCard
                icon={<Target className="h-6 w-6" />}
                title={t('growwithus2.investors.opportunity.market1_title')}
                description={t('growwithus2.investors.opportunity.market1_desc')}
                example={t('growwithus2.investors.opportunity.market1_example')}
              />
              <FeatureCard
                icon={<TrendingUp className="h-6 w-6" />}
                title={t('growwithus2.investors.opportunity.market2_title')}
                description={t('growwithus2.investors.opportunity.market2_desc')}
                example={t('growwithus2.investors.opportunity.market2_example')}
              />
              <FeatureCard
                icon={<Music className="h-6 w-6" />}
                title={t('growwithus2.investors.opportunity.market3_title')}
                description={t('growwithus2.investors.opportunity.market3_desc')}
                example={t('growwithus2.investors.opportunity.market3_example')}
              />
              <FeatureCard
                icon={<DollarSign className="h-6 w-6" />}
                title={t('growwithus2.investors.opportunity.market4_title')}
                description={t('growwithus2.investors.opportunity.market4_desc')}
                example={t('growwithus2.investors.opportunity.market4_example')}
              />
            </div>

            {/* CTA 3 */}
            <div className="text-center bg-gradient-to-r from-emerald-50 to-green-50 p-6 rounded-2xl border border-emerald-200">
              <h3 className="text-xl font-bold text-[color:var(--brand-green,#0B4422)] mb-2">
                {t('growwithus2.investors.opportunity.cta_title')}
              </h3>
              <p className="text-slate-600 mb-4">{t('growwithus2.investors.opportunity.cta_desc')}</p>
              <a
                href="/grow-with-us/interest?role=investors"
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-green-600 text-white px-6 py-3 font-bold shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
              >
                {t('growwithus2.investors.opportunity.cta_button')} <ArrowRight className="h-4 w-4" />
              </a>
            </div>
          </div>
        </section>

        {/* WHAT WE'RE BUILDING */}
        <section className="py-8 px-6 relative z-10">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-8">
              <h2 className="text-4xl font-bold text-[color:var(--brand-green,#0B4422)] mb-4">
                {t('growwithus2.investors.building.title')}
              </h2>
              <p className="text-xl text-slate-600 leading-relaxed">
                {t('growwithus2.investors.building.subtitle')}
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8 mb-8">
              <FeatureCard
                icon={<Waves className="h-6 w-6" />}
                title={t('growwithus2.investors.building.feature1_title')}
                description={t('growwithus2.investors.building.feature1_desc')}
                example={t('growwithus2.investors.building.feature1_example')}
              />
              <FeatureCard
                icon={<Music className="h-6 w-6" />}
                title={t('growwithus2.investors.building.feature2_title')}
                description={t('growwithus2.investors.building.feature2_desc')}
                example={t('growwithus2.investors.building.feature2_example')}
              />
              <FeatureCard
                icon={<Globe2 className="h-6 w-6" />}
                title={t('growwithus2.investors.building.feature3_title')}
                description={t('growwithus2.investors.building.feature3_desc')}
                example={t('growwithus2.investors.building.feature3_example')}
              />
              <FeatureCard
                icon={<Award className="h-6 w-6" />}
                title={t('growwithus2.investors.building.feature4_title')}
                description={t('growwithus2.investors.building.feature4_desc')}
                example={t('growwithus2.investors.building.feature4_example')}
              />
            </div>

            {/* CTA 4 */}
            <div className="text-center bg-gradient-to-r from-blue-50 to-cyan-50 p-6 rounded-2xl border border-blue-200">
              <h3 className="text-xl font-bold text-[color:var(--brand-green,#0B4422)] mb-2">
                {t('growwithus2.investors.building.cta_title')}
              </h3>
              <p className="text-slate-600 mb-4">{t('growwithus2.investors.building.cta_desc')}</p>
              <a
                href="/grow-with-us/interest?role=investors"
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 text-white px-6 py-3 font-bold shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
              >
                {t('growwithus2.investors.building.cta_button')} <ArrowRight className="h-4 w-4" />
              </a>
            </div>
          </div>
        </section>

        {/* PARTNERSHIP BENEFITS */}
        <section className="py-8 px-6 bg-gradient-to-r from-purple-50 to-pink-50 relative z-10">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-8">
              <h2 className="text-4xl font-bold text-[color:var(--brand-green,#0B4422)] mb-4">
                {t('growwithus2.investors.benefits.title')}
              </h2>
              <p className="text-xl text-slate-600 leading-relaxed">
                {t('growwithus2.investors.benefits.subtitle')}
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8 mb-8">
              <FeatureCard
                icon={<BarChart3 className="h-6 w-6" />}
                title={t('growwithus2.investors.benefits.benefit1_title')}
                description={t('growwithus2.investors.benefits.benefit1_desc')}
                example={t('growwithus2.investors.benefits.benefit1_example')}
              />
              <FeatureCard
                icon={<Users className="h-6 w-6" />}
                title={t('growwithus2.investors.benefits.benefit2_title')}
                description={t('growwithus2.investors.benefits.benefit2_desc')}
                example={t('growwithus2.investors.benefits.benefit2_example')}
              />
              <FeatureCard
                icon={<Star className="h-6 w-6" />}
                title={t('growwithus2.investors.benefits.benefit3_title')}
                description={t('growwithus2.investors.benefits.benefit3_desc')}
                example={t('growwithus2.investors.benefits.benefit3_example')}
              />
              <FeatureCard
                icon={<Target className="h-6 w-6" />}
                title={t('growwithus2.investors.benefits.benefit4_title')}
                description={t('growwithus2.investors.benefits.benefit4_desc')}
                example={t('growwithus2.investors.benefits.benefit4_example')}
              />
            </div>

            {/* CTA 5 */}
            <div className="text-center bg-gradient-to-r from-indigo-50 to-purple-50 p-6 rounded-2xl border border-indigo-200">
              <h3 className="text-xl font-bold text-[color:var(--brand-green,#0B4422)] mb-2">
                {t('growwithus2.investors.benefits.cta_title')}
              </h3>
              <p className="text-slate-600 mb-4">{t('growwithus2.investors.benefits.cta_desc')}</p>
              <a
                href="/grow-with-us/interest?role=investors"
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-3 font-bold shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
              >
                {t('growwithus2.investors.benefits.cta_button')} <ArrowRight className="h-4 w-4" />
              </a>
            </div>
          </div>
        </section>

        {/* EXPECTATIONS & FAQ */}
        <section className="py-8 px-6 relative z-10">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-8">
              <h2 className="text-4xl font-bold text-[color:var(--brand-green,#0B4422)] mb-4">
                {t('growwithus2.investors.expectations.title')}
              </h2>
              <p className="text-xl text-slate-600 leading-relaxed">
                {t('growwithus2.investors.expectations.subtitle')}
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8 mb-6">
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-2xl border border-blue-200">
                <h3 className="text-xl font-bold text-[color:var(--brand-green,#0B4422)] mb-4">
                  {t('growwithus2.investors.expectations.for_investors_title')}
                </h3>
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-blue-600 mt-1 flex-shrink-0" />
                    <span className="text-slate-700">
                      <strong>{t('growwithus2.investors.expectations.expectation1_title')}</strong> —{' '}
                      {t('growwithus2.investors.expectations.expectation1_desc')}
                    </span>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-blue-600 mt-1 flex-shrink-0" />
                    <span className="text-slate-700">
                      <strong>{t('growwithus2.investors.expectations.expectation2_title')}</strong> —{' '}
                      {t('growwithus2.investors.expectations.expectation2_desc')}
                    </span>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-blue-600 mt-1 flex-shrink-0" />
                    <span className="text-slate-700">
                      <strong>{t('growwithus2.investors.expectations.expectation3_title')}</strong> —{' '}
                      {t('growwithus2.investors.expectations.expectation3_desc')}
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="bg-white/80 backdrop-blur-sm p-6 rounded-2xl border border-blue-200">
                  <h3 className="text-lg font-bold text-[color:var(--brand-green,#0B4422)] mb-3">
                    {t('growwithus2.investors.expectations.faq1_q')}
                  </h3>
                  <p className="text-slate-600">{t('growwithus2.investors.expectations.faq1_a')}</p>
                </div>

                <div className="bg-white/80 backdrop-blur-sm p-6 rounded-2xl border border-blue-200">
                  <h3 className="text-lg font-bold text-[color:var(--brand-green,#0B4422)] mb-3">
                    {t('growwithus2.investors.expectations.faq2_q')}
                  </h3>
                  <p className="text-slate-600">{t('growwithus2.investors.expectations.faq2_a')}</p>
                </div>

                <div className="bg-white/80 backdrop-blur-sm p-6 rounded-2xl border border-blue-200">
                  <h3 className="text-lg font-bold text-[color:var(--brand-green,#0B4422)] mb-3">
                    {t('growwithus2.investors.expectations.faq3_q')}
                  </h3>
                  <p className="text-slate-600">{t('growwithus2.investors.expectations.faq3_a')}</p>
                </div>

                <div className="bg-white/80 backdrop-blur-sm p-6 rounded-2xl border border-blue-200">
                  <h3 className="text-lg font-bold text-[color:var(--brand-green,#0B4422)] mb-3">
                    {t('growwithus2.investors.expectations.faq4_q')}
                  </h3>
                  <p className="text-slate-600">{t('growwithus2.investors.expectations.faq4_a')}</p>
                </div>

                <div className="bg-white/80 backdrop-blur-sm p-6 rounded-2xl border border-blue-200">
                  <h3 className="text-lg font-bold text-[color:var(--brand-green,#0B4422)] mb-3">
                    {t('growwithus2.investors.expectations.faq5_q')}
                  </h3>
                  <p className="text-slate-600">{t('growwithus2.investors.expectations.faq5_a')}</p>
                </div>
              </div>
            </div>

            {/* CTA 6 */}
            <div className="text-center bg-gradient-to-r from-cyan-50 to-teal-50 p-6 rounded-2xl border border-cyan-200">
              <h3 className="text-xl font-bold text-[color:var(--brand-green,#0B4422)] mb-2">
                {t('growwithus2.investors.expectations.cta_title')}
              </h3>
              <p className="text-slate-600 mb-4">{t('growwithus2.investors.expectations.cta_desc')}</p>
              <a
                href="/contact"
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-600 to-teal-600 text-white px-6 py-3 font-bold shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
              >
                {t('growwithus2.investors.expectations.cta_button')} <MessageCircle className="h-4 w-4" />
              </a>
            </div>
          </div>
        </section>

        {/* CLOSING CTA */}
        <section className="py-8 px-6 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-4xl font-bold text-[color:var(--brand-green,#0B4422)] mb-4">
              {t('growwithus2.investors.closing.title')}
            </h2>
            <p className="text-xl text-slate-600 mb-6 leading-relaxed">
              {t('growwithus2.investors.closing.subtitle')}
            </p>
            <p className="text-lg text-slate-600 mb-6">
              {t('growwithus2.investors.closing.description')}
            </p>
            <div className="flex flex-wrap justify-center gap-6">
              <a
                href="/grow-with-us/interest?role=investors"
                className="inline-flex items-center gap-3 rounded-2xl bg-gradient-to-r from-[color:var(--brand-green,#0B4422)] to-emerald-700 text-white px-10 py-5 text-xl font-bold shadow-2xl hover:shadow-3xl hover:-translate-y-2 transition-all duration-300"
              >
                {t('growwithus2.investors.closing.cta')} <ArrowRight className="h-6 w-6" />
              </a>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}