# Arch
A self-hosted game library and media site with a dark liquid-glass interface.

## Run locally
1. Install [Node.js](https://nodejs.org/) 18 or later.
2. From the project folder, run `npm install`.
3. Run `npm start`.
4. Open [http://localhost:3000](http://localhost:3000).

The server uses port `3000` by default. Set the `PORT` environment variable to use a different port.

On each new tab session, accept the use notice and choose a guest username to continue. Guest profile details and starter stats are temporary for that tab only; no account or server-side data is saved. Declining clears the site view.

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

## Credits
- [Ultraviolet](https://github.com/titaniumnetwork-dev/Ultraviolet) - proxy code + uv setup
- [55gms](https://github.com/55GMS/55gms) - bunch of games
- [truffled](https://truffled.lol) - games
