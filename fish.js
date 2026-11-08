import {randomInt} from 'node:crypto';
// Original questions, with red-herring/true-answer scoring inspired by Sounds Fishy.
export const QUESTIONS=[
 ['Which animal is the largest living bird?','Ostrich'],
 ['What fruit is the main ingredient in guacamole?','Avocado'],
 ['What animal is the only mammal capable of sustained powered flight?','Bat'],
 ['Which ocean is the largest on Earth?','Pacific Ocean'],
 ['What is the chemical symbol for gold?','Au'],
 ['What instrument usually has 88 keys?','Piano'],
 ['Which planet is famous for its large visible ring system?','Saturn'],
 ['What sea animal has eight arms?','Octopus'],
 ['Which continent contains the Sahara Desert?','Africa'],
 ['What is the fastest land animal?','Cheetah'],
 ['What is the largest mammal?','Blue whale'],
 ['Which planet is closest to the Sun?','Mercury'],
 ['What is the capital of Japan?','Tokyo'],
 ['How many sides does a hexagon have?','Six'],
 ['What gas do humans inhale to support cellular respiration?','Oxygen'],
 ['What is the main ingredient in traditional hummus?','Chickpeas']
];
function shuffle(a){const b=[...a];for(let i=b.length-1;i>0;i--){const j=randomInt(i+1);[b[i],b[j]]=[b[j],b[i]];}return b;}
const DECOYS=[
 'Emu','Mango','Flying squirrel','Atlantic Ocean','Ag','Organ','Otter','Starfish',
 'Asia','Gazelle','African elephant','Venus','Kyoto','Seven','Nitrogen','Lentils'
];
const isBot=id=>String(id).startsWith('__moonlit_decoy_');
function prepareOptions(g){
 const ids=shuffle(Object.keys(g.answers));
 g.options=Object.fromEntries(ids.map((id,i)=>[String.fromCharCode(65+i),id]));
}
function nextQuestion(g){const [question,answer]=g.questions[g.round%g.questions.length];
 g.question=question;g.answer=answer;g.guesser=g.order[g.round%g.order.length];
 const others=g.order.filter(id=>id!==g.guesser);
 g.blue=others[randomInt(others.length)];
 g.answers={};g.options={};g.flipped=[];g.phase='answer';g.last=null;g.roundPoints=0;
 if(g.forced&&g.order.length===2)g.answers['__moonlit_decoy_1']=DECOYS[QUESTIONS.findIndex(([q])=>q===question)];
}
export function setupFish(players,{force=false}={}){if(players.length>(10)||(players.length<(force?2:4)))throw Error('Fish Frenzy requires 4–10 players normally or at least 2 with Force Start');
 const order=players.map(p=>p.id);
 if(new Set(order).size!==order.length)throw Error('Duplicate players');
 const g={kind:'fish',forced:!!force,phase:'answer',order,round:0,maxRounds:order.length*(order.length<=5?2:1),scores:Object.fromEntries(order.map(id=>[id,0])),questions:shuffle(QUESTIONS),question:null,answer:null,guesser:null,blue:null,answers:{},flipped:[],winner:[],last:null,roundPoints:0};
 nextQuestion(g);return g;
}
function scoreRound(g){
 const flipped=g.flipped.length,blueFlipped=g.flipped.includes(g.blue);
 if(!blueFlipped)g.scores[g.guesser]+=flipped+(flipped===Object.keys(g.answers).length-1?1:0);
 for(const id of g.order){if(id===g.guesser)continue;
  if(id===g.blue){if(blueFlipped)g.scores[id]+=Object.keys(g.answers).length-flipped;}
  else if(!g.flipped.includes(id))g.scores[id]+=flipped;
 }
 g.phase='round-results';g.last={blue:g.blue,correct:g.answer,flipped:[...g.flipped],guesserPoints:blueFlipped?0:flipped+(flipped===Object.keys(g.answers).length-1?1:0)};
}
export function fishMove(g,id,a={}){
 if(g.phase==='results')throw Error('Game completed');
 if(!g.order.includes(id))throw Error('Player not in game');
 if(g.phase==='answer'){
  if(id===g.guesser||a.action!=='answer'||Object.hasOwn(g.answers,id))throw Error('Not eligible to answer');
  const response=String(a.answer||'').trim().slice(0,160);
  if(!response)throw Error('Type an answer');
  if(id===g.blue&&response.toLowerCase()!==g.answer.toLowerCase())throw Error('Blue fish must submit the true answer');
  g.answers[id]=response;
  if(Object.keys(g.answers).length===(g.order.length-1+(g.forced&&g.order.length===2?1:0))){prepareOptions(g);g.phase='catch';}
  return;
 }
 if(g.phase==='catch'){
  if(id!==g.guesser)throw Error('Only the Guesser can catch or bank');
  if(a.action==='bank'){scoreRound(g);return;}
  if(a.action==='catch'){
   const target=g.options[a.target];
   if(!target||!Object.hasOwn(g.answers,target)||g.flipped.includes(target))throw Error('Choose a remaining answer');
   g.flipped.push(target);
   if(target===g.blue||g.flipped.length===Object.keys(g.answers).length-1)scoreRound(g);
   return;
  }throw Error('Catch or bank');
 }
 if(g.phase==='round-results'){
  if(id!==g.guesser||a.action!=='next')throw Error('Guesser advances to next round');
  g.round++;
  if(g.round>=g.maxRounds){g.phase='results';const max=Math.max(...Object.values(g.scores));g.winner=g.order.filter(id=>g.scores[id]===max);}else nextQuestion(g);
  return;
 }
 throw Error('Invalid phase');
}
export function fishView(g,id){
 const reveal=g.phase==='round-results'||g.phase==='results';
 return {kind:'fish',phase:g.phase,question:g.question,answer:id===g.guesser&&!reveal?null:g.answer,
  role:id===g.guesser?'Guesser':id===g.blue?'True Blue':'Red Herring',guesser:g.guesser,
  answers:g.phase==='answer'?Object.fromEntries(Object.keys(g.answers).filter(k=>!isBot(k)).map(k=>[k,'Submitted'])):Object.fromEntries(Object.entries(g.options).map(([label,key])=>[label,g.answers[key]])),
  flipped:Object.keys(g.options).filter(label=>g.flipped.includes(g.options[label])),scores:{...g.scores},round:g.round,maxRounds:g.maxRounds,
  last:reveal?g.last:null,hasAnswered:Object.hasOwn(g.answers,id),winner:reveal?g.winner:null};
}
