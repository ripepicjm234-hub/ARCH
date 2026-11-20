# Arch
A self-hosted game library and media site with a dark liquid-glass interface.

## Run locally
1. Install [Node.js](https://nodejs.org/) 18 or later.
2. From the project folder, run `npm install`.
3. Run `npm start`.
4. Open [http://localhost:3000](http://localhost:3000).

The server uses `127.0.0.1:3000` by default, so it is reachable only from the same computer. Set `PORT` to use another port. To allow other devices on your local network, set `HOST=0.0.0.0`; only do this on a trusted network.
The Ultraviolet proxy uses the app's local Bare server at `/bare/`; deploy on a Node.js host that supports WebSocket upgrades. Static hosting and serverless platforms without WebSocket support cannot run the Bare server themselves. For a serverless frontend such as Vercel, set `BARE_URL` to an HTTPS Bare server URL ending in `/` (for example, `https://your-node-host.example/bare/`).

On each new tab session, accept the use notice and choose a guest username to continue. Guest profiles can include a picture, track games launched and favorites, and download a profile report with those details. All profile data stays temporary in that tab only; no account or server-side data is saved. Declining clears the site view.

Select **Take a tour** in the sidebar for a guided overview of Home, Games, Media, and Settings. The tour highlights each part as it explains it.

## Add a game
For a game you have permission to host, copy its files into `public/games/files/`. Keep the game's folder structure intact; for example, put the game's entry page at `public/games/files/my-game/index.html`. Add a thumbnail image under `public/games/thumbs/`, such as `my-game.jpg`.

Then add an entry to `public/games/games-list.json`:

```json
{
  "id": "my-game",
  "title": "My Game",
  "thumbnail": "/games/thumbs/my-game.jpg",
  "file": "/games/files/my-game/index.html"
}
```

Add the entry inside the JSON array, separating it from neighboring entries with a comma. The `id` should be unique. For a remotely hosted game instead, use a `url` field in place of `file`:

```json
{
  "id": "my-remote-game",
  "title": "My Remote Game",
  "thumbnail": "/games/thumbs/my-game.jpg",
  "url": "https://example.com/game"
}
```

Save the JSON and reload the Games page to see the new entry.

## Minecraft (Horizon)
The Games library launches Horizon from `/horizon/` when a packaged browser build is installed. Horizon does not include Minecraft resources; prepare them from your own Java Edition copy, then follow the [Horizon browser build guide](https://github.com/ripepicjm234-hub/horizon-web/blob/web/web/README.md) to build and package the web client. Copy the contents of `web/out/horizon-web/` into `public/horizon/`. The package requires a WebGPU-capable browser. Its Minecraft assets are for private use: do not expose them publicly or commit them to a public repository. Until the package is installed, the tile shows the setup page.

## Background
The animated background uses a lightweight CSS gradient effect inspired by [Ambient](https://github.com/ripepicjm234-hub/Ambient). Choose **Ambient**, **Ambient (slow)**, or **Minimal** in Settings to control the effect.

## Credits
- [Ultraviolet](https://github.com/titaniumnetwork-dev/Ultraviolet) - proxy code + uv setup
- [55gms](https://github.com/55GMS/55gms) - bunch of games
- [truffled](https://truffled.lol) - games
