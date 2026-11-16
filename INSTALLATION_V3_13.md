# SNUDI-FO 30 — Correctif V3.13 : actualisation et double appui

Ce correctif est destiné à l'application **V3.12**, déjà publiée sur GitHub Pages.

## Modifications

- Une petite **icône d'actualisation** est ajoutée à droite dans l'en-tête rouge, à côté de la cloche (ou du bouton Retour sur l'écran PDF).
- Un appui recharge **les fichiers partagés** `content/news.json`, `content/events.json`, `content/tools.json` et `content/home.json` depuis le réseau, en évitant les caches habituels. Les publications sont réaffichées dans la page courante, sans fermer l'application.
- Pendant le chargement, le bouton est désactivé. Un message signale si l'actualisation a réussi ou si certaines rubriques n'ont pas pu être chargées.
- Le **double appui involontaire** sur les boutons et les barres de navigation ne doit plus provoquer un zoom général sur les navigateurs compatibles, grâce à `touch-action: manipulation`. Le zoom volontaire par pincement et le zoom du lecteur PDF **restent disponibles**.

## Mise à jour du dépôt

1. Télécharger et décompresser `SNUDI_FO_30_V3_13_CORRECTIF_ACTUALISER_ZOOM.zip`.
2. Dans le dépôt `adrienheritier/snudifo30`, branche `main`, remplacer **à la racine** : `app.js`, `styles.css`, `index.html`, `sw.js`.
3. Valider les modifications et attendre la fin du déploiement GitHub Pages.
4. Fermer/réouvrir l'application installée si besoin, puis essayer l'icône d'actualisation.

Ne pas remplacer les fichiers `content/*.json`, le dossier `media`, les images, ni les fichiers de l'administration. Aucune publication n'est supprimée.

## Points d'attention

- Le bouton interroge **le site GitHub Pages déployé** ; il ne peut pas afficher un article encore en attente de publication sur Pages. Après un commit, attendre que le déploiement ait abouti.
- Sans réseau, une actualisation complète n'est pas possible ; l'application conserve les derniers contenus affichés.
- Le zoom accidentel par double appui est bloqué dans les navigateurs qui prennent en charge cette propriété CSS. Le grossissement volontaire reste possible pour l'accessibilité.

## Vérifications

Syntaxe de `app.js` et `sw.js` contrôlée avec Node. Un test local du rendu mobile a vérifié la présence du nouveau bouton, le rechargement simulé des publications après son activation, et le traitement CSS du double appui. L'installation réelle sur ton téléphone et ton dépôt reste à tester.
