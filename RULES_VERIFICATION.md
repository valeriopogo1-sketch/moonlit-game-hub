# Moonlit Game Hub — Rules Verification

**Audited:** November 14, 2026 | **Target release:** v0.5.8

This review compares the actual game engines, mobile instructions and automated tests with published rule references. It separates **Moonlit house rules** from the rules of commercial products. Moonlit is not an official edition of the referenced games, and this audit does not establish trademark or copyright licensing.

## Verification summary

| Moonlit mode | Players | Published comparison | Alignment | Rule details to know |
|---|---:|---|---|---|
| Moonlit Wolves | 3–10 | One Night Ultimate Werewolf | Custom variant | Final roles decide outcomes; all tied leaders die only if top vote count exceeds one |
| Five in a Row | 2–4 | Sequence | Custom variant | 8×8, one row to win, five-card hands, no teams |
| Organ Mayhem | 2–6 | OrganATTACK | Custom variant | Twenty unique distributed organs, simplified damage/defense |
| Court of Bluffs | 2–6 | Coup | Close adaptation | Full seven actions, challenges/blocks, refund on disproved Assassin claim |
| Secret Location | 3–8 | Spyfall | Close adaptation | Eight-minute timer pauses for accusations, final vote, five-round score |
| Hidden Word | 3–8 | The Chameleon | Close adaptation | One-word clues, dealer tie-break, final guess, first to five points |
| Fish Frenzy | 4–10 standard; 2–3 forced | Sounds Fishy | Adaptation with house rules | Normal scoring, custom forced answer counts, question skip |

## 1. Moonlit Wolves

**Code:** game.js. **Reference:** https://www.rulespal.com/one-night-ultimate-werewolf/rulebook

Each player receives one hidden role, with three center cards. The night action depends on the starting role; the final role after swaps decides the winning team. Wolves see a packmate or, if alone, inspect one center card. Oracle checks another player or two middle cards. Thief swaps with someone and learns the resulting card. Trickster swaps two others, Wanderer swaps with the center unseen, and Watcher checks their final card. Villager and Outcast have no night action.

After discussion each player casts one secret, **irreversible** vote for another player. Everyone tied for most votes dies if the top count is greater than one. Otherwise nobody dies. Village wins when at least one Wolf dies, or when no Wolf is in play and nobody dies. Wolves win when a Wolf survives without being killed, except for the Outcast interaction. Outcast wants to die. The role roster and combinations are deliberately Moonlit-specific, not the complete original product.

**Checked:** setup, secret roles, night transitions, locked votes, votes tied at one, resulting teams.

## 2. Five in a Row

**Code:** lines.js. **Reference:** https://sequence.stratzagames.com/sequence-rules-players

Moonlit uses a **custom 8×8 board** with four shared FREE corners. Each player starts with five cards and competes individually. Match motif cards to empty matching squares, Wild to any empty non-corner square, and Remove to an opponent piece not already protected by a complete line. Playing a normal card draws a replacement. A completely unplayable motif card can be exchanged without ending the turn, but only when a replacement exists. **If a player has no legal play and no available exchange, they may pass; if everyone passes consecutively, the match ends in a draw.**

The first complete horizontal, vertical or diagonal line of five wins. Standard Sequence uses a 10×10 board and commonly requires **two sequences for two players/two teams**, but only one for three solo players/teams; player counts and teams also differ. Moonlit does not reproduce those formats.

**Checked:** correct 8×8 layout, legal card targets, FREE corners, one-line victory, locked pieces and dead-card exchanges.

## 3. Organ Mayhem

**Code:** organs.js. **Reference:** https://kubix.com.ua/upload/iblock/237/fa100a7i5jz3gpgp1yo6sgh0texj4ydz.pdf

Twenty unique organs are distributed among the players. Players receive five private cards; ordinary organs can take up to two damage points and the unique Wild Organ four. Matching Afflictions, Wild Afflictions and Severe Afflictions attack opponents' organs. Cure, Shield, Instant Guard and Instant Block provide recovery, shielding and reversal of eligible attacks. Instant cards can work outside a normal turn. If no normal card can be played, discard and redraw up to two cards.

The last person with a living organ wins. Published OrganATTACK games have additional card-specific interactions, special exceptions and different card effects not reproduced by this original engine.

**Checked:** targeting living organs, shield absorption, attack reversal, out-of-turn instant defense and last-survivor result.

## 4. Court of Bluffs — Coup-style

**Code:** coup.js. **Published publisher-verified rules:** https://rules.dized.com/game/xzsTtI3VTV-2wvos3otxIg/coup

Each player has two hidden Influence cards (from three of each Duke, Assassin, Captain, Ambassador, Contessa). Starting money is two coins, with the first two-player participant starting on one. The seven actions are:

| Action | Effect | Counteraction |
|---|---|---|
| Income | +1 coin | None |
| Foreign Aid | +2 coins | Duke |
| Coup | Pay 7, target loses Influence | Unstoppable |
| Duke: Tax | +3 coins | Challenged only |
| Assassin: Assassinate | Pay 3, target loses Influence | Contessa |
| Captain: Steal | Take up to 2 from target | Captain or Ambassador |
| Ambassador: Exchange | Draw two, choose the permitted Influence to keep | Challenged only |

Character action claims may be bluffs, and other players can challenge **before** counteractions. Truthful claims cause the challenger to lose one Influence and the proved card to be swapped with the deck; false claims cost the actor one Influence and cancel the action. Counteractions can themselves be challenged. A target who loses a challenge and then gets assassinated can lose **two** Influence in one turn. At 10+ coins on the active turn, Coup is mandatory; last hidden Influence wins.

**Critical checked nuance:** When the **Assassin's claimed character is disproved**, the Assassin cost is **refunded**. When a legitimate Assassination is blocked by Contessa, the three coins remain spent. This now matches the publisher FAQ: https://rules.dized.com/game/xzsTtI3VTV-2wvos3otxIg/faq

**Checked:** all action categories, challenges, blocks, mandatory Coup, two-player setup, refund vs blocked payment, eliminated-target handling.

## 5. Secret Location — Spyfall-style

**Code:** deduction.js. **Reference:** https://cdn.ultraboardgames.com/spyfall/game-rules.php

One Spy does not know the hidden location. Other players share the location but have their own occupations. The dealer starts asking location-related questions, then the answerer asks someone other than their questioner. Moonlit requires a separate voice call or in-person conversation.

An eight-minute round is timed. A player can initiate one accusation during timed play; **the timer pauses while everyone except the accused votes**. If any voter disagrees, the accusation ends and the timer **resumes with the unused time**. The Spy can reveal and guess a location only while the clock is running; incorrect guesses lose.

At timeout, the dealer nominates a suspect for a final unanimous vote. If rejected, the next player nominates, until one person is convicted or each player has had their chance. The previous round's Spy becomes the next dealer. Moonlit attempts to avoid repeating a location within its five-round match.

Scoring: non-spies earn one each when they win, plus an extra for the successful accuser. The Spy earns two if never convicted, four for a correct location guess or a wrongful conviction. Locations and occupations are original, not the licensed deck.

**Checked:** hidden location, paused/restored timer, final vote eligibility, dealer transfer, distinct locations and round scores.

## 6. Hidden Word — Chameleon-style

**Code:** deduction.js. **Reference:** https://bigpotato.com/products/the-chameleon

One randomly chosen Chameleon does not know the secret word, which all Codebreakers learn from a 16-word topic grid. Each player offers exactly one related clue word in dealer order. Moonlit prevents Codebreakers from submitting the exact secret as a clue; this is an app-specific anti-spoiler rule, not a claim that the official rulebook mandates this exact input validation.

After discussion, each person votes for a different suspect. Dealer breaks ties. If the Chameleon was caught, they may guess the word once, or twice with exactly three players; duplicate guesses are rejected. In seven/eight-player matches the topic grid remains hidden **through voting and the final Chameleon's guess**, which is a typed blind answer rather than a visible list of choices. Uncaught Chameleon earns two; caught but correct guess earns one; caught and incorrect earns two for every other player. First to five points wins, and the previous Chameleon becomes the new dealer.

Moonlit replaces physical dice and code cards with a server-selected secret and original word lists.

**Checked:** clue turn order, privacy, tie vote, two guesses in three-player rounds, concealed grid and cumulative points.

## 7. Fish Frenzy — Sounds Fishy-style

**Code:** fish.js. **Reference:** https://bigpotato.com/products/sounds-fishy

Each round has one Guesser who does not know the answer, one True Blue Kipper who must give the correct answer, and Red Herrings who invent lies. Responses are anonymous and shuffled. The Guesser catches suspicious answers one at a time or banks. Catching True Blue causes the Guesser to score zero. Otherwise, Guesser gets one point for each caught Red plus a one-point bonus for catching all Reds.

In the normal game, unflipped Reds score one for each fish flipped, even True Blue. A flipped True Blue scores one per still-unflipped fish; an unflipped Blue scores zero. Normal player counts 4–5 get two turns each as Guesser; 6–10 get one turn each. Highest total wins.

**Custom Force Start:** For two players, the only responder submits **one locked correct answer and three editable fake suggestions**. For three players, True Blue submits one correct + one editable fake, and the Red Herring submits two editable fakes. All submissions must be unique, even in normal four-to-ten-player games. There are four anonymized/shuffled choices with 2–3 players and no bot answers. Forced-game scoring treats multiple false answer cards as house-rule cards rather than duplicating physical-player scoring.

**Custom Skip:** Guesser may skip a known question only **before any answers are submitted**; it changes neither points nor completed round count. Easy/Medium/Hard banks use original questions.

**Reference differences:** The commercial game is designed for four to ten players and has a short answer-invention window (around 15 seconds); Moonlit does not yet enforce that timer. The game here is *Sounds Fishy*-style bluffing, not the separate 2004 fish-collecting card game *Somethin' Fishy*.

**Checked:** truth/fake and duplicate requirements, hidden-answer privacy, four-choice Force Start, scoring for all players, round advancement, retries, and safe question skips. The result screen now shows **every player's point change**.

## Shared rules and quality safeguards

- Public rooms by default. Owner may change Public/Private in the waiting lobby.
- Owner can kick guests in the waiting lobby. Kicked sessions are revoked.
- Only the owner can start a game. A running game cannot be overwritten.
- Role and hand information is shared only with its rightful player when it is secret.
- Player-count limits are enforced server-side.
- In-memory rooms do not survive process restarts. No permanent bans or automated AFK resolution.
- Game mechanics and original content have not been licensed or certified by these publishers.

## Automated and manual verification

The GitHub workflow runs game engine tests, API integration checks, scoring/exception tests, secrecy view tests, UI smoke tests and in-app rules-guide checks. These tests **do not replace** full two-device Android QA or guarantee coverage of all malformed/concurrent inputs.

**Remaining priorities:** (1) host-controlled idle-player recovery rules, (2) durable state storage, (3) fuller original question banks, (4) optional in-game voice chat, (5) optional classic board variants for people who explicitly want published commercial-rule parity.

## v0.5.8 additional edge-case verification

- **Hidden Word:** In the seven-/eight-player special rule, the topic grid stays face down during the Chameleon's last guess, matching the original rules' instruction to hide it after the clue phase. The mobile screen accepts a typed guess without leaking the topic list. Earlier wrong guesses cannot be repeated.
- **Five in a Row:** The custom board now has an explicit legal-pass rule when no playable card or exchange is possible. Every player passing consecutively produces a draw; playable cards and available exchanges prevent passing. This is a Moonlit house rule to avoid an unwinnable blocked turn.
- **Coup / Spyfall:** Verified the prior v0.5.7 refund and pause-time implementations and retained the original Spyfall rule that a successfully accusing player earns an extra point, including in final nominations.

Regression tests cover these cases. Live multi-device testing and disconnect recovery are still separate tasks.
