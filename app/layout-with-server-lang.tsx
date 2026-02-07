// app/layout-with-server-lang.tsx - Example layout with server language detection
import { headers } from 'next/headers';
// import { ServerAwareLanguageProvider } from '@/lib/server-aware-i18n';

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Get server-detected language
  const headersList = await headers();
  const serverLang = headersList.get('x-language') || 'en';

  return (
    <html lang={serverLang}>
      <head>
        <meta name="x-language" content={serverLang} />
      </head>
      <body>
        {/* <ServerAwareLanguageProvider initialLang={serverLang as any}> */}
          {children}
        {/* </ServerAwareLanguageProvider> */}
      </body>
    </html>
  );
}

