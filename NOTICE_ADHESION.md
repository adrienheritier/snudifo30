# SNUDI-FO 30 — correctif V3.2 : page d’adhésion

## Ce qui est ajouté

- **Accueil** : nouveau bouton « Adhérer au SNUDI-FO » dans « Accès rapides ».
- **Page d’adhésion** : explication de l’intérêt d’adhérer, de l’action collective et de l’indépendance financière ; bouton « J’adhère » ouvrant **https://snudifo30.web.app/**.
- Lien également présent dans la rubrique « Tous les services ». Depuis Contact, « Adhérer » ouvre désormais cette page explicative.
- Identité rouge, jaune et blanc conservée. Icône blanche en relief et logo d’origine non modifiés.

## Installation sur le dépôt existant

**Avant modification :** sauvegardez votre dépôt, notamment les fichiers de données du dossier `content`.

1. Décompressez `SNUDI_FO_30_V3_2_ADHESION_CORRECTIF.zip`.
2. Sur GitHub, dans `adrienheritier/snudifo30`, remplacez **uniquement à la racine** :
   - `app.js`
   - `styles.css`
   - `index.html`
   - `sw.js`
3. Validez le commit sur la branche `main`.
4. Après le déploiement GitHub Pages, actualisez l’application (sur PC `Ctrl + Maj + R` ; sur mobile, fermez puis rouvrez si nécessaire).

**Ne remplacez pas** `admin.html`, `admin.js`, `content/news.json`, `content/events.json` ou `content/tools.json` : ce correctif n’en a pas besoin et vos contenus actuels doivent être conservés.

Le service worker utilise le nouveau cache `snudifo30-v3.2-page-adhesion`.

## Vérification

1. Ouvrir `https://adrienheritier.github.io/snudifo30/`.
2. Sur Accueil, toucher « Adhérer au SNUDI-FO ».
3. Vérifier l’affichage de la page et le bouton « J’adhère ».
4. Vérifier que le clic ouvre `https://snudifo30.web.app/` dans un autre onglet.
5. Vérifier les rubriques Actualités, Calendrier, Mes outils et Administration.

La page « Pourquoi adhérer ? » est **statique** : elle ne se modifie pas depuis l’administration V3.1. Son contenu est fondé sur les axes généraux du syndicat et sur sa page officielle d’adhésion. Cette modification ne change pas les droits du jeton GitHub.
