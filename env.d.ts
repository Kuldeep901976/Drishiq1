// env.d.ts
declare namespace NodeJS {
    interface ProcessEnv {
      NODE_ENV?: 'development' | 'production' | 'test';
      GOOGLE_SITE_VERIFICATION?: string;
      YANDEX_VERIFICATION?: string;
      YAHOO_VERIFICATION?: string;
      NEXT_PUBLIC_GOOGLE_ANALYTICS_ID?: string;
      NEXT_PUBLIC_SENTRY_DSN?: string;
      // add any other env keys your app uses (especially NEXT_PUBLIC_ ones)
    }
  }
  
