import {installedMode, installPlatform, installGuide} from './install-app-core.mjs';

// Keep the native installation event until a genuine user gesture.
const buttons = [...document.querySelectorAll('[data-install-app]')];
const dialog = document.getElementById('install-help-dialog');
const title = document.getElementById('install-help-title');
const intro = document.getElementById('install-help-intro');
const steps = document.getElementById('install-help-steps');
const note = document.getElementById('install-help-note');
let deferredPrompt = null;
let successfullyInstalled = false;

function isInstalled() {
  const displayMode = window.matchMedia?.('(display-mode: standalone)').matches;
  return successfullyInstalled || installedMode(displayMode, navigator.standalone === true);
}
function refreshButtons() {
  const installed = isInstalled();
  for (const button of buttons) button.hidden = installed;
  if (installed && dialog?.open) dialog.close();
}
function showManualInstructions() {
  if (!dialog || !title || !intro || !steps || !note) return;
  const platform = installPlatform(navigator.userAgent, navigator.platform, navigator.maxTouchPoints);
  const guide = installGuide(platform);
  title.textContent = guide.title;
  intro.textContent = guide.intro;
  steps.replaceChildren();
  for (const instruction of guide.steps) {
    const li = document.createElement('li');
    li.textContent = instruction;
    steps.append(li);
  }
  note.textContent = guide.note;
  if (!dialog.open) dialog.showModal();
}

window.addEventListener('beforeinstallprompt', event => {
  event.preventDefault();
  deferredPrompt = event;
  refreshButtons();
});
window.addEventListener('appinstalled', () => {
  successfullyInstalled = true;
  deferredPrompt = null;
  refreshButtons();
});
window.matchMedia?.('(display-mode: standalone)').addEventListener?.('change',refreshButtons);

for (const button of buttons) button.addEventListener('click', () => {
  if (isInstalled()) {
    refreshButtons();
    return;
  }
  if (!deferredPrompt) {
    showManualInstructions();
    return;
  }
  const promptEvent = deferredPrompt;
  deferredPrompt = null;
  // Call prompt synchronously from this click. Do not await first.
  try {
    const shown = promptEvent.prompt();
    Promise.resolve(shown).then(() => promptEvent.userChoice).then(choice => {
      if (choice?.outcome === 'accepted') {
        // Wait for appinstalled before claiming installation succeeded.
        return;
      }
      // On dismissal, keep the button available for browser help.
    }).catch(() => {
      // If the platform fails to show the native prompt, offer instructions.
      showManualInstructions();
    });
  } catch {
    showManualInstructions();
  }
});
dialog?.addEventListener('click', event => {
  // Native <dialog> supports Esc. Also dismiss when clicking its backdrop.
  if (event.target === dialog) dialog.close();
});
refreshButtons();
