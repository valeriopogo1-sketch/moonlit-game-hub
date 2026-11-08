import test from 'node:test';
import assert from 'node:assert/strict';
import {renderAdditional} from '../public/new-games.js';
import {setupFish,fishView} from '../fish.js';

const players=[{id:'A',name:'Alice'},{id:'B',name:'Bob'}];

test('Fish Frenzy preserves live editable inputs during polling',()=>{
 const g=setupFish(players,{force:true,difficulty:'medium'});
 const id=g.order.find(p=>p!==g.guesser);
 const v={code:'ABC123',gameType:'fish',phase:'answer',players,you:id,host:'A',table:fishView(g,id)};
 let html='',key='',renders=0;
 const app={
   set innerHTML(value){html=value;renders++;key=(value.match(/data-fish-edit-key="([^"]+)"/)||[])[1]||'';},
   get innerHTML(){return html;},
   querySelector(selector){
     if(selector==='[data-fish-edit-key]'&&key)return {dataset:{fishEditKey:key},querySelector:()=>({})};
     return null;
   },
   querySelectorAll(){return []}
 };
 const ctx={app,state:{},cmd(){},toast(){}};
 renderAdditional(v,ctx);
 const first=html;
 renderAdditional(v,ctx);
 assert.equal(renders,1,'Answer inputs should not be replaced during polling');
 assert.equal(html,first);
 assert.match(html,/fish-answer-field/);
});
test('Fish Frenzy question deck honors all three difficulty levels',()=>{
 for(const difficulty of ['easy','medium','hard']){
   const g=setupFish(players,{force:true,difficulty});
   assert.equal(g.difficulty,difficulty);
   assert.ok(g.question);
 }
});
