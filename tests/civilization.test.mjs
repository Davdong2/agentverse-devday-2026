import fs from 'node:fs';
import assert from 'node:assert/strict';
import ts from 'typescript';
const compile = name => ts.transpileModule(fs.readFileSync(name,'utf8'),{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText;
const url = text => 'data:text/javascript;base64,'+Buffer.from(text).toString('base64');
const worldUrl=url(compile('lib/world-model.ts'));
const model=compile('lib/civilization-model.ts').replace(/(['"])\.\/world-model\1/g,JSON.stringify(worldUrl));
const {regions,stages,stageAt,phaseProgress,collaborationPose,liveWeather,cycleDuration,regionFor}=await import(url(model));
assert.equal(regions.length,10);assert.equal(cycleDuration,80);
for(let i=0;i<stages.length;i++){
 assert.equal(stageAt(stages[i].start),i);
 assert.equal(stageAt(stages[i].end-.001),i);
 assert.equal(phaseProgress(stages[i].start),0);
 if(i)assert.equal(stages[i-1].end,stages[i].start);
}
assert.equal(stageAt(80),0);assert.equal(stageAt(160),0);
for(let t=0;t<160;t+=.1)for(let i=0;i<4;i++){
 const p=collaborationPose(t,i);assert.ok(p.x>=0&&p.x<=1&&p.y>=0&&p.y<=1);
 if(t>.1){const q=collaborationPose(t-.1,i);assert.ok(Math.hypot(q.x-p.x,q.y-p.y)<.015,'Agent must move continuously across stages')}
}
const d=t=>{const a=collaborationPose(t,0),b=collaborationPose(t,1);return Math.hypot(a.x-b.x,a.y-b.y)};
assert.ok(d(30)<d(18),'Docked modules must be closer than approaching modules');
assert.ok(d(70)>d(30),'Completed composite must split apart');
assert.equal(liveWeather(-2),'storm');assert.equal(liveWeather(2),'tide');assert.equal(liveWeather(.3),'calm');
const {agents}=JSON.parse(fs.readFileSync('lib/agents.json','utf8'));
for(const a of agents){const n=regionFor(a);assert.ok(n>=0&&n<regions.length)}
console.log('PASS: ten regions, complete continuous collaboration cycle, docking/splitting, market weather thresholds and real-profile region mapping.');
