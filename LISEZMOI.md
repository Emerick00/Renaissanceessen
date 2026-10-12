# Renaissance Essen – version Netlify (administration + site public, mise à jour automatique)

Ce projet remplace le site statique : vous modifiez directement sur le site (bouton « 🔒 Espace administrateur »)
et tout le monde voit les changements, sans fichier à renvoyer.
Les données sont enregistrées dans Netlify Blobs (stockage de Netlify, gratuit à petit volume) : elles restent.

Tout le monde peut lire et exporter les PDF. Seul le mot de passe administrateur permet de modifier.

## Mise en ligne (à faire depuis un ordinateur, c'est beaucoup plus simple)

1. **GitHub** : créez un nouveau dépôt (privé ou public). Cliquez sur « Add file > Upload files »,
   décompressez cette archive et glissez TOUT son contenu (dossiers `public` et `netlify` compris,
   ainsi que `package.json` et `netlify.toml`), puis « Commit changes ».
2. **Netlify** : « Add new project > Import an existing project > GitHub », choisissez ce dépôt.
   Les réglages sont lus dans `netlify.toml` : laissez-les tels quels et lancez le déploiement.
3. **Mot de passe** : dans le projet Netlify, « Project configuration > Environment variables », ajoutez
   `ADMIN_PASSWORD` avec le mot de passe de votre choix (6 caractères minimum), puis relancez un déploiement
   (« Deploys > Trigger deploy »).
4. Ouvrez l'adresse du site, touchez « 🔒 Espace administrateur » en bas de page et saisissez le mot de passe.
5. Facultatif : renommez l'adresse dans « Project configuration > General > Project name ».
6. Une fois que tout fonctionne, vous pouvez supprimer l'ancien site (glisser-déposer).

Les noms exacts des menus peuvent changer : suivez l'aide de Netlify si un libellé est différent.

## Données

- Données de départ : le match du 11 octobre et les amendes saisis jusqu'ici (fichier `netlify/lib/seed.mjs`).
  Elles sont utilisées tant que vous n'avez rien enregistré sur le site.
- Après chaque modification, la version précédente est conservée (clé `state-prev` dans Netlify Blobs).
- Sauvegarde : l'adresse `https://VOTRE-SITE.netlify.app/api/state` affiche toutes les données en JSON.

## Sécurité

- L'écriture est refusée sans session administrateur (vérifiée côté serveur) ; cookie HttpOnly + SameSite=Strict + Secure.
- Les noms et les amendes sont des données personnelles : informez les joueurs si l'adresse est publique.

## Contenu

public/ (site : index.html, app.js, style.css, logo.jpg, vendor/ jsPDF MIT), netlify/functions/api.mjs (API),
netlify/lib/handler.mjs (logique), netlify/lib/seed.mjs (données de départ), netlify.toml, package.json.
