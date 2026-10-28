/**
 * Cantario offline bootstrap, also runs in iOS Home Screen's own storage.
 */
const root = new URL('../', import.meta.url);
const swURL = new URL('sw.js', root);
const shellURL = new URL('index.html', root);
const containers = [...document.querySelectorAll('[data-offline-readiness]')];

function setStatus(state,message) {
  for(const container of containers) {
    container.dataset.state=state;
    const label=container.querySelector('[data-offline-status]');
    if(label) label.textContent=message;
  }
}
async function cachedShellExists() {
  if(!('caches' in window)) return false;
  // Workbox uses revision query parameters in precache keys.
  const cached=await caches.match(shellURL.href,{ignoreSearch:true});
  return Boolean(cached?.ok);
}
async function checkOfflineReadiness() {
  if(!('serviceWorker' in navigator) || !('caches' in window)) {
    setStatus('error','Este navegador no permite confirmar el uso sin conexión.');
    return;
  }
  if(await cachedShellExists()) {
    setStatus('ready','Lista para usar sin conexión');
  } else if(!navigator.onLine) {
    setStatus('error','Sin caché disponible. Abrí Cantario con internet para prepararla.');
  } else {
    setStatus('loading','Preparando canciones para usar sin conexión…');
  }
}
async function registerOfflineApp() {
  if(!('serviceWorker' in navigator)) {
    await checkOfflineReadiness();
    return;
  }
  await checkOfflineReadiness();
  try {
    const registration=await navigator.serviceWorker.register(swURL.href,{scope:root.pathname});
    if(navigator.onLine) void registration.update().catch(()=>{});
    const readyRegistration=await navigator.serviceWorker.ready;
    if(readyRegistration?.active) await checkOfflineReadiness();
  } catch {
    setStatus('error','No se pudo preparar el modo sin conexión. Volvé a abrir con internet.');
  }
}
window.addEventListener('online',()=>{void registerOfflineApp()});
window.addEventListener('offline',()=>{void checkOfflineReadiness()});
navigator.serviceWorker?.addEventListener('controllerchange',()=>{void checkOfflineReadiness()});
void registerOfflineApp();
