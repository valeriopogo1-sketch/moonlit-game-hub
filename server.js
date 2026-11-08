import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import {randomBytes} from 'node:crypto';
import {startGame,perform,castVote,closeDiscussion,publicView as wolfView} from './game.js';
import {setupLines,lineMove,linesView} from './lines.js';
import {setupOrgans,organMove,organView} from './organs.js';
const root=path.join(path.dirname(fileURLToPath(import.meta.url)),'public');
const rooms=new Map();const sessions=new Map();const streams=new Map();
const supported={werewolf:[3,10],lines:[2,4],organs:[2,6]};
function roomStatus(room){if(!room.game)return room.players.length>=supported[room.gameType][1]?'full':'waiting';return room.game.phase==='results'?'finished':'playing';}
function roomSummary(room){return {code:room.code,gameType:room.gameType,hostName:room.players.find(p=>p.id===room.host)?.name||'Host',players:room.players.length,maxPlayers:supported[room.gameType][1],status:roomStatus(room),created:room.created};}
function publicRooms(){return [...rooms.values()].filter(room=>room.settings?.isPublic!==false).map(roomSummary).sort((a,b)=>b.created-a.created).slice(0,100);}
function invalidatePlayer(room,id,reason){const key=room.code+':'+id;for(const res of streams.get(key)||[]){try{res.write('data: '+JSON.stringify({event:reason})+'\n\n');res.end();}catch{}}streams.delete(key);for(const [token,session] of sessions)if(session.code===room.code&&session.id===id)sessions.delete(token);}
function publicView(room,id){if(room.gameType==='werewolf')return wolfView(room,id);const members=room.players.map(p=>({id:p.id,name:p.name,connected:p.connected,host:p.id===room.host}));return {code:room.code,gameType:room.gameType,players:members,you:id,host:room.host,phase:room.game?.phase||'lobby',settings:room.settings,...(room.game?{table:room.gameType==='lines'?linesView(room.game,id):organView(room.game,id)}:{})};}
const MAX_BODY=16000; const uid=()=>randomBytes(18).toString('base64url');const code=()=>randomBytes(4).toString('hex').slice(0,6).toUpperCase();
const send=(res,status,data)=>{res.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'});res.end(JSON.stringify(data));};
const error=(res,status,message)=>send(res,status,{error:message});
const notify=(room)=>{for(const p of room.players){const key=room.code+':'+p.id;for(const res of streams.get(key)||[]){try{res.write('data: '+JSON.stringify(publicView(room,p.id))+'\n\n');}catch{}}}};
function requireSession(req,room){const token=req.headers.authorization?.replace(/^Bearer\s+/i,'') || (new URL(req.url,'http://localhost').pathname.endsWith('/events')?new URL(req.url,'http://localhost').searchParams.get('token'):null);const s=sessions.get(token);if(!s||s.code!==room.code||!room.players.some(p=>p.id===s.id))throw Object.assign(Error('Session invalid or expired'),{status:401});return s;}
function getRoom(c){const room=rooms.get(String(c||'').toUpperCase());if(!room)throw Object.assign(Error('Room not found'),{status:404});return room;}
async function body(req){let text='';for await(const chunk of req){text+=chunk;if(text.length>MAX_BODY)throw Object.assign(Error('Request too large'),{status:413});}try{return JSON.parse(text||'{}')}catch{throw Object.assign(Error('Invalid JSON'),{status:400})}}
function playerName(s){const name=String(s||'').trim().replace(/[<>]/g,'').slice(0,22);if(name.length<2)throw Error('Nickname must be 2–22 characters');return name;}
function newSession(room,name){const p={id:uid(),name,connected:true};const token=uid();room.players.push(p);sessions.set(token,{code:room.code,id:p.id});return {token,playerId:p.id,code:room.code};}
async function api(req,res,url){const data=req.method==='POST'?await body(req):{};const pathname=url.pathname;
 if(pathname==='/api/rooms/public'&&req.method==='GET'){send(res,200,{rooms:publicRooms()});return;}
 if(pathname==='/api/rooms'&&req.method==='POST'){let c=code();while(rooms.has(c))c=code();const kind=String(data.gameType||'werewolf');if(!supported[kind])throw Error('Unknown game');const room={code:c,gameType:kind,players:[],host:null,game:null,settings:{discussionSeconds:300,isPublic:true},created:Date.now()};const account=newSession(room,playerName(data.name));room.host=account.playerId;rooms.set(c,room);send(res,201,account);return;}
 if(pathname==='/api/join'&&req.method==='POST'){const room=getRoom(data.code);if(room.game)throw Error('Match already underway; join before the game starts');if(room.players.length>=supported[room.gameType][1])throw Error('Room is full');const name=playerName(data.name);if(room.players.some(p=>p.name.toLowerCase()===name.toLowerCase()))throw Error('That nickname is taken');const account=newSession(room,name);notify(room);send(res,200,account);return;}
 if(pathname==='/api/resume'&&req.method==='POST'){const room=getRoom(data.code);const s=requireSession(req,room);room.players.find(p=>p.id===s.id).connected=true;notify(room);send(res,200,{code:room.code,playerId:s.id});return;}
 const match=pathname.match(/^\/api\/rooms\/([A-Z0-9]{6})(?:\/(state|events|start|action|vote|voting|rematch|leave|move|visibility|kick))?$/i);
 if(!match)throw Object.assign(Error('Not found'),{status:404});const room=getRoom(match[1]),s=requireSession(req,room),action=match[2]||'state';
 if(action==='state'&&req.method==='GET'){send(res,200,publicView(room,s.id));return;}
 if(action==='events'&&req.method==='GET'){res.writeHead(200,{'Content-Type':'text/event-stream','Cache-Control':'no-cache, no-transform','Connection':'keep-alive','X-Accel-Buffering':'no'});res.write('data: '+JSON.stringify(publicView(room,s.id))+'\n\n');const key=room.code+':'+s.id;const set=streams.get(key)||new Set();set.add(res);streams.set(key,set);const hb=setInterval(()=>{try{res.write(': keepalive\n\n')}catch{}},20000);req.on('close',()=>{clearInterval(hb);set.delete(res);if(!set.size)streams.delete(key);});return;}
 if(req.method!=='POST')throw Object.assign(Error('Method not allowed'),{status:405});
 if(action==='start'){if(s.id!==room.host)throw Error('Only the host can start');if(room.players.length<supported[room.gameType][0])throw Error('Not enough players');room.game=room.gameType==='werewolf'?startGame(room.players):room.gameType==='lines'?setupLines(room.players):setupOrgans(room.players);}
 else if(action==='action'){if(!room.game||room.gameType!=='werewolf')throw Error('No Werewolf match running');perform(room.game,s.id,data);}
 else if(action==='move'){if(!room.game||room.gameType==='werewolf')throw Error('No turn-based match running');if(room.gameType==='lines')lineMove(room.game,s.id,data);else organMove(room.game,s.id,data);}
 else if(action==='voting'){if(room.gameType!=='werewolf')throw Error('Not a Werewolf match');if(s.id!==room.host)throw Error('Only the host can open voting');if(!room.game)throw Error('No match running');closeDiscussion(room.game);}
 else if(action==='vote'){if(room.gameType!=='werewolf')throw Error('Not a Werewolf match');if(!room.game)throw Error('No match running');castVote(room.game,s.id,data.target);}
 else if(action==='visibility'){if(s.id!==room.host)throw Object.assign(Error('Only the room owner can change visibility'),{status:403});if(room.game)throw Error('Visibility can only change in the waiting lobby');if(typeof data.isPublic!=='boolean')throw Error('Choose public or private');room.settings.isPublic=data.isPublic;}
 else if(action==='kick'){
  if(s.id!==room.host)throw Object.assign(Error('Only the room owner can kick players'),{status:403});
  if(room.game)throw Error('Players can only be kicked before a match starts');
  const target=room.players.find(p=>p.id===data.playerId);
  if(!target)throw Error('Player is not in this room');
  if(target.id===room.host)throw Error('The host cannot kick themselves');
  room.players=room.players.filter(p=>p.id!==target.id);
  invalidatePlayer(room,target.id,'kicked');
 }
 else if(action==='rematch'){if(s.id!==room.host)throw Error('Only the host can request a rematch');if(room.game?.phase!=='results')throw Error('Finish the game first');room.game=null;}
 else if(action==='leave'){if(room.game&&room.game.phase!=='results')throw Error('Cannot leave an active match; close the tab and rejoin later');room.players=room.players.filter(p=>p.id!==s.id);if(room.host===s.id)room.host=room.players[0]?.id||null;if(!room.players.length)rooms.delete(room.code);invalidatePlayer(room,s.id,'left');}
 else throw Object.assign(Error('Unknown action'),{status:404});notify(room);send(res,200,{ok:true});
}
const mime={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.json':'application/json; charset=utf-8','.svg':'image/svg+xml','.png':'image/png'};
export const server=http.createServer(async(req,res)=>{try{const url=new URL(req.url,'http://localhost');if(url.pathname.startsWith('/api/')){await api(req,res,url);return;}if(req.method!=='GET'&&req.method!=='HEAD')return error(res,405,'Method not allowed');let pathname=decodeURIComponent(url.pathname);if(pathname==='/'||!path.extname(pathname))pathname='/index.html';const file=path.resolve(root,'.'+pathname);if(!file.startsWith(root+path.sep))return error(res,403,'Forbidden');const data=await readFile(file);res.writeHead(200,{'Content-Type':mime[path.extname(file)]||'application/octet-stream','Cache-Control':['/sw.js','/index.html','/app.js','/extra-games.js','/style.css'].includes(pathname)?'no-cache, must-revalidate':'public, max-age=3600'});res.end(req.method==='HEAD'?undefined:data);}catch(e){if(res.headersSent){res.end();return;}error(res,e.status||(e.message==='ENOENT'?404:400),e.message||'Unexpected error');}});
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){const port=Number(process.env.PORT||3000);server.listen(port,'0.0.0.0',()=>console.log('Moonlit Game Hub listening on http://localhost:'+port));}
