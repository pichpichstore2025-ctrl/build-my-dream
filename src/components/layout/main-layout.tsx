"use client";

import dynamic from 'next/dynamic';

// Dynamically import the client-side layout with SSR turned off.
// This prevents hydration mismatches by ensuring the component only
// renders on the client.
export const MainLayout = dynamic(
  () => import('@/components/layout/main-layout-client').then(mod => mod.MainLayout),
  { ssr: false }
);
