import test from 'node:test';
import assert from 'node:assert/strict';
import {server} from '../server.js';

test('Fish Frenzy host can force start with 2, guests cannot, and other games are unchanged',async t=>{
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 t.after(()=>new Promise(resolve=>server.close(resolve)));
 const base='http://127.0.0.1:'+server.address().port;
 async function api(path,token,body){
  const r=await fetch(base+'/api'+path,{method:body?'POST':'GET',headers:{'Content-Type':'application/json',...(token?{Authorization:'Bearer '+token}:{})},...(body?{body:JSON.stringify(body)}:{})});
  return{status:r.status,body:await r.json()};
 }
 const created=await api('/rooms',null,{name:'Owner',gameType:'fish'});
 const host=created.body,code=host.code;
 const guest=(await api('/join',null,{code,name:'Friend'})).body;
 assert.equal((await api('/rooms/'+code+'/start',host.token,{})).status,400);
 assert.equal((await api('/rooms/'+code+'/start',guest.token,{force:true})).status,400);
 assert.equal((await api('/rooms/'+code+'/start',host.token,{force:true})).status,200);
 const view=await api('/rooms/'+code+'/state',host.token);
 assert.equal(view.status,200);
 assert.equal(view.body.table.kind,'fish');
 assert.equal(view.body.table.phase,'answer');
 const wolf=(await api('/rooms',null,{name:'WolfHost',gameType:'werewolf'})).body;
 const wolfGuest=(await api('/join',null,{code:wolf.code,name:'WolfGuest'})).body;
 assert.equal((await api('/rooms/'+wolf.code+'/start',wolf.token,{force:true})).status,400);
 assert.equal((await api('/rooms/'+wolf.code+'/start',wolf.token,{})).status,400);
});
