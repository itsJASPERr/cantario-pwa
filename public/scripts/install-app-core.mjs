/**
 * Cantario PWA installation utilities. Native prompts are only available
 * on browsers which explicitly dispatch beforeinstallprompt.
 */
export function installedMode(displayModeStandalone, iosStandalone) {
  return Boolean(displayModeStandalone || iosStandalone);
}

export function installPlatform(userAgent = '', platform = '', maxTouchPoints = 0) {
  const ua=String(userAgent);
  if (/iPad|iPhone|iPod/i.test(ua) ||
      (/MacIntel/i.test(String(platform)) && Number(maxTouchPoints) > 1)) {
    return 'ios';
  }
  if (/Android/i.test(ua)) return 'android';
  return 'desktop';
}

export function installGuide(platform) {
  if (platform === 'ios') return {
    title: 'Agregar Cantario a la pantalla de inicio',
    intro: 'En iPhone o iPad, la instalación se hace desde el menú Compartir; no se abre una ventana automática.',
    steps: [
      'Abrí Cantario en Safari si estás usando el navegador de otra aplicación.',
      'Tocá Compartir (cuadrado con una flecha hacia arriba).',
      'Elegí “Agregar a pantalla de inicio”. Si aparece “Abrir como app web”, dejalo activado. Después tocá “Agregar”.'
    ],
    note: 'Importante: abrí el ícono de Cantario una vez CON internet y esperá a que indique “Lista para usar sin conexión”. Si abre en Safari con su barra de direcciones, eliminá ese acceso directo y volvé a agregarlo como app web.'
  };
  if (platform === 'android') return {
    title: 'Instalar Cantario en Android',
    intro: 'Si no apareció el cuadro de instalación, podés instalar Cantario desde el menú del navegador.',
    steps: [
      'Abrí Cantario en Chrome (fuera del navegador integrado de otra aplicación).',
      'Abrí el menú ⋮ del navegador.',
      'Elegí “Instalar aplicación” o “Agregar a pantalla principal” y confirmá.'
    ],
    note: 'La opción depende del navegador y de los requisitos de instalación del dispositivo.'
  };
  return {
    title: 'Instalar Cantario en tu computadora',
    intro: 'La instalación depende del navegador. En Chrome o Edge, buscá la opción de instalar la aplicación.',
    steps: [
      'Abrí Cantario en Chrome o Edge.',
      'Buscá “Instalar Cantario” en la barra de direcciones o en el menú del navegador (⋮).',
      'Confirmá la instalación para abrir Cantario como una app.'
    ],
    note: 'Si tu navegador no ofrece esa opción, podés seguir usando Cantario desde la web.'
  };
}
