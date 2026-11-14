import { randomInt } from 'node:crypto';
export const MIN_PLAYERS = 3, MAX_PLAYERS = 10;
export const ROLE_INFO = {
  wolf: { name:'Shadow Wolf', team:'wolf', icon:'🐺', desc:'Find your packmate. If alone, inspect one middle card.' },
  oracle: { name:'Oracle', team:'village', icon:'🔮', desc:'Inspect another player’s card OR two middle cards.' },
  thief: { name:'Thief', team:'village', icon:'🗝️', desc:'Exchange your card with another player, then see your new role.' },
  trickster: { name:'Trickster', team:'village', icon:'🎭', desc:'Swap the cards of two other players without seeing either.' },
  wanderer: { name:'Wanderer', team:'village', icon:'🍷', desc:'Exchange your card with one middle card without seeing it.' },
  watcher: { name:'Watcher', team:'village', icon:'👁️', desc:'Check your current card after all other night actions.' },
  outcast: { name:'Outcast', team:'outcast', icon:'🃏', desc:'You win if you are eliminated during the vote.' },
  villager: { name:'Villager', team:'village', icon:'🏡', desc:'No night action; discuss carefully and discover the wolves.' }
};
export const NIGHT_ORDER = ['wolf','oracle','thief','trickster','wanderer','watcher'];
export function shuffle(input, pick=randomInt) { const a=[...input]; for(let i=a.length-1;i>0;i--){const j=pick(i+1);[a[i],a[j]]=[a[j],a[i]];}return a; }
export function deckFor(n){ if(!Number.isInteger(n)||n<MIN_PLAYERS||n>MAX_PLAYERS)throw Error('3–10 players required'); const pool=['wolf','wolf','oracle','thief','trickster','wanderer','watcher','outcast']; while(pool.length<n+3)pool.push('villager'); return pool.slice(0,n+3); }
export function startGame(players, opts={}) { const ids=players.map(p=>p.id); if(new Set(ids).size!==ids.length)throw Error('Duplicate players'); const deck=shuffle(opts.deck||deckFor(ids.length),opts.randomInt||randomInt); if(deck.length!==ids.length+3)throw Error('Deck must contain player count + 3'); if(deck.some(r=>!ROLE_INFO[r]))throw Error('Invalid role'); const original=Object.fromEntries(ids.map((id,i)=>[id,deck[i]])); const game={initial:original,cards:{...original},center:deck.slice(ids.length),initialCenter:deck.slice(ids.length),order:NIGHT_ORDER.filter(r=>ids.some(id=>original[id]===r)),step:0,done:[],intel:{},votes:{},phase:'night',history:[],result:null}; return game; }
export function activeRole(g){return g.phase==='night'?g.order[g.step]??null:null;}
export function actors(g){const r=activeRole(g);return r?Object.keys(g.initial).filter(id=>g.initial[id]===r):[];}
export function currentPlayerNeedsAction(g,id){return actors(g).includes(id)&&!g.done.includes(id);}
function playerExists(g,id){return Object.hasOwn(g.cards,id);}
function requireTarget(g,id,actor){if(!playerExists(g,id)||id===actor)throw Error('Pick another player');}
function requireCenter(i){if(!Number.isInteger(i)||i<0||i>2)throw Error('Pick a middle card');}
export function perform(g,id,action){ if(g.phase!=='night'||!currentPlayerNeedsAction(g,id))throw Error('Not your turn'); const role=activeRole(g); let intel='Action complete';
 switch(role){
 case 'wolf': {const mates=actors(g).filter(x=>x!==id);if(mates.length){if(action.type!=='ack')throw Error('Confirm your pack');intel='Your fellow wolf: '+mates.map(x=>x).join(', ');} else {if(action.type!=='center')throw Error('Inspect one middle card');requireCenter(action.index);intel='Middle '+(action.index+1)+': '+ROLE_INFO[g.center[action.index]].name;}break;}
 case 'oracle':if(action.type==='player'){requireTarget(g,action.target,id);intel='Player '+action.target+': '+ROLE_INFO[g.cards[action.target]].name;}else if(action.type==='centers'){if(!Array.isArray(action.indices)||action.indices.length!==2||new Set(action.indices).size!==2)throw Error('Choose two different middle cards');action.indices.forEach(requireCenter);intel=action.indices.map(i=>'Middle '+(i+1)+': '+ROLE_INFO[g.center[i]].name).join(' · ');}else throw Error('Choose an inspection');break;
 case 'thief':requireTarget(g,action.target,id);if(action.type!=='player')throw Error('Choose a player');[g.cards[id],g.cards[action.target]]=[g.cards[action.target],g.cards[id]];intel='You now hold '+ROLE_INFO[g.cards[id]].name;break;
 case 'trickster':if(action.type!=='swap'||!Array.isArray(action.targets)||action.targets.length!==2||new Set(action.targets).size!==2)throw Error('Choose two different players');action.targets.forEach(x=>requireTarget(g,x,id));[g.cards[action.targets[0]],g.cards[action.targets[1]]]=[g.cards[action.targets[1]],g.cards[action.targets[0]]];break;
 case 'wanderer':if(action.type!=='center')throw Error('Choose a middle card');requireCenter(action.index);[g.cards[id],g.center[action.index]]=[g.center[action.index],g.cards[id]];intel='You swapped without looking.';break;
 case 'watcher':if(action.type!=='check')throw Error('Check your card');intel='Your current card: '+ROLE_INFO[g.cards[id]].name;break;
 default:throw Error('Unknown night role');
 }
 g.done.push(id);g.intel[id]??=[];g.intel[id].push(intel);g.history.push({role,actor:id,action:action.type});if(actors(g).every(p=>g.done.includes(p))){g.step++;g.done=[];if(g.step>=g.order.length)g.phase='discussion';}return intel;
}
export function closeDiscussion(g){if(g.phase!=='discussion')throw Error('Discussion is not active');g.phase='vote';}
export function castVote(g,id,target){if(g.phase!=='vote')throw Error('Voting is not active');if(!playerExists(g,id))throw Error('Not a player');requireTarget(g,target,id);if(Object.hasOwn(g.votes,id))throw Error('Vote already submitted');g.votes[id]=target;if(Object.keys(g.votes).length===Object.keys(g.cards).length)finish(g);}
export function finish(g){if(g.phase!=='vote')throw Error('Voting is not active');const counts={};for(const target of Object.values(g.votes))counts[target]=(counts[target]||0)+1;const high=Math.max(0,...Object.values(counts));const eliminated=high<=1?[]:Object.keys(counts).filter(p=>counts[p]===high);const wolves=Object.keys(g.cards).filter(id=>g.cards[id]==='wolf');const wolfDead=eliminated.some(id=>g.cards[id]==='wolf');const outcastDead=eliminated.some(id=>g.cards[id]==='outcast');const winners=[];if(wolfDead||(!wolves.length&&!eliminated.length))winners.push('village');if(wolves.length&&!wolfDead&&!outcastDead)winners.push('wolf');if(outcastDead)winners.push('outcast');g.phase='results';g.result={eliminated,winners,counts,cards:{...g.cards},initial:{...g.initial},center:[...g.center],initialCenter:[...g.initialCenter]};return g.result;}
export function publicView(room,id){const {game:g}=room;const members=room.players.map(p=>({id:p.id,name:p.name,connected:p.connected,host:p.id===room.host}));const base={code:room.code,gameType:room.gameType,players:members,you:id,host:room.host,phase:g?.phase||'lobby',settings:room.settings};if(!g)return base;const role=g.initial[id];const actionNeeded=currentPlayerNeedsAction(g,id);const wolfMates=role==='wolf'?Object.keys(g.initial).filter(pid=>g.initial[pid]==='wolf'&&pid!==id):[];return {...base,originalRole:role,roleInfo:ROLE_INFO[role],allRoles:Object.values(g.initialCenter.concat(Object.values(g.initial))).map(r=>r),nightRole:activeRole(g),needsAction:actionNeeded,nightReady:g.order.length?g.step/g.order.length:1,wolfMates,privateIntel:g.intel[id]||[],hasVoted:!!g.votes[id],votesReceived:Object.keys(g.votes).length,results:g.phase==='results'?g.result:null};}
