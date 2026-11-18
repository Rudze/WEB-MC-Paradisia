"""
Downloads everything the site shows from the Minecraft server's API: the players as JSON files
in data/, and the squaremap web map in map/. The page only reads files of the site itself
(no HTTP call from the browser).

GitHub Actions runs it every few minutes before publishing the site (.github/workflows/pages.yml).
To try the site locally:

    python3 scripts/fetch_data.py
    python3 -m http.server 8000

The API address can be changed with the PARADISIA_API_URL environment variable.
"""

import io
import json
import os
import shutil
import time
import zipfile
import urllib.parse
import urllib.request

API_URL = os.environ.get("PARADISIA_API_URL", "http://148.113.238.66:8091/api").rstrip("/")
ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..")
DATA_DIR = os.path.join(ROOT, "data")
MAP_DIR = os.path.join(ROOT, "map")


def get(path):
    with urllib.request.urlopen(API_URL + path, timeout=30) as response:
        return json.load(response)


def save(path, content):
    # "/players/Rudzee/pokemon" -> data/players/Rudzee/pokemon.json
    file = os.path.join(DATA_DIR, path.lstrip("/") + ".json")
    os.makedirs(os.path.dirname(file), exist_ok=True)
    with open(file, "w", encoding="utf-8") as out:
        json.dump(content, out, ensure_ascii=False)


def main():
    health = get("/health")
    health["updatedAt"] = int(time.time() * 1000)  # shown on the page as "mis à jour à ..."
    save("/health", health)

    players = get("/players")
    save("/players", players)

    for player in players["players"]:
        if not player["name"]:
            continue
        name = urllib.parse.quote(player["name"])
        save("/players/" + player["name"], get("/players/" + name))
        save("/players/" + player["name"] + "/pokemon", get("/players/" + name + "/pokemon"))

    print(f"Saved {players['count']} players from {API_URL}")

    save_map()


def save_map():
    # the squaremap web map of the build world (page + tiles), unzipped into map/
    try:
        with urllib.request.urlopen(API_URL + "/map.zip", timeout=300) as response:
            archive = zipfile.ZipFile(io.BytesIO(response.read()))
    except Exception as error:
        print(f"No map: {error}")
        return
    shutil.rmtree(MAP_DIR, ignore_errors=True)
    archive.extractall(MAP_DIR)
    make_map_sharp()
    print(f"Saved the map ({len(archive.namelist())} files)")


# Beyond its real resolution (1 pixel per block), squaremap lets the browser enlarge the images,
# which blurs them. Instead, each zoomed tile is drawn from the real one with smoothing turned
# off, so every block stays a sharp square.
SHARP_TILE = """
    createTile: function (coords, done) {
        var native = this.options.realMaxZoom;
        if (native === undefined || coords.z <= native) {
            return this._createRealTile(coords, done);
        }
        var factor = Math.pow(2, coords.z - native);
        var size = this.getTileSize().x;
        var part = size / factor;
        var mod = (n) => ((n % factor) + factor) % factor;
        var url = this._url.replace('{z}', native)
            .replace('{x}', Math.floor(coords.x / factor))
            .replace('{y}', Math.floor(coords.y / factor));

        var canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        var image = new Image();
        image.onload = () => {
            var context = canvas.getContext('2d');
            context.imageSmoothingEnabled = false;
            context.drawImage(image, mod(coords.x) * part, mod(coords.y) * part, part, part, 0, 0, size, size);
            done(null, canvas);
        };
        image.onerror = () => done(null, canvas);
        image.src = url;
        return canvas;
    },

    _createRealTile: function (coords, done) {"""


def make_map_sharp():
    layer = os.path.join(MAP_DIR, "js", "modules", "SquaremapTileLayer.js")
    control = os.path.join(MAP_DIR, "js", "modules", "LayerControl.js")
    try:
        with open(layer, encoding="utf-8") as f:
            layer_js = f.read()
        with open(control, encoding="utf-8") as f:
            control_js = f.read()
    except OSError:
        return
    old_tile = "\n    createTile: function (coords, done) {"
    old_zoom = "maxNativeZoom: world.zoom.max,"
    if old_tile not in layer_js or old_zoom not in control_js:
        print("squaremap changed: map left as it is")
        return
    with open(layer, "w", encoding="utf-8") as f:
        f.write(layer_js.replace(old_tile, SHARP_TILE, 1))
    with open(control, "w", encoding="utf-8") as f:
        f.write(control_js.replace(old_zoom, "maxNativeZoom: world.zoom.max + world.zoom.extra,\n            realMaxZoom: world.zoom.max,", 1))
    # high-density (Retina) screens enlarge the tiles again: keep them sharp too
    with open(os.path.join(MAP_DIR, "css", "styles.css"), "a", encoding="utf-8") as f:
        f.write("\ncanvas.leaflet-tile { image-rendering: pixelated; image-rendering: crisp-edges; }\n")


if __name__ == "__main__":
    main()
