import test from 'node:test';
import assert from 'node:assert/strict';
import {setupCoup,coupMove} from '../coup.js';
import {setupSpyfall,spyMove,spyView,expireSpyRound,setupChameleon,chameleonMove,chameleonView} from '../deduction.js';
import {setupFish,fishMove,fishView} from '../fish.js';
import {setupLines,lineMove} from '../lines.js';
import {setupOrgans,organMove} from '../organs.js';
import {startGame,castVote} from '../game.js';
const people=Array.from({length:8},(_,i)=>({id:'a'+i,name:'Player '+i}));
test('Coup: caught Assassin bluff refunds the three coins and cancels the attack',()=>{
 const g=setupCoup(people.slice(0,3)),actor=g.order[0],target=g.order[1];
 g.influence[actor]=['Duke','Captain'];g.coins[actor]=5;
 coupMove(g,actor,{action:'assassinate',target});
 assert.equal(g.coins[actor],2);
 coupMove(g,target,{action:'challenge'});
 coupMove(g,actor,{index:0});
 assert.equal(g.phase,'challenge-loss');
 coupMove(g,actor,{index:0});
 assert.equal(g.coins[actor],5);
 assert.equal(g.influence[target].filter(Boolean).length,2);
 assert.equal(g.phase,'playing');
});
test('Coup: truthful Assassin still pays when target blocks',()=>{
 const g=setupCoup(people.slice(0,3)),actor=g.order[0],target=g.order[1],bystander=g.order[2];
 g.influence[actor][0]='Assassin';g.coins[actor]=4;
 coupMove(g,actor,{action:'assassinate',target});
 coupMove(g,target,{action:'pass'});
 coupMove(g,bystander,{action:'pass'});
 assert.equal(g.phase,'block');
 coupMove(g,target,{action:'block',role:'Contessa'});
 coupMove(g,actor,{action:'pass'});
 coupMove(g,bystander,{action:'pass'});
 assert.equal(g.phase,'playing');
 assert.equal(g.coins[actor],1);
 assert.equal(g.influence[target].filter(Boolean).length,2);
});
test('Spyfall: nomination pauses clock; declining vote resumes remaining time',()=>{
 const g=setupSpyfall(people.slice(0,4)),accuser=g.order[0],suspect=g.order[1],voter=g.order[2];
 g.roundEnds=Date.now()+4800;
 spyMove(g,accuser,{action:'accuse',target:suspect});
 assert.equal(g.phase,'accusation');
 const remaining=g.pausedRemainingMs;
 assert.ok(remaining>3000&&remaining<=4800);
 assert.equal(spyView(g,accuser).timerPaused,true);
 assert.equal(expireSpyRound(g,Date.now()+60000),false,'timer must not expire during a vote');
 spyMove(g,voter,{action:'vote',agree:false});
 assert.equal(g.phase,'talk');
 assert.equal(g.pausedRemainingMs,null);
 assert.ok(g.roundEnds>Date.now()+3000,'remaining time should be restored');
 assert.equal(spyView(g,accuser).canAccuse,false);
});
test('Spyfall: previous Spy becomes dealer and new location is not repeated',()=>{
 const g=setupSpyfall(people.slice(0,4)),previousSpy=g.spy,previousLocation=g.location;
 g.roundEnds=0;
 expireSpyRound(g);
 assert.equal(g.phase,'final-nomination');
 for(const accuser of g.finalQueue){
  if(g.phase!=='final-nomination')break;
  const target=g.order.find(id=>id!==accuser);
  spyMove(g,accuser,{action:'accuse',target});
  const voter=g.order.find(id=>id!==accuser&&id!==target);
  spyMove(g,voter,{action:'vote',agree:false});
 }
 assert.equal(g.phase,'round-results');
 spyMove(g,g.order[0],{action:'next'});
 assert.equal(g.dealer,previousSpy);
 assert.equal(g.round,2);
 assert.notEqual(g.location,previousLocation);
 g.roundEnds=0;expireSpyRound(g);
 assert.equal(g.finalQueue[0],previousSpy);
});
test('Hidden Word: Codebreaker cannot submit the secret word as their clue',()=>{
 const g=setupChameleon(people.slice(0,4)),speaker=g.order[0];
 const current=g.order[g.clueTurn];
 if(current===g.chameleon){
  chameleonMove(g,current,{action:'clue',clue:'Related'});
 }
 const speaker2=g.order[g.clueTurn];
 assert.notEqual(speaker2,g.chameleon);
 assert.throws(()=>chameleonMove(g,speaker2,{action:'clue',clue:g.secret}),/not state it directly/);
 assert.equal(g.clueTurn,g.order.indexOf(speaker2));
 chameleonMove(g,speaker2,{action:'clue',clue:'Related'});
});
test('Hidden Word: voting hides word options for seven/eight players',()=>{
 for(const n of [7,8]){
  const g=setupChameleon(people.slice(0,n));
  for(const id of g.order)chameleonMove(g,id,{action:'clue',clue:'Related'});
  assert.equal(g.phase,'vote');
  assert.equal(chameleonView(g,g.chameleon).words.length,0);
  assert.equal(chameleonView(g,g.order.find(id=>id!==g.chameleon)).words.length,0);
 }
});
test('Fish Frenzy: standard game rejects duplicate and truthful Red Herring answers',()=>{
 const g=setupFish(people.slice(0,4)),blue=g.blue;
 const red=g.order.filter(id=>id!==g.guesser&&id!==blue);
 assert.throws(()=>fishMove(g,red[0],{action:'answer',answer:g.answer}),/false answer/);
 fishMove(g,red[0],{action:'answer',answer:'Fake answer 1'});
 assert.throws(()=>fishMove(g,red[1],{action:'answer',answer:' fake  answer 1 '}),/duplicate/);
 fishMove(g,red[1],{action:'answer',answer:'Fake answer 2'});
 fishMove(g,blue,{action:'answer',answer:g.answer});
 assert.equal(g.phase,'catch');
 assert.equal(Object.keys(fishView(g,g.guesser).answers).length,3);
});
test('Fish Frenzy: Blue scores one for every answer still unflipped when caught',()=>{
 const g=setupFish(people.slice(0,4));
 let i=0;
 for(const id of g.order.filter(id=>id!==g.guesser))fishMove(g,id,{action:'answer',answer:id===g.blue?g.answer:'Fake '+(++i)});
 const blueLabel=Object.keys(g.options).find(label=>g.options[label]===g.blueKey);
 fishMove(g,g.guesser,{action:'catch',target:blueLabel});
 assert.equal(g.scores[g.guesser],0);
 assert.equal(g.scores[g.blue],2);
});
test('Five in a Row: a single five-in-a-row wins the custom 8×8 variant',()=>{
 const g=setupLines(people.slice(0,2)),id=g.order[0];
 assert.equal(g.board.length,64);
 for(let pos=8;pos<=11;pos++)g.chips[pos]=id;
 g.hands[id][0]={type:'wild',id:'test-wild'};
 lineMove(g,id,{cardIndex:0,cell:12});
 assert.equal(g.phase,'results');assert.equal(g.winner,id);
});
test('Organ Mayhem: instant block reverses the previous attack on the same organ',()=>{
 const g=setupOrgans(people.slice(0,2)),actor=g.order[g.turn],target=g.order.find(id=>id!==actor);
 const organ=Object.values(g.bodies[target])[0];
 g.hands[actor][0]={id:'test-attacker',kind:'wild_attack'};
 g.hands[target][0]={id:'test-blocker',kind:'instant_block'};
 const initial={...organ};
 organMove(g,actor,{cardIndex:0,target,part:organ.id});
 assert.equal(g.bodies[target][organ.id].strain,1);
 organMove(g,target,{instant:true,cardIndex:0});
 assert.deepEqual(g.bodies[target][organ.id],initial);
});
test('Moonlit Wolves: tied-high vote eliminates all leaders, but one vote each eliminates nobody',()=>{
 const p=people.slice(0,4),g=startGame(p);
 g.phase='vote';
 castVote(g,p[0].id,p[2].id);
 castVote(g,p[1].id,p[2].id);
 castVote(g,p[2].id,p[3].id);
 castVote(g,p[3].id,p[0].id);
 assert.deepEqual(g.result.eliminated,[p[2].id]);
});

test('Fish Frenzy: round summary matches changes to every player score',()=>{
 const g=setupFish(people.slice(0,4));
 let i=0;
 for(const id of g.order.filter(id=>id!==g.guesser))fishMove(g,id,{action:'answer',answer:id===g.blue?g.answer:'Wrong '+(++i)});
 const before={...g.scores};
 const fakeLabel=Object.keys(g.options).find(label=>g.options[label]!==g.blueKey);
 fishMove(g,g.guesser,{action:'catch',target:fakeLabel});
 fishMove(g,g.guesser,{action:'bank'});
 for(const id of g.order)assert.equal(g.last.pointChanges[id],g.scores[id]-before[id]);
 const view=fishView(g,g.guesser);
 assert.deepEqual(view.last.pointChanges,g.last.pointChanges);
});
