import test from 'node:test';
import assert from 'node:assert/strict';
import {setupCoup,coupView} from '../coup.js';
import {setupSpyfall,spyView,setupChameleon,chameleonView} from '../deduction.js';
import {setupFish,fishView} from '../fish.js';
import {renderAdditional} from '../public/new-games.js';
const players=Array.from({length:4},(_,i)=>({id:'p'+i,name:'Player '+i}));
function ui(kind,game,view) {
 let markup='';
 const app={
  set innerHTML(s){markup=s;},get innerHTML(){return markup;},
  querySelectorAll(){return[];},querySelector(){return null;}
 };
 const data={code:'ABCDEF',gameType:kind,host:'p0',you:'p0',players,table:view(game,'p0')};
 assert.doesNotThrow(()=>renderAdditional(data,{app,state:{pick:{}},cmd(){},toast(){}}));
 assert.ok(markup.includes('ABCDEF'));
 assert.ok(markup.includes('Player 0')||markup.includes('Player0')||markup.includes('Round'));
}
test('Coup mobile game view is rendered without errors',()=>ui('coup',setupCoup(players),coupView));
test('Spyfall mobile game view is rendered without errors',()=>ui('spyfall',setupSpyfall(players),spyView));
test('Chameleon mobile game view is rendered without errors',()=>ui('chameleon',setupChameleon(players),chameleonView));
test('Sounds Fishy-inspired mobile game view is rendered without errors',()=>ui('fish',setupFish(players),fishView));
