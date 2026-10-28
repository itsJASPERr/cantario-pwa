import {
  normalizeDuration, normalizeSpeed, maxScrollDistance, scrollRate,
  advanceScroll, progressPercent, MIN_SPEED, MAX_SPEED, SPEED_STEP
} from './performance-core.mjs';

// No third-party dependencies or network calls: the entire performance reader
// operates on HTML already generated into the static, offline-cached song page.
(() => {
  const dialog = document.getElementById('performance-dialog');
  const entry = document.getElementById('performance-enter');
  if (!dialog || !entry) return;

  const scroll = document.getElementById('performance-scroll');
  const lyrics = document.getElementById('performance-lyrics');
  const endmark = document.getElementById('performance-endmark');
  const exit = document.getElementById('performance-exit');
  const play = document.getElementById('performance-play');
  const status = document.getElementById('performance-status');
  const progress = document.getElementById('performance-progress');
  const speedLabel = document.getElementById('performance-speed');
  const duration = document.getElementById('performance-duration');
  const speedDown = document.getElementById('performance-slower');
  const speedUp = document.getElementById('performance-faster');
  const fontDown = document.getElementById('performance-font-down');
  const fontUp = document.getElementById('performance-font-up');
  const chords = document.getElementById('performance-chords');
  const wake = document.getElementById('performance-wake');
  const wakeLabel = document.getElementById('performance-wake-label');
  const countdownButton = document.getElementById('performance-countdown');
  const controlsToggle = document.getElementById('performance-toggle-controls');
  const noScroll = document.getElementById('performance-no-scroll');

  const KEY = {
    duration:'cantario:performance:duration:v1',
    speed:'cantario:performance:speed:v1',
    countdown:'cantario:performance:countdown:v1',
    wake:'cantario:performance:wake:v1',
    size:'cantario:font-size:v1',
    chords:'cantario:chords-visible:v1'
  };

  const read = (key, fallback) => {
    try { return localStorage.getItem(key) ?? fallback; }
    catch { return fallback; }
  };
  const save = (key, value) => {
    try { localStorage.setItem(key, String(value)); } catch {}
  };

  let durationSeconds = normalizeDuration(read(KEY.duration, 210));
  let multiplier = normalizeSpeed(read(KEY.speed, 1));
  let fontSize = Math.round(Number(read(KEY.size, 20))) || 20;
  let chordsVisible = read(KEY.chords, 'yes') !== 'no';
  let countdownEnabled = read(KEY.countdown, 'yes') !== 'no';
  let wakeEnabled = read(KEY.wake, 'yes') !== 'no';
  let wakeLock = null;
  let wakeMessage = '';
  let state = 'ready'; // ready -> countdown -> playing -> paused -> finished
  let frame = 0;
  let lastFrame = null;
  let countdownTimer = 0;
  let previousFocus = null;
  let touchStartY = null;
  let touchMoved = false;

  function setStatus(message) {
    status.textContent = message;
  }
  function physicalDistance() {
    if (!dialog.open) return 0;
    const possible = maxScrollDistance(scroll.scrollHeight, scroll.clientHeight);
    // Extra trailing padding should not force a nearly empty song to scroll.
    const contentEnd = endmark.offsetTop + endmark.offsetHeight;
    if (contentEnd <= scroll.clientHeight - 20) return 0;
    return possible;
  }
  function updateProgress() {
    const distance = physicalDistance();
    const value = distance ? progressPercent(scroll.scrollTop, distance) : 100;
    progress.textContent = distance ? value + '%' : 'Todo visible';
    noScroll.hidden = distance > 0;
    if (state === 'ready' && !distance) play.disabled = true;
    else play.disabled = false;
  }
  function syncPlay() {
    if (state === 'playing') play.textContent = 'Ⅱ Pausar';
    else if (state === 'countdown') play.textContent = '× Cancelar';
    else if (state === 'paused') play.textContent = '▶ Continuar';
    else if (state === 'finished') play.textContent = '↻ Repetir';
    else play.textContent = '▶ Iniciar';
    updateProgress();
  }
  function stopFrame() {
    if (frame) cancelAnimationFrame(frame);
    frame = 0;
    lastFrame = null;
  }
  function cancelCountdown() {
    if (countdownTimer) clearInterval(countdownTimer);
    countdownTimer = 0;
  }
  function pause(message = 'En pausa') {
    if (state !== 'playing' && state !== 'countdown') return;
    cancelCountdown();
    stopFrame();
    state = 'paused';
    setStatus(message);
    syncPlay();
  }
  function finished() {
    stopFrame();
    state = 'finished';
    setStatus('Fin de la canción · ¡Buen canto!');
    syncPlay();
  }
  function tick(timestamp) {
    if (state !== 'playing') return;
    if (document.hidden) { pause('En pausa · pantalla no visible'); return; }
    if (lastFrame === null) lastFrame = timestamp;
    // Do not leap down the song after a busy frame or background-tab delay.
    const deltaSeconds = Math.min(0.2, Math.max(0, (timestamp - lastFrame) / 1000));
    lastFrame = timestamp;
    const distance = physicalDistance();
    if (distance < 1) { pause('Todo el texto cabe en pantalla'); return; }
    const rate = scrollRate(distance, durationSeconds, multiplier);
    scroll.scrollTop = advanceScroll(scroll.scrollTop, distance, deltaSeconds, rate);
    updateProgress();
    if (scroll.scrollTop >= distance - 0.75) { finished(); return; }
    frame = requestAnimationFrame(tick);
  }
  function beginPlaying() {
    if (physicalDistance() < 1) {
      setStatus('Todo el texto cabe en pantalla');
      state = 'ready';
      syncPlay();
      return;
    }
    state = 'playing';
    lastFrame = null;
    setStatus('Desplazamiento automático');
    syncPlay();
    frame = requestAnimationFrame(tick);
  }
  function beginCountdown() {
    state = 'countdown';
    const deadline = performance.now() + 3000;
    setStatus('Comenzamos en 3…');
    syncPlay();
    countdownTimer = setInterval(() => {
      if (!dialog.open || state !== 'countdown') { cancelCountdown(); return; }
      const left = Math.ceil((deadline - performance.now()) / 1000);
      if (left <= 0) {
        cancelCountdown();
        beginPlaying();
      } else setStatus('Comenzamos en ' + left + '…');
    }, 80);
  }
  function onPlay() {
    if (state === 'playing' || state === 'countdown') { pause(); return; }
    if (state === 'finished') {
      scroll.scrollTop = 0;
      state = 'ready';
    }
    if (state === 'ready' && countdownEnabled) beginCountdown();
    else beginPlaying();
  }
  function setDuration(seconds) {
    durationSeconds = normalizeDuration(seconds);
    duration.value = String(durationSeconds);
    save(KEY.duration, durationSeconds);
  }
  function setMultiplier(number) {
    multiplier = normalizeSpeed(number);
    save(KEY.speed, multiplier);
    speedLabel.textContent = Number.isInteger(multiplier) ? multiplier + '×' : multiplier.toFixed(2).replace(/0$/, '') + '×';
    speedDown.disabled = multiplier <= MIN_SPEED;
    speedUp.disabled = multiplier >= MAX_SPEED;
  }
  function setFont(value) {
    fontSize = Math.min(32, Math.max(12, Number(value) || 20));
    lyrics.style.setProperty('--lyric-size', fontSize + 'px');
    save(KEY.size, fontSize);
    window.dispatchEvent(new CustomEvent('cantario:performance:font', {detail:fontSize}));
    updateProgress();
  }
  function setChords(value) {
    chordsVisible = Boolean(value);
    lyrics.classList.toggle('show-chords', chordsVisible);
    chords.setAttribute('aria-pressed', String(chordsVisible));
    chords.textContent = chordsVisible ? '♫ Acordes: sí' : '♫ Acordes: no';
    save(KEY.chords, chordsVisible ? 'yes' : 'no');
    window.dispatchEvent(new CustomEvent('cantario:performance:chords', {detail:chordsVisible}));
    updateProgress();
  }
  function setCountdown(value) {
    countdownEnabled = Boolean(value);
    countdownButton.setAttribute('aria-pressed', String(countdownEnabled));
    countdownButton.textContent = countdownEnabled ? '◷ Inicio: 3 s' : '◷ Sin espera';
    save(KEY.countdown, countdownEnabled ? 'yes' : 'no');
  }

  async function releaseWakeLock() {
    const lock = wakeLock;
    wakeLock = null;
    if (lock) { try { await lock.release(); } catch {} }
    updateWakeLabel();
  }
  function updateWakeLabel() {
    wake.setAttribute('aria-pressed', String(wakeEnabled));
    if (!wakeEnabled) wakeLabel.textContent = '☼ Pantalla: normal';
    else if (wakeLock && !wakeLock.released) wakeLabel.textContent = '☼ Pantalla activa';
    else wakeLabel.textContent = wakeMessage || '☼ No disponible';
  }
  async function acquireWakeLock() {
    if (!wakeEnabled || !dialog.open || document.hidden) return;
    if (!('wakeLock' in navigator)) {
      wakeMessage = '☼ No compatible';
      updateWakeLabel();
      return;
    }
    if (wakeLock && !wakeLock.released) return;
    wakeMessage = '☼ Activando…';
    updateWakeLabel();
    try {
      const lock = await navigator.wakeLock.request('screen');
      if (!dialog.open || !wakeEnabled || document.hidden) {
        try { await lock.release(); } catch {}
        return;
      }
      wakeLock = lock;
      wakeMessage = '';
      lock.addEventListener('release', () => {
        if (wakeLock === lock) {
          wakeLock = null;
          wakeMessage = '☼ Pantalla liberada';
          updateWakeLabel();
        }
      });
    } catch {
      wakeMessage = '☼ No disponible';
    }
    updateWakeLabel();
  }
  function setWake(value) {
    wakeEnabled = Boolean(value);
    save(KEY.wake, wakeEnabled ? 'yes' : 'no');
    if (wakeEnabled) void acquireWakeLock();
    else void releaseWakeLock();
    updateWakeLabel();
  }

  function setControlsHidden(hidden) {
    dialog.classList.toggle('controls-hidden', hidden);
    controlsToggle.textContent = hidden ? '⚙ Controles' : 'Ocultar controles';
    controlsToggle.setAttribute('aria-pressed', String(!hidden));
    updateProgress();
  }

  function resetReader() {
    state = 'ready';
    cancelCountdown();
    stopFrame();
    scroll.scrollTop = 0;
    // Sync with Cantario's existing reader preference keys.
    fontSize = Math.min(32, Math.max(12, Number(read(KEY.size,20)) || 20));
    chordsVisible = read(KEY.chords,'yes') !== 'no';
    setFont(fontSize);
    setChords(chordsVisible);
    durationSeconds = normalizeDuration(read(KEY.duration,210));
    duration.value = String(durationSeconds);
    setMultiplier(read(KEY.speed,1));
    setCountdown(read(KEY.countdown,'yes') !== 'no');
    wakeEnabled = read(KEY.wake,'yes') !== 'no';
    setControlsHidden(false);
    setStatus('Listo para cantar');
    syncPlay();
  }

  function enter() {
    if (dialog.open) return;
    previousFocus = document.activeElement;
    dialog.showModal();
    resetReader();
    void acquireWakeLock();
    // The modal needs one layout pass before its actual scroll height is known.
    requestAnimationFrame(() => { updateProgress(); play.focus(); });
  }
  function leave() {
    if (dialog.open) dialog.close();
  }

  entry.addEventListener('click', enter);
  exit.addEventListener('click', leave);
  dialog.addEventListener('close', () => {
    stopFrame();
    cancelCountdown();
    void releaseWakeLock();
    state = 'ready';
    if (previousFocus?.isConnected) previousFocus.focus();
  });
  play.addEventListener('click', onPlay);
  speedDown.addEventListener('click', () => setMultiplier(multiplier - SPEED_STEP));
  speedUp.addEventListener('click', () => setMultiplier(multiplier + SPEED_STEP));
  duration.addEventListener('change', () => setDuration(duration.value));
  fontDown.addEventListener('click', () => setFont(fontSize - 2));
  fontUp.addEventListener('click', () => setFont(fontSize + 2));
  chords?.addEventListener('click', () => setChords(!chordsVisible));
  countdownButton.addEventListener('click', () => setCountdown(!countdownEnabled));
  wake.addEventListener('click', () => setWake(!wakeEnabled));
  controlsToggle.addEventListener('click', () => setControlsHidden(!dialog.classList.contains('controls-hidden')));

  // Never fight a musician's manual scroll. Swipes and wheel movements pause.
  scroll.addEventListener('wheel', () => { if (state === 'playing') pause('En pausa · desplazamiento manual'); }, {passive:true});
  scroll.addEventListener('touchstart', event => {
    touchStartY = event.touches[0]?.clientY ?? null;
    touchMoved = false;
  }, {passive:true});
  scroll.addEventListener('touchmove', event => {
    if (touchStartY === null) return;
    const y = event.touches[0]?.clientY;
    if (y === undefined || Math.abs(y - touchStartY) < 7) return;
    touchMoved = true;
    if (state === 'playing') pause('En pausa · desplazamiento manual');
  }, {passive:true});
  scroll.addEventListener('touchend', () => { touchStartY = null; }, {passive:true});

  // One tap on unused lyric space toggles the control bar; a swipe never does.
  scroll.addEventListener('click', event => {
    if (touchMoved) { touchMoved = false; return; }
    if (event.target.closest('a,button,input,select,summary')) return;
    setControlsHidden(!dialog.classList.contains('controls-hidden'));
  });
  dialog.addEventListener('keydown', event => {
    const tag = event.target?.tagName;
    const inputLike = tag === 'INPUT' || tag === 'SELECT' || tag === 'TEXTAREA';
    if (inputLike) return;
    if (event.code === 'Space' && !['BUTTON'].includes(tag)) {
      event.preventDefault();
      onPlay();
    } else if (['ArrowDown','ArrowUp','PageDown','PageUp','Home','End'].includes(event.key)) {
      if (state === 'playing') pause('En pausa · desplazamiento manual');
    }
  });

  document.addEventListener('visibilitychange', () => {
    if (!dialog.open) return;
    if (document.hidden) {
      if (state === 'playing' || state === 'countdown') pause('En pausa · pantalla no visible');
      void releaseWakeLock();
    } else if (wakeEnabled) void acquireWakeLock();
  });

  window.addEventListener('resize', () => {
    if (!dialog.open) return;
    updateProgress();
    if (state === 'playing' && physicalDistance() === 0) pause('La canción cabe en pantalla');
  });
})();
