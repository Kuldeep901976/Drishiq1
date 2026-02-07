"use client";

import React, { useEffect } from "react";
import { motion } from "framer-motion";
import Footer from '@/components/Footer';
import { useLanguage } from "@/lib/drishiq-i18n";

// Safe fallback: if framer-motion isn't installed, FM renders plain elements
const FM: any = motion as any;

/**
 * REBOOTER — React + TypeScript + Tailwind
 * Matches your persona pattern (FM fallback, tiles, celeb ticker, stir ticker),
 * with Rebooter copy and content.
 */

export default function RebooterPage() {
  const { t, language } = useLanguage(['meetyourself3']);
  
  useEffect(() => {
    console.assert(!!FM, "[Smoke Test] Using framer-motion if present; otherwise falling back to plain elements.");
  }, []);

  // === Stir lines under headline ===
  const stirLines: string[] = [
    t("meetyourself3.rebooter.stir.line.0") || "Do you feel relief and fear in equal measure?",
    t("meetyourself3.rebooter.stir.line.1") || "Does this restart feel heavier than your first start?",
    t("meetyourself3.rebooter.stir.line.2") || "Are you carrying lessons — or luggage — from the past?",
    t("meetyourself3.rebooter.stir.line.3") || "Do you keep asking yourself 'can I really do this again?'",
    t("meetyourself3.rebooter.stir.line.4") || "What if your next build could be lighter, faster, and truer?",
  ];

  // === Quick Emotion Cards (6) ===
  const emotionCards = [
    { t: t("meetyourself3.rebooter.emote.0.title") || "Liberated", s: t("meetyourself3.rebooter.emote.0.subtitle") || "Leaving what drained you" },
    { t: t("meetyourself3.rebooter.emote.1.title") || "Uncertain", s: t("meetyourself3.rebooter.emote.1.subtitle") || "Facing the Unknown" },
    { t: t("meetyourself3.rebooter.emote.2.title") || "Experienced", s: t("meetyourself3.rebooter.emote.2.subtitle") || "You know the pitfalls" },
    { t: t("meetyourself3.rebooter.emote.3.title") || "Weary", s: t("meetyourself3.rebooter.emote.3.subtitle") || "Starting again takes energy" },
    { t: t("meetyourself3.rebooter.emote.4.title") || "Focused", s: t("meetyourself3.rebooter.emote.4.subtitle") || "Clarity about what matters now" },
    { t: t("meetyourself3.rebooter.emote.5.title") || "Protective", s: t("meetyourself3.rebooter.emote.5.subtitle") || "Guarding against past mistakes" },
  ];

  // === Celebrity Ticker ===
  const celebA = [
    { img: "/assets/images/meet-yourself/rebooter/celebs/steve_jobs.jpg", name: t("meetyourself3.rebooter.celeb.0.name") || "Steve Jobs", profession: t("meetyourself3.rebooter.celeb.0.profession") || "Entrepreneur", source: "Quote", quote: t("meetyourself3.rebooter.celeb.0.quote") || "\"Stay hungry, stay foolish.\"" },
    { img: "/assets/images/meet-yourself/rebooter/celebs/oprah.jpg", name: t("meetyourself3.rebooter.celeb.1.name") || "Oprah Winfrey", profession: t("meetyourself3.rebooter.celeb.1.profession") || "Media Leader", source: "Quote", quote: t("meetyourself3.rebooter.celeb.1.quote") || "\"Turn your wounds into wisdom.\"" },
    { img: "/assets/images/meet-yourself/rebooter/celebs/jk_rowling.jpg", name: t("meetyourself3.rebooter.celeb.2.name") || "J.K. Rowling", profession: t("meetyourself3.rebooter.celeb.2.profession") || "Author", source: "Quote", quote: t("meetyourself3.rebooter.celeb.2.quote") || "\"Rock bottom became the solid foundation on which I rebuilt my life.\"" },
    { img: "/assets/images/meet-yourself/rebooter/celebs/elon_musk.jpg", name: t("meetyourself3.rebooter.celeb.3.name") || "Elon Musk", profession: t("meetyourself3.rebooter.celeb.3.profession") || "Entrepreneur", source: "Quote", quote: t("meetyourself3.rebooter.celeb.3.quote") || "\"Failure is an option. If things aren't failing, you aren't innovating enough.\"" },
    { img: "/assets/images/meet-yourself/rebooter/celebs/maya_angelou.jpg", name: t("meetyourself3.rebooter.celeb.4.name") || "Maya Angelou", profession: t("meetyourself3.rebooter.celeb.4.profession") || "Poet", source: "Quote", quote: t("meetyourself3.rebooter.celeb.4.quote") || "\"Try to be a rainbow in someone's cloud.\"" },
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
      emoji: "⏸️",
      title: t("meetyourself3.rebooter.section.0.title") || "The Pause Before the Relaunch",
      line: t("meetyourself3.rebooter.section.0.line") || "You've shut down more than just the old system.",
      context: {
        body: t("meetyourself3.rebooter.section.0.body") ||
          "Whether it's a career change, ending a partnership, or stepping away from a dream, this is more than a break. It's the quiet between storms — where your next choice will define the next chapter.",
        bullets: [
          t("meetyourself3.rebooter.section.0.bullet.0") || "You walked away from something that looked fine on the outside.",
          t("meetyourself3.rebooter.section.0.bullet.1") || "You're deliberately taking time before your next move.",
          t("meetyourself3.rebooter.section.0.bullet.2") || "You're both excited and exhausted.",
        ],
        nudge: t("meetyourself3.rebooter.section.0.nudge") ||
          "List three non‑negotiables for your next chapter — and keep them in sight.",
      },
      frames: [
        { img: "/assets/images/meet-yourself/rebooter/right slider/top/The Pause Before the Relaunch.jpeg", h: t("meetyourself3.rebooter.section.0.frame.0.h") || "The Pause Before the Relaunch", p: t("meetyourself3.rebooter.section.0.frame.0.p") || "Restart symbol" },
        { img: "/assets/images/meet-yourself/rebooter/right slider/top/Ready to restart.jpeg", h: t("meetyourself3.rebooter.section.0.frame.1.h") || "Ready to restart", p: t("meetyourself3.rebooter.section.0.frame.1.p") || "Fresh start" },
        { img: "/assets/images/meet-yourself/rebooter/right slider/top/The Pause Before the Relaunch.jpeg", h: t("meetyourself3.rebooter.section.0.frame.2.h") || "The Pause Before the Relaunch", p: t("meetyourself3.rebooter.section.0.frame.2.p") || "Ready to load new program" },
      ],
      cta: { label: t("meetyourself3.rebooter.section.0.cta") || "Define your reboot before the world does it for you →", href: "/signup" },
    },
    {
      emoji: "🧳",
      title: t("meetyourself3.rebooter.section.1.title") || "Carrying Lessons, Not Luggage",
      line: t("meetyourself3.rebooter.section.1.line") || "Your past is a library, not a prison.",
      context: {
        body: t("meetyourself3.rebooter.section.1.body") ||
          "Every ending leaves you with stories, scars, and strategies. The challenge is knowing which to keep and which to let go.",
        bullets: [
          t("meetyourself3.rebooter.section.1.bullet.0") || "You find yourself replaying the same mistakes.",
          t("meetyourself3.rebooter.section.1.bullet.1") || "You hesitate to trust your own decisions.",
          t("meetyourself3.rebooter.section.1.bullet.2") || "You know what you don't want, but not yet what you do.",
        ],
        nudge: t("meetyourself3.rebooter.section.1.nudge") ||
          "Write down one hard‑earned lesson — and one fear you can release with it.",
      },
      frames: [
        { img: "/assets/images/meet-yourself/rebooter/right slider/medium/Carrying Lessons, Not Luggage.jpg", h: t("meetyourself3.rebooter.section.1.frame.0.h") || "Carrying Lessons, Not Luggage", p: t("meetyourself3.rebooter.section.1.frame.0.p") || "Letting go" },
        { img: "/assets/images/meet-yourself/rebooter/right slider/medium/Freedom from old patterns.jpg", h: t("meetyourself3.rebooter.section.1.frame.1.h") || "Freedom from old patterns", p: t("meetyourself3.rebooter.section.1.frame.1.p") || "Lessons stored" },
        { img: "/assets/images/meet-yourself/rebooter/right slider/medium/Carrying Lessons, Not Luggage.jpg", h: t("meetyourself3.rebooter.section.1.frame.2.h") || "Carrying Lessons, Not Luggage", p: t("meetyourself3.rebooter.section.1.frame.2.p") || "Freedom from old patterns" },
      ],
      cta: { label: t("meetyourself3.rebooter.section.1.cta") || "Step forward lighter →", href: "/signup" },
    },
    {
      emoji: "🛠️",
      title: t("meetyourself3.rebooter.section.2.title") || "Building the Next Version of You",
      line: t("meetyourself3.rebooter.section.2.line") || "This isn't a repeat — it's an upgrade.",
      context: {
        body: t("meetyourself3.rebooter.section.2.body") ||
          "The beauty of starting again is that you're not truly starting from scratch. You have frameworks, resilience, and the clarity that only comes from experience.",
        bullets: [
          t("meetyourself3.rebooter.section.2.bullet.0") || "You're mixing old skills with new ideas.",
          t("meetyourself3.rebooter.section.2.bullet.1") || "You're designing your next life to fit who you are now.",
          t("meetyourself3.rebooter.section.2.bullet.2") || "You feel ready to take calculated risks.",
        ],
        nudge: t("meetyourself3.rebooter.section.2.nudge") ||
          "Create a 'Version 2.0' vision board — with images, not just words.",
      },
      frames: [
        { img: "/assets/images/meet-yourself/rebooter/right slider/lower/Planning with intention.jpeg", h: t("meetyourself3.rebooter.section.2.frame.0.h") || "Planning with intention", p: t("meetyourself3.rebooter.section.2.frame.0.p") || "Planning with intention" },
        { img: "/assets/images/meet-yourself/rebooter/right slider/lower/Building the Next Version of You.png", h: t("meetyourself3.rebooter.section.2.frame.1.h") || "Building the Next Version of You", p: t("meetyourself3.rebooter.section.2.frame.1.p") || "Bold action" },
        { img: "/assets/images/meet-yourself/rebooter/right slider/lower/Planning with intention.jpeg", h: t("meetyourself3.rebooter.section.2.frame.2.h") || "Planning with intention", p: t("meetyourself3.rebooter.section.2.frame.2.p") || "Systems in motion" },
      ],
      cta: { label: t("meetyourself3.rebooter.section.2.cta") || "Build the reboot you've been dreaming of →", href: "/signup" },
    },
    {
      emoji: "🏔️",
      title: t("meetyourself3.rebooter.section.3.title") || "Thriving After the Reset",
      line: t("meetyourself3.rebooter.section.3.line") || "The reset isn't the end — it's the training ground.",
      context: {
        body: t("meetyourself3.rebooter.section.3.body") ||
          "Once you've found your footing, you can use your restart to build a life that's more aligned, resilient, and satisfying than before.",
        bullets: [
          t("meetyourself3.rebooter.section.3.bullet.0") || "You want this time to truly stick.",
          t("meetyourself3.rebooter.section.3.bullet.1") || "You're mentoring others who are restarting.",
          t("meetyourself3.rebooter.section.3.bullet.2") || "You feel proud of how far you've come.",
        ],
        nudge: t("meetyourself3.rebooter.section.3.nudge") ||
          "Share your reboot story with someone just starting theirs.",
      },
      frames: [
        { img: "/assets/images/meet-yourself/rebooter/right slider/lowest/Thriving After the Reset.jpeg", h: t("meetyourself3.rebooter.section.3.frame.0.h") || "The Pause Before the Relaunch", p: t("meetyourself3.rebooter.section.3.frame.0.p") || "Achievement" },
        { img: "/assets/images/meet-yourself/rebooter/right slider/lowest/Helping others restart.jpg", h: t("meetyourself3.rebooter.section.3.frame.1.h") || "Helping others restart", p: t("meetyourself3.rebooter.section.3.frame.1.p") || "Helping others restart" },
        { img: "/assets/images/meet-yourself/rebooter/right slider/lowest/Thriving After the Reset.jpeg", h: t("meetyourself3.rebooter.section.3.frame.2.h") || "Thriving After the Reset", p: t("meetyourself3.rebooter.section.3.frame.2.p") || "Moving forward" },
      ],
      cta: { label: t("meetyourself3.rebooter.section.3.cta") || "Turn your restart into a legacy →", href: "/signup" },
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
                "name": "Rebooter",
                "item": "https://www.drishiq.com/meet-yourself/rebooter"
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
        {/* Top band: celeb ticker */}
        <section className="bg-white/80 backdrop-blur-sm border-b border-gray-200 relative z-20">
          <div className="container mx-auto max-w-7xl px-4">
            <div className="flex items-center gap-3 py-4 text-sm font-semibold text-gray-600">
              <span className="text-xl">🔁</span>
              <span>{t("meetyourself3.rebooter.topband.label") || "Rebooter, not broken — stories from known faces"}</span>
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
            <FM.h1 initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.4 }} className="text-4xl md:text-5xl font-extrabold flex items-center gap-4 text-gray-900">
              <span className="text-5xl" aria-hidden>🔁</span>
              {t("meetyourself3.rebooter.hero.title") || "Reset. Restart. Renew."}
            </FM.h1>
            <FM.p initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.45, delay: 0.05 }} className="mt-4 text-xl text-gray-600 leading-relaxed">
              {t("meetyourself3.rebooter.hero.subtitle") || "You've closed a chapter — maybe willingly, maybe not — and now you're staring at a blank screen called \"next.\""}
            </FM.p>
            <div className="mt-8 flex flex-wrap gap-4">
              <ShinyButton href="/signup">{t("meetyourself3.rebooter.cta.early_access") || "Explore what's powering your restart →"}</ShinyButton>
              <a href="#how" className="rounded-2xl px-5 py-2.5 bg-white text-[#0B4422] border border-[#0B4422]/20 hover:bg-[#0B4422]/5 transition">{t("meetyourself3.rebooter.cta.how") || "How DrishiQ helps?"}</a>
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
              <span className="text-xl">🧨</span>
              <span>{t("meetyourself3.rebooter.emotions.label") || "What rebooting can feel like"}</span>
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
                  <div className="text-lg font-semibold text-emerald-800 mb-2">{t("meetyourself3.rebooter.nudge.label") || "Try this:"}</div>
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
            <h3 className="text-3xl md:text-4xl font-bold mb-4">{t("meetyourself3.rebooter.bridge.title") || "You can reboot without losing yourself."}</h3>
            <p className="text-xl opacity-95 leading-relaxed">{t("meetyourself3.rebooter.bridge.body") || "Drishiq helps you see your restart as a launchpad, not a fallback, so your next chapter starts strong and stays true."}</p>
            <div className="mt-8">
              <a 
                href="/signup" 
                className="inline-flex items-center rounded-2xl bg-white text-emerald-800 px-8 py-4 font-bold shadow-lg hover:shadow-xl transition-all duration-300 hover:bg-gray-50 transform hover:-translate-y-1"
              >
                {t("meetyourself3.rebooter.bridge.cta") || "Start your clarity check →"}
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* How Drishiq Helps */}
      <section id="how" className="container mx-auto max-w-7xl px-4 py-16 relative z-10">
        <h3 className="text-3xl md:text-4xl font-bold text-gray-900 mb-8 text-center">{t("meetyourself3.rebooter.cta.how") || "How Drishiq Makes a Difference"}</h3>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {[
            { h: t("meetyourself3.rebooter.how.0.h") || "Restart Map", d: t("meetyourself3.rebooter.how.0.d") || "Chart where you've been and where you're going.", icon: "🗺️" },
            { h: t("meetyourself3.rebooter.how.1.h") || "Lesson Filtering Tool", d: t("meetyourself3.rebooter.how.1.d") || "Keep the wisdom, drop the weight.", icon: "🔍" },
            { h: t("meetyourself3.rebooter.how.2.h") || "Version Builder", d: t("meetyourself3.rebooter.how.2.d") || "Design your upgraded life step-by-step.", icon: "🏗️" },
            { h: t("meetyourself3.rebooter.how.3.h") || "Support Network Access", d: t("meetyourself3.rebooter.how.3.d") || "Connect with others rebooting, too.", icon: "🤝" },
          ].map((f, i) => (
            <FM.div 
              key={i} 
              initial={{ opacity: 0, y: 20 }} 
              whileInView={{ opacity: 1, y: 0 }} 
              viewport={{ once: true }} 
              transition={{ duration: 0.5, delay: i * 0.1 }} 
              className="rounded-3xl bg-white border border-gray-100 p-8 shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-2"
            >
              <div className="text-4xl mb-4">{f.icon}</div>
              <div className="text-xl font-bold text-gray-900 mb-3">{f.h}</div>
              <p className="text-gray-600 leading-relaxed">{f.d}</p>
            </FM.div>
          ))}
        </div>
      </section>

      </main>
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
        @keyframes reboot-rtl { from { transform: translateX(0); } to { transform: translateX(-50%); } }
        .stir-track { width:200%; animation: reboot-rtl 22s linear infinite; }
        
        /* StreamStrip styles */
        .stream-wrap { overflow: hidden; height: 100%; }
        .stream-track { display: flex; animation: stream-rtl 20s linear infinite; height: 100%; }
        .stream-track:hover { animation-play-state: paused; }
        .stream-item { position: relative; height: 100%; width: 500px; flex: 0 0 auto; }
        .stream-item img { height: 100%; width: 100%; object-fit: cover; }
        .stream-cap { position:absolute; inset-inline:0.5rem; bottom:0.5rem; color:white; padding:0.5rem; border-radius:0.75rem; background: linear-gradient(to top, rgba(11,68,34,.9), rgba(11,68,34,.4), transparent); }
        .stream-cap .text-sm { font-size: 16px; }
        .stream-cap .text-xs { font-size: 14px; }
        @keyframes stream-rtl { from { transform: translateX(0); } to { transform: translateX(-50%); } }
      `}</style>
    </div>
  );
}

// ---- Components ----
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
            <span key={i} className="m-2 inline-flex items-center gap-2 rounded-full border border-gray-200 bg-gradient-to-r from-emerald-50 to-blue-50 px-4 py-2 text-sm font-semibold text-gray-700 shadow-sm">✦ {text}</span>
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