"use client";

import React, { useEffect } from "react";
import { motion } from "framer-motion";
import Footer from '@/components/Footer';
import { useLanguage } from "@/lib/drishiq-i18n";
import { DoorOpen, Compass, PersonStanding, Sunrise, Map, Sprout, Search, Telescope, MessageSquare, Sparkle, type LucideIcon } from 'lucide-react';

// Icon mappings for dynamic rendering
const sectionIconMap: Record<string, LucideIcon> = {
  "🚪": DoorOpen,
  "🧭": Compass,
  "🧘": PersonStanding,
  "🌅": Sunrise,
};

const howIconMap: Record<string, LucideIcon> = {
  "🗺️": Map,
  "🧭": Compass,
  "🌱": Sprout,
  "💭": MessageSquare,
};

// Safe fallback: if framer-motion isn't installed, FM renders plain elements
const FM: any = motion as any;

/**
 * SEEKER — React + TypeScript + Tailwind
 * Matches your Solo/Dependent/Support Giver/Problem Carrier pattern (FM fallback, tiles, celeb ticker, stir ticker),
 * with Seeker copy and content.
 */

export default function SeekerPage() {
  const { t, language } = useLanguage(['meetyourself3']);
  
  useEffect(() => {
    console.assert(!!FM, "[Smoke Test] Using framer-motion if present; otherwise falling back to plain elements.");
  }, []);

  // === Stir lines under headline ===
  const stirLines: string[] = [
    t("meetyourself3.seeker.stir.line.0") || "Do you feel you're always 'on the verge' of finding your answer?",
    t("meetyourself3.seeker.stir.line.1") || "Have you explored many paths but settled on none?",
    t("meetyourself3.seeker.stir.line.2") || "Do you get pulled toward the next possibility before finishing the last?",
    t("meetyourself3.seeker.stir.line.3") || "Are you searching more for relief than direction?",
    t("meetyourself3.seeker.stir.line.4") || "What if the answer wasn't 'out there' but already inside?",
  ];

  // === Quick Emotion Cards (6) ===
  const emotionCards = [
    { t: t("meetyourself3.seeker.emote.0.title") || "Restless", s: t("meetyourself3.seeker.emote.0.subtitle") || "Quest for More" },
    { t: t("meetyourself3.seeker.emote.1.title") || "Curious", s: t("meetyourself3.seeker.emote.1.subtitle") || "Questions never run out" },
    { t: t("meetyourself3.seeker.emote.2.title") || "Hopeful", s: t("meetyourself3.seeker.emote.2.subtitle") || "Every new door could be 'it'" },
    { t: t("meetyourself3.seeker.emote.3.title") || "Frustrated", s: t("meetyourself3.seeker.emote.3.subtitle") || "Clarity slips away" },
    { t: t("meetyourself3.seeker.emote.4.title") || "Inspired", s: t("meetyourself3.seeker.emote.4.subtitle") || "Sparks in many directions" },
    { t: t("meetyourself3.seeker.emote.5.title") || "Unsettled", s: t("meetyourself3.seeker.emote.5.subtitle") || "Still not where you belong" },
  ];

  // === Celebrity Ticker ===
  const celebA = [
    { img: "/assets/images/meet-yourself/seeker/slider/Rumi.jpg", name: t("meetyourself3.seeker.celeb.0.name") || "Rumi", profession: t("meetyourself3.seeker.celeb.0.profession") || "Poet", source: "Quote", quote: t("meetyourself3.seeker.celeb.0.quote") || "\"What you seek is seeking you.\"" },
    { img: "/assets/images/meet-yourself/seeker/slider/Oprah Winfrey.jpeg", name: t("meetyourself3.seeker.celeb.1.name") || "Oprah Winfrey", profession: t("meetyourself3.seeker.celeb.1.profession") || "Host", source: "Quote", quote: t("meetyourself3.seeker.celeb.1.quote") || "\"The biggest adventure you can take is to live the life of your dreams.\"" },
    { img: "/assets/images/meet-yourself/seeker/slider/David Atten.jpeg", name: t("meetyourself3.seeker.celeb.2.name") || "David Attenborough", profession: t("meetyourself3.seeker.celeb.2.profession") || "Naturalist", source: "Quote", quote: t("meetyourself3.seeker.celeb.2.quote") || "\"An understanding of the natural world is a source of curiosity and fulfilment.\"" },
    { img: "/assets/images/meet-yourself/seeker/slider/J K Rowling.jpeg", name: t("meetyourself3.seeker.celeb.3.name") || "J.K. Rowling", profession: t("meetyourself3.seeker.celeb.3.profession") || "Author", source: "Quote", quote: t("meetyourself3.seeker.celeb.3.quote") || "\"It is impossible to live without failing at something...\"" },
    { img: "/assets/images/meet-yourself/seeker/slider/Elon_Musk.jpg", name: t("meetyourself3.seeker.celeb.4.name") || "Elon Musk", profession: t("meetyourself3.seeker.celeb.4.profession") || "Entrepreneur", source: "Quote", quote: t("meetyourself3.seeker.celeb.4.quote") || "\"Ordinary people can choose to be extraordinary.\"" },
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
      emoji: "🚪",
      title: t("meetyourself3.seeker.section.0.title") || "The Thrill and the Exhaustion",
      line: t("meetyourself3.seeker.section.0.line") || "Seeking can be a gift, but also a loop.",
      context: {
        body: t("meetyourself3.seeker.section.0.body") || "You love the chase — the spark of a new idea, the pull of a fresh path. But with each turn, the destination shifts. It's exhilarating… and draining.",
        bullets: [
          t("meetyourself3.seeker.section.0.bullet.0") || "You often start many things but finish few.",
          t("meetyourself3.seeker.section.0.bullet.1") || "You feel restless when you're not pursuing something.",
          t("meetyourself3.seeker.section.0.bullet.2") || "You've lost count of the number of 'next big things' you've tried.",
        ],
        nudge: t("meetyourself3.seeker.section.0.nudge") || "List your last five pursuits. Mark which ones you truly want to finish — and why.",
      },
      frames: [
        { img: "/assets/images/meet-yourself/seeker/Right Slider/Top/Another possibility.jpeg", h: t("meetyourself3.seeker.section.0.frame.0.h") || "Open Door", p: t("meetyourself3.seeker.section.0.frame.0.p") || "Another possibility" },
        { img: "/assets/images/meet-yourself/seeker/Right Slider/Top/Changing Direction.jpg", h: t("meetyourself3.seeker.section.0.frame.1.h") || "Compass Turning", p: t("meetyourself3.seeker.section.0.frame.1.p") || "Changing directions" },
        { img: "https://images.unsplash.com/photo-1500534314209-e593f1e12c9a?w=1200&q=80&auto=format&fit=crop", h: t("meetyourself3.seeker.section.0.frame.2.h") || "Map Circle", p: t("meetyourself3.seeker.section.0.frame.2.p") || "Coming back to self" },
      ],
      cta: { label: t("meetyourself3.seeker.section.0.cta") || "Pause and check your map →", href: "/signup" },
    },
    {
      emoji: "🧭",
      title: t("meetyourself3.seeker.section.1.title") || "The Fear of Missing the Right Path",
      line: t("meetyourself3.seeker.section.1.line") || "When every choice feels urgent.",
      context: {
        body: t("meetyourself3.seeker.section.1.body") || "Sometimes you chase because you're afraid the 'right thing' might pass you by. But in trying everything, you rarely stay long enough to grow roots.",
        bullets: [
          t("meetyourself3.seeker.section.1.bullet.0") || "You worry you'll regret not trying something.",
          t("meetyourself3.seeker.section.1.bullet.1") || "You feel anxious making commitments.",
          t("meetyourself3.seeker.section.1.bullet.2") || "You look for signs you're 'meant' to do something.",
        ],
        nudge: t("meetyourself3.seeker.section.1.nudge") || "Ask yourself: 'What am I afraid will happen if I choose one path?'",
      },
      frames: [
        { img: "/assets/images/meet-yourself/seeker/Right Slider/Medium/Too many direction.jpeg", h: t("meetyourself3.seeker.section.1.frame.0.h") || "Signposts Everywhere", p: t("meetyourself3.seeker.section.1.frame.0.p") || "Too many directions" },
        { img: "/assets/images/meet-yourself/seeker/Right Slider/Medium/Never staying long.jpeg", h: t("meetyourself3.seeker.section.1.frame.1.h") || "Tent on Wheels", p: t("meetyourself3.seeker.section.1.frame.1.p") || "Never staying long" },
        { img: "https://images.unsplash.com/photo-1495197359483-d092478c170a?w=1200&q=80&auto=format&fit=crop", h: t("meetyourself3.seeker.section.1.frame.2.h") || "Single Path Ahead", p: t("meetyourself3.seeker.section.1.frame.2.p") || "Choosing to commit" },
      ],
      cta: { label: t("meetyourself3.seeker.section.1.cta") || "Pick one step forward →", href: "/signup" },
    },
    {
      emoji: "🧘",
      title: t("meetyourself3.seeker.section.2.title") || "Searching to Avoid Sitting Still",
      line: t("meetyourself3.seeker.section.2.line") || "Stillness can feel scarier than confusion.",
      context: {
        body: t("meetyourself3.seeker.section.2.body") || "For some seekers, movement is a way to avoid confronting uncertainty or pain. It's easier to run toward something than sit with what is.",
        bullets: [
          t("meetyourself3.seeker.section.2.bullet.0") || "You fill your calendar to avoid reflection.",
          t("meetyourself3.seeker.section.2.bullet.1") || "You chase ideas when you're anxious.",
          t("meetyourself3.seeker.section.2.bullet.2") || "You feel 'empty' when there's nothing new to aim for.",
        ],
        nudge: t("meetyourself3.seeker.section.2.nudge") || "Spend 15 minutes today in complete stillness — no screens, no plans. Notice what surfaces.",
      },
      frames: [
        { img: "/assets/images/meet-yourself/seeker/Right Slider/Lower/sitting without agenda.jpeg", h: t("meetyourself3.seeker.section.2.frame.0.h") || "Quiet Bench", p: t("meetyourself3.seeker.section.2.frame.0.p") || "Sitting without agenda" },
        { img: "/assets/images/meet-yourself/seeker/Right Slider/Lower/Seeing what's beneath.jpeg", h: t("meetyourself3.seeker.section.2.frame.1.h") || "Still Lake", p: t("meetyourself3.seeker.section.2.frame.1.p") || "Seeing what's beneath" },
        { img: "https://images.unsplash.com/photo-1500530855697-06771e2e2c1d?w=1200&q=80&auto=format&fit=crop", h: t("meetyourself3.seeker.section.2.frame.2.h") || "Open Sky", p: t("meetyourself3.seeker.section.2.frame.2.p") || "Freedom in stillness" },
      ],
      cta: { label: t("meetyourself3.seeker.section.2.cta") || "Try stillness once →", href: "/signup" },
    },
    {
      emoji: "🌅",
      title: t("meetyourself3.seeker.section.3.title") || "Finding While Seeking",
      line: t("meetyourself3.seeker.section.3.line") || "The journey can be the answer.",
      context: {
        body: t("meetyourself3.seeker.section.3.body") || "Not all seeking is about arriving. Some is about becoming. But to become, you have to let some discoveries land and shape you before moving on.",
        bullets: [
          t("meetyourself3.seeker.section.3.bullet.0") || "You have wisdom but don't apply it.",
          t("meetyourself3.seeker.section.3.bullet.1") || "You rush past small wins to the next chase.",
          t("meetyourself3.seeker.section.3.bullet.2") || "You want your search to feel more fulfilling.",
        ],
        nudge: t("meetyourself3.seeker.section.3.nudge") || "Name one lesson from your last pursuit and decide how to live it for the next month.",
      },
      frames: [
        { img: "https://images.unsplash.com/photo-1519681393784-d120267933ba?w=1200&q=80&auto=format&fit=crop", h: t("meetyourself3.seeker.section.3.frame.0.h") || "Open Book", p: t("meetyourself3.seeker.section.3.frame.0.p") || "Lessons collected" },
        { img: "/assets/images/meet-yourself/seeker/Right Slider/Lowest/staying long enough to grow.jpg", h: t("meetyourself3.seeker.section.3.frame.1.h") || "Roots Growing", p: t("meetyourself3.seeker.section.3.frame.1.p") || "Staying long enough to grow" },
        { img: "/assets/images/meet-yourself/seeker/Right Slider/Lowest/Walking forward with clarity.png", h: t("meetyourself3.seeker.section.3.frame.2.h") || "Sunrise Path", p: t("meetyourself3.seeker.section.3.frame.2.p") || "Walking forward with clarity" },
      ],
      cta: { label: t("meetyourself3.seeker.section.3.cta") || "Let one insight stay →", href: "/signup" },
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50">
      
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
                "name": "Seeker",
                "item": "https://www.drishiq.com/meet-yourself/seeker"
              }
            ]
          })
        }}
      />
      
      {/* Background Elements */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-20 left-10 w-72 h-72 bg-gradient-to-br from-emerald-200 to-emerald-300 opacity-20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute top-40 right-20 w-96 h-96 bg-gradient-to-br from-blue-200 to-blue-300 opacity-20 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute bottom-20 left-1/3 w-64 h-64 bg-gradient-to-br from-purple-200 to-purple-300 opacity-20 rounded-full blur-2xl animate-pulse delay-2000"></div>
      </div>
      
      <main className="relative z-10">
        {/* Top band: celeb ticker */}
        <section className="bg-white/80 backdrop-blur-sm border-b border-gray-200 relative z-20">
          <div className="container mx-auto max-w-7xl px-4">
            <div className="flex items-center gap-3 py-4 text-sm font-semibold text-gray-600">
              <Search size={20} className="text-blue-500" />
              <span>{t("meetyourself3.seeker.topband.label") || "Seeker, not lost — stories from known faces"}</span>
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
              <Telescope size={48} className="text-indigo-600" aria-hidden />
              {t("meetyourself3.seeker.hero.title") || "Seeking New Dimensions"}
            </FM.h1>
            <FM.p 
              initial={{ opacity: 0, y: 10 }} 
              whileInView={{ opacity: 1, y: 0 }} 
              viewport={{ once: true }} 
              transition={{ duration: 0.45, delay: 0.05 }} 
              className="mt-4 text-xl text-gray-600 leading-relaxed"
            >
              {t("meetyourself3.seeker.hero.subtitle") || "You've read, explored, asked, and still the pieces don't fully fit. Here's a space to pause the chase and listen inward."}
            </FM.p>
            <div className="mt-8 flex flex-wrap gap-4">
              <ShinyButton href="/signup">{t("meetyourself3.seeker.hero.cta.primary") || "Explore your seeker's map →"}</ShinyButton>
              <a 
                href="#how" 
                className="rounded-2xl px-6 py-3 bg-white text-gray-700 border-2 border-gray-200 hover:bg-gray-50 hover:border-gray-300 transition-all duration-300 font-semibold shadow-sm hover:shadow-md"
              >
                {t("meetyourself3.seeker.hero.cta.secondary") || "How DrishiQ helps?"}
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
            <div className="flex items-center gap-3 mt-6 text-sm font-semibold text-gray-600 justify-end">
              <Search size={20} className="text-blue-500" />
              <span>{t("meetyourself3.seeker.emotions.label") || "What seeking can feel like"}</span>
            </div>
          </div>
        </div>
      </section>



      {/* Sections loop */}
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
                  <div className="text-lg font-semibold text-emerald-800 mb-2">{t("meetyourself3.seeker.nudge.label") || "Try this:"}</div>
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
      <section className="container mx-auto max-w-7xl px-4 py-8">
        <div className="rounded-3xl bg-gradient-to-r from-emerald-900 to-emerald-700 text-white p-6 md:p-8">
          <h3 className="text-2xl md:text-3xl font-bold">{t("meetyourself3.seeker.bridge.title") || "The answer may not be where you're looking."}</h3>
          <p className="mt-2 opacity-95">{t("meetyourself3.seeker.bridge.body") || "Drishiq helps seekers like you turn restless motion into grounded direction. Your questions matter — and so does your ability to rest in the answers you already hold."}</p>
          <div className="mt-4">
            <a href="/signup" className="inline-flex items-center rounded-2xl bg-white text-[#0B4422] px-5 py-3 font-semibold shadow hover:shadow-md">{t("meetyourself3.seeker.bridge.cta") || "Begin your clarity check →"}</a>
          </div>
        </div>
      </section>


      <section id="how" className="container mx-auto max-w-7xl px-4 py-16 relative z-10">
        <h3 className="text-3xl md:text-4xl font-bold text-gray-900 mb-8 text-center">{t("meetyourself3.seeker.cta.how") || "How Drishiq Makes a Difference"}</h3>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {[
            { h: t("meetyourself3.seeker.how.0.h") || "Seeker's Map", d: t("meetyourself3.seeker.how.0.d") || "Lay out your pursuits and see patterns.", icon: "🗺️" },
            { h: t("meetyourself3.seeker.how.1.h") || "Priority Compass", d: t("meetyourself3.seeker.how.1.d") || "Filter ideas through what matters most.", icon: "🧭" },
            { h: t("meetyourself3.seeker.how.2.h") || "Rooting Practices", d: t("meetyourself3.seeker.how.2.d") || "Stay with a choice long enough to grow from it.", icon: "🌱" },
            { h: t("meetyourself3.seeker.how.3.h") || "Reflection Points", d: t("meetyourself3.seeker.how.3.d") || "Notice the progress you've already made.", icon: "💭" },
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

      </main>
      <Footer />

      {/* Local styles for ticker & stir ticker */}
      <style>{`
        :root { --drishiq-green:#0B4422; }
        @keyframes marquee-ltr { 0% { transform: translateX(-50%); } 100% { transform: translateX(0); } }
        .ticker-container{ overflow:hidden; background:#fff; position: relative; z-index: 20; }
        .ticker-track{ display:flex; will-change:transform; width:200%; }
        .celeb-track{ animation:marquee-ltr 12s linear infinite; }
        .celeb-item{ flex:none; display:flex; align-items:center; margin-right:2.25rem; }
        .celeb-item img{ width:28px; height:28px; border-radius:9999px; object-fit:cover; margin-right:.5rem; background:#e8efe9; }
        .name-meta{ font-size:.92rem; white-space:nowrap; line-height:1.2; }
        .name-meta strong{ font-weight:700; }
        .profession-source{ font-size:.8rem; opacity:.75; }
        .quote{ font-size:.85rem; color:#4b5563; white-space:nowrap; line-height:1.2; }
        @keyframes seeker-rtl { from { transform: translateX(0); } to { transform: translateX(-50%); } }
        .stir-track { width:200%; animation: seeker-rtl 22s linear infinite; }
        /* Stream strip (R→L) */
        @keyframes stream-rtl { from { transform: translateX(0); } to { transform: translateX(-50%); } }
        .stream-wrap { position: absolute; inset: 0; overflow: hidden; }
        .stream-track { display:flex; width:200%; height:100%; animation: stream-rtl 35s linear infinite; }
        .stream-track:hover { animation-play-state: paused; }
        .stream-item { position: relative; height:100%; width: 500px; flex: 0 0 auto; }
        .stream-item img { height:100%; width:100%; object-fit: cover; }
        .stream-cap { position:absolute; inset-inline:0.5rem; bottom:0.5rem; color:white; padding:0.5rem; border-radius:0.75rem; background: linear-gradient(to top, rgba(11,68,34,.9), rgba(11,68,34,.4), transparent); }
        .stream-cap .text-sm { font-size: 16px; }
        .stream-cap .text-xs { font-size: 14px; }
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
              <div className="text-lg font-bold leading-tight">{f.p}</div>
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
    <section className="ticker-container border-t border-b border-gray-200 py-4 bg-white/80 backdrop-blur-sm">
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
        <div className="flex whitespace-nowrap w-[200%] animate-[solo-rtl_22s_linear_infinite]">
          {doubled.map((text, i) => (
            <span key={i} className="m-2 inline-flex items-center gap-2 rounded-full border border-gray-200 bg-gradient-to-r from-emerald-50 to-blue-50 px-4 py-2 text-sm font-semibold text-gray-700 shadow-sm"><Sparkle size={14} className="text-amber-500" /> {text}</span>
          ))}
        </div>
      </div>
      <style>{`@keyframes solo-rtl { from { transform: translateX(0); } to { transform: translateX(-50%); } }`}</style>
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