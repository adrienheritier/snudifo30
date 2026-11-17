/* SNUDI-FO 30 — page d'installation publique (sans identifiants ni traceurs). */
'use strict';
(() => {
  let deferredPrompt = null;
  const $ = id => document.getElementById(id);
  const ua = navigator.userAgent || '';
  const isIOS = /iPad|iPhone|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const isAndroid = /Android/i.test(ua);
  const isInstalled = () => matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;
  const open = $('open-button');
  const install = $('install-button');
  const feedback = $('install-feedback');
  const message = text => { feedback.textContent = text; };
  const setVisible = (id, visible) => { $(id).hidden = !visible; };
  function renderState(){
    setVisible('installed-message', isInstalled());
    setVisible('steps-ios', !isInstalled() && isIOS);
    setVisible('steps-android', !isInstalled() && isAndroid);
    setVisible('steps-desktop', !isInstalled() && !isAndroid && !isIOS);
    const showPrompt = Boolean(deferredPrompt) && !isInstalled() && !isIOS;
    install.hidden = !showPrompt;
    if (isInstalled()) {
      $('device-label').textContent = 'Application déjà ouverte en mode installé';
      open.textContent = 'Accéder à SNUDI-FO 30';
    } else if (isIOS) {
      $('device-label').textContent = 'iPhone / iPad détecté';
    } else if (isAndroid) {
      $('device-label').textContent = showPrompt ? 'Android : installation directe disponible' : 'Android : installation depuis le navigateur';
    } else {
      $('device-label').textContent = 'Ordinateur : flashez le QR code avec votre téléphone';
    }
  }
  window.addEventListener('beforeinstallprompt', event => {
    event.preventDefault();
    deferredPrompt = event;
    renderState();
  });
  window.addEventListener('appinstalled', () => { deferredPrompt = null; message('L’installation a été confirmée. Retrouvez l’application sur votre écran d’accueil.'); renderState(); });
  install.addEventListener('click', async () => {
    if (!deferredPrompt) { message('Utilisez le menu de votre navigateur pour installer l’application.'); return; }
    const promptEvent = deferredPrompt; deferredPrompt = null; renderState();
    try {
      await promptEvent.prompt();
      const result = await promptEvent.userChoice;
      message(result?.outcome === 'accepted' ? 'Installation acceptée. Consultez votre écran d’accueil.' : 'Installation annulée. Vous pouvez toujours utiliser le menu du navigateur.');
    } catch { message('Impossible d’afficher la fenêtre d’installation. Utilisez le menu du navigateur.'); }
  });
  $('share-button').addEventListener('click', async () => {
    const url = 'https://snudifogard.github.io/snudifo30/installer.html';
    if (navigator.share) {
      try { await navigator.share({title:'Installer SNUDI-FO 30',text:'L’application syndicale du SNUDI-FO du Gard',url}); return; } catch(e) { if(e?.name === 'AbortError') return; }
    }
    try { await navigator.clipboard.writeText(url); message('Lien d’installation copié.'); }
    catch { message('Copiez l’adresse affichée sous le QR code.'); }
  });
  // Le même service worker que l'application permet sa mise à jour et son fonctionnement hors ligne.
  if ('serviceWorker' in navigator && /^https?:$/.test(location.protocol)) {
    window.addEventListener('load', () => { navigator.serviceWorker.register('./sw.js').catch(() => {}); });
  }
  renderState();
})();
