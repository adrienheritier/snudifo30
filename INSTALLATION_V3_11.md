# Correctif SNUDI-FO 30 V3.11 — Position de la barre du lecteur PDF

## Ce qui change

- La barre blanche de pagination et zoom est désormais **directement sous le bandeau rouge**, avant le titre et le document PDF.
- Les deux barres restent visibles lors du défilement, mais la barre blanche **n'est plus superposée au PDF**.
- Le bouton « Retour » dans le bandeau rouge, les fonctions de zoom et de pagination sont inchangés.
- Aucun PDF, contenu, configuration de l'administration ou document n'est remplacé.

## Installation sur ton dépôt GitHub `adrienheritier/snudifo30`

1. Décompresse l'archive.
2. Remplace **à la racine** les quatre fichiers : `app.js`, `styles.css`, `index.html`, `sw.js`.
3. Valide le commit sur la branche `main` et attends la mise à jour de GitHub Pages.
4. Ferme/réouvre l'application installée ; au besoin, force son actualisation depuis le navigateur. La version de cache et les URLs CSS/JS sont actualisées.

**Ne remplace aucun fichier du dossier `content`, ni `pdf-reader.js`.**

## Vérification

Ouvre un PDF depuis « Mes outils ». Les commandes de pages et de zoom doivent se trouver immédiatement sous l'en-tête rouge, et le PDF être affiché dessous sans masquage. Le bouton « Retour » doit revenir à l'article.
