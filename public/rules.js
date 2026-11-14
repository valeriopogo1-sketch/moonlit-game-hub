// Current Moonlit Game Hub rules. These describe what the app actually implements,
// including explicit house rules where it differs from commercial tabletop games.
// This module has no DOM side effects until openRules() is called.
export const GAME_RULES={
 werewolf:{
  name:'🐺 Moonlit Wolves',players:'3–10 players',
  objective:'Find and eliminate a Shadow Wolf. A Shadow Wolf tries to survive the vote; the Outcast wants to be eliminated.',
  setup:'Each player receives one secret role; three additional roles go face down in the middle. Your initial role decides your night action, while your final role determines your team.',
  steps:[
   'Night: the app activates roles in order. Finish your private action when it is your turn.',
   'Discussion: compare stories and suspicious claims with your friends.',
   'Voting: each player secretly picks someone else. A submitted vote is final.',
   'Reveal: anyone tied for the highest count is eliminated, but nobody is eliminated when every player has at most one vote.'
  ],
  actions:[
   'Shadow Wolf: learn your teammate; a lone wolf may inspect one middle card.',
   'Oracle: inspect another player or two middle cards.',
   'Thief: swap your card with another player and view your new card.',
   'Trickster: secretly swap two other players’ cards.',
   'Wanderer: exchange your card with a middle card, without looking.',
   'Watcher: inspect the card in front of you after the other actions.',
   'Villager / Outcast: no night action.'
  ],
  scoring:'Village wins if a Wolf is eliminated, or if no Wolves exist and nobody is eliminated. Wolves win when a Wolf survives without an Outcast being eliminated. The Outcast wins by being eliminated. Multiple groups may qualify in some outcomes.',
  note:'This is an original One Night–style game with a custom role roster, not the complete licensed One Night Ultimate Werewolf rules.',
  source:null
 },
 lines:{
  name:'♠️ Five in a Row',players:'2–4 players',
  objective:'Be the first individual player to connect five of your pieces in one straight row, column or diagonal.',
  setup:'An 8×8 board has two copies of each motif and four shared FREE corners. Each player starts with five private cards.',
  steps:[
   'Select a card in your hand, then select a highlighted legal square.',
   'A motif card places a chip on an empty square showing that motif.',
   'A Wild card places a chip on any empty non-corner square.',
   'A Remove card clears one unprotected opponent chip; it cannot remove a chip already locked in a completed line.',
   'After a normal play, draw a replacement card automatically. If a motif card has no open matching squares, exchange that dead card and continue your turn.'
  ],
  actions:['FREE corners count as your own chip for any line passing through them.','Completed lines are protected from removal.','The first completed five-in-a-row immediately wins.'],
  scoring:'One completed line wins. If nobody has a legal card play when the deck is exhausted, the match can end in a draw.',
  note:'House-rule variant: 8×8 board, individual players and one line to win. Standard Sequence commonly uses a 10×10 board and different team/sequence victory requirements.',
  source:{label:'Sequence-style reference',url:'https://www.playsequencegame.com/sequence_board_game_rules_and_instructions/'}
 },
 organs:{
  name:'🫀 Organ Mayhem',players:'2–6 players',
  objective:'Be the last player with at least one living organ.',
  setup:'Twenty organ identities are dealt only once across all players. Each player receives five private cards. Normal organs can withstand two damage points; the unique Wild Organ withstands four.',
  steps:[
   'On your turn select a card, a living organ and a legal target.',
   'Matching Affliction damages its organ type or a Wild Organ; Wild Affliction damages any living opponent organ.',
   'Severe Affliction deals two damage points. A protected organ spends its shield instead of taking damage.',
   'Cure removes up to two accumulated damage points from your own living organ. Shield protects your own organ against one hit.',
   'Instant Guard can protect your organ outside your normal turn; Instant Block can reverse the latest attack on your organs.',
   'If no ordinary card is playable, discard one or two cards and draw replacements to end your turn.'
  ],
  actions:['Each card you play is replaced from the deck when possible.','The holder of the Wild Organ takes the first turn.','A final hit may allow an Instant Block response before victory is confirmed.'],
  scoring:'When every organ belonging to a player is destroyed, that player is eliminated. The last survivor wins.',
  note:'Original simplified card system inspired by organ-attack party games; it is not a complete reproduction of any commercial OrganATTACK edition.',
  source:null
 },
 coup:{
  name:'👑 Court of Bluffs',players:'2–6 players',
  objective:'Keep at least one hidden Influence card after everyone else loses both of theirs.',
  setup:'Fifteen cards contain three copies each of Duke, Assassin, Captain, Ambassador and Contessa. Everyone receives two secret Influence and two coins; the first player in a two-player match starts with one coin.',
  steps:[
   'On your turn take Income, Foreign Aid, Coup, or claim a character action. You may bluff about a character you do not hold.',
   'Other players can challenge character claims. If the claimant proves the claim, the challenger loses one Influence; the proven card is swapped with the deck.',
   'If the claimant was bluffing, the claimant loses one Influence and that action is cancelled.',
   'Foreign Aid and certain character actions can be blocked by an appropriate claimed character. The block may also be challenged.',
   'Choose an Influence to reveal whenever you are required to lose one. Revealed Influence stays visible and no longer counts as living.',
   'At the beginning of your turn with ten or more coins, you must Coup.'
  ],
  actions:[
   'Income: +1 coin (cannot be blocked). Foreign Aid: +2 coins (Duke may block).',
   'Coup: pay 7 coins; target loses one Influence. Cannot be blocked or challenged.',
   'Duke — Tax: +3 coins. Also blocks Foreign Aid.',
   'Assassin — Assassinate: pay 3; target loses one Influence. Contessa may block.',
   'Captain — Steal: take up to 2 coins from a player. Captain or Ambassador may block.',
   'Ambassador — Exchange: draw two cards, choose the Influence you keep and return the rest.',
   'Contessa — has no turn action; blocks Assassination.'
  ],
  scoring:'The last player with any unrevealed Influence wins. Assassination can cost two Influence if a challenge fails and the attack then succeeds.',
  note:'Coup-style base-game mechanics. The physical optional two-player setup and expansions are not implemented.',
  source:{label:'Coup rules reference',url:'https://artofthegame.github.io/coup/rulebook.pdf'}
 },
 spyfall:{
  name:'🕵️ Secret Location',players:'3–8 players',
  objective:'Identify the Spy before the Spy correctly guesses the hidden location—or survives accusations.',
  setup:'A timed round lasts eight minutes. One Spy does not know the secret location; everyone else sees the location and an individual role. The game tracks scores across five rounds.',
  steps:[
   'Ask one another questions about the location over a voice call or in person. The person who answers asks someone else next, not the person who questioned them.',
   'Before time expires, any player may initiate one accusation. Every player except the suspect must agree to convict.',
   'A failed unanimous vote returns everyone to the timed discussion.',
   'During timed play, the Spy may reveal themselves and choose a location guess. A correct guess wins for the Spy; a wrong guess wins for the group.',
   'After time runs out, each player gets one final turn to nominate a suspect. The rest vote, excluding the suspect. If nobody is unanimously convicted, the Spy wins.'
  ],
  actions:['Successful mid-round accusation: non-spies each get 1 point, with 2 for the accuser.','Spy earns 2 points if the group fails to convict, and 4 for a correct location guess or wrong conviction.','After five rounds, the highest total wins.'],
  scoring:'A unanimously convicted Spy loses; a unanimously convicted innocent player wins for the Spy. The final round compares cumulative player scores.',
  note:'The in-app locations and individual occupations are original. Questions are verbal; voice calling is not built into the game.',
  source:{label:'Spyfall rules reference',url:'https://www.spyfall.live/gamerules'}
 },
 chameleon:{
  name:'🦎 Hidden Word',players:'3–8 players',
  objective:'Identify the Chameleon, who does not know the group’s secret word.',
  setup:'Everyone sees a 16-word topic grid. All players except the Chameleon see which word is the secret. The dealer starts the clue sequence.',
  steps:[
   'Each person gives exactly one short word as a clue, in turn order.',
   'Discuss which clues seem suspicious, then secretly vote for a different player.',
   'The player with the most votes is the suspect. The dealer decides if the vote is tied.',
   'If the suspect was not the Chameleon, the Chameleon escapes and scores.',
   'If caught, the Chameleon gets one final guess at the secret word—or two guesses with exactly three players.',
   'The previous Chameleon starts the following round as dealer.'
  ],
  actions:['The Chameleon wins 2 points by escaping identification.','If caught but guessing the secret word correctly, the Chameleon earns 1 point.','If caught and unable to guess, every other player earns 2 points.','The grid is hidden during voting in 7–8-player games.'],
  scoring:'The first player or players to reach five accumulated points win.',
  note:'Original topic and secret-word sets rather than the physical dice-and-code-card mechanism.',
  source:{label:'The Chameleon publisher',url:'https://bigpotato.com/products/the-chameleon'}
 },
 fish:{
  name:'🐠 Fish Frenzy',players:'4–10 normally · 2–3 with Force Start',
  objective:'As Guesser, find fake answers without accidentally catching the one true answer.',
  setup:'The Guesser does not see the answer. A random answering player is True Blue and sees the correct answer; other fish invent believable fakes. Choose Easy, Medium or Hard before starting.',
  steps:[
   'Answering players submit their answer(s). Suggestions are prefilled but editable; the correct True Blue answer is locked.',
   'The Guesser sees anonymous, shuffled Fish A/B/C/D choices (or more with larger groups).',
   'Catch suspected fake answers one at a time. You may bank the points already earned instead of risking another catch.',
   'If you catch the real answer, your round ends with zero Guesser points. Catch all the fakes without Blue for a bonus.',
   'Already know the question? Press Skip Question BEFORE any player submits. Your turn, score and round number are preserved.',
   'At the end of the round, the previous Guesser advances to the next question and the Guesser role rotates.'
  ],
  actions:[
   'Normal 4–10 players: each fish submits one answer.',
   'Force Start with 3 players: True Blue submits one correct plus one editable fake; Red Herring submits two editable fakes.',
   'Force Start with 2 players: the answering player supplies one correct plus three editable fake answers. No bot answers are added.',
   'Submitted answers must be unique. Correct answers cannot be replaced with false ones.',
   'The Guesser earns 1 point per caught fake plus a bonus for catching all fakes. Other players may score when Blue is caught or when their false answers survive.'
  ],
  scoring:'After the scheduled Guesser rotations, the highest accumulated score wins (ties share victory).',
  note:'Sounds Fishy–style gameplay with an original question bank and custom two- and three-player house rules. The official boxed game specifies 4–10 players.',
  source:{label:'Sounds Fishy publisher',url:'https://bigpotato.com/products/sounds-fishy'}
 }
};
const escapeHTML=value=>String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
export function rulesButton(kind,label='How to play'){
 if(!Object.hasOwn(GAME_RULES,kind))return '';
 return '<button type="button" class="btn ghost small rules-trigger" data-rules="'+escapeHTML(kind)+'">📖 '+escapeHTML(label)+'</button>';
}
export function openRules(kind){
 const rules=GAME_RULES[kind];
 if(!rules)return false;
 let dialog=document.querySelector('#moonlit-rulebook');
 if(!dialog){
  dialog=document.createElement('dialog');
  dialog.id='moonlit-rulebook';
  dialog.className='rules-dialog';
  dialog.setAttribute('aria-label','Game rules');
  document.body.appendChild(dialog);
  dialog.addEventListener('click',e=>{
   if(e.target===dialog){dialog.close();return;}
   if(e.target.closest('[data-close-rules]'))dialog.close();
  });
 }
 const list=items=>'<ol class="rules-steps">'+items.map(x=>'<li>'+escapeHTML(x)+'</li>').join('')+'</ol>';
 const bullets=items=>'<ul class="rules-actions">'+items.map(x=>'<li>'+escapeHTML(x)+'</li>').join('')+'</ul>';
 dialog.innerHTML='<section class="rules-content"><div class="rules-top"><span class="label">MOONLIT GAME GUIDE</span><button type="button" class="btn ghost small" data-close-rules aria-label="Close rules">✕ Close</button></div>'+
 '<h2>'+escapeHTML(rules.name)+'</h2><p class="rules-players">👥 '+escapeHTML(rules.players)+'</p>'+
 '<div class="rules-highlight"><strong>Goal</strong><p>'+escapeHTML(rules.objective)+'</p></div>'+
 '<h3>Setup</h3><p>'+escapeHTML(rules.setup)+'</p>'+
 '<h3>How to play</h3>'+list(rules.steps)+
 '<h3>Actions and special rules</h3>'+bullets(rules.actions)+
 '<h3>How to win / Score</h3><p>'+escapeHTML(rules.scoring)+'</p>'+
 '<div class="rules-note"><strong>Edition note</strong><p>'+escapeHTML(rules.note)+'</p></div>'+
 (rules.source?'<a class="rules-source" target="_blank" rel="noopener noreferrer" href="'+escapeHTML(rules.source.url)+'">View rule reference: '+escapeHTML(rules.source.label)+' ↗</a>':'')+
 '<p class="rules-foot">This guide describes the rules currently implemented in Moonlit Game Hub. Game content and house rules are independent of commercial editions.</p></section>';
 if(typeof dialog.showModal==='function'){if(!dialog.open)dialog.showModal();}
 else dialog.setAttribute('open','');
 return true;
}
