'use client';

import React from 'react';
import {
  Users,
  Heart,
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
  Lightbulb,
  Waves,
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
      <div className="p-3 rounded-xl bg-gradient-to-br from-purple-50 to-purple-100 text-purple-600 group-hover:scale-110 transition-transform duration-300 flex-shrink-0">
        {icon}
      </div>
      <div className="flex-1">
        <h3 className="text-lg font-bold text-[color:var(--brand-green,#0B4422)] mb-2">{title}</h3>
        <p className="text-slate-600 leading-relaxed text-sm mb-3">{description}</p>
        {example && (
          <div className="bg-slate-50 p-3 rounded-lg border-l-4 border-purple-400">
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
      <div className="p-2 rounded-lg bg-gradient-to-br from-purple-50 to-purple-100 text-purple-600 group-hover:scale-110 transition-transform duration-300">
        {icon}
      </div>
      <h3 className="font-bold text-[color:var(--brand-green,#0B4422)]">{title}</h3>
    </div>
    <p className="text-slate-600 text-sm leading-relaxed">{description}</p>
  </div>
);

export default function AmbassadorsPage() {
  const { t } = useLanguage(['growwithus1']);

  return (
    <>
      <main className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-purple-50 relative overflow-hidden">
        {/* Background Elements */}
        <div className="absolute inset-0">
          <div className="absolute top-20 left-10 w-72 h-72 bg-gradient-to-br from-purple-200 to-purple-300 opacity-20 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute top-40 right-20 w-96 h-96 bg-gradient-to-br from-pink-200 to-pink-300 opacity-20 rounded-full blur-3xl animate-pulse delay-1000"></div>
          <div className="absolute bottom-20 left-1/3 w-64 h-64 bg-gradient-to-br from-emerald-200 to-emerald-300 opacity-20 rounded-full blur-2xl animate-pulse delay-2000"></div>
        </div>

        {/* HERO SECTION */}
        <section className="relative pt-16 pb-8 overflow-hidden">
          <SilverBar />
          <div className="relative z-10 mx-auto max-w-7xl px-6 pt-12 pb-4">
            <div className="text-center mb-8">
              <div className="inline-flex items-center gap-2 text-purple-700 font-semibold mb-4 px-6 py-3 bg-purple-50 rounded-full border border-purple-200">
                <Users className="h-5 w-5" /> {t('growwithus1.ambassadors.hero.badge')}
              </div>
              <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight text-[color:var(--brand-green,#0B4422)] mb-4">
                {t('growwithus1.ambassadors.hero.title')}
              </h1>
              <p className="text-xl leading-relaxed text-slate-700 mb-6 max-w-4xl mx-auto">
                {t('growwithus1.ambassadors.hero.subtitle')}
              </p>
              <div className="flex flex-wrap justify-center gap-4">
                <a
                  href="/grow-with-us/interest?role=ambassadors"
                  className="inline-flex items-center gap-3 rounded-2xl bg-gradient-to-r from-[color:var(--brand-green,#0B4422)] to-emerald-700 text-white px-8 py-4 text-lg font-bold shadow-xl hover:shadow-2xl hover:-translate-y-1 transition-all duration-300"
                >
                  {t('growwithus1.ambassadors.hero.cta')} <ArrowRight className="h-5 w-5" />
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* WHY AMBASSADORS MATTER */}
        <section className="py-4 px-6 relative z-10">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-8">
              <h2 className="text-4xl font-bold text-[color:var(--brand-green,#0B4422)] mb-4">
                {t('growwithus1.ambassadors.why_ambassadors.title')}
              </h2>
              <p className="text-xl text-slate-600 max-w-4xl mx-auto leading-relaxed">
                {t('growwithus1.ambassadors.why_ambassadors.subtitle')}
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8 mb-8">
              <FeatureCard
                icon={<Heart className="h-6 w-6" />}
                title={t('growwithus1.ambassadors.why_ambassadors.cultural_title')}
                description={t('growwithus1.ambassadors.why_ambassadors.cultural_desc')}
                example={t('growwithus1.ambassadors.why_ambassadors.cultural_example')}
              />
              <FeatureCard
                icon={<Globe2 className="h-6 w-6" />}
                title={t('growwithus1.ambassadors.why_ambassadors.connection_title')}
                description={t('growwithus1.ambassadors.why_ambassadors.connection_desc')}
                example={t('growwithus1.ambassadors.why_ambassadors.connection_example')}
              />
            </div>

            {/* CTA 1 */}
            <div className="text-center bg-gradient-to-r from-purple-50 to-pink-50 p-6 rounded-2xl border border-purple-200">
              <h3 className="text-xl font-bold text-[color:var(--brand-green,#0B4422)] mb-2">
                {t('growwithus1.ambassadors.why_ambassadors.cta_title')}
              </h3>
              <p className="text-slate-600 mb-4">
                {t('growwithus1.ambassadors.why_ambassadors.cta_desc')}
              </p>
              <a
                href="/grow-with-us/interest?role=ambassadors"
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[color:var(--brand-green,#0B4422)] to-emerald-700 text-white px-6 py-3 font-bold shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
              >
                {t('growwithus1.ambassadors.why_ambassadors.cta_button')}{' '}
                <ArrowRight className="h-4 w-4" />
              </a>
            </div>
          </div>
        </section>

        {/* HOW IT WORKS */}
        <section className="py-8 px-6 bg-gradient-to-r from-purple-50 to-pink-50 relative z-10">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-8">
              <h2 className="text-4xl font-bold text-[color:var(--brand-green,#0B4422)] mb-4">
                {t('growwithus1.ambassadors.how_it_works.title')}
              </h2>
              <p className="text-xl text-slate-600 leading-relaxed">
                {t('growwithus1.ambassadors.how_it_works.subtitle')}
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className="bg-white/80 backdrop-blur-sm p-6 rounded-2xl shadow-lg border border-purple-200 hover:shadow-xl transition-all duration-300">
                <div className="bg-gradient-to-br from-purple-500 to-purple-600 text-white rounded-xl p-3 w-12 h-12 flex items-center justify-center font-bold text-lg mb-4">
                  1
                </div>
                <h3 className="text-lg font-bold text-[color:var(--brand-green,#0B4422)] mb-3">
                  {t('growwithus1.ambassadors.how_it_works.step1_title')}
                </h3>
                <p className="text-slate-600 text-sm">
                  {t('growwithus1.ambassadors.how_it_works.step1_desc')}
                </p>
              </div>

              <div className="bg-white/80 backdrop-blur-sm p-6 rounded-2xl shadow-lg border border-purple-200 hover:shadow-xl transition-all duration-300">
                <div className="bg-gradient-to-br from-purple-500 to-purple-600 text-white rounded-xl p-3 w-12 h-12 flex items-center justify-center font-bold text-lg mb-4">
                  2
                </div>
                <h3 className="text-lg font-bold text-[color:var(--brand-green,#0B4422)] mb-3">
                  {t('growwithus1.ambassadors.how_it_works.step2_title')}
                </h3>
                <p className="text-slate-600 text-sm">
                  {t('growwithus1.ambassadors.how_it_works.step2_desc')}
                </p>
              </div>

              <div className="bg-white/80 backdrop-blur-sm p-6 rounded-2xl shadow-lg border border-purple-200 hover:shadow-xl transition-all duration-300">
                <div className="bg-gradient-to-br from-purple-500 to-purple-600 text-white rounded-xl p-3 w-12 h-12 flex items-center justify-center font-bold text-lg mb-4">
                  3
                </div>
                <h3 className="text-lg font-bold text-[color:var(--brand-green,#0B4422)] mb-3">
                  {t('growwithus1.ambassadors.how_it_works.step3_title')}
                </h3>
                <p className="text-slate-600 text-sm">
                  {t('growwithus1.ambassadors.how_it_works.step3_desc')}
                </p>
              </div>

              <div className="bg-white/80 backdrop-blur-sm p-6 rounded-2xl shadow-lg border border-purple-200 hover:shadow-xl transition-all duration-300">
                <div className="bg-gradient-to-br from-purple-500 to-purple-600 text-white rounded-xl p-3 w-12 h-12 flex items-center justify-center font-bold text-lg mb-4">
                  4
                </div>
                <h3 className="text-lg font-bold text-[color:var(--brand-green,#0B4422)] mb-3">
                  {t('growwithus1.ambassadors.how_it_works.step4_title')}
                </h3>
                <p className="text-slate-600 text-sm">
                  {t('growwithus1.ambassadors.how_it_works.step4_desc')}
                </p>
              </div>
            </div>

            <div className="bg-gradient-to-r from-amber-50 to-yellow-50 p-6 rounded-2xl border-l-4 border-amber-400 mb-8">
              <p className="text-slate-700 leading-relaxed">
                {t('growwithus1.ambassadors.how_it_works.example')}
              </p>
            </div>

            {/* CTA 2 */}
            <div className="text-center bg-gradient-to-r from-cyan-50 to-teal-50 p-6 rounded-2xl border border-cyan-200">
              <h3 className="text-xl font-bold text-[color:var(--brand-green,#0B4422)] mb-2">
                {t('growwithus1.ambassadors.how_it_works.cta_title')}
              </h3>
              <p className="text-slate-600 mb-4">
                {t('growwithus1.ambassadors.how_it_works.cta_desc')}
              </p>
              <a
                href="/grow-with-us/interest?role=ambassadors"
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-600 to-teal-600 text-white px-6 py-3 font-bold shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
              >
                {t('growwithus1.ambassadors.how_it_works.cta_button')}{' '}
                <ArrowRight className="h-4 w-4" />
              </a>
            </div>
          </div>
        </section>

        {/* WHAT AMBASSADORS DO */}
        <section className="py-8 px-6 relative z-10">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-8">
              <h2 className="text-4xl font-bold text-[color:var(--brand-green,#0B4422)] mb-4">
                {t('growwithus1.ambassadors.what_ambassadors_do.title')}
              </h2>
              <p className="text-xl text-slate-600 leading-relaxed">
                {t('growwithus1.ambassadors.what_ambassadors_do.subtitle')}
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-6 mb-8">
              <BenefitCard
                icon={<Users className="h-5 w-5" />}
                title={t('growwithus1.ambassadors.what_ambassadors_do.activity1_title')}
                description={t('growwithus1.ambassadors.what_ambassadors_do.activity1_desc')}
              />
              <BenefitCard
                icon={<MessageCircle className="h-5 w-5" />}
                title={t('growwithus1.ambassadors.what_ambassadors_do.activity2_title')}
                description={t('growwithus1.ambassadors.what_ambassadors_do.activity2_desc')}
              />
              <BenefitCard
                icon={<Lightbulb className="h-5 w-5" />}
                title={t('growwithus1.ambassadors.what_ambassadors_do.activity3_title')}
                description={t('growwithus1.ambassadors.what_ambassadors_do.activity3_desc')}
              />
              <BenefitCard
                icon={<Calendar className="h-5 w-5" />}
                title={t('growwithus1.ambassadors.what_ambassadors_do.activity4_title')}
                description={t('growwithus1.ambassadors.what_ambassadors_do.activity4_desc')}
              />
              <BenefitCard
                icon={<Globe2 className="h-5 w-5" />}
                title={t('growwithus1.ambassadors.what_ambassadors_do.activity5_title')}
                description={t('growwithus1.ambassadors.what_ambassadors_do.activity5_desc')}
              />
            </div>

            <div className="bg-gradient-to-r from-amber-50 to-yellow-50 p-6 rounded-2xl border-l-4 border-amber-400 mb-8">
              <p className="text-slate-700 leading-relaxed">
                {t('growwithus1.ambassadors.what_ambassadors_do.example')}
              </p>
            </div>

            {/* CTA 3 */}
            <div className="text-center bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-2xl border border-blue-200">
              <h3 className="text-xl font-bold text-[color:var(--brand-green,#0B4422)] mb-2">
                {t('growwithus1.ambassadors.what_ambassadors_do.cta_title')}
              </h3>
              <p className="text-slate-600 mb-4">{t('growwithus1.ambassadors.what_ambassadors_do.cta_desc')}</p>
              <a
                href="/grow-with-us/interest?role=ambassadors"
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-3 font-bold shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
              >
                {t('growwithus1.ambassadors.what_ambassadors_do.cta_button')} <ArrowRight className="h-4 w-4" />
              </a>
            </div>
          </div>
        </section>

        {/* WHO'S THE IDEAL AMBASSADOR */}
        <section className="py-8 px-6 bg-gradient-to-r from-emerald-50 to-green-50 relative z-10">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-8">
              <h2 className="text-4xl font-bold text-[color:var(--brand-green,#0B4422)] mb-4">
                {t('growwithus1.ambassadors.ideal_ambassador.title')}
              </h2>
              <p className="text-xl text-slate-600 leading-relaxed">
                {t('growwithus1.ambassadors.ideal_ambassador.subtitle')}
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-6 mb-8">
              <div className="bg-white/80 backdrop-blur-sm p-6 rounded-2xl shadow-lg border border-emerald-200">
                <div className="flex items-center gap-3 mb-3">
                  <Users className="h-6 w-6 text-emerald-600" />
                  <h3 className="text-lg font-bold text-[color:var(--brand-green,#0B4422)]">
                    {t('growwithus1.ambassadors.ideal_ambassador.trait1_title')}
                  </h3>
                </div>
                <p className="text-slate-600 text-sm">
                  {t('growwithus1.ambassadors.ideal_ambassador.trait1_desc')}
                </p>
              </div>

              <div className="bg-white/80 backdrop-blur-sm p-6 rounded-2xl shadow-lg border border-emerald-200">
                <div className="flex items-center gap-3 mb-3">
                  <Heart className="h-6 w-6 text-emerald-600" />
                  <h3 className="text-lg font-bold text-[color:var(--brand-green,#0B4422)]">
                    {t('growwithus1.ambassadors.ideal_ambassador.trait2_title')}
                  </h3>
                </div>
                <p className="text-slate-600 text-sm">
                  {t('growwithus1.ambassadors.ideal_ambassador.trait2_desc')}
                </p>
              </div>

              <div className="bg-white/80 backdrop-blur-sm p-6 rounded-2xl shadow-lg border border-emerald-200">
                <div className="flex items-center gap-3 mb-3">
                  <Globe2 className="h-6 w-6 text-emerald-600" />
                  <h3 className="text-lg font-bold text-[color:var(--brand-green,#0B4422)]">
                    {t('growwithus1.ambassadors.ideal_ambassador.trait3_title')}
                  </h3>
                </div>
                <p className="text-slate-600 text-sm">
                  {t('growwithus1.ambassadors.ideal_ambassador.trait3_desc')}
                </p>
              </div>

              <div className="bg-white/80 backdrop-blur-sm p-6 rounded-2xl shadow-lg border border-emerald-200">
                <div className="flex items-center gap-3 mb-3">
                  <Zap className="h-6 w-6 text-emerald-600" />
                  <h3 className="text-lg font-bold text-[color:var(--brand-green,#0B4422)]">
                    {t('growwithus1.ambassadors.ideal_ambassador.trait4_title')}
                  </h3>
                </div>
                <p className="text-slate-600 text-sm">
                  {t('growwithus1.ambassadors.ideal_ambassador.trait4_desc')}
                </p>
              </div>

              <div className="bg-white/80 backdrop-blur-sm p-6 rounded-2xl shadow-lg border border-emerald-200 md:col-span-2">
                <div className="flex items-center gap-3 mb-3">
                  <Sparkles className="h-6 w-6 text-emerald-600" />
                  <h3 className="text-lg font-bold text-[color:var(--brand-green,#0B4422)]">
                    {t('growwithus1.ambassadors.ideal_ambassador.trait5_title')}
                  </h3>
                </div>
                <p className="text-slate-600 text-sm">
                  {t('growwithus1.ambassadors.ideal_ambassador.trait5_desc')}
                </p>
              </div>
            </div>

            <div className="bg-gradient-to-r from-amber-50 to-yellow-50 p-6 rounded-2xl border-l-4 border-amber-400 mb-8">
              <p className="text-slate-700 leading-relaxed font-semibold">
                {t('growwithus1.ambassadors.ideal_ambassador.example')}
              </p>
            </div>

            {/* CTA 4 */}
            <div className="text-center bg-gradient-to-r from-pink-50 to-rose-50 p-6 rounded-2xl border border-pink-200">
              <h3 className="text-xl font-bold text-[color:var(--brand-green,#0B4422)] mb-2">
                {t('growwithus1.ambassadors.ideal_ambassador.cta_title')}
              </h3>
              <p className="text-slate-600 mb-4">
                {t('growwithus1.ambassadors.ideal_ambassador.cta_desc')}
              </p>
              <a
                href="/grow-with-us/interest?role=ambassadors"
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-pink-600 to-rose-600 text-white px-6 py-3 font-bold shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
              >
                {t('growwithus1.ambassadors.ideal_ambassador.cta_button')}{' '}
                <ArrowRight className="h-4 w-4" />
              </a>
            </div>
          </div>
        </section>

        {/* WHAT YOU GET */}
        <section className="py-8 px-6 relative z-10">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-8">
              <h2 className="text-4xl font-bold text-[color:var(--brand-green,#0B4422)] mb-4">
                {t('growwithus1.ambassadors.what_you_get.title')}
              </h2>
              <p className="text-xl text-slate-600 leading-relaxed">
                {t('growwithus1.ambassadors.what_you_get.subtitle')}
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              <BenefitCard
                icon={<Award className="h-5 w-5" />}
                title={t('growwithus1.ambassadors.what_you_get.feature1_title')}
                description={t('growwithus1.ambassadors.what_you_get.feature1_desc')}
              />
              <BenefitCard
                icon={<Gift className="h-5 w-5" />}
                title={t('growwithus1.ambassadors.what_you_get.feature2_title')}
                description={t('growwithus1.ambassadors.what_you_get.feature2_desc')}
              />
              <BenefitCard
                icon={<Star className="h-5 w-5" />}
                title={t('growwithus1.ambassadors.what_you_get.feature3_title')}
                description={t('growwithus1.ambassadors.what_you_get.feature3_desc')}
              />
              <BenefitCard
                icon={<Sparkles className="h-5 w-5" />}
                title={t('growwithus1.ambassadors.what_you_get.feature4_title')}
                description={t('growwithus1.ambassadors.what_you_get.feature4_desc')}
              />
              <BenefitCard
                icon={<Lightbulb className="h-5 w-5" />}
                title={t('growwithus1.ambassadors.what_you_get.feature5_title')}
                description={t('growwithus1.ambassadors.what_you_get.feature5_desc')}
              />
              <BenefitCard
                icon={<Users className="h-5 w-5" />}
                title={t('growwithus1.ambassadors.what_you_get.feature6_title')}
                description={t('growwithus1.ambassadors.what_you_get.feature6_desc')}
              />
            </div>

            {/* CTA 5 */}
            <div className="text-center bg-gradient-to-r from-violet-50 to-purple-50 p-6 rounded-2xl border border-violet-200">
              <h3 className="text-xl font-bold text-[color:var(--brand-green,#0B4422)] mb-2">
                {t('growwithus1.ambassadors.what_you_get.cta_title')}
              </h3>
              <p className="text-slate-600 mb-4">
                {t('growwithus1.ambassadors.what_you_get.cta_desc')}
              </p>
              <a
                href="/grow-with-us/interest?role=ambassadors"
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 text-white px-6 py-3 font-bold shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
              >
                {t('growwithus1.ambassadors.what_you_get.cta_button')}{' '}
                <ArrowRight className="h-4 w-4" />
              </a>
            </div>
          </div>
        </section>

        {/* GLOBAL VISION, LOCAL HEART */}
        <section className="py-8 px-6 bg-gradient-to-r from-blue-50 to-cyan-50 relative z-10">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-8">
              <h2 className="text-4xl font-bold text-[color:var(--brand-green,#0B4422)] mb-4">
                {t('growwithus1.ambassadors.global_local.title')}
              </h2>
              <p className="text-xl text-slate-600 leading-relaxed">
                {t('growwithus1.ambassadors.global_local.subtitle')}
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8 mb-8">
              {/* Global Scale */}
              <div className="bg-white/80 backdrop-blur-sm p-6 rounded-2xl shadow-lg border border-blue-200">
                <div className="flex items-center gap-3 mb-4">
                  <Globe2 className="h-8 w-8 text-blue-600" />
                  <h3 className="text-2xl font-bold text-[color:var(--brand-green,#0B4422)]">
                    {t('growwithus1.ambassadors.global_local.global_title')}
                  </h3>
                </div>
                <p className="text-slate-700 mb-4 font-semibold">
                  {t('growwithus1.ambassadors.global_local.global_desc')}
                </p>
                <div className="space-y-2">
                  <div className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 text-blue-600 mt-1 flex-shrink-0" />
                    <span className="text-slate-600 text-sm">
                      {t('growwithus1.ambassadors.global_local.global_point1')}
                    </span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 text-blue-600 mt-1 flex-shrink-0" />
                    <span className="text-slate-600 text-sm">
                      {t('growwithus1.ambassadors.global_local.global_point2')}
                    </span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 text-blue-600 mt-1 flex-shrink-0" />
                    <span className="text-slate-600 text-sm">
                      {t('growwithus1.ambassadors.global_local.global_point3')}
                    </span>
                  </div>
                </div>
              </div>

              {/* Local Relevance */}
              <div className="bg-white/80 backdrop-blur-sm p-6 rounded-2xl shadow-lg border border-pink-200">
                <div className="flex items-center gap-3 mb-4">
                  <Heart className="h-8 w-8 text-pink-600" />
                  <h3 className="text-2xl font-bold text-[color:var(--brand-green,#0B4422)]">
                    {t('growwithus1.ambassadors.global_local.local_title')}
                  </h3>
                </div>
                <p className="text-slate-700 mb-4 font-semibold">
                  {t('growwithus1.ambassadors.global_local.local_desc')}
                </p>
                <div className="space-y-2">
                  <div className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 text-pink-600 mt-1 flex-shrink-0" />
                    <span className="text-slate-600 text-sm">
                      {t('growwithus1.ambassadors.global_local.local_point1')}
                    </span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 text-pink-600 mt-1 flex-shrink-0" />
                    <span className="text-slate-600 text-sm">
                      {t('growwithus1.ambassadors.global_local.local_point2')}
                    </span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 text-pink-600 mt-1 flex-shrink-0" />
                    <span className="text-slate-600 text-sm">
                      {t('growwithus1.ambassadors.global_local.local_point3')}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-r from-purple-100 to-pink-100 p-6 rounded-2xl border-2 border-purple-300 mb-8">
              <p className="text-slate-800 leading-relaxed font-bold text-center text-lg">
                {t('growwithus1.ambassadors.global_local.bridge')}
              </p>
            </div>

            <div className="bg-gradient-to-r from-amber-50 to-yellow-50 p-6 rounded-2xl border-l-4 border-amber-400 mb-8">
              <p className="text-slate-700 leading-relaxed">
                {t('growwithus1.ambassadors.global_local.example')}
              </p>
            </div>

            {/* CTA 6 */}
            <div className="text-center bg-gradient-to-r from-indigo-50 to-blue-50 p-6 rounded-2xl border border-indigo-200">
              <h3 className="text-xl font-bold text-[color:var(--brand-green,#0B4422)] mb-2">
                {t('growwithus1.ambassadors.global_local.cta_title')}
              </h3>
              <p className="text-slate-600 mb-4">
                {t('growwithus1.ambassadors.global_local.cta_desc')}
              </p>
              <a
                href="/grow-with-us/interest?role=ambassadors"
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 text-white px-6 py-3 font-bold shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
              >
                {t('growwithus1.ambassadors.global_local.cta_button')}{' '}
                <ArrowRight className="h-4 w-4" />
              </a>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="py-8 px-6 bg-gradient-to-r from-purple-50 to-pink-50 relative z-10">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-8">
              <h2 className="text-4xl font-bold text-[color:var(--brand-green,#0B4422)] mb-4">
                {t('growwithus1.ambassadors.faq.title')}
              </h2>
              <p className="text-xl text-slate-600 leading-relaxed">
                {t('growwithus1.ambassadors.faq.subtitle')}
              </p>
            </div>

            <div className="space-y-4 mb-6">
              <div className="bg-white/80 backdrop-blur-sm p-6 rounded-2xl border border-purple-200">
                <h3 className="text-lg font-bold text-[color:var(--brand-green,#0B4422)] mb-3">
                  {t('growwithus1.ambassadors.faq.q1')}
                </h3>
                <p className="text-slate-600">{t('growwithus1.ambassadors.faq.a1')}</p>
              </div>

              <div className="bg-white/80 backdrop-blur-sm p-6 rounded-2xl border border-purple-200">
                <h3 className="text-lg font-bold text-[color:var(--brand-green,#0B4422)] mb-3">
                  {t('growwithus1.ambassadors.faq.q2')}
                </h3>
                <p className="text-slate-600">{t('growwithus1.ambassadors.faq.a2')}</p>
              </div>

              <div className="bg-white/80 backdrop-blur-sm p-6 rounded-2xl border border-purple-200">
                <h3 className="text-lg font-bold text-[color:var(--brand-green,#0B4422)] mb-3">
                  {t('growwithus1.ambassadors.faq.q3')}
                </h3>
                <p className="text-slate-600">{t('growwithus1.ambassadors.faq.a3')}</p>
              </div>

              <div className="bg-white/80 backdrop-blur-sm p-6 rounded-2xl border border-purple-200">
                <h3 className="text-lg font-bold text-[color:var(--brand-green,#0B4422)] mb-3">
                  {t('growwithus1.ambassadors.faq.q4')}
                </h3>
                <p className="text-slate-600">{t('growwithus1.ambassadors.faq.a4')}</p>
              </div>

              <div className="bg-white/80 backdrop-blur-sm p-6 rounded-2xl border border-purple-200">
                <h3 className="text-lg font-bold text-[color:var(--brand-green,#0B4422)] mb-3">
                  {t('growwithus1.ambassadors.faq.q5')}
                </h3>
                <p className="text-slate-600">{t('growwithus1.ambassadors.faq.a5')}</p>
              </div>
            </div>

            {/* CTA 7 */}
            <div className="text-center bg-gradient-to-r from-cyan-50 to-teal-50 p-6 rounded-2xl border border-cyan-200">
              <h3 className="text-xl font-bold text-[color:var(--brand-green,#0B4422)] mb-2">
                {t('growwithus1.ambassadors.faq.cta_title')}
              </h3>
              <p className="text-slate-600 mb-4">{t('growwithus1.ambassadors.faq.cta_desc')}</p>
              <a
                href="/contact"
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-600 to-teal-600 text-white px-6 py-3 font-bold shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
              >
                {t('growwithus1.ambassadors.faq.cta_button')} <MessageCircle className="h-4 w-4" />
              </a>
            </div>
          </div>
        </section>

        {/* CLOSING CTA */}
        <section className="py-8 px-6 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-4xl font-bold text-[color:var(--brand-green,#0B4422)] mb-4">
              {t('growwithus1.ambassadors.closing.title')}
            </h2>
            <p className="text-xl text-slate-600 mb-6 leading-relaxed">
              {t('growwithus1.ambassadors.closing.subtitle')}
            </p>
            <p className="text-lg text-slate-600 mb-6">
              {t('growwithus1.ambassadors.closing.description')}
            </p>
            <div className="flex flex-wrap justify-center gap-6">
              <a
                href="/grow-with-us/interest?role=ambassadors"
                className="inline-flex items-center gap-3 rounded-2xl bg-gradient-to-r from-[color:var(--brand-green,#0B4422)] to-emerald-700 text-white px-10 py-5 text-xl font-bold shadow-2xl hover:shadow-3xl hover:-translate-y-2 transition-all duration-300"
              >
                {t('growwithus1.ambassadors.closing.cta')} <ArrowRight className="h-6 w-6" />
              </a>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}