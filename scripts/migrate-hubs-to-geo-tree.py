#!/usr/bin/env python3
"""Move the emirate and country investment guides into the geography tree.

Every one of these already existed as a `/guides/{place}-property-investment-guide/`
page, which is the URL pattern the September 2026 demand study found carries no
volume. They hold real content, so the work is a move and a retitle rather than
a rewrite, the same treatment Palm Jebel Ali received.

Titles come from the measured best phrase per place in
`data/core_classified.json`: villas for sale in Ajman at 2,400, villas for sale
in Sharjah at 1,300, property for sale in Ras Al Khaimah at 390, and so on down
to the four countries, which together carry about 1,150 a month and are sized
accordingly rather than being written up to pillar length.
"""
from __future__ import annotations

import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
GUIDES = ROOT / "src/content/guides"
HUBS = ROOT / "src/content/hubs"
VERCEL = ROOT / "vercel.json"

# source slug -> (hub filename, path, parentPath or None, hubType, tier, title)
BATCH: dict[str, tuple[str, str, str | None, str, str, str]] = {
    "sharjah-property-investment-guide": (
        "uae-sharjah", "uae/sharjah", "uae", "emirate", "pillar",
        "Villas and Apartments for Sale in Sharjah: Prices",
    ),
    "ajman-property-investment-guide": (
        "uae-ajman", "uae/ajman", "uae", "emirate", "pillar",
        "Villas and Apartments for Sale in Ajman: Prices",
    ),
    "ras-al-khaimah-property-investment-guide": (
        "uae-ras-al-khaimah", "uae/ras-al-khaimah", "uae", "emirate", "standard",
        "Property for Sale in Ras Al Khaimah: Prices and Yields",
    ),
    "fujairah-property-investment-guide": (
        "uae-fujairah", "uae/fujairah", "uae", "emirate", "standard",
        "Fujairah Real Estate: What a Foreign Buyer Can Own",
    ),
    "umm-al-quwain-property-investment": (
        "uae-umm-al-quwain", "uae/umm-al-quwain", "uae", "emirate", "standard",
        "Umm Al Quwain Real Estate: What a Buyer Can Own",
    ),
    "saudi-arabia-property-foreigners-guide": (
        "saudi-arabia", "saudi-arabia", None, "country", "standard",
        "Saudi Arabia Real Estate: What a Foreigner Can Own",
    ),
    "qatar-property-investment-guide": (
        "qatar", "qatar", None, "country", "standard",
        "Property for Sale in Qatar: What a Foreigner Can Own",
    ),
    "oman-property-investment-guide": (
        "oman", "oman", None, "country", "standard",
        "Oman Real Estate: What a Foreign Buyer Can Own",
    ),
    "bahrain-property-investment-guide": (
        "bahrain", "bahrain", None, "country", "standard",
        "Bahrain Real Estate: What a Foreign Buyer Can Own",
    ),
}


def main() -> None:
    redirects = []
    moved = []
    for slug, (filename, path, parent, hub_type, tier, title) in BATCH.items():
        source = GUIDES / f"{slug}.mdx"
        if not source.is_file():
            print(f"SKIPPED missing: {slug}")
            continue
        text = source.read_text(encoding="utf-8")

        if len(title) < 45 or len(title) > 65:
            print(f"SKIPPED title length {len(title)}: {slug}")
            continue
        text = re.sub(r'^title: ".*"$', f'title: "{title}"', text, count=1, flags=re.MULTILINE)

        block = [f'category: "hubs"', f'path: "{path}"']
        if parent:
            block.append(f'parentPath: "{parent}"')
        block.extend([f'hubType: "{hub_type}"', f'tier: "{tier}"'])
        replacement = "\n".join(block)
        if re.search(r'^category: ".*"$', text, re.MULTILINE):
            text = re.sub(r'^category: ".*"$', replacement, text, count=1, flags=re.MULTILINE)
        else:
            text = re.sub(r"^(author: .*)$", r"\1\n" + replacement, text, count=1, flags=re.MULTILINE)

        # imports are relative to the collection folder, and both sit at the
        # same depth, so no rewrite is needed there.
        (HUBS / f"{filename}.mdx").write_text(text, encoding="utf-8")
        source.unlink()
        moved.append((slug, path))
        redirects.append(
            {"source": f"/guides/{slug}/", "destination": f"/{path}/", "permanent": True}
        )
        print(f"moved {slug} -> /{path}/  ({hub_type}, {tier})")

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

    # Repoint internal links and relatedSlugs so nothing relies on a 301.
    changed_files = 0
    for path_obj in (ROOT / "src").rglob("*"):
        if not path_obj.is_file() or path_obj.suffix not in {".mdx", ".md", ".astro", ".ts", ".mjs", ".json"}:
            continue
        text = path_obj.read_text(encoding="utf-8")
        original = text
        for slug, place in moved:
            text = text.replace(f"/guides/{slug}/", f"/{place}/")
            text = text.replace(f'"{slug}"', f'"{place.replace("/", "-")}"')
        if text != original:
            path_obj.write_text(text, encoding="utf-8")
            changed_files += 1
    print(f"repointed references across {changed_files} file(s)")


if __name__ == "__main__":
    main()
