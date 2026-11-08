import test from 'node:test';
import assert from 'node:assert/strict';
import {renderAdditional} from '../public/new-games.js';
const view={gameType:'fish',code:'FISH01',you:'a',host:'b',players:[{id:'a',name:'Alice'},{id:'b',name:'Bob'}],table:{
 phase:'answer',guesser:'b',role:'True Blue',question:'Which fruit?',answer:'Pear',
 round:0,maxRounds:4,scores:{a:0,b:0},answers:{},hasAnswered:false,
 multipleAnswers:true,answerFields:[{label:'Correct',suggestion:'Pear'},{label:'Fake',suggestion:'Apple'}]
}};
test('Fish Frenzy does not replace a focused answer input during polling',()=>{
 let html='',writes=0,focused=false;
 const app={
  get innerHTML(){return html},set innerHTML(s){html=s;writes++},
  querySelector(sel){if(sel==='[data-fish-edit-key]'&&writes)return {dataset:{fishEditKey:'0:Which fruit?'}};return null},
  querySelectorAll(){return []}
 };
 const ctx={app,cmd(){},state:{}};
 const previous=globalThis.document;
 try{
  globalThis.document={get activeElement(){return focused?{matches(selector){return selector.includes('.fish-answer-field')}}:null}};
  renderAdditional(view,ctx);assert.equal(writes,1);
  focused=true;
  renderAdditional(view,ctx);assert.equal(writes,1,'input must not be replaced');
 }finally{if(previous===undefined)delete globalThis.document;else globalThis.document=previous;}
});
