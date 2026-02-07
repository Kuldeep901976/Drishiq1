'use client';

import React from 'react';
import {
  Globe2,
  Link2,
  Gift,
  Sparkles,
  Users,
  Leaf,
  ArrowRight,
  Music,
  RefreshCw,
  DollarSign,
  BarChart3,
  Shield,
  Clock,
  CheckCircle,
  Star,
  Zap,
  MessageCircle,
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
      <div className="p-3 rounded-xl bg-gradient-to-br from-emerald-50 to-emerald-100 text-emerald-600 group-hover:scale-110 transition-transform duration-300 flex-shrink-0">
        {icon}
      </div>
      <div className="flex-1">
        <h3 className="text-lg font-bold text-[color:var(--brand-green,#0B4422)] mb-2">{title}</h3>
        <p className="text-slate-600 leading-relaxed text-sm mb-3">{description}</p>
        {example && (
          <div className="bg-slate-50 p-3 rounded-lg border-l-4 border-emerald-400">
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
      <div className="p-2 rounded-lg bg-gradient-to-br from-emerald-50 to-emerald-100 text-emerald-600 group-hover:scale-110 transition-transform duration-300">
        {icon}
      </div>
      <h3 className="font-bold text-[color:var(--brand-green,#0B4422)]">{title}</h3>
    </div>
    <p className="text-slate-600 text-sm leading-relaxed">{description}</p>
  </div>
);

export default function AffiliatesPage() {
  const { t } = useLanguage(['growwithus1']);

  return (
    <>
      <main className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50 relative overflow-hidden">
        {/* Background Elements */}
        <div className="absolute inset-0">
          <div className="absolute top-20 left-10 w-72 h-72 bg-gradient-to-br from-emerald-200 to-emerald-300 opacity-20 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute top-40 right-20 w-96 h-96 bg-gradient-to-br from-blue-200 to-blue-300 opacity-20 rounded-full blur-3xl animate-pulse delay-1000"></div>
          <div className="absolute bottom-20 left-1/3 w-64 h-64 bg-gradient-to-br from-purple-200 to-purple-300 opacity-20 rounded-full blur-2xl animate-pulse delay-2000"></div>
        </div>

        {/* HERO SECTION */}
        <section className="relative pt-16 pb-8 overflow-hidden">
          <SilverBar />
          <div className="relative z-10 mx-auto max-w-7xl px-6 pt-12 pb-4">
            <div className="text-center mb-8">
              <div className="inline-flex items-center gap-2 text-emerald-700 font-semibold mb-4 px-6 py-3 bg-emerald-50 rounded-full border border-emerald-200">
                <Link2 className="h-5 w-5" /> {t('growwithus1.affiliates.hero.badge')}
              </div>
              <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight text-[color:var(--brand-green,#0B4422)] mb-4">
                {t('growwithus1.affiliates.hero.title')}
              </h1>
              <p className="text-xl leading-relaxed text-slate-700 mb-6 max-w-4xl mx-auto">
                {t('growwithus1.affiliates.hero.subtitle')}
              </p>
              <div className="flex flex-wrap justify-center gap-4">
                <a
                  href="/grow-with-us/interest?role=affiliates"
                  className="inline-flex items-center gap-3 rounded-2xl bg-gradient-to-r from-[color:var(--brand-green,#0B4422)] to-emerald-700 text-white px-8 py-4 text-lg font-bold shadow-xl hover:shadow-2xl hover:-translate-y-1 transition-all duration-300"
                >
                  {t('growwithus1.affiliates.hero.cta')} <ArrowRight className="h-5 w-5" />
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* WHY AFFILIATES FIT */}
        <section className="py-4 px-6 relative z-10">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-8">
              <h2 className="text-4xl font-bold text-[color:var(--brand-green,#0B4422)] mb-4">
                {t('growwithus1.affiliates.why_fit.title')}
              </h2>
              <p className="text-xl text-slate-600 max-w-4xl mx-auto leading-relaxed">
                {t('growwithus1.affiliates.why_fit.subtitle')}
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8 mb-8">
              <FeatureCard
                icon={<Users className="h-6 w-6" />}
                title={t('growwithus1.affiliates.why_fit.trust_title')}
                description={t('growwithus1.affiliates.why_fit.trust_desc')}
                example={t('growwithus1.affiliates.why_fit.trust_example')}
              />
              <FeatureCard
                icon={<Globe2 className="h-6 w-6" />}
                title={t('growwithus1.affiliates.why_fit.global_title')}
                description={t('growwithus1.affiliates.why_fit.global_desc')}
                example={t('growwithus1.affiliates.why_fit.global_example')}
              />
            </div>

            {/* CTA 1 */}
            <div className="text-center bg-gradient-to-r from-emerald-50 to-green-50 p-6 rounded-2xl border border-emerald-200">
              <h3 className="text-xl font-bold text-[color:var(--brand-green,#0B4422)] mb-2">
                {t('growwithus1.affiliates.why_fit.cta_title')}
              </h3>
              <p className="text-slate-600 mb-4">{t('growwithus1.affiliates.why_fit.cta_desc')}</p>
              <a
                href="/grow-with-us/interest?role=affiliates"
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[color:var(--brand-green,#0B4422)] to-emerald-700 text-white px-6 py-3 font-bold shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
              >
                {t('growwithus1.affiliates.why_fit.cta_button')} <ArrowRight className="h-4 w-4" />
              </a>
            </div>
          </div>
        </section>

        {/* HOW IT WORKS */}
        <section className="py-8 px-6 bg-white/60 backdrop-blur-sm relative z-10">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-6">
              <h2 className="text-4xl font-bold text-[color:var(--brand-green,#0B4422)] mb-4">
                {t('growwithus1.affiliates.how_it_works.title')}
              </h2>
              <p className="text-lg text-slate-600 max-w-2xl mx-auto">
                {t('growwithus1.affiliates.how_it_works.subtitle')}
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
              <div className="group relative bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg ring-1 ring-black/5 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 border border-gray-100">
                <div className="absolute -top-3 -left-3 w-8 h-8 rounded-full bg-gradient-to-br from-emerald-600 to-emerald-700 text-white flex items-center justify-center text-sm font-bold shadow-lg group-hover:scale-110 transition-transform duration-300">
                  1
                </div>
                <div className="pt-2">
                  <h3 className="text-lg font-bold text-emerald-800 mb-3">
                    {t('growwithus1.affiliates.how_it_works.step1_title')}
                  </h3>
                  <p className="text-slate-600 text-sm leading-relaxed">
                    {t('growwithus1.affiliates.how_it_works.step1_desc')}
                  </p>
                </div>
              </div>

              <div className="group relative bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg ring-1 ring-black/5 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 border border-gray-100">
                <div className="absolute -top-3 -left-3 w-8 h-8 rounded-full bg-gradient-to-br from-emerald-600 to-emerald-700 text-white flex items-center justify-center text-sm font-bold shadow-lg group-hover:scale-110 transition-transform duration-300">
                  2
                </div>
                <div className="pt-2">
                  <h3 className="text-lg font-bold text-emerald-800 mb-3">
                    {t('growwithus1.affiliates.how_it_works.step2_title')}
                  </h3>
                  <p className="text-slate-600 text-sm leading-relaxed">
                    {t('growwithus1.affiliates.how_it_works.step2_desc')}
                  </p>
                </div>
              </div>

              <div className="group relative bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg ring-1 ring-black/5 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 border border-gray-100">
                <div className="absolute -top-3 -left-3 w-8 h-8 rounded-full bg-gradient-to-br from-emerald-600 to-emerald-700 text-white flex items-center justify-center text-sm font-bold shadow-lg group-hover:scale-110 transition-transform duration-300">
                  3
                </div>
                <div className="pt-2">
                  <h3 className="text-lg font-bold text-emerald-800 mb-3">
                    {t('growwithus1.affiliates.how_it_works.step3_title')}
                  </h3>
                  <p className="text-slate-600 text-sm leading-relaxed">
                    {t('growwithus1.affiliates.how_it_works.step3_desc')}
                  </p>
                </div>
              </div>

              <div className="group relative bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg ring-1 ring-black/5 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 border border-gray-100">
                <div className="absolute -top-3 -left-3 w-8 h-8 rounded-full bg-gradient-to-br from-emerald-600 to-emerald-700 text-white flex items-center justify-center text-sm font-bold shadow-lg group-hover:scale-110 transition-transform duration-300">
                  4
                </div>
                <div className="pt-2">
                  <h3 className="text-lg font-bold text-emerald-800 mb-3">
                    {t('growwithus1.affiliates.how_it_works.step4_title')}
                  </h3>
                  <p className="text-slate-600 text-sm leading-relaxed">
                    {t('growwithus1.affiliates.how_it_works.step4_desc')}
                  </p>
                </div>
              </div>
            </div>

            {/* Example callout */}
            <div className="mb-6 bg-gradient-to-r from-emerald-50 to-green-50 p-6 rounded-2xl border border-emerald-200">
              <p className="text-slate-700 italic text-center text-sm">
                {t('growwithus1.affiliates.how_it_works.example')}
              </p>
            </div>

            {/* CTA 2 */}
            <div className="text-center bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-2xl border border-blue-200">
              <h3 className="text-xl font-bold text-[color:var(--brand-green,#0B4422)] mb-2">
                {t('growwithus1.affiliates.how_it_works.cta_title')}
              </h3>
              <p className="text-slate-600 mb-4">
                {t('growwithus1.affiliates.how_it_works.cta_desc')}
              </p>
              <a
                href="/grow-with-us/interest?role=affiliates"
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-3 font-bold shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
              >
                {t('growwithus1.affiliates.how_it_works.cta_button')}{' '}
                <ArrowRight className="h-4 w-4" />
              </a>
            </div>
          </div>
        </section>

        {/* GLOBAL CONNECTION & UNIQUE HOOK */}
        <section className="py-8 px-6 relative z-10">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-6">
              <h2 className="text-4xl font-bold text-[color:var(--brand-green,#0B4422)] mb-4">
                {t('growwithus1.affiliates.global_connection.title')}
              </h2>
              <p className="text-lg text-slate-600 max-w-4xl mx-auto">
                {t('growwithus1.affiliates.global_connection.subtitle')}
              </p>
            </div>

            <div className="grid lg:grid-cols-2 gap-8">
              {/* Global Potential Card */}
              <div className="relative group">
                <div className="absolute -inset-4 bg-gradient-to-br from-emerald-100 to-blue-100 rounded-3xl blur-2xl opacity-60 group-hover:opacity-80 transition-opacity duration-300" />
                <div className="relative rounded-2xl ring-1 ring-black/5 bg-gradient-to-br from-emerald-50/90 via-blue-50/90 to-purple-50/90 backdrop-blur-sm p-8 shadow-xl group-hover:shadow-2xl transition-all duration-300">
                  <div className="text-center mb-6">
                    <h3 className="text-2xl font-bold text-[color:var(--brand-green,#0B4422)] mb-3">
                      {t('growwithus1.affiliates.global_connection.global_title')}
                    </h3>
                    <p className="text-slate-600">
                      {t('growwithus1.affiliates.global_connection.global_desc')}
                    </p>
                  </div>

                  {/* Globe with circular bullets */}
                  <div className="relative mb-6">
                    <div className="relative w-32 h-32 mx-auto">
                      <img
                        src="/assets/images/Globe.gif"
                        alt="Spinning Globe"
                        className="w-full h-full object-contain animate-spin rounded-full"
                        style={{ animationDuration: '20s' }}
                      />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-2 h-2 bg-emerald-500 rounded-full animate-ping"></div>
                      </div>
                    </div>

                    {/* Circular bullets around globe */}
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 flex items-center gap-1 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-full border border-emerald-200 shadow-lg">
                        <CheckCircle className="h-3 w-3 text-emerald-600" />
                        <span className="text-xs font-semibold text-slate-700">12 Languages</span>
                      </div>
                      <div className="absolute -right-6 top-1/2 transform -translate-y-1/2 flex items-center gap-1 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-full border border-emerald-200 shadow-lg">
                        <CheckCircle className="h-3 w-3 text-emerald-600" />
                        <span className="text-xs font-semibold text-slate-700">Global</span>
                      </div>
                      <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 flex items-center gap-1 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-full border border-emerald-200 shadow-lg">
                        <CheckCircle className="h-3 w-3 text-emerald-600" />
                        <span className="text-xs font-semibold text-slate-700">One Link</span>
                      </div>
                      <div className="absolute -left-6 top-1/2 transform -translate-y-1/2 flex items-center gap-1 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-full border border-emerald-200 shadow-lg">
                        <CheckCircle className="h-3 w-3 text-emerald-600" />
                        <span className="text-xs font-semibold text-slate-700">Global Pay</span>
                      </div>
                    </div>
                  </div>

                  {/* Languages */}
                  <div className="flex flex-wrap justify-center gap-2 mb-4">
                    {[
                      'English',
                      'Hindi',
                      'Spanish',
                      'Arabic',
                      'French',
                      'German',
                      'Chinese',
                      'Japanese',
                    ].map((lang, idx) => (
                      <div
                        key={lang}
                        className="bg-gradient-to-r from-emerald-50 to-green-50 px-2 py-1 rounded-full border border-emerald-200"
                      >
                        <span className="text-xs font-semibold text-emerald-800">{lang}</span>
                      </div>
                    ))}
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-emerald-600 mt-1 flex-shrink-0" />
                      <span className="text-sm text-slate-700">
                        {t('growwithus1.affiliates.global_connection.global_feature1')}
                      </span>
                    </div>
                    <div className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-emerald-600 mt-1 flex-shrink-0" />
                      <span className="text-sm text-slate-700">
                        {t('growwithus1.affiliates.global_connection.global_feature2')}
                      </span>
                    </div>
                    <div className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-emerald-600 mt-1 flex-shrink-0" />
                      <span className="text-sm text-slate-700">
                        {t('growwithus1.affiliates.global_connection.global_feature3')}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Songs & Stories Card */}
              <div className="relative group">
                <div className="absolute -inset-4 bg-gradient-to-br from-purple-100 to-pink-100 rounded-3xl blur-2xl opacity-60 group-hover:opacity-80 transition-opacity duration-300" />
                <div className="relative rounded-2xl ring-1 ring-black/5 bg-gradient-to-br from-purple-50/90 via-pink-50/90 to-rose-50/90 backdrop-blur-sm p-8 shadow-xl group-hover:shadow-2xl transition-all duration-300">
                  <div className="text-center mb-6">
                    <h3 className="text-2xl font-bold text-[color:var(--brand-green,#0B4422)] mb-3">
                      {t('growwithus1.affiliates.global_connection.songs_title')}
                    </h3>
                    <p className="text-slate-600">
                      {t('growwithus1.affiliates.global_connection.songs_desc')}
                    </p>
                  </div>

                  <div className="space-y-4 mb-6">
                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-lg bg-gradient-to-br from-purple-50 to-purple-100 text-purple-600">
                        <Music className="h-5 w-5" />
                      </div>
                      <div>
                        <h4 className="font-bold text-purple-800 mb-1">
                          {t('growwithus1.affiliates.global_connection.songs_feature1_title')}
                        </h4>
                        <p className="text-sm text-slate-600">
                          {t('growwithus1.affiliates.global_connection.songs_feature1_desc')}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-lg bg-gradient-to-br from-pink-50 to-pink-100 text-pink-600">
                        <Sparkles className="h-5 w-5" />
                      </div>
                      <div>
                        <h4 className="font-bold text-pink-800 mb-1">
                          {t('growwithus1.affiliates.global_connection.songs_feature2_title')}
                        </h4>
                        <p className="text-sm text-slate-600">
                          {t('growwithus1.affiliates.global_connection.songs_feature2_desc')}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-lg bg-gradient-to-br from-rose-50 to-rose-100 text-rose-600">
                        <Zap className="h-5 w-5" />
                      </div>
                      <div>
                        <h4 className="font-bold text-rose-800 mb-1">
                          {t('growwithus1.affiliates.global_connection.songs_feature3_title')}
                        </h4>
                        <p className="text-sm text-slate-600">
                          {t('growwithus1.affiliates.global_connection.songs_feature3_desc')}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gradient-to-r from-purple-100 to-pink-100 p-4 rounded-xl border border-purple-200">
                    <p className="text-slate-700 italic text-sm text-center">
                      "{t('growwithus1.affiliates.global_connection.songs_example')}"
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* CTA 3 */}
            <div className="text-center mt-8 bg-gradient-to-r from-purple-50 to-pink-50 p-6 rounded-2xl border border-purple-200">
              <h3 className="text-xl font-bold text-[color:var(--brand-green,#0B4422)] mb-2">
                {t('growwithus1.affiliates.global_connection.cta_title')}
              </h3>
              <p className="text-slate-600 mb-4">
                {t('growwithus1.affiliates.global_connection.cta_desc')}
              </p>
              <a
                href="/grow-with-us/interest?role=affiliates"
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-3 font-bold shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
              >
                {t('growwithus1.affiliates.global_connection.cta_button')}{' '}
                <ArrowRight className="h-4 w-4" />
              </a>
            </div>
          </div>
        </section>

        {/* REGULAR UPDATES */}
        <section className="py-8 px-6 relative z-10">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-8">
              <h2 className="text-4xl font-bold text-[color:var(--brand-green,#0B4422)] mb-4">
                {t('growwithus1.affiliates.regular_updates.title')}
              </h2>
              <p className="text-xl text-slate-600 max-w-4xl mx-auto leading-relaxed">
                {t('growwithus1.affiliates.regular_updates.subtitle')}
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-6 mb-6">
              <BenefitCard
                icon={<RefreshCw className="h-5 w-5" />}
                title={t('growwithus1.affiliates.regular_updates.feature1_title')}
                description={t('growwithus1.affiliates.regular_updates.feature1_desc')}
              />
              <BenefitCard
                icon={<Music className="h-5 w-5" />}
                title={t('growwithus1.affiliates.regular_updates.feature2_title')}
                description={t('growwithus1.affiliates.regular_updates.feature2_desc')}
              />
              <BenefitCard
                icon={<Globe2 className="h-5 w-5" />}
                title={t('growwithus1.affiliates.regular_updates.feature3_title')}
                description={t('growwithus1.affiliates.regular_updates.feature3_desc')}
              />
            </div>

            <div className="mb-6 bg-gradient-to-r from-emerald-100 to-green-100 p-6 rounded-2xl border border-emerald-200">
              <p className="text-slate-700 italic text-center">
                "{t('growwithus1.affiliates.regular_updates.example')}"
              </p>
            </div>

            {/* CTA 4 */}
            <div className="text-center bg-gradient-to-r from-orange-50 to-amber-50 p-6 rounded-2xl border border-orange-200">
              <h3 className="text-xl font-bold text-[color:var(--brand-green,#0B4422)] mb-2">
                {t('growwithus1.affiliates.regular_updates.cta_title')}
              </h3>
              <p className="text-slate-600 mb-4">
                {t('growwithus1.affiliates.regular_updates.cta_desc')}
              </p>
              <a
                href="/grow-with-us/interest?role=affiliates"
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-orange-600 to-amber-600 text-white px-6 py-3 font-bold shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
              >
                {t('growwithus1.affiliates.regular_updates.cta_button')}{' '}
                <ArrowRight className="h-4 w-4" />
              </a>
            </div>
          </div>
        </section>

        {/* WHAT YOU GET */}
        <section className="py-8 px-6 bg-white/60 backdrop-blur-sm relative z-10">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-8">
              <h2 className="text-4xl font-bold text-[color:var(--brand-green,#0B4422)] mb-4">
                {t('growwithus1.affiliates.what_you_get.title')}
              </h2>
              <p className="text-xl text-slate-600 max-w-4xl mx-auto leading-relaxed">
                {t('growwithus1.affiliates.what_you_get.subtitle')}
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
              <BenefitCard
                icon={<DollarSign className="h-5 w-5" />}
                title={t('growwithus1.affiliates.what_you_get.feature1_title')}
                description={t('growwithus1.affiliates.what_you_get.feature1_desc')}
              />
              <BenefitCard
                icon={<BarChart3 className="h-5 w-5" />}
                title={t('growwithus1.affiliates.what_you_get.feature2_title')}
                description={t('growwithus1.affiliates.what_you_get.feature2_desc')}
              />
              <BenefitCard
                icon={<Gift className="h-5 w-5" />}
                title={t('growwithus1.affiliates.what_you_get.feature3_title')}
                description={t('growwithus1.affiliates.what_you_get.feature3_desc')}
              />
              <BenefitCard
                icon={<Zap className="h-5 w-5" />}
                title={t('growwithus1.affiliates.what_you_get.feature4_title')}
                description={t('growwithus1.affiliates.what_you_get.feature4_desc')}
              />
              <BenefitCard
                icon={<Star className="h-5 w-5" />}
                title={t('growwithus1.affiliates.what_you_get.feature5_title')}
                description={t('growwithus1.affiliates.what_you_get.feature5_desc')}
              />
              <BenefitCard
                icon={<Shield className="h-5 w-5" />}
                title={t('growwithus1.affiliates.what_you_get.feature6_title')}
                description={t('growwithus1.affiliates.what_you_get.feature6_desc')}
              />
            </div>

            {/* CTA 5 */}
            <div className="text-center bg-gradient-to-r from-green-50 to-emerald-50 p-6 rounded-2xl border border-green-200">
              <h3 className="text-xl font-bold text-[color:var(--brand-green,#0B4422)] mb-2">
                {t('growwithus1.affiliates.what_you_get.cta_title')}
              </h3>
              <p className="text-slate-600 mb-4">
                {t('growwithus1.affiliates.what_you_get.cta_desc')}
              </p>
              <a
                href="/grow-with-us/interest?role=affiliates"
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-green-600 to-emerald-600 text-white px-6 py-3 font-bold shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
              >
                {t('growwithus1.affiliates.what_you_get.cta_button')}{' '}
                <ArrowRight className="h-4 w-4" />
              </a>
            </div>
          </div>
        </section>

        {/* PAYOUTS */}
        <section className="py-8 px-6 relative z-10">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-8">
              <h2 className="text-4xl font-bold text-[color:var(--brand-green,#0B4422)] mb-4">
                {t('growwithus1.affiliates.payouts.title')}
              </h2>
              <p className="text-xl text-slate-600 leading-relaxed">
                {t('growwithus1.affiliates.payouts.subtitle')}
              </p>
            </div>

            <div className="bg-gradient-to-r from-emerald-50 to-green-50 p-6 rounded-2xl border border-emerald-200 mb-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-xl font-bold text-[color:var(--brand-green,#0B4422)] mb-4">
                    {t('growwithus1.affiliates.payouts.payment_details_title')}
                  </h3>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <Clock className="h-5 w-5 text-emerald-600" />
                      <span className="text-slate-700">
                        <strong>{t('growwithus1.affiliates.payouts.schedule_label')}</strong>{' '}
                        {t('growwithus1.affiliates.payouts.schedule')}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <DollarSign className="h-5 w-5 text-emerald-600" />
                      <span className="text-slate-700">
                        <strong>{t('growwithus1.affiliates.payouts.methods_label')}</strong>{' '}
                        {t('growwithus1.affiliates.payouts.methods')}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <BarChart3 className="h-5 w-5 text-emerald-600" />
                      <span className="text-slate-700">
                        <strong>{t('growwithus1.affiliates.payouts.threshold_label')}</strong>{' '}
                        {t('growwithus1.affiliates.payouts.threshold')}
                      </span>
                    </div>
                  </div>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-[color:var(--brand-green,#0B4422)] mb-4">
                    {t('growwithus1.affiliates.payouts.tracking_title')}
                  </h3>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <CheckCircle className="h-5 w-5 text-emerald-600" />
                      <span className="text-slate-700">
                        {t('growwithus1.affiliates.payouts.tracking1')}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <CheckCircle className="h-5 w-5 text-emerald-600" />
                      <span className="text-slate-700">
                        {t('growwithus1.affiliates.payouts.tracking2')}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <CheckCircle className="h-5 w-5 text-emerald-600" />
                      <span className="text-slate-700">
                        {t('growwithus1.affiliates.payouts.tracking3')}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-4 p-4 bg-white/50 rounded-xl border border-emerald-300">
                <p className="text-slate-700 italic text-center text-sm">
                  <strong>{t('growwithus1.affiliates.payouts.example_label')}</strong>{' '}
                  {t('growwithus1.affiliates.payouts.example')}
                </p>
              </div>
            </div>

            {/* CTA 6 */}
            <div className="text-center bg-gradient-to-r from-indigo-50 to-blue-50 p-6 rounded-2xl border border-indigo-200">
              <h3 className="text-xl font-bold text-[color:var(--brand-green,#0B4422)] mb-2">
                {t('growwithus1.affiliates.payouts.cta_title')}
              </h3>
              <p className="text-slate-600 mb-4">{t('growwithus1.affiliates.payouts.cta_desc')}</p>
              <a
                href="/grow-with-us/interest?role=affiliates"
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 text-white px-6 py-3 font-bold shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
              >
                {t('growwithus1.affiliates.payouts.cta_button')} <ArrowRight className="h-4 w-4" />
              </a>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="py-8 px-6 bg-gradient-to-r from-blue-50 to-indigo-50 relative z-10">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-8">
              <h2 className="text-4xl font-bold text-[color:var(--brand-green,#0B4422)] mb-4">
                {t('growwithus1.affiliates.faq.title')}
              </h2>
              <p className="text-xl text-slate-600 leading-relaxed">
                {t('growwithus1.affiliates.faq.subtitle')}
              </p>
            </div>

            <div className="space-y-4 mb-6">
              <div className="bg-white/80 backdrop-blur-sm p-6 rounded-2xl border border-blue-200">
                <h3 className="text-lg font-bold text-[color:var(--brand-green,#0B4422)] mb-3">
                  {t('growwithus1.affiliates.faq.q1')}
                </h3>
                <p className="text-slate-600">{t('growwithus1.affiliates.faq.a1')}</p>
              </div>

              <div className="bg-white/80 backdrop-blur-sm p-6 rounded-2xl border border-blue-200">
                <h3 className="text-lg font-bold text-[color:var(--brand-green,#0B4422)] mb-3">
                  {t('growwithus1.affiliates.faq.q2')}
                </h3>
                <p className="text-slate-600">{t('growwithus1.affiliates.faq.a2')}</p>
              </div>

              <div className="bg-white/80 backdrop-blur-sm p-6 rounded-2xl border border-blue-200">
                <h3 className="text-lg font-bold text-[color:var(--brand-green,#0B4422)] mb-3">
                  {t('growwithus1.affiliates.faq.q3')}
                </h3>
                <p className="text-slate-600">{t('growwithus1.affiliates.faq.a3')}</p>
              </div>

              <div className="bg-white/80 backdrop-blur-sm p-6 rounded-2xl border border-blue-200">
                <h3 className="text-lg font-bold text-[color:var(--brand-green,#0B4422)] mb-3">
                  {t('growwithus1.affiliates.faq.q4')}
                </h3>
                <p className="text-slate-600">{t('growwithus1.affiliates.faq.a4')}</p>
              </div>
            </div>

            {/* CTA 7 */}
            <div className="text-center bg-gradient-to-r from-cyan-50 to-teal-50 p-6 rounded-2xl border border-cyan-200">
              <h3 className="text-xl font-bold text-[color:var(--brand-green,#0B4422)] mb-2">
                {t('growwithus1.affiliates.faq.cta_title')}
              </h3>
              <p className="text-slate-600 mb-4">{t('growwithus1.affiliates.faq.cta_desc')}</p>
              <a
                href="/contact"
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-600 to-teal-600 text-white px-6 py-3 font-bold shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
              >
                {t('growwithus1.affiliates.faq.cta_button')} <MessageCircle className="h-4 w-4" />
              </a>
            </div>
          </div>
        </section>

        {/* CLOSING CTA */}
        <section className="py-8 px-6 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-4xl font-bold text-[color:var(--brand-green,#0B4422)] mb-4">
              {t('growwithus1.affiliates.closing.title')}
            </h2>
            <p className="text-xl text-slate-600 mb-6 leading-relaxed">
              {t('growwithus1.affiliates.closing.subtitle')}
            </p>
            <p className="text-lg text-slate-600 mb-6">
              {t('growwithus1.affiliates.closing.description')}
            </p>
            <div className="flex flex-wrap justify-center gap-6">
              <a
                href="/grow-with-us/interest?role=affiliates"
                className="inline-flex items-center gap-3 rounded-2xl bg-gradient-to-r from-[color:var(--brand-green,#0B4422)] to-emerald-700 text-white px-10 py-5 text-xl font-bold shadow-2xl hover:shadow-3xl hover:-translate-y-2 transition-all duration-300"
              >
                {t('growwithus1.affiliates.closing.cta')} <ArrowRight className="h-6 w-6" />
              </a>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
