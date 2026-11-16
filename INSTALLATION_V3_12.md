# Correctif V3.12 — Capsules vidéo YouTube

Cette mise à jour est prévue pour **SNUDI-FO 30 V3.11**. Elle ajoute des vidéos YouTube dans les articles d'actualités et les contenus de **Mes outils**, affichées avant le texte.

## Installation sur le dépôt existant

1. Télécharger puis décompresser l’archive `SNUDI_FO_30_V3_12_CORRECTIF_VIDEOS_YOUTUBE.zip`.
2. Ouvrir le dépôt GitHub `adrienheritier/snudifo30`, branche `main`.
3. À la racine, remplacer **`app.js`, `admin.js`, `admin.html`, `index.html`, `styles.css`, `admin.css`, `sw.js`**.
4. À la racine, **ajouter `youtube-videos.js`** (nouveau fichier).
5. Enregistrer, attendre le déploiement de GitHub Pages, puis recharger l’application et l’administration. Sur téléphone installé, fermer et rouvrir, voire réinstaller si le cache persiste.

**Ne pas remplacer** `content/news.json`, `content/events.json`, `content/tools.json`, `content/home.json`, le dossier `media` ni les fichiers PDF/images. Les articles, PDF et classements restent conservés. Le jeton GitHub reste le même.

## Utilisation

Dans Admin → Actualités (ou Admin → Mes outils), ouvrir ou créer un article. Le bloc **« Capsules vidéo YouTube »** est placé près de l’image de couverture. Coller **un lien par ligne** dans l’ordre souhaité (8 vidéos maximum). Liens acceptés : `https://www.youtube.com/watch?v=...`, `https://youtu.be/...`, `https://www.youtube.com/shorts/...`, `https://www.youtube.com/live/...`, et `https://www.youtube.com/embed/...`.

Cliquer **Prévisualiser**, puis **Publier sur GitHub**. La vidéo apparaît entre la couverture et le texte. Les anciennes publications sans vidéo continuent de fonctionner.

Pour enlever une vidéo, supprimer sa ligne et republier. Pour réorganiser les vidéos, déplacer leurs lignes. Aucun stockage de vidéos n’est ajouté au dépôt GitHub : seul l’identifiant YouTube est enregistré dans le JSON de l’article.

## Limitations et confidentialité

- Il faut une connexion Internet pour charger YouTube, même si l’application est installée.
- Certaines vidéos ne peuvent pas être diffusées dans un lecteur intégré (restriction de l’auteur, âge, paramètres de YouTube). Un lien **Ouvrir sur YouTube** est affiché sous chaque lecteur.
- Le lecteur utilise `youtube-nocookie.com` (mode de confidentialité avancé). Cela ne signifie pas absence totale d’échanges avec YouTube lorsque la vidéo est chargée.
- Les vidéos ne sont pas ajoutées au calendrier : elles sont destinées aux **articles** d’actualités et de Mes outils.
- Aucune modification du dépôt distant n'a été effectuée par ce correctif ; la publication réelle reste à vérifier sur GitHub Pages après installation.
