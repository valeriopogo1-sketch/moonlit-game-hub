import test from 'node:test';
import assert from 'node:assert/strict';
import {GAME_RULES,rulesButton,openRules} from '../public/rules.js';
const KINDS=['werewolf','lines','organs','coup','spyfall','chameleon','fish'];

test('all seven games have detailed rules, actions and scoring guides',()=>{
 assert.deepEqual(Object.keys(GAME_RULES).sort(),[...KINDS].sort());
 for(const kind of KINDS){
  const guide=GAME_RULES[kind];
  assert.ok(guide.name.length>5);
  assert.ok(guide.players.length>3);
  assert.ok(guide.objective.length>35);
  assert.ok(guide.setup.length>35);
  assert.ok(guide.steps.length>=3);
  assert.ok(guide.actions.length>=2);
  assert.ok(guide.scoring.length>=35);
  assert.ok(guide.note.length>20);
  assert.ok(guide.steps.every(s=>s.length>15));
  assert.match(rulesButton(kind),/data-rules="/);
 }
 assert.equal(rulesButton('not-a-game'),'');
});
test('rulebook distinguishes house rules and explains newer game modes',()=>{
 assert.match(GAME_RULES.lines.note,/8×8/);
 assert.match(GAME_RULES.lines.scoring,/One completed line/);
 assert.match(GAME_RULES.fish.steps.join(' '),/Skip Question/);
 assert.match(GAME_RULES.fish.actions.join(' '),/three editable fake answers/);
 assert.match(GAME_RULES.spyfall.steps.join(' '),/final turn to nominate/);
 assert.match(GAME_RULES.coup.actions.join(' '),/Contessa/);
 assert.match(GAME_RULES.organs.actions.join(' '),/Wild Organ/);
});
test('game rule modal renders a selected guide and can close',()=>{
 const original=globalThis.document;
 let dialog=null,content='',opened=false,closed=false;
 const fakeDoc={
  querySelector:()=>dialog,
  createElement:()=>({
   id:'',className:'',setAttribute(){},
   addEventListener(){},
   get open(){return opened;},
   showModal(){opened=true;},
   close(){closed=true;}
  }),
  body:{appendChild(node){
   dialog=node;
   Object.defineProperty(dialog,'innerHTML',{get(){return content;},set(v){content=v;}});
  }}
 };
 try{
  globalThis.document=fakeDoc;
  assert.equal(openRules('fish'),true);
  assert.ok(opened);
  assert.match(content,/Fish Frenzy/);
  assert.match(content,/Force Start/);
  assert.match(content,/How to play/);
  assert.match(content,/Scores|Score|points/);
  assert.equal(openRules('invalid'),false);
 }finally{
  if(original===undefined)delete globalThis.document;
  else globalThis.document=original;
 }
});
