import type { Metadata } from 'next';
import './globals.css';
import { WorldProvider } from '@/components/world-provider';
export const metadata: Metadata = {
  title: 'Agentverse · OKX.AI Mission Console',
  icons: { icon: '/favicon.svg' },
  description:
    '从目标出发，组合可核对的 OKX.AI Agent 服务，并生成带 Agent ID、Service ID 与安全边界的任务计划。',
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
