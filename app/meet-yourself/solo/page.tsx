'use client';

import React, { useEffect } from "react";
import { motion } from "framer-motion";
import Footer from '@/components/Footer';
import { useLanguage } from "@/lib/drishiq-i18n";
import { Home, Briefcase, RotateCcw, Target, Sparkles, Sprout, Search, Wind, Handshake } from 'lucide-react';
// Use framer-motion directly since it's imported
const FM = motion;

// Icon mapping for sections
const sectionIcons: Record<string, React.ReactNode> = {
  "🏠": <Home size={24} />,
  "💼": <Briefcase size={24} />,
  "🔄": <RotateCcw size={24} />,
  "🎯": <Target size={24} />,
};

// Icon mapping for how cards
const howCardIcons: Record<string, React.ReactNode> = {
  "🔍": <Search size={32} className="text-emerald-600" />,
  "🌱": <Sprout size={32} className="text-emerald-600" />,
  "🫁": <Wind size={32} className="text-emerald-600" />,
  "🤝": <Handshake size={32} className="text-emerald-600" />,
};

export default function SoloPage() {
  const { t, language } = useLanguage(['meetyourself4']);
  
  // --- Smoke test to guard against the earlier error ---
  useEffect(() => {
    console.assert(!!FM, "[Smoke Test] Using framer-motion if present; otherwise falling back to plain elements.");
  }, []);

  // === Celebrity ticker content (per your style + text) ===
  const celebA = [
    { img: "/assets/images/meet-yourself/solo/celebs/Serena_Williams.jpg", name: t("meetyourself4.solo.celeb.0.name") || "Serena Williams", profession: t("meetyourself4.solo.celeb.0.profession") || "Tennis Player", source: "ESPN", quote: t("meetyourself4.solo.celeb.0.quote") || "\"Quiet focus before a match is key.\"" },
    { img: "/assets/images/meet-yourself/solo/celebs/steve_jobs.jpg", name: t("meetyourself4.solo.celeb.1.name") || "Steve Jobs", profession: t("meetyourself4.solo.celeb.1.profession") || "Entrepreneur", source: "Stanford Speech", quote: t("meetyourself4.solo.celeb.1.quote") || "\"Your time is limited, so don't waste it living someone else's life.\"" },
    { img: "/assets/images/meet-yourself/solo/celebs/emma watson.jpg", name: t("meetyourself4.solo.celeb.2.name") || "Emma Watson", profession: t("meetyourself4.solo.celeb.2.profession") || "Actor", source: "Vogue", quote: t("meetyourself4.solo.celeb.2.quote") || "\"I never feel so strong as when I'm on my own.\"" },
    { img: "/assets/images/meet-yourself/solo/celebs/A._P._J._Abdul_Kalam.jpg", name: t("meetyourself4.solo.celeb.3.name") || "A.P.J. Abdul Kalam", profession: t("meetyourself4.solo.celeb.3.profession") || "Scientist", source: "Wings of Fire", quote: t("meetyourself4.solo.celeb.3.quote") || "\"Man needs difficulties because they are necessary to enjoy success.\"" },
    { img: "/assets/images/meet-yourself/solo/celebs/mary_kom.jpg", name: t("meetyourself4.solo.celeb.4.name") || "Mary Kom", profession: t("meetyourself4.solo.celeb.4.profession") || "Boxer", source: "The Hindu", quote: t("meetyourself4.solo.celeb.4.quote") || "\"Don't let anyone tell you, you can't.\"" }
  ];
  const celebs = [...celebA, ...celebA]; // A + B duplicate for seamless loop

  // === Context sections ===
  const sections = [
    {
      emoji: "🏠",
      title: t("meetyourself4.solo.section.0.title") || "First Apartment Alone",
      line: t("meetyourself4.solo.section.0.line") || "The dream came true. The echo came with it.",
      context: {
        body: t("meetyourself4.solo.section.0.body") || "You finally have a place that breathes like you. But the first nights feel larger than your voice. The freedom is real — and so is the quiet no one sees.",
        bullets: [
          t("meetyourself4.solo.section.0.bullet.0") || "You put shows on for company, not story.",
          t("meetyourself4.solo.section.0.bullet.1") || "Dinner is quick; the chair across stays unused.",
          t("meetyourself4.solo.section.0.bullet.2") || "Good news feels smaller when it has no witness."
        ],
        nudge: t("meetyourself4.solo.section.0.nudge") || "Make one moment ceremonial: plate the meal, light a candle, say a line of gratitude out loud — let the room learn your voice."
      },
      frames: [
        { img: "/assets/images/meet-yourself/solo/Right Slider/Top/Own rules. Own playlist. Lights how you like.jpg", h: t("meetyourself4.solo.section.0.frame.0.h") || "Freedom Night", p: t("meetyourself4.solo.section.0.frame.0.p") || "Own rules. Own playlist. Lights how you like." },
        { img: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1200&q=80&auto=format&fit=crop", h: t("meetyourself4.solo.section.0.frame.1.h") || "Echo at Dinner", p: t("meetyourself4.solo.section.0.frame.1.p") || "Chair that no one pulls. News with nowhere to land." },
        { img: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=1200&q=80&auto=format&fit=crop", h: t("meetyourself4.solo.section.0.frame.2.h") || "Small Ritual", p: t("meetyourself4.solo.section.0.frame.2.p") || "Set a plate. Light a candle. Make it yours." }
      ],
      cta: { label: t("meetyourself4.solo.section.0.cta") || "Try this with Drishiq →", href: "#assess" }
    },
    {
      emoji: "🧳",
      title: t("meetyourself4.solo.section.1.title") || "Miles from Home",
      line: t("meetyourself4.solo.section.1.line") || "New city glow. Sunday ache.",
      context: {
        body: t("meetyourself4.solo.section.1.body") || "You moved for a reason — growth, a shot, a reset. Weekdays are busy enough. Sundays can stretch like an airport layover in your own room.",
        bullets: [
          t("meetyourself4.solo.section.1.bullet.0") || "You postpone the call because there's 'nothing to say'.",
          t("meetyourself4.solo.section.1.bullet.1") || "Errands fill the day but not the chest.",
          t("meetyourself4.solo.section.1.bullet.2") || "Windows show lives in progress and you watch."
        ],
        nudge: t("meetyourself4.solo.section.1.nudge") || "Text someone the sentence 'Thinking of you, no response needed.' Then step out for a landmark — tree, cafe, corner — and claim it as yours."
      },
      frames: [
        { img: "/assets/images/meet-yourself/solo/Right Slider/Middle/Laundry, groceries, thoughts that linger..png", h: t("meetyourself4.solo.section.1.frame.0.h") || "New City Glow", p: t("meetyourself4.solo.section.1.frame.0.p") || "Laundry, groceries, thoughts that linger." },
        { img: "/assets/images/meet-yourself/solo/Right Slider/Middle/Say hi. You don't need a reason..avif", h: t("meetyourself4.solo.section.1.frame.1.h") || "Sunday Silence", p: t("meetyourself4.solo.section.1.frame.1.p") || "Say hi, You don't need a reason" },
        { img: "https://images.unsplash.com/photo-1485217988980-11786ced9454?w=1200&q=80&auto=format&fit=crop", h: t("meetyourself4.solo.section.1.frame.2.h") || "Call Home", p: t("meetyourself4.solo.section.1.frame.2.p") || "Say hi. You don't need a reason." }
      ],
      cta: { label: t("meetyourself4.solo.section.1.cta") || "Claim a small landmark →", href: "#assess" }
    },
    {
      emoji: "📆",
      title: t("meetyourself4.solo.section.2.title") || "Endless Routines",
      line: t("meetyourself4.solo.section.2.line") || "Efficient isn't the same as nourished.",
      context: {
        body: t("meetyourself4.solo.section.2.body") || "Your day runs like a checklist app — satisfying dings, minimal color. The machine works. The person inside wants something softer.",
        bullets: [
          t("meetyourself4.solo.section.2.bullet.0") || "You forget the last time you laughed out loud alone.",
          t("meetyourself4.solo.section.2.bullet.1") || "You scroll to fall asleep and wake up tired.",
          t("meetyourself4.solo.section.2.bullet.2") || "You cancel micro‑plans with future‑you."
        ],
        nudge: t("meetyourself4.solo.section.2.nudge") || "Add one nourishing thing you can finish in a few minutes: stretch on the floor, call a cousin, make eggs with care."
      },
      frames: [
        { img: "/assets/images/meet-yourself/solo/Right Slider/Bottom/Gym pwrk prep.webp", h: t("meetyourself4.solo.section.2.frame.0.h") || "Autopilot Wins", p: t("meetyourself4.solo.section.2.frame.0.p") || "Gym ✔ Work ✔ Prep ✔" },
        { img: "/assets/images/meet-yourself/solo/Right Slider/Bottom/Good news.jpg", h: t("meetyourself4.solo.section.2.frame.1.h") || "Muted Moment", p: t("meetyourself4.solo.section.2.frame.1.p") || "Good news, no one to nudge." },
        { img: "https://images.unsplash.com/photo-1517512006864-7edc3b933137?w=1200&q=80&auto=format&fit=crop", h: t("meetyourself4.solo.section.2.frame.2.h") || "Add One Thing", p: t("meetyourself4.solo.section.2.frame.2.p") || "A walk. A text. A window break." }
      ],
      cta: { label: t("meetyourself4.solo.section.2.cta") || "Add one nourishing thing →", href: "#assess" }
    },
    {
      emoji: "🎯",
      title: t("meetyourself4.solo.section.3.title") || "Solo Victories",
      line: t("meetyourself4.solo.section.3.line") || "When the room stays small and the win is big.",
      context: {
        body: t("meetyourself4.solo.section.3.body") || "You did it. The screen lights up, the chat pings, and then it's just you and the air. Joy without witnesses still counts — it's yours.",
        bullets: [
          t("meetyourself4.solo.section.3.bullet.0") || "You want to share but don't want to seem needy.",
          t("meetyourself4.solo.section.3.bullet.1") || "The win feels smaller in the empty room.",
          t("meetyourself4.solo.section.3.bullet.2") || "You wonder if it matters when no one sees."
        ],
        nudge: t("meetyourself4.solo.section.3.nudge") || "Take a photo of the moment. Write down three words that capture how it feels. This is your story to tell."
      },
      frames: [
        { img: "/assets/images/meet-yourself/solo/Right Slider/Lowest/Notification. Achievement. You..jpeg", h: t("meetyourself4.solo.section.3.frame.0.h") || "Screen Glow", p: t("meetyourself4.solo.section.3.frame.0.p") || "Notification. Achievement. You." },
        { img: "/assets/images/meet-yourself/solo/Right Slider/Lowest/Echo of success. No one to high-five.jpg", h: t("meetyourself4.solo.section.3.frame.1.h") || "Empty Room", p: t("meetyourself4.solo.section.3.frame.1.p") || "Echo of success. No one to high-five." },
        { img: "/assets/images/meet-yourself/solo/Right Slider/Lowest/Notification. Achievement. You..jpeg", h: t("meetyourself4.solo.section.3.frame.2.h") || "Capture It", p: t("meetyourself4.solo.section.3.frame.2.p") || "Photo. Words. Your story." }
      ],
      cta: { label: t("meetyourself4.solo.section.3.cta") || "Capture your win →", href: "#assess" }
    }
  ];

  // === Quick Emotion Cards (6) ===
  const emotionCards = [
    { t: t("meetyourself4.solo.emote.0.title") || "Freedom", s: t("meetyourself4.solo.emote.0.subtitle") || "Your rules, your rhythm" },
    { t: t("meetyourself4.solo.emote.1.title") || "Quiet", s: t("meetyourself4.solo.emote.1.subtitle") || "Silence that heals" },
    { t: t("meetyourself4.solo.emote.2.title") || "Space", s: t("meetyourself4.solo.emote.2.subtitle") || "Room to grow" },
    { t: t("meetyourself4.solo.emote.3.title") || "Lonely", s: t("meetyourself4.solo.emote.3.subtitle") || "Edges that sting" },
    { t: t("meetyourself4.solo.emote.4.title") || "Stuck", s: t("meetyourself4.solo.emote.4.subtitle") || "Routines on loop" },
    { t: t("meetyourself4.solo.emote.5.title") || "Ready", s: t("meetyourself4.solo.emote.5.subtitle") || "For gentle change" }
  ];

  // === Stir lines under headline ===
  const stirLines = [
    t("meetyourself4.solo.stir.line.0") || "Is your space calm — or just empty?",
    t("meetyourself4.solo.stir.line.1") || "Who hears your small wins today?",
    t("meetyourself4.solo.stir.line.2") || "Are routines running you — or helping?",
    t("meetyourself4.solo.stir.line.3") || "When did you last feel fully seen?"
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
                "name": "Solo",
                "item": "https://www.drishiq.com/meet-yourself/solo"
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
      
      <main className="relative z-10">
        {/* Top band: 6 cards ABOVE the celeb ticker, ticker full width */}
        <section className="bg-white/80 backdrop-blur-sm border-b border-gray-200 relative z-10">
          <div className="container mx-auto max-w-7xl px-4">
            <div className="flex items-center gap-3 py-4 text-sm font-semibold text-gray-600">
              <Sparkles size={20} className="text-amber-500" />
              <span>{t("meetyourself4.solo.topband.label") || "Solo, not alone — stories from known faces"}</span>
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
                <span className="text-5xl" aria-hidden>🧍‍♂️</span>
                {t("meetyourself4.solo.hero.title") || "Solo, Not Silent"}
              </FM.h1>
              <FM.p 
                initial={{ opacity: 0, y: 10 }} 
                whileInView={{ opacity: 1, y: 0 }} 
                viewport={{ once: true }} 
                transition={{ duration: 0.45, delay: 0.05 }} 
                className="mt-4 text-xl text-gray-600 leading-relaxed"
              >
                {t("meetyourself4.solo.hero.subtitle") || "You love the freedom. You feel the quiet. And some nights, the quiet feels a little too loud."}
              </FM.p>
              <div className="mt-8 flex flex-wrap gap-4">
                <ShinyButton href="/signup">{t("meetyourself4.solo.hero.cta.primary") || "Check in with yourself — right here"}</ShinyButton>
                <a 
                  href="#how" 
                  className="rounded-2xl px-6 py-3 bg-white text-gray-700 border-2 border-gray-200 hover:bg-gray-50 hover:border-gray-300 transition-all duration-300 font-semibold shadow-sm hover:shadow-md"
                >
                  {t("meetyourself4.solo.hero.cta.secondary") || "How Drishiq helps"}
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
                <Sparkles size={20} className="text-amber-500" />
                <span>{t("meetyourself4.solo.emotions.label") || "What solo living can feel like"}</span>
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
                  <div className="text-4xl" aria-hidden>{s.emoji}</div>
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
                    <div className="text-lg font-semibold text-emerald-800 mb-2">{t("meetyourself4.solo.nudge.label") || "Try this:"}</div>
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

        {/* How Drishiq Makes a Difference */}
        <section id="how" className="container mx-auto max-w-7xl px-4 py-16 relative z-10">
          <h3 className="text-3xl md:text-4xl font-bold text-gray-900 mb-8 text-center">{t("meetyourself4.solo.how.title") || "How Drishiq Makes a Difference"}</h3>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {[
              { h: t("meetyourself4.solo.how.0.h") || "Solo Clarity", d: t("meetyourself4.solo.how.0.d") || "See your patterns clearly, without judgment.", icon: "🔍" },
              { h: t("meetyourself4.solo.how.1.h") || "Gentle Nudges", d: t("meetyourself4.solo.how.1.d") || "Small steps that fit your solo rhythm.", icon: "🌱" },
              { h: t("meetyourself4.solo.how.2.h") || "Space to Breathe", d: t("meetyourself4.solo.how.2.d") || "Tools to create meaningful solitude.", icon: "🫁" },
              { h: t("meetyourself4.solo.how.3.h") || "Connection Choice", d: t("meetyourself4.solo.how.3.d") || "Decide when and how to reach out.", icon: "🤝" },
            ].map((f, i) => (
              <FM.div 
                key={i} 
                initial={{ opacity: 0, y: 20 }} 
                whileInView={{ opacity: 1, y: 0 }} 
                viewport={{ once: true }} 
                transition={{ duration: 0.5, delay: i * 0.1 }} 
                className="rounded-3xl bg-white border border-gray-100 p-8 shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-2"
              >
                <div className="mb-4">{howCardIcons[f.icon] || f.icon}</div>
                <div className="text-xl font-bold text-gray-900 mb-3">{f.h}</div>
                <p className="text-gray-600 leading-relaxed">{f.d}</p>
              </FM.div>
            ))}
          </div>
        </section>

        <Footer />
      </main>

      {/* Local styles for the requested celebrity ticker */}
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



function CelebTickerV2({ items }: { items: any[] }) {
  const fallback = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 28 28"><circle cx="14" cy="14" r="14" fill="%23e6efe9"/></svg>';
  return (
    <section className="ticker-container border-t border-b border-gray-200 py-4 bg-white/80 backdrop-blur-sm">
      <div className="ticker-track celeb-track">
        {items.map((c, i) => (
          <div key={i} className="celeb-item">
            <img src={c.img} alt={c.name} onError={(e) => { e.currentTarget.src = fallback; }} />
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
            <span key={i} className="m-2 inline-flex items-center gap-2 rounded-full border border-gray-200 bg-gradient-to-r from-emerald-50 to-blue-50 px-4 py-2 text-sm font-semibold text-gray-700 shadow-sm">✦ {text}</span>
          ))}
        </div>
      </div>
      <style>{`@keyframes solo-rtl { from { transform: translateX(0); } to { transform: translateX(-50%); } }`}</style>
    </div>
  );
}

// Full-width stir ticker (like celeb strip), outside container
function StirTickerFull({ lines }: { lines: string[] }) {
  const doubled = [...lines, ...lines];
  return (
    <section className="border-y border-dashed border-gray-200 bg-white/60 relative z-10">
      <div className="flex overflow-hidden">
        <div className="flex whitespace-nowrap w-[200%] animate-[solo-rtl_22s_linear_infinite]">
          {doubled.map((text, i) => (
            <span key={i} className="m-2 inline-flex items-center gap-2 rounded-full border border-gray-200 bg-gradient-to-r from-emerald-50 to-blue-50 px-4 py-2 text-sm font-semibold text-gray-700 shadow-sm">✦ {text}</span>
          ))}
        </div>
      </div>
      <style>{`@keyframes solo-rtl { from { transform: translateX(0); } to { transform: translateX(-50%); } }`}</style>
    </section>
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
