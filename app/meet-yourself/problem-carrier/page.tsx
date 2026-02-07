"use client";

import React, { useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import Footer from '@/components/Footer';
import { useLanguage } from "@/lib/drishiq-i18n";

const FM: any = motion as any;

export default function ProblemCarrierPage() {
  const { t, language } = useLanguage(['meetyourself2']);
  
  useEffect(() => {
    console.assert(!!FM, "[Smoke Test] Using framer-motion if present; otherwise falling back to plain elements.");
  }, []);

  // === Stir lines under headline ===
  const stirLines: string[] = useMemo(() => [
    t("meetyourself2.problem-carrier.stir.line.0") || "Do you feel like you're always 'holding it together' for everyone?",
    t("meetyourself2.problem-carrier.stir.line.1") || "Are you carrying issues that aren't yours to fix?",
    t("meetyourself2.problem-carrier.stir.line.2") || "Do you downplay your own struggles so no one worries?",
    t("meetyourself2.problem-carrier.stir.line.3") || "Have you forgotten what lightness feels like?",
    t("meetyourself2.problem-carrier.stir.line.4") || "What would you do with space in your hands — and your head?",
  ], [t, language]);

  // === Quick Emotion Cards (6) ===
  const emotionCards = useMemo(() => [
    { t: t("meetyourself2.problem-carrier.emote.0.title") || "Burdened", s: t("meetyourself2.problem-carrier.emote.0.subtitle") || "Heavy before the day starts" },
    { t: t("meetyourself2.problem-carrier.emote.1.title") || "Responsible", s: t("meetyourself2.problem-carrier.emote.1.subtitle") || "The one everyone counts on" },
    { t: t("meetyourself2.problem-carrier.emote.2.title") || "Protective", s: t("meetyourself2.problem-carrier.emote.2.subtitle") || "Keeping trouble from others" },
    { t: t("meetyourself2.problem-carrier.emote.3.title") || "Stretched", s: t("meetyourself2.problem-carrier.emote.3.subtitle") || "Spread too thin across problems" },
    { t: t("meetyourself2.problem-carrier.emote.4.title") || "Guarded", s: t("meetyourself2.problem-carrier.emote.4.subtitle") || "Careful what you reveal" },
    { t: t("meetyourself2.problem-carrier.emote.5.title") || "Tired", s: t("meetyourself2.problem-carrier.emote.5.subtitle") || "Carrying more than you rest" },
  ], [t, language]);

  // === Celebrity Ticker ===
  const celebs = useMemo(() => {
    // Try to get celeb items as array first
  const celebItemsRaw = t("meetyourself2.problem-carrier.celeb.items", { returnObjects: true });
    if (Array.isArray(celebItemsRaw) && celebItemsRaw.length > 0) {
      return [...celebItemsRaw, ...celebItemsRaw];
    }
    
    // If not array, try to build from individual celeb entries (0, 1, 2, 3, 4)
    const celebItems: any[] = [];
    for (let i = 0; i < 5; i++) {
      const name = t(`meetyourself2.problem-carrier.celeb.${i}.name`);
      const profession = t(`meetyourself2.problem-carrier.celeb.${i}.profession`);
      const quote = t(`meetyourself2.problem-carrier.celeb.${i}.quote`);
      // Always add the celeb item, using translation if available, otherwise fallback
      const defaultNames = ["Robin Williams", "Mother Teresa", "Barack Obama", "Malala Yousafzai", "Brené Brown"];
      const defaultProfessions = ["Actor", "Humanitarian", "Leader", "Activist", "Researcher"];
      const defaultQuotes = [
        "\"Everyone you meet is fighting a battle you know nothing about.\"",
        "\"If you can't feed a hundred people, feed just one.\"",
        "\"We don't quit. I don't quit.\"",
        "\"We realize the importance of our voices only when we are silenced.\"",
        "\"You can't get to courage without walking through vulnerability.\""
      ];
      const imageNames = ['Robin_Williams', 'Mother_Teresa', 'Barack_Obama', 'Malala_Yousafzai', 'Brene-Brown'];
      
      celebItems.push({
        img: `/assets/images/meet-yourself/problem carrier/celebs/${imageNames[i]}.jpg`,
        name: (typeof name === 'string' && name.trim() !== '') ? name : defaultNames[i],
        profession: (typeof profession === 'string' && profession.trim() !== '') ? profession : defaultProfessions[i],
        source: "Quote",
        quote: (typeof quote === 'string' && quote.trim() !== '') ? quote : defaultQuotes[i]
      });
    }
    
    // Fallback to default if nothing found
    if (celebItems.length === 0) {
      return [
    { img: "/assets/images/meet-yourself/problem carrier/celebs/Robin_Williams.jpg", name: "Robin Williams", profession: "Actor", source: "Quote", quote: "\"Everyone you meet is fighting a battle you know nothing about.\"" },
    { img: "/assets/images/meet-yourself/problem carrier/celebs/Mother_Teresa.jpg", name: "Mother Teresa", profession: "Humanitarian", source: "Quote", quote: "\"If you can't feed a hundred people, feed just one.\"" },
    { img: "/assets/images/meet-yourself/problem carrier/celebs/Barack_Obama.jpg", name: "Barack Obama", profession: "Leader", source: "Quote", quote: "\"We don't quit. I don't quit.\"" },
    { img: "/assets/images/meet-yourself/problem carrier/celebs/Malala_Yousafzai.jpg", name: "Malala Yousafzai", profession: "Activist", source: "Quote", quote: "\"We realize the importance of our voices only when we are silenced.\"" },
    { img: "/assets/images/meet-yourself/problem carrier/celebs/Brene-Brown.jpg", name: "Brené Brown", profession: "Researcher", source: "Quote", quote: "\"You can't get to courage without walking through vulnerability.\"" }
      ].flatMap(item => [item, item]);
    }
    
    return [...celebItems, ...celebItems];
  }, [t, language]);

  // === Content Sections ===
  type Section = {
    emoji: string;
    title: string;
    line: string;
    context: { body: string; bullets: string[]; nudge: string };
    frames: { img: string; h: string; p: string }[];
    cta: { label: string; href: string };
  };

  const sections: Section[] = useMemo(() => [
    {
      emoji: t("meetyourself2.problem-carrier.section.0.emoji") || "🧳",
      title: t("meetyourself2.problem-carrier.section.0.title") || "Shoulders That Never Rest",
      line: t("meetyourself2.problem-carrier.section.0.line") || "You've been holding weight for too long.",
      context: {
        body: t("meetyourself2.problem-carrier.section.0.body") || "Some problems are yours to solve. Others were handed to you because you could 'handle it.' Either way, the load doesn't get lighter just because you're strong.",
        bullets: [
          t("meetyourself2.problem-carrier.section.0.bullet.0") || "People share their crises without asking if you're okay.",
          t("meetyourself2.problem-carrier.section.0.bullet.1") || "You work through personal struggles in silence.",
          t("meetyourself2.problem-carrier.section.0.bullet.2") || "You're rarely on the receiving end of help.",
        ],
        nudge: t("meetyourself2.problem-carrier.section.0.nudge") || "Write down every problem you're carrying. Circle only the ones that are truly yours to solve.",
      },
      frames: [
        { img: "/assets/images/meet-yourself/problem carrier/right slider/top/Distributing the load.jpg", h: t("meetyourself2.problem-carrier.section.0.frame.0.h") || "Heavy Bag", p: t("meetyourself2.problem-carrier.section.0.frame.0.p") || "The weight you carry." },
        { img: "/assets/images/meet-yourself/problem carrier/right slider/top/The weight you carry..jpg", h: t("meetyourself2.problem-carrier.section.0.frame.1.h") || "Shared Hands", p: t("meetyourself2.problem-carrier.section.0.frame.1.p") || "Distributing the load." },
        { img: "/assets/images/meet-yourself/problem carrier/right slider/top/Distributing the load.jpg", h: t("meetyourself2.problem-carrier.section.0.frame.2.h") || "Bag Opened", p: t("meetyourself2.problem-carrier.section.0.frame.2.p") || "Letting some things go." },
      ],
      cta: { label: t("meetyourself2.problem-carrier.section.0.cta.label") || "Lighten your load →", href: t("meetyourself2.problem-carrier.section.0.cta.href") || "/signup" },
    },
    {
      emoji: t("meetyourself2.problem-carrier.section.1.emoji") || "📦",
      title: t("meetyourself2.problem-carrier.section.1.title") || "Problems That Aren't Yours",
      line: t("meetyourself2.problem-carrier.section.1.line") || "You can care without carrying.",
      context: {
        body: t("meetyourself2.problem-carrier.section.1.body") || "It's noble to want to protect others, but not every problem needs to live in your arms. Boundaries can be acts of love too.",
        bullets: [
          t("meetyourself2.problem-carrier.section.1.bullet.0") || "You find yourself solving issues before being asked.",
          t("meetyourself2.problem-carrier.section.1.bullet.1") || "You take on family, friend, or work burdens out of habit.",
          t("meetyourself2.problem-carrier.section.1.bullet.2") || "You feel guilty when you step back.",
        ],
        nudge: t("meetyourself2.problem-carrier.section.1.nudge") || "The next time a problem comes to you, ask: 'What role do you want me to play?' before taking action.",
      },
      frames: [
        { img: "/assets/images/meet-yourself/problem carrier/right slider/medium/Carrying together..jpg", h: t("meetyourself2.problem-carrier.section.1.frame.0.h") || "Passing the Box", p: t("meetyourself2.problem-carrier.section.1.frame.0.p") || "Letting others hold their own." },
        { img: "/assets/images/meet-yourself/problem carrier/right slider/medium/Letting others hold their own.jpg", h: t("meetyourself2.problem-carrier.section.1.frame.1.h") || "Hands Free", p: t("meetyourself2.problem-carrier.section.1.frame.1.p") || "Creating space." },
        { img: "/assets/images/meet-yourself/problem carrier/right slider/medium/Carrying together..jpg", h: t("meetyourself2.problem-carrier.section.1.frame.2.h") || "Balanced Share", p: t("meetyourself2.problem-carrier.section.1.frame.2.p") || "Carrying together." },
      ],
      cta: { label: t("meetyourself2.problem-carrier.section.1.cta.label") || "Practice letting go →", href: t("meetyourself2.problem-carrier.section.1.cta.href") || "/signup" },
    },
    {
      emoji: t("meetyourself2.problem-carrier.section.2.emoji") || "🎭",
      title: t("meetyourself2.problem-carrier.section.2.title") || "The Hidden Weight",
      line: t("meetyourself2.problem-carrier.section.2.line") || "No one sees the full picture.",
      context: {
        body: t("meetyourself2.problem-carrier.section.2.body") || "When you hide what's heavy, people think you're fine. But invisibility only makes the load heavier.",
        bullets: [
          t("meetyourself2.problem-carrier.section.2.bullet.0") || "You rarely share your deeper struggles.",
          t("meetyourself2.problem-carrier.section.2.bullet.1") || "You smile through exhaustion.",
          t("meetyourself2.problem-carrier.section.2.bullet.2") || "You believe showing weight will worry others too much.",
        ],
        nudge: t("meetyourself2.problem-carrier.section.2.nudge") || "Tell one person the truth about something you've been downplaying.",
      },
      frames: [
        { img: "/assets/images/meet-yourself/problem carrier/right slider/lower/Inviting understanding..jpeg", h: t("meetyourself2.problem-carrier.section.2.frame.0.h") || "Inviting understanding.", p: t("meetyourself2.problem-carrier.section.2.frame.0.p") || "Inviting understanding." },
        { img: "/assets/images/meet-yourself/problem carrier/right slider/lower/Letting others see the truth..jpg", h: t("meetyourself2.problem-carrier.section.2.frame.1.h") || "Letting others see the truth.", p: t("meetyourself2.problem-carrier.section.2.frame.1.p") || "Letting others see the truth." },
        { img: "/assets/images/meet-yourself/problem carrier/right slider/lower/Inviting understanding..jpeg", h: t("meetyourself2.problem-carrier.section.2.frame.2.h") || "Inviting understanding.", p: t("meetyourself2.problem-carrier.section.2.frame.2.p") || "Inviting understanding." },
      ],
      cta: { label: t("meetyourself2.problem-carrier.section.2.cta.label") || "Share one truth →", href: t("meetyourself2.problem-carrier.section.2.cta.href") || "#assess" },
    },
    {
      emoji: t("meetyourself2.problem-carrier.section.3.emoji") || "👜",
      title: t("meetyourself2.problem-carrier.section.3.title") || "Setting It Down Without Guilt",
      line: t("meetyourself2.problem-carrier.section.3.line") || "Lighter doesn't mean weaker.",
      context: {
        body: t("meetyourself2.problem-carrier.section.3.body") || "You don't have to carry everything to prove your strength. Choosing what to carry means you last longer — and feel more alive.",
        bullets: [
          t("meetyourself2.problem-carrier.section.3.bullet.0") || "You've defined yourself by endurance.",
          t("meetyourself2.problem-carrier.section.3.bullet.1") || "You hesitate to hand over responsibilities.",
          t("meetyourself2.problem-carrier.section.3.bullet.2") || "You've forgotten how rest feels.",
        ],
        nudge: t("meetyourself2.problem-carrier.section.3.nudge") || "Choose one problem to hand off or pause on this week.",
      },
      frames: [
        { img: "/assets/images/meet-yourself/problem carrier/right slider/lowest/Moving without load..jpeg", h: t("meetyourself2.problem-carrier.section.3.frame.0.h") || "Balanced Hands", p: t("meetyourself2.problem-carrier.section.3.frame.0.p") || "Healthy boundaries." },
        { img: "/assets/images/meet-yourself/problem carrier/right slider/lowest/Space to choose what's next..jpeg", h: t("meetyourself2.problem-carrier.section.3.frame.1.h") || "Shared Load", p: t("meetyourself2.problem-carrier.section.3.frame.1.p") || "Distributing responsibility." },
        { img: "/assets/images/meet-yourself/problem carrier/right slider/lowest/Moving without load..jpeg", h: t("meetyourself2.problem-carrier.section.3.frame.2.h") || "Free Hands", p: t("meetyourself2.problem-carrier.section.3.frame.2.p") || "Allowing lightness." },
      ],
      cta: { label: t("meetyourself2.problem-carrier.section.3.cta.label") || "Set one down →", href: t("meetyourself2.problem-carrier.section.3.cta.href") || "#assess" },
    },
  ], [t, language]);

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
                "name": t("meetyourself2.problem-carrier.meta.page_title") || "Problem Carrier",
                "item": "https://www.drishiq.com/meet-yourself/problem-carrier"
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
              <span className="text-xl">🧺</span>
              <span>{t("meetyourself2.problem-carrier.hero.subtitle") || "Problem Carrier, not problem solver — stories from known faces"}</span>
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
              <span className="text-5xl" aria-hidden>🧺</span>
              {t("meetyourself2.problem-carrier.hero.title") || "Bearing Every Burden"}
            </FM.h1>
            <FM.p 
              initial={{ opacity: 0, y: 10 }} 
              whileInView={{ opacity: 1, y: 0 }} 
              viewport={{ once: true }} 
              transition={{ duration: 0.45, delay: 0.05 }} 
              className="mt-4 text-xl text-gray-600 leading-relaxed"
            >
              {t("meetyourself2.problem-carrier.hero.description") || "It starts as helping, but ends up as living with problems that were never only yours. This space is for finally setting some of them down."}
            </FM.p>
            <div className="mt-8 flex flex-wrap gap-4">
              {useMemo(() => (
                <>
                  <ShinyButton href="/signup">{t("meetyourself2.problem-carrier.hero.cta.primary") || "Unpack what's weighing on you — here"}</ShinyButton>
              <a 
                href="#how" 
                className="rounded-2xl px-6 py-3 bg-white text-gray-700 border-2 border-gray-200 hover:bg-gray-50 hover:border-gray-300 transition-all duration-300 font-semibold shadow-sm hover:shadow-md"
              >
                    {t("meetyourself2.problem-carrier.hero.cta.secondary.label") || t("meetyourself2.problem-carrier.cta.how.label") || "How Drishiq helps"}
              </a>
                </>
              ), [t, language])}
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
              <span className="text-xl">🧰</span>
              <span>{t("meetyourself2.problem-carrier.emote_header") || "What problem carrying can feel like"}</span>
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
                  <div className="text-lg font-semibold text-emerald-800 mb-2">{t("meetyourself2.problem-carrier.try_this") || t("meetyourself1.builder.try_this") || "Try this:"}</div>
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
          <h3 className="text-2xl md:text-3xl font-bold">{t("meetyourself2.problem-carrier.bridge.title") || "You are more than what you carry."}</h3>
          <p className="mt-2 opacity-95">{t("meetyourself2.problem-carrier.bridge.body") || "Drishiq helps you sort, share, and set down what's weighing on you — without losing who you are. You can still be strong without being overloaded."}</p>
          <div className="mt-4">
            <a href="#assess" className="inline-flex items-center rounded-2xl bg-white text-[#0B4422] px-5 py-3 font-semibold shadow hover:shadow-md">
              {t("meetyourself2.problem-carrier.bridge.cta") || "Begin your clarity check →"}
            </a>
          </div>
        </div>
      </section>

      {/* How Drishiq Helps */}
      <section id="how" className="container mx-auto max-w-7xl px-4 py-16 relative z-10">
        <h3 className="text-3xl md:text-4xl font-bold text-gray-900 mb-8 text-center">
          {useMemo(() => t("meetyourself2.problem-carrier.how.title") || t("meetyourself2.problem-carrier.cta.secondary.label") || t("meetyourself2.problem-carrier.cta.how.label") || "How Drishiq Helps", [t, language])}
        </h3>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {useMemo(() => [
            { h: t("meetyourself2.problem-carrier.how.0.h") || "Weight Mapping", d: t("meetyourself2.problem-carrier.how.0.d") || "Visualize what's yours and what's not." },
            { h: t("meetyourself2.problem-carrier.how.1.h") || "Let-Go Plans", d: t("meetyourself2.problem-carrier.how.1.d") || "Small, safe steps to release excess load." },
            { h: t("meetyourself2.problem-carrier.how.2.h") || "Boundary Practice", d: t("meetyourself2.problem-carrier.how.2.d") || "Say no without guilt." },
            { h: t("meetyourself2.problem-carrier.how.3.h") || "Support Loops", d: t("meetyourself2.problem-carrier.how.3.d") || "Connect with those who can help carry." },
          ], [t, language]).map((f, i) => (
            <FM.div 
              key={i} 
              initial={{ opacity: 0, y: 20 }} 
              whileInView={{ opacity: 1, y: 0 }} 
              viewport={{ once: true }} 
              transition={{ duration: 0.5, delay: i * 0.1 }} 
              className="rounded-3xl bg-white border border-gray-100 p-8 shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-2"
            >
              <div className="text-4xl mb-4">{i === 0 ? "🗺️" : i === 1 ? "🕊️" : i === 2 ? "🛡️" : "🔄"}</div>
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
        @keyframes pc-rtl { from { transform: translateX(0); } to { transform: translateX(-50%); } }
        .stir-track { width:200%; animation: pc-rtl 22s linear infinite; }
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
    <a href={href} className="relative inline-block rounded-2xl px-5 py-2.5 bg-[#0B4422] text-white shadow hover:shadow-xl transition overflow-hidden">
      <span className="relative z-10">{children}</span>
      <span className="pointer-events-none absolute inset-0 -translate-x-[120%] bg-gradient-to-r from-transparent via-white/25 to-transparent animate-[shine_3.6s_infinite]" />
      <style>{`@keyframes shine{0%{transform:translateX(-120%)}60%{transform:translateX(120%)}100%{transform:translateX(120%)}}`}</style>
    </a>
  );
}