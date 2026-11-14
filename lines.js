import {randomInt} from 'node:crypto';
const ITEMS=['☀','☾','★','✦','◆','♠','♥','♣','⚡','☘','⚓','♫','☕','✿','☁','✈','☂','❄','✧','♛','♜','♞','⚙','◎','⬡','⛵','☯','♬','✪','❖'];
const corner=i=>[0,7,56,63].includes(i);
export function makeBoard(){const ids=[...ITEMS,...ITEMS];return Array.from({length:64},(_,i)=>corner(i)?'FREE':ids.shift());}
export function setupLines(players,pick=randomInt){if(players.length<2||players.length>4)throw Error('Five in a Row supports 2–4 players');const deck=[];for(let i=0;i<3;i++){for(const motif of ITEMS)deck.push({type:'tile',motif,id:'t'+i+'-'+motif});for(let k=0;k<4;k++)deck.push({type:'wild',id:'w'+i+'-'+k});for(let k=0;k<3;k++)deck.push({type:'remove',id:'r'+i+'-'+k});}for(let i=deck.length-1;i>0;i--){let j=pick(i+1);[deck[i],deck[j]]=[deck[j],deck[i]];}const hands={};for(const p of players)hands[p.id]=deck.splice(0,5);return {kind:'lines',phase:'playing',board:makeBoard(),chips:Array(64).fill(null),hands,deck,discard:[],turn:0,passCount:0,order:players.map(p=>p.id),locked:[],lines:[],winner:null,last:null};}
export function linesFor(g,player){const out=[];for(let y=0;y<8;y++)for(let x=0;x<8;x++)for(const [dx,dy] of [[1,0],[0,1],[1,1],[1,-1]]){let cells=[];for(let n=0;n<5;n++){const xx=x+n*dx,yy=y+n*dy;if(xx<0||xx>7||yy<0||yy>7){cells=[];break;}cells.push(yy*8+xx);}if(cells.length===5&&cells.every(i=>corner(i)||g.chips[i]===player))out.push(cells);}return out;}
function canPlace(g,id,card){
 if(!card)return false;
 if(card.type==='tile')return g.board.some((motif,i)=>motif===card.motif&&!g.chips[i]);
 if(card.type==='wild')return g.chips.some((occupied,i)=>!occupied&&!corner(i));
 if(card.type==='remove')return g.chips.some((occupied,i)=>occupied&&occupied!==id&&!g.locked.includes(i));
 return false;
}
function hasLegalMove(g,id){return g.hands[id].some(card=>canPlace(g,id,card));}
function hasDeadTile(g,id){return g.hands[id].some(card=>card.type==='tile'&&!canPlace(g,id,card));}
function mayPass(g,id){return !hasLegalMove(g,id)&&(!g.deck.length||!hasDeadTile(g,id));}
export function lineMove(g,id,{cardIndex,cell,discardDead=false,pass=false}){if(g.phase!=='playing'||g.order[g.turn]!==id)throw Error('Not your turn');
if(pass){
 if(!mayPass(g,id))throw Error('You must play or exchange a legal card before passing');
 g.passCount=(g.passCount||0)+1;
 g.last={player:id,card:'pass'};
 if(g.passCount>=g.order.length){g.phase='results';g.winner=null;return;}
 g.turn=(g.turn+1)%g.order.length;
 return;
}
const hand=g.hands[id],card=hand?.[cardIndex];if(!card||!Number.isInteger(cardIndex))throw Error('Select a card');if(discardDead){if(!g.deck.length)throw Error('No replacement cards remain in the deck');if(card.type!=='tile'||g.board.some((motif,i)=>motif===card.motif&&!g.chips[i]))throw Error('This card is still playable');g.discard.push(hand.splice(cardIndex,1)[0]);if(g.deck.length)hand.push(g.deck.shift());return;}
if(!Number.isInteger(cell)||cell<0||cell>=64||corner(cell))throw Error('Select a valid board tile');
if(card.type==='remove'){if(!g.chips[cell]||g.chips[cell]===id||g.locked.includes(cell))throw Error('Choose an unprotected opponent tile');g.chips[cell]=null;}else{if(g.chips[cell])throw Error('Tile already occupied');if(card.type==='tile'&&g.board[cell]!==card.motif)throw Error('That card does not match the tile');g.chips[cell]=id;}
g.discard.push(hand.splice(cardIndex,1)[0]);if(g.deck.length)hand.push(g.deck.shift());g.passCount=0;const newLines=linesFor(g,id);for(const cells of newLines){if(!g.lines.some(l=>l.owner===id&&l.cells.join(',')===cells.join(','))){g.lines.push({owner:id,cells});for(const c of cells)if(!corner(c))g.locked.push(c);}}g.locked=[...new Set(g.locked)];g.last={player:id,card:card.type==='tile'?card.motif:card.type,cell};if(g.lines.some(l=>l.owner===id)){g.winner=id;g.phase='results';return;}g.turn=(g.turn+1)%g.order.length;
if(!g.deck.length&&g.order.every(pid=>!hasLegalMove(g,pid))){g.phase='results';g.winner=null;}
}
export function linesView(g,id){return {kind:g.kind,phase:g.phase,board:g.board,chips:g.chips,locked:g.locked,lines:g.lines,hand:g.hands[id],handSizes:Object.fromEntries(g.order.map(p=>[p,g.hands[p].length])),turnPlayer:g.order[g.turn],canPass:g.phase==='playing'&&g.order[g.turn]===id&&mayPass(g,id),last:g.last,winner:g.winner,deckRemaining:g.deck.length};}
