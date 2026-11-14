// Original turn-based games. Rendered inside the shared Moonlit room.
const colors=['#b494f8','#5fcee3','#ee92a8','#e6bb73'];
const names={lines:'♠️ Five in a Row',organs:'🫀 Organ Mayhem',werewolf:'🐺 Moonlit Wolves',coup:'👑 Court of Bluffs',spyfall:'🕵️ Secret Location',chameleon:'🦎 Hidden Word',fish:'🐠 Fish Frenzy'};
export const gameName=kind=>names[kind]||'Moonlit Game';
const tile=(s)=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','\'':'&#39;'}[c]));
const meName=(v,id)=>v.players.find(p=>p.id===id)?.name||'Unknown';
const participants=v=>v.players.map((p,i)=>'<span class="participant"><i style="background:'+colors[i]+'"></i>'+tile(p.name)+'</span>').join('');
function shell(v,body){
 return '<main class="shell"><section class="board"><header class="nav"><div class="logo"><span class="mark">☾</span> MOONLIT</div><span class="pill">✦ Game night</span></header>'+
 '<div class="topline"><div><div class="label">'+(v.settings?.isPublic===false?'PRIVATE':'PUBLIC')+' GAME ROOM</div><h1 class="heading">'+gameName(v.gameType)+'</h1></div><span class="pill">'+tile(v.code)+'</span></div>'+
 '<div class="rules-inline"><button type="button" class="btn ghost small rules-trigger" data-rules="'+tile(v.gameType)+'">📖 Rules &amp; actions</button></div>'+body+'</section></main>';
}
export function renderLines(v,ctx){
 const g=v.table,p=ctx.state.pick||{},turn=g.phase==='playing'&&g.turnPlayer===v.you;
 const card=Number.isInteger(p.card)?g.hand[p.card]:null;
 const playable=(i)=>{if(!card||!turn||g.board[i]==='FREE')return false;if(card.type==='remove')return !!g.chips[i]&&g.chips[i]!==v.you&&!g.locked.includes(i);return !g.chips[i]&&(card.type==='wild'||card.motif===g.board[i]);};
 const board=g.board.map((symbol,i)=>'<button class="line-square '+(g.board[i]==='FREE'?'free ':'')+(g.chips[i]?'occupied ':'')+(p.cell===i?'selected ':'')+(g.locked.includes(i)?'locked ':'')+(playable(i)?'legal ':'')+'" data-line-cell="'+i+'" '+(!playable(i)?'disabled':'')+' aria-label="Tile '+(i+1)+' '+tile(symbol)+'"><span>'+tile(symbol==='FREE'?'✦':symbol)+'</span>'+(g.chips[i]?'<i class="line-chip" style="background:'+colors[v.players.findIndex(a=>a.id===g.chips[i])]+'"></i>':'')+'</button>').join('');
 const hand=g.hand.map((c,i)=>'<button class="mini-card '+(p.card===i?'selected':'')+'" data-line-card="'+i+'" '+(!turn?'disabled':'')+'><strong>'+tile(c.type==='tile'?c.motif:c.type==='wild'?'✨':'🧹')+'</strong><small>'+tile(c.type==='tile'?'Match':c.type==='wild'?'Wild':'Remove')+'</small></button>').join('');
 const body='<div class="panel"><div class="phase"><div class="phase-icon">♠️</div><div><h3>'+tile(g.phase==='results'?(g.winner?meName(v,g.winner)+' wins!':'Draw'):turn?'Your turn':meName(v,g.turnPlayer)+' is playing')+'</h3><p>Claim five tiles in a straight line to win.</p></div></div><div class="line-board">'+board+'</div><div class="participants">'+participants(v)+'</div><div class="label">YOUR CARDS</div><div class="card-hand">'+hand+'</div><p class="info">Choose a card and highlighted tile. Wild cards claim any empty tile; Remove cards clear unprotected opponent chips.</p>'+(turn?'<div class="btn-row"><button class="btn" id="line-play">Play card</button><button class="btn ghost" id="line-dead">Exchange unusable card</button></div>':'<div class="notice">'+(g.phase==='results'?'Round completed.':'Waiting for your turn.')+'</div>')+(g.phase==='results'&&v.you===v.host?'<button id="turn-rematch" class="btn full">Play again</button>':'')+'</div>';
 ctx.app.innerHTML=shell(v,body);
 ctx.app.querySelectorAll('[data-line-card]').forEach(el=>el.onclick=()=>{ctx.state.pick={card:Number(el.dataset.lineCard)};renderLines(v,ctx);});
 ctx.app.querySelectorAll('[data-line-cell]').forEach(el=>el.onclick=()=>{ctx.state.pick={...ctx.state.pick,cell:Number(el.dataset.lineCell)};renderLines(v,ctx);});
 ctx.app.querySelector('#line-play')?.addEventListener('click',()=>{if(!Number.isInteger(ctx.state.pick?.card)||!Number.isInteger(ctx.state.pick?.cell))return ctx.toast('Choose a card and valid board tile');const {card,cell}=ctx.state.pick;ctx.state.pick={};ctx.cmd('move',{cardIndex:card,cell});});
 ctx.app.querySelector('#line-dead')?.addEventListener('click',()=>{if(!Number.isInteger(ctx.state.pick?.card))return ctx.toast('Select a card');const card=ctx.state.pick.card;ctx.state.pick={};ctx.cmd('move',{cardIndex:card,discardDead:true});});
 ctx.app.querySelector('#turn-rematch')?.addEventListener('click',()=>ctx.cmd('rematch'));
}
export function renderOrgans(v,ctx){
 const g=v.table,p=ctx.state.pick||{},turn=g.phase==='playing'&&g.turnPlayer===v.you;
 const alive=id=>Object.values(g.bodies[id]||{}).some(o=>o.hp>0);
 const selected=Number.isInteger(p.card)?g.hand[p.card]:null;
 const isInstant=selected&&selected.kind.startsWith('instant_')&&(g.phase!=='reaction'||(v.you===g.reactionTarget&&selected.kind==='instant_block'));
 const reaction=g.phase==='reaction';
 const hand=g.hand.map((c,i)=>'<button class="mini-card '+((p.cards||[]).includes(i)||p.card===i?'selected':'')+'" data-organ-card="'+i+'" '+(g.phase==='results'?'disabled':'')+'><strong>'+({attack:'⚔️',wild_attack:'🌈',necrosis:'☠️',shield:'🛡️',cure:'💊',instant_guard:'⚡🛡️',instant_block:'⚡↩️'}[c.kind]||'🃏')+'</strong><small>'+tile(c.kind==='attack'?'Afflict '+c.part:c.kind.replaceAll('_',' '))+'</small></button>').join('');
 const bodies=v.players.map(player=>'<div class="body-card"><h3>'+tile(player.name)+(player.id===v.you?' (you)':'')+(alive(player.id)?'':' · Eliminated')+'</h3><div class="organ-grid">'+Object.values(g.bodies[player.id]||{}).map(o=>{const part=g.parts.find(x=>x.id===o.id),dead=o.hp===0;return '<button class="organ-tile '+(dead?'dead ':'')+(p.target===player.id&&p.part===o.id?'selected':'')+'" data-organ-target="'+tile(player.id)+'" data-organ-part="'+o.id+'" '+(dead||g.phase==='results'?'disabled':'')+'><span>'+part?.icon+'</span><strong>'+tile(part?.name||o.id)+'</strong><small>'+(dead?'LOST':(o.id==='wild'?'4-hit wild · ':'')+(o.hp-o.strain)+' left'+(o.shield?' · 🛡️':'')+(o.strain?' · ⚠️'+o.strain:''))+'</small></button>'}).join('')+'</div></div>').join('');
 const discardMode=!!p.discardMode;
 const body='<div class="panel"><div class="phase"><div class="phase-icon">🫀</div><div><h3>'+tile(g.phase==='results'?(g.winner?meName(v,g.winner)+' survives!':'Draw'):turn?'Your turn':meName(v,g.turnPlayer)+' is playing')+'</h3><p>Twenty unique organ cards shared among all players. Keep at least one alive.</p></div></div><div class="notice">⚡ Instant cards can be played outside your turn. Discard up to 2 cards only when you have no regular playable move.</div><div class="bodies">'+bodies+'</div><div class="label">YOUR HAND</div><div class="card-hand">'+hand+'</div><p class="info">'+(discardMode?'Select 1–2 cards to replace, then tap Confirm Discard.':selected?'Selected: '+tile(selected.kind.replaceAll('_',' '))+'. '+(selected.kind==='instant_block'?'Block the most recent attack against you.':selected.kind==='instant_guard'?'Select one of your own organs.':'Choose a highlighted organ to play this card.'):'Select a card to begin. Attacks match their organ, wild afflictions match any organ, and severe afflictions cause two damage.')+'</p>'+
 ((g.phase==='playing'||reaction)?
  (reaction?'<div class="notice">'+(v.you===g.reactionTarget?'⚠️ Your last organ was hit. Play ⚡ Instant Block or accept elimination.':'Waiting for the targeted player to respond to the final attack.')+'</div>'+(v.you===g.reactionTarget?'<div class="btn-row">'+(isInstant?'<button class="btn" id="organ-instant">⚡ Instant Block</button>':'')+'<button class="btn ghost" id="organ-accept">Accept elimination</button></div>':''):
  discardMode?'<div class="btn-row"><button class="btn" id="organ-confirm-discard">Confirm discard ('+(p.cards||[]).length+'/2)</button><button class="btn ghost" id="organ-cancel-discard">Cancel</button></div>':
  '<div class="btn-row">'+(turn?'<button class="btn" id="organ-play">Play selected card</button>':'')+(isInstant?'<button class="btn" id="organ-instant">⚡ Instant Play</button>':'')+(turn?'<button class="btn ghost" id="organ-discard" '+(!g.canDiscard?'disabled':'')+'>Discard up to 2</button>':'')+'</div>'):
  '<div class="notice">Game over. The last player with surviving organs wins.</div>')+
 (g.phase==='results'&&v.you===v.host?'<button id="turn-rematch" class="btn full">Play again</button>':'')+'</div>';
 ctx.app.innerHTML=shell(v,body);
 ctx.app.querySelectorAll('[data-organ-card]').forEach(el=>el.onclick=()=>{const i=Number(el.dataset.organCard);if(ctx.state.pick?.discardMode){const old=ctx.state.pick.cards||[];ctx.state.pick={discardMode:true,cards:old.includes(i)?old.filter(x=>x!==i):[...old,i].slice(-2)};}else ctx.state.pick={card:i};renderOrgans(v,ctx);});
 ctx.app.querySelectorAll('[data-organ-target]').forEach(el=>el.onclick=()=>{ctx.state.pick={...ctx.state.pick,target:el.dataset.organTarget,part:el.dataset.organPart};renderOrgans(v,ctx);});
 ctx.app.querySelector('#organ-play')?.addEventListener('click',()=>{const {card,target,part}=ctx.state.pick||{};if(!Number.isInteger(card)||!target||!part)return ctx.toast('Choose a card and organ');ctx.state.pick={};ctx.cmd('move',{cardIndex:card,target,part});});
 ctx.app.querySelector('#organ-instant')?.addEventListener('click',()=>{const {card,target,part}=ctx.state.pick||{};if(!Number.isInteger(card))return ctx.toast('Choose an instant card');if(selected.kind==='instant_guard'&&(!part||target!==v.you))return ctx.toast('Choose your own organ to guard');ctx.state.pick={};ctx.cmd('move',{cardIndex:card,instant:true,target,part});});
 ctx.app.querySelector('#organ-accept')?.addEventListener('click',()=>{ctx.state.pick={};ctx.cmd('move',{accept:true});});
 ctx.app.querySelector('#organ-discard')?.addEventListener('click',()=>{ctx.state.pick={discardMode:true,cards:[]};renderOrgans(v,ctx);});
 ctx.app.querySelector('#organ-cancel-discard')?.addEventListener('click',()=>{ctx.state.pick={};renderOrgans(v,ctx);});
 ctx.app.querySelector('#organ-confirm-discard')?.addEventListener('click',()=>{const cards=ctx.state.pick?.cards||[];if(!cards.length||cards.length>2)return ctx.toast('Choose one or two cards');ctx.state.pick={};ctx.cmd('move',{discardIndices:cards});});
 ctx.app.querySelector('#turn-rematch')?.addEventListener('click',()=>ctx.cmd('rematch'));
}
