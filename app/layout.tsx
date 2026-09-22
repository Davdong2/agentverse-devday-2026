import type { Metadata } from 'next';
import './globals.css';
import { AppProvider } from '@/components/app-provider';
export const metadata: Metadata = {
  title: 'Agentverse · Onchain Economic Agent World',
  icons: { icon: '/favicon.svg' },
  description:
    '一个让 Agent 真正存在、工作并拥有自己经济系统的世界；协议能力只在官方接口或真实链上状态可核验时启用。',
};
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN">
      <body>
        <AppProvider>{children}</AppProvider>
      </body>
    </html>
  );
}
