<div align="center">
  <img alt="Paradisia" src="./assets/images/logo.png" width="200" />
</div>

<h2 align="center">
  Paradisia — Joueurs
  <br/>
  <a href="https://rudze.github.io/WEB-MC-Paradisia/" target="_blank">rudze.github.io/WEB-MC-Paradisia</a>
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

➡️ **Site en ligne :** [https://rudze.github.io/WEB-MC-Paradisia/](https://rudze.github.io/WEB-MC-Paradisia/)

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
│       ├── pages.yml           # Toutes les 5 min : récupère les données et publie le site
│       └── release.yml         # Release à chaque push sur main
├── scripts/
│   └── fetch_data.py           # Télécharge les données de l'API dans data/
└── assets/
    ├── css/style.css           # Thème (repris du portfolio)
    ├── js/script.js            # Lit les fichiers de data/ et remplit la page
    └── images/                 # Logo et favicon
```

---

## Comment ça marche

```
serveur Minecraft (API nh_api) ──> GitHub Actions, toutes les 5 min ──> data/*.json ──> GitHub Pages ──> navigateur
```

- **Pas d'appel à l'API depuis le navigateur.** GitHub Actions télécharge les données et les publie avec le site, en fichiers JSON. La page ne lit que ses propres fichiers.
- **Rien à installer sur le serveur**, et ni clé ni token : l'API est publique et en lecture seule.
- **Les données ont quelques minutes de retard.** L'heure de la dernière mise à jour s'affiche sous le nombre de joueurs en ligne.
- **Si le serveur change d'adresse**, modifie `API_URL` dans `scripts/fetch_data.py`.
- **Inactivité :** GitHub met en pause les tâches planifiées d'un repo sans commit depuis 60 jours. Il suffit alors de les relancer depuis l'onglet **Actions**.

Les images viennent de services publics :
- les têtes des joueurs : [mc-heads.net](https://mc-heads.net) ;
- les sprites des Pokémon : [PokeAPI sprites](https://github.com/PokeAPI/sprites).

---

## Lancer en local

```bash
python3 scripts/fetch_data.py
python3 -m http.server 8000
```

Ouvre ensuite **http://localhost:8000**.

---

## Mise en ligne

Dans le repo GitHub, va dans **Settings → Pages → Build and deployment** et mets **Source** sur **GitHub Actions**. C'est le workflow `pages.yml` qui publie le site.

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
