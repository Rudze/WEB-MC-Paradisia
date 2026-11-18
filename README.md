<div align="center">
  <img alt="Paradisia" src="./assets/images/logo.png" width="200" />
</div>

<h2 align="center">
  Paradisia — Joueurs
</h2>

---

<div align="center">

[![forthebadge](https://forthebadge.com/images/badges/uses-html.svg)](https://forthebadge.com) &nbsp;
[![forthebadge](https://forthebadge.com/images/badges/uses-css.svg)](https://forthebadge.com) &nbsp;
[![forthebadge](https://forthebadge.com/images/badges/made-with-javascript.svg)](https://forthebadge.com) &nbsp;
</div>

---

## À propos

**Paradisia — Joueurs** est le tableau de bord des joueurs du serveur Minecraft **Paradisia** (Cobblemon). Il permet de chercher un joueur, puis d'afficher ses statistiques, son argent et ses Pokémon.

C'est un **site statique léger** : HTML, CSS et JavaScript, sans framework et sans étape de build. Il est hébergé sur **GitHub Pages**. Il reprend le thème du site [Portfolio Personal](https://github.com/Rudze/WEB-Portfolio-Personal-main).

Les données viennent de l'API du serveur Minecraft, fournie par le mod `nh_api`. Ce mod est documenté dans le repo [JAVA-MC-MODS-Paradisia](https://github.com/Rudze/JAVA-MC-MODS-Paradisia), dossier `mods/MC-NewHorizon-Mod-Api`.

---

## Fonctionnalités

* ✅ **Recherche** parmi tous les joueurs déjà connectés, avec un point vert pour ceux en ligne
* ✅ **Profil** : tête du joueur, vie, armure, faim, niveau d'expérience, mode de jeu, dimension et armure portée
* ✅ **Économie** : pièces d'or, d'argent et de bronze
* ✅ **Pokédex** : espèces vues et capturées, avec le pourcentage de complétion
* ✅ **Équipe** : les 6 Pokémon du joueur
* ✅ **PC** : on parcourt les boîtes une par une
* ✅ **Détail d'un Pokémon** au clic : nature, talent, objet tenu, Ball, IV, EV et attaques
* ✅ **Statistiques** : temps de jeu, morts, monstres tués, distance parcourue, blocs minés…
* ✅ **Lien direct** vers un joueur : `…/#Rudzee`
* ✅ **Responsive** : ordinateur, tablette et mobile

---

## Structure du projet

```
WEB-MC-Paradisia/
├── index.html                  # Contenu de la page
├── CHANGELOG.md                # Généré par semantic-release
├── .releaserc.json             # Configuration de semantic-release
├── .github/
│   └── workflows/
│       └── release.yml         # Release à chaque push sur main
└── assets/
    ├── css/style.css           # Thème (repris du portfolio)
    ├── js/script.js            # Récupère les données de l'API et remplit la page
    └── images/                 # Logo et favicon
```

---

## Comment ça marche

Le site est hébergé sur **GitHub Pages**. Le navigateur appelle directement l'**API publique** du serveur Minecraft :
- pas de clé, car les données ne sont pas sensibles ;
- l'adresse est la constante `API`, en haut de `assets/js/script.js`.

L'API doit être en **HTTPS**. GitHub Pages sert le site en HTTPS, et un navigateur bloque les appels HTTP faits depuis une page HTTPS. Sur le VPS, un reverse proxy (Caddy) gère le certificat et transmet les requêtes au mod `nh_api`, qui écoute sur `127.0.0.1:8091`.

Les images viennent de services publics :
- les têtes des joueurs : [mc-heads.net](https://mc-heads.net) ;
- les sprites des Pokémon : [PokeAPI sprites](https://github.com/PokeAPI/sprites).

---

## Lancer en local

```bash
python3 -m http.server 8000
```

Ouvre ensuite **http://localhost:8000**.

---

## Mise en ligne

Dans le repo GitHub, va dans **Settings → Pages → Build and deployment** :
- **Source** : `Deploy from a branch` ;
- **Branch** : `main`, dossier `/ (root)`.

Le site est ensuite publié à chaque push sur `main`.

---

## Versionnage

Le projet suit le **versionnage sémantique**, géré automatiquement par [semantic-release](https://semantic-release.gitbook.io).

À chaque push sur `main`, le workflow GitHub Actions :
- lit les messages de commit ;
- calcule la nouvelle version ;
- met à jour `CHANGELOG.md` ;
- crée le tag et la release GitHub.

Les messages de commit suivent les [Conventional Commits](https://www.conventionalcommits.org/fr) :

| Message | Effet sur la version |
|---|---|
| `fix: corrige l'affichage du PC` | patch : `1.0.0` → `1.0.1` |
| `feat: ajoute le classement des joueurs` | mineure : `1.0.0` → `1.1.0` |
| `feat!: …`, ou `BREAKING CHANGE:` dans le corps du commit | majeure : `1.0.0` → `2.0.0` |
| `docs:`, `style:`, `chore:`… | pas de nouvelle version |
