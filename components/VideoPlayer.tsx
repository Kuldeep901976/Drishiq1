'use client';

import { useLanguage } from '@/lib/drishiq-i18n';

interface VideoPlayerProps {
  videoId: string;
  title?: string;
  className?: string;
  width?: number;
  height?: number;
}

export default function VideoPlayer({
  videoId,
  title,
  className = '',
  width = 560,
  height = 315
}: VideoPlayerProps) {
  const { locale } = useLanguage();

  // 🎥 YouTube subtitle language mapping
  const subtitleLanguages: Record<string, string> = {
    en: 'en',
    hi: 'hi',
    es: 'es',
    fr: 'fr',
    ar: 'ar',
    zh: 'zh',
    ru: 'ru',
    pt: 'pt',
    tr: 'tr',
    ja: 'ja',
    ko: 'ko',
    bn: 'bn',
    ta: 'ta',
    te: 'te',
    mr: 'mr',
    it: 'it',
    nl: 'nl',
    ur: 'ur',
    kn: 'kn',
    pl: 'pl',
    sv: 'sv',
    da: 'da',
    no: 'no',
    fi: 'fi'
  };

  // ensure locale is a string before indexing
  const localeKey = locale ?? 'en';
  const subtitleLang = subtitleLanguages[localeKey] ?? 'en';

  // Build YouTube URL with subtitle preferences
  const youtubeUrl = `https://www.youtube.com/embed/${videoId}?cc_lang_pref=${subtitleLang}&cc_load_policy=1&rel=0&modestbranding=1`;

  return (
    <div className={`video-player ${className}`}>
      {title && <h3 className="text-lg font-semibold mb-2">{title}</h3>}
      <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
        <iframe
          src={youtubeUrl}
          title={title || 'Video Player'}
          width={width}
          height={height}
          className="absolute top-0 left-0 w-full h-full"
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>
      <div className="text-sm text-gray-500 mt-2">Subtitles: {subtitleLang.toUpperCase()}</div>
    </div>
  );
}

// 🎥 CUSTOM VIDEO PLAYER WITH LOCALIZED SUBTITLES
interface CustomVideoPlayerProps {
  src: string;
  subtitles?: Record<string, string>; // locale -> subtitle file path
  title?: string;
  className?: string;
}

export function CustomVideoPlayer({
  src,
  subtitles = {},
  title,
  className = ''
}: CustomVideoPlayerProps) {
  const { locale } = useLanguage();
  const localeKey = locale ?? 'en';

  const labelFor = (lang: string) => {
    switch (lang) {
      case 'en':
        return 'English';
      case 'hi':
        return 'हिन्दी';
      case 'es':
        return 'Español';
      case 'fr':
        return 'Français';
      case 'pt':
        return 'Português';
      case 'zh':
        return '中文';
      case 'ar':
        return 'العربية';
      case 'ru':
        return 'Русский';
      case 'ja':
        return '日本語';
      case 'ko':
        return '한국어';
      default:
        return lang.toUpperCase();
    }
  };

  return (
    <div className={`custom-video-player ${className}`}>
      {title && <h3 className="text-lg font-semibold mb-2">{title}</h3>}
      <video controls className="w-full rounded-lg shadow-lg" style={{ maxHeight: '400px' }}>
        <source src={src} type="video/mp4" />

        {/* Localized subtitle tracks */}
        {Object.entries(subtitles).map(([lang, subtitlePath]) => (
          <track
            key={lang}
            kind="subtitles"
            src={subtitlePath}
            srcLang={lang}
            label={labelFor(lang)}
            default={lang === localeKey}
          />
        ))}

        Your browser does not support the video tag.
      </video>
    </div>
  );
}
