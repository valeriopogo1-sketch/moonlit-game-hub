# Moonlit Game Hub

A mobile-first, installable multiplayer web app with three original party games.

## Games

- **Moonlit Wolves** (3–10 players): One-night hidden-role deduction, night actions, voting, and team victory checks.
- **Five in a Row** (2–4 players): An original Sequence-style card-and-board game with a matching-symbol 8×8 board, special cards, and five-connected victory.
- **Organ Mayhem** (2–6 players): An original attack/defend card game with four organs, strain, shields, healing, and player elimination.

These are independently styled games with original names and graphics. They are not licensed reproductions of commercial games.

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
