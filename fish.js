import {randomInt} from 'node:crypto';
export const SPECIES=['Angel','Grouper','Trigger','Tang'];
function shuffle(a){const b=[...a];for(let i=b.length-1;i>0;i--){const j=randomInt(i+1);[b[i],b[j]]=[b[j],b[i]];}return b;}
export function setupFish(players){if(players.length<3||players.length>6)throw Error('Fish game requires 3–6 players');
 const main=[];let idx=0;
 for(const species of SPECIES){for(const size of ['small','large'])for(let n=0;n<12;n++)main.push({id:idx++,kind:'happy',species,size});for(let n=0;n<7;n++)main.push({id:idx++,kind:'hungry',species});}
 for(let n=0;n<3;n++)main.push({id:idx++,kind:'shark'});
 const water=[...Array.from({length:16},(_,i)=>({id:idx++,kind:'happy',species:SPECIES[i%4],size:i%2?'large':'small'})),...Array.from({length:4},()=>({id:idx++,kind:'net'}))];
 const order=players.map(p=>p.id),strings={},scores={},hungryScore={};for(const p of order){strings[p]=[];scores[p]=0;hungryScore[p]=0;}
 return {kind:'fish',phase:'playing',main:shuffle(main),water:shuffle(water),order,turn:0,strings,scores,hungryScore,pools:{},winner:null,last:null,drawCount:0};
}
const next=g=>{g.turn=(g.turn+1)%g.order.length;};
function addToString(g,id,card){const string=g.strings[id],end=string.at(-1);if(!end||end.species===card.species||end.size===card.size){string.push(card);return true;}return false;}
function takePool(g,id){for(const species of SPECIES){if(g.strings[id].filter(c=>c.species===species).length>=3&&g.pools[species]?.length){g.scores[id]+=g.pools[species].length;g.hungryScore[id]++;delete g.pools[species];next(g);return true;}}return false;}
function winner(g){const scores=Object.entries(g.scores);const best=Math.max(...scores.map(x=>x[1]));const ties=scores.filter(x=>x[1]===best);const high=Math.max(...ties.map(x=>g.hungryScore[x[0]]));const final=ties.filter(x=>g.hungryScore[x[0]]===high);g.phase='results';g.winner=final.map(x=>x[0]);}
export function fishMove(g,id,a={}){if(g.phase!=='playing'||g.order[g.turn]!==id)throw Error('Not your turn');
 if(a.action==='bank'){g.scores[id]+=g.strings[id].length;g.strings[id]=[];g.last={action:'bank',id};next(g);return;}
 if(a.action!=='draw')throw Error('Draw or bank');
 const card=(g.main.length?g.main:g.water).pop();if(!card){winner(g);return;}g.drawCount++;g.last={action:'draw',id,card};
 if(card.kind==='net'){winner(g);return;}
 if(card.kind==='shark'){g.strings[id]=[];next(g);return;}
 if(card.kind==='hungry'){const s=g.strings[id],eaten=[];while(s.length&&s.at(-1).species!==card.species)eaten.push(s.pop());
 if(eaten.length)g.pools[card.species]=[card,...eaten];next(g);return;}
 let added=false;for(let i=0;i<g.order.length;i++){const target=g.order[(g.turn+i)%g.order.length];if(addToString(g,target,card)){added=true;g.last.to=target;break;}}
 if(!added)g.last.to=null;
 if(takePool(g,id))return;
}
export function fishView(g,id){return {kind:'fish',phase:g.phase,strings:g.strings,scores:g.scores,hungryScore:g.hungryScore,turnPlayer:g.order[g.turn],pools:Object.fromEntries(Object.entries(g.pools).map(([k,v])=>[k,v.length])),last:g.last,remaining:g.main.length+g.water.length,winner:g.winner};}
