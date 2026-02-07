'use client';

import React, { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { useLanguage } from '../lib/drishiq-i18n';
import { 
  Brain, Compass, Dumbbell, Target, Heart, Backpack, 
  Building2, RefreshCw, Briefcase, TrendingUp, GraduationCap, 
  Megaphone, Users, Headphones, Map, Mic, Rocket, Sparkles,
  ArrowRight, HelpCircle
} from 'lucide-react';

// Typed alias to allow FM.* usage cleanly
const FM: any = motion as any;

// Icon wrapper component
const IconWrapper = ({ icon: Icon, className }: { icon: React.ComponentType<any>; className?: string }) => (
  <Icon className={className} strokeWidth={1.5} />
);

// Create icon component factory for Lucide icons
const makeLucideIcon = (IconComponent: React.ComponentType<any>) => 
  (props: React.HTMLAttributes<HTMLSpanElement>) => (
    <span aria-hidden className={props.className}>
      <IconComponent size={16} strokeWidth={1.5} />
    </span>
  );

// Default icon map using Lucide icons
const DEFAULT_ICON_COMPONENTS: Record<number, React.ComponentType<any>> = {
  1: Brain, 2: Compass, 3: Dumbbell, 4: Target, 5: Heart, 6: Backpack, 7: Building2, 8: RefreshCw
};

const DRISHIQ_GREEN = '#1A3D2D';
const cardBase = 'rounded-xl shadow-soft border border-neutral-200 bg-white';
const chip = 'flex items-center gap-1 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs md:text-sm font-semibold w-full';

interface CardFace { front: string[]; back: string[]; }
interface Item { title: string; icon?: React.ComponentType<any> | string; face: CardFace; }

type Orientation = 'horizontal' | 'vertical';

// Helper to choose icon component - now uses Lucide icons
const resolveIconComponent = (iconValue?: string, fallbackIndex?: number) => {
  // Map of icon name keywords to Lucide icons
  const iconMap: Record<string, React.ComponentType<any>> = {
    'brief': Briefcase,
    'case': Briefcase,
    'compass': Compass,
    'chart': TrendingUp,
    'line': TrendingUp,
    'cap': GraduationCap,
    'grad': GraduationCap,
    'megaphone': Megaphone,
    'promo': Megaphone,
    'refresh': RefreshCw,
    'reload': RefreshCw,
    'users': Users,
    'people': Users,
    'target': Target,
    'goal': Target,
    'headset': Headphones,
    'support': Headphones,
    'heart': Heart,
    'map': Map,
    'mic': Mic,
    'rocket': Rocket,
    'brain': Brain,
    'sparkle': Sparkles,
  };

  if (iconValue) {
    const lowered = iconValue.toLowerCase();
    for (const [key, IconComp] of Object.entries(iconMap)) {
      if (lowered.includes(key)) {
        return makeLucideIcon(IconComp);
      }
    }
  }

  // Use default icon based on index
  const DefaultIcon = DEFAULT_ICON_COMPONENTS[fallbackIndex || 1] || Target;
  return makeLucideIcon(DefaultIcon);
};

function FlipCard({ item, flipped, fullWidth = false, onAsk }: { item: Item; flipped: boolean; fullWidth?: boolean; onAsk?: () => void }) {
  const Icon = typeof item.icon === 'string' ? resolveIconComponent(item.icon, 1) : (item.icon || makeLucideIcon(Target));
  return (
    <div className={`group ${cardBase} w-full h-[280px] xs:h-[300px] sm:h-[320px] md:h-[340px] lg:h-[360px] p-0 snap-center`} style={{ perspective: 1000 }}>
      <div className="rf-inner relative h-full w-full transition-transform duration-700 [transform-style:preserve-3d] group-hover:[transform:rotateY(180deg)]" style={{ transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)' }}>
        <div className="absolute inset-0 p-[2px] sm:p-1 [backface-visibility:hidden] rounded-xl overflow-hidden">
          <div className="absolute inset-0 rounded-xl" style={{ background: 'linear-gradient(135deg, #FAFAF9 0%, #FFFFFF 70%)' }} />
          <div className="absolute top-1 sm:top-2 right-1 sm:right-2 text-slate-400 select-none">
            <HelpCircle size={14} strokeWidth={1.5} />
          </div>
          <div className="relative z-10 h-full w-full flex flex-col min-h-0 p-[2px] sm:p-1">
            <div className={`${chip} flex-wrap flex-shrink-0`} style={{ backgroundColor: '#FFFFFF', color: DRISHIQ_GREEN, border: `1px solid ${DRISHIQ_GREEN}20` }}>
              <Icon className="w-3 h-3 sm:w-3.5 sm:h-3.5 md:w-4 md:h-4 flex-shrink-0" />
              <span className="break-words flex-1 min-w-0">{item.title}</span>
            </div>
            <ul className="mt-0.5 sm:mt-1 space-y-0.5 sm:space-y-1 text-[10px] xs:text-[11px] sm:text-xs md:text-sm text-slate-700 text-left flex-1 overflow-y-auto min-h-0 overscroll-contain pr-0.5 sm:pr-1">
              {item.face.front.map((line, idx) => (
                <li key={idx} className="flex items-start gap-0.5 sm:gap-1 text-left">
                  <span className="mt-0.5 flex-shrink-0 text-slate-400">
                    <ArrowRight size={10} strokeWidth={2} />
                  </span>
                  <span className="text-left break-words flex-1 min-w-0 whitespace-normal leading-snug sm:leading-relaxed">{line}</span>
                </li>
              ))}
            </ul>
            <div className="mt-auto pt-0.5 sm:pt-1 opacity-0 group-hover:opacity-100 transition-opacity text-[9px] xs:text-[10px] sm:text-xs text-slate-400">Hover to see insights</div>
          </div>
        </div>

        <div className="absolute inset-0 p-[2px] sm:p-1 [backface-visibility:hidden] rotate-y-180 rounded-xl overflow-hidden">
          <div className="absolute inset-0 rounded-xl" style={{ backgroundColor: DRISHIQ_GREEN }} />
          <div className="absolute top-1 sm:top-2 right-1 sm:right-2 text-white/50 select-none">
            <Sparkles size={14} strokeWidth={1.5} />
          </div>
          <div className="relative z-10 h-full w-full flex flex-col min-h-0 p-[2px] sm:p-1">
            <div className={`${chip} flex-wrap flex-shrink-0`} style={{ backgroundColor: '#FFFFFF', color: DRISHIQ_GREEN, border: `1px solid ${DRISHIQ_GREEN}20` }}>
              <Icon className="w-3 h-3 sm:w-3.5 sm:h-3.5 md:w-4 md:h-4 flex-shrink-0" />
              <span className="break-words flex-1 min-w-0">{item.title}</span>
            </div>
            <ul className="mt-0.5 sm:mt-1 space-y-0.5 sm:space-y-1 text-[10px] xs:text-[11px] sm:text-xs md:text-sm text-white text-left flex-1 overflow-y-auto min-h-0 overscroll-contain pr-0.5 sm:pr-1">
              {item.face.back.slice(0, 5).map((line, idx) => (
                <li key={idx} className="flex items-start gap-0.5 sm:gap-1 text-left">
                  <FM.span className="mt-0.5 flex-shrink-0 text-white/60" initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: idx * 0.08 }}>
                    <Sparkles size={10} strokeWidth={2} />
                  </FM.span>
                  <span className="italic text-left text-[10px] xs:text-[11px] sm:text-xs md:text-sm leading-snug sm:leading-relaxed break-words flex-1 min-w-0 whitespace-normal">"{line.replace(/^"|"$/g, '')}"</span>
                </li>
              ))}
            </ul>
            <div className="mt-0.5 sm:mt-1 pt-0.5 sm:pt-1 flex-shrink-0">
              <button onClick={onAsk} className="w-full rounded-lg bg-white/90 text-[#1A3D2D] text-[9px] xs:text-[10px] sm:text-xs font-semibold py-0.5 sm:py-1 hover:bg-white transition-colors">Ask about {item.title}</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ServicesFlipSlider({ orientation = 'horizontal' }: { orientation?: Orientation } = { orientation: 'horizontal' }) {
  const { t } = useLanguage(['home_dynamic']);

  // safeT treats returning key-as-value as missing
  const safeT = (key: string) => {
    const v = t(key);
    if (!v || v === key) return null;
    return v;
  };

  // build list of items based on translation keys areas.card1 ... areas.cardN
  const itemsFromLocale: Item[] = useMemo(() => {
    const results: Item[] = [];
    // try to discover count: prefer explicit count key if set, otherwise default to 8
    const countRaw = safeT('home_dynamic.areas.count');
    const count = countRaw ? Number(countRaw) || 8 : 8;

    for (let i = 1; i <= count; i++) {
      const base = `home_dynamic.areas.card${i}`;
      const title = safeT(`${base}.title`);
      if (!title) continue; // skip missing cards

      const iconVal = safeT(`${base}.icon`) || undefined;
      const iconComp = resolveIconComponent(iconVal, i);

      const q1 = safeT(`${base}.quote1`) || '';
      const q2 = safeT(`${base}.quote2`) || '';

      const front = []; // Collect all front quotes
      for (let j = 1; j <= 6; j++) {
        const quote = safeT(`${base}.quote${j}`);
        if (quote) front.push(quote);
      }
      const back = []; // We'll attempt to pull longer backlines if present
      // If no backlines collected, try to reuse some alternate keys (e.g., details)
      if (back.length === 0) {
        // Check for back1 through back8
        for (let k = 1; k <= 8; k++) {
          const altBack = safeT(`${base}.back${k}`);
          if (altBack) back.push(altBack);
        }
      }

      // If still empty, duplicate front items onto back (keeps UI populated)
      if (back.length === 0) {
        back.push(...front);
      }

      const item: Item = {
        title,
        icon: iconComp,
        face: { front: front.slice(0,3), back: back.slice(0,6) }, // limit sizes
      };
      results.push(item);
    }

    // If locale produced nothing, fallback to a small default set (prevents empty UI)
    if (results.length === 0) {
      // keep the original set from your earlier static list minimal fallback
      const fallback: Item[] = [
        { title: 'Mental clarity', icon: makeLucideIcon(Brain), face: { front: ['I overthink everything — and end up doing nothing', 'My mind always feels full'], back: ['A clear mind makes better decisions.', 'Not every thought is worth your energy.'] } },
        { title: 'Finding direction', icon: makeLucideIcon(Compass), face: { front: ['I don’t know what I want in life', 'Everyone expects something different — I feel pulled'], back: ['The right boundaries change everything.'] } },
      ];
      return fallback;
    }

    return results;
  }, [t]);

  // replicate behavior of the previous loop/scroll logic
  const base = itemsFromLocale.length;
  const loop = useMemo(() => (orientation === 'horizontal' ? [...itemsFromLocale, ...itemsFromLocale, ...itemsFromLocale] : [...itemsFromLocale, ...itemsFromLocale, ...itemsFromLocale]), [itemsFromLocale, orientation]);

  const containerRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const [paused, setPaused] = useState<boolean>(false);
  const [flipKey, setFlipKey] = useState<string | null>(null);

  useEffect(() => {
    if (orientation === 'horizontal') {
      const el = containerRef.current;
      const track = trackRef.current;
      if (!el || !track) return;

      const cardWidth = 300 + 24; // approximate card width + gap
      let rafId: number | null = null;
      const speedPerFrameH = 0.7;
      const stepH = () => {
        if (!paused) {
          el.scrollLeft += speedPerFrameH;
          const firstCard = track.querySelector<HTMLElement>('[data-card]');
          if (firstCard && el.scrollLeft >= cardWidth) {
            el.scrollLeft -= cardWidth;
            track.appendChild(firstCard);
          }
        }
        rafId = requestAnimationFrame(stepH);
      };
      rafId = requestAnimationFrame(stepH);

      const sampleMs = 450;
      const flipHoldH = 1200;
      let lastKey: string | null = null;
      const timer = setInterval(() => {
        if (!paused) {
          const containerRect = el.getBoundingClientRect();
          const containerCenter = containerRect.left + containerRect.width / 2;
          const cards = Array.from(track.querySelectorAll<HTMLElement>('[data-card]'));
          let bestKey: string | null = null;
          let deltaMin = Number.POSITIVE_INFINITY;
          for (const card of cards) {
            const rect = card.getBoundingClientRect();
            const center = rect.left + rect.width / 2;
            const delta = Math.abs(center - containerCenter);
            if (delta < deltaMin) { deltaMin = delta; bestKey = card.dataset.k || null; }
          }
          if (bestKey && bestKey !== lastKey) {
            lastKey = bestKey;
            setFlipKey(bestKey);
            setTimeout(() => setFlipKey(null), flipHoldH);
          }
        }
      }, sampleMs);

      return () => {
        if (rafId) cancelAnimationFrame(rafId);
        clearInterval(timer);
      };
    } else {
      const el = containerRef.current;
      const track = trackRef.current;
      if (!el || !track) return;

      const gap = 16;
      let rafId: number | null = null;
      const speedPerFrame = 1.2;
      const step = () => {
        if (!paused) {
          el.scrollTop += speedPerFrame;
          const first = track?.querySelector<HTMLElement>('[data-card]');
          if (first && track) {
            const threshold = first.offsetHeight + gap;
            if (el.scrollTop >= threshold) {
              el.scrollTop -= threshold;
              track.appendChild(first);
            }
          }
        }
        rafId = requestAnimationFrame(step);
      };
      rafId = requestAnimationFrame(step);

      const flipHold = 1200;
      const sampleMs = 300;
      const flipTimer = setInterval(() => {
        const containerRect = el.getBoundingClientRect();
        const containerCenter = containerRect.top + containerRect.height / 2;
        const cards = Array.from(track?.querySelectorAll<HTMLElement>('[data-card]') || []);
        let bestIdx = 0;
        let bestDelta = Number.POSITIVE_INFINITY;
        let bestEl: HTMLElement | null = null;
        cards.forEach((card, i) => {
          const rect = card.getBoundingClientRect();
          const rectCenter = rect.top + rect.height / 2;
          const delta = Math.abs(rectCenter - containerCenter);
          if (delta < bestDelta) { bestDelta = delta; bestIdx = i; bestEl = card; }
        });
        const k = (bestEl as HTMLElement | null)?.dataset?.k || String(bestIdx);
        if (!paused && bestDelta <= 48 && k) {
          setFlipKey(k);
          setTimeout(() => setFlipKey(null), flipHold);
        }
      }, sampleMs);

      return () => {
        if (rafId) cancelAnimationFrame(rafId);
        clearInterval(flipTimer);
      };
    }
  }, [orientation, paused, itemsFromLocale.length]);

  return (
    <div className="w-full">
      {orientation === 'horizontal' ? (
        <div ref={containerRef} className="overflow-x-auto overflow-y-hidden hide-scrollbar">
          <div ref={trackRef} className="flex gap-6 py-2 px-2 sm:px-4 md:px-6 snap-x snap-mandatory">
            {loop.map((item, i) => (
              <div
                key={`${item.title}-${i}`}
                data-card
                data-k={`${item.title}-${i}`}
                className="will-change-transform flex-shrink-0 w-[280px] xs:w-[300px] sm:w-[320px] md:w-[340px]"
                onMouseEnter={() => setPaused(true)}
                onMouseLeave={() => setPaused(false)}
              >
                <FlipCard
                  item={item}
                  flipped={flipKey === `${item.title}-${i}` || paused}
                  onAsk={() => window.location.assign(`/share-experience?type=question&topic=${encodeURIComponent(item.title)}`)}
                />
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div ref={containerRef} className="overflow-hidden h-[300px] xs:h-[350px] sm:h-[400px] md:h-[450px] lg:h-[500px]">
          <div ref={trackRef} className="flex flex-col gap-2 sm:gap-3 md:gap-4 py-1 sm:py-2 snap-y snap-mandatory h-full">
            {loop.map((item, i) => (
              <div
                key={`${item.title}-${i}`}
                data-card
                data-k={`${item.title}-${i}`}
                className="will-change-transform"
                onMouseEnter={() => setPaused(true)}
                onMouseLeave={() => setPaused(false)}
              >
                <FlipCard
                  item={item}
                  flipped={flipKey === `${item.title}-${i}` || paused}
                  onAsk={() => window.location.assign(`/share-experience?type=question&topic=${encodeURIComponent(item.title)}`)}
                />
              </div>
            ))}
          </div>
        </div>
      )}

      <style jsx global>{`
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .rotate-y-180 { transform: rotateY(180deg); }
        .card-clip { clip-path: polygon(0 0, 100% 0, 100% 88%, 0 100%); }
      `}</style>
    </div>
  );
}
