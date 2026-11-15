# Correctif SNUDI-FO 30 — V3.4 : bandeau d’accueil

## Installation dans le dépôt GitHub

1. Faire une sauvegarde depuis l’admin.
2. Ouvrir le dépôt GitHub `adrienheritier/snudifo30` (branche `main`).
3. À la racine, remplacer **uniquement** `app.js`, `admin.js`, `index.html`, `admin.html`, `styles.css`, `admin.css`, `sw.js`.
4. Créer `content/home.json` avec le fichier fourni dans le ZIP (ne PAS toucher à `content/news.json`, `content/events.json` ni à `content/tools.json`).
5. Dans `assets/`, ajouter `bandeau-elections-2026.png` sans altérer l’image.
6. Valider le commit sur `main` et patienter jusqu’à la fin du déploiement GitHub Pages. Actualiser l’application, de préférence via une fermeture puis réouverture.

## Modifier le bandeau ensuite

- Ouvrir `admin.html`, se connecter avec le jeton GitHub habituel.
- Cliquer sur **Accueil · Bandeau**.
- Sélectionner une nouvelle image (JPEG, PNG ou WebP), vérifier l’aperçu et sa description.
- Cliquer sur **Publier le bandeau sur GitHub**.
- Après le déploiement GitHub Pages, les utilisateurs voient la nouvelle image. L’ancienne peut encore s’afficher tant que la PWA est en cache : fermer et rouvrir ou actualiser.
- Pour masquer le bandeau : cliquer sur **Retirer le bandeau**, puis publier.

La nouvelle image est enregistrée dans `media/accueil/` sous un nom unique, puis son chemin est référencé dans `content/home.json`. Les actualités et le calendrier sont indépendants.

Le bloc rouge « Une question ? Votre syndicat est là. » est déplacé **après les prochaines dates**, au bas du contenu de l’accueil.

## Sécurité / limites

- Le jeton GitHub n’est pas conservé par l’application. Ne pas partager de jeton.
- L’upload est limité à JPEG, PNG et WebP, 15 Mo en entrée, puis compression automatique vers ~1,5 Mo au maximum.
- La bannière d’origine est déjà optimisée et placée dans `assets/`.
- Pour agrandir l’affiche sur téléphone, cliquer sur le bandeau, qui ouvre l’image dans un nouvel onglet.
- En cas de conflit GitHub, recharger les contenus avant de recommencer.
- Le premier déploiement réel sur votre dépôt reste à vérifier.
