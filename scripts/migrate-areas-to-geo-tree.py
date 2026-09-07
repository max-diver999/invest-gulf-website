#!/usr/bin/env python3
"""Move a batch of /areas/ pages into the /uae/ geography tree.

The old `/areas/{slug}-property-investment/` pattern carries no search volume on
any district, which the September 2026 demand study measured directly: the
`invest` column is zero for all 57 of them. Migration therefore does three
things at once, and doing fewer would waste the move:

1. gives the page a `path` so it renders inside the geography tree
2. retitles it toward the phrase people actually search, where one exists
3. strips the dead "investment guide" lead from the description

A 301 from the old URL is added to vercel.json in the same pass.
"""
from __future__ import annotations

import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
AREAS = ROOT / "src/content/areas"
VERCEL = ROOT / "vercel.json"

# slug -> (path under the tree, parent hub, new title)
# Titles follow the best-performing phrase from data/area_demand.json. Where the
# district has no measurable demand on any phrase, the title is neutral rather
# than invented: there is nothing to target, and the move is for tree
# consistency rather than for traffic.
BATCH: dict[str, tuple[str, str, str]] = {
    "al-barari": ("uae/dubai/al-barari", "uae/dubai", "Al Barari Villas for Sale: Prices and Yields"),
    "discovery-gardens": ("uae/dubai/discovery-gardens", "uae/dubai", "Discovery Gardens Apartments: Prices and Yields"),
    "dubai-creek-harbour": ("uae/dubai/dubai-creek-harbour", "uae/dubai", "Dubai Creek Harbour Apartments for Sale"),
    "dubai-hills-estate": ("uae/dubai/dubai-hills-estate", "uae/dubai", "Villas for Sale in Dubai Hills: Prices and Yields"),
    "meydan-horizon": ("uae/dubai/meydan-horizon", "uae/dubai", "Property in Meydan Horizon: What a Buyer Checks"),
    "the-valley-dubai": ("uae/dubai/the-valley", "uae/dubai", "The Valley by Emaar: Entry Villas and What to Check"),
    "tilal-al-ghaf": ("uae/dubai/tilal-al-ghaf", "uae/dubai", "Property in Tilal Al Ghaf: What a Buyer Should Check"),
    "villanova": ("uae/dubai/villanova", "uae/dubai", "Villanova Villas for Sale: Prices and Costs"),
    "yas-island": ("uae/abu-dhabi/yas-island", "uae/abu-dhabi", "Yas Island Villas for Sale: Prices and Yields"),
    "masdar-city": ("uae/abu-dhabi/masdar-city", "uae/abu-dhabi", "Masdar City Apartments for Sale: Prices and Yields"),
    "hudayriyat-island": ("uae/abu-dhabi/hudayriyat-island", "uae/abu-dhabi", "Property on Hudayriyat Island: What to Check"),
    "al-ghadeer": ("uae/abu-dhabi/al-ghadeer", "uae/abu-dhabi", "Property in Al Ghadeer: What a Buyer Should Check"),
}

# Leading phrases that sell the dead framing, mapped to a neutral opening that
# keeps every fact that follows them.
DESC_LEADS = [
    (re.compile(r'^"?([A-Z][A-Za-z’\' ]+?)(?: Dubai| Abu Dhabi)? (?:property )?investment (?:guide|analysis), '), r'\1 in 2026: '),
]


def rewrite_description(desc: str) -> str:
    for pattern, replacement in DESC_LEADS:
        new = pattern.sub(replacement, desc)
        if new != desc:
            return new
    return desc


def migrate(slug: str, path: str, parent: str, title: str) -> str | None:
    source = AREAS / f"{slug}-property-investment.mdx"
    if not source.is_file():
        return f"missing: {source.name}"
    text = source.read_text(encoding="utf-8")
    if re.search(r"^path:", text, re.MULTILINE):
        return f"already migrated: {slug}"

    text = re.sub(r'^title: ".*"$', f'title: "{title}"', text, count=1, flags=re.MULTILINE)

    match = re.search(r'^description: "(.*)"$', text, re.MULTILINE)
    if match:
        rewritten = rewrite_description(match.group(1))
        if len(rewritten) > 160:
            return f"description too long after rewrite ({len(rewritten)}): {slug}"
        text = text.replace(match.group(0), f'description: "{rewritten}"', 1)

    text = re.sub(
        r'^category: "areas"$',
        f'category: "areas"\npath: "{path}"\nparentPath: "{parent}"\nhubType: "community"\ntier: "standard"',
        text,
        count=1,
        flags=re.MULTILINE,
    )
    source.write_text(text, encoding="utf-8")
    return None


def main() -> None:
    problems = []
    redirects = []
    for slug, (path, parent, title) in BATCH.items():
        problem = migrate(slug, path, parent, title)
        if problem:
            problems.append(problem)
            continue
        redirects.append(
            {
                "source": f"/areas/{slug}-property-investment/",
                "destination": f"/{path}/",
                "permanent": True,
            }
        )
        print(f"migrated {slug} -> /{path}/")

    if redirects:
        config = json.loads(VERCEL.read_text(encoding="utf-8"))
        existing = {r.get("source") for r in config["redirects"]}
        fresh = [r for r in redirects if r["source"] not in existing]
        index = next(
            (i for i, r in enumerate(config["redirects"]) if r.get("destination", "").startswith("/uae/")),
            len(config["redirects"]),
        )
        config["redirects"][index:index] = fresh
        VERCEL.write_text(json.dumps(config, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
        print(f"added {len(fresh)} redirect(s), {len(config['redirects'])} total")

    for problem in problems:
        print(f"SKIPPED {problem}")


if __name__ == "__main__":
    main()
