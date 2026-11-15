# SNUDI-FO 30 — correctif V3.3 : ordre des articles « Mes outils »

## Installation

Sur ton dépôt `adrienheritier/snudifo30`, branche `main`, remplacer **uniquement** les six fichiers suivants à la racine :

- `admin.html`
- `admin.js`
- `admin.css`
- `app.js`
- `index.html`
- `sw.js`

Ne pas importer les fichiers du dossier `content` depuis une ancienne archive : ils contiennent tes données en ligne.
Ne pas modifier `article-content.js`, les médias ni les icônes.

## Utilisation

1. Ouvrir `admin.html`, se connecter avec le jeton GitHub habituel.
2. Aller dans **Mes outils**.
3. Dans **Filtrer les outils**, choisir une catégorie (Barème mouvement, Modèles de courriers, Fiches pratiques ou Documents utiles). Le filtre « Toutes les rubriques » ne permet pas de modifier l'ordre.
4. Cliquer sur **↕ Gérer l’ordre des articles**.
5. Utiliser les flèches **↑** et **↓** (fonctionnent sur téléphone et ordinateur).
6. Cliquer sur **Publier cet ordre sur GitHub** ; confirmer. La modification est enregistrée dans `content/tools.json` du dépôt, sans modifier l'actualité ni le calendrier.
7. Attendre le déploiement GitHub Pages, puis rouvrir/actualiser la rubrique publique.

L'ordre est **indépendant pour chacune des quatre rubriques**. Les anciennes fiches sans champ `order` restent dans leur ordre d'origine ; la première publication de classement attribue un `order` aux seuls contenus de la rubrique concernée. Les nouveaux contenus sont placés en dernière position et peuvent être remontés ensuite. Pour les fiches pratiques, le classement reste appliqué lorsque la recherche ou un filtre par thème/favoris est actif.

Le jeton GitHub ne doit jamais être mis dans des fichiers du dépôt. Sauvegarder les contenus avant une mise à jour est conseillé.
