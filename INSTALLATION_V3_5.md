# Correctif V3.5 – Accueil et menu (SNUDI-FO 30)

Ce correctif est prévu pour la V3.4 (bandeau administrable). Il ne modifie aucune donnée publiée ni l'administration.

## Modifications

- Bandeau de l'accueil affiché uniquement comme image : aucun lien ni mention « Agrandir l'affiche ».
- Six boutons « Accès rapides » uniformes : fond blanc, pictogramme rouge.
- Section « Les prochaines dates » : deux événements à venir maximum, en ordre chronologique.
- Menu « Tous les services » : suppression de « Mes droits ». Suppression du même raccourci de la barre latérale sur ordinateur ; les fiches pratiques restent dans « Mes outils ».

## Installation

1. Décompresser le ZIP.
2. À la racine du dépôt GitHub `adrienheritier/snudifo30`, remplacer exactement : `app.js`, `styles.css`, `index.html`, `sw.js`.
3. Enregistrer les changements sur `main` et laisser GitHub Pages déployer.
4. Actualiser l'application (Ctrl+Maj+R dans le navigateur), ou la fermer puis la rouvrir. En cas d'affichage obsolète sur mobile, réouvrir depuis le navigateur pour renouveler le cache.

Ne remplacez **aucun** fichier de `content/` ni de `assets/`. L'administration, le bandeau choisi et les contenus publiés sont inchangés.

Note : une ancienne URL directe vers `#/droits` reste techniquement utilisable ; ce correctif retire uniquement les raccourcis de navigation demandés.
