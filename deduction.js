import {randomInt} from 'node:crypto';
const pick=a=>a[randomInt(a.length)];
export const LOCATIONS=[
 ['Airport',['Pilot','Guard','Traveler']],['Library',['Librarian','Reader','Student']],
 ['Hospital',['Nurse','Doctor','Visitor']],['Museum',['Curator','Guide','Guest']],
 ['Restaurant',['Chef','Waiter','Diner']],['Train',['Conductor','Traveler','Ticket Inspector']],
 ['Space Station',['Scientist','Commander','Engineer']],['Beach',['Lifeguard','Tourist','Vendor']],
 ['Stadium',['Athlete','Coach','Fan']],['Hotel',['Receptionist','Cleaner','Guest']],
 ['School',['Teacher','Student','Principal']],['Farm',['Farmer','Veterinarian','Visitor']],
 ['Theater',['Actor','Director','Audience']],['Bank',['Teller','Manager','Customer']],
 ['Pirate Ship',['Captain','Cook','Deckhand']],['Carnival',['Performer','Visitor','Vendor']]
];
export const TOPICS=[
 ['Animals',['Tiger','Lion','Elephant','Giraffe','Zebra','Panda','Dolphin','Shark','Turtle','Eagle','Penguin','Wolf','Fox','Cat','Dog','Rabbit']],
 ['Sports',['Basketball','Badminton','Football','Tennis','Swimming','Cycling','Volleyball','Boxing','Golf','Baseball','Surfing','Running','Gymnastics','Skiing','Cricket','Bowling']],
 ['Food',['Pizza','Pasta','Sushi','Burger','Salad','Soup','Curry','Tacos','Bread','Cake','Cheese','Chicken','Fish','Rice','Eggs','Noodles']],
 ['Places',['Hospital','Library','Beach','Park','Museum','Airport','Cinema','Market','School','Stadium','Hotel','Farm','Cafe','Zoo','Mall','Station']],
 ['Travel',['Plane','Train','Bus','Ferry','Bicycle','Taxi','Passport','Suitcase','Map','Camera','Hostel','Ticket','Beach','Airport','Cruise','Backpack']]
];
const order=players=>players.map(x=>x.id);
function valid(players,min,max){if(players.length<min||players.length>max)throw Error('Requires '+min+'–'+max+' players');}
function spyDeal(g){
 // The previous round's Spy becomes dealer; avoid repeating a location in a five-round game.
 g.dealer=g.round===1?g.order[0]:g.spy;
 const candidates=LOCATIONS.filter(([location])=>!g.usedLocations.includes(location));
 const [location,roles]=pick(candidates.length?candidates:LOCATIONS),spy=pick(g.order);
 g.usedLocations.push(location);
 const allRoles=[...new Set([...roles,'Supervisor','Assistant','Inspector','Visitor','Technician','Coordinator','Observer','Custodian','Reporter'])];
 const assigned={};let i=0;
 for(const id of g.order)assigned[id]=id===spy?{spy:true}:{spy:false,location,role:allRoles[i++]};
 g.location=location;g.spy=spy;g.assigned=assigned;g.roundEnds=Date.now()+8*60*1000;g.pausedRemainingMs=null;
 g.accusation=null;g.accused=new Set();g.reason=null;g.winner=null;g.last=null;
 g.finalQueue=[];g.finalIndex=0;g.phase='talk';
}
export function setupSpyfall(players){valid(players,3,8);
 const orderIds=order(players);
 const g={kind:'spyfall',phase:'talk',location:null,spy:null,assigned:{},order:orderIds,round:1,maxRounds:5,
  scores:Object.fromEntries(orderIds.map(id=>[id,0])),roundEnds:0,pausedRemainingMs:null,dealer:orderIds[0],usedLocations:[],accusation:null,accused:new Set(),winner:null,reason:null,last:null,overallWinners:[]};
 spyDeal(g);return g;
}
function finishSpy(g,winner,reason,extra=false){
 g.winner=winner;g.reason=reason;
 const points=Object.fromEntries(g.order.map(id=>[id,0]));
 if(winner==='spy')points[g.spy]=extra?4:2;
 else for(const id of g.order)if(id!==g.spy)points[id]=id===extra?2:1;
 for(const id of g.order)g.scores[id]+=points[id];
 g.last={location:g.location,spy:g.spy,winner,reason,points};
 g.phase=g.round>=g.maxRounds?'results':'round-results';
 if(g.phase==='results'){
  const high=Math.max(...Object.values(g.scores));
  g.overallWinners=g.order.filter(id=>g.scores[id]===high);
 }
}
function beginFinalVote(g){
 // When time expires, each player gets a turn as ACCUSER, not as the accused.
 // Accusers nominate their own suspect; the suspect has no vote.
 const start=g.order.indexOf(g.dealer);
 g.phase='final-nomination';g.finalQueue=[...g.order.slice(start),...g.order.slice(0,start)];g.finalIndex=0;
 g.accusation=null;
}
function finalVoteAdvance(g){
 g.finalIndex++;
 if(g.finalIndex>=g.finalQueue.length){finishSpy(g,'spy','No unanimous final accusation');return;}
 g.phase='final-nomination';g.accusation=null;
}
export function expireSpyRound(g,now=Date.now()){if(g.phase==='talk'&&now>=g.roundEnds){beginFinalVote(g);return true;}return false;}
export function spyMove(g,id,a){
 if(!g.order.includes(id))throw Error('Not a player');
 if(g.phase==='results')throw Error('Match finished');
 if(g.phase==='round-results'){
  if(id!==g.order[0]||a.action!=='next')throw Error('Host starts next Spyfall round');
  g.round++;spyDeal(g);return;
 }
 if(g.phase==='talk'&&Date.now()>=g.roundEnds)beginFinalVote(g);
 if(a.action==='guess'){
  if(id!==g.spy||g.phase!=='talk')throw Error('Spy may guess only during timed play');
  finishSpy(g,a.location===g.location?'spy':'agents','Spy guessed '+(a.location===g.location?'correctly':'incorrectly'),a.location===g.location);
  return;
 }
 if(g.phase==='final-nomination'){
  if(id!==g.finalQueue[g.finalIndex]||a.action!=='accuse'||id===a.target||!g.order.includes(a.target))throw Error('Current accuser must nominate another player');
  g.accusation={by:id,target:a.target,votes:{[id]:true}};
  g.phase='final-vote';return;
 }
 if(g.phase==='talk'){
  if(a.action!=='accuse'||id===a.target||!g.order.includes(a.target)||g.accused.has(id))throw Error('Invalid accusation');
  g.pausedRemainingMs=Math.max(0,g.roundEnds-Date.now());
  g.accused.add(id);g.phase='accusation';g.accusation={by:id,target:a.target,votes:{[id]:true}};
  return;
 }
 if(g.phase==='accusation'||g.phase==='final-vote'){
  if(a.action!=='vote')throw Error('Vote on the current suspect');
  const p=g.accusation;
  if(id===p.target||id===p.by||!g.order.includes(id))throw Error('Not eligible to vote');
  if(typeof a.agree!=='boolean'||Object.hasOwn(p.votes,id))throw Error('Vote yes or no once');
  p.votes[id]=a.agree;
  if(!a.agree){
   if(g.phase==='final-vote')finalVoteAdvance(g);
   else{g.phase='talk';g.accusation=null;g.roundEnds=Date.now()+g.pausedRemainingMs;g.pausedRemainingMs=null;}
   return;
  }
  if(Object.keys(p.votes).length===g.order.length-1){
   const accusedSpy=p.target===g.spy;
   finishSpy(g,accusedSpy?'agents':'spy','Unanimous accusation',accusedSpy?p.by:true);
  }
  return;
 }
 throw Error('Invalid action');
}
export function spyView(g,id){
 const finished=['round-results','results'].includes(g.phase);
 return {kind:'spyfall',phase:g.phase,assignment:g.assigned[id],locations:LOCATIONS.map(a=>a[0]),
  roundEnds:g.roundEnds,timerPaused:g.phase==='accusation',pausedRemainingMs:g.phase==='accusation'?g.pausedRemainingMs:null,dealer:g.dealer,round:g.round,maxRounds:g.maxRounds,scores:g.scores,
  accusation:g.accusation,finalAccuser:g.phase==='final-nomination'?g.finalQueue[g.finalIndex]:null,canAccuse:!g.accused.has(id),winner:g.winner,reason:g.reason,last:g.last,
  reveal:finished?{location:g.location,spy:g.spy}:null,overallWinners:g.phase==='results'?g.overallWinners:[]};
}
export function setupChameleon(players){valid(players,3,8);const [topic,words]=pick(TOPICS),secret=pick(words),chameleon=pick(order(players));return {kind:'chameleon',phase:'clues',topic,words,secret,chameleon,order:order(players),dealer:players[0].id,clueTurn:0,clues:{},votes:{},suspect:null,guessCount:0,guessedWords:[],winner:null,points:Object.fromEntries(order(players).map(id=>[id,0])),roundPoints:{},round:1,winners:[],tie:null};}
function settle(g,score){
 g.winner=score?'chameleon':'group';
 g.roundPoints=Object.fromEntries(g.order.map(p=>[p,score?(p===g.chameleon?score:0):(p===g.chameleon?0:2)]));
 for(const id of g.order)g.points[id]+=g.roundPoints[id];
 const leaders=g.order.filter(id=>g.points[id]>=5);
 g.winners=leaders;g.phase=leaders.length?'results':'round-results';
}
function newChameleonRound(g){
 const previous=g.chameleon;
 const [topic,words]=pick(TOPICS);
 g.round++;g.dealer=previous;g.clueTurn=g.order.indexOf(previous);
 g.topic=topic;g.words=words;g.secret=pick(words);g.chameleon=pick(g.order);
 g.clues={};g.votes={};g.suspect=null;g.guessCount=0;g.guessedWords=[];g.winner=null;g.roundPoints={};g.tie=null;g.phase='clues';
}
export function chameleonMove(g,id,a){
 if(g.phase==='results'||!g.order.includes(id))throw Error('Invalid player or finished');
 if(g.phase==='round-results'){
  if(id!==g.chameleon||a.action!=='next')throw Error('Last round Chameleon starts the next round');
  newChameleonRound(g);return;
 }
 if(g.phase==='clues'){
  if(a.action!=='clue'||Object.hasOwn(g.clues,id))throw Error('Submit one clue only');
  if(g.order[g.clueTurn]!==id)throw Error('Wait for your clue turn');
  const clue=String(a.clue||'').trim();if(!/^\S+$/.test(clue)||clue.length>35)throw Error('Clue must be one word');
  g.clues[id]=clue;g.clueTurn=(g.clueTurn+1)%g.order.length;if(Object.keys(g.clues).length===g.order.length)g.phase='vote';return;
 }
 if(g.phase==='vote'){
  if(a.action!=='vote'||a.target===id||!g.order.includes(a.target)||Object.hasOwn(g.votes,id))throw Error('Select another player');
  g.votes[id]=a.target;
  if(Object.keys(g.votes).length===g.order.length){
   const count={};for(const name of Object.values(g.votes))count[name]=(count[name]||0)+1;
   const max=Math.max(...Object.values(count));const ties=Object.keys(count).filter(x=>count[x]===max);
   if(ties.length>1){g.phase='tie';g.tie=ties;}else resolveSuspect(g,ties[0]);
  }return;
 }
 if(g.phase==='tie'){
  if(id!==g.dealer||a.action!=='tiebreak'||!g.tie.includes(a.target))throw Error('Dealer chooses tied suspect');
  resolveSuspect(g,a.target);return;
 }
 if(g.phase==='guess'){
  if(id!==g.chameleon||a.action!=='guess'||!g.words.includes(a.word))throw Error('Chameleon must select a listed word');
  if(g.guessedWords.includes(a.word))throw Error('You already guessed that word');
  g.guessedWords.push(a.word);
  g.guessCount++;
  if(a.word===g.secret)settle(g,1);
  else if(g.order.length===3&&g.guessCount<2){}else settle(g,0);
  return;
 }
 throw Error('Invalid action');
}
function resolveSuspect(g,target){g.suspect=target;g.tie=null;if(target===g.chameleon)g.phase='guess';else settle(g,2);}
export function chameleonView(g,id){
 return {kind:'chameleon',phase:g.phase,topic:g.topic,words:g.order.length>=7&&['vote','tie'].includes(g.phase)?[]:g.words,clueTurn:g.order[g.clueTurn]||null,secret:id===g.chameleon?null:g.secret,role:id===g.chameleon?'Chameleon':'Codebreaker',clues:g.clues,votesCast:Object.keys(g.votes).length,hasVoted:Object.hasOwn(g.votes,id),dealer:g.dealer,tie:g.tie,suspect:g.suspect,guessCount:g.guessCount,guessedWords:id===g.chameleon?[...g.guessedWords]:[],winner:g.winner,round:g.round,points:g.points,roundPoints:g.roundPoints,winners:g.winners,reveal:['results','round-results'].includes(g.phase)?{secret:g.secret,chameleon:g.chameleon}:null};
}
