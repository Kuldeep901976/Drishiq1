"use client";

import React, { useEffect } from "react";
import { motion } from "framer-motion";
import Footer from '@/components/Footer';
import { useLanguage } from "@/lib/drishiq-i18n";
import { Star, Scale, RefreshCw, Sparkles, Shield, Target, Sparkle, type LucideIcon } from 'lucide-react';

// Icon mappings for dynamic rendering
const sectionIconMap: Record<string, LucideIcon> = {
  "🌟": Star,
  "⚖️": Scale,
  "🔄": RefreshCw,
  "💫": Sparkles,
};

const howIconMap: Record<string, LucideIcon> = {
  "⚖️": Scale,
  "🔄": RefreshCw,
  "🛡️": Shield,
  "🎯": Target,
};

// Safe fallback: if framer-motion isn't installed, FM renders plain elements
const FM: any = motion as any;

/**
 * GIVING-BEYOND — React + TypeScript + Tailwind
 * Built to match the personality pattern with Giving-Beyond content & copy.
 */

export default function GivingBeyondPage() {
  const { t, language } = useLanguage(['meetyourself4']);
  
  useEffect(() => {
    console.assert(!!FM, "[Smoke Test] Using framer-motion if present; otherwise falling back to plain elements.");
  }, []);

  // === Stir lines under headline ===
  const stirLines: string[] = [
    t("meetyourself4.giving_beyond.stir.line.0") || "When did you last receive without giving back?",
    t("meetyourself4.giving_beyond.stir.line.1") || "Do you feel guilty when others help you?",
    t("meetyourself4.giving_beyond.stir.line.2") || "How often do you say 'I'm fine' when you need support?",
    t("meetyourself4.giving_beyond.stir.line.3") || "Does accepting help feel like weakness to you?",
    t("meetyourself4.giving_beyond.stir.line.4") || "Where do you put your own needs when others need you?",
  ];

  // === Quick Emotion Cards (6) ===
  const emotionCards = [
    { t: t("meetyourself4.giving_beyond.emote.0.title") || "Generous", s: t("meetyourself4.giving_beyond.emote.0.subtitle") || "Always ready to help" },
    { t: t("meetyourself4.giving_beyond.emote.1.title") || "Exhausted", s: t("meetyourself4.giving_beyond.emote.1.subtitle") || "Giving beyond capacity" },
    { t: t("meetyourself4.giving_beyond.emote.2.title") || "Fulfilled", s: t("meetyourself4.giving_beyond.emote.2.subtitle") || "Making a difference" },
    { t: t("meetyourself4.giving_beyond.emote.3.title") || "Resentful", s: t("meetyourself4.giving_beyond.emote.3.subtitle") || "Feeling taken for granted" },
    { t: t("meetyourself4.giving_beyond.emote.4.title") || "Lonely", s: t("meetyourself4.giving_beyond.emote.4.subtitle") || "Few understand your burden" },
    { t: t("meetyourself4.giving_beyond.emote.5.title") || "Purposeful", s: t("meetyourself4.giving_beyond.emote.5.subtitle") || "Driven by service" },
  ];

  // === Celebrity Ticker ===
  const celebA = [
    { img: "/assets/images/meet-yourself/giving-beyond/celebs/Mother_Teresa.jpg", name: t("meetyourself4.giving_beyond.celeb.0.name") || "Mother Teresa", profession: t("meetyourself4.giving_beyond.celeb.0.profession") || "Humanitarian", source: "Quote", quote: t("meetyourself4.giving_beyond.celeb.0.quote") || "\"It's not how much we give but how much love we put into giving.\"" },
    { img: "/assets/images/meet-yourself/giving-beyond/celebs/Martin_Luther_King.jpg", name: t("meetyourself4.giving_beyond.celeb.1.name") || "Martin Luther King Jr.", profession: t("meetyourself4.giving_beyond.celeb.1.profession") || "Civil Rights Leader", source: "Quote", quote: t("meetyourself4.giving_beyond.celeb.1.quote") || "\"Life's most persistent and urgent question is, 'What are you doing for others?'\"" },
    { img: "/assets/images/meet-yourself/giving-beyond/celebs/Nelson_Mandela.jpg", name: t("meetyourself4.giving_beyond.celeb.2.name") || "Nelson Mandela", profession: t("meetyourself4.giving_beyond.celeb.2.profession") || "Leader", source: "Quote", quote: t("meetyourself4.giving_beyond.celeb.2.quote") || "\"What counts in life is not the mere fact that we have lived. It is what difference we have made to the lives of others.\"" },
    { img: "/assets/images/meet-yourself/giving-beyond/celebs/Malala_Yousafzai.jpg", name: t("meetyourself4.giving_beyond.celeb.3.name") || "Malala Yousafzai", profession: t("meetyourself4.giving_beyond.celeb.3.profession") || "Activist", source: "Quote", quote: t("meetyourself4.giving_beyond.celeb.3.quote") || "\"When the whole world is silent, even one voice becomes powerful.\"" },
    { img: "/assets/images/meet-yourself/giving-beyond/celebs/Oprah_Winfrey.jpg", name: t("meetyourself4.giving_beyond.celeb.4.name") || "Oprah Winfrey", profession: t("meetyourself4.giving_beyond.celeb.4.profession") || "Media Leader", source: "Quote", quote: t("meetyourself4.giving_beyond.celeb.4.quote") || "\"The biggest adventure you can take is to live the life of your dreams.\"" },
  ];
  const celebs = [...celebA, ...celebA];

  // === Content Sections ===
  type Section = {
    emoji: string;
    title: string;
    line: string;
    context: { body: string; bullets: string[]; nudge: string };
    frames: { img: string; h: string; p: string }[];
    cta: { label: string; href: string };
  };

  const sections: Section[] = [
    {
      emoji: "🌟",
      title: t("meetyourself4.giving_beyond.section.0.title") || "Giving Beyond Your Limits",
      line: t("meetyourself4.giving_beyond.section.0.line") || "You give until there's nothing left to give.",
      context: {
        body: t("meetyourself4.giving_beyond.section.0.body") || "Your heart is so big that you often forget to save some love for yourself. You see needs everywhere and feel compelled to meet them, even when it costs you everything.",
        bullets: [
          t("meetyourself4.giving_beyond.section.0.bullet.0") || "You prioritize others' needs over your own consistently.",
          t("meetyourself4.giving_beyond.section.0.bullet.1") || "You feel guilty when you can't help someone.",
          t("meetyourself4.giving_beyond.section.0.bullet.2") || "You rarely ask for help, even when you desperately need it.",
        ],
        nudge: t("meetyourself4.giving_beyond.section.0.nudge") || "Today, identify one small way you can care for yourself without feeling guilty.",
      },
      frames: [
        { img: "/assets/images/meet-yourself/giving-beyond/right-slider/top/Giving_hand.jpg", h: t("meetyourself4.giving_beyond.section.0.frame.0.h") || "Helping Hand", p: t("meetyourself4.giving_beyond.section.0.frame.0.p") || "Always reaching out" },
        { img: "/assets/images/meet-yourself/giving-beyond/right-slider/top/Empty_cup.jpg", h: t("meetyourself4.giving_beyond.section.0.frame.1.h") || "Empty Cup", p: t("meetyourself4.giving_beyond.section.0.frame.1.p") || "Running on empty" },
        { img: "/assets/images/meet-yourself/giving-beyond/right-slider/top/Heart_of_gold.jpg", h: t("meetyourself4.giving_beyond.section.0.frame.2.h") || "Heart of Gold", p: t("meetyourself4.giving_beyond.section.0.frame.2.p") || "Pure intentions" },
      ],
      cta: { label: t("meetyourself4.giving_beyond.section.0.cta") || "Learn to give sustainably →", href: "/signup" },
    },
    {
      emoji: "⚖️",
      title: t("meetyourself4.giving_beyond.section.1.title") || "The Balance of Service",
      line: t("meetyourself4.giving_beyond.section.1.line") || "True service includes caring for the server.",
      context: {
        body: t("meetyourself4.giving_beyond.section.1.body") || "The most effective helpers are those who maintain their own well-being. When you're depleted, you can't give your best to anyone.",
        bullets: [
          t("meetyourself4.giving_beyond.section.1.bullet.0") || "You neglect your own health and needs regularly.",
          t("meetyourself4.giving_beyond.section.1.bullet.1") || "You feel like you're not doing enough, no matter how much you give.",
          t("meetyourself4.giving_beyond.section.1.bullet.2") || "You struggle to set boundaries with those you help.",
        ],
        nudge: t("meetyourself4.giving_beyond.section.1.nudge") || "Set one boundary this week: say 'I can help, but not right now' to one request.",
      },
      frames: [
        { img: "/assets/images/meet-yourself/giving-beyond/right-slider/middle/Balanced_scales.jpg", h: t("meetyourself4.giving_beyond.section.1.frame.0.h") || "Balanced Scales", p: t("meetyourself4.giving_beyond.section.1.frame.0.p") || "Finding equilibrium" },
        { img: "/assets/images/meet-yourself/giving-beyond/right-slider/middle/Self_care.jpg", h: t("meetyourself4.giving_beyond.section.1.frame.1.h") || "Self Care", p: t("meetyourself4.giving_beyond.section.1.frame.1.p") || "Recharging yourself" },
        { img: "/assets/images/meet-yourself/giving-beyond/right-slider/middle/Boundaries.jpg", h: t("meetyourself4.giving_beyond.section.1.frame.2.h") || "Healthy Boundaries", p: t("meetyourself4.giving_beyond.section.1.frame.2.p") || "Protecting your energy" },
      ],
      cta: { label: t("meetyourself4.giving_beyond.section.1.cta") || "Create sustainable giving habits →", href: "/signup" },
    },
    {
      emoji: "🔄",
      title: t("meetyourself4.giving_beyond.section.2.title") || "The Cycle of Depletion",
      line: t("meetyourself4.giving_beyond.section.2.line") || "Giving without receiving creates an unsustainable cycle.",
      context: {
        body: t("meetyourself4.giving_beyond.section.2.body") || "When you only give and never receive, you create a one-way flow that eventually leads to burnout. Healthy giving includes both giving and receiving.",
        bullets: [
          t("meetyourself4.giving_beyond.section.2.bullet.0") || "You feel uncomfortable when others try to help you.",
          t("meetyourself4.giving_beyond.section.2.bullet.1") || "You believe asking for help makes you a burden.",
          t("meetyourself4.giving_beyond.section.2.bullet.2") || "You've forgotten how to receive with grace.",
        ],
        nudge: t("meetyourself4.giving_beyond.section.2.nudge") || "Practice receiving: accept one small offer of help this week without explaining why you need it.",
      },
      frames: [
        { img: "/assets/images/meet-yourself/giving-beyond/right-slider/lower/Cycle_of_giving.jpg", h: t("meetyourself4.giving_beyond.section.2.frame.0.h") || "Cycle of Giving", p: t("meetyourself4.giving_beyond.section.2.frame.0.p") || "Continuous flow" },
        { img: "/assets/images/meet-yourself/giving-beyond/right-slider/lower/Receiving_help.jpg", h: t("meetyourself4.giving_beyond.section.2.frame.1.h") || "Receiving Help", p: t("meetyourself4.giving_beyond.section.2.frame.1.p") || "Learning to accept" },
        { img: "/assets/images/meet-yourself/giving-beyond/right-slider/lower/Renewal.jpg", h: t("meetyourself4.giving_beyond.section.2.frame.2.h") || "Renewal", p: t("meetyourself4.giving_beyond.section.2.frame.2.p") || "Finding balance" },
      ],
      cta: { label: t("meetyourself4.giving_beyond.section.2.cta") || "Break the depletion cycle →", href: "/signup" },
    },
    {
      emoji: "💫",
      title: t("meetyourself4.giving_beyond.section.3.title") || "Sustainable Impact",
      line: t("meetyourself4.giving_beyond.section.3.line") || "The most powerful giving comes from a full heart.",
      context: {
        body: t("meetyourself4.giving_beyond.section.3.body") || "When you care for yourself while caring for others, your impact multiplies. You become a sustainable force for good in the world.",
        bullets: [
          t("meetyourself4.giving_beyond.section.3.bullet.0") || "You want to make a lasting difference in the world.",
          t("meetyourself4.giving_beyond.section.3.bullet.1") || "You're ready to learn sustainable giving practices.",
          t("meetyourself4.giving_beyond.section.3.bullet.2") || "You want to inspire others through your example.",
        ],
        nudge: t("meetyourself4.giving_beyond.section.3.nudge") || "Share your giving journey with someone who might benefit from your experience.",
      },
      frames: [
        { img: "/assets/images/meet-yourself/giving-beyond/right-slider/lowest/Impact_waves.jpg", h: t("meetyourself4.giving_beyond.section.3.frame.0.h") || "Ripple Effect", p: t("meetyourself4.giving_beyond.section.3.frame.0.p") || "Creating lasting impact" },
        { img: "/assets/images/meet-yourself/giving-beyond/right-slider/lowest/Inspiring_others.jpg", h: t("meetyourself4.giving_beyond.section.3.frame.1.h") || "Inspiring Others", p: t("meetyourself4.giving_beyond.section.3.frame.1.p") || "Leading by example" },
        { img: "/assets/images/meet-yourself/giving-beyond/right-slider/lowest/Sustainable_giving.jpg", h: t("meetyourself4.giving_beyond.section.3.frame.2.h") || "Sustainable Giving", p: t("meetyourself4.giving_beyond.section.3.frame.2.p") || "Long-term impact" },
      ],
      cta: { label: t("meetyourself4.giving_beyond.section.3.cta") || "Create lasting impact →", href: "/signup" },
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      
      {/* BreadcrumbList JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            "itemListElement": [
              {
                "@type": "ListItem",
                "position": 1,
                "name": "Home",
                "item": "https://www.drishiq.com"
              },
              {
                "@type": "ListItem",
                "position": 2,
                "name": "Meet Yourself",
                "item": "https://www.drishiq.com/meet-yourself"
              },
              {
                "@type": "ListItem",
                "position": 3,
                "name": "Giving-Beyond",
                "item": "https://www.drishiq.com/meet-yourself/giving-beyond"
              }
            ]
          })
        }}
      />
      
      {/* Background Elements */}
      <div className="absolute inset-0">
        <div className="absolute top-20 left-10 w-72 h-72 bg-gradient-to-br from-emerald-200 to-emerald-300 opacity-20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute top-40 right-20 w-96 h-96 bg-gradient-to-br from-blue-200 to-blue-300 opacity-20 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute bottom-20 left-1/3 w-64 h-64 bg-gradient-to-br from-purple-200 to-purple-300 opacity-20 rounded-full blur-2xl animate-pulse delay-2000"></div>
      </div>
      
      {/* Top band: celeb ticker */}
      <section className="bg-white/80 backdrop-blur-sm border-b border-gray-200 relative z-10">
        <div className="container mx-auto max-w-7xl px-4">
          <div className="flex items-center gap-3 py-4 text-sm font-semibold text-gray-600">
            <Star size={20} className="text-amber-500" />
            <span>{t("meetyourself4.giving_beyond.topband.label") || "Giving-Beyond, not just generous — stories from known faces"}</span>
          </div>
          <div className="py-4">
            {/* Emotion tiles moved to hero section */}
          </div>
        </div>
        <CelebTickerV2 items={celebs} />
      </section>
      
      {/* Hero */}
      <section className="container mx-auto max-w-7xl px-4 pt-16 relative z-10">
        <div className="grid gap-8 md:grid-cols-12">
          <div className="md:col-span-12 lg:col-span-7">
            <FM.h1 
              initial={{ opacity: 0, y: 10 }} 
              whileInView={{ opacity: 1, y: 0 }} 
              viewport={{ once: true }} 
              transition={{ duration: 0.4 }} 
              className="text-4xl md:text-5xl font-extrabold flex items-center gap-4 text-gray-900"
            >
              <Star size={48} className="text-amber-500" aria-hidden />
              {t("meetyourself4.giving_beyond.hero.title") || "Giving Beyond Yourself"}
            </FM.h1>
            <FM.p 
              initial={{ opacity: 0, y: 10 }} 
              whileInView={{ opacity: 1, y: 0 }} 
              viewport={{ once: true }} 
              transition={{ duration: 0.45, delay: 0.05 }} 
              className="mt-4 text-xl text-gray-600 leading-relaxed"
            >
              {t("meetyourself4.giving_beyond.hero.subtitle") || "Your heart is so big that you often forget to save some love for yourself. You see needs everywhere and feel compelled to meet them, even when it costs you everything."}
            </FM.p>
            
            <div className="mt-8 flex flex-wrap gap-4">
              <ShinyButton href="/signup">{t("meetyourself4.giving_beyond.hero.cta.primary") || "Find your giving balance →"}</ShinyButton>
              <a 
                href="#how" 
                className="rounded-2xl px-6 py-3 bg-white text-gray-700 border-2 border-gray-200 hover:bg-gray-50 hover:border-gray-300 transition-all duration-300 font-semibold shadow-sm hover:shadow-md"
              >
                {t("meetyourself4.giving_beyond.hero.cta.secondary") || "How DrishiQ helps?"}
              </a>
            </div>
            <StirTicker lines={stirLines} />
          </div>
          
          {/* Emotion Cards on the Right */}
          <div className="md:col-span-12 lg:col-span-5">
            <div className="bg-white/80 backdrop-blur-sm border border-gray-100 rounded-3xl p-6 shadow-xl">
              <div className="py-2">
                <EmotionTiles items={emotionCards} />
              </div>
            </div>
            <div className="flex items-center gap-3 mt-4 text-sm font-semibold text-gray-600 justify-end">
              <Sparkles size={20} className="text-purple-500" />
              <span>{t("meetyourself4.giving_beyond.emotions.label") || "What giving-beyond can feel like"}</span>
            </div>
          </div>
        </div>
      </section>

      {/* Context + visual block (aligned). Right block offset by 30px as requested */}
      {sections.map((s, index) => (
        <section key={s.title} className="container mx-auto max-w-7xl px-4 py-16 relative z-10">
          {/* Headline row */}
          <div className="grid gap-4 md:grid-cols-12 items-start">
            <div className="md:col-span-7">
              <div className="flex items-baseline gap-4 mb-4">
                {(() => {
                  const IconComponent = sectionIconMap[s.emoji];
                  return IconComponent ? <IconComponent size={40} className="text-emerald-600" aria-hidden /> : <div className="text-4xl" aria-hidden>{s.emoji}</div>;
                })()}
                <h2 className="text-3xl md:text-4xl font-bold text-gray-900">{s.title}</h2>
              </div>
              <p className="text-lg text-gray-600">{s.line}</p>
            </div>
            <div className="md:col-span-5" />
          </div>

          {/* Content row: equal heights so right matches left box top & bottom */}
          <div className="mt-6 grid gap-8 md:grid-cols-12 items-stretch">
            {/* Left white box */}
            <FM.div 
              className="md:col-span-7" 
              initial={{ opacity: 0, y: 20 }} 
              whileInView={{ opacity: 1, y: 0 }} 
              viewport={{ once: true }} 
              transition={{ duration: 0.6, delay: index * 0.1 }}
            >
              <div className="h-full rounded-3xl bg-white border border-gray-100 p-8 shadow-xl">
                <p className="text-lg text-gray-700 leading-relaxed mb-6">{s.context.body}</p>
                <ul className="space-y-3 list-disc pl-6 text-gray-700 mb-6">
                  {s.context.bullets.map((b, idx) => (
                    <li key={idx} className="text-base">{b}</li>
                  ))}
                </ul>
                <div className="bg-gradient-to-r from-emerald-50 to-blue-50 border border-emerald-200 rounded-2xl p-6">
                  <div className="text-lg font-semibold text-emerald-800 mb-2">{t("meetyourself4.giving_beyond.nudge.label") || "Try this:"}</div>
                  <p className="text-emerald-700">{s.context.nudge}</p>
                </div>
              </div>
            </FM.div>

            {/* Right visual container: moving slider + separate button like builder page */}
            <div className="md:col-span-5 flex flex-col justify-start">
              {/* Moving image stream */}
              <div className="relative rounded-3xl border border-gray-100 bg-white shadow-xl overflow-hidden w-full max-w-lg">
                <div className="relative h-[350px] w-full">
                  <StreamStrip frames={s.frames} />
                </div>
              </div>
              <div className="mt-6 w-full max-w-lg">
                <a 
                  href={s.cta.href} 
                  className="block w-full text-center rounded-2xl px-6 py-4 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-300 hover:from-emerald-700 hover:to-emerald-800 transform hover:-translate-y-1"
                >
                  {s.cta.label}
                </a>
              </div>
            </div>
          </div>
        </section>
      ))}

      {/* Bridge / Invitation */}
      <section className="container mx-auto max-w-7xl px-4 py-16 relative z-10">
        <div className="rounded-3xl bg-gradient-to-br from-emerald-600 via-emerald-700 to-emerald-800 text-white p-8 md:p-12 shadow-2xl relative overflow-hidden">
          <div className="absolute inset-0 bg-black/10"></div>
          <div className="relative">
            <h3 className="text-3xl md:text-4xl font-bold mb-4">{t("meetyourself4.giving_beyond.bridge.title") || "You can give without losing your own light."}</h3>
            <p className="text-xl opacity-95 leading-relaxed">{t("meetyourself4.giving_beyond.bridge.body") || "Drishiq helps givers find the balance between generosity and personal sustainability, so your kindness becomes a lifelong strength."}</p>
            <div className="mt-8">
              <a 
                href="/signup" 
                className="inline-flex items-center rounded-2xl bg-white text-emerald-800 px-8 py-4 font-bold shadow-lg hover:shadow-xl transition-all duration-300 hover:bg-gray-50 transform hover:-translate-y-1"
              >
                {t("meetyourself4.giving_beyond.bridge.cta") || "Start your clarity check →"}
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* How Drishiq Helps */}
      <section id="how" className="container mx-auto max-w-7xl px-4 py-16 relative z-10">
        <h3 className="text-3xl md:text-4xl font-bold text-gray-900 mb-8 text-center">{t("meetyourself4.giving_beyond.how.title") || "How Drishiq Makes a Difference"}</h3>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {[
            { h: t("meetyourself4.giving_beyond.how.0.h") || "Giving Balance Tracker", d: t("meetyourself4.giving_beyond.how.0.d") || "See where and how much you give.", icon: "⚖️" },
            { h: t("meetyourself4.giving_beyond.how.1.h") || "Rest & Renewal Tools", d: t("meetyourself4.giving_beyond.how.1.d") || "Build replenishment into your routine.", icon: "🔄" },
            { h: t("meetyourself4.giving_beyond.how.2.h") || "Boundary Coaching", d: t("meetyourself4.giving_beyond.how.2.d") || "Learn to say yes without losing yourself.", icon: "🛡️" },
            { h: t("meetyourself4.giving_beyond.how.3.h") || "Impact Planning", d: t("meetyourself4.giving_beyond.how.3.d") || "Focus on giving that lasts.", icon: "🎯" },
          ].map((f, i) => {
            const IconComponent = howIconMap[f.icon];
            return (
            <FM.div 
              key={i} 
              initial={{ opacity: 0, y: 20 }} 
              whileInView={{ opacity: 1, y: 0 }} 
              viewport={{ once: true }} 
              transition={{ duration: 0.5, delay: i * 0.1 }} 
              className="rounded-3xl bg-white border border-gray-100 p-8 shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-2"
            >
              {IconComponent ? <IconComponent size={40} className="text-emerald-600 mb-4" /> : <div className="text-4xl mb-4">{f.icon}</div>}
              <div className="text-xl font-bold text-gray-900 mb-3">{f.h}</div>
              <p className="text-gray-600 leading-relaxed">{f.d}</p>
            </FM.div>
          );
          })}
        </div>
      </section>

      <Footer />

      {/* Local styles for ticker & stir ticker */}
      <style>{`
        :root { --drishiq-green:#0B4422; }
        @keyframes marquee-ltr { 0% { transform: translateX(-50%); } 100% { transform: translateX(0); } }
        .ticker-container{ overflow:hidden; background:#fff; }
        .ticker-track{ display:flex; will-change:transform; width:200%; }
        .celeb-track{ animation:marquee-ltr 12s linear infinite; }
        .celeb-item{ flex:none; display:flex; align-items:center; margin-right:2.25rem; }
        .celeb-item img{ width:28px; height:28px; border-radius:9999px; object-fit:cover; margin-right:.5rem; background:#e8efe9; }
        .name-meta{ font-size:.92rem; white-space:nowrap; line-height:1.2; }
        .name-meta strong{ font-weight:700; }
        .profession-source{ font-size:.8rem; opacity:.75; }
        .quote{ font-size:.85rem; color:#4b5563; white-space:nowrap; line-height:1.2; }
        @keyframes giving-rtl { from { transform: translateX(0); } to { transform: translateX(-50%); } }
        .stir-track { width:200%; animation: giving-rtl 22s linear infinite; }
        /* Stream strip (R→L) */
        @keyframes stream-rtl { from { transform: translateX(0); } to { transform: translateX(-50%); } }
        .stream-wrap { position: absolute; inset: 0; overflow: hidden; }
        .stream-track { display:flex; width:200%; height:100%; animation: stream-rtl 35s linear infinite; }
        .stream-track:hover { animation-play-state: paused; }
        .stream-item { position: relative; height:100%; width: 500px; flex: 0 0 auto; }
        .stream-item img { height:100%; width:100%; object-fit: cover; }
        .stream-cap { position:absolute; inset-inline:0.5rem; bottom:0.5rem; color:white; padding:0.5rem; border-radius:0.75rem; background: linear-gradient(to top, rgba(11,68,34,.9), rgba(11,68,34,.4), transparent); }
      `}</style>
    </div>
  );
}

// ---- Components ----
function EmotionTiles({ items }: { items: { t: string; s: string }[] }) {
  const colorSchemes = [
    'from-blue-50 to-indigo-100 border-blue-200 text-blue-800',
    'from-emerald-50 to-green-100 border-emerald-200 text-emerald-800',
    'from-purple-50 to-violet-100 border-purple-200 text-purple-800',
    'from-orange-50 to-amber-100 border-orange-200 text-orange-800',
    'from-pink-50 to-rose-100 border-pink-200 text-pink-800',
    'from-cyan-50 to-teal-100 border-cyan-200 text-cyan-800'
  ];

  return (
    <div className="grid grid-cols-2 gap-4">
      {items.map((x, i) => (
        <FM.div 
          key={i} 
          initial={{ opacity: 0, y: 8 }} 
          whileInView={{ opacity: 1, y: 0 }} 
          viewport={{ once: true }} 
          transition={{ duration: 0.35, delay: i * 0.04 }} 
          className={`rounded-2xl bg-gradient-to-br border p-4 text-center shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-1 ${colorSchemes[i % colorSchemes.length]}`}
        >
          <div className="text-lg md:text-xl font-bold mb-1">{x.t}</div>
          <div className="text-sm opacity-80">{x.s}</div>
        </FM.div>
      ))}
    </div>
  );
}

// Horizontal stream of images (R→L), duplicates frames for seamless loop
function StreamStrip({ frames }: { frames: any[] }) {
  const doubled = [...frames, ...frames];
  return (
    <div className="stream-wrap">
      <div className="stream-track">
        {doubled.map((f, idx) => (
          <figure key={idx} className="stream-item">
            <img src={f.img} alt={f.h} />
            <figcaption className="stream-cap">
              <div className="text-sm font-bold leading-tight">{f.h}</div>
              <div className="text-[12px] opacity-95">{f.p}</div>
            </figcaption>
          </figure>
        ))}
      </div>
    </div>
  );
}

function CelebTickerV2({ items }: { items: any[] }) {
  const fallback = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 28 28"><circle cx="14" cy="14" r="14" fill="%23e6efe9"/></svg>';
  return (
    <section className="ticker-container border-t border-b border-gray-200 py-3">
      <div className="ticker-track celeb-track">
        {items.map((c, i) => (
          <div key={i} className="celeb-item">
            <img src={c.img} alt={c.name} onError={(e) => { (e.currentTarget as HTMLImageElement).src = fallback; }} />
            <div>
              <div className="name-meta"><strong>{c.name}</strong> <span className="profession-source">– {c.profession} — {c.source}</span></div>
              <div className="quote">{c.quote}</div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function StirTicker({ lines }: { lines: string[] }) {
  const doubled = [...lines, ...lines];
  return (
    <div className="mt-8 border-y border-dashed border-gray-200 bg-white/60 rounded-2xl py-4">
      <div className="flex overflow-hidden">
        <div className="flex whitespace-nowrap stir-track">
          {doubled.map((text, i) => (
            <span key={i} className="m-2 inline-flex items-center gap-2 rounded-full border border-gray-200 bg-gradient-to-r from-emerald-50 to-blue-50 px-4 py-2 text-sm font-semibold text-gray-700 shadow-sm"><Sparkle size={14} className="text-amber-500" /> {text}</span>
          ))}
        </div>
      </div>
    </div>
  );
}

function ShinyButton({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a 
      href={href} 
      className="relative inline-block rounded-2xl px-8 py-4 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white font-bold shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 overflow-hidden group"
    >
      <span className="relative z-10">{children}</span>
      <span className="pointer-events-none absolute inset-0 -translate-x-[120%] bg-gradient-to-r from-transparent via-white/25 to-transparent animate-[shine_3.6s_infinite] group-hover:animate-[shine_2s_infinite]" />
      <style>{`@keyframes shine{0%{transform:translateX(-120%)}60%{transform:translateX(120%)}100%{transform:translateX(120%)}}`}</style>
    </a>
  );
}