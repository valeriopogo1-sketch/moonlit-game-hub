import {randomInt} from 'node:crypto';
// Two-player Force Start: one correct and three editable fakes.
// Three-player Force Start: two answers per responder. Normal: one.
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
export const MEDIUM_QUESTIONS=[
 ['What is the smallest country in the world by area?','Vatican City'],
 ['What element has the atomic number 6?','Carbon'],
 ['Who painted The Persistence of Memory?','Salvador Dalí'],
 ['Which country is home to the ancient city of Petra?','Jordan'],
 ['Which part of the eye controls the amount of light entering?','Iris'],
 ['What is the currency of South Korea?','Won'],
 ['Which scientist formulated the three laws of motion?','Isaac Newton'],
 ['What is the capital of New Zealand?','Wellington'],
 ['Which river flows through Budapest?','Danube'],
 ['What is the largest internal organ in the human body?','Liver'],
 ['Which planet has the longest day due to its slow rotation?','Venus'],
 ['What language is primarily spoken in Brazil?','Portuguese']
];
export const HARD_QUESTIONS=[
 ['Which element has the chemical symbol W?','Tungsten'],
 ['Which moon of Saturn has lakes of liquid methane?','Titan'],
 ['What is the SI unit of electric capacitance?','Farad'],
 ['Which treaty ended the Thirty Years War in 1648?','Peace of Westphalia'],
 ['What is the deepest known point in Earth\'s oceans?','Challenger Deep'],
 ['Which mathematician is known for the incompleteness theorems?','Kurt Gödel'],
 ['What is the study of fungi called?','Mycology'],
 ['Which enzyme unwinds the DNA double helix during replication?','Helicase'],
 ['Which empire built the city of Tikal?','Maya'],
 ['What is the capital of Bhutan?','Thimphu'],
 ['What is the most abundant noble gas in Earth\'s atmosphere?','Argon'],
 ['Which particle mediates the electromagnetic force?','Photon']
];
export const DIFFICULTIES=['easy','medium','hard'];
const DECOYS=[
 ['Emu','Albatross','Cassowary'],['Mango','Papaya','Cucumber'],
 ['Flying squirrel','Sugar glider','Flying lemur'],['Atlantic Ocean','Indian Ocean','Arctic Ocean'],
 ['Ag','Go','Gd'],['Organ','Harpsichord','Accordion'],['Jupiter','Uranus','Neptune'],
 ['Starfish','Squid','Jellyfish'],['Asia','Australia','South America'],
 ['Gazelle','Antelope','Greyhound'],['African elephant','Hippopotamus','Giraffe'],
 ['Venus','Mars','Earth'],['Kyoto','Osaka','Seoul'],['Seven','Eight','Five'],
 ['Nitrogen','Hydrogen','Carbon dioxide'],['Lentils','Peanuts','Soybeans']
];
const MEDIUM_DECOYS=[
 ['Monaco','San Marino','Liechtenstein'],['Boron','Nitrogen','Oxygen'],['Pablo Picasso','René Magritte','Joan Miró'],
 ['Greece','Lebanon','Egypt'],['Pupil','Cornea','Retina'],['Yen','Yuan','Baht'],
 ['Albert Einstein','Galileo Galilei','Johannes Kepler'],['Auckland','Christchurch','Hamilton'],
 ['Rhine','Seine','Elbe'],['Brain','Kidney','Spleen'],['Mercury','Mars','Jupiter'],['Spanish','French','Italian']
];
const HARD_DECOYS=[
 ['Tin','Tantalum','Titanium'],['Europa','Enceladus','Ganymede'],['Ohm','Henry','Tesla'],
 ['Treaty of Utrecht','Treaty of Versailles','Treaty of Tordesillas'],['Puerto Rico Trench','Java Trench','Tonga Trench'],
 ['Alan Turing','David Hilbert','Georg Cantor'],['Entomology','Phycology','Bryology'],
 ['Ligase','Polymerase','Primase'],['Inca','Aztec','Olmec'],['Kathmandu','Paro','Lhasa'],
 ['Neon','Krypton','Xenon'],['Gluon','Graviton','Neutrino']
];
const BANK={
 easy:QUESTIONS.map((item,i)=>({question:item[0],answer:item[1],decoys:DECOYS[i]})),
 medium:MEDIUM_QUESTIONS.map((item,i)=>({question:item[0],answer:item[1],decoys:MEDIUM_DECOYS[i]})),
 hard:HARD_QUESTIONS.map((item,i)=>({question:item[0],answer:item[1],decoys:HARD_DECOYS[i]}))
};
function shuffle(a){const b=[...a];for(let i=b.length-1;i>0;i--){const j=randomInt(i+1);[b[i],b[j]]=[b[j],b[i]];}return b;}
const isMulti=g=>g.forced&&g.order.length<4;
const normalize=s=>String(s??'').trim().replace(/\s+/g,' ');
const same=(a,b)=>normalize(a).toLocaleLowerCase()===normalize(b).toLocaleLowerCase();
function answerKey(g,id,index){return isMulti(g)?id+':'+index:id;}
function prepareOptions(g){
 const ids=shuffle(Object.keys(g.answers));
 g.options=Object.fromEntries(ids.map((id,i)=>[String.fromCharCode(65+i),id]));
}
function assignSuggestions(g){
 const pool=shuffle((g.currentDecoys||[]).filter(x=>!same(x,g.answer)));
 const required=g.order.length===2?3:(g.order.length-1)*2-1;
 if(pool.length<required)throw Error('Not enough distinct suggestions for this question');
 g.suggestions={};
 let offset=0;
 for(const id of g.order.filter(pid=>pid!==g.guesser)){
   const count=id===g.blue?(g.order.length===2?3:1):2;
   g.suggestions[id]=pool.slice(offset,offset+count);
   offset+=count;
 }
}
function nextQuestion(g){
 // Question cursor changes on skips, while round count advances only after scored rounds.
 // Keep unused questions until the bank cycles, then reshuffle a new cycle.
 if(g.questionCursor>=g.questions.length){
   const previous=g.question;
   g.questions=shuffle(g.questions);
   if(g.questions.length>1&&g.questions[0].question===previous){
     const i=g.questions.findIndex(item=>item.question!==previous);
     [g.questions[0],g.questions[i]]=[g.questions[i],g.questions[0]];
   }
   g.questionCursor=0;
 }
 const item=g.questions[g.questionCursor++];
 g.question=item.question;g.answer=item.answer;g.currentDecoys=item.decoys;g.guesser=g.order[g.round%g.order.length];
 const others=g.order.filter(id=>id!==g.guesser);
 g.blue=others[randomInt(others.length)];
 g.blueKey=answerKey(g,g.blue,0);
 g.answers={};g.options={};g.flipped=[];g.submitted=[];g.phase='answer';g.last=null;
 if(isMulti(g))assignSuggestions(g);else g.suggestions={};
}
export function setupFish(players,{force=false,difficulty='easy'}={}){
 if(!DIFFICULTIES.includes(difficulty))throw Error('Invalid question difficulty');
 if(players.length>10||players.length<(force?2:4))throw Error('Fish Frenzy requires 4–10 players normally or at least 2 with Force Start');
 const order=players.map(p=>p.id);
 if(new Set(order).size!==order.length)throw Error('Duplicate players');
 const g={kind:'fish',forced:!!force,difficulty,phase:'answer',order,round:0,
  maxRounds:order.length*(order.length<=5?2:1),
  scores:Object.fromEntries(order.map(id=>[id,0])),questions:shuffle(BANK[difficulty]),questionCursor:0,skippedQuestions:0,
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
  if(a.action==='skip'){
    if(id!==g.guesser)throw Error('Only the Guesser can skip a question');
    if(g.submitted.length>0)throw Error('Cannot skip after an answer was submitted');
    g.skippedQuestions++;
    nextQuestion(g);
    return;
  }
  if(id===g.guesser||a.action!=='answer'||g.submitted.includes(id))throw Error('Not eligible to answer');
  if(isMulti(g)){
   const required=g.order.length===2?4:2;
   if(!Array.isArray(a.answers)||a.answers.length!==required)throw Error('Submit exactly '+required+' answers');
   const values=a.answers.map(normalize);
   if(values.some(x=>!x||x.length>160))throw Error('Every answer must be 1–160 characters');
   if(new Set(values.map(value=>value.toLocaleLowerCase())).size!==values.length)throw Error('Answers must be different');
   if(values.some(value=>Object.values(g.answers).some(existing=>same(value,existing))))throw Error('Answers must not duplicate other players');
   if(id===g.blue){
    if(!same(values[0],g.answer))throw Error('True Blue first answer must be correct');
    if(values.slice(1).some(value=>same(value,g.answer)))throw Error('Suggested fakes must not be the true answer');
   }else if(values.some(x=>same(x,g.answer)))throw Error('Red Herring answers must be false');
   values.forEach((value,i)=>{g.answers[answerKey(g,id,i)]=id===g.blue&&i===0?g.answer:value;});
  }else{
   const response=normalize(a.answer);
   if(!response||response.length>160)throw Error('Answer must be 1–160 characters');
   if(id===g.blue&&!same(response,g.answer))throw Error('Blue fish must submit the true answer');
   if(id!==g.blue&&same(response,g.answer))throw Error('Red Herring must give a false answer');
   if(Object.values(g.answers).some(existing=>same(existing,response)))throw Error('Answers must not duplicate another fish');
   g.answers[id]=id===g.blue?g.answer:response;
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
 const suggestions=g.suggestions?.[id]||[];
 const answerFields=isMulti(g)&&id!==g.guesser&&!g.submitted.includes(id)&&g.phase==='answer'
  ?(role==='True Blue'
     ?[{label:'Correct answer',suggestion:g.answer,correct:true},...suggestions.map((suggestion,i)=>({label:g.order.length===2?'Suggested fake answer '+(i+1):'Suggested fake answer',suggestion,correct:false}))]
     :[{label:'Suggested fake answer 1',suggestion:suggestions[0],correct:false},{label:'Suggested fake answer 2',suggestion:suggestions[1],correct:false}])
  :null;
 return {kind:'fish',forced:g.forced,difficulty:g.difficulty,multipleAnswers:isMulti(g),phase:g.phase,
  question:g.question,answer:id===g.guesser&&!reveal?null:g.answer,
  role,guesser:g.guesser,answerFields,canSkip:g.phase==='answer'&&id===g.guesser&&g.submitted.length===0,skippedQuestions:g.skippedQuestions,
  answers:g.phase==='answer'?Object.fromEntries(g.submitted.map(pid=>[pid,'Submitted']))
   :Object.fromEntries(Object.entries(g.options).map(([label,key])=>[label,g.answers[key]])),
  flipped:Object.keys(g.options).filter(label=>g.flipped.includes(g.options[label])),
  scores:{...g.scores},round:g.round,maxRounds:g.maxRounds,
  last:reveal?g.last:null,hasAnswered:g.submitted.includes(id),
  winner:reveal?g.winner:null};
}
