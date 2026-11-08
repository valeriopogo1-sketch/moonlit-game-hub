// Mobile interfaces for four additional original-style game modes.
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','\'':'&#39;'}[c]));
const names={coup:'👑 Court of Bluffs',spyfall:'🕵️ Secret Location',chameleon:'🦎 Hidden Word',fish:'🐟 Fish Frenzy'};
const head=v=>'<main class="shell"><section class="board"><div class="nav"><div class="logo"><span class="mark">☾</span> MOONLIT</div><span class="pill">'+esc(v.code)+'</span></div><div class="label">MULTIPLAYER GAME</div><h1 class="heading">'+names[v.gameType]+'</h1>';
const foot='</section></main>';
const btn=(label,action,extra='',disabled=false)=>'<button class="btn small '+extra+'" data-gact="'+esc(action)+'" '+(disabled?'disabled':'')+'>'+esc(label)+'</button>';
const select=(options,label='Choose player')=>'<label class="field"><span>'+esc(label)+'</span><select class="input" id="game-target">'+options.map(([k,v])=>'<option value="'+esc(k)+'">'+esc(v)+'</option>').join('')+'</select></label>';
const options=v=>v.players.filter(p=>p.id!==v.you).map(p=>[p.id,p.name]);
const player=v=>v.players.find(p=>p.id===v.you)?.name||'Player';
export function renderAdditional(v,ctx){
 if(v.gameType==='coup')renderCoup(v,ctx);
 else if(v.gameType==='spyfall')renderSpy(v,ctx);
 else if(v.gameType==='chameleon')renderCham(v,ctx);
 else renderFish(v,ctx);
 if(v.table?.phase==='results'&&v.you===v.host){
  const panel=ctx.app.querySelector('.panel');
  panel?.insertAdjacentHTML('beforeend','<button class="btn full" id="new-game-rematch">↻ Return to lobby for rematch</button>');
  ctx.app.querySelector('#new-game-rematch')?.addEventListener('click',()=>ctx.cmd('rematch'));
 }
}
function renderCoup(v,ctx){
 const g=v.table,p=g.pending,me=v.you,turn=g.turnPlayer===me,phase=g.phase,opp=options(v);
 let actions='<div class="label">WAITING FOR OTHER PLAYER</div>';
 if(phase==='playing'&&turn){
  const my=g.players.find(x=>x.id===me),mandatory=my.coins>=10;
  actions='<p class="info">'+(mandatory?'10+ coins: a Coup is mandatory.':'Choose a normal or claimed character action. Anyone may challenge a character claim.')+'</p>'+select(opp)+
  '<div class="choices">'+[['income','Income (+1)'],['aid','Foreign Aid (+2)'],['coup','Coup (-7)'],['tax','Tax / Duke (+3)'],['assassinate','Assassinate (-3)'],['steal','Steal / Captain'],['exchange','Exchange / Ambassador']].filter(([id])=>!mandatory||id==='coup').map(([id,title])=>btn(title,id)).join('')+'</div>';
 }else if(['challenge','block-challenge'].includes(phase)){
  const excluded=phase==='challenge'?p.actor:p.blocker;if(me!==excluded)actions='<p class="info">'+(phase==='challenge'?'Challenge the action claim or pass.':'Challenge the block claim or pass.')+'</p>'+btn('Challenge','challenge')+btn('Pass','pass','ghost');
 }else if(phase==='block'){
  if(me!==p.actor){const allowed=p.action==='aid'?['Duke']:p.target===me?(p.action==='steal'?['Captain','Ambassador']:['Contessa']):[];
   actions='<p class="info">You may pass, or claim a character to block.</p>'+allowed.map(role=>btn('Block with '+role,'block:'+role)).join(' ')+btn('Pass','pass','ghost');
  }
 }else if(phase==='reveal'&&me===(p.challengingBlock?p.blocker:p.actor)){
   actions='<p class="info">You have been challenged! Select a hidden influence to reveal.</p>'+g.hand.map((role,i)=>role?btn('Reveal '+role,'index:'+i):'').join(' ');
 }else if((phase==='lose'&&p.loser===me)||(phase==='challenge-loss'&&p.challengeLoser===me)){
   actions='<p class="info">Lose one influence. Choose which hidden role to reveal permanently.</p>'+g.hand.map((role,i)=>role?btn('Lose '+role,'index:'+i):'').join(' ');
 }else if(phase==='exchange'&&p.actor===me){
   actions='<p class="info">Choose '+g.hand.filter(Boolean).length+' influence cards to keep. Select by indices from the offered cards.</p><div class="choices">'+p.options.map((r,i)=>'<label class="choice"><input type="checkbox" class="keep-role" value="'+i+'"> '+esc(r)+'</label>').join('')+'</div>'+btn('Confirm exchange','exchange');
 }
 if(phase==='results')actions='<div class="notice">🏆 '+esc(v.players.find(x=>x.id===g.winner)?.name)+' wins!</div>';
 const players=g.players.map(x=>'<div class="result-row"><span>'+esc(v.players.find(p=>p.id===x.id)?.name)+' '+(x.alive?'':'(out)')+'</span><b>🪙 '+x.coins+' · '+x.cards.map((c,i)=>x.id===me?(g.hand[i]||x.revealed[i]||'✖'):c?'🂠':x.revealed[i]||'✖').join(', ')+'</b></div>').join('');
 const pending=p?'<div class="notice">Current action: '+esc(p.action)+' by '+esc(v.players.find(x=>x.id===p.actor)?.name)+ (p.target?' targeting '+esc(v.players.find(x=>x.id===p.target)?.name):'')+'. Phase: '+esc(phase)+'.</div>':'';
 ctx.app.innerHTML=head(v)+'<div class="panel"><div class="phase"><div class="phase-icon">👑</div><div><h3>'+esc(phase==='results'?'Match finished':turn?'Your turn':v.players.find(x=>x.id===g.turnPlayer)?.name+' is acting')+'</h3><p>Last player with influence wins.</p></div></div><div class="results-list">'+players+'</div>'+pending+actions+'</div>'+foot;
 ctx.app.querySelectorAll('[data-gact]').forEach(b=>b.onclick=()=>{const a=b.dataset.gact,data={};if(a.startsWith('index:'))data.index=Number(a.split(':')[1]);else if(a.startsWith('block:')){data.action='block';data.role=a.split(':')[1];}else if(a==='exchange'){data.indices=[...ctx.app.querySelectorAll('.keep-role:checked')].map(x=>Number(x.value));}else{data.action=a;if(['coup','assassinate','steal'].includes(a))data.target=ctx.app.querySelector('#game-target')?.value;}ctx.cmd('play',data)});
}
function renderSpy(v,ctx){
 const g=v.table,spy=g.assignment.spy,me=v.you;
 const name=id=>v.players.find(x=>x.id===id)?.name||'Unknown';
 let action='<p class="info">Ask and answer location questions over voice chat. After replying, question a different player—not the person who asked you.</p>';
 if(g.phase==='talk'){
  action+='<div class="label">PROPOSE A SPY ACCUSATION</div>'+select(options(v))+btn('Propose accusation','accuse','',!g.canAccuse);
  if(spy)action+='<div class="label">SPY MAY REVEAL AND GUESS</div><label class="field"><span>Guess the location</span><select class="input" id="location-guess">'+g.locations.map(l=>'<option value="'+esc(l)+'">'+esc(l)+'</option>').join('')+'</select></label>'+btn('Reveal and guess','guess');
 }else if(['accusation','final-vote'].includes(g.phase)){
  const p=g.accusation;
  action='<div class="notice">'+(g.phase==='final-vote'?'Time is up. Final accusations are checked in order. ':'Accusation in progress. ')+'Suspect: '+esc(name(p.target))+'. All players except the suspect must agree.</div>';
  if(me!==p.target&&!Object.hasOwn(p.votes,me))action+=btn('Agree','yes')+btn('Disagree','no','ghost');
 }else if(['round-results','results'].includes(g.phase)){
  action='<div class="notice">Round winner: '+(g.winner==='spy'?'Spy':'Non-spies')+'. '+esc(g.reason)+'<p>Location: '+esc(g.reveal.location)+'. Spy: '+esc(name(g.reveal.spy))+'</p></div>';
  if(g.phase==='round-results')action+=me===v.host?btn('Start next round','next'):'<p class="info">Waiting for host to start another round.</p>';
  else action+='<div class="notice">🏆 Overall winner(s): '+esc(g.overallWinners.map(name).join(', '))+'</div>';
 }
 const scores='<div class="results-list">'+v.players.map(p=>'<div class="result-row"><span>'+esc(p.name)+'</span><b>'+g.scores[p.id]+' pts</b></div>').join('')+'</div>';
 ctx.app.innerHTML=head(v)+'<div class="panel"><div class="phase"><div class="phase-icon">🕵️</div><div><h3>Round '+g.round+' / '+g.maxRounds+'</h3><p>Eight-minute question and answer round</p></div></div><div class="role-card"><span class="role-emoji">'+(spy?'🕵️':'📍')+'</span><h2>'+(spy?'You are the Spy':esc(g.assignment.location))+'</h2><p>'+(spy?'Blend in and guess the secret location.':'Your location role: '+esc(g.assignment.role))+'</p></div><p class="info">Round time ends at '+new Date(g.roundEnds).toLocaleTimeString()+'. Unanimous accusations exclude the suspected player. After time expires, a final accusation phase begins.</p><div class="label">SCORES</div>'+scores+action+'</div>'+foot;
 ctx.app.querySelectorAll('[data-gact]').forEach(b=>b.onclick=()=>{
  const a=b.dataset.gact;
  if(a==='accuse')ctx.cmd('play',{action:'accuse',target:ctx.app.querySelector('#game-target')?.value});
  if(a==='guess')ctx.cmd('play',{action:'guess',location:ctx.app.querySelector('#location-guess')?.value});
  if(a==='yes'||a==='no')ctx.cmd('play',{action:'vote',agree:a==='yes'});
  if(a==='next')ctx.cmd('play',{action:'next'});
 });
}
function renderCham(v,ctx){
 const g=v.table,me=v.you;
 let controls='';
 if(g.phase==='clues'&&g.clueTurn===me&&!Object.hasOwn(g.clues,me))controls='<label class="field"><span>ONE WORD CLUE</span><input class="input" maxlength="35" id="clue" placeholder="One clue word"></label>'+btn('Submit clue','clue');
 if(g.phase==='clues'&&g.clueTurn!==me)controls='<div class="notice">Waiting for '+esc(v.players.find(p=>p.id===g.clueTurn)?.name||'next player')+' to submit a clue. Clues are given clockwise.</div>';
 if(g.phase==='vote'&&!g.hasVoted)controls=select(options(v),'Who is the Chameleon?')+btn('Vote','vote');
 if(g.phase==='tie'&&g.dealer===me)controls=select(g.tie.map(id=>[id,v.players.find(p=>p.id===id)?.name]),'Dealer breaks tie')+btn('Choose suspect','tie');
 if(g.phase==='guess'&&g.role==='Chameleon')controls=select(g.words.map(w=>[w,w]),'Guess the secret word')+btn('Final guess','guess');
 if(['results','round-results'].includes(g.phase)){
  controls='<div class="notice">Round winner: '+esc(g.winner)+'. Chameleon: '+esc(v.players.find(p=>p.id===g.reveal.chameleon)?.name)+'. Secret word: '+esc(g.reveal.secret)+'</div><p class="info">Scores: '+v.players.map(p=>esc(p.name)+': '+g.points[p.id]).join(' · ')+'</p>'+
  (g.phase==='round-results'?(g.role==='Chameleon'?btn('Next round','next'):'<div class="info">Waiting for the previous Chameleon to start the next round.</div>'):'<div class="notice">🏆 First to 5 points: '+esc(g.winners.map(id=>v.players.find(p=>p.id===id)?.name).join(', '))+'</div>');
 }
 const clues=Object.entries(g.clues).map(([id,w])=>'<div class="result-row"><span>'+esc(v.players.find(p=>p.id===id)?.name)+'</span><b>'+esc(w)+'</b></div>').join('');
 ctx.app.innerHTML=head(v)+'<div class="panel"><div class="role-card"><span class="role-emoji">🦎</span><div class="team">'+esc(g.topic)+'</div><h2>'+esc(g.role==='Chameleon'?'You are the Chameleon':g.secret)+'</h2><p>'+esc(g.role==='Chameleon'?'Blend in without knowing the chosen word.':'Give a subtle one-word clue about the secret word.')+'</p></div><div class="label">TOPIC WORDS</div><div class="topic-words">'+g.words.map(w=>'<span class="role-tag">'+esc(w)+'</span>').join('')+'</div><div class="results-list">'+clues+'</div><div class="label">PHASE: '+esc(g.phase.toUpperCase())+' · ROUND '+g.round+'</div>'+controls+'</div>'+foot;
 ctx.app.querySelectorAll('[data-gact]').forEach(b=>b.onclick=()=>{const a=b.dataset.gact;if(a==='clue')ctx.cmd('play',{action:'clue',clue:ctx.app.querySelector('#clue')?.value});if(a==='vote')ctx.cmd('play',{action:'vote',target:ctx.app.querySelector('#game-target')?.value});if(a==='tie')ctx.cmd('play',{action:'tiebreak',target:ctx.app.querySelector('#game-target')?.value});if(a==='guess')ctx.cmd('play',{action:'guess',word:ctx.app.querySelector('#game-target')?.value});if(a==='next')ctx.cmd('play',{action:'next'});});
}
function renderFish(v,ctx){
 const g=v.table,me=v.you,isGuesser=g.guesser===me;
 // Never replace the answer input elements while the same round remains open.
 // SSE updates and polling can fire during Android keyboard composition.
 const draftKey=[v.code,v.you,g.round,g.question].join(':');
 const existing=ctx.app.querySelector('[data-fish-edit-key]');
 if(g.phase==='answer'&&!g.hasAnswered&&!isGuesser&&
    existing?.dataset.fishEditKey===draftKey&&
    existing.querySelector('.fish-answer-field,#fish-answer'))return;
 const names=id=>v.players.find(x=>x.id===id)?.name||'Unknown';
 const scores=v.players.map(p=>'<div class="result-row"><span>'+esc(p.name)+'</span><b>'+g.scores[p.id]+' points</b></div>').join('');
 const answered=Object.keys(g.answers).length;
 let controls='';
 if(g.phase==='answer'){
  controls=isGuesser?'<div class="notice">You are the Guesser. Wait for each fish to invent or reveal their answer. You cannot see the real answer yet.</div>':
   '<div class="notice">Your role: '+esc(g.role)+'. The true answer is <strong>'+esc(g.answer)+'</strong>. '+(g.role==='True Blue'?'You must submit the exact real answer.':'Invent a believable false answer.')+'</div>'+
   (g.hasAnswered?'<div class="notice">Answer submitted. Waiting for the other fish.</div>':
   (g.multipleAnswers?
    '<div class="notice">Force Start: submit '+g.answerFields.length+' answers. Suggested answers are editable.'+(g.role==='True Blue'?' Keep your first answer correct; all remaining answers must be fake.':' Both answers must be convincing fakes.')+'</div>'+
    g.answerFields.map((f,i)=>'<label class="field"><span>'+esc(f.label)+'</span><input class="input fish-answer-field" maxlength="160" data-fish-index="'+i+'" value="'+esc(f.suggestion)+'" placeholder="Edit this answer"></label>').join('')+
    btn('Submit '+g.answerFields.length+' answers','answer'):
    '<label class="field"><span>YOUR ANSWER</span><input class="input" maxlength="160" id="fish-answer" value="'+esc(g.role==='True Blue'?g.answer:'')+'" placeholder="Enter your answer"></label>'+btn('Submit answer','answer')));
 }else if(g.phase==='catch'){
  controls='<p class="info">The Guesser catches suspected Red Herrings one at a time. Catching Blue ends the turn with zero Guesser points.</p>'+
   '<div class="results-list">'+Object.entries(g.answers).map(([id,response])=>'<div class="result-row"><div><span>Fish '+esc(id)+'</span><p class="info">'+esc(response)+'</p></div><div>'+(g.flipped.includes(id)?'<span class="tag">FLIPPED</span>':isGuesser?'<button class="btn small" data-fish-catch="'+esc(id)+'">Catch 🐟</button>':'<span class="tiny">Hidden</span>')+'</div></div>').join('')+'</div>'+
   (isGuesser?btn('Bank and end turn','bank','ghost'):'<div class="notice">Waiting for the Guesser to catch or bank.</div>');
 }else if(g.phase==='round-results'){
  controls='<div class="notice">Round finished. True Blue: '+esc(names(g.last.blue))+'. Correct answer: '+esc(g.last.correct)+'. The Guesser earned '+g.last.guesserPoints+' points.</div>'+
   (isGuesser?btn('Next round','next'):'<p class="info">Waiting for the Guesser to advance.</p>');
 }else controls='<div class="notice">Game finished! Winner(s): '+esc((g.winner||[]).map(names).join(', '))+'</div>';
 ctx.app.innerHTML=head(v)+'<div class="panel" data-fish-edit-key="'+esc(draftKey)+'"><div class="phase"><div class="phase-icon">🐠</div><div><h3>Round '+(g.round+1)+' / '+g.maxRounds+'</h3><p>Guesser: '+esc(names(g.guesser))+'</p></div></div><div class="role-card"><span class="role-emoji">🐟</span><div class="team">'+esc(g.role)+'</div><h2>'+esc(g.question)+'</h2><p>'+(isGuesser?'Find the fake answers, but avoid the true one.':'The true answer is: '+esc(g.answer))+'</p></div><div class="label">SCORES</div><div class="results-list">'+scores+'</div>'+controls+'</div>'+foot;
 ctx.app.querySelectorAll('[data-gact]').forEach(b=>b.onclick=()=>{const a=b.dataset.gact;if(a==='answer'){const fields=[...ctx.app.querySelectorAll('.fish-answer-field')];ctx.cmd('play',g.multipleAnswers?{action:'answer',answers:fields.map(f=>f.value)}:{action:'answer',answer:ctx.app.querySelector('#fish-answer')?.value});}if(a==='bank'||a==='next')ctx.cmd('play',{action:a});});
 ctx.app.querySelectorAll('[data-fish-catch]').forEach(b=>b.onclick=()=>ctx.cmd('play',{action:'catch',target:b.dataset.fishCatch}));
}
