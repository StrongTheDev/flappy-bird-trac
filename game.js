const STORAGE_KEYS = {
  coins: 'tracFlappyCoins',
  multiplier: 'tracFlappyMultiplier',
  extraLives: 'tracFlappyExtraLives',
  skin: 'tracFlappySkin',
  leaderboard: 'tracFlappyLeaderboard',
  wallet: 'tracFlappyWallet',
};

const skins = [
  { key: 'classic-red', name: 'Classic Red Bird', primary: '#ff4b4b', secondary: '#ffd8d8' },
  { key: 'blue', name: 'Blue Bird', primary: '#4ab3ff', secondary: '#e9f3ff' },
  { key: 'green', name: 'Green Bird', primary: '#42d776', secondary: '#d7ffe7' },
  { key: 'yellow', name: 'Yellow Bird', primary: '#ffe249', secondary: '#fff8d5' },
  { key: 'pink', name: 'Pink Bird', primary: '#ff7ac2', secondary: '#ffe8f3' },
  { key: 'rainbow', name: 'Rainbow Bird', primary: '#ff4ec5', secondary: '#42f591' },
  { key: 'gold', name: 'Gold Bird', primary: '#ffd166', secondary: '#fff1c2' },
  { key: 'silver', name: 'Silver Bird', primary: '#cbd5ff', secondary: '#f2f5ff' },
  { key: 'bronze', name: 'Bronze Bird', primary: '#c77b41', secondary: '#ffe7d2' },
  { key: 'ninja', name: 'Ninja Bird', primary: '#1f1f2d', secondary: '#53536c' },
  { key: 'pirate', name: 'Pirate Bird', primary: '#3c1f54', secondary: '#f0c4ff' },
  { key: 'astronaut', name: 'Astronaut Bird', primary: '#7dd3fe', secondary: '#c4f2ff' },
  { key: 'superhero', name: 'Superhero Bird', primary: '#ff2848', secondary: '#ff8c80' },
  { key: 'zombie', name: 'Zombie Bird', primary: '#6fe56f', secondary: '#d2ffd2' },
  { key: 'unicorn', name: 'Unicorn Bird', primary: '#f8d5ff', secondary: '#ffe4ff' },
];

const multiplierTiers = [
  { level: 1, multiplier: 2, price: 100 },
  { level: 2, multiplier: 3, price: 250 },
  { level: 3, multiplier: 4, price: 500 },
  { level: 4, multiplier: 5, price: 1000 },
  { level: 5, multiplier: 6, price: 2000 },
];

const extraLifeCosts = [150, 225, 325, 450];

const defaultLeaderboard = [
  { name: 'TracBird', score: 240, ts: Date.now() - 40000 },
  { name: 'Sidechannel', score: 185, ts: Date.now() - 80000 },
  { name: 'AgentZero', score: 150, ts: Date.now() - 140000 },
  { name: 'MetaGamer', score: 132, ts: Date.now() - 200000 },
  { name: 'NeonOrbit', score: 110, ts: Date.now() - 260000 },
];

const GameState = {
  Idle: 'idle',
  Playing: 'playing',
  LifeLost: 'life-lost',
  GameOver: 'game-over',
};

const BASE_WIDTH = 720;
const BASE_HEIGHT = 500;
const GAME_SPEED_SCALE = 0.3;
const GRAVITY = 0.41;
const FLAP_STRENGTH = -2.3;
const PIPE_WIDTH = 74;
const GROUND_HEIGHT = 58;
const COIN_RADIUS = 10;
const coinBaseValue = 1;

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const overlay = document.getElementById('overlayText');
const scoreValue = document.getElementById('scoreValue');
const coinsValue = document.getElementById('coinsValue');
const livesValue = document.getElementById('livesValue');
const multiplierInfo = document.getElementById('multiplierInfo');
const extraLifeInfo = document.getElementById('extraLifeInfo');
const multiplierButton = document.getElementById('multiplierButton');
const livesButton = document.getElementById('livesButton');
const walletButton = document.getElementById('walletButton');
const walletStatus = document.getElementById('walletStatus');
const skinGrid = document.getElementById('skinGrid');
const leaderboardList = document.getElementById('leaderboardList');

const canUseStorage = (() => {
  try {
    const storage = window.localStorage;
    const testKey = '__trac_flappy_storage_test__';
    storage.setItem(testKey, testKey);
    storage.removeItem(testKey);
    return storage;
  } catch (err) {
    console.warn('Local storage unavailable:', err?.message ?? err);
    return null;
  }
})();

const state = {
  coins: 0,
  multiplierLevel: 1,
  extraLivesBought: 0,
  selectedSkin: skins[0].key,
  leaderboard: [...defaultLeaderboard],
  walletAddress: null,
  currentScore: 0,
  remainingLives: 1,
  pipes: [],
  coinsInPlay: [],
  spawnMeter: 0,
  pipesUntilCoin: 4,
  bird: createBird(),
  status: GameState.Idle,
};

function loadNumber(key, fallback) {
  if (!canUseStorage) return fallback;
  const raw = canUseStorage.getItem(key);
  if (raw === null) return fallback;
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function loadJson(key, fallback) {
  if (!canUseStorage) return fallback;
  const raw = canUseStorage.getItem(key);
  if (!raw) return fallback;
  try {
    return JSON.parse(raw);
  } catch (err) {
    console.warn('Unable to parse', key, err?.message ?? err);
    return fallback;
  }
}

function persistNumber(key, value) {
  if (!canUseStorage) return;
  canUseStorage.setItem(key, String(value));
}

function persistJson(key, value) {
  if (!canUseStorage) return;
  canUseStorage.setItem(key, JSON.stringify(value));
}

function saveState() {
  persistNumber(STORAGE_KEYS.coins, state.coins);
  persistNumber(STORAGE_KEYS.multiplier, state.multiplierLevel);
  persistNumber(STORAGE_KEYS.extraLives, state.extraLivesBought);
  const skinIndex = Math.max(0, skins.findIndex((skin) => skin.key === state.selectedSkin));
  persistNumber(STORAGE_KEYS.skin, skinIndex);
  persistJson(STORAGE_KEYS.leaderboard, state.leaderboard);
  persistJson(STORAGE_KEYS.wallet, state.walletAddress);
}

function loadState() {
  state.coins = loadNumber(STORAGE_KEYS.coins, 0);
  state.multiplierLevel = clamp(loadNumber(STORAGE_KEYS.multiplier, 1), 1, multiplierTiers.length);
  state.extraLivesBought = clamp(loadNumber(STORAGE_KEYS.extraLives, 0), 0, extraLifeCosts.length);
  const storedSkinIndex = clamp(loadNumber(STORAGE_KEYS.skin, 0), 0, skins.length - 1);
  state.selectedSkin = skins[storedSkinIndex].key;
  state.leaderboard = loadJson(STORAGE_KEYS.leaderboard, state.leaderboard);
  const savedWallet = loadJson(STORAGE_KEYS.wallet, null);
  state.walletAddress = typeof savedWallet === 'string' ? savedWallet : null;
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function createBird() {
  return {
    x: BASE_WIDTH * 0.18,
    y: BASE_HEIGHT * 0.46,
    radius: 20,
    velocity: 0,
  };
}

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function formatCurrency(value) {
  return `${value.toLocaleString('en-US')} TNKc`;
}

function formatAddress(address) {
  if (!address) return 'anonymous';
  if (address.length <= 10) return address;
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

function getMaxLives() {
  return 1 + state.extraLivesBought;
}

function setOverlay(message) {
  if (!message) {
    overlay.classList.add('hidden');
    overlay.textContent = '';
    return;
  }
  overlay.textContent = message;
  overlay.classList.remove('hidden');
}

function updateScoreDisplay() {
  scoreValue.textContent = String(state.currentScore);
}

function updateCoinsDisplay() {
  coinsValue.textContent = formatCurrency(state.coins);
}

function updateLivesDisplay() {
  livesValue.textContent = `${state.remainingLives} / ${getMaxLives()}`;
}

function updateUpgradeUI() {
  const currentTier = multiplierTiers.find((tier) => tier.level === state.multiplierLevel);
  const nextTier = multiplierTiers.find((tier) => tier.level === state.multiplierLevel + 1);
  if (currentTier) {
    multiplierInfo.textContent = `${currentTier.multiplier}x (Level ${currentTier.level})`;
  }
  if (nextTier) {
    multiplierButton.textContent = `Upgrade (${nextTier.multiplier}x ≈ ${nextTier.price} TNKc)`;
    multiplierButton.disabled = state.coins < nextTier.price;
  } else {
    multiplierButton.textContent = 'Maxed';
    multiplierButton.disabled = true;
  }

  const bought = state.extraLivesBought;
  extraLifeInfo.textContent = `${1 + bought} / 5 lives`;
  const nextCost = extraLifeCosts[bought];
  if (nextCost && bought < extraLifeCosts.length) {
    livesButton.textContent = `Buy extra (${nextCost} TNKc)`;
    livesButton.disabled = state.coins < nextCost;
  } else {
    livesButton.textContent = 'Lives maxed';
    livesButton.disabled = true;
  }
}

function renderSkins() {
  if (!skinGrid) return;
  skinGrid.innerHTML = '';
  skins.forEach((skin) => {
    const card = document.createElement('button');
    card.type = 'button';
    card.className = 'skin-card';
    if (skin.key === state.selectedSkin) card.classList.add('selected');
    const colorBlock = document.createElement('div');
    colorBlock.className = 'skin-color';
    colorBlock.style.background = `linear-gradient(135deg, ${skin.primary}, ${skin.secondary})`;
    const label = document.createElement('p');
    label.className = 'skin-name';
    label.textContent = skin.name;
    card.appendChild(colorBlock);
    card.appendChild(label);
    card.addEventListener('click', () => {
      state.selectedSkin = skin.key;
      saveState();
      renderSkins();
    });
    skinGrid.appendChild(card);
  });
}

function updateLeaderboardUI() {
  if (!leaderboardList) return;
  leaderboardList.innerHTML = '';
  const board = state.leaderboard.slice(0, 5);
  board.forEach((entry, index) => {
    const li = document.createElement('li');
    li.textContent = `${index + 1}. ${entry.score} - ${entry.name}`;
    leaderboardList.appendChild(li);
  });
}

function updateWalletStatus() {
  if (!walletStatus || !walletButton) return;
  if (state.walletAddress) {
    walletStatus.textContent = `connected ${formatAddress(state.walletAddress)}`;
    walletButton.textContent = 'Refresh Wallet';
  } else {
    walletStatus.textContent = 'wallet idle';
    walletButton.textContent = 'Connect Wallet';
  }
}

function connectWallet() {
  if (!walletButton) return;
  if (window.ethereum) {
    walletButton.disabled = true;
    walletButton.textContent = 'connecting...';
    window.ethereum
      .request({ method: 'eth_requestAccounts' })
      .then((accounts) => {
        state.walletAddress = accounts?.[0] ?? null;
        updateWalletStatus();
        saveState();
      })
      .catch((err) => {
        console.warn('Wallet connection failed', err?.message ?? err);
        walletStatus.textContent = 'wallet connection failed';
      })
      .finally(() => {
        walletButton.disabled = false;
        updateWalletStatus();
      });
  } else {
    walletStatus.textContent = 'MetaMask / WalletConnect supported (not required)';
  }
}

function purchaseMultiplier() {
  const nextTier = multiplierTiers.find((tier) => tier.level === state.multiplierLevel + 1);
  if (!nextTier) return;
  if (state.coins < nextTier.price) return;
  state.coins -= nextTier.price;
  state.multiplierLevel = nextTier.level;
  saveState();
  updateCoinsDisplay();
  updateUpgradeUI();
}

function purchaseExtraLife() {
  if (state.extraLivesBought >= extraLifeCosts.length) return;
  const price = extraLifeCosts[state.extraLivesBought];
  if (state.coins < price) return;
  state.coins -= price;
  state.extraLivesBought += 1;
  state.remainingLives = Math.min(state.remainingLives + 1, getMaxLives());
  saveState();
  updateCoinsDisplay();
  updateLivesDisplay();
  updateUpgradeUI();
}

function recordScore(score) {
  if (score <= 0) return;
  const entry = {
    name: formatAddress(state.walletAddress),
    score,
    ts: Date.now(),
  };
  const merged = [...state.leaderboard, entry];
  merged.sort((a, b) => b.score - a.score || a.ts - b.ts);
  state.leaderboard = merged.slice(0, 5);
  saveState();
  updateLeaderboardUI();
}

function resetRound() {
  state.pipes = [];
  state.coinsInPlay = [];
  state.spawnMeter = 0;
  state.pipesUntilCoin = randomInt(3, 5);
  state.bird = createBird();
  state.currentScore = 0;
  updateScoreDisplay();
}

function startRun(resetLives = false) {
  resetRound();
  if (resetLives) {
    state.remainingLives = getMaxLives();
  }
  setOverlay('');
  state.status = GameState.Playing;
  updateLivesDisplay();
}

function triggerDeath() {
  if (state.status !== GameState.Playing) return false;
  state.remainingLives -= 1;
  updateLivesDisplay();
  if (state.remainingLives <= 0) {
    state.status = GameState.GameOver;
    recordScore(state.currentScore);
    setOverlay('Game over — Press Space to restart');
    return true;
  }
  state.status = GameState.LifeLost;
  resetRound();
  setOverlay(`Life lost — ${state.remainingLives} left. Tap to continue`);
  return true;
}

function handleInteraction() {
  if (state.status === GameState.Playing) {
    flapBird();
    return;
  }
  if (state.status === GameState.LifeLost) {
    state.status = GameState.Playing;
    setOverlay('');
    return;
  }
  if (state.status === GameState.GameOver || state.status === GameState.Idle) {
    startRun(true);
  }
}

function flapBird() {
  state.bird.velocity = FLAP_STRENGTH;
}

function spawnPipe() {
  const spacingLimit = BASE_HEIGHT - GROUND_HEIGHT - 120;
  const gapHeight = 140 + Math.random() * 40;
  const top = 40 + Math.random() * (spacingLimit - gapHeight);
  state.pipes.push({
    x: BASE_WIDTH + PIPE_WIDTH,
    width: PIPE_WIDTH,
    gapY: top,
    gapHeight,
    scored: false,
  });
  state.pipesUntilCoin -= 1;
  if (state.pipesUntilCoin <= 0) {
    spawnCoin(state.pipes[state.pipes.length - 1]);
    state.pipesUntilCoin = randomInt(3, 5);
  }
}

function spawnCoin(pipe) {
  const midGap = pipe.gapY + pipe.gapHeight / 2;
  const shift = (Math.random() - 0.5) * 40;
  state.coinsInPlay.push({
    x: pipe.x + pipe.width / 2,
    y: clamp(midGap + shift, pipe.gapY + COIN_RADIUS, pipe.gapY + pipe.gapHeight - COIN_RADIUS),
  });
}

function updateGame(delta) {
  if (state.status !== GameState.Playing) return;
  const scaledDelta = delta * GAME_SPEED_SCALE;
  const speed = (2.6 + Math.min(state.currentScore * 0.02, 3.4)) * GAME_SPEED_SCALE;
  const spacing = clamp(115 - state.currentScore * 0.4, 70, 110);
  state.spawnMeter += speed * scaledDelta * 12;
  if (state.spawnMeter >= spacing) {
    spawnPipe();
    state.spawnMeter = 0;
  }

  state.bird.velocity += GRAVITY * scaledDelta;
  state.bird.y += state.bird.velocity * scaledDelta * 14;

  if (state.bird.y + state.bird.radius >= BASE_HEIGHT - GROUND_HEIGHT) {
    if (triggerDeath()) return;
  }
  if (state.bird.y - state.bird.radius <= 0) {
    state.bird.y = state.bird.radius;
    state.bird.velocity = 0;
  }

  const moveDistance = speed * scaledDelta * 16;
  for (const pipe of state.pipes) {
    pipe.x -= moveDistance;
    if (!pipe.scored && pipe.x + pipe.width < state.bird.x) {
      pipe.scored = true;
      state.currentScore += 1;
      updateScoreDisplay();
    }
    if (
      state.bird.x + state.bird.radius > pipe.x &&
      state.bird.x - state.bird.radius < pipe.x + pipe.width &&
      (state.bird.y - state.bird.radius < pipe.gapY || state.bird.y + state.bird.radius > pipe.gapY + pipe.gapHeight)
    ) {
      if (triggerDeath()) return;
      break;
    }
  }
  if (state.status !== GameState.Playing) return;

  state.pipes = state.pipes.filter((pipe) => pipe.x + pipe.width > -40);

  const multiplier = multiplierTiers.find((tier) => tier.level === state.multiplierLevel)?.multiplier ?? 1;
  state.coinsInPlay = state.coinsInPlay.filter((coin) => {
    coin.x -= moveDistance;
    const dx = state.bird.x - coin.x;
    const dy = state.bird.y - coin.y;
    const distance = Math.hypot(dx, dy);
    if (distance < state.bird.radius + COIN_RADIUS) {
      const gain = coinBaseValue * multiplier;
      state.coins += gain;
      updateCoinsDisplay();
      saveState();
      updateUpgradeUI();
      return false;
    }
    return coin.x > -40;
  });
}

function drawGame() {
  if (!ctx) return;
  ctx.clearRect(0, 0, BASE_WIDTH, BASE_HEIGHT);
  drawBackground();

  state.pipes.forEach((pipe) => {
    ctx.fillStyle = '#113e26';
    ctx.fillRect(pipe.x, 0, pipe.width, pipe.gapY);
    ctx.fillRect(pipe.x, pipe.gapY + pipe.gapHeight, pipe.width, BASE_HEIGHT - pipe.gapY - pipe.gapHeight - GROUND_HEIGHT);
    ctx.fillStyle = '#0c643d';
    ctx.fillRect(pipe.x + 10, pipe.gapY + pipe.gapHeight, pipe.width - 20, 12);
  });

  state.coinsInPlay.forEach((coin) => {
    ctx.fillStyle = '#ffd166';
    ctx.beginPath();
    ctx.arc(coin.x, coin.y, COIN_RADIUS, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.lineWidth = 2;
    ctx.stroke();
  });

  drawBird();
  drawGround();
}

function drawBackground() {
  const gradient = ctx.createLinearGradient(0, 0, 0, BASE_HEIGHT);
  gradient.addColorStop(0, '#0f172a');
  gradient.addColorStop(1, '#040710');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, BASE_WIDTH, BASE_HEIGHT);
}

function drawGround() {
  ctx.fillStyle = '#0b111f';
  ctx.fillRect(0, BASE_HEIGHT - GROUND_HEIGHT, BASE_WIDTH, GROUND_HEIGHT);
  ctx.fillStyle = '#141c2e';
  ctx.fillRect(0, BASE_HEIGHT - GROUND_HEIGHT - 8, BASE_WIDTH, 8);
}

function drawBird() {
  const skin = skins.find((entry) => entry.key === state.selectedSkin) ?? skins[0];
  ctx.save();
  const tilt = clamp(state.bird.velocity * 0.08, -0.5, 0.6);
  ctx.translate(state.bird.x, state.bird.y);
  ctx.rotate(tilt);
  ctx.fillStyle = skin.primary;
  ctx.beginPath();
  ctx.ellipse(0, 0, state.bird.radius * 1.1, state.bird.radius, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = skin.secondary;
  ctx.beginPath();
  ctx.ellipse(state.bird.radius * 0.3, -state.bird.radius * 0.3, state.bird.radius * 0.5, state.bird.radius * 0.4, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function loop(timestamp) {
  const delta = lastTimestamp ? clamp((timestamp - lastTimestamp) / (1000 / 60), 0.5, 2) : 1;
  lastTimestamp = timestamp;
  updateGame(delta);
  drawGame();
  requestAnimationFrame(loop);
}

let lastTimestamp = 0;

function init() {
  loadState();
  state.remainingLives = getMaxLives();
  resetRound();
  setOverlay('Press Space / Tap to flap');
  renderSkins();
  updateUpgradeUI();
  updateCoinsDisplay();
  updateScoreDisplay();
  updateLivesDisplay();
  updateLeaderboardUI();
  updateWalletStatus();

  multiplierButton?.addEventListener('click', purchaseMultiplier);
  livesButton?.addEventListener('click', purchaseExtraLife);
  walletButton?.addEventListener('click', connectWallet);

  document.addEventListener('keydown', (event) => {
    if (event.code === 'Space' || event.code === 'ArrowUp') {
      event.preventDefault();
      handleInteraction();
    }
  });
  canvas?.addEventListener('mousedown', () => handleInteraction());
  canvas?.addEventListener('touchstart', (event) => {
    event.preventDefault();
    handleInteraction();
  });

  window.addEventListener('resize', resizeCanvas);
  resizeCanvas();
  requestAnimationFrame(loop);
}

function resizeCanvas() {
  const ratio = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = BASE_WIDTH * ratio;
  canvas.height = BASE_HEIGHT * ratio;
  canvas.style.width = '100%';
  canvas.style.height = 'auto';
  ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
}

init();
// Isaiah 43 (BSB):
// [18] “Do not call to mind the former things; pay no attention to the things of old. 