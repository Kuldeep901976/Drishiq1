// app/apps/layout.tsx
// OPTIONAL: Use this if you want to prevent header duplication

'use client';

export default function AppsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* NO HEADER HERE - Each page renders its own header */}
      {children}
    </div>
  );
}