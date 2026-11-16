# SNUDI-FO 30 — Correctif V3.7 : bibliothèque PDF partagée

## Installation sur la V3.6.1 (et versions compatibles V3.6)

1. **Sauvegarder** les fichiers du dépôt GitHub et exporter une sauvegarde JSON depuis l'administration. L'export JSON ne contient pas les fichiers PDF ou les photos ; la sauvegarde complète du dépôt GitHub les contient.
2. Décompresser `SNUDI_FO_30_V3_7_CORRECTIF_PDF_PARTAGES.zip`.
3. Dans `adrienheritier/snudifo30`, remplacer ou ajouter à la **racine** les fichiers du correctif :
   - `admin.html`
   - `admin.js`
   - `admin.css`
   - `app.js`
   - `index.html`
   - `styles.css`
   - `pdf-library.js` (**nouveau**)
   - `sw.js`
4. Enregistrer sur la branche `main` (si c'est la branche GitHub Pages du dépôt).
5. Attendre la fin du déploiement GitHub Pages, puis faire un rechargement forcé de l'administration. Sur téléphone, fermer/rouvrir l'application si nécessaire.

**Ne remplacer sous aucun prétexte** `content/news.json`, `content/events.json`, `content/tools.json` ou `content/home.json` : le correctif ne les contient pas et conserve donc toutes les publications, les classements, les réglages et le bandeau déjà publiés.

## Utilisation de la bibliothèque PDF

Dans `admin.html`, ouvrir une **actualité**, un **événement** ou une publication **Mes outils**, puis accéder à la section **« Documents PDF joints à cette publication »**.

- **Importer un nouveau PDF** : choisir un ou plusieurs fichiers `.pdf`, modifier si nécessaire le titre affiché, puis cliquer sur « Publier sur GitHub ».
- **Réutiliser un PDF existant** : sélectionner un document dans la bibliothèque et cliquer sur **« + Associer ce PDF »**. Aucune nouvelle copie n'est créée.
- **Retirer un PDF de cette publication** : cliquer sur « Retirer », puis publier la modification. Les autres publications conservant ce document restent intactes.
- **Supprimer une publication** : l'administration recherche les références restantes dans les actualités, le calendrier et tous les outils. Si un PDF géré n'est plus utilisé, il est supprimé du dossier courant sur GitHub.

Chaque document dispose sur l'application publique de boutons **Consulter** et **Télécharger**. Dans les événements du calendrier, ces boutons apparaissent directement dans la fiche de l'événement.

Les anciens liens vers les PDF externes de « Affichages écoles » restent utilisables.

## Limites et stockage

- **10 Mio au maximum par PDF**, contrôle volontairement conservateur pour éviter les grosses requêtes depuis un navigateur.
- **20 PDF par publication**.
- Les fichiers sont stockés dans `media/pdfs/` et nommés d'après leur empreinte SHA-256. Deux fichiers de **contenu strictement identique** sont donc stockés une seule fois, même si leur nom d'origine diffère.
- Le jeton GitHub déjà configuré avec `Contents: Read and write` reste suffisant.
- Cette limite applicative de 10 Mio est distincte des limites globales de GitHub et de GitHub Pages.

### Suppression automatique : ce qu'elle fait exactement

La suppression retire le fichier **de la branche GitHub Pages actuelle**, et non des anciens commits Git. **L'historique Git conserve les versions anciennes**, ce qui signifie que la taille historique du dépôt n'est pas entièrement récupérée automatiquement. Il ne faut pas considérer cette suppression comme un effacement confidentiel ou irréversible des fichiers.

Le nettoyage est **conservateur** : si l'un des fichiers d'actualités, d'événements ou d'outils ne peut pas être lu, le PDF n'est pas supprimé ; la publication, elle, reste enregistrée. Les erreurs sont annoncées dans l'administration. Un PDF envoyé lors d'une publication échouée peut exceptionnellement rester sur GitHub si sa suppression ne peut pas être vérifiée.

La publication par l'API des contenus GitHub repose sur plusieurs commits successifs et **n'est pas transactionnelle** ; évitez que plusieurs administrateurs modifient ou publient en même temps des contenus utilisant les mêmes PDF. Une vraie garantie transactionnelle nécessiterait un serveur d'administration ou un gestionnaire de publication centralisé.

### Important : données et sauvegardes

- Ne pas téléverser de données personnelles ou confidentielles. Un PDF publié sur GitHub Pages est public.
- Vérifier les droits de diffusion des images et PDF avant publication.
- Pour une sauvegarde intégrale de l'application et des PDF, télécharger également une archive du dépôt GitHub ; l'option « Exporter une sauvegarde » de l'administration ne sauvegarde que les données et les chemins des fichiers.

## Tests

Contrôles réalisés dans Chromium avec une simulation des réponses de l'API GitHub : import PDF, réutilisation sans transfert, conservation lors d'une suppression si un autre article l'utilise, suppression après la dernière référence, erreur d'accès à une catégorie empêchant le nettoyage, rejet des fichiers non PDF, rendu public des pièces jointes dans Actualités, Calendrier et Mes outils. Vérifications syntaxiques JavaScript réalisées avec Node.js.

**Non testé :** la publication sur ton véritable dépôt GitHub, qui nécessite la mise en ligne des fichiers de ce correctif et une première opération avec ton jeton d'administration.
