# Deploy to Render

Create a Render **Web Service** connected to this repository. Runtime: Node. Build command: `npm install`. Start command: `npm start`. Set the service to listen on the provided PORT environment variable (server.js handles this). Use a publicly accessible HTTPS URL to install the PWA and share room links.

Rooms currently exist only in server memory, so restarts and cold starts erase rooms. This is an early prototype, not a production game service. Run `npm test` for game-engine checks.
