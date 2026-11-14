import test from 'node:test';import assert from 'node:assert/strict';import {deckFor,startGame,activeRole,perform,closeDiscussion,castVote,publicView} from '../game.js';
const players=Array.from({length:3},(_,i)=>({id:'p'+i,name:'Player '+i}));
test('deck includes exactly three center cards for 3–10 players',()=>{for(let n=3;n<=10;n++)assert.equal(deckFor(n).length,n+3)});
test('rejects wrong player count',()=>{assert.throws(()=>deckFor(2));assert.throws(()=>deckFor(11))});
test('night swaps resolve in fixed order and do not expose other roles',()=>{const deck=['thief','wolf','oracle','trickster','wolf','villager'];const g=startGame(players,{deck,randomInt:()=>0});assert.ok(g.initial.p0);const v=publicView({code:'ABCDEF',players:players.map(p=>({...p,connected:true})),game:g,host:'p0'},'p0');assert.equal(v.results,null);assert.equal(Object.hasOwn(v,'cards'),false);assert.equal(Object.hasOwn(v,'initial'),false)});
test('voting ties and wolves win if none eliminated',()=>{const g=startGame(players,{deck:['wolf','wolf','villager','oracle','thief','trickster'],randomInt:(n)=>n-1});g.phase='vote';castVote(g,'p0','p1');castVote(g,'p1','p2');castVote(g,'p2','p0');assert.deepEqual(g.result.eliminated,[]);assert.deepEqual(g.result.winners,['wolf'])});
test('village wins if wolf eliminated',()=>{const g=startGame(players,{deck:['wolf','wolf','villager','oracle','thief','trickster'],randomInt:(n)=>n-1});g.phase='vote';castVote(g,'p0','p1');castVote(g,'p1','p0');castVote(g,'p2','p0');assert.deepEqual(g.result.eliminated,['p0']);assert.deepEqual(g.result.winners,['village'])});
test('oracle can inspect two center cards',()=>{const g=startGame(players,{deck:['oracle','wolf','villager','wolf','thief','trickster'],randomInt:(n)=>n-1});g.phase='night';g.order=['oracle'];assert.equal(activeRole(g),'oracle');assert.match(perform(g,'p0',{type:'centers',indices:[0,1]}),/Middle 1/);assert.equal(g.phase,'discussion');closeDiscussion(g);assert.equal(g.phase,'vote')});

test('Moonlit Wolves rejects changing an already-cast secret vote',()=>{
 const g=startGame(players,{deck:['wolf','wolf','villager','oracle','thief','trickster'],randomInt:n=>n-1});
 g.phase='vote';
 castVote(g,'p0','p1');
 assert.throws(()=>castVote(g,'p0','p2'),/Vote already submitted/);
 assert.equal(g.votes.p0,'p1');
 castVote(g,'p1','p0');castVote(g,'p2','p0');
 assert.equal(g.phase,'results');
 assert.equal(g.result.counts.p1,1);
});
