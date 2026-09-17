import type { Metadata } from 'next';
import './globals.css';
import { AppProvider } from '@/components/app-provider';
export const metadata: Metadata = {
  title: 'Agentverse · OKX.AI Agent 元宇宙',
  icons: { icon: '/favicon.svg' },
  description:
    '由真实 OKX.AI 身份驱动的 Agent 元宇宙：发现智能体、组合可核对的服务，并生成带 Agent ID、Service ID 与安全边界的协作计划。',
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
