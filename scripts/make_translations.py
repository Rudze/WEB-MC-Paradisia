"""
Builds assets/data/fr.json: the French names the site shows for Pokémon (species, moves,
abilities, natures, Poké Balls and held items), taken from Cobblemon's own translation file.

Run it again after a Cobblemon update:

    python3 scripts/make_translations.py <path to the Cobblemon .jar>
"""

import json
import os
import sys
import zipfile

OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "assets", "data", "fr.json")


def main(jar):
    with zipfile.ZipFile(jar) as archive:
        lang = json.loads(archive.read("assets/cobblemon/lang/fr_fr.json"))

    names = {"species": {}, "moves": {}, "abilities": {}, "natures": {}, "items": {}}
    for key, text in lang.items():
        parts = key.split(".")
        # cobblemon.species.eevee.name -> species["eevee"]
        if parts[:2] == ["cobblemon", "species"] and len(parts) == 4 and parts[3] == "name":
            names["species"][parts[2]] = text
        # cobblemon.move.quickattack / cobblemon.ability.runaway / cobblemon.nature.mild (not the .desc lines)
        elif parts[:2] == ["cobblemon", "move"] and len(parts) == 3:
            names["moves"][parts[2]] = text
        elif parts[:2] == ["cobblemon", "ability"] and len(parts) == 3:
            names["abilities"][parts[2]] = text
        elif parts[:2] == ["cobblemon", "nature"] and len(parts) == 3:
            names["natures"][parts[2]] = text
        # item.cobblemon.poke_ball -> items["cobblemon:poke_ball"]
        elif parts[:2] == ["item", "cobblemon"] and len(parts) == 3:
            names["items"]["cobblemon:" + parts[2]] = text

    with open(OUT, "w", encoding="utf-8") as out:
        json.dump(names, out, ensure_ascii=False, separators=(",", ":"), sort_keys=True)
    print({section: len(values) for section, values in names.items()})


if __name__ == "__main__":
    main(sys.argv[1])
