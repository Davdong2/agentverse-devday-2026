'use client';

import { usePathname } from 'next/navigation';
import { WorldProvider } from '@/components/world-provider';

export function AppProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  if (pathname === '/') return children;
  return <WorldProvider>{children}</WorldProvider>;
}
