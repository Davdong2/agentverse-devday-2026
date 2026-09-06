import type { Metadata } from 'next';
import './globals.css';
export const metadata: Metadata = {title:'Agentverse · 看见 Agent 的世界',icons: {icon:'/favicon.svg'}, description:'从 OKX.AI 真实 Agent 出发，在研究台、风险门、交易塔与结算桥之间，看见自主行为。'};
export default function RootLayout({children}:{children:React.ReactNode}) {return <html lang="zh-CN"><body>{children}</body></html>}
