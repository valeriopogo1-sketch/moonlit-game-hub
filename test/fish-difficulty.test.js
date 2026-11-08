import test from 'node:test';
import assert from 'node:assert/strict';
import {setupFish,fishView,DIFFICULTIES} from '../fish.js';
const people=Array.from({length:4},(_,i)=>({id:'p'+i,name:'Player '+i}));
test('Fish Frenzy selects the correct independent question difficulty bank',()=>{
 const seen=new Map();
 for(const difficulty of DIFFICULTIES){
  const g=setupFish(people,{difficulty});
  assert.equal(g.difficulty,difficulty);
  assert.equal(fishView(g,people[0].id).difficulty,difficulty);
  assert.equal(g.questions.length,difficulty==='easy'?16:12);
  assert.ok(g.questions.every(q=>q.decoys.length===3));
  seen.set(difficulty,new Set(g.questions.map(q=>q.question)));
 }
 for(const a of DIFFICULTIES)for(const b of DIFFICULTIES)if(a!==b)
  assert.ok([...seen.get(a)].every(q=>!seen.get(b).has(q)));
});
test('Fish Frenzy rejects unsupported difficulty',()=>assert.throws(()=>setupFish(people,{difficulty:'impossible'}),/difficulty/));
test('Fish Frenzy Force Start retains two suggested editable answers with Hard difficulty',()=>{
 const g=setupFish(people.slice(0,2),{force:true,difficulty:'hard'});
 const id=g.order.find(x=>x!==g.guesser),v=fishView(g,id);
 assert.equal(v.answerFields.length,2);assert.ok(v.answerFields.every(f=>f.suggestion));
});
