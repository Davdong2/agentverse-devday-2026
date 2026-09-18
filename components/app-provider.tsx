'use client';

import { WorldProvider } from '@/components/world-provider';

export function AppProvider({ children }: { children: React.ReactNode }) {
  return <WorldProvider>{children}</WorldProvider>;
}
