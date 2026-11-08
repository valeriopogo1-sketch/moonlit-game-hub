# Moonlit Game Hub

A mobile-first, installable multiplayer web app with **seven** original-style party games.

## Games

- **Moonlit Wolves** (3–10 players): One-night hidden-role deduction, night actions, voting, and team victory checks.
- **Five in a Row** (2–4 players): An original Sequence-style card-and-board game with a matching-symbol 8×8 board, special cards, and five-connected victory.
- **Organ Mayhem** (2–6 players): An original attack/defend card game with a shared 20-card unique organ deck, five-card private hands, matching afflictions, wild attacks, instant defensive cards, legal two-card discards, and last-survivor victory.
- **Court of Bluffs** (Coup-style; 2–6 players): Influence, coins, Duke/Assassin/Captain/Ambassador/Contessa, bluffs, challenges, counteractions, and elimination.
- **Secret Location** (Spyfall-style; 3–8 players): Secret spy/location roles, eight-minute rounds, accusations, final voting and five-round scoring.
- **Hidden Word** (Chameleon-style; 3–8 players): Secret word, one-word clues, voting, guesses, cumulative points to five.
- **Fish Frenzy** (Sounds Fishy-style; 4–10 players): One true answer, fake answers, sequential catch/bank actions and scoring.

These are independently styled games with original names and graphics. They are not licensed reproductions of commercial games.

See [GAME_RULES.md](GAME_RULES.md) for the verified source references, full action lists, scoring variants and limitations. **Fish Frenzy currently assumes that “Something Fishy” means the bluffing game Sounds Fishy;** if you meant the separate 2004 fish-collecting game, that needs a different rule engine.

## Run locally

```bash
npm install
npm test
npm start
```

Open http://localhost:3000. Room links use the host's reachable address. For internet multiplayer and reliable PWA installation, deploy over HTTPS.

## Render deployment

Create a **Web Service** from this GitHub repository:

- Runtime: Node
- Build: `npm install`
- Start: `npm start`
- Environment: `PORT` is supplied by Render

See [DEPLOY.md](DEPLOY.md) for details.

## Current limitations

- Rooms, players, and matches are stored in server memory and disappear on restart.
- Guests have session tokens stored per browser tab; no account system.
- Voice chat is not built in. Use a call alongside the game.
- Local Wi-Fi play needs one device running the Node server. Browser-only PWA cannot host the server by itself.
- These are early playable prototypes. Device-to-device tests and abuse/security hardening are still needed.

## Shared technical foundation

Node.js HTTP server with Server-Sent Events for state updates, server-side action validation, private game hands/roles, mobile interface, and PWA offline shell caching. Current games still require a running host server.

## Future

Reconnect persistence, automated tests with multiple devices, timer tuning, expanded roles and cards, customizable rules, and host migration.

## Organ Mayhem notes (v0.2.1)

- Each organ is unique across the room, dealt face-up. Whoever receives the Wild Organ acts first.
- Instant Guard can be played outside your normal turn. Instant Block can undo the most recent hit against you and provides a response before a lethal final hit is confirmed.
- If you have no normal playable card, discard **one or two** selected cards and draw replacements; this consumes your turn. The discard button is disabled when a normal card is legally playable.
- The deck has original simplified card effects. This is **not** a complete licensed edition of The Awkward Yeti's commercial OrganATTACK!, and other named special cards and expansions are not yet implemented.
- Card games in progress on a memory-only host reset after a server restart or deployment. Start a new room after updating.

## Room browser and host controls (v0.3.0)

- Rooms are **public by default**. The home screen's **Browse Rooms** lists public waiting, full, and in-progress games, with game type, host nickname, player count, and status. Only waiting rooms have a Join button.
- The room owner can toggle **Public** or **Private** in the waiting lobby. Private rooms can still be joined through their six-character code or invitation link but are omitted from public listings.
- The owner can **Kick** another player while the room is waiting. Kicking immediately removes the player, revokes their guest session token, and tells their open browser that they were removed. The owner cannot kick themselves. Kicks are disabled after the game starts to prevent corruption of active matches.
- Public lists intentionally include room codes and host display names but never expose game secrets, cards, session tokens, or hidden-role data.
- **Limitation:** Guest-only accounts do not offer permanent bans: a removed player could rejoin with a new nickname/session or a shared invitation. Permanent blocking would require authenticated accounts or additional moderation controls.
- All rooms still live in memory; public listings clear when the server restarts.
