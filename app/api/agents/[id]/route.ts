import details from '@/lib/details.json';
import {readPublicPage,type Detail} from '@/lib/marketplace';
const cached=new Map<string,Detail>();
export async function GET(_req:Request,{params}:{params:Promise<{id:string}>}){const {id}=await params;if(!/^\d{1,15}$/.test(id))return Response.json({error:'无效 Agent ID'},{status:400});const old=cached.get(id);if(old&&Date.now()-Date.parse(old.fetchedAt)<3600000)return Response.json({...old,mode:'cached'});
 try{const p=await readPublicPage('/'+id);const s=p?.AgentDetailPage?.services;if(!Array.isArray(s?.list))throw new Error('No services');const data:Detail={fetchedAt:new Date().toISOString(),total:Number(s.total),services:s.list.slice(0,9).map((a:Record<string,unknown>)=>({serviceId:Number(a.serviceId),name:String(a.name??''),description:String(a.description??''),price:String(a.price??''),symbol:String(a.symbol??'USDT'),priceInterval:typeof a.priceInterval==='string'?a.priceInterval:undefined,serviceType:String(a.serviceType??'')}))};if(cached.size>=100)cached.clear();cached.set(id,data);return Response.json({...data,mode:'fresh'});
 }catch{const saved=(details as Record<string,Detail>)[id];if(old||saved)return Response.json({...old??saved,mode:'snapshot'});return Response.json({error:'服务资料暂不可用，请查看 OKX.AI 原始页面。'},{status:503})}
}
