# SNUDI-FO 30 — Correctif V3.16 : couvertures complètes

Compatible avec la V3.15.

## Ce qui change

- Dans les articles d’actualité et les fiches de « Mes outils », les **images de couverture** sont affichées **en entier**, centrées et limitées à 800 px de large sur ordinateur.
- Sur téléphone, elles utilisent la largeur disponible tout en conservant leur ratio.
- Les miniatures des listes sont également affichées sans découpe.
- **Le bandeau de l’accueil n’est pas concerné.**
- Le cache de l'application est renouvelé pour charger la nouvelle feuille de style.

## Installation

1. Décompresser l’archive.
2. Remplacer uniquement `styles.css`, `index.html` et `sw.js` à la racine du dépôt GitHub, sur la branche `main`.
3. Attendre la fin du déploiement GitHub Pages, puis actualiser l’application. Sur ordinateur : `Ctrl + Maj + R`.
4. Si l’application installée montre encore l’ancien rendu, la fermer, la rouvrir et appuyer sur son bouton Actualiser. Au besoin, réinstaller le raccourci.

Ne remplacez pas les fichiers de `content/` ni les fichiers JavaScript de l'administration. Aucune publication n’est modifiée.

**À savoir :** si un fichier image a été **recadré avant son envoi**, aucune règle CSS ne peut rétablir les parties absentes. La compression utilisée dans l’administration V3.15 ne recadre pas les images, elle les redimensionne proportionnellement.
