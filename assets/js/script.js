'use strict';

/*
 * Paradisia player dashboard.
 *
 * The data comes from the Minecraft server's API (mod nh_api). GitHub Actions downloads it every
 * few minutes into the data/ folder of the site (scripts/fetch_data.py), so the page only reads
 * JSON files of the site itself: "/players/Rudzee" -> ./data/players/Rudzee.json
 */

const DATA = './data';

// pictures from public services
const headUrl = (uuid, size) => `https://mc-heads.net/avatar/${uuid}/${size}`;
const spriteUrl = (pokemon) => 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/'
  + (pokemon.shiny ? 'shiny/' : '') + pokemon.dexNumber + '.png';

const STAT_NAMES = { hp: 'PV', atk: 'Attaque', def: 'Défense', spa: 'Atq. Spé', spd: 'Déf. Spé', spe: 'Vitesse' };
const DIMENSIONS = {
  'minecraft:overworld': 'Monde',
  'minecraft:the_nether': 'Nether',
  'minecraft:the_end': 'End',
  'nh_worldbuild:world_build': 'Monde construction',
};
const GAME_MODES = { survival: 'Survie', creative: 'Créatif', adventure: 'Aventure', spectator: 'Spectateur' };
const GENDERS = { male: '♂', female: '♀', genderless: '' };
const ARMOR_SLOTS = ['head', 'chest', 'legs', 'feet'];



// page elements
const $ = (selector) => document.querySelector(selector);

const serverStatus = $('[data-server-status]');
const search = $('[data-search]');
const playerList = $('[data-player-list]');
const playerTitle = $('[data-player-title]');
const empty = $('[data-empty]');
const cards = $('[data-cards]');



// state
let players = [];        // every player who ever joined
let pcBoxes = [];        // boxes of the selected player's pc
let boxIndex = 0;        // box currently shown



/*-----------------------------------*\
  #HELPERS
\*-----------------------------------*/

async function getJson(path) {
  const response = await fetch(DATA + path + '.json', { cache: 'no-store' });
  if (!response.ok) throw new Error(`${path}: HTTP ${response.status}`);
  return response.json();
}

// builds an element: el('li', 'class-name', 'text')
function el(tag, className, text) {
  const element = document.createElement(tag);
  if (className) element.className = className;
  if (text !== undefined) element.textContent = text;
  return element;
}

// "301103" seconds -> "83 h 38 min"
function formatDuration(seconds) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  return hours > 0 ? `${hours} h ${minutes} min` : `${minutes} min`;
}

function formatNumber(value) {
  return Number(value).toLocaleString('fr-FR');
}

function formatDate(timestamp) {
  return new Date(timestamp).toLocaleString('fr-FR', { dateStyle: 'medium', timeStyle: 'short' });
}

// "quickattack" -> "Quickattack", "cobblemon:poke_ball" -> "Poke ball"
function prettify(id) {
  const name = String(id).split(':').pop().replace(/_/g, ' ');
  return name.charAt(0).toUpperCase() + name.slice(1);
}

// fills a <ul> with "label ... value" lines
function fillFacts(list, facts) {
  list.replaceChildren(...facts.map(([label, value]) => {
    const item = el('li');
    item.append(el('span', '', label), el('span', '', value));
    return item;
  }));
}

function setBar(name, value, max) {
  $(`[data-bar="${name}"]`).style.width = Math.min(100, (value / max) * 100) + '%';
}



/*-----------------------------------*\
  #SERVER STATUS AND PLAYER LIST
\*-----------------------------------*/

async function loadServer() {
  try {
    const health = await getJson('/health');
    const time = new Date(health.updatedAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    serverStatus.textContent = `${health.onlinePlayers} / ${health.maxPlayers} en ligne · maj ${time}`;
  } catch (error) {
    serverStatus.textContent = 'Serveur hors ligne';
  }
}

async function loadPlayers() {
  try {
    const data = await getJson('/players');
    // online players first, then the most recently seen
    players = data.players
      .filter((player) => player.name)
      .sort((a, b) => (b.online - a.online) || (b.lastSeen - a.lastSeen));
    renderPlayerList();
  } catch (error) {
    playerList.replaceChildren(el('li', 'muted', 'Impossible de charger les joueurs.'));
  }
}

function renderPlayerList() {
  const query = search.value.trim().toLowerCase();
  const shown = players.filter((player) => player.name.toLowerCase().includes(query));

  playerList.replaceChildren(...shown.map((player) => {
    const button = el('button');
    button.dataset.name = player.name;
    button.classList.toggle('active', location.hash === '#' + player.name);

    const head = el('img');
    head.src = headUrl(player.uuid, 28);
    head.alt = '';

    button.append(head, el('span', 'player-name', player.name), el('span', 'dot' + (player.online ? ' online' : '')));
    button.addEventListener('click', () => {
      // same player again: the address doesn't change, so open the page directly
      if (location.hash === '#' + player.name) openPlayerFromAddress();
      else location.hash = player.name;
    });

    const item = el('li', 'player-item');
    item.append(button);
    return item;
  }));

  if (shown.length === 0) playerList.append(el('li', 'muted', 'Aucun joueur trouvé.'));
}

search.addEventListener('input', renderPlayerList);



/*-----------------------------------*\
  #SELECTED PLAYER
\*-----------------------------------*/

async function showPlayer(name) {
  if (!name) return;
  try {
    const [player, pokemon] = await Promise.all([
      getJson('/players/' + name),
      getJson('/players/' + name + '/pokemon'),
    ]);
    renderProfile(player);
    renderEconomy(player.economy);
    renderPokedex(player.pokedex);
    renderStats(player.stats);
    renderParty(pokemon.pokemon.party);
    pcBoxes = pokemon.pokemon.pc.boxes;
    boxIndex = 0;
    renderBox();
    $('[data-pokemon-card]').hidden = true;

    playerTitle.textContent = player.name;
    empty.hidden = true;
    cards.hidden = false;
  } catch (error) {
    playerTitle.textContent = 'Joueurs';
    empty.textContent = `Le joueur « ${name} » est introuvable.`;
    empty.hidden = false;
    cards.hidden = true;
  }
  renderPlayerList();
}

function renderProfile(player) {
  const status = player.status;

  $('[data-head]').src = headUrl(player.uuid, 80);
  $('[data-name]').textContent = player.name;

  const online = $('[data-online]');
  online.textContent = player.online ? 'En ligne' : 'Hors ligne';
  online.className = 'badge' + (player.online ? ' online' : '');
  $('[data-last-seen]').textContent = player.online ? '' : 'Vu le ' + formatDate(player.lastSeen);

  // rows of minecraft icons: 1 icon = 2 points, like in game
  renderHud('health', 'heart', Math.ceil(status.health), status.maxHealth, `${Math.ceil(status.health) / 2} / ${status.maxHealth / 2}`);
  renderHud('armor', 'armor', status.armor, 20, `${status.armor / 2} / 10`);
  renderHud('food', 'food', status.food, 20, `${status.food / 2} / 10`);

  fillFacts($('[data-profile-facts]'), [
    ['Niveau d\'expérience', status.xpLevel],
    ['Mode de jeu', GAME_MODES[status.gameMode] || status.gameMode],
    ['Dimension', DIMENSIONS[status.dimension] || prettify(status.dimension)],
  ]);

  const armor = ARMOR_SLOTS.map((slot) => status.armorItems[slot]).filter(Boolean);
  $('[data-armor]').replaceChildren(...armor.map((item) => el('li', '', item.name)));
}

// one row of icons: "points" out of "max", e.g. 7 points out of 20 = 3 full hearts, 1 half, 6 empty
function renderHud(row, icon, points, max, label) {
  const icons = [];
  for (let i = 0; i < Math.ceil(max / 2); i++) {
    const left = points - i * 2;
    const state = left >= 2 ? 'full' : left === 1 ? 'half' : 'empty';
    icons.push(el('span', `icon ${icon}-${state}`));
  }
  $(`[data-hud="${row}"]`).replaceChildren(...icons, el('span', 'value', label));
}

function renderEconomy(economy) {
  // coin textures of the Numismatic Overhaul mod
  const coins = [['gold', 'Or', economy.gold], ['silver', 'Argent', economy.silver], ['bronze', 'Bronze', economy.bronze]];
  $('[data-coins]').replaceChildren(...coins.map(([coin, label, amount]) => {
    const image = el('img');
    image.src = `./assets/images/icons/coin_${coin}.png`;
    image.alt = '';
    const name = el('span');
    name.append(image, label);

    const item = el('li');
    item.append(name, el('strong', '', formatNumber(amount)));
    return item;
  }));
}

function renderPokedex(pokedex) {
  fillFacts($('[data-pokedex]'), [
    ['Vus', pokedex.seen],
    ['Capturés', pokedex.caught],
    ['Complétion', `${((pokedex.caught / pokedex.total) * 100).toFixed(1)} %`],
  ]);
  setBar('pokedex', pokedex.caught, pokedex.total);
}

function renderStats(stats) {
  const list = [
    ['Temps de jeu', formatDuration(stats.playTimeSeconds)],
    ['Connexions', formatNumber(stats.sessions)],
    ['Depuis la dernière mort', formatDuration(stats.timeSinceDeathSeconds)],
    ['Morts', formatNumber(stats.deaths)],
    ['Monstres tués', formatNumber(stats.mobKills)],
    ['Joueurs tués', formatNumber(stats.playerKills)],
    ['Dégâts infligés', formatNumber(stats.damageDealt)],
    ['Dégâts subis', formatNumber(stats.damageTaken)],
    ['Distance parcourue', `${formatNumber(stats.distanceKm)} km`],
    ['Sauts', formatNumber(stats.jumps)],
    ['Blocs minés', formatNumber(stats.blocksMined)],
    ['Objets fabriqués', formatNumber(stats.itemsCrafted)],
    ['Objets utilisés', formatNumber(stats.itemsUsed)],
    ['Poissons pêchés', formatNumber(stats.fishCaught)],
    ['Échanges villageois', formatNumber(stats.villagerTrades)],
    ['Nuits dormies', formatNumber(stats.timesSlept)],
  ];
  $('[data-stats]').replaceChildren(...list.map(([label, value]) => {
    const item = el('li');
    item.append(el('strong', '', value), el('span', 'muted', label));
    return item;
  }));
}



/*-----------------------------------*\
  #POKÉMON: PARTY, PC AND DETAILS
\*-----------------------------------*/

// one square of the party or the pc, empty or with a pokémon
function pokemonSlot(pokemon, showName) {
  const slot = el('li', 'slot');
  if (!pokemon) return slot;

  const button = el('button');
  button.title = pokemon.nickname || pokemon.species;

  const sprite = el('img');
  sprite.src = spriteUrl(pokemon);
  sprite.alt = pokemon.species;
  sprite.loading = 'lazy';
  sprite.onerror = () => { sprite.style.visibility = 'hidden'; };   // no picture for this species

  button.append(sprite, el('span', 'level', 'N.' + pokemon.level));
  if (pokemon.shiny) button.append(el('span', 'star', '★'));
  if (showName) button.append(el('span', 'slot-name', pokemon.nickname || pokemon.species));

  button.addEventListener('click', () => {
    document.querySelectorAll('.slot button.active').forEach((other) => other.classList.remove('active'));
    button.classList.add('active');
    showPokemon(pokemon);
  });

  slot.append(button);
  return slot;
}

function renderParty(party) {
  // 6 squares, by slot number, so empty places stay visible
  const slots = Array.from({ length: 6 }, (_, index) => party.find((pokemon) => pokemon.slot === index));
  $('[data-party]').replaceChildren(...slots.map((pokemon) => pokemonSlot(pokemon, true)));
}

function renderBox() {
  const box = pcBoxes[boxIndex] || { name: 'PC vide', pokemon: [] };
  $('[data-box-name]').textContent = box.name || `Boîte ${boxIndex + 1}`;
  $('[data-box-prev]').disabled = boxIndex === 0;
  $('[data-box-next]').disabled = boxIndex >= pcBoxes.length - 1;

  // a box has 30 places
  const slots = Array.from({ length: 30 }, (_, index) => box.pokemon.find((pokemon) => pokemon.slot === index));
  $('[data-pc]').replaceChildren(...slots.map((pokemon) => pokemonSlot(pokemon, false)));
}

$('[data-box-prev]').addEventListener('click', () => { boxIndex--; renderBox(); });
$('[data-box-next]').addEventListener('click', () => { boxIndex++; renderBox(); });

function showPokemon(pokemon) {
  const card = $('[data-pokemon-card]');
  const gender = GENDERS[pokemon.gender] || '';
  $('[data-pokemon-title]').textContent =
    `${pokemon.shiny ? '★ ' : ''}${pokemon.nickname || pokemon.species} ${gender} — N.${pokemon.level}`;

  const sprite = el('img');
  sprite.src = spriteUrl(pokemon);
  sprite.alt = pokemon.species;

  // general information
  const facts = el('ul', 'facts');
  fillFacts(facts, [
    ['Espèce', `#${pokemon.dexNumber} ${pokemon.species}`],
    ['PV', `${pokemon.health.current} / ${pokemon.health.max}`],
    ['Nature', prettify(pokemon.nature)],
    ['Talent', prettify(pokemon.ability)],
    ['Objet tenu', pokemon.heldItem ? prettify(pokemon.heldItem) : '—'],
    ['Ball', prettify(pokemon.ball)],
    ['Amitié', pokemon.friendship],
    ['Dresseur d\'origine', pokemon.originalTrainer || '—'],
  ]);

  // IVs and EVs, then the moves
  const right = el('div');
  const table = el('ul', 'stat-table');
  const header = el('li', 'muted');
  header.append(el('span'), el('span'), el('span', '', 'IV'), el('span', '', 'EV'));
  table.append(header);
  for (const [key, label] of Object.entries(STAT_NAMES)) {
    const line = el('li');
    const bar = el('span', 'bar');
    const fill = el('span');
    fill.style.width = (pokemon.ivs[key] / 31) * 100 + '%';
    bar.append(fill);
    line.append(el('span', '', label), bar, el('span', '', pokemon.ivs[key]), el('span', '', pokemon.evs[key]));
    table.append(line);
  }

  const moves = el('ul', 'moves');
  moves.append(...pokemon.moves.map((move) => {
    const item = el('li');
    item.append(el('span', '', prettify(move.name)), el('span', 'muted', `${move.pp}/${move.maxPp}`));
    return item;
  }));
  right.append(table, el('div', 'separator'), moves);

  $('[data-pokemon-details]').replaceChildren(sprite, facts, right);
  card.hidden = false;
  card.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}



/*-----------------------------------*\
  #PAGES (tabs, like the portfolio)
\*-----------------------------------*/

const navLinks = document.querySelectorAll('[data-nav-link]');
const pages = document.querySelectorAll('[data-page]');

function showPage(name) {
  pages.forEach((page) => page.classList.toggle('active', page.dataset.page === name));
  navLinks.forEach((link) => link.classList.toggle('active', link.dataset.navLink === name));
}

navLinks.forEach((link) => link.addEventListener('click', () => {
  showPage(link.dataset.navLink);
  window.scrollTo(0, 0);
}));



/*-----------------------------------*\
  #ACCUEIL: launcher choice (Prism or CurseForge)
\*-----------------------------------*/

const launcherButtons = document.querySelectorAll('[data-launcher-btn]');
const launcherSteps = document.querySelectorAll('[data-launcher]');

launcherButtons.forEach((button) => button.addEventListener('click', () => {
  const launcher = button.dataset.launcherBtn;
  launcherButtons.forEach((other) => other.classList.toggle('active', other === button));
  launcherSteps.forEach((steps) => { steps.hidden = steps.dataset.launcher !== launcher; });
}));



/*-----------------------------------*\
  #BLOG: category filter and post window (the portfolio's projects)
\*-----------------------------------*/

const posts = [...document.querySelectorAll('.post-item')];

// "no post yet" message while the blog is empty
$('[data-blog-empty]').hidden = posts.length > 0;
const filterButtons = document.querySelectorAll('[data-filter-btn]');

filterButtons.forEach((button) => button.addEventListener('click', () => {
  const category = button.dataset.filterBtn;
  filterButtons.forEach((other) => other.classList.toggle('active', other === button));
  posts.forEach((post) => post.classList.toggle('active', category === 'all' || post.dataset.category === category));
}));

const pm = $('[data-pm]');
let currentPost = null;

// only the posts shown by the filter
const visiblePosts = () => posts.filter((post) => post.classList.contains('active'));

function fillPost(post) {
  $('[data-pm-media]').innerHTML = post.querySelector('.post-cover').outerHTML;
  $('[data-pm-meta]').textContent = post.querySelector('.post-meta').textContent;
  $('[data-pm-title]').textContent = post.querySelector('.post-title').textContent;
  $('[data-pm-details]').innerHTML = post.querySelector('.post-details').innerHTML;
  const list = visiblePosts();
  $('[data-pm-count]').textContent = `${list.indexOf(post) + 1} / ${list.length}`;
  currentPost = post;
}

function openPost(post) {
  fillPost(post);
  pm.classList.add('open');
  pm.setAttribute('aria-hidden', 'false');
  document.body.classList.add('pm-locked');
}

function closePost() {
  pm.classList.remove('open');
  pm.setAttribute('aria-hidden', 'true');
  document.body.classList.remove('pm-locked');
  currentPost = null;
}

// previous (-1) or next (+1) post
function stepPost(direction) {
  const list = visiblePosts();
  fillPost(list[(list.indexOf(currentPost) + direction + list.length) % list.length]);
}

posts.forEach((post) => post.querySelector('[data-post-open]').addEventListener('click', () => openPost(post)));
pm.querySelectorAll('[data-pm-close]').forEach((button) => button.addEventListener('click', closePost));
$('[data-pm-prev]').addEventListener('click', () => stepPost(-1));
$('[data-pm-next]').addEventListener('click', () => stepPost(1));

document.addEventListener('keydown', (e) => {
  if (!currentPost) return;
  if (e.key === 'Escape') closePost();
  if (e.key === 'ArrowLeft') stepPost(-1);
  if (e.key === 'ArrowRight') stepPost(1);
});



/*-----------------------------------*\
  #BACKGROUND: dots lit around the cursor (from the portfolio)
\*-----------------------------------*/

const bgFx = $('[data-bg-fx]');

if (bgFx && window.matchMedia('(pointer: fine)').matches) {
  let frame = 0;
  window.addEventListener('pointermove', (e) => {
    cancelAnimationFrame(frame);
    frame = requestAnimationFrame(() => {
      bgFx.style.setProperty('--mx', e.clientX + 'px');
      bgFx.style.setProperty('--my', e.clientY + 'px');
    });
  }, { passive: true });
}



/*-----------------------------------*\
  #START
\*-----------------------------------*/

// the selected player is kept in the address (#Rudzee), so a link opens their page directly
function openPlayerFromAddress() {
  const name = decodeURIComponent(location.hash.slice(1));
  if (!name) return;
  showPage('joueurs');
  showPlayer(name);
}

window.addEventListener('hashchange', openPlayerFromAddress);

loadServer();
loadPlayers().then(openPlayerFromAddress);

// the data is refreshed every few minutes, so the counter is reloaded every minute
setInterval(loadServer, 60000);
