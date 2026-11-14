import test from 'node:test';import assert from 'node:assert/strict';
import {setupCoup,coupMove,coupView} from '../coup.js';
import {setupSpyfall,spyMove,spyView,expireSpyRound,setupChameleon,chameleonMove,chameleonView} from '../deduction.js';
import {setupFish,fishMove,fishView} from '../fish.js';
const players=Array.from({length:4},(_,i)=>({id:'p'+i,name:'Player '+i}));
test('Coup deals two hidden roles, conserves coins, and makes coups mandatory at ten',()=>{
 const g=setupCoup(players);assert.equal(g.deck.length,7);assert.ok(g.order.every(id=>g.influence[id].length===2&&g.coins[id]===2));
 const who=g.order[g.turn];g.coins[who]=10;
 assert.throws(()=>coupMove(g,who,{action:'income'}),/must Coup/);
 coupMove(g,who,{action:'coup',target:g.order[1]});assert.equal(g.phase,'lose');assert.equal(g.coins[who],3);
 coupMove(g,g.order[1],{index:0});assert.equal(g.influence[g.order[1]].filter(Boolean).length,1);
 assert.equal(coupView(g,g.order[2]).players.find(p=>p.id===g.order[1]).revealed[0]!==null,true);
});
test('Coup honest claim punishes challenger, action succeeds',()=>{
 const g=setupCoup(players.slice(0,3));g.influence.p0[0]='Duke';
 coupMove(g,'p0',{action:'tax'});coupMove(g,'p1',{action:'challenge'});coupMove(g,'p0',{index:0});assert.equal(g.phase,'challenge-loss');
 coupMove(g,'p1',{index:0});assert.equal(g.coins.p0,5);assert.equal(g.influence.p1.filter(Boolean).length,1);
});
test('Coup bluff caught cancels claimed action',()=>{
 const g=setupCoup(players.slice(0,3));g.influence.p0=['Captain','Assassin'];
 coupMove(g,'p0',{action:'tax'});coupMove(g,'p1',{action:'challenge'});coupMove(g,'p0',{index:0});coupMove(g,'p0',{index:1});
 assert.equal(g.coins.p0,2);assert.equal(g.influence.p0.filter(Boolean).length,1);
});
test('Spyfall hides location from spy, permits unanimous accusation excluding suspect',()=>{
 const g=setupSpyfall(players);const spy=g.spy,accuser=g.order.find(id=>id!==spy);
 assert.equal(spyView(g,spy).assignment.location,undefined);
 assert.equal(spyView(g,accuser).assignment.location,g.location);
 spyMove(g,accuser,{action:'accuse',target:spy});
 for(const id of g.order.filter(id=>id!==accuser&&id!==spy))spyMove(g,id,{action:'vote',agree:true});
 assert.equal(g.phase,'round-results');assert.equal(g.winner,'agents');
});
test('Spyfall wrong location guess loses; time expiration favors spy',()=>{
 const g=setupSpyfall(players);spyMove(g,g.spy,{action:'guess',location:'Not a real location'});assert.equal(g.winner,'agents');
 const h=setupSpyfall(players);h.roundEnds=0;assert.equal(expireSpyRound(h,Date.now()),true);assert.equal(h.phase,'final-nomination');
 for(const accuser of h.finalQueue){
  if(h.phase!=='final-nomination')break;
  const suspect=h.order.find(id=>id!==accuser);
  spyMove(h,accuser,{action:'accuse',target:suspect});
  assert.equal(h.phase,'final-vote');
  const voter=h.order.find(id=>id!==accuser&&id!==suspect);
  spyMove(h,voter,{action:'vote',agree:false});
 }
 assert.equal(h.phase,'round-results');assert.equal(h.winner,'spy');
});
test('Chameleon enforces clockwise one-word clues and last word guess',()=>{
 const g=setupChameleon(players);assert.throws(()=>chameleonMove(g,'p1',{action:'clue',clue:'loud'}),/turn/);
 for(const id of g.order)chameleonMove(g,id,{action:'clue',clue:'loud'});
 assert.equal(g.phase,'vote');for(const id of g.order)chameleonMove(g,id,{action:'vote',target:id===g.chameleon?g.order.find(p=>p!==id):g.chameleon});
 assert.equal(g.phase,'guess');chameleonMove(g,g.chameleon,{action:'guess',word:g.secret});assert.equal(g.winner,'chameleon');
});
test('Chameleon hides secret from Chameleon during clues',()=>{
 const g=setupChameleon(players);assert.equal(chameleonView(g,g.chameleon).secret,null);
 assert.equal(chameleonView(g,g.order.find(id=>id!==g.chameleon)).secret,g.secret);
});
test('Fish bluffing: exactly one true blue; red catches bank points',()=>{
 const g=setupFish(players);assert.equal(g.maxRounds,8);assert.ok(g.blue!==g.guesser);
 for(const id of g.order.filter(id=>id!==g.guesser))fishMove(g,id,{action:'answer',answer:id===g.blue?g.answer:'Invented false answer '+id});
 assert.equal(g.phase,'catch');assert.equal(fishView(g,g.guesser).answer,null);
 const red=g.order.find(id=>id!==g.guesser&&id!==g.blue);
 fishMove(g,g.guesser,{action:'catch',target:Object.keys(g.options).find(k=>g.options[k]===red)});fishMove(g,g.guesser,{action:'bank'});
 assert.equal(g.phase,'round-results');assert.equal(g.scores[g.guesser],1);assert.equal(fishView(g,g.guesser).answer,g.answer);
 fishMove(g,g.guesser,{action:'next'});assert.equal(g.round,1);
});
test('Fish bluffing: catching the true blue gives Guesser zero points',()=>{
 const g=setupFish(players);
 for(const id of g.order.filter(id=>id!==g.guesser))fishMove(g,id,{action:'answer',answer:id===g.blue?g.answer:'Wrong answer '+id});
 fishMove(g,g.guesser,{action:'catch',target:Object.keys(g.options).find(k=>g.options[k]===g.blue)});assert.equal(g.scores[g.guesser],0);assert.equal(g.phase,'round-results');
});

test('Spyfall awards extra points for correct unanimous accusation',()=>{
 const g=setupSpyfall(players),spy=g.spy,accuser=g.order.find(id=>id!==spy);
 spyMove(g,accuser,{action:'accuse',target:spy});
 for(const id of g.order.filter(id=>id!==accuser&&id!==spy))spyMove(g,id,{action:'vote',agree:true});
 assert.equal(g.scores[accuser],2);
 for(const id of g.order.filter(id=>id!==accuser&&id!==spy))assert.equal(g.scores[id],1);
 assert.equal(g.scores[spy],0);assert.equal(g.phase,'round-results');
 spyMove(g,g.order[0],{action:'next'});assert.equal(g.round,2);assert.equal(g.phase,'talk');
});
test('Chameleon points carry across rounds, dealer rotates',()=>{
 const g=setupChameleon(players),last=g.chameleon;
 for(const id of g.order)chameleonMove(g,id,{action:'clue',clue:'Hint'});
 for(const id of g.order)chameleonMove(g,id,{action:'vote',target:id===g.chameleon?g.order.find(p=>p!==id):g.chameleon});
 chameleonMove(g,g.chameleon,{action:'guess',word:g.secret});
 assert.equal(g.phase,'round-results');assert.equal(g.points[last],1);
 chameleonMove(g,last,{action:'next'});
 assert.equal(g.phase,'clues');assert.equal(g.dealer,last);assert.equal(g.round,2);assert.equal(g.points[last],1);
});

test('Normal Fish Frenzy still requires four players, forced 2-player Blue creates four editable answers',()=>{
 const two=players.slice(0,2);
 assert.throws(()=>setupFish(two),/requires 4/);
 for(const difficulty of ['easy','medium','hard']){
  const g=setupFish(two,{force:true,difficulty});
  const blue=g.order.find(p=>p!==g.guesser);
  const view=fishView(g,blue);
  assert.equal(view.role,'True Blue');
  assert.equal(view.answerFields.length,4);
  assert.deepEqual(view.answerFields.map(f=>f.correct),[true,false,false,false]);
  assert.equal(view.answerFields[0].suggestion,g.answer);
  const suggestions=view.answerFields.slice(1).map(f=>f.suggestion);
  assert.equal(new Set(suggestions.map(x=>x.toLowerCase())).size,3);
  assert.ok(suggestions.every(s=>s.toLowerCase()!==g.answer.toLowerCase()));
  assert.equal(fishView(g,g.guesser).answerFields,null);
  assert.throws(()=>fishMove(g,blue,{action:'answer',answers:[g.answer,'Only one fake']}),/exactly 4/);
  assert.throws(()=>fishMove(g,blue,{action:'answer',answers:[g.answer,'Duplicate','Duplicate','Another']}),/different/);
  const submitted=[g.answer,'Edited bluff A','Edited bluff B','Edited bluff C'];
  fishMove(g,blue,{action:'answer',answers:submitted});
  assert.equal(g.phase,'catch');
  const guesserView=fishView(g,g.guesser);
  assert.deepEqual(Object.keys(guesserView.answers).sort(),['A','B','C','D']);
  assert.equal(new Set(Object.values(guesserView.answers)).size,4);
  assert.equal(guesserView.answer,null);
  assert.deepEqual(Object.values(guesserView.answers).sort(),submitted.sort());
  const fakes=Object.keys(g.options).filter(label=>g.options[label]!==g.blueKey);
  for(const label of fakes)fishMove(g,g.guesser,{action:'catch',target:label});
  assert.equal(g.phase,'round-results');
  assert.equal(g.scores[g.guesser],4);
 }
});
test('Forced two-player Fish Frenzy rotates using four human-submitted answers',()=>{
 const game=setupFish(players.slice(0,2),{force:true});
 const seen=new Set();
 while(game.phase!=='results'){
  seen.add(game.guesser);
  const blue=game.order.find(id=>id!==game.guesser);
  fishMove(game,blue,{action:'answer',answers:[game.answer,'Editable fake 1','Editable fake 2','Editable fake 3']});
  assert.equal(Object.keys(game.answers).length,4);
  fishMove(game,game.guesser,{action:'bank'});
  fishMove(game,game.guesser,{action:'next'});
 }
 assert.equal(seen.size,2);
 assert.equal(game.round,game.maxRounds);
});
test('Forced three-player Fish Frenzy gives blue 1 correct and 1 suggested, red 2 suggested answers',()=>{
 const game=setupFish(players.slice(0,3),{force:true});
 const blue=game.blue,red=game.order.find(id=>id!==game.guesser&&id!==blue);
 const b=fishView(game,blue),r=fishView(game,red);
 assert.equal(b.answerFields.length,2);
 assert.deepEqual(b.answerFields.map(f=>f.correct),[true,false]);
 assert.equal(r.answerFields.length,2);
 assert.deepEqual(r.answerFields.map(f=>f.correct),[false,false]);
 assert.ok(r.answerFields.every(f=>f.suggestion.length>0));
 assert.throws(()=>fishMove(game,red,{action:'answer',answers:[game.answer,'False']}),/false/);
 fishMove(game,blue,{action:'answer',answers:[game.answer,'Blue fake edited']});
 fishMove(game,red,{action:'answer',answers:['Red edited one','Red edited two']});
 assert.equal(game.phase,'catch');
 assert.equal(Object.keys(fishView(game,game.guesser).answers).length,4);
 const keys=Object.keys(game.options);
 assert.equal(new Set(keys.map(k=>game.options[k])).size,4);
 assert.equal(fishView(game,game.guesser).answer,null);
});

test('Forced three-player suggested answers are unique across players and remain editable',()=>{
 for(const difficulty of ['easy','medium','hard']){
  const game=setupFish(players.slice(0,3),{force:true,difficulty});
  const blue=game.blue,red=game.order.find(id=>id!==blue&&id!==game.guesser);
  const blueView=fishView(game,blue),redView=fishView(game,red);
  const suggestions=[blueView.answerFields[1].suggestion,...redView.answerFields.map(f=>f.suggestion)];
  assert.equal(new Set(suggestions.map(s=>s.toLowerCase())).size,3);
  assert.equal(suggestions.some(s=>s.toLowerCase()===game.answer.toLowerCase()),false);
  fishMove(game,blue,{action:'answer',answers:[game.answer,'Personal blue fake']});
  assert.throws(()=>fishMove(game,red,{action:'answer',answers:['Personal blue fake','Another fake']}),/duplicate other players/);
  fishMove(game,red,{action:'answer',answers:['Personal red fake','Another red fake']});
  assert.equal(game.phase,'catch');
  const view=fishView(game,game.guesser);
  assert.equal(Object.keys(view.answers).length,4);
  assert.equal(new Set(Object.values(view.answers).map(s=>s.toLowerCase())).size,4);
 }
});
test('Forced two-player match always displays four nonduplicate shuffled answers',()=>{
 for(const difficulty of ['easy','medium','hard']){
  const game=setupFish(players.slice(0,2),{force:true,difficulty});
  const blue=game.blue,fields=fishView(game,blue).answerFields;
  assert.equal(fields.length,4);
  fishMove(game,blue,{action:'answer',answers:[game.answer,...fields.slice(1).map(f=>f.suggestion)]});
  const choiceView=fishView(game,game.guesser);
  assert.equal(Object.keys(choiceView.answers).length,4);
  assert.equal(new Set(Object.values(choiceView.answers).map(s=>s.toLowerCase())).size,4);
  assert.equal(Object.values(choiceView.answers).filter(s=>s===game.answer).length,1);
 }
});

test('Fish Frenzy Guesser can skip familiar questions without scoring or advancing round',()=>{
 for(const difficulty of ['easy','medium','hard']){
  const g=setupFish(players.slice(0,2),{force:true,difficulty});
  const first=g.question,answer=g.answer,guesser=g.guesser;
  const originalScores={...g.scores},originalRound=g.round;
  assert.equal(fishView(g,guesser).canSkip,true);
  assert.throws(()=>fishMove(g,g.blue,{action:'skip'}),/Only the Guesser/);
  fishMove(g,guesser,{action:'skip'});
  assert.notEqual(g.question,first);
  assert.equal(g.round,originalRound);
  assert.equal(g.guesser,guesser);
  assert.deepEqual(g.scores,originalScores);
  assert.equal(g.skippedQuestions,1);
  assert.equal(g.phase,'answer');
  assert.equal(g.submitted.length,0);
  assert.equal(Object.keys(g.answers).length,0);
  assert.equal(fishView(g,guesser).answer,null);
  assert.notEqual(g.answer,undefined);
  assert.equal(fishView(g,guesser).canSkip,true);
 }
});
test('Fish Frenzy skip is rejected after answers submitted and after catch phase',()=>{
 const g=setupFish(players.slice(0,3),{force:true});
 const guesser=g.guesser,responders=g.order.filter(id=>id!==guesser);
 const blue=g.blue,red=responders.find(id=>id!==blue);
 const blueFields=fishView(g,blue).answerFields;
 fishMove(g,blue,{action:'answer',answers:[g.answer,blueFields[1].suggestion]});
 assert.equal(fishView(g,guesser).canSkip,false);
 const before=g.question;
 assert.throws(()=>fishMove(g,guesser,{action:'skip'}),/Cannot skip/);
 assert.equal(g.question,before);
 const redFields=fishView(g,red).answerFields;
 fishMove(g,red,{action:'answer',answers:redFields.map(f=>f.suggestion)});
 assert.equal(g.phase,'catch');
 assert.throws(()=>fishMove(g,guesser,{action:'skip'}),/Catch or bank/);
});
test('Fish Frenzy skips every question without immediate repeats and continues playing',()=>{
 const g=setupFish(players.slice(0,2),{force:true,difficulty:'hard'});
 const seen=new Set([g.question]);
 const initial=g.question;
 for(let i=1;i<g.questions.length;i++){
  fishMove(g,g.guesser,{action:'skip'});
  assert.equal(seen.has(g.question),false);
  seen.add(g.question);
 }
 assert.equal(seen.size,g.questions.length);
 fishMove(g,g.guesser,{action:'skip'});
 assert.notEqual(g.question,[...seen].at(-1));
 assert.equal(g.round,0);
 assert.equal(g.skippedQuestions,g.questions.length);
 const blue=g.blue;
 const fields=fishView(g,blue).answerFields;
 fishMove(g,blue,{action:'answer',answers:fields.map(f=>f.suggestion)});
 fishMove(g,g.guesser,{action:'bank'});
 assert.equal(g.phase,'round-results');
});

test('Spyfall final accuser freely chooses a suspect; suspect cannot vote',()=>{
 const g=setupSpyfall(players);
 g.roundEnds=0;expireSpyRound(g);
 assert.equal(g.phase,'final-nomination');
 const accuser=g.finalQueue[0];
 const suspect=g.order.find(id=>id!==accuser&&id===g.spy)||g.order.find(id=>id!==accuser);
 assert.throws(()=>spyMove(g,g.order[1],{action:'accuse',target:accuser}),/Current accuser/);
 assert.throws(()=>spyMove(g,accuser,{action:'accuse',target:accuser}),/Current accuser/);
 spyMove(g,accuser,{action:'accuse',target:suspect});
 assert.equal(g.accusation.by,accuser);
 assert.equal(g.accusation.target,suspect);
 assert.throws(()=>spyMove(g,suspect,{action:'vote',agree:true}),/Not eligible/);
 for(const id of g.order.filter(id=>id!==accuser&&id!==suspect))spyMove(g,id,{action:'vote',agree:true});
 assert.equal(g.phase,'round-results');
 assert.equal(g.winner,suspect===g.spy?'agents':'spy');
});
test('Coup rejects inherited JavaScript property names as illegal actions',()=>{
 const g=setupCoup(players);
 for(const action of ['constructor','toString','__proto__'])
  assert.throws(()=>coupMove(g,g.order[0],{action}),/Invalid action/);
 assert.equal(g.phase,'playing');assert.equal(g.pending,null);
});

test('Coup steal challenge cannot get stuck when its target loses their last influence',()=>{
 const g=setupCoup(players.slice(0,3));
 g.influence.p0[0]='Captain';g.influence.p1[1]=null;g.lost.p1[1]='Duke';
 coupMove(g,'p0',{action:'steal',target:'p1'});
 coupMove(g,'p1',{action:'challenge'});
 coupMove(g,'p0',{index:0});
 assert.equal(g.phase,'challenge-loss');
 coupMove(g,'p1',{index:0});
 assert.equal(g.phase,'playing');
 assert.equal(g.order[g.turn],'p2');
 assert.equal(g.coins.p0,2);
});
test('Coup player who passed cannot block Foreign Aid later',()=>{
 const g=setupCoup(players.slice(0,3));
 coupMove(g,'p0',{action:'aid'});
 coupMove(g,'p1',{action:'pass'});
 assert.throws(()=>coupMove(g,'p1',{action:'block',role:'Duke'}),/Already passed/);
 coupMove(g,'p2',{action:'pass'});
 assert.equal(g.coins.p0,4);
});
test('Chameleon three-player bonus guess cannot repeat a wrong word',()=>{
 const g=setupChameleon(players.slice(0,3));
 for(const id of g.order)chameleonMove(g,id,{action:'clue',clue:'Hint'});
 for(const id of g.order)chameleonMove(g,id,{action:'vote',target:id===g.chameleon?g.order.find(p=>p!==id):g.chameleon});
 assert.equal(g.phase,'guess');
 const wrong=g.words.find(w=>w!==g.secret);
 chameleonMove(g,g.chameleon,{action:'guess',word:wrong});
 assert.equal(g.phase,'guess');
 assert.throws(()=>chameleonMove(g,g.chameleon,{action:'guess',word:wrong}),/already guessed/);
 chameleonMove(g,g.chameleon,{action:'guess',word:g.secret});
 assert.equal(g.winner,'chameleon');
});
