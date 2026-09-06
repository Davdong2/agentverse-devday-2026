import type { Metadata } from 'next';
import './globals.css';
import { WorldProvider } from '@/components/world-provider';
export const metadata: Metadata = {
  title: 'Agentverse · 非人类数字文明',
  icons: { icon: '/favicon.svg' },
  description:
    '从 OKX.AI 真实 Agent 档案出发，观察协作、合体、交付与成长。一个持续运行的非人类数字文明。',
};
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN">
      <body>
        <WorldProvider>{children}</WorldProvider>
      </body>
    </html>
  );
}
