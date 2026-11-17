# SNUDI-FO 30 — Correctif V3.17 : installation guidée

**Dépôt cible :** `snudifogard/snudifo30` (branche `main`).

## Installation (depuis la V3.16)

1. Faites une sauvegarde de votre dépôt.
2. Ajoutez à la racine `installer.html`, `installer.css` et `installer.js`.
3. Dans `assets/`, ajoutez `qr-installation-snudi-fo-30.png`.
4. Remplacez **uniquement** les fichiers `app.js`, `index.html` et `sw.js` à la racine.
5. Validez les fichiers sur la branche `main` et attendez la publication GitHub Pages.
6. Ouvrez `https://snudifogard.github.io/snudifo30/installer.html` et testez sur Android et iPhone.
7. Ouvrez l'application → Menu → Installer l'application ; le bouton doit ouvrir la page guidée.

**Aucune intervention dans `content/`, `media/`, `admin.*`, `styles.css` ou `manifest.webmanifest`.** Les actualités, PDF, paramètres et l'icône restent inchangés.

## Liens publics

- Application : https://snudifogard.github.io/snudifo30/
- Installation : https://snudifogard.github.io/snudifo30/installer.html
- QR code : `assets/qr-installation-snudi-fo-30.png` (également fourni séparément en PNG)

Le QR code pointe directement vers la page `installer.html`, **pas** vers l'ancienne adresse `adrienheritier.github.io`.

## Comportement

- **Android Chromium** : si l'événement `beforeinstallprompt` est disponible, bouton permettant de demander l'installation native. Sinon, instructions pour l'installation via le menu du navigateur.
- **iPhone/iPad** : pas de déclenchement automatique possible ; ouverture de l'application puis « Partager » → « Sur l'écran d'accueil » → « Ajouter ».
- **Ordinateur** : QR code, lien vers l'application et partage.
- **Application déjà installée** : reconnaissance du mode standalone et bouton vers l'application.

En cas de cache persistant, fermez l'application puis actualisez la page d'installation. Testez après déploiement avec un téléphone qui n'a pas encore l'application.

## Note

Le QR code et la page contiennent uniquement des liens publics. Aucun mot de passe, jeton GitHub ou donnée utilisateur n'est incorporé.
