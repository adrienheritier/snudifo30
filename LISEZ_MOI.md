# SNUDI-FO 30 — V3.1 : « Mes outils » administrables

Cette mise à jour reprend la V3 (avec l’icône **blanche en relief**) et ajoute l’édition des quatre rubriques « Mes outils » par GitHub.

## Changements visibles pour les collègues

- Sur l’accueil, suppression **du raccourci** « Mes droits ». Les fiches pratiques restent consultables par « Mes outils » et depuis le menu.
- Dans « Mes outils », **quatre entrées uniquement** : Barème mouvement, Modèles de courriers, Fiches pratiques, Documents utiles.
- Sous ces quatre entrées, bouton **« Contacter le SNUDI FO »**, qui ouvre la page de contact.
- Dans chaque rubrique, publication(s) modifiables avec titre, résumé, texte enrichi, images de couverture et photos intégrées.
- Dans les modèles de courriers, bouton **« Copier le courrier »**. Le texte copié correspond au contenu actuel (et non à un ancien brouillon).
- Les fiches pratiques conservent la recherche, les filtres par sous-catégorie et les favoris.

## Changements dans l’administration

Trois onglets : **Actualités**, **Calendrier** et **Mes outils**. Dans l’onglet Mes outils :
1. Choisir la rubrique à filtrer (barème, modèles, fiches, documents).
2. Cliquer sur **Modifier** pour une publication existante, ou **+ Nouveau** pour en créer une.
3. Renseigner la rubrique, le titre, le résumé et éventuellement une sous-catégorie et une URL HTTPS.
4. Rédiger dans l’éditeur enrichi, insérer des images, choisir facultativement une couverture.
5. Cliquer sur « Prévisualiser la fiche », puis « Publier sur GitHub ».
6. Pour supprimer un contenu, utiliser « Supprimer » (confirmation demandée).

Le transfert des images utilise la compression de la V3 ; les nouveaux médias sont stockés sous `media/outils/`. La suppression d’une ancienne image est effectuée après publication réussie, si aucun autre contenu de la même liste ne la référence. Les anciens fichiers peuvent subsister dans l’historique Git.

## IMPORTANT : installer la mise à jour **sans effacer les contenus existants**

L’archive `SNUDI_FO_30_V3_1_MISE_A_JOUR.zip` est le choix adapté au dépôt `adrienheritier/snudifo30` déjà en ligne.

**Avant toute mise à jour** : dans l’administration en ligne, cliquer sur « Exporter une sauvegarde » ; sauvegarder aussi une copie du dépôt si possible.

**À la racine de la branche `main`**, remplacer les fichiers suivants depuis le ZIP :

- `index.html`, `admin.html`;
- `app.js`, `admin.js`, `article-content.js`;
- `styles.css`, `admin.css`, `sw.js`;
- `manifest.webmanifest` (pour conserver l’icône blanche en relief).

**Dans le dossier `content`** : ajouter **`tools.json`** ; c’est un **nouveau fichier**. Il contient les contenus initiaux des quatre rubriques (25 entrées). **Ne PAS remplacer `content/news.json` ou `content/events.json`** : ils contiennent tes publications déjà en ligne.

**Dans le dossier `assets`** : déposer les cinq icônes PNG de la V3.0.2 si elles n’y sont pas encore. Les images d’origine de l’en-tête restent inchangées (`logo-snudi-original.jpg`).

**Dans le dossier `media/outils`** : aucun fichier particulier nécessaire pour publier des images, l’API GitHub crée automatiquement le chemin lors du premier envoi. Le fichier `.gitkeep` est fourni à titre indicatif.

### Conseil pour GitHub dans le navigateur

Quand tu utilises **Add file → Upload files**, GitHub peut ne pas prendre en compte une arborescence déposée depuis le gestionnaire de fichiers. Pour ne pas déplacer les dossiers par erreur, effectue **deux opérations distinctes** :
1. Importer les fichiers de la racine directement à la racine du dépôt.
2. Ouvrir le dossier `content` dans GitHub, puis y importer **uniquement** `tools.json`.
3. Ouvrir le dossier `assets`, puis y importer les PNG si nécessaire.

**Ne dépose pas** le fichier ZIP lui-même sur GitHub : il faut le décompresser d’abord. Un dépôt mis à jour via Git peut aussi conserver l’arborescence automatiquement.

### Après installation

Attendre la fin du déploiement GitHub Pages puis effectuer un rafraîchissement forcé (`Ctrl+Maj+R`). Si la PWA reste bloquée sur une ancienne version, fermer/réouvrir l’application et, si nécessaire, la réinstaller. Le service worker utilise maintenant le cache `snudifo30-v3.1-outils-editables`.

Adresse habituelle de l’administration :
`https://adrienheritier.github.io/snudifo30/admin.html`

Le **jeton GitHub existant** avec la permission `Contents: Read and write` suffit. Il n’est jamais écrit dans les fichiers du site.

## Fichiers de données et sauvegardes

- `content/news.json` : actualités, ne pas écraser.
- `content/events.json` : calendrier, ne pas écraser.
- `content/tools.json` : données nouvelles et éditables des quatre rubriques.

**Le modèle de sauvegarde inclut désormais aussi les outils.** Les 25 entrées initiales ont été reprises des contenus de la V3 (liens, modèles et fiches) sans nouvelle vérification juridique ; il faut contrôler toute fiche avant d’en faire un support juridique officiel et actualisé.

La mise à jour ne crée pas d’authentification autonome : les opérations d’écriture exigent toujours un jeton GitHub valide. Des conflits de version sont détectés avant publication pour éviter l’écrasement d’une modification concurrente. L’application et les médias publiés sont publics.

## Limites

- Aucun brouillon ni programmation automatique des publications.
- Pas d’hébergement de PDF via ce formulaire (un lien HTTPS peut être ajouté).
- Les quatre **rubriques sont fixes** dans cette version ; tu peux en revanche ajouter, modifier, réorganiser par rubrique et supprimer leurs contenus éditoriaux.
- Les actualités et le calendrier continuent à fonctionner comme en V3.
- Si le champ du lien est laissé vide, la publication reste autorisée.
- La création et la suppression de fichiers sur le dépôt réel doivent encore être vérifiées une première fois après l’installation (les tests ont simulé l’API GitHub).
