# Correctif icône blanche en relief — SNUDI-FO 30 (V3)

Ce correctif remplace uniquement l'icône installée sur le téléphone et le favicon des onglets du navigateur, en conservant l'image blanche en relief validée. **Le logo utilisé dans l'en-tête de l'application n'est pas modifié.**

## Installation GitHub Pages

1. Ouvrir le dépôt GitHub `adrienheritier/snudifo30`, branche `main`.
2. À la racine du dépôt, remplacer **index.html**, **admin.html**, **manifest.webmanifest** et **sw.js** par ceux de l'archive.
3. Dans le dossier **assets**, ajouter les cinq nouveaux PNG :
   - `icon-snudi-relief-192.png`
   - `icon-snudi-relief-512.png`
   - `icon-snudi-relief-maskable-512.png`
   - `apple-touch-icon-snudi-relief-180.png`
   - `favicon-snudi-relief-48.png`
4. Valider les fichiers sur la branche `main` puis attendre la fin du déploiement GitHub Pages.
5. Actualiser l'application. Sur les appareils où l'application était déjà installée, **supprimer l'ancien raccourci / l'ancienne installation PWA et réinstaller** l'application depuis le navigateur si l'ancienne icône reste affichée. Les systèmes d'exploitation peuvent mettre en cache l'ancienne icône malgré les nouveaux fichiers.

IMPORTANT : le dossier `assets` doit rester un dossier. Sur GitHub Web, ouvrir d'abord le dossier `assets` puis cliquer sur **Add file > Upload files** pour y envoyer les PNG, afin d'éviter de les placer par erreur à la racine.

## Fichiers laissés intacts

Ne pas modifier/supprimer `content/news.json`, `content/events.json`, `app.js`, `admin.js`, `styles.css`, `admin.css`, `article-content.js` et `assets/logo-snudi-original.jpg`. Le jeton GitHub actuel n'a pas à être recréé.

## Vérification

- L'icône PWA est déclarée dans `manifest.webmanifest` en versions 192 et 512 pixels, avec une version adaptée aux icônes Android masquées.
- L'icône iPhone/iPad est déclarée dans `index.html` en 180×180 pixels.
- L'icône d'onglet est déclarée dans `index.html` et `admin.html` en 48×48 pixels.
- Le cache du service worker change de nom pour favoriser la mise à jour des ressources.

Aucun article ou événement n'est fourni dans ce ZIP : les publications existantes sont conservées.
