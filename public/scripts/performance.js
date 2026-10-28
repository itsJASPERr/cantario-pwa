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
  const settingsToggle = document.getElementById('performance-settings-toggle');
  const settingsDrawer = document.getElementById('performance-settings');
  const settingsClose = document.getElementById('performance-settings-close');
  const mobileControls = window.matchMedia('(max-width: 700px), (max-height: 500px) and (max-width: 950px)');

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
  // Keep a floating-point position independently of the browser's scrollTop
  // precision. Some browsers round scrollTop when moving <1 pixel per frame.
  let virtualPosition = 0;
  let elapsedSeconds = 0;
  let settingsOpen = false;
  let settingsTimer = null;

  function isMobileControls() {
    return mobileControls.matches;
  }
  function clearSettingsTimer() {
    if (settingsTimer !== null) clearTimeout(settingsTimer);
    settingsTimer = null;
  }
  function isEditingSetting() {
    const active = document.activeElement;
    return Boolean(active && settingsDrawer?.contains(active) &&
      ['INPUT', 'SELECT', 'TEXTAREA'].includes(active.tagName));
  }
  function scheduleSettingsCollapse() {
    clearSettingsTimer();
    if (!settingsOpen || state !== 'playing' || !isMobileControls() || isEditingSetting()) return;
    settingsTimer = setTimeout(() => {
      settingsTimer = null;
      if (dialog.open && settingsOpen && state === 'playing' && !isEditingSetting()) {
        setSettingsOpen(false);
      }
    }, 5000);
  }
  function setSettingsOpen(value) {
    settingsOpen = isMobileControls() && Boolean(value);
    dialog.classList.toggle('settings-open', settingsOpen);
    settingsToggle?.setAttribute('aria-expanded', String(settingsOpen));
    settingsToggle?.setAttribute('aria-label', settingsOpen ? 'Cerrar ajustes de escenario' : 'Abrir ajustes de escenario');
    if (settingsDrawer) settingsDrawer.inert = isMobileControls() && !settingsOpen;
    if (settingsOpen) scheduleSettingsCollapse();
    else clearSettingsTimer();
  }
  function syncSettingsLayout() {
    if (!isMobileControls()) setSettingsOpen(false);
    else {
      settingsDrawer.inert = !settingsOpen;
      settingsToggle?.setAttribute('aria-expanded', String(settingsOpen));
      if (settingsOpen) scheduleSettingsCollapse();
    }
  }

  function setStatus(message) {
    status.textContent = message;
  }
  function physicalDistance() {
    if (!dialog.open) return 0;
    const possible = maxScrollDistance(scroll.scrollHeight, scroll.clientHeight);
    const viewportHeight = scroll.clientHeight;
    if (viewportHeight <= 0) return 0;
    // Endmark coordinates relative to the scrolling content, not its
    // offsetParent (which varies with browser layout).
    const endPosition = endmark.getBoundingClientRect().bottom -
      scroll.getBoundingClientRect().top + scroll.scrollTop;
    // Finish with the final lyric comfortably visible. Short songs still
    // move, rather than being disabled just because every line initially fits.
    const desired = Math.max(0, endPosition - viewportHeight * 0.35);
    const minimum = Math.min(viewportHeight * 0.25,
      Math.max(0, endPosition - viewportHeight * 0.18));
    return Math.min(possible, Math.max(desired, minimum));
  }
  function updateProgress() {
    const distance = physicalDistance();
    const value = distance ? progressPercent(scroll.scrollTop, distance) : 100;
    const time = Math.floor(elapsedSeconds);
    const clock = String(Math.floor(time / 60)).padStart(2, '0') + ':' +
      String(time % 60).padStart(2, '0');
    progress.textContent = distance
      ? value + '% · ' + clock
      : 'Todo visible';
    noScroll.hidden = distance > 0;
    // Only a genuinely non-scrollable (empty) page disables Start.
    play.disabled = distance < 1 && state !== 'playing' && state !== 'countdown';
  }
  function syncPlay() {
    dialog.classList.toggle('is-playing', state === 'playing');
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
    clearSettingsTimer();
    setStatus(message);
    syncPlay();
  }
  function finished() {
    stopFrame();
    state = 'finished';
    clearSettingsTimer();
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
    elapsedSeconds += deltaSeconds;
    virtualPosition = advanceScroll(virtualPosition, distance, deltaSeconds, rate);
    scroll.scrollTop = virtualPosition;
    updateProgress();
    if (virtualPosition >= distance - 0.75) { finished(); return; }
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
    virtualPosition = Math.min(physicalDistance(), scroll.scrollTop);
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
    // Playing or resuming always returns to the unobstructed mobile lyrics view.
    if (isMobileControls()) setSettingsOpen(false);
    if (state === 'playing' || state === 'countdown') { pause(); return; }
    if (state === 'finished') {
      scroll.scrollTop = 0;
      virtualPosition = 0;
      elapsedSeconds = 0;
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
    // Never hide the essential play/pause bar on small screens.
    if (isMobileControls()) {
      if (settingsOpen) setSettingsOpen(false);
      return;
    }
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
    virtualPosition = 0;
    elapsedSeconds = 0;
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
    setSettingsOpen(false);
    syncSettingsLayout();
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
    setSettingsOpen(false);
    clearSettingsTimer();
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
  settingsToggle?.addEventListener('click', () => setSettingsOpen(!settingsOpen));
  settingsClose?.addEventListener('click', () => {
    setSettingsOpen(false);
    settingsToggle?.focus();
  });

  // A drawer is temporary. Keep it open during field editing; auto-close
  // after five seconds of inactivity only while actively scrolling.
  settingsDrawer?.addEventListener('pointerdown', scheduleSettingsCollapse);
  settingsDrawer?.addEventListener('input', scheduleSettingsCollapse);
  settingsDrawer?.addEventListener('change', scheduleSettingsCollapse);
  settingsDrawer?.addEventListener('keydown', scheduleSettingsCollapse);
  settingsDrawer?.addEventListener('focusin', event => {
    if (['INPUT', 'SELECT', 'TEXTAREA'].includes(event.target.tagName)) clearSettingsTimer();
    else scheduleSettingsCollapse();
  });
  settingsDrawer?.addEventListener('focusout', () => {
    requestAnimationFrame(() => scheduleSettingsCollapse());
  });
  dialog.addEventListener('pointerdown', event => {
    if (!isMobileControls() || !settingsOpen) return;
    if (settingsDrawer.contains(event.target) || settingsToggle.contains(event.target)) return;
    setSettingsOpen(false);
  });
  mobileControls.addEventListener('change', () => {
    if (!dialog.open) return;
    syncSettingsLayout();
    updateProgress();
  });

  // Never fight a musician's manual scroll. Swipes and wheel movements pause.
  scroll.addEventListener('wheel', () => {
    if (state === 'playing') pause('En pausa · desplazamiento manual');
    // Browser updates scrollTop after the wheel event; resync on next frame.
    requestAnimationFrame(() => { if (state !== 'playing') virtualPosition = scroll.scrollTop; });
  }, {passive:true});
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
    virtualPosition = scroll.scrollTop;
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
      requestAnimationFrame(() => { if (state !== 'playing') virtualPosition = scroll.scrollTop; });
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
    syncSettingsLayout();
    updateProgress();
    if (state === 'playing' && physicalDistance() === 0) pause('La canción cabe en pantalla');
  });
})();
