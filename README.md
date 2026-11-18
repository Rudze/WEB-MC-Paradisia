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

* ✅ **Onglets** comme le Portfolio : **Accueil**, **Boutique** (en rose), **Joueurs**, **Carte**, **Blog**, et un lien vers le Portfolio
* ✅ **Boutique** : des cosmétiques donnés en jeu en échange d'un don, pour financer l'hébergement
* ✅ **Accueil** : présentation du serveur, étapes pour le rejoindre, boutons pour télécharger le modpack et rejoindre le Discord
* ✅ **Recherche** parmi tous les joueurs déjà connectés, avec un point vert pour ceux en ligne
* ✅ **Profil** : tête du joueur, cœurs, armure et faim avec les icônes de Minecraft, niveau d'expérience, dimension, armure portée
* ✅ **Économie** avec les pièces du mod Numismatic Overhaul
* ✅ **Pokédex**, **Équipe** et **PC** (on parcourt les boîtes), avec le détail de chaque Pokémon au clic, **en français** (espèces, attaques, talents, natures, objets)
* ✅ **Statistiques** : temps de jeu, morts, monstres tués, distance parcourue, blocs minés…
* ✅ **Carte** du monde de construction ([squaremap](https://github.com/jpenilla/squaremap)), intégrée au site
* ✅ **Blog** avec filtres par catégorie et une fenêtre de lecture, comme les projets du Portfolio
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
│   ├── fetch_data.py           # Télécharge les données (data/) et la carte (map/) depuis l'API
│   └── make_translations.py    # Crée assets/data/fr.json à partir des traductions de Cobblemon
└── assets/
    ├── css/style.css           # Thème (repris du portfolio)
    ├── data/fr.json            # Noms français des Pokémon, attaques, talents, natures et objets
    ├── js/script.js            # Lit les fichiers de data/ et remplit la page
    └── images/                 # Logo, favicon et icônes (cœurs, armure, faim, pièces)
```

---

## Comment ça marche

```
serveur Minecraft (API nh_api) ──> GitHub Actions, toutes les 5 min ──> data/*.json + map/ ──> GitHub Pages ──> navigateur
```

- **La carte** est faite par le mod [squaremap](https://github.com/jpenilla/squaremap) sur le serveur. L'API la renvoie zippée (`/api/map.zip`) et elle est publiée avec le site dans `map/`, puis affichée dans l'onglet Carte.
- **Pas d'appel à l'API depuis le navigateur.** GitHub Actions télécharge les données et les publie avec le site, en fichiers JSON. La page ne lit que ses propres fichiers.
- **Rien à installer sur le serveur**, et ni clé ni token : l'API est publique et en lecture seule.
- **Les données ont quelques minutes de retard.** L'heure de la dernière mise à jour s'affiche sous le nombre de joueurs en ligne.
- **Si le serveur change d'adresse**, modifie `API_URL` dans `scripts/fetch_data.py`.
- **Inactivité :** GitHub met en pause les tâches planifiées d'un repo sans commit depuis 60 jours. Il suffit alors de les relancer depuis l'onglet **Actions**.

---

## Modifier le contenu

**Lien Discord.** Dans `index.html`, c'est le bouton `data-discord` de la page d'accueil.

**Ajouter un objet à la boutique.** Dans `index.html`, section `#BOUTIQUE`, copie un bloc `<li class="shop-item">` et change l'image (`assets/images/shop/`), le nom et le prix.

**Noms français des Pokémon.** Après une mise à jour de Cobblemon, relance `python3 scripts/make_translations.py <jar de Cobblemon>`.

**Ajouter un article au blog.** Dans `index.html`, section `#BLOG` :
1. copie le bloc d'exemple `<li class="post-item">` (en commentaire) en haut de la liste, sans les marques de commentaire ;
2. change la catégorie (`data-category` : `annonces`, `mises-a-jour` ou `evenements`), le texte de la couverture, la date et le titre ;
3. écris l'article dans `<div class="post-details">`.

**Images.** Les têtes des joueurs viennent de [mc-heads.net](https://mc-heads.net) et les sprites des Pokémon de [PokeAPI](https://github.com/PokeAPI/sprites). Cobblemon n'a que des modèles 3D, pas d'images 2D. Les icônes de cœur, d'armure et de faim viennent de Minecraft, et les pièces du mod Numismatic Overhaul.

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
