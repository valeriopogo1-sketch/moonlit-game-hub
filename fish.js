import {randomInt} from 'node:crypto';
// Original question bank. Force Start (2–3 people) uses two editable answers
// per answering player; normal 4–10 player rounds retain one answer per player.
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
const DECOYS=[
 ['Emu','Albatross','Cassowary'],['Mango','Papaya','Cucumber'],
 ['Flying squirrel','Sugar glider','Flying lemur'],['Atlantic Ocean','Indian Ocean','Arctic Ocean'],
 ['Ag','Go','Gd'],['Organ','Harpsichord','Accordion'],['Jupiter','Uranus','Neptune'],
 ['Starfish','Squid','Jellyfish'],['Asia','Australia','South America'],
 ['Gazelle','Antelope','Greyhound'],['African elephant','Hippopotamus','Giraffe'],
 ['Venus','Mars','Earth'],['Kyoto','Osaka','Seoul'],['Seven','Eight','Five'],
 ['Nitrogen','Hydrogen','Carbon dioxide'],['Lentils','Peanuts','Soybeans']
];
function shuffle(a){const b=[...a];for(let i=b.length-1;i>0;i--){const j=randomInt(i+1);[b[i],b[j]]=[b[j],b[i]];}return b;}
const isMulti=g=>g.forced&&g.order.length<4;
const normalize=s=>String(s??'').trim().replace(/\s+/g,' ');
const same=(a,b)=>normalize(a).toLocaleLowerCase()===normalize(b).toLocaleLowerCase();
function answerKey(g,id,index){return isMulti(g)?id+':'+index:id;}
function prepareOptions(g){
 const ids=shuffle(Object.keys(g.answers));
 g.options=Object.fromEntries(ids.map((id,i)=>[String.fromCharCode(65+i),id]));
}
function suggested(g,id){
 const idx=QUESTIONS.findIndex(([q])=>q===g.question);
 const pool=DECOYS[idx]||['Unknown','Mystery','Surprise'];
 const offset=Math.max(0,g.order.indexOf(id))%pool.length;
 return [pool[offset],pool[(offset+1)%pool.length]];
}
function nextQuestion(g){
 const [question,answer]=g.questions[g.round%g.questions.length];
 g.question=question;g.answer=answer;g.guesser=g.order[g.round%g.order.length];
 const others=g.order.filter(id=>id!==g.guesser);
 g.blue=others[randomInt(others.length)];
 g.blueKey=answerKey(g,g.blue,0);
 g.answers={};g.options={};g.flipped=[];g.submitted=[];g.phase='answer';g.last=null;
}
export function setupFish(players,{force=false}={}){
 if(players.length>10||players.length<(force?2:4))throw Error('Fish Frenzy requires 4–10 players normally or at least 2 with Force Start');
 const order=players.map(p=>p.id);
 if(new Set(order).size!==order.length)throw Error('Duplicate players');
 const g={kind:'fish',forced:!!force,phase:'answer',order,round:0,
  maxRounds:order.length*(order.length<=5?2:1),
  scores:Object.fromEntries(order.map(id=>[id,0])),questions:shuffle(QUESTIONS),
  question:null,answer:null,guesser:null,blue:null,blueKey:null,
  answers:{},options:{},submitted:[],flipped:[],winner:[],last:null};
 nextQuestion(g);return g;
}
function scoreRound(g){
 const flipped=g.flipped.length,total=Object.keys(g.answers).length;
 const blueFlipped=g.flipped.includes(g.blueKey);
 const earned=blueFlipped?0:flipped+(flipped===total-1?1:0);
 g.scores[g.guesser]+=earned;
 // Normal mode has one answer per player. Force mode scores surviving
 // red-herring ANSWERS, each worth one point per card caught.
 for(const id of g.order){
  if(id===g.guesser)continue;
  if(id===g.blue){if(blueFlipped)g.scores[id]+=total-flipped;}
  else for(const key of Object.keys(g.answers)){
   if((key===id||key.startsWith(id+':'))&&!g.flipped.includes(key))g.scores[id]+=flipped;
  }
 }
 g.phase='round-results';
 g.last={blue:g.blue,correct:g.answer,flipped:[...g.flipped],guesserPoints:earned};
}
export function fishMove(g,id,a={}){
 if(g.phase==='results')throw Error('Game completed');
 if(!g.order.includes(id))throw Error('Player not in game');
 if(g.phase==='answer'){
  if(id===g.guesser||a.action!=='answer'||g.submitted.includes(id))throw Error('Not eligible to answer');
  if(isMulti(g)){
   if(!Array.isArray(a.answers)||a.answers.length!==2)throw Error('Submit exactly two answers');
   const values=a.answers.map(normalize);
   if(values.some(x=>!x||x.length>160))throw Error('Both answers must be 1–160 characters');
   if(same(values[0],values[1]))throw Error('Answers must be different');
   if(id===g.blue){
    if(!same(values[0],g.answer))throw Error('True Blue first answer must be correct');
    if(same(values[1],g.answer))throw Error('Suggested fake must not be the true answer');
   }else if(values.some(x=>same(x,g.answer)))throw Error('Red Herring answers must be false');
   values.forEach((value,i)=>{g.answers[answerKey(g,id,i)]=value;});
  }else{
   const response=normalize(a.answer);
   if(!response||response.length>160)throw Error('Answer must be 1–160 characters');
   if(id===g.blue&&!same(response,g.answer))throw Error('Blue fish must submit the true answer');
   g.answers[id]=response;
  }
  g.submitted.push(id);
  if(g.submitted.length===g.order.length-1){prepareOptions(g);g.phase='catch';}
  return;
 }
 if(g.phase==='catch'){
  if(id!==g.guesser)throw Error('Only the Guesser can catch or bank');
  if(a.action==='bank'){scoreRound(g);return;}
  if(a.action==='catch'){
   const target=g.options[a.target];
   if(!target||!Object.hasOwn(g.answers,target)||g.flipped.includes(target))throw Error('Choose a remaining answer');
   g.flipped.push(target);
   if(target===g.blueKey||g.flipped.length===Object.keys(g.answers).length-1)scoreRound(g);
   return;
  }
  throw Error('Catch or bank');
 }
 if(g.phase==='round-results'){
  if(id!==g.guesser||a.action!=='next')throw Error('Guesser advances to next round');
  g.round++;
  if(g.round>=g.maxRounds){
   g.phase='results';const max=Math.max(...Object.values(g.scores));
   g.winner=g.order.filter(id=>g.scores[id]===max);
  }else nextQuestion(g);
  return;
 }
 throw Error('Invalid phase');
}
export function fishView(g,id){
 const reveal=g.phase==='round-results'||g.phase==='results';
 const role=id===g.guesser?'Guesser':id===g.blue?'True Blue':'Red Herring';
 const suggestions=suggested(g,id);
 const answerFields=isMulti(g)&&id!==g.guesser&&!g.submitted.includes(id)&&g.phase==='answer'
  ?(role==='True Blue'
     ?[{label:'Correct answer',suggestion:g.answer,correct:true},{label:'Suggested fake answer',suggestion:suggestions[0],correct:false}]
     :[{label:'Suggested fake answer 1',suggestion:suggestions[0],correct:false},{label:'Suggested fake answer 2',suggestion:suggestions[1],correct:false}])
  :null;
 return {kind:'fish',forced:g.forced,multipleAnswers:isMulti(g),phase:g.phase,
  question:g.question,answer:id===g.guesser&&!reveal?null:g.answer,
  role,guesser:g.guesser,answerFields,
  answers:g.phase==='answer'?Object.fromEntries(g.submitted.map(pid=>[pid,'Submitted']))
   :Object.fromEntries(Object.entries(g.options).map(([label,key])=>[label,g.answers[key]])),
  flipped:Object.keys(g.options).filter(label=>g.flipped.includes(g.options[label])),
  scores:{...g.scores},round:g.round,maxRounds:g.maxRounds,
  last:reveal?g.last:null,hasAnswered:g.submitted.includes(id),
  winner:reveal?g.winner:null};
}
