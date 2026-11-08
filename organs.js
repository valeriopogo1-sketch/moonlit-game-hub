import { randomInt } from 'node:crypto';

// An original, rules-inspired card game. The board has 20 UNIQUE organs in a shared deck.
export const PARTS=[
  ['heart','❤️','Heart'],['lungs','🫁','Lungs'],['brain','🧠','Brain'],
  ['stomach','🍲','Stomach'],['liver','🟤','Liver'],['kidneys','🫘','Kidneys'],
  ['pancreas','🟡','Pancreas'],['spleen','🟣','Spleen'],['gallbladder','🟢','Gallbladder'],
  ['appendix','🦠','Appendix'],['bladder','💧','Bladder'],['thyroid','🦋','Thyroid'],
  ['tonsils','🗣️','Tonsils'],['eyes','👀','Eyes'],['teeth','🦷','Teeth'],
  ['tongue','👅','Tongue'],['bowels','🌀','Bowels'],['trachea','🌬️','Trachea'],
  ['skin','✋','Skin'],['wild','🌈','Wild Organ']
].map(([id,icon,name])=>({id,icon,name}));
const regular=PARTS.filter(p=>p.id!=='wild');
const INSTANT=new Set(['instant_guard','instant_block']);
export const CARD_KINDS={
  attack:'Affliction',wild_attack:'Wild affliction',necrosis:'Severe affliction',
  cure:'Cure an affliction',shield:'Prevent the next affliction',
  instant_guard:'Instant: shield one of your organs',
  instant_block:'Instant: cancel the latest attack against you'
};
function shuffle(a,pick=randomInt){for(let i=a.length-1;i>0;i--){const j=pick(i+1);[a[i],a[j]]=[a[j],a[i]];}return a;}
function freshOrgan(id){return {id,hp:id==='wild'?4:2,shield:0,strain:0};}
function deckCards(pick){let i=0;const cards=[];const add=(kind,part,count)=>{for(let n=0;n<count;n++)cards.push({id:'card-'+i++,kind,...(part?{part}:{})});};
 for(const part of regular)add('attack',part.id,3);
 add('wild_attack',null,14);add('necrosis',null,6);add('cure',null,11);add('shield',null,8);
 add('instant_guard',null,10);add('instant_block',null,10);
 return shuffle(cards,pick);
}
export function setupOrgans(players,pick=randomInt){
 if(players.length<2||players.length>6)throw Error('Organ Mayhem supports 2–6 players');
 if(new Set(players.map(p=>p.id)).size!==players.length)throw Error('Duplicate player');
 const hands={},bodies={},order=players.map(p=>p.id);
 for(const p of players){hands[p.id]=[];bodies[p.id]={};}
 const organs=shuffle(PARTS.map(p=>p.id),pick);
 for(let i=0;i<organs.length;i++)bodies[order[i%order.length]][organs[i]]=freshOrgan(organs[i]);
 const deck=deckCards(pick);
 for(let i=0;i<5;i++)for(const p of order)hands[p].push(deck.shift());
 const first=order.findIndex(p=>Object.hasOwn(bodies[p],'wild'));
 return {kind:'organs',phase:'playing',hands,bodies,deck,discard:[],turn:first,order,winner:null,last:null,lastAttack:null,round:1};
}
export function alive(g,id){return !!g.bodies[id]&&Object.values(g.bodies[id]).some(o=>o.hp>0);}
function draw(g,id,n=1){for(let k=0;k<n;k++){if(!g.deck.length&&g.discard.length)g.deck=shuffle(g.discard.splice(0));if(!g.deck.length)break;g.hands[id].push(g.deck.shift());}}
function use(g,id,index){const [card]=g.hands[id].splice(index,1);g.discard.push(card);draw(g,id);return card;}
function targetOrgan(g,target,part){if(!g.bodies[target])throw Error('Invalid target');const o=g.bodies[target][part];if(!o||o.hp===0)throw Error('Choose a living organ');return o;}
function hits(o,amount){if(o.shield){o.shield--;return;}o.strain+=amount;if(o.strain>=o.hp){o.hp=0;o.strain=0;}}
function resolveEnd(g){const survivors=g.order.filter(id=>alive(g,id));if(survivors.length<=1){g.phase='results';g.winner=survivors[0]||null;return true;}return false;}
function advance(g){let n=0;do{g.turn=(g.turn+1)%g.order.length;n++;}while(!alive(g,g.order[g.turn])&&n<=g.order.length);g.round++;}
export function canAct(g,id){
 if(g.phase!=='playing'||!alive(g,id))return false;
 if(g.order[g.turn]!==id)return false;
 return g.hands[id].some(c=>{
   if(INSTANT.has(c.kind))return false;
   if(c.kind==='cure')return Object.values(g.bodies[id]).some(o=>o.hp>0&&o.strain>0);
   if(c.kind==='shield')return Object.values(g.bodies[id]).some(o=>o.hp>0&&o.shield===0);
   if(c.kind==='attack')return g.order.some(other=>other!==id&&alive(g,other)&&((g.bodies[other][c.part]?.hp||0)>0||(g.bodies[other].wild?.hp||0)>0));
   return g.order.some(other=>other!==id&&alive(g,other));
 });
}
export function organMove(g,id,action={}){
 const {cardIndex,target,part,discard=false,discardIndices,instant=false}=action;
 if(g.phase!=='playing'||!alive(g,id))throw Error('Match finished or player eliminated');
 if(instant){
   if(!Number.isInteger(cardIndex)||cardIndex<0||cardIndex>=g.hands[id].length)throw Error('Select an instant card');
   const card=g.hands[id][cardIndex];
   if(!INSTANT.has(card.kind))throw Error('This is not an instant card');
   if(card.kind==='instant_guard'){
     if(target!==id)throw Error('Guard your own organ');const o=targetOrgan(g,id,part);if(o.shield)throw Error('Already protected');
     o.shield=1;use(g,id,cardIndex);g.last={player:id,kind:card.kind,target,part};return;
   }
   if(card.kind==='instant_block'){
     const attack=g.lastAttack;
     if(!attack||attack.target!==id||attack.blocked)throw Error('No recent attack against you to block');
     // Restore only the organ the last attack changed. A reaction remains valid
     // until the next normal turn action replaces the attack window.
     g.bodies[id][attack.part]={...attack.before};
     attack.blocked=true;use(g,id,cardIndex);
     g.last={player:id,kind:card.kind,target:id,part:attack.part};
     return;
   }
 }
 if(g.order[g.turn]!==id)throw Error('Not your turn');
 if(discard||Array.isArray(discardIndices)){
   if(canAct(g,id))throw Error('Discard is only available when no normal card can be played');
   const indices=Array.isArray(discardIndices)?discardIndices:[cardIndex];
   if(indices.length<1||indices.length>2||new Set(indices).size!==indices.length||indices.some(i=>!Number.isInteger(i)||i<0||i>=g.hands[id].length))throw Error('Select one or two valid cards');
   const removed=indices.sort((a,b)=>b-a).map(i=>g.hands[id].splice(i,1)[0]);
   g.discard.push(...removed);draw(g,id,removed.length);
   g.lastAttack=null;g.last={player:id,kind:'discard',count:removed.length};advance(g);return;
 }
 if(!Number.isInteger(cardIndex)||cardIndex<0||cardIndex>=g.hands[id].length)throw Error('Select a card');
 const card=g.hands[id][cardIndex];
 if(INSTANT.has(card.kind))throw Error('Use Instant Play for that card');
 const o=targetOrgan(g,target,part);
 if(['attack','wild_attack','necrosis'].includes(card.kind)){
   if(target===id||!alive(g,target))throw Error('Choose a living opponent');
   if(card.kind==='attack'&&card.part!==part&&part!=='wild')throw Error('That affliction does not match this organ');
   g.lastAttack={player:id,target,part,before:{...o},blocked:false};
   hits(o,card.kind==='necrosis'?2:1);
 }else{
   if(target!==id)throw Error('This card protects your organs');
   if(card.kind==='cure'){if(!o.strain)throw Error('No affliction to cure');o.strain=Math.max(0,o.strain-2);}
   else if(card.kind==='shield'){if(o.shield)throw Error('Already protected');o.shield=1;}
   else throw Error('Unknown card');
   g.lastAttack=null;
 }
 use(g,id,cardIndex);g.last={player:id,kind:card.kind,target,part};
 // Delay final victory if the last hit can be countered by an instant-block card.
 // Finalize at the next normal move if there are still survivors.
 if(!resolveEnd(g))advance(g);
}
export function organView(g,id){return {
 kind:g.kind,phase:g.phase,parts:PARTS,bodies:g.bodies,hand:g.hands[id],
 handSizes:Object.fromEntries(g.order.map(p=>[p,g.hands[p].length])),
 turnPlayer:g.order[g.turn],winner:g.winner,last:g.last,
 canDiscard:g.order[g.turn]===id&&!canAct(g,id),lastAttack:g.lastAttack?.target===id&&!g.lastAttack.blocked?{part:g.lastAttack.part,from:g.lastAttack.player}:null,
 round:g.round,deckRemaining:g.deck.length
};}
