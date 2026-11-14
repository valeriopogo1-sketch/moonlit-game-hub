import test from 'node:test';
import assert from 'node:assert/strict';
import {setupLines,lineMove,linesView,makeBoard,linesFor} from '../lines.js';
import {setupOrgans,organMove,organView,alive} from '../organs.js';
const players=[{id:'alice',name:'Alice'},{id:'bob',name:'Bob'}];
test('Five in a Row creates a 64-square board with four free corners',()=>{const b=makeBoard();assert.equal(b.length,64);assert.equal(b.filter(x=>x==='FREE').length,4);});
test('Five in a Row hands remain private',()=>{const g=setupLines(players);const a=linesView(g,'alice'),b=linesView(g,'bob');assert.equal(a.hand.length,5);assert.equal(b.hand.length,5);assert.equal(a.hands,undefined);assert.equal(a.deck,undefined);});
test('Five in a Row rejects out-of-turn actions',()=>{const g=setupLines(players);assert.throws(()=>lineMove(g,'bob',{cardIndex:0,cell:10}),/Not your turn/);});
test('Five in a Row detects horizontal five',()=>{const g=setupLines(players);g.chips.splice(10,5,...Array(5).fill('alice'));assert.ok(linesFor(g,'alice').some(a=>a.join(',')==='10,11,12,13,14'));});
test('Organ Mayhem deals 20 distinct organs with no repeats, including one wild organ',()=>{
 for(let count=2;count<=6;count++){const g=setupOrgans(Array.from({length:count},(_,i)=>({id:'p'+i})));
 const ids=Object.values(g.bodies).flatMap(body=>Object.keys(body));
 assert.equal(ids.length,20);assert.equal(new Set(ids).size,20);
 assert.equal(g.order[g.turn],g.order.find(id=>g.bodies[id].wild));
 }
});
test('Organ Mayhem keeps private hands private',()=>{
 const g=setupOrgans(players),a=organView(g,'alice');assert.equal(a.hand.length,5);assert.equal(a.hands,undefined);assert.equal(a.deck,undefined);
});
test('Organ Mayhem rejects normal actions out of turn',()=>{
 const g=setupOrgans(players),other=g.order.find(p=>p!==g.order[g.turn]);
 assert.throws(()=>organMove(g,other,{cardIndex:0,discardIndices:[0]}),/Not your turn/);
});
test('Organ Mayhem discards and redraws up to two when no regular action is playable',()=>{
 const g=setupOrgans(players),actor=g.order[g.turn];
 g.hands[actor]=[{id:'i1',kind:'instant_guard'},{id:'i2',kind:'instant_block'}];
 g.deck=[{id:'fresh1',kind:'cure'},{id:'fresh2',kind:'shield'}];g.discard=[];
 assert.equal(organView(g,actor).canDiscard,true);
 organMove(g,actor,{discardIndices:[0,1]});
 assert.equal(g.hands[actor].length,2);assert.equal(g.order[g.turn]!==actor,true);
});
test('Organ Mayhem allows instant guard out of turn',()=>{
 const g=setupOrgans(players),player=g.order[(g.turn+1)%2],before=g.turn,part=Object.keys(g.bodies[player])[0];
 g.hands[player]=[{id:'guard',kind:'instant_guard'}];organMove(g,player,{cardIndex:0,instant:true,target:player,part});
 assert.equal(g.turn,before);assert.equal(g.bodies[player][part].shield,1);
});
test('Organ Mayhem instant block restores last attacked organ',()=>{
 const g=setupOrgans(players),attacker=g.order[g.turn],target=g.order[(g.turn+1)%2],part=Object.keys(g.bodies[target]).find(p=>p!=='wild');
 g.hands[attacker]=[{id:'nec',kind:'necrosis'}];g.hands[target]=[{id:'block',kind:'instant_block'}];
 organMove(g,attacker,{cardIndex:0,target,part});assert.equal(g.bodies[target][part].hp,0);
 organMove(g,target,{cardIndex:0,instant:true});assert.equal(g.bodies[target][part].hp,2);
});

test('Five in a Row does not discard dead cards when the replacement deck is empty',()=>{
 const g=setupLines(players);
 const id=g.order[g.turn];
 const before=g.hands[id].length;
 g.deck=[];
 assert.throws(()=>lineMove(g,id,{cardIndex:0,discardDead:true}),/No replacement cards/);
 assert.equal(g.hands[id].length,before);
});
test('Organ Mayhem hides discard action during a final defense reaction',()=>{
 const g=setupOrgans(players);
 const id=g.order[g.turn];
 g.phase='reaction';g.reactionTarget=id;
 assert.equal(organView(g,id).canDiscard,false);
});
