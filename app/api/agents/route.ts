import snapshot from '@/lib/agents.json';
import {readPublicPage,normalizeAgent,type AgentData} from '@/lib/marketplace';
let cached:AgentData|null=null;
export async function GET(){
 if(cached&&Date.now()-Date.parse(cached.fetchedAt)<1200000)return Response.json({...cached,mode:'cached'},{headers:{'Cache-Control':'no-store'}});
 try{
 const p=await readPublicPage();const list=p?.AgentMarketplaceAgentList?.agentList;
 if(!Array.isArray(list?.list)||!list.list.length)throw new Error('Catalog records unavailable');
 const data={source:snapshot.source,fetchedAt:new Date().toISOString(),total:Number(list.total),agents:list.list.slice(0,50).map(normalizeAgent)};
 cached=data;return Response.json({...data,mode:'fresh'},{headers:{'Cache-Control':'no-store'}});
 }catch(error){console.error('catalog_sync_failed',error instanceof Error?error.message:'Unknown upstream error');return Response.json({...cached??snapshot,mode:'snapshot',message:'同步暂不可用，正在显示上次成功读取的真实资料。'},{headers:{'Cache-Control':'no-store'}})}
}
