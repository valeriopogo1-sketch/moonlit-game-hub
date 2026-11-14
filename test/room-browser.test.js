import test from 'node:test';
import assert from 'node:assert/strict';
import { server } from '../server.js';

async function runScenario(t){
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 t.after(()=>new Promise(resolve=>server.close(resolve)));
 const base='http://127.0.0.1:'+server.address().port;
 async function request(path,{method='GET',token,body}={}){
  const response=await fetch(base+'/api'+path,{method,headers:{...(token?{Authorization:'Bearer '+token}:{}),'Content-Type':'application/json'},...(body?{body:JSON.stringify(body)}:{})});
  const data=await response.json();return {status:response.status,...data};
 }
 const host=await request('/rooms',{method:'POST',body:{name:'HostOne',gameType:'organs'}});
 assert.equal(host.status,201);
 const list=await request('/rooms/public');
 assert.equal(list.rooms.find(room=>room.code===host.code)?.status,'waiting');
 assert.equal(list.rooms.find(room=>room.code===host.code)?.players,1);
 assert.equal(list.rooms.find(room=>room.code===host.code)?.maxPlayers,6);
 assert.ok(!JSON.stringify(list).includes(host.token),'Directory must not reveal session tokens');
 const guest=await request('/join',{method:'POST',body:{code:host.code,name:'GuestTwo'}});
 assert.equal(guest.status,200);
 const forbidden=await request('/rooms/'+host.code+'/visibility',{method:'POST',token:guest.token,body:{isPublic:false}});
 assert.equal(forbidden.status,403);
 const forbiddenKick=await request('/rooms/'+host.code+'/kick',{method:'POST',token:guest.token,body:{playerId:host.playerId}});
 assert.equal(forbiddenKick.status,403);
 const privateResult=await request('/rooms/'+host.code+'/visibility',{method:'POST',token:host.token,body:{isPublic:false}});
 assert.equal(privateResult.status,200);
 assert.equal((await request('/rooms/public')).rooms.some(r=>r.code===host.code),false);
 assert.equal((await request('/rooms/'+host.code+'/state',{token:guest.token})).status,200);
 await request('/rooms/'+host.code+'/visibility',{method:'POST',token:host.token,body:{isPublic:true}});
 const kicked=await request('/rooms/'+host.code+'/kick',{method:'POST',token:host.token,body:{playerId:guest.playerId}});
 assert.equal(kicked.status,200);
 assert.equal((await request('/rooms/'+host.code+'/state',{token:guest.token})).status,401);
 assert.equal((await request('/rooms/'+host.code+'/state',{token:host.token})).players.length,1);
 assert.equal((await request('/rooms/'+host.code+'/kick',{method:'POST',token:host.token,body:{playerId:host.playerId}})).status,400);
 const again=await request('/join',{method:'POST',body:{code:host.code,name:'GuestThree'}});
 assert.equal(again.status,200);
 assert.equal((await request('/rooms/'+host.code+'/start',{method:'POST',token:host.token})).status,200);
 assert.equal((await request('/rooms/'+host.code+'/start',{method:'POST',token:host.token})).status,400,'Host must not overwrite an ongoing match');
 assert.equal((await request('/rooms/'+host.code+'/kick',{method:'POST',token:host.token,body:{playerId:again.playerId}})).status,400);
 const playing=(await request('/rooms/public')).rooms.find(r=>r.code===host.code);
 assert.equal(playing.status,'playing');
 assert.equal((await request('/join',{method:'POST',body:{code:host.code,name:'Third'}})).status,400);
}
test('public lobby listing, privacy, owner kicks and revoked sessions',runScenario);
