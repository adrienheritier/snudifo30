# Correctif SNUDI-FO 30 V3.10 — lecture PDF sur téléphone

## Pourquoi cette mise à jour ?

Dans la V3.9, l'affichage d'un PDF dans une iframe pouvait se limiter à la première page, notamment dans une PWA installée sur iOS. Le lecteur V3.10 affiche maintenant **une page à la fois dans un canvas**, avec une barre de navigation et un zoom, et un **Retour à l’article** permanent dans le bandeau rouge.

## Installation

1. Sauvegardez votre dépôt `adrienheritier/snudifo30`.
2. Décompressez le ZIP et remplacez **à la racine** `app.js`, `index.html`, `styles.css`, `sw.js`.
3. Ajoutez le **nouveau fichier `pdf-reader.js`** à la racine du dépôt.
4. Publiez sur `main` et attendez le déploiement de GitHub Pages.
5. Sur téléphone, fermez/réouvrez l'application. Si le lecteur précédent persiste, actualisez le navigateur ou réinstallez le raccourci pour purger le cache ancien.

Ne remplacez pas `content/news.json`, `content/events.json`, `content/tools.json`, ni aucun PDF ou fichier d'administration.

## Utilisation

- **Consulter** un PDF depuis une publication : une seule page s'affiche entièrement.
- **Page précédente / suivante** : parcourez toutes les pages.
- **+ / −** : agrandissez ou réduisez le texte ; le document peut alors défiler horizontalement ou verticalement.
- **Retour** dans le bandeau rouge : retour direct à la publication d'origine, sans fermer l'application.
- **Ouvrir séparément** et **Télécharger** : solutions de secours et conservation du fichier.

## Précision technique

L'affichage utilise Mozilla PDF.js (version 4.10.38), chargé via `cdnjs.cloudflare.com` (ou `cdn.jsdelivr.net` en secours) **lors de la première consultation**. Une connexion internet est donc nécessaire au premier chargement du lecteur. Les fichiers PDF restent exclusivement hébergés sur votre dépôt GitHub ; ils ne sont pas envoyés à Cloudflare. Si le CDN ne peut pas être chargé, l'application affiche un message clair et le bouton « Ouvrir séparément » reste disponible.

Les PDF incorporés dans des sites externes ne sont pas modifiés par ce correctif.
