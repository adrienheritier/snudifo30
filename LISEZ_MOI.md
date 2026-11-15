# SNUDI-FO 30 — V3 : actualités illustrées et éditeur enrichi

Application web (PWA) hébergée sur **GitHub Pages**, avec un espace administrateur GitHub.

**Si votre V2 est déjà en ligne : utilisez de préférence `SNUDI_FO_30_V3_MISE_A_JOUR.zip`, pas le ZIP d'installation complète.** Cela évite d'écraser des actualités ou événements déjà publiés.

## Nouveautés V3

- Image de couverture facultative (liste des actualités + en haut de l'article).
- Mise en forme des articles : titres, sous-titres, gras, italique, souligné, listes à puces ou numérotées, citation et liens HTTPS.
- Plusieurs images placées dans le texte, dans l'ordre souhaité.
- Compression et redimensionnement automatiques des images avant leur envoi : largeur/hauteur maximale 1 600 px, fichier final de moins de 1,5 Mo ; source initiale de 15 Mo maximum.
- Images acceptées : **JPG, PNG, WebP**. Les GIF et SVG ne sont pas acceptés.
- Bouton « Prévisualiser l'article » pour inspecter le texte, la couverture et les photos avant publication.
- Changement de couverture ; clic sur une image dans l'éditeur pour la **remplacer** ou la **supprimer**.
- Envoi des images dans le dossier `media/actualites/` du même dépôt GitHub. Le répertoire est créé automatiquement si nécessaire.
- Après publication réussie, suppression des anciens fichiers médias **si aucun autre article ne les utilise**.
- Conservation des actualités anciennes et du calendrier sans changement de format imposé aux données déjà en ligne.

## Mise à jour V2 → V3 SANS perte des articles publiés

1. Depuis l'administration V2, utilisez « Exporter une sauvegarde » pour conserver un JSON local. Il est également conseillé de télécharger une copie de votre dépôt GitHub.
2. Décompressez **`SNUDI_FO_30_V3_MISE_A_JOUR.zip`**.
3. Depuis GitHub, ouvrez votre dépôt `adrienheritier/snudifo30` (ou celui où la V2 est installée).
4. Utilisez `Add file → Upload files` dans le dossier **racine** du dépôt, puis importez le contenu décompressé (sans le dossier parent). Vous devez **ajouter** le fichier `article-content.js` et **remplacer** :
   - `admin.html` ;
   - `admin.js` ;
   - `admin.css` ;
   - `index.html` ;
   - `app.js` ;
   - `styles.css` ;
   - `sw.js`.
5. Enregistrez les changements sur la branche **`main`**, utilisée par GitHub Pages. Si votre installation emploie une autre branche de publication, utilisez-la à la place.
6. **Ne remplacez PAS `content/news.json` ou `content/events.json`** : ce sont vos données déjà publiées. Ne supprimez pas non plus vos fichiers dans `assets` ni les anciennes images dans `media`.
7. Une fois le déploiement GitHub Pages achevé, actualisez l'application et `admin.html`. Si l'ancienne interface s'affiche encore sur téléphone, fermez/réouvrez la PWA ou videz le cache du navigateur ; le service worker utilise maintenant le cache `snudifo30-v3.0`.

L'ancien jeton GitHub Fine-grained avec `Contents: Read and write` sur ce dépôt est suffisant. **Ne l'ajoutez jamais aux fichiers du dépôt.**

## Créer un article illustré

1. Ouvrez `https://adrienheritier.github.io/snudifo30/admin.html` si c'est bien l'adresse GitHub Pages de votre dépôt, et connectez-vous comme en V2.
2. Dans **Actualités**, cliquez sur « + Nouveau ».
3. Renseignez titre, date, catégorie, résumé et éventuellement lien source.
4. Dans **Image de couverture**, cliquez « Choisir une image » (facultatif).
5. Rédigez le texte dans l'éditeur enrichi et utilisez les boutons pour mettre en forme vos paragraphes.
6. Placez le curseur où vous souhaitez insérer une photographie et cliquez « + Image dans le texte ». Répétez autant de fois que nécessaire.
7. Cliquez sur une image du texte pour afficher « Remplacer » et « Supprimer ».
8. Cliquez sur **Prévisualiser l’article**. Vérifiez notamment l'ordre des illustrations, leurs descriptions alternatives et les liens.
9. Cliquez **Publier sur GitHub**, puis confirmez. **Ne fermez pas la page pendant les transferts.** Chaque image est enregistrée sur GitHub, suivie d'un commit qui met à jour `content/news.json`. Les anciennes images inutilisées sont ensuite supprimées.
10. Attendez le déploiement GitHub Pages et rechargez l'application pour voir l'actualité.

**Attention aux images personnelles :** ne publiez des photographies de collègues, d'enfants ou d'autres personnes identifiables que lorsque vous disposez des autorisations nécessaires. Les images sont accessibles publiquement et leurs anciennes versions peuvent demeurer dans l'historique Git de GitHub. La compression du navigateur supprime en général les métadonnées EXIF mais ce mécanisme ne remplace pas les règles de confidentialité et de droit à l'image.

## Modifier une actualité publiée

1. Depuis « Actualités », cliquez **Modifier**.
2. La couverture et les images existantes apparaissent dans le formulaire.
3. Pour changer la couverture : choisissez une nouvelle image ; pour la retirer, cliquez « Retirer l'image ».
4. Pour changer une image intégrée : cliquez dessus, puis « Remplacer ». Pour la retirer : « Supprimer ».
5. Prévisualisez puis publiez. Les références et les fichiers inutilisés seront traités **après** l'enregistrement de l'article.

Les anciennes actualités V2 contenant le champ `body` sont ouvertes dans l'éditeur enrichi et migrées vers `bodyHtml` lorsque vous les republiez. Les anciennes actualités avec seulement un lien externe continuent à fonctionner.

## Calendrier

Aucun changement de fonctionnement : utilisez l'onglet « Calendrier » pour ajouter, modifier et supprimer des événements, classés dans les catégories déjà filtrables dans l'application publique.

## Limites actuelles

- Pas de brouillons ni de programmation automatique de publication dans cette version.
- Pas d'ajout de pièces jointes PDF par l'éditeur.
- Le système de mise en forme utilise les commandes natives des navigateurs (éditeur `contenteditable`). Il est fonctionnel sur les navigateurs courants, mais reste moins sophistiqué qu'un éditeur professionnel dédié.
- Un envoi d'images peut générer plusieurs commits GitHub. **Si la dernière étape de publication échoue**, des images peuvent déjà avoir été envoyées ; le formulaire conserve normalement les références pour réessayer sans les réenvoyer. En cas d'abandon après une erreur, il peut rester des fichiers médias orphelins à nettoyer dans le dépôt.
- L'espace `admin.html` n'est pas protégé par une connexion indépendante ; l'**autorisation d'écriture** repose sur le jeton GitHub, conservé temporairement en mémoire de l'onglet. Ne communiquez jamais ce jeton.
- Un fichier supprimé d'un dépôt Git n'est pas nécessairement effacé de son **historique Git**.
- Les actualités et le calendrier sont publics, comme tous les fichiers déployés sur GitHub Pages.
- La publication peut prendre un peu de temps pour apparaître à cause du déploiement et du cache de la PWA.

## Références techniques

- API utilisée pour enregistrer fichiers et contenus : <https://docs.github.com/en/rest/repos/contents>
- GitHub Pages : <https://docs.github.com/en/pages>
- Application écrite en HTML, CSS et JavaScript, sans service externe ni base de données supplémentaire.

