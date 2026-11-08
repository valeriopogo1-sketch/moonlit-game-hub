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
export function setupSpyfall(players){valid(players,3,8);const [location,roles]=pick(LOCATIONS);const spy=pick(order(players)),assigned={};
 for(const p of players)assigned[p.id]=p.id===spy?{spy:true}:{spy:false,location,role:pick(roles)};
 return {kind:'spyfall',phase:'talk',location,spy,assigned,order:order(players),roundEnds:Date.now()+8*60000,accusation:null,accused:new Set(),winner:null,reason:null};
}
function finishSpy(g,winner,reason){g.phase='results';g.winner=winner;g.reason=reason;}
export function spyMove(g,id,a){
 if(g.phase==='results')throw Error('Round finished');
 if(!g.order.includes(id))throw Error('Not a player');
 if(g.phase==='talk'&&Date.now()>=g.roundEnds){finishSpy(g,'spy','Time expired');return;}
 if(a.action==='guess'){
  if(id!==g.spy||g.phase!=='talk')throw Error('Only spy can guess before accusation ends');
  finishSpy(g,a.location===g.location?'spy':'agents','Spy guessed '+(a.location===g.location?'correctly':'incorrectly'));return;
 }
 if(a.action==='accuse'){
  if(g.phase!=='talk'||id===a.target||!g.order.includes(a.target)||g.accused.has(id))throw Error('Invalid accusation');
  g.accused.add(id);g.phase='accusation';g.accusation={by:id,target:a.target,votes:{[id]:true}};return;
 }
 if(a.action==='vote'){
  if(g.phase!=='accusation'||id===g.accusation.by||!g.order.includes(id))throw Error('Not eligible');
  if(typeof a.agree!=='boolean'||Object.hasOwn(g.accusation.votes,id))throw Error('Vote yes or no once');
  g.accusation.votes[id]=a.agree;
  if(!a.agree){g.accusation=null;g.phase='talk';return;}
  if(Object.keys(g.accusation.votes).length===g.order.length)finishSpy(g,g.accusation.target===g.spy?'agents':'spy','Unanimous accusation');return;
 }
 throw Error('Invalid action');
}
export function spyView(g,id){return {kind:'spyfall',phase:g.phase,assignment:g.assigned[id],locations:LOCATIONS.map(a=>a[0]),roundEnds:g.roundEnds,accusation:g.accusation,canAccuse:!g.accused.has(id),winner:g.winner,reason:g.reason,reveal:g.phase==='results'?{location:g.location,spy:g.spy}:null};}
export function setupChameleon(players){valid(players,3,8);const [topic,words]=pick(TOPICS),secret=pick(words),chameleon=pick(order(players));return {kind:'chameleon',phase:'clues',topic,words,secret,chameleon,order:order(players),dealer:players[0].id,clues:{},votes:{},suspect:null,guessCount:0,winner:null,points:{},tie:null};}
function settle(g,score){g.phase='results';g.winner=score?'chameleon':'group';g.points=Object.fromEntries(g.order.map(p=>[p,score?p===g.chameleon?(score===2?2:1):0:p===g.chameleon?0:2]));}
export function chameleonMove(g,id,a){
 if(g.phase==='results'||!g.order.includes(id))throw Error('Invalid player or finished');
 if(g.phase==='clues'){
  if(a.action!=='clue'||Object.hasOwn(g.clues,id))throw Error('Submit one clue only');
  const clue=String(a.clue||'').trim();if(!/^\S+$/.test(clue)||clue.length>35)throw Error('Clue must be one word');
  g.clues[id]=clue;if(Object.keys(g.clues).length===g.order.length)g.phase='vote';return;
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
  g.guessCount++;
  if(a.word===g.secret)settle(g,1);
  else if(g.order.length===3&&g.guessCount<2){}else settle(g,0);
  return;
 }
 throw Error('Invalid action');
}
function resolveSuspect(g,target){g.suspect=target;g.tie=null;if(target===g.chameleon)g.phase='guess';else settle(g,2);}
export function chameleonView(g,id){
 return {kind:'chameleon',phase:g.phase,topic:g.topic,words:g.words,secret:id===g.chameleon?null:g.secret,role:id===g.chameleon?'Chameleon':'Codebreaker',clues:g.clues,votesCast:Object.keys(g.votes).length,hasVoted:Object.hasOwn(g.votes,id),dealer:g.dealer,tie:g.tie,suspect:g.suspect,guessCount:g.guessCount,winner:g.winner,points:g.phase==='results'?g.points:null,reveal:g.phase==='results'?{secret:g.secret,chameleon:g.chameleon}:null};
}
