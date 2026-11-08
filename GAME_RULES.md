# New Games — verified rules and implementation notes

This is an independent multiplayer implementation with original names, original topic/location lists, and original sample questions. We do not reproduce copyrighted card artwork or the publishers' question decks.

## Court of Bluffs (Coup-style, 2–6 players)

**Sources:** [Publisher](https://indieboardsandcards.com/our-games/coup/), [Dized publisher-verified rules](https://rules.dized.com/game/xzsTtI3VTV-2wvos3otxIg/coup), [Rules PDF](https://www.northstreetgames.com/images/Rulebooks/Coup-Rules.pdf).

- Fifteen cards: three each of Duke, Assassin, Captain, Ambassador and Contessa. Two influence cards and two coins per player, except the first player in a two-player game starts with one coin.
- General actions: Income (+1), Foreign Aid (+2, blocked by Duke), Coup (7 coins; victim chooses one influence to reveal; cannot be blocked or challenged).
- Duke Tax (+3); Assassin Assassinate (cost 3; blocked by Contessa); Captain Steal (up to 2 coins; blocked by Captain or Ambassador); Ambassador Exchange (draw two, keep influence count, return remaining).
- Claims can be bluffing. Rivals may challenge, and a proven claim causes the challenger to lose influence; the proven role is reshuffled into the court deck and replaced. A false claim causes its claimant to lose influence and cancels the action.
- Blocks can also be challenged. Character action challenges precede blocks.
- At ten or more coins, the active player must Coup. Last living influence wins.
- Mobile interface includes private roles, challenges, block declarations, selecting revealed influence, and exchanging cards.

## Secret Location (Spyfall-style, 3–8 players)

**Sources:** [Cryptozoic publisher](https://cryptozoic.com/products/spyfall-game), [original rulebook](https://reglur.spilavinir.is/Spyfall_rules_ENG.pdf).

- Eight-minute rounds; one spy without the location; others know the location and receive individually assigned roles.
- Questions and answers occur verbally; the person answering then asks another player (not the person who just asked).
- During timed play, each player can initiate one accusation. Everyone except the accused must agree unanimously; an unsuccessful accusation returns to the discussion.
- During timed play the spy may reveal themselves and guess the location. Correct means spy victory; incorrect means non-spy victory.
- After time expires, the group can conduct a final sequence of unanimous suspect votes. If no suspect is convicted, the spy wins.
- Five rounds by default. Spy earns 2 for a timed-out win, 4 for a correct location guess or wrongly convicted civilian. Non-spies earn 1 each on success, with one extra to a player whose successful mid-round accusation caught the spy.
- Location and role information are private. Questions take place through external voice chat; in-app voice chat is not included.

## Hidden Word (The Chameleon-style, 3–8 players)

**Sources:** [Big Potato publisher](https://bigpotato.com/products/the-chameleon), [original instructions](https://www.themindcafe.sg/wp-content/uploads/2019/03/The-Chameleon.pdf).

- One Chameleon does not know the secret word. Everyone sees one of our original 16-word topic grids; regular players see the chosen secret word.
- Starting with the dealer, each player gives one clue word clockwise. Then players vote for a suspect. Dealer breaks a tied result.
- If the Chameleon is caught, they can guess the secret word once (twice with three players). Correct guess saves the Chameleon.
- At seven or eight players, the topic grid is concealed during the debate/vote.
- Optional official scoring is enabled: unseen Chameleon 2; caught Chameleon who guesses correctly 1; uncaught group if Chameleon fails 2 each; first to 5 wins. The previous Chameleon becomes next dealer.

## Fish Frenzy (Sounds Fishy-style, 4–10 players)

**Sources:** [Big Potato publisher](https://bigpotato.com/products/sounds-fishy), [rule guide](https://happypiranha.com/blogs/board-game-rules/how-to-play-sounds-fishy-board-game-rules), [rules PDF](https://gameon.mt/wp-content/uploads/2025/11/Sounds_Fishy_Rules.pdf).

- This adaptation assumes the requested name "Something Fishy" refers to **Sounds Fishy**, the social bluffing game. If the intended game was the separate 2004 *Somethin' Fishy* fish-collecting card game, this is **not** its ruleset.
- One Guesser, one True Blue fish who gives the correct answer, and all other fish are Red Herrings who invent false answers.
- Guesser catches suspected liars one at a time: +1 per red, +1 bonus if all red fish are caught and blue stays hidden. Catching blue at any time gives the Guesser 0 round points. Guesser may bank instead of continuing.
- Red Herrings not flipped score one point per fish flipped; flipped Red Herrings score 0. A flipped True Blue scores one point per fish still facedown; if Blue was not flipped, they score 0.
- Guesser rotates each round: 4–5 players guess twice each, 6–10 once each. Highest total score wins.
- Questions are original, not copied from the official card deck.

## Shared systems

New game modes use the existing guest-nickname lobby, public rooms, private room option, room owner kicking, invite links, server-side actions, and mobile PWA interface. All four use the existing Render-capable Node.js server.

**Limitations:** In-memory rooms disappear on server restart. Live multi-device QA remains necessary. These are independent adaptations, not licensed editions, and the physical games may have additional variants, expansions, components, and editorial rulings that are not included.

### Fish Frenzy Force Start (v0.4.2)

The room owner can use **Force Start** with **2 or 3 human players**, while the normal Start button still requires 4. With two participants, the sole answering human is True Blue and the server adds one fake answer from its original question bank. Both answers are shuffled and presented as anonymous Fish A/Fish B so the Guesser cannot identify the true answer from player names. This is a **house-rule digital adaptation**, not an official Sounds Fishy two-player rule. With three humans the game uses one human True Blue and one human Red Herring with no bot. Force Start is disabled for other games and can only be used by the room owner.
