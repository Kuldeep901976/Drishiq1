import React from 'react';

interface TranslatedCardProps {
  translationKey: string; // e.g., 'card.mentalClarity'
  className?: string;
  onClick?: () => void;
  children?: React.ReactNode;
}

export default function TranslatedCard({ 
  translationKey, 
  className = '', 
  onClick,
  children 
}: TranslatedCardProps) {
  
  return (
    <div 
      className={`card ${className}`}
      onClick={onClick}
      style={{ cursor: onClick ? 'pointer' : 'default' }}
    >
      <div className="card-content">
        <h3 className="text-lg font-bold text-gray-900 mb-2">
          {/* {t(`${translationKey}.title`)} */}
          Banner Title
        </h3>
        <p className="text-gray-600">
          {/* {t(`${translationKey}.description`)} */}
          Banner Description
        </p>
        {children}
      </div>
    </div>
  );
}

// 🎯 SPECIALIZED CARD COMPONENTS
export function FeatureCard({ 
  featureKey, 
  imageSrc, 
  badgeText,
  className = '' 
}: {
  featureKey: string;
  imageSrc: string;
  badgeText?: string;
  className?: string;
}) {
  
  return (
    <div className={`card ${className}`}>
      <div className="relative">
        <img 
          src={imageSrc} 
          alt="Banner Title"
          className="w-full h-48 object-cover rounded-t-lg"
        />
        {badgeText && (
          <div className="absolute top-3 left-3">
            <span className="bg-[#0B4422] text-white px-2 py-1 rounded-full text-xs font-medium">
              {badgeText}
            </span>
          </div>
        )}
      </div>
      <div className="card-content">
        <h3 className="text-lg font-bold text-gray-900 mb-2">
          {/* {t(`${featureKey}.title`)} */}
          Banner Title
        </h3>
        <p className="text-gray-600">
          {/* {t(`${featureKey}.description`)} */}
          Banner Description
        </p>
      </div>
    </div>
  );
}

export function TestimonialCard({ 
  testimonialKey, 
  className = '' 
}: {
  testimonialKey: string;
  className?: string;
}) {
  
  return (
    <div className={`testimonial-card ${className}`}>
      <div className="flex items-center mb-4">
        <div className="w-12 h-12 bg-gray-300 rounded-full flex items-center justify-center">
          <span className="text-gray-600 font-semibold">
            {/* {t(`${testimonialKey}.name`).charAt(0)} */}
            Banner Title
          </span>
        </div>
        <div className="ml-4">
          <h4 className="font-semibold text-gray-900">
            {/* {t(`${testimonialKey}.name`)} */}
            Banner Title
          </h4>
          <p className="text-sm text-gray-500">
            {/* {t(`${testimonialKey}.role`)} */}
            Banner Description
          </p>
        </div>
      </div>
      <blockquote className="text-gray-700 italic leading-relaxed">
        {/* {t(`${testimonialKey}.quote`)} */}
        Banner Description
      </blockquote>
    </div>
  );
}

export function AreaCard({ 
  areaKey, 
  className = '' 
}: {
  areaKey: string;
  className?: string;
}) {
  
  return (
    <div className={`${className}`}>
      {/* {t(`areas.${areaKey}`)} */}
      Banner Description
    </div>
  );
}

// 🎯 BANNER COMPONENT WITH TRANSLATIONS
export function TranslatedBanner({ 
  bannerKey, 
  className = '',
  onAction
}: {
  bannerKey: string;
  className?: string;
  onAction?: () => void;
}) {
  
  return (
    <div className={`banner ${className}`}>
      <div className="banner-content">
        <h2 className="banner-title">
          Banner Title
        </h2>
        <p className="banner-description">
          Banner Description
        </p>
        {onAction && (
          <button 
            onClick={onAction}
            className="banner-button"
          >
            Action
          </button>
        )}
      </div>
    </div>
  );
} 
