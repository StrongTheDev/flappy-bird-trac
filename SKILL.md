---
name: flappy-bird-trac
description: Front-end companion for the Trac Flappy Bird competition submission.
---

# Flappy Bird Trac Skill

## Purpose
This skill documents how to run the static Flappy Bird prototype that demonstrates the plan's gameplay loop, coin economy, upgrade UI, and leaderboard persistence. It is intentionally decoupled from the `pear` runtime because it only exposes a browser client.

## Quick start
1. Open a port-exposing server from this directory. Example commands are:
   ```bash
   npx http-server -c-1 .
   # or
   python -m http.server 8080
   ```
2. Visit the printed URL (typically `http://localhost:8080/`). The canvas starts in idle mode with an overlay that says “Press Space / Tap to flap.”
3. Press `Space`, `ArrowUp`, or tap/click the canvas to start. Flap the bird through the pipes, collect coins, and spend TNK inside the sidebar upgrade panel.
4. Use the skin grid to preview the 15 NFT birds and the leaderboard to verify persistence. The wallet button connects MetaMask/WalletConnect (if present) and prefixes leaderboard names with the truncated address.

## Notes
- Coins are denominated in TNK. Upgrade costs follow the spec in `game.js` and are persisted to `localStorage` keys guarded by the `tracFlappy*` namespace.
- The UI calls out the `0000intercom` sidechannel and the payment address `trac1ee69dcdf76s4xxd84en9l7hwkjekmccw8ysv69yvxeky75nr645s2uhptk` to explain where future contract/state updates should land.
- Capture evidence of the running game by dropping screenshots/videos into `proof/screenshots` and `proof/videos`.

## Verification
- Player input, coin pickup, and scoring are handled in `game.js`.
- Local storage keys: `tracFlappyCoins`, `tracFlappyMultiplier`, `tracFlappyExtraLives`, `tracFlappySkin`, `tracFlappyLeaderboard`, and `tracFlappyWallet`.
- The leaderboard CLI state is ready to be exported for sharing over SC-Bridge/sidechannels.
