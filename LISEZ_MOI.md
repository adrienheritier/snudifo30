# SNUDI-FO 30 — application web pilote (V1)

Application web progressive (PWA) **fonctionnelle et installable** pour les collègues du premier degré du Gard. Le logo utilisé est le fichier officiel fourni, conservé comme tel dans `assets/logo-snudi-original.jpg`.

## Rubriques disponibles

- **Accueil** : liens rapides, dernières publications et prochaines dates.
- **Actualités** : publications réelles du site départemental, catégories, recherche, liens vers les articles sources.
- **Calendrier** : agenda et vue mensuelle, ajout d'un événement au calendrier via `.ics`.
- **Mes droits** : 12 fiches de référence, avec recherche, filtres, favoris, sources réglementaires ou institutionnelles et orientation vers le syndicat.
- **Accompagnement** : choix du type de difficulté, conseils de premier niveau et préparation d'un courriel au SNUDI-FO 30 dans l'application de messagerie de l'utilisateur.
- **Outils** : accès au comparateur officiel de mobilité, 5 modèles de courriers à copier ou envoyer, checklist, ressources de carrière et documents utiles.
- **Contact et adhésion** : appel téléphonique et courriel à partir des coordonnées officielles vérifiées, adresse, site, lien d'adhésion.
- **Carte scolaire** : recherche d'écoles documentées, lien source, possibilité de signaler une situation ; **la base est volontairement non exhaustive**.
- **Notifications internes** : nouveautés présentes dans l’application et préférences par thème. Pas de push distant dans cette version.
- **Administration locale** : ajouter, modifier et supprimer des actus, événements, fiches, écoles, courriers ; personnaliser les coordonnées ; sauvegarder/restaurer les données par export/import JSON.

## Mise en ligne sur GitHub Pages

1. Décompresser le ZIP **sur l'ordinateur**.
2. Dans le dépôt GitHub destiné à l'application, placer à la **racine** : `index.html`, `app.js`, `styles.css`, `manifest.webmanifest`, `sw.js`, `LISEZ_MOI.md` ainsi que le **dossier entier `assets`**.
3. Vérifier que le fichier `assets/logo-snudi-original.jpg` est bien présent dans GitHub (le chemin doit rester intact).
4. Dans `Settings > Pages`, choisir `Deploy from a branch`, la branche `main` et le dossier `/ (root)`, puis enregistrer.
5. Ouvrir `https://VOTRE-COMPTE.github.io/NOM-DU-DEPOT/` pour vérifier les écrans.
6. Sur iPhone, ouvrir l'adresse dans **Safari** > **Partager** > **Sur l'écran d'accueil**. Sur Android, utiliser le menu **Installer** si proposé.

Pour éviter les problèmes d'upload de dossiers, l'utilisation de **GitHub Desktop** est conseillée : copier tout le contenu décompressé dans le répertoire du dépôt, puis valider/publier les modifications. Le ZIP lui-même ne doit pas être envoyé comme unique fichier dans le dépôt.

## Prévisualisation immédiate

Le fichier distinct `SNUDI_FO_30_demo.html` fourni à côté du ZIP est une version **autonome, en un seul fichier**, pratique pour tester les écrans localement. Il n'est pas une PWA complète : pour l'installation avec gestion hors connexion, utiliser les fichiers du ZIP sur un hébergement HTTPS.

## Informations et limites importantes

1. **Les articles sont une photographie datée des dernières publications identifiées** : ils ne sont pas synchronisés automatiquement. Cliquer sur les liens pour les versions en ligne.
2. **Les formations annoncées comme « À confirmer » nécessitent validation** des horaires et lieux avant toute diffusion officielle. La plupart des dates administratives sont reliées à la page ministérielle.
3. **Le simulateur intra-départemental du Gard n'est pas implémenté** : cela nécessiterait les règles annuelles validées. Le comparateur interministériel officiel est proposé pour les mutations interdépartementales.
4. **Le simulateur de salaire n'est pas implémenté** : éviter un chiffrage faux ou périmé ; liens vers les services officiels.
5. **Aucune notification push réelle** : demande un service serveur et des mécanismes d'abonnement sécurisés.
6. **Pas de comptes utilisateurs, ni de base de dossiers syndicaux**, ni de stockage côté serveur. Le formulaire d'accompagnement prépare un `mailto:` ; l'envoi dépend du logiciel de messagerie installé.
7. **Administration seulement locale** : les modifications restent sur le navigateur qui les effectue. Un export JSON sert à transmettre une version des contenus à la personne chargée de la prochaine publication. Pour alimenter tous les utilisateurs en temps réel, prévoir un petit back-office connecté à une base/API et un système de publication validé.
8. Les fiches de droits sont **des synthèses d'orientation** ; vérification juridique et éditoriale par l'équipe syndicale requise avant toute publication destinée au public.
9. Éviter tout dépôt de données médicales, d'identification d'élèves, ou de pièces nominatives dans un futur espace public. Préparer conformité RGPD et confidentialité avant de créer des comptes/dossiers.

## Sources de départ (consultées le 15 novembre 2026)

- Coordonnées et publications du syndicat : https://snudi30.force-ouvriere.org/
- Adhésion : https://snudi30.force-ouvriere.org/-adhesion-
- Mutations 2027 : https://www.education.gouv.fr/mutation-des-personnels-enseignants-du-premier-degre-5498
- Comparateur officiel : https://info-mutations.phm.education.gouv.fr/cmpmo-front/
- Obligations de service : https://www.legifrance.gouv.fr/loda/id/LEGITEXT000034326444/
- Guide national AESH : https://www.education.gouv.fr/etre-accompagnant-des-eleves-en-situation-de-handicap-aesh-12188

## Prochaines étapes de développement

Connecter un flux éditorial contrôlé (actualités, agendas), intégrer le calculateur intra Gard avec paramètres de campagne vérifiés, enrichir les fiches de droits, installer des notifications distantes si nécessaires, et réserver un environnement sécurisé distinct aux dossiers individuels.
