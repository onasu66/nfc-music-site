const elements = {
  player: document.querySelector(".player"),
  cover: document.querySelector("#cover"),
  editionMark: document.querySelector("#editionMark"),
  status: document.querySelector("#status"),
  title: document.querySelector("#title"),
  artist: document.querySelector("#artist"),
  description: document.querySelector("#description"),
  duration: document.querySelector("#duration"),
  currentTime: document.querySelector("#currentTime"),
  playButton: document.querySelector("#playButton"),
  seek: document.querySelector("#seek"),
  audio: document.querySelector("#audio"),
  cardKey: document.querySelector("#cardKey"),
  edition: document.querySelector("#edition"),
  format: document.querySelector("#format"),
};

let currentCard = null;
let synth = null;
let synthStartedAt = 0;
let synthOffset = 0;
let rafId = 0;

init();

async function init() {
  const cardKey = getCardKey();

  if (!cardKey) {
    renderLocked("Tap a programmed NFC card", "No card key was supplied.");
    return;
  }

  try {
    const response = await fetch(`/cards/${cardKey}.json`, { cache: "no-store" });
    if (!response.ok) {
      throw new Error(`Card key was rejected: ${response.status}`);
    }

    currentCard = await response.json();
    renderCard(currentCard, cardKey);
    bindPlayer();
  } catch (error) {
    renderLocked("Card not recognized", "This NFC key is not registered.");
    console.error(error);
  }
}

function getCardKey() {
  const params = new URLSearchParams(window.location.search);
  const fromQuery = params.get("key") || params.get("card");
  if (fromQuery) return sanitizeKey(fromQuery);

  const parts = window.location.pathname.split("/").filter(Boolean);
  const cardIndex = parts.indexOf("c");
  return cardIndex >= 0 ? sanitizeKey(parts[cardIndex + 1]) : "";
}

function sanitizeKey(value = "") {
  return value.replace(/[^a-zA-Z0-9_-]/g, "");
}

function renderCard(card, key) {
  document.title = `${card.title} | Keytone`;
  document.documentElement.style.setProperty("--accent", card.accent);
  document.documentElement.style.setProperty("--secondary", card.secondary);
  document.documentElement.style.setProperty("--third", card.third);

  elements.player.classList.remove("is-locked");
  elements.status.textContent = "CARD VERIFIED";
  elements.editionMark.textContent = card.edition;
  elements.title.textContent = card.title;
  elements.artist.textContent = card.artist;
  elements.description.textContent = card.description;
  elements.duration.textContent = card.duration;
  elements.cardKey.textContent = shortenKey(key);
  elements.edition.textContent = card.edition;
  elements.format.textContent = card.format || "NTAG215 URL KEY";

  if (card.coverUrl) {
    elements.cover.classList.add("has-cover");
    elements.cover.style.backgroundImage = `url("${card.coverUrl}")`;
  } else {
    elements.cover.classList.remove("has-cover");
    elements.cover.style.backgroundImage = "";
  }

  if (card.audioUrl) {
    elements.audio.src = card.audioUrl;
  }
}

function renderLocked(title, message) {
  document.title = "Locked | Keytone";
  elements.player.classList.add("is-locked");
  elements.status.textContent = "LOCKED";
  elements.editionMark.textContent = "NO KEY";
  elements.title.textContent = title;
  elements.artist.textContent = "NFC card required";
  elements.description.textContent = message;
  elements.duration.textContent = "0:00";
  elements.cardKey.textContent = "missing";
  elements.edition.textContent = "unverified";
  elements.format.textContent = "NTAG215 URL KEY";
}

function bindPlayer() {
  elements.playButton.addEventListener("click", togglePlayback);

  elements.audio.addEventListener("loadedmetadata", () => {
    elements.duration.textContent = formatTime(elements.audio.duration);
  });

  elements.audio.addEventListener("timeupdate", () => {
    if (!elements.audio.duration) return;
    elements.currentTime.textContent = formatTime(elements.audio.currentTime);
    elements.seek.value = String(
      Math.round((elements.audio.currentTime / elements.audio.duration) * 1000),
    );
  });

  elements.audio.addEventListener("ended", () => stopPlayback(true));

  elements.seek.addEventListener("input", () => {
    if (currentCard.audioUrl && elements.audio.duration) {
      elements.audio.currentTime =
        (Number(elements.seek.value) / 1000) * elements.audio.duration;
      return;
    }

    synthOffset =
      (Number(elements.seek.value) / 1000) * durationToSeconds(currentCard.duration);
    if (synth) {
      synthStartedAt = performance.now() / 1000 - synthOffset;
    }
    updateSynthTime();
  });
}

async function togglePlayback() {
  if (!currentCard) return;

  if (elements.player.classList.contains("is-playing")) {
    pausePlayback();
    return;
  }

  if (currentCard.audioUrl) {
    await elements.audio.play();
    startUi();
    return;
  }

  startSynth();
  startUi();
  animateSynthTime();
}

function startUi() {
  elements.player.classList.add("is-playing");
  elements.playButton.setAttribute("aria-label", "Pause");
}

function pausePlayback() {
  if (currentCard.audioUrl) {
    elements.audio.pause();
  } else {
    synthOffset = performance.now() / 1000 - synthStartedAt;
    stopSynth();
  }

  elements.player.classList.remove("is-playing");
  elements.playButton.setAttribute("aria-label", "Play");
  cancelAnimationFrame(rafId);
}

function stopPlayback(reset = false) {
  if (currentCard.audioUrl) {
    elements.audio.pause();
    if (reset) elements.audio.currentTime = 0;
  } else {
    if (!reset) {
      synthOffset = performance.now() / 1000 - synthStartedAt;
    }
    stopSynth();
    if (reset) synthOffset = 0;
  }

  elements.player.classList.remove("is-playing");
  elements.playButton.setAttribute("aria-label", "Play");
  cancelAnimationFrame(rafId);

  if (reset) {
    elements.seek.value = "0";
    elements.currentTime.textContent = "0:00";
  }
}

function startSynth() {
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  const context = new AudioContext();
  const master = context.createGain();
  const filter = context.createBiquadFilter();
  const oscA = context.createOscillator();
  const oscB = context.createOscillator();
  const oscC = context.createOscillator();

  filter.type = "lowpass";
  filter.frequency.value = 680;
  master.gain.value = 0.075;
  oscA.frequency.value = 98;
  oscB.frequency.value = 147;
  oscC.frequency.value = 196;

  oscA.connect(filter);
  oscB.connect(filter);
  oscC.connect(filter);
  filter.connect(master);
  master.connect(context.destination);
  oscA.start();
  oscB.start();
  oscC.start();

  synth = { context, master, oscA, oscB, oscC };
  synthStartedAt = performance.now() / 1000 - synthOffset;
}

function stopSynth() {
  if (!synth) return;
  synth.master.gain.setTargetAtTime(0, synth.context.currentTime, 0.03);
  window.setTimeout(() => synth?.context.close(), 120);
  synth = null;
}

function animateSynthTime() {
  updateSynthTime();
  rafId = requestAnimationFrame(animateSynthTime);
}

function updateSynthTime() {
  const total = durationToSeconds(currentCard.duration);
  const elapsed = synth ? performance.now() / 1000 - synthStartedAt : synthOffset;

  if (elapsed >= total) {
    stopPlayback(true);
    return;
  }

  elements.currentTime.textContent = formatTime(elapsed);
  elements.seek.value = String(Math.round((elapsed / total) * 1000));
}

function durationToSeconds(duration) {
  const [minutes, seconds] = duration.split(":").map(Number);
  return minutes * 60 + seconds;
}

function formatTime(value) {
  if (!Number.isFinite(value)) return "0:00";
  const minutes = Math.floor(value / 60);
  const seconds = Math.floor(value % 60);
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

function shortenKey(key) {
  if (key.length <= 12) return key;
  return `${key.slice(0, 6)}...${key.slice(-4)}`;
}
