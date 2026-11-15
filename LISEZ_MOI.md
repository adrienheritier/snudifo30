# SNUDI-FO 30 — V2 (application + espace administrateur GitHub)

Cette archive contient **l’application publique installable** (PWA) et **un espace d’administration distinct**. Elle est conçue pour être hébergée sur **GitHub Pages**. Le logo SNUDI-FO est conservé tel qu'il a été fourni.

## Changements de cette version

- Entête supérieur rouge et navigation inférieure rouge ; onglet actif en jaune.
- Suppression de l'écran et des accès autonomes « Carte scolaire » ; les articles « Carte scolaire » restent dans **Actualités** et peuvent être recherchés/filtrés.
- Calendrier : filtres **Tous, Formation, Échéance, Élections, RIS, Instance, Mobilisation, Autre** (ainsi que les catégories ajoutées ensuite). Les filtres s'appliquent à l'agenda **et** à la vue mensuelle.
- Suppression de l'ancienne « administration locale » de l'application publique.
- Nouveaux fichiers partagés `content/news.json` et `content/events.json`, lus par l'application à chaque ouverture en ligne.
- Nouveau **`admin.html`** : ajouter, modifier, supprimer des actualités ou des dates, et les publier directement sur GitHub. Pour une actualité, un article complet peut être affiché dans l'application, pas seulement un lien vers un site extérieur.

## Publier l'application sur GitHub Pages

1. **Décompresser** l'archive `.zip` sur l'ordinateur.
2. Copier **tous les fichiers et dossiers contenus** dans le dépôt GitHub, directement **à la racine** :
   - `index.html`, `app.js`, `styles.css`, `sw.js`, `manifest.webmanifest` ;
   - `admin.html`, `admin.js`, `admin.css` ;
   - `content` **avec** les deux fichiers JSON ;
   - `assets` **avec** les logos et icônes.
3. Sur GitHub : `Settings → Pages → Build and deployment → Deploy from a branch`, sélectionner la branche `main` et `/ (root)`.
4. L'application sera disponible à `https://NOM-UTILISATEUR.github.io/NOM-DU-DEPOT/`.
5. L'administration sera à `https://NOM-UTILISATEUR.github.io/NOM-DU-DEPOT/admin.html`. **Cette page n’apparaît pas dans le menu des collègues.**

Pour remplacer la V1, il faut **ajouter les nouveaux fichiers** `admin.*` et le dossier `content`, et **remplacer les fichiers V1** concernés. Vérifier ensuite l'onglet Actions ou la page Deployments du dépôt pour suivre la publication. Le ZIP lui-même ne doit pas être l'unique fichier téléversé dans GitHub.

## Première connexion à l’administration

L'administration fonctionne une fois les fichiers **mis en ligne** sur GitHub Pages. Elle ne peut pas publier dans un dépôt GitHub simplement parce qu'on ouvre une copie HTML hors ligne sur son ordinateur.

1. Connectez-vous à votre **compte GitHub qui dispose des droits d'écriture sur le dépôt**.
2. Dans GitHub, ouvrez <https://github.com/settings/personal-access-tokens> (jetons d'accès personnels **à granularité fine**).
3. Créez un jeton **limité uniquement au dépôt de l'application**, avec la permission de dépôt **Contents → Read and write**. Ne donnez pas d'autres droits si ce n'est pas nécessaire. Fixez une durée d'expiration raisonnable. Certaines organisations GitHub peuvent exiger une autorisation supplémentaire.
4. Ouvrez `admin.html` sur l'adresse GitHub Pages et renseignez :
   - **Propriétaire GitHub** : nom du compte ou de l'organisation qui possède le dépôt ;
   - **Dépôt** : nom exact du dépôt GitHub (sans `.git`) ;
   - **Branche** : généralement `main` ;
   - **Jeton** : le jeton créé à l'étape 3.
5. Cliquez sur **Se connecter au dépôt**. Les publications existantes seront chargées depuis GitHub.

**Sécurité importante :** `admin.html` est une page publique à laquelle toute personne connaissant l'adresse peut accéder ; **seules les personnes disposant d'un jeton GitHub autorisé peuvent modifier le dépôt**. Le jeton n'est stocké ni dans un fichier de l'application, ni dans `localStorage`, ni dans `sessionStorage`. Il demeure uniquement en mémoire dans l'onglet ouvert et est effacé à la déconnexion ou fermeture de la page. Ne jamais publier ou partager un jeton. Un jeton compromis doit être révoqué immédiatement dans GitHub. Pour une administration multi-personnes plus confortable, une authentification OAuth avec service dédié pourra être intégrée ultérieurement.

## Publier une actualité

1. Dans l'administration, sélectionnez **Actualités** puis **+ Nouveau**.
2. Renseignez **date**, **catégorie**, **titre**, **résumé** ; éventuellement un **article complet** et/ou un **lien source HTTPS**.
3. Cliquez sur **Publier sur GitHub**, confirmez. L'administration crée un commit qui modifie `content/news.json`.
4. Après le déploiement GitHub Pages, ouvrez l'application et actualisez la page pour voir la nouvelle actualité. L'application charge `news.json` depuis l'hébergement et l'affiche dans Actualités et sur l'accueil.

## Publier un événement

1. Sélectionnez **Calendrier** puis **+ Nouveau**.
2. Saisissez la date, éventuellement l'heure ou une date de fin, choisissez une **catégorie de filtre**, précisez le lieu, le statut et éventuellement une source.
3. Cliquez sur **Publier sur GitHub**, confirmez. L'administration modifie `content/events.json`.
4. Après le déploiement, la date sera visible dans le calendrier et sous le filtre correspondant. L'application permet toujours de télécharger un événement au format `.ics`.

**Modifier ou supprimer** : utiliser les boutons en face des contenus existants dans l'administration. Une nouvelle version est publiée à chaque fois. Si un autre administrateur a modifié le même fichier entre-temps, le contrôle par identifiant `sha` bloque l'écrasement et demande de rafraîchir les données.

## Limites et vérifications avant diffusion

- L'administration requiert un **compte GitHub autorisé** et un **jeton à droits limités** ; pas de simple couple identifiant/mot de passe local.
- **Aucun envoi de notification push**, même lorsqu'une actualité est publiée ; les collègues doivent ouvrir ou actualiser l'application pour obtenir les nouveautés.
- Le **déploiement GitHub Pages n'est pas instantané**. Les modifications sont enregistrées dans le dépôt au moment du message de succès ; elles apparaissent dans l'application lorsque GitHub a déployé les nouveaux fichiers.
- Les données de départ (`content/*.json`) sont **un jeu de publications initial**, daté. Les dates, horaires et fiches de droit doivent être revalidés par le bureau avant une diffusion officielle ; les entrées « À confirmer » ne sont pas des convocations.
- Seuls les **actualités et événements** sont modifiables dans cet espace administrateur. Les fiches de droits et les courriers sont actuellement définis dans `app.js` et demandent une mise à jour du code.
- Pas de dépôt de dossiers personnels, certificats médicaux ni informations nominatives sensibles dans l'administration : tout contenu publié devient accessible publiquement.
- Le formulaire « J'ai un problème » prépare un courriel ; il ne conserve pas de dossier individuel et ne transmet pas automatiquement les réponses.
- `SNUDI_FO_30_V2_demo.html` (fourni à côté du ZIP) sert exclusivement à une consultation **hors ligne** de la partie publique ; il ne publie rien sur GitHub.

## Références techniques

L'administration utilise l'API officielle **GitHub REST — Create or update file contents** avec un jeton à granularité fine disposant de `Contents: write` : <https://docs.github.com/en/rest/repos/contents>.

**Conseil pratique** : avant toute annonce d'une nouvelle formation ou échéance, vérifier sa date, son lieu, son horaire, son statut et l'exactitude des liens à partir de la source officielle ou syndicale concernée.
