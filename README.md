# Flappy Bird — Trac Network Arcade

This folder contains a web-native Flappy Bird remix inspired by the Trac competition plan: a playable canvas experience with coins, TNKc-backed upgrades, NFT skin previews, and a leaderboard that can be shared over Trac Intercom sidechannels.

> [!NOTE]
> Developer's TNK address: `trac1ee69dcdf76s4xxd84en9l7hwkjekmccw8ysv69yvxeky75nr645s2uhptk`

## Features
- **Game core**: Classic gravity-based flight, scrolling pipes, responsive input (spacebar / tap), and infinite progression.
- **Coin economy**: Collect a TNKc coin after every 3–5 pipes, and apply a configurable multiplier (Levels 1–5) to each pickup.
- **Upgrade system**: Spend coins to raise the multiplier (100 → 2x up to 2000 → 6x) or to purchase up to four extra lives for a total of five.
- **Skins as NFTs**: Preview all 15 skins (Classic, Blue, Green, Yellow, Pink, Rainbow, Gold, Silver, Bronze, Ninja, Pirate, Astronaut, Superhero, Zombie, Unicorn). Selecting one updates the canvas bird color and persists the choice.
- **Leaderboard & persistence**: Scores persist via `localStorage` and surface in the sidebar with wallet-aware labels. The leaderboard can be copied and shared over Trac sidechannels or SC-Bridge.
- **Trac readiness**: The UI calls out the `0000intercom` sidechannel, the TNKc upgrade logic, and the official payment address `trac1ee69dcdf76s4xxd84en9l7hwkjekmccw8ysv69yvxeky75nr645s2uhptk` so rewards and NFT minting can be wired later.

## Getting started
1. **Serve the folder** (static server only):
   ```bash
   npx http-server -c-1 .
   # or
   python -m http.server 8080
   ```
2. Open `http://localhost:8080` (or whatever port your server prints) in a browser that supports `window.ethereum` if you want to connect MetaMask/WalletConnect.
3. Use `Space`, the up arrow, or tap/click the canvas to flap, collect coins, and unlock upgrades once you have enough TNKc.

## Persistence & proof
- `localStorage` keys are namespaced with `tracFlappy*` for coins, upgrades, skin, leaderboard, and wallet state.
- Drop screenshots/videos into `proof/screenshots` and `proof/videos` before submission.
- The wallet area displays connected Ethereum addresses so the leaderboard can track real traders, and the state persists across reloads.

## Trac integration notes
- Sidebar copy references `0000intercom` because the intended multiplayer layer runs over Intercom sidechannels.
- Upgrade logic, coins, NFT skins, and leaderboard snapshots are checkpoints for future contract/sidechannel integrations (TNKc token recognized for purchases, NFTs represented by the 15 skins, and the leaderboard ready to be published via SC-Bridge updates).
- Developer Trac address: `trac1ee69dcdf76s4xxd84en9l7hwkjekmccw8ysv69yvxeky75nr645s2uhptk`.

## Testing & next steps
- No automated tests yet; exercise the canvas manually and confirm coins, upgrades, skin selection, and leaderboard entries persist.
- Future work: connect upgrades to smart contracts, publish leaderboard updates via a sidechannel bridge, and wire multiplayer matchmaking through Intercom.
