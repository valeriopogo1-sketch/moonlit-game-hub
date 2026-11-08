import {randomInt} from 'node:crypto';
export const COUP_ROLES=['Duke','Assassin','Captain','Ambassador','Contessa'];
export const COUP_ACTIONS={income:null,aid:null,coup:null,tax:'Duke',assassinate:'Assassin',steal:'Captain',exchange:'Ambassador'};
const shuffle=(arr)=>{const a=[...arr];for(let i=a.length-1;i>0;i--){let j=randomInt(i+1);[a[i],a[j]]=[a[j],a[i]];}return a;};
const live=(g,id)=>g.influence[id]?.some(x=>x!==null);
const next=(g)=>{const remaining=g.order.filter(x=>live(g,x));if(remaining.length===1){g.phase='results';g.winner=remaining[0];return;}let i=0;do{g.turn=(g.turn+1)%g.order.length;i++;}while(!live(g,g.order[g.turn])&&i<=g.order.length);g.phase='playing';g.pending=null;};
export function setupCoup(players){if(players.length<2||players.length>6)throw Error('Coup supports 2–6 players');
 const deck=shuffle(COUP_ROLES.flatMap(role=>Array(3).fill(role)));const influence={},coins={},lost={};
 for(const p of players){influence[p.id]=[deck.pop(),deck.pop()];coins[p.id]=2;lost[p.id]=[null,null];}
 if(players.length===2)coins[players[0].id]=1;
 return {kind:'coup',phase:'playing',deck,influence,coins,lost,order:players.map(p=>p.id),turn:0,pending:null,history:[],winner:null};
}
function checkPlayer(g,id){if(!live(g,id))throw Error('Player eliminated');}
function effect(g){const p=g.pending,who=p.actor,target=p.target;if(p.action==='income')g.coins[who]++;
 if(p.action==='aid')g.coins[who]+=2;
 if(p.action==='tax')g.coins[who]+=3;
 if(p.action==='steal'){const n=Math.min(2,g.coins[target]);g.coins[target]-=n;g.coins[who]+=n;}
 if(p.action==='exchange'){const combined=[...g.influence[who].filter(Boolean),g.deck.pop(),g.deck.pop()].filter(Boolean);g.phase='exchange';p.choices=combined;return;}
 if(p.action==='coup'||p.action==='assassinate'){if(!live(g,target)){next(g);return;}g.phase='lose';p.loser=target;return;}
 g.history.push({action:p.action,actor:who,target});next(g);
}
function loss(g,id,index){const slots=g.influence[id];if(!Number.isInteger(index)||slots[index]===undefined||slots[index]===null)throw Error('Select a hidden card to lose');const role=slots[index];slots[index]=null;g.lost[id][index]=role;g.history.push({action:'lost',actor:id,role});return role;}
function claimResult(g,claimant,challenger,cardIndex,block){
 const p=g.pending,role=block?p.blockRole:COUP_ACTIONS[p.action];const cards=g.influence[claimant];
 if(!Number.isInteger(cardIndex)||cards[cardIndex]===null||cards[cardIndex]===undefined)throw Error('Reveal one hidden influence');
 if(cards[cardIndex]===role){const old=cards[cardIndex];g.deck.push(old);g.deck=shuffle(g.deck);cards[cardIndex]=g.deck.pop();p.challengeSuccess=false;p.challengeLoser=challenger;p.afterChallenge=block?'blocked':'action';}
 else{p.challengeSuccess=true;p.challengeLoser=claimant;p.afterChallenge=block?'action':'cancel';}
 g.phase='challenge-loss';p.revealedRole=role;p.challengeCard=cardIndex;
}
function completeChallenge(g){const p=g.pending;if(p.afterChallenge==='cancel'){next(g);return;}if(p.afterChallenge==='blocked'){next(g);return;}if(p.afterChallenge==='action'){if(p.challengingBlock){p.blockRole=null;effect(g);}else if(['aid','assassinate','steal'].includes(p.action)){g.phase='block';}else effect(g);}}
export function coupMove(g,id,a={}){
 if(g.phase==='results')throw Error('Match finished');checkPlayer(g,id);
 const p=g.pending;
 if(g.phase==='playing'){
  if(g.order[g.turn]!==id)throw Error('Not your turn');const action=a.action;
  if(!(action in COUP_ACTIONS))throw Error('Invalid action');
  if(g.coins[id]>=10&&action!=='coup')throw Error('10 or more coins: must Coup');
  if(action==='coup'&&g.coins[id]<7)throw Error('Need 7 coins');
  if(action==='assassinate'&&g.coins[id]<3)throw Error('Need 3 coins');
  const target=['coup','assassinate','steal'].includes(action)?a.target:null;
  if(target){if(target===id||!live(g,target))throw Error('Choose a living opponent');}
  else if(['coup','assassinate','steal'].includes(action))throw Error('Choose a target');
  if(action==='coup')g.coins[id]-=7;if(action==='assassinate')g.coins[id]-=3;
  g.pending={actor:id,target,action,passes:[],blockRole:null};
  if(action==='income'||action==='coup'){effect(g);return;}
  g.phase=action==='aid'?'block':'challenge';return;
 }
 if(g.phase==='challenge'){
  if(id===p.actor)throw Error('Other players may challenge or pass');
  if(a.action==='pass'){if(!p.passes.includes(id))p.passes.push(id);if(g.order.filter(x=>live(g,x)&&x!==p.actor).every(x=>p.passes.includes(x))){p.passes=[];g.phase=['aid','assassinate','steal'].includes(p.action)?'block':'resolving';if(g.phase==='resolving')effect(g);}return;}
  if(a.action==='challenge'){if(p.passes.includes(id))throw Error('Already passed');g.phase='reveal';p.challenger=id;return;}
  throw Error('Challenge or pass');
 }
 if(g.phase==='block'){
  if(a.action==='block'){
   if(p.action==='aid'){if(id===p.actor)throw Error('Cannot block your own aid');if(a.role!=='Duke')throw Error('Only Duke blocks Foreign Aid');}
   else{if(id!==p.target)throw Error('Only target may block');if(!((p.action==='steal'&&['Ambassador','Captain'].includes(a.role))||(p.action==='assassinate'&&a.role==='Contessa')))throw Error('Invalid blocking role');}
   p.blocker=id;p.blockRole=a.role;p.blockPasses=[];g.phase='block-challenge';return;
  }
  if(a.action==='pass'){
   if(id===p.actor)throw Error('Acting player cannot respond');if(!p.passes.includes(id))p.passes.push(id);
   const eligible=p.action==='aid'?g.order.filter(x=>live(g,x)&&x!==p.actor):[p.target];
   if(eligible.every(x=>p.passes.includes(x)))effect(g);return;
  }
  throw Error('Block or pass');
 }
 if(g.phase==='block-challenge'){
  if(id===p.blocker)throw Error('Blocker cannot challenge self');
  if(a.action==='pass'){
   p.blockPasses??=[];if(!p.blockPasses.includes(id))p.blockPasses.push(id);
   if(g.order.filter(x=>live(g,x)&&x!==p.blocker).every(x=>p.blockPasses.includes(x)))next(g);return;
  }
  if(a.action==='challenge'){if(p.blockPasses.includes(id))throw Error('Already passed');p.challenger=id;p.challengingBlock=true;g.phase='reveal';return;}
  throw Error('Challenge or pass');
 }
 if(g.phase==='reveal'){
  const claimant=p.challengingBlock?p.blocker:p.actor;
  if(id!==claimant)throw Error('Claimant must reveal');claimResult(g,claimant,p.challenger,a.index,!!p.challengingBlock);return;
 }
 if(g.phase==='challenge-loss'){
  if(id!==p.challengeLoser)throw Error('Loser must discard influence');loss(g,id,a.index);completeChallenge(g);return;
 }
 if(g.phase==='lose'){
  if(id!==p.loser)throw Error('Target must lose influence');loss(g,id,a.index);next(g);return;
 }
 if(g.phase==='exchange'){
  if(id!==p.actor)throw Error('Only actor chooses exchange');
  const count=g.influence[id].filter(Boolean).length,indices=a.indices;
  if(!Array.isArray(indices)||indices.length!==count||new Set(indices).size!==count||indices.some(i=>!Number.isInteger(i)||i<0||i>=p.choices.length))throw Error('Select '+count+' cards to keep');
  const chosen=indices.map(i=>p.choices[i]);const unused=p.choices.filter((_,i)=>!indices.includes(i));
  g.influence[id]=g.influence[id].map(slot=>slot===null?null:chosen.shift());
  g.deck=shuffle([...g.deck,...unused]);next(g);return;
 }
 throw Error('Invalid phase');
}
export function coupView(g,id){const pending=g.pending?{...g.pending}:null;
 if(pending){delete pending.choices;delete pending.challengeCard;if(g.phase==='exchange'&&pending.actor===id)pending.options=g.pending.choices;}
 return {kind:'coup',phase:g.phase,players:g.order.map(pid=>({id:pid,coins:g.coins[pid],cards:g.influence[pid].map(c=>c===null?null:'hidden'),revealed:g.lost[pid],alive:live(g,pid)})),hand:g.influence[id],turnPlayer:g.order[g.turn],pending,winner:g.winner,history:g.history.slice(-10)};
}
