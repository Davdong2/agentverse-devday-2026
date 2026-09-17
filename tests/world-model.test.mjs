import fs from 'node:fs';
import assert from 'node:assert/strict';
import ts from 'typescript';
const source=fs.readFileSync('lib/world-model.ts','utf8');
const compiled=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText;
const {appearance,pointAt,replayState}=await import('data:text/javascript;base64,'+Buffer.from(compiled).toString('base64'));
const {agents}=JSON.parse(fs.readFileSync('lib/agents.json','utf8'));
const details=JSON.parse(fs.readFileSync('lib/details.json','utf8'));
assert.equal(agents.length,20);
for(const [name,home] of [['Tachyo',0],['PULSE',1],['1M · 斯巴达',2],['Otto AI',3]]){
 const a=agents.find(a=>a.name===name);assert.equal(appearance(a,details[a.agentId]).home,home,`${name} should map to expected functional area`);
}
assert.equal(new Set(agents.map(a=>appearance(a,details[a.agentId]).role)).size,6,'All six character families represented');
const missing=agents.find(a=>a.name==='Tachyo');assert.equal(appearance(missing).reputation,0,'Unrated agents must not get invented reputation');
assert.deepEqual(appearance({...missing,startingPrice:'9999'}),appearance(missing),'Price must not be visual power');
assert.ok(appearance({...missing,usageCount:1000}).heat>appearance({...missing,usageCount:10}).heat,'Real sales drive visible activity');
assert.deepEqual(pointAt(0),{x:20,y:47});assert.deepEqual(pointAt(1),{x:84,y:75});
for(let p=0;p<=1;p+=.01){const q=pointAt(p);assert.ok(q.x>=0&&q.x<=100&&q.y>=0&&q.y<=100)}
assert.deepEqual([0,.2,.7,1].map(replayState),['idle','research','execute','complete']);
for(const a of agents){assert.ok(details[a.agentId]?.services.length,'Every Agent has actual services');const v=appearance(a,details[a.agentId]);assert.ok(v.modules.length>=1&&v.modules.length<=3)}
console.log('PASS: 20 real profiles, 6 visual families, four areas/states, ratings, sales, price independence, routes, service coverage.');
