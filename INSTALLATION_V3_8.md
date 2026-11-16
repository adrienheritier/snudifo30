# SNUDI-FO 30 — V3.8 : réorganisation de « Mes outils »

## Installation sur le dépôt déjà en service

1. Dans l’administration actuelle, exporter une sauvegarde.
2. Décompresser l’archive « MISE_A_JOUR_V3_8 ».
3. Remplacer uniquement les fichiers `app.js`, `admin.js`, `admin.html`, `index.html` et `sw.js` à la racine du dépôt GitHub.
4. Vérifier que GitHub Pages a terminé son déploiement, puis recharger la page (Ctrl+Maj+R).
5. Dans Admin → Mes outils, la rubrique `Dossiers thématiques` est disponible pour créer des contenus (texte, images, liens, PDF).
6. **Pour supprimer définitivement les anciens articles Barème mouvement**, dans Admin → Mes outils, utiliser le bouton `Supprimer définitivement les anciens articles Barème`, après sauvegarde. Le bouton ne touche pas aux autres articles. Les PDF partagés restent conservés tant qu’ils sont référencés ailleurs.

**Ne pas remplacer `content/tools.json`, `content/news.json` ou `content/events.json`** avec des fichiers d’exemple. Les anciennes fiches de barème restent cachées au public dès la mise à jour, et ne quittent le stockage GitHub qu’après l’action explicite de nettoyage dans Admin.

## Nouvelles rubriques (ordre public)

1. Affichages écoles
2. Mes droits — les fiches existantes sont conservées sans migration (identifiant interne `fiches`)
3. Dossiers thématiques — nouveau (identifiant `dossiers`)
4. Modèles de courriers

Le bouton « Contacter le SNUDI FO » reste sous les quatre catégories.

## Administration

Admin → Mes outils : le menu de catégorie et le filtre utilisent les noms ci-dessus ; `Archives (non publiées)` reste accessible uniquement en administration. On peut créer, modifier, prévisualiser, classer ou supprimer une publication, avec éditeur enrichi, images de couverture, images intégrées et PDF partagés. Les dossiers thématiques acceptent aussi plusieurs PDF externes, saisis au format `Titre | https://...`. Les fiches `Mes droits` conservent la recherche et les favoris dans l’application.

## Limites et sécurité

Les actions publiques et d’administration continuent de dépendre de GitHub Pages et de l’API GitHub. Le jeton n’est pas inclus dans les fichiers. La suppression effective des anciens contenus sur **ton** dépôt nécessite une action depuis ton espace administrateur avec un jeton valide. Le retrait d’un fichier de la branche courante ne purge pas l’historique Git. Évite les publications concurrentes par plusieurs administrateurs pendant l’opération de nettoyage.
