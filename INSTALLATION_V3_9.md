# SNUDI-FO 30 — Correctif V3.9 — Visualiseur PDF avec retour

## Fonctionnement

Les PDF importés dans la bibliothèque partagée (`media/pdfs/`) s'ouvrent désormais dans une page de l’application, avec le **bandeau rouge et le bouton Retour** visibles. Un lien permet de les ouvrir séparément si le navigateur ne prend pas en charge la lecture PDF intégrée (en particulier sur certains téléphones). Le bouton Télécharger est conservé.

Le correctif ne concerne pas les liens vers des PDF hébergés sur des sites tiers : ces sites peuvent interdire leur affichage intégré.

## Installation sur GitHub Pages

1. Sauvegarder le dépôt avant modification.
2. Décompresser l'archive ; copier ces **quatre fichiers à la racine** du dépôt `adrienheritier/snudifo30` : `app.js`, `styles.css`, `index.html`, `sw.js`.
3. Remplacer les fichiers correspondants sur la branche `main` et valider les changements.
4. Après le déploiement GitHub Pages, rafraîchir l'application et tester depuis un article contenant un PDF. Si nécessaire sur mobile, fermer puis rouvrir l'application installée pour actualiser le service worker.

## Ne pas remplacer

`admin.html`, `admin.js`, `pdf-library.js`, `content/news.json`, `content/events.json`, `content/tools.json`, `content/home.json` : tous restent inchangés.

## Limite de compatibilité

La lecture dans une fenêtre intégrée utilise le moteur PDF du navigateur. Certains navigateurs mobiles ne prennent pas en charge l'affichage des PDF multipages dans une iframe. L'option « Ouvrir le PDF séparément » permet de consulter le fichier dans ce cas.
