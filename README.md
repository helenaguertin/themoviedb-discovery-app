# themoviedb-discovery-app

Application web de découverte de films qui s'appuie sur l'API de [The Movie Database (TMDB)](https://www.themoviedb.org/). Elle affiche les films populaires en France et permet de consulter leur fiche détaillée.

## Fonctionnalités

- Liste des films populaires, avec pagination et paramètres de langue et de région.
- Recherche des films par année de sortie via la route de découverte de TMDB.
- Fiche détaillée pour chaque film.
- Pages « À propos » et « Page introuvable ».
- Thème clair ou sombre, conservé dans le navigateur.
- API Express intermédiaire pour appeler TMDB sans exposer le jeton dans le navigateur.

Les paramètres par défaut sont la langue `fr-FR`, la région `FR` et la première page.

## Prérequis

- Node.js 24 (version indiquée dans `.nvmrc`).
- npm.
- Un jeton d'accès à l'API TMDB. Vous pouvez en obtenir un depuis les paramètres de votre compte TMDB, dans la section API.

## Installation et démarrage

1. Installez les dépendances :

   ```sh
   npm install
   ```

2. Créez un fichier `.env` à la racine du projet et ajoutez votre jeton d'accès :

   ```dotenv
   TMDB_ACCESS_TOKEN=votre_jeton_d_acces_tmdb
   ```

   Gardez ce jeton privé et ne le publiez pas dans le dépôt.

3. Démarrez le serveur et l'application :

   ```sh
   npm run dev
   ```

4. Ouvrez [http://localhost:5173](http://localhost:5173).

Le serveur Express écoute sur le port `3000`. Vite sert l'interface sur le port `5173` et transmet les requêtes `/api` au serveur Express.

## API locale

| Méthode | Route                  | Description                                                       |
| ------- | ---------------------- | ----------------------------------------------------------------- |
| `GET`   | `/api/health`          | Vérifie que le serveur répond.                                    |
| `GET`   | `/api/movies/popular`  | Renvoie les films populaires.                                     |
| `GET`   | `/api/movies/:id`      | Renvoie les détails du film correspondant à son identifiant TMDB. |
| `GET`   | `/api/discover/movies` | Renvoie une page de films correspondant à une année de sortie.    |

Les routes des films acceptent les paramètres `language`, `page` et `region`. Exemple :

```text
/api/movies/popular?language=fr-FR&page=1&region=FR
```

La route de découverte exige le paramètre `year` (de `1000` à `9999`) et accepte
les mêmes paramètres optionnels `language`, `page` et `region` :

```text
/api/discover/movies?year=2020
/api/discover/movies?year=2020&language=en-US&page=2&region=US
```

Elle interroge une seule page de TMDB à chaque appel. Une année absente ou
invalide renvoie HTTP 400 ; une erreur TMDB renvoie HTTP 500.

## Vérifications

```sh
npm test          # Lance les tests avec la couverture
npm run test:verbose
npm run lint      # Vérifie le code
npm run fmt:check # Vérifie le formatage
```

La configuration de couverture des tests exige 100 % pour les instructions, branches, fonctions et lignes.
