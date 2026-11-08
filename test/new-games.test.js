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
 const h=setupSpyfall(players);h.roundEnds=0;assert.equal(expireSpyRound(h,Date.now()),true);assert.equal(h.phase,'final-vote');
 for(const target of h.finalQueue){if(h.phase!=='final-vote')break;const voter=h.order.find(id=>id!==target);spyMove(h,voter,{action:'vote',agree:false});}
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
 for(const id of g.order.filter(id=>id!==g.guesser))fishMove(g,id,{action:'answer',answer:id===g.blue?g.answer:'Invented false answer'});
 assert.equal(g.phase,'catch');assert.equal(fishView(g,g.guesser).answer,null);
 const red=g.order.find(id=>id!==g.guesser&&id!==g.blue);
 fishMove(g,g.guesser,{action:'catch',target:Object.keys(g.options).find(k=>g.options[k]===red)});fishMove(g,g.guesser,{action:'bank'});
 assert.equal(g.phase,'round-results');assert.equal(g.scores[g.guesser],1);assert.equal(fishView(g,g.guesser).answer,g.answer);
 fishMove(g,g.guesser,{action:'next'});assert.equal(g.round,1);
});
test('Fish bluffing: catching the true blue gives Guesser zero points',()=>{
 const g=setupFish(players);
 for(const id of g.order.filter(id=>id!==g.guesser))fishMove(g,id,{action:'answer',answer:id===g.blue?g.answer:'Wrong answer'});
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

test('Normal Fish Frenzy still requires four players; forced two-player mode has editable suggestions',()=>{
 const two=players.slice(0,2);
 assert.throws(()=>setupFish(two),/requires 4/);
 const game=setupFish(two,{force:true});
 assert.equal(game.phase,'answer');
 const responder=two.find(p=>p.id!==game.guesser).id;
 const view=fishView(game,responder);
 assert.equal(view.role,'True Blue');
 assert.equal(view.answerFields.length,2);
 assert.equal(view.answerFields[0].suggestion,game.answer);
 assert.notEqual(view.answerFields[1].suggestion,game.answer);
 assert.equal(view.answerFields[1].correct,false);
 assert.equal(fishView(game,game.guesser).answerFields,null);
 assert.throws(()=>fishMove(game,responder,{action:'answer',answers:[game.answer,game.answer]}),/different/);
 fishMove(game,responder,{action:'answer',answers:[game.answer,'My editable fake']});
 assert.equal(game.phase,'catch');
 const guesserView=fishView(game,game.guesser);
 assert.equal(Object.keys(guesserView.answers).length,2);
 assert.deepEqual(Object.keys(guesserView.answers).sort(),['A','B']);
 assert.equal(guesserView.answer,null);
 assert.ok(!JSON.stringify(guesserView).includes(responder));
 const fake=Object.keys(game.options).find(label=>game.options[label]!==game.blueKey);
 fishMove(game,game.guesser,{action:'catch',target:fake});
 assert.equal(game.phase,'round-results');
 assert.equal(game.scores[game.guesser],2);
 assert.equal(game.last.guesserPoints,2);
});
test('Forced two-player Fish Frenzy rotates with two answers per player',()=>{
 const game=setupFish(players.slice(0,2),{force:true});
 const seen=new Set();
 while(game.phase!=='results'){
  seen.add(game.guesser);
  const human=game.order.find(id=>id!==game.guesser);
  fishMove(game,human,{action:'answer',answers:[game.answer,'Custom fake answer']});
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
