import test from 'node:test';
import assert from 'node:assert/strict';
import { setupOrgans, organView } from '../organs.js';
import { renderOrgans } from '../public/extra-games.js';

test('Organ Mayhem mobile view renders unique, uneven organ sets without hp errors',()=>{
 for(let count=2;count<=6;count++){
  const players=Array.from({length:count},(_,i)=>({id:'player'+i,name:'Player '+i}));
  const g=setupOrgans(players);
  let markup='';
  const app={set innerHTML(html){markup=html;},querySelectorAll(){return[];},querySelector(){return null;}};
  const view={gameType:'organs',code:'ABC123',players,you:players[0].id,host:players[0].id,table:organView(g,players[0].id)};
  assert.doesNotThrow(()=>renderOrgans(view,{app,state:{pick:{}},cmd(){},toast(){}}));
  assert.equal((markup.match(/class="body-card"/g)||[]).length,count);
  assert.equal((markup.match(/class="organ-tile/g)||[]).length,20);
 }
});
