# SNUDI-FO 30 — Correctif V3.6 « Affichages écoles »

## Modifications

L’écran « Mes outils » contient, dans cet ordre :
1. Affichages écoles
2. Fiches pratiques
3. Modèles de courriers
4. Barème mouvement

Les quatre boutons sont blancs avec pictogrammes rouges. Le bouton rouge « Contacter le SNUDI FO » reste en dessous.

La rubrique « Affichages écoles » fonctionne avec le système de fiches de « Mes outils » existant. Depuis l'administration GitHub, il est possible d'ajouter, modifier, supprimer, prévisualiser et réordonner des articles, avec image de couverture, images dans le corps et texte enrichi.

Pour les liens vers des PDF hébergés ailleurs, il existe deux possibilités :
- un champ « Lien principal vers la ressource ou le PDF » ;
- un champ « Liens PDF externes » acceptant jusqu'à 20 entrées, une par ligne, au format `Nom du document | https://exemple.fr/document.pdf`.

Les liens HTTPS sont affichés comme des boutons « Documents à consulter ou télécharger » sous l'article. Le résultat du téléchargement dépend du service hébergeant le PDF. Les fichiers PDF ne sont pas importés sur GitHub ; les images de couverture et celles insérées dans le texte sont bien hébergées sur le dépôt, comme dans la V3 actuelle.

La rubrique **Documents utiles** n'apparaît plus dans les quatre boutons publics. Ses enregistrements antérieurs sont conservés dans `content/tools.json` et restent accessibles dans le filtre de l'administration sous « Documents utiles (ancienne rubrique, archives) ». Aucun contenu existant n'est effacé.

## Mettre à jour le site sur GitHub Pages

1. Sauvegarder les fichiers ou exporter une sauvegarde des contenus depuis l'administration existante.
2. Décompresser l'archive `SNUDI_FO_30_V3_6_CORRECTIF_AFFICHAGES.zip`.
3. Ouvrir le dépôt GitHub de l'application, sur la branche actuellement publiée (habituellement `main`).
4. Remplacer **à la racine** du dépôt uniquement les sept fichiers fournis :
   - `app.js`
   - `admin.js`
   - `index.html`
   - `admin.html`
   - `styles.css`
   - `admin.css`
   - `sw.js`
5. Valider le commit. Après le déploiement de GitHub Pages, recharger la page, éventuellement avec Ctrl+Maj+R, ou relancer l'application installée.

**Ne pas remplacer `content/news.json`, `content/events.json`, `content/tools.json` ni `content/home.json`.** Ils ne figurent pas dans l'archive. Ne pas supprimer les dossiers `media`, `assets` ni les autres fichiers existants.

## Première publication d'un affichage

1. Ouvrir `admin.html`, puis se connecter avec le jeton GitHub utilisé précédemment.
2. Ouvrir « Mes outils » et filtrer sur « Affichages écoles ».
3. Cliquer sur « + Nouveau ».
4. Saisir un titre et un résumé, puis joindre éventuellement une image de couverture.
5. Insérer les images des affiches dans le texte à l'aide du bouton « + Image dans le texte ».
6. Saisir un ou plusieurs liens PDF externes au format `Titre | https://…`.
7. Cliquer sur « Prévisualiser la fiche », puis sur « Publier sur GitHub ».
8. Attendre la fin du déploiement GitHub Pages, puis ouvrir la rubrique publique « Affichages écoles ».

Au départ, la rubrique est vide : il n'est pas nécessaire d'ajouter un nouveau fichier JSON. Le contenu sera enregistré dans le fichier `content/tools.json` qui existe déjà. Le système d'ordre manuel V3.3 fonctionne aussi pour cette nouvelle rubrique.

## Contrôles effectués

- Vérification de la syntaxe JavaScript.
- Ouverture des écrans en navigateur de test : ordre des boutons, couleur du barème et contact.
- Vérification du rendu d'une rubrique vide, puis d'un article contenant deux liens PDF.
- Vérification de la création d'une fiche depuis le formulaire d'administration, du format des liens et de la prévisualisation.

L'enregistrement sur un vrai dépôt GitHub reste à tester après installation : aucune publication n'a été effectuée avec les identifiants de l'utilisateur.
