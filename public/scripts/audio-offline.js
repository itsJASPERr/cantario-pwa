// Explicit opt-in caching for recordings: large audio files are NOT precached with the lyrics.
(() => {
  const CACHE = 'cantario-recordings-v1';
  const rows = [...document.querySelectorAll('[data-recording]')];
  const objectUrls = [];
  for (const row of rows) {
    const source = row.dataset.recording;
    const audio = row.querySelector('audio');
    const button = row.querySelector('[data-cache-recording]');
    const status = row.querySelector('[data-recording-status]');
    if (!source || !audio || !button || !status) continue;
    if (!('caches' in window)) {
      button.disabled = true;
      status.textContent = 'Tu navegador no permite guardar este audio sin conexión.';
      continue;
    }
    async function sync() {
      const cache = await caches.open(CACHE);
      const cached = await cache.match(source);
      if (cached) {
        const blob = await cached.blob();
        const url = URL.createObjectURL(blob);
        objectUrls.push(url);
        audio.src = url;
        button.textContent = 'Quitar descarga';
        status.textContent = 'Grabación disponible sin conexión en este dispositivo.';
      } else {
        audio.src = source;
        button.textContent = 'Guardar sin conexión';
        status.textContent = 'La grabación necesita internet hasta que la guardes.';
      }
      return Boolean(cached);
    }
    button.addEventListener('click', async () => {
      button.disabled = true;
      const before = button.textContent;
      status.textContent = 'Procesando audio…';
      try {
        const cache = await caches.open(CACHE);
        if (await cache.match(source)) {
          await cache.delete(source);
        } else {
          if (!navigator.onLine) throw new Error('Conectate a internet para guardar este audio.');
          const response = await fetch(source);
          if (!response.ok || response.type === 'opaque') throw new Error('No se pudo descargar la grabación.');
          await cache.put(source, response);
        }
        await sync();
      } catch(error) {
        button.textContent = before;
        status.textContent = error?.message || 'No se pudo guardar el audio. Revisá el espacio disponible.';
      } finally {
        button.disabled = false;
      }
    });
    sync().catch(() => { audio.src=source; button.disabled = true; status.textContent='No se pudo acceder al almacenamiento offline.'; });
  }
  window.addEventListener('pagehide', () => objectUrls.forEach(url => URL.revokeObjectURL(url)));
})();
