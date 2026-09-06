import snapshot from '@/lib/agents.json';
import { readPublicPage, normalizeAgent, type AgentData } from '@/lib/marketplace';
let cached:AgentData|null=null;let refreshed=0;let pending:Promise<AgentData>|null=null;
export async function GET(){
 if(cached&&Date.now()-refreshed<20*60*1000)return Response.json({...cached,mode:'cached'},{headers:{'Cache-Control':'private, max-age=60'}});
 try{
  if(!pending)pending=(async()=>{const p=await readPublicPage();const list=p?.AgentMarketplaceAgentList?.agentList;if(!Array.isArray(list?.list)||!list.list.length)throw new Error('No catalog');const data={source:snapshot.source,fetchedAt:new Date().toISOString(),total:Number(list.total),agents:list.list.slice(0,50).map(normalizeAgent)};cached=data;refreshed=Date.now();return data})();
  const data=await pending;return Response.json({...data,mode:'fresh'},{headers:{'Cache-Control':'private, max-age=60'}});
 }catch{return Response.json({...cached??snapshot,mode:'snapshot',message:'同步暂不可用，正在显示上次成功读取的真实资料。'},{headers:{'Cache-Control':'no-store'}})}finally{pending=null}
}
