# SNUDI-FO 30 — Correctif V3.14 : images intégrales

Cette mise à jour s'applique à la **V3.13**.

## Changements

- Les images de couverture des actualités et de « Mes outils » s'affichent **en entier**, sans couper le haut ou le bas.
- Les images insérées dans le corps des articles s'affichent en entier, même lorsqu'elles sont verticales.
- Sur ordinateur, ces images sont **centrées** et limitées à **800 px de large** ; une petite image n'est pas agrandie artificiellement.
- Sur téléphone, elles ne dépassent pas la largeur disponible et conservent leurs proportions.
- Les petites vignettes des listes d'actualités et d'outils montrent également l'image complète, avec éventuellement de l'espace vide autour pour respecter leurs dimensions fixes.
- Le bandeau d'accueil conserve son affichage actuel. Aucun changement dans l'administration, le lecteur PDF ou les vidéos YouTube.

## Installation sur GitHub Pages

1. Téléchargez le ZIP, puis **décompressez-le**.
2. Dans le dépôt `adrienheritier/snudifo30`, à la racine de la branche `main`, **remplacez seulement** :
   - `styles.css`
   - `index.html`
   - `sw.js`
3. Enregistrez la modification (commit).
4. Après le déploiement GitHub Pages, rechargez l'application. Sur ordinateur, essayez `Ctrl + Maj + R` si l'ancien style apparaît encore. Sur téléphone installé en application, fermez-la complètement puis rouvrez-la ; une seconde actualisation peut être nécessaire pour mettre à jour le cache.

**Ne remplacez aucun fichier du dossier `content`**, ni `app.js`, `admin.js`, les PDF ou les médias existants. Vos publications et leurs paramètres restent inchangés.

## Vérifications effectuées

Test sur une image verticale de 1 200 × 1 700 px avec navigateur Chromium, en largeur d'écran de 1 440 px et 390 px :

- sur ordinateur : largeur de l'image dans les publications = 800 px, hauteur proportionnelle = 1 133 px ; aucun recadrage ;
- sur mobile : largeur de l'image = 322 px, hauteur proportionnelle = 456 px ; aucun recadrage ;
- le bandeau d'accueil conserve son dimensionnement indépendant.

La mise à jour réelle sur votre dépôt GitHub n'a pas été effectuée et devra être vérifiée après installation.
