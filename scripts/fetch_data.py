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
    print(f"Saved the map ({len(archive.namelist())} files)")


if __name__ == "__main__":
    main()
