'use client';

import Footer from '@/components/Footer';
import Link from 'next/link';
import Image from 'next/image';
import { useEffect, useMemo, useState } from 'react';
import { useLanguage } from '@/lib/drishiq-i18n';
import { Flame, Heart, Zap, HelpCircle } from 'lucide-react';

export default function CommunityHomePage() {
  const { t } = useLanguage(['community']);
  const [showAsk, setShowAsk] = useState(false);
  const [showPrefs, setShowPrefs] = useState(false);

  const recoItems = useMemo(
    () => [
      { kind: 'MUSIC', t: 'Lo‑Fi Focus', c: 'Jay Vibes', img: 'https://images.unsplash.com/photo-1528999872300-5e2596b54cd0?q=80&w=300&auto=format&fit=crop', href: '#music' },
      { kind: 'VIDEO', t: '60s Motivation', c: 'Rhea Visuals', img: 'https://images.unsplash.com/photo-1542219550-37153d387c43?q=80&w=300&auto=format&fit=crop', href: '#video' },
      { kind: 'STORY', t: 'From Lost to Leader', c: 'Mira', img: 'https://images.unsplash.com/photo-1552664730-d307ca884978?q=80&w=300&auto=format&fit=crop', href: '#stories' },
    ],
    []
  );

  // Play/pause videos on hover (to mimic HTML demo)
  useEffect(() => {
    const vids = Array.from(document.querySelectorAll('video')) as HTMLVideoElement[];
    vids.forEach(v => {
      const onEnter = () => v.play().catch(() => {});
      const onLeave = () => v.pause();
      v.addEventListener('mouseenter', onEnter);
      v.addEventListener('mouseleave', onLeave);
      return () => {
        v.removeEventListener('mouseenter', onEnter);
        v.removeEventListener('mouseleave', onLeave);
      };
    });
  }, []);

  return (
    <div className="min-h-screen bg-[#f8f9fa] relative">

      {/* Watermark overlay across the page (single readable line) */}
      <div className="wm-overlay pointer-events-none fixed inset-0 z-[1100] select-none overflow-hidden">
        <div className="wm-center">Part of DrishiQ Vision</div>
      </div>

      {/* Tickers */}
      <div className="fixed top-0 left-0 w-full z-20">
        <div className="ticker bg-[#063015] text-white h-8 flex items-center overflow-hidden text-sm">
          <div className="ticker-track">
            <span>{t('community.tickers.career')}</span>
            <span>{t('community.tickers.love')}</span>
            <span>{t('community.tickers.health')}</span>
            <span>{t('community.tickers.finance')}</span>
            <span>{t('community.tickers.life')}</span>
          </div>
        </div>
        <div className="ticker bg-[#0a3a18] text-white h-8 flex items-center overflow-hidden text-sm">
          <div className="ticker-track">
            <span>{t('community.tickers.moonInsight')}</span>
            <span>{t('community.tickers.tip')}</span>
            <span>{t('community.tickers.focus')}</span>
          </div>
        </div>
      </div>

      {/* Content */}
      <main className="content-safe-area max-w-[1200px] mx-auto px-4 pt-28 pb-10 relative z-10">
        {/* Top rail: profile + right column */}
        <div className="flex gap-6 items-start">
          {/* Left profile */}
          <aside className="sticky top-20 hidden lg:block flex-none w-[290px] rounded-xl overflow-hidden text-white" style={{ background: '#0a0a0a' }}>
            <div className="h-[120px] bg-cover bg-center relative" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?q=80&w=1400&auto=format&fit=crop')" }}>
              <div className="absolute inset-0 bg-gradient-to-b from-black/30 to-black/50" />
            </div>
            <div className="p-4">
              <div className="mx-auto -mt-12 mb-2 w-24 h-24 rounded-full ring-4 ring-[#d4af37] overflow-hidden relative bg-white">
                <Image fill alt="avatar" src="/assets/avatar/avatardrishiq.png" className="object-contain p-1" />
              </div>
              <h3 className="text-center font-semibold">Aarav Singh</h3>
              <p className="text-center text-sm/5 opacity-90">Creator • Delhi</p>
              <div className="flex justify-center gap-2 flex-wrap mt-2">
                <span className="px-2 py-1 rounded-full text-xs bg-white/15 border border-white/25 backdrop-saturate-150">Creator</span>
                <span className="px-2 py-1 rounded-full text-xs bg-white/15 border border-white/25 backdrop-saturate-150">First 100 Member</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-sm bg-white/5 rounded-lg p-3 mt-3">
                <div>Age: <b>28</b></div><div>Gender: <b>Male</b></div>
                <div>Languages: <b>EN, HI</b></div><div>Zodiac: <b>♌ / ♈</b></div>
                <div>Views: <b>1.2K</b></div><div>Impressions: <b>8.4K</b></div>
              </div>
              <div className="flex justify-between gap-2 mt-3 text-sm">
                <div><b>Videos</b><br/>12</div>
                <div><b>Audios</b><br/>5</div>
                <div><b>Stories</b><br/>8</div>
              </div>
              <div className="bg-white/10 rounded-lg p-3 mt-3 text-sm">
                <p className="m-0">Followers: <b>3.4K</b></p>
                <p className="m-0">Following: <b>256</b></p>
                <p className="m-0 opacity-90">Followed by: You, Rhea, Kabir, Mira</p>
              </div>
            </div>
          </aside>

          {/* Right rail */}
          <div className="flex-1 flex flex-col gap-4 min-w-0">
            {/* Alignment widget */}
            <div className="flex items-center gap-3 rounded-xl border border-[#dce9e0] bg-gradient-to-r from-[#0d5c2e14] to-[#d4af3714] p-4 shadow-sm">
              <div className="font-semibold text-[#0B4422] flex items-center gap-2"><span className="text-xl">🎨</span><span>{t('community.home.focusToday')}</span><span className="font-bold">Creativity & Flow</span></div>
              <span className="text-sm opacity-80">{t('community.home.nudge')}</span>
              <div className="ml-auto flex gap-2">
                <button onClick={() => setShowAsk(true)} className="px-3 py-2 rounded-full text-sm border border-[#cfe7d6] bg-white text-[#0B4422]">{t('community.home.postMorningThought')}</button>
                <button className="px-3 py-2 rounded-full text-sm bg-[#0B4422] text-white">{t('community.home.joinLiveRoom')}</button>
              </div>
            </div>

            {/* Latest post reactions */}
            <div className="flex gap-3 rounded-xl border border-[#e6ece8] border-l-4 border-l-[#9fd2b0] bg-white p-3 shadow-sm">
              <Image src="https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?q=80&w=400&auto=format&fit=crop" alt="thumb" width={120} height={86} className="rounded-lg object-cover" />
              <div className="flex flex-col gap-2 min-w-0">
                <div className="font-semibold truncate">{t('community.home.latestTrack')} <strong>"City Night Flow"</strong></div>
                <div className="flex items-center gap-3 text-[15px]">
                  <span className="flex items-center gap-1"><Flame size={14} /> 128</span>
                  <span className="flex items-center gap-1"><Heart size={14} /> 342</span>
                  <span className="flex items-center gap-1"><Zap size={14} /> 19</span>
                  <span className="flex items-center gap-1"><HelpCircle size={14} /> 7</span>
                  <button onClick={() => {
                    const musicSection = document.getElementById('music');
                    if (musicSection) {
                      const headerHeight = 76; // Match the CSS variable
                      const elementTop = musicSection.offsetTop - headerHeight;
                      window.scrollTo({
                        top: elementTop,
                        behavior: 'smooth'
                      });
                    }
                  }} className="ml-2 px-3 py-1 rounded-full text-sm bg-[#eef6f0] border border-[#cfe7d6] text-[#0B4422]">{t('community.home.viewComments')}</button>
                </div>
              </div>
            </div>

            {/* Motivation + quick recs */}
            <section className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
              <h2 className="text-xl font-semibold text-[#0B4422] mb-2">{t('community.home.motivation')}</h2>
              <div className="rounded-xl shadow-sm p-4 bg-white grid gap-3">
                <h3 className="text-[#0B4422] font-semibold m-0">{t('community.home.innerClarity')}</h3>
                <p className="m-0">{t('community.home.clarityQuote')}</p>
                <div className="flex flex-wrap gap-2">
                  <button className="btn-primary">{t('community.home.listenToMusic')}</button>
                  <button className="btn-primary">{t('community.home.watchVideo')}</button>
                  <button className="btn-primary">{t('community.home.readStory')}</button>
                  <button className="btn-gold">{t('community.home.postThought')}</button>
                </div>
              </div>

              {/* Moving recommendation stripe */}
              <div className="reco mt-3" aria-label="Quick recommendations">
                <div className="reco-track">
                  {[...recoItems, ...recoItems].map((r, i) => (
                    <a key={i} href={r.href} className="reco-item" onClick={(e) => { 
                      e.preventDefault(); 
                      const targetSection = document.querySelector(r.href) as HTMLElement;
                      if (targetSection) {
                        const headerHeight = 76; // Match the CSS variable
                        const elementTop = targetSection.offsetTop - headerHeight;
                        window.scrollTo({
                          top: elementTop,
                          behavior: 'smooth'
                        });
                      }
                    }}>
                      <span className="kind">{r.kind}</span>
                      <img src={r.img} alt="reco" />
                      <span className="meta">
                        <span className="t">{r.t}</span>
                        <span className="c">{r.c}</span>
                      </span>
                    </a>
                  ))}
                </div>
              </div>
            </section>
          </div>
        </div>

        {/* Rows */}
        <p className="moon-divider">{t('community.home.feelingInspired')}</p>

        {/* Music row (sidebar right) */}
        <div id="music" className="row">
          <div className="main">
            <Section title={t('community.home.musicPicks')} cards={3} kind="music" />
          </div>
          <RightList title={t('community.home.topMusicContributors')} labels={[
                       { name: 'Aarav Beats', role: 'Lo‑fi • Indie', avatar: '/assets/avatar/avatar fun.png' },
           { name: 'Mira Tones', role: 'Indie Pop', avatar: '/assets/avatar/avatar enjoying.png' },
           { name: 'Jay Vibes', role: 'Beats', avatar: '/assets/avatar/avatar thinking.png' },
          ]} />
        </div>

        {/* Video row (sidebar left) */}
        <div id="video" className="row">
          <LeftList title={t('community.home.topVideoCreators')} labels={[
            { name: 'Rhea Visuals', role: 'Shorts', avatar: '/assets/avatar/avatar presentation.png' },
            { name: 'Kabir Motion', role: 'Vlogs', avatar: '/assets/avatar/avatar casual waving.png' },
            { name: 'Anya Films', role: 'Edits', avatar: '/assets/avatar/avatar making speech.png' },
          ]} />
          <div className="main">
            <p className="moon-divider">{t('community.home.gotMessage')}</p>
            <Section title={t('community.home.videosEnjoy')} cards={2} kind="video" />
          </div>
        </div>

        {/* Stories row (sidebar right) */}
        <div id="stories" className="row">
          <div className="main">
            <p className="moon-divider">{t('community.home.gotSomething')}</p>
            <Section title={t('community.home.realStories')} cards={2} kind="story" />
          </div>
          <RightList title={t('community.home.topStorytellers')} labels={[
            { name: 'Leela Chronicles', role: 'Life', avatar: '/assets/avatar/avatar taking notes.png' },
            { name: 'Raj DeepThoughts', role: 'Career', avatar: '/assets/avatar/avatar reflective thinker.png' },
            { name: 'Simran Voices', role: 'Wellness', avatar: '/assets/avatar/avatar thinking.png' },
          ]} />
        </div>

        {/* Creative row (sidebar left) */}
        <div id="creative" className="row">
          <LeftList title={t('community.home.topCreators')} labels={[
            { name: 'Meena Sketches', role: 'Art', avatar: '/assets/avatar/avatar sharing idea.png' },
            { name: 'Zoya Crafts', role: 'DIY', avatar: '/assets/avatar/avatar fun.png' },
            { name: 'Vik Artline', role: 'Design', avatar: '/assets/avatar/avatar idea.png' },
          ]} />
          <div className="main">
            <p className="moon-divider">{t('community.home.unleashCreativity')}</p>
            <Section title={t('community.home.creativeSpace')} cards={2} kind="creative" />
          </div>
        </div>

        {/* Help row (sidebar right) */}
        <div id="help" className="row">
          <div className="main">
            <p className="moon-divider">{t('community.home.notAlone')}</p>
            <Section title={t('community.home.peopleSeekingHelp')} cards={3} kind="help" simple />
          </div>
          <RightList title={t('community.home.topSupporters')} labels={[
            { name: 'Alok', role: 'Empathy Champ', avatar: '/assets/avatar/avatar sweater thumbsup.png' },
            { name: 'Priya Cares', role: 'Listener', avatar: '/assets/avatar/avatar sharing idea.png' },
            { name: 'Deep Healing', role: 'Support', avatar: '/assets/avatar/avatar sweater1 thumbsup.png' },
          ]} />
        </div>

        {/* Events row */}
        <div id="events" className="row">
          <LeftPuzzle />
          <div className="main">
            <p className="moon-divider">{t('community.home.gotInterests')}</p>
            <Section title={t('community.home.eventsLike')} cards={3} kind="event" />
          </div>
        </div>

        {/* Ask modal */}
        {showAsk && (
          <div className="modal" role="dialog" aria-modal="true">
            <div className="modal-card">
              <button className="modal-close" onClick={() => setShowAsk(false)}>✕</button>
              <h3 className="font-semibold mb-2">{t('community.home.askQuestion')}</h3>
              <textarea className="w-full h-[110px] border rounded-lg p-2" placeholder={t('community.home.whatsOnMind')} />
              <div className="flex justify-end gap-2 mt-3">
                <button className="btn-neutral" onClick={() => setShowAsk(false)}>{t('community.suggestions.form.cancel')}</button>
                <button className="btn-primary" onClick={() => setShowAsk(false)}>Submit</button>
              </div>
            </div>
          </div>
        )}

        {/* Prefs modal */}
        {showPrefs && (
          <div className="modal" role="dialog" aria-modal="true">
            <div className="modal-card">
              <button className="modal-close" onClick={() => setShowPrefs(false)}>✕</button>
              <h3 className="font-semibold mb-2">{t('community.home.tuneRecommendations')}</h3>
              <p className="text-sm opacity-80 mb-3">{t('community.home.adjustWeights')}</p>
              <div className="grid gap-3 text-sm">
                <label>{t('community.home.musicWeight')} <input type="range" min={0} max={100} defaultValue={70} className="w-full" /></label>
                <label>{t('community.home.videoWeight')} <input type="range" min={0} max={100} defaultValue={50} className="w-full" /></label>
                <label>{t('community.home.storiesWeight')} <input type="range" min={0} max={100} defaultValue={40} className="w-full" /></label>
                <div className="flex gap-3 flex-wrap">
                  <label><input type="checkbox" defaultChecked /> {t('community.home.calm')}</label>
                  <label><input type="checkbox" /> {t('community.home.energy')}</label>
                  <label><input type="checkbox" /> {t('community.home.focus')}</label>
                  <label><input type="checkbox" defaultChecked /> {t('community.home.english')}</label>
                  <label><input type="checkbox" /> {t('community.home.hindi')}</label>
                </div>
              </div>
              <div className="flex justify-end gap-2 mt-3">
                <button className="btn-neutral" onClick={() => setShowPrefs(false)}>{t('community.suggestions.form.cancel')}</button>
                <button className="btn-primary" onClick={() => setShowPrefs(false)}>Save</button>
              </div>
            </div>
          </div>
        )}
      </main>

      <Footer />

      {/* Minimal CSS to replicate HTML behaviors */}
      <style jsx global>{`
        .btn-primary{background:#0B4422;color:#fff;padding:10px 14px;border-radius:8px;font-weight:600}
        .btn-gold{background:#d4af37;color:#0B4422;padding:10px 14px;border-radius:8px;font-weight:600}
        .btn-neutral{background:#ccc;color:#222;padding:8px 12px;border-radius:8px}
        .ticker-track{display:flex;gap:40px;padding-left:100%;width:max-content;white-space:nowrap;animation:scroll-left 26s linear infinite}
        @keyframes scroll-left{from{transform:translateX(0)}to{transform:translateX(-50%)}}
        .reco{overflow:hidden;border:1px solid #e6ece8;border-radius:12px;background:#fff;box-shadow:0 1px 6px rgba(0,0,0,.06)}
        .reco-track{display:flex;gap:14px;padding:10px;width:max-content;animation:reco-move 28s linear infinite}
        @keyframes reco-move{from{transform:translateX(0)}to{transform:translateX(-50%)}}
        .reco-item{display:flex;align-items:center;gap:10px;padding:8px 12px;border:1px solid #e6ece8;border-radius:10px;text-decoration:none;color:inherit}
        .reco-item .kind{font-size:.75rem;font-weight:700;padding:4px 8px;border-radius:999px;background:#eef6f0;color:#0B4422;border:1px solid #cfe7d6}
        .reco-item img{width:56px;height:42px;border-radius:8px;object-fit:cover}
        .reco-item .meta{display:flex;flex-direction:column;line-height:1.1}
        .reco-item .t{font-weight:600;font-size:.9rem;white-space:nowrap}
        .reco-item .c{font-size:.78rem;opacity:.75;white-space:nowrap}
        .moon-divider{background:#e7eaf0;padding:10px 14px;text-align:center;font-style:italic;font-size:14px;border-top:1px dashed #cbd5e1;border-bottom:1px dashed #cbd5e1;border-radius:8px;margin:14px 0}
        .row{display:flex;flex-wrap:nowrap;gap:22px;align-items-stretch;margin:18px 0}
        .row .main{flex:1;min-width:0}
        .card{position:relative;flex:0 0 260px;display:flex;flex-direction:column;gap:8px;background:#fff;border-radius:12px;box-shadow:0 2px 12px rgba(0,0,0,.08);padding:12px;transition:transform .2s ease, box-shadow .2s ease}
        .card:hover{transform:translateY(-3px);box-shadow:0 6px 18px rgba(0,0,0,.12)}
        .card-scroller{display:flex;gap:18px;overflow:auto;padding:6px 2px}
        .card-scroller::-webkit-scrollbar{height:8px}
        .card-scroller::-webkit-scrollbar-thumb{background:#cfd6cf;border-radius:8px}
        .modal{position:fixed;inset:0;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,.6);z-index:1000}
        .modal-card{background:#fff;border-radius:12px;padding:18px;max-width:520px;width:92%;position:relative}
        .modal-close{position:absolute;top:10px;right:10px;border:none;background:none;font-size:18px;cursor:pointer}
        /* Watermark (single readable line) */
        .wm-center{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%) rotate(-18deg);white-space:nowrap;font-weight:800;letter-spacing:.08em;color:rgba(11,68,34,.15);font-size:clamp(28px,12vw,120px)}
        @media (max-width:1024px){.row{overflow-x:auto}.row .main{min-width:540px}}
        @media (max-width:640px){.row .main{min-width:80vw}.card img,.card video{height:150px}}
      `}</style>
    </div>
  );
}

// --- Small presentational helpers ---
function Section({ title, cards, kind, simple }: { title: string; cards: number; kind: 'music'|'video'|'story'|'creative'|'help'|'event'; simple?: boolean }){
  return (
    <section className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
      <h2 className="text-xl font-semibold text-[#0B4422] mb-3">{title}</h2>
      <div className="card-scroller">
        {Array.from({ length: cards }).map((_, i) => (
          <article key={i} className="card">
            {kind === 'video' ? (
              <div className="relative">
                <video src="https://media.w3.org/2010/05/sintel/trailer.mp4" muted playsInline loop className="w-full h-[170px] object-cover rounded-lg" />
              </div>
            ) : (
              <img className="w-full h-[170px] object-cover rounded-lg" src={pickImg(kind, i)} alt="card" />
            )}
            {!simple && <p className="m-0 text-sm">Placeholder {kind} item #{i + 1}</p>}
            {!simple && (
              <div className="flex items-center gap-2 mt-1">
                <button className="text-gray-600 hover:text-orange-500 transition-colors"><Flame size={18} /></button>
                <button className="text-gray-600 hover:text-rose-500 transition-colors"><Heart size={18} /></button>
                <button className="text-gray-600 hover:text-amber-500 transition-colors"><Zap size={18} /></button>
                <button className="text-gray-600 hover:text-blue-500 transition-colors"><HelpCircle size={18} /></button>
                <button className="btn-primary ml-auto px-3 py-1">Ask</button>
              </div>
            )}
          </article>
        ))}
      </div>
    </section>
  );
}

function RightList({ title, labels }: { title: string; labels: { name: string; role: string; avatar?: string }[] }){
  return (
    <aside className="hidden md:block flex-none w-[280px] bg-[#f0f7f2] p-4 rounded-xl shadow max-h-[520px] overflow-auto">
      <h3 className="text-[#0B4422] font-semibold mb-2">{title}</h3>
      {labels.map((p, idx) => (
        <div key={idx} className="flex items-center gap-2 my-2">
                     <img className="w-7 h-7 rounded-full object-cover ring-2 ring-white shadow bg-white" src={p.avatar || '/assets/avatar/avatardrishiq.png'} alt={p.name} />
          <div className="leading-tight">
            <div className="font-semibold text-[#0B4422] text-sm">{p.name}</div>
            <div className="text-xs opacity-70">{p.role}</div>
          </div>
          <img className="ml-auto w-10 h-7 rounded object-cover" src="https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?q=80&w=200&auto=format&fit=crop" alt="thumb" />
        </div>
      ))}
    </aside>
  );
}

function LeftList(props: Parameters<typeof RightList>[0]) {
  return <RightList {...props} />;
}

function LeftPuzzle() {
  const { t } = useLanguage(['community']);
  return (
    <aside className="hidden md:block flex-none w-[280px] p-0">
      <div className="bg-white rounded-xl p-4 shadow border">
        <h3 className="font-semibold text-[#0B4422] mb-2">{t('community.home.puzzlesMindGames')}</h3>
        <div className="space-y-3">
          <div className="bg-white rounded-lg p-3 border">
            <p className="font-semibold mb-1">{t('community.home.riddleOfDay')}</p>
            <p className="italic text-sm mb-2">What has keys but can't open locks?</p>
            <div className="flex gap-2">
              <input className="flex-1 border rounded-lg px-2 py-1" placeholder={t('community.home.yourAnswer')} />
              <button className="btn-gold" onClick={() => alert('Answer: A piano')}>{t('community.home.reveal')}</button>
            </div>
          </div>
          <div className="bg-white rounded-lg p-3 border">
            <p className="font-semibold mb-1">{t('community.home.logicChallenge')}</p>
            <p className="italic text-sm mb-2">If two hours ago, it was as long after 1 PM as it was before 1 AM yesterday, what time is it now?</p>
            <button className="btn-primary" onClick={() => alert('Answer: 9 PM')}>{t('community.home.showAnswer')}</button>
          </div>
        </div>
      </div>
    </aside>
  );
}

function pickImg(kind: string, i: number) {
  const imgs = {
    music: [
      'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?q=80&w=1200&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1483412033650-1015ddeb83d1?q=80&w=1200&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1528999872300-5e2596b54cd0?q=80&w=1200&auto=format&fit=crop',
    ],
    story: [
      'https://images.unsplash.com/photo-1511248427760-5f6b9d8e5606?q=80&w=1200&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1552664730-d307ca884978?q=80&w=1200&auto=format&fit=crop',
    ],
    creative: [
      'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?q=80&w=1200&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1500739080005-52fe3a6b5de3?q=80&w=1200&auto=format&fit=crop',
    ],
    help: [
      'https://images.unsplash.com/photo-1507874457470-272b3c8d8ee2?q=80&w=1200&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?q=80&w=1200&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1542219550-37153d387c43?q=80&w=1200&auto=format&fit=crop',
    ],
    event: [
      'https://images.unsplash.com/photo-1557804506-669a67965ba0?q=80&w=1200&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?q=80&w=1200&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1507874457470-272b3c8d8ee2?q=80&w=1200&auto=format&fit=crop',
    ],
  } as Record<string, string[]>;
  const arr = imgs[kind] || imgs.music;
  return arr[i % arr.length];
}


