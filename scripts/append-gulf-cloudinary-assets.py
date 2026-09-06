#!/usr/bin/env python3
"""Append newly referenced local images to the Gulf Cloudinary source manifest.

`build-gulf-cloudinary-manifest.mjs` rebuilds the manifest from the corpus, but
the corpus has already been rolled over to Cloudinary delivery URLs. Running it
now collapses the manifest to the handful of allowed local fallbacks and throws
away the migration record the upload, rollout and verify scripts all check
against. So new images are appended instead, using the same shape and the same
public-id rule the generator uses:

    more-group/gulf/{collection}/{stable_slug}/hero-{sha256(local_url)[:10]}

Run it after dropping a file into public/images and pointing an MDX heroImage at
that local path; then upload with --asset, and switch the MDX to the delivery
URL the upload manifest records.
"""
from __future__ import annotations

import hashlib
import json
import re
import struct
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
MANIFEST = ROOT / "scripts/gulf-cloudinary-source-manifest.json"
CONTENT = ROOT / "src/content"
SITE = "https://invest-gulf.com"
PREFIX = "more-group/gulf"
KNOWN_COLLECTIONS = ("areas", "projects", "heroes", "guides")
HERO_RE = re.compile(r'^heroImage:\s*["\']?(/images/[^"\'\s]+)["\']?\s*$', re.MULTILINE)


def jpeg_size(data: bytes) -> tuple[int, int]:
    """Width and height straight from the SOF marker, so sharp is not needed."""
    i = 2
    while i < len(data) - 9:
        if data[i] != 0xFF:
            i += 1
            continue
        marker = data[i + 1]
        if marker in (0xC0, 0xC1, 0xC2, 0xC3):
            height, width = struct.unpack(">HH", data[i + 5 : i + 9])
            return width, height
        i += 2 + struct.unpack(">H", data[i + 2 : i + 4])[0]
    raise SystemExit("no JPEG SOF marker found")


def classify(local_url: str) -> tuple[str, str]:
    parts = [p for p in local_url.split("/") if p]
    collection = parts[1] if parts[1] in KNOWN_COLLECTIONS else "editorial"
    stable_slug = parts[-2] if len(parts) > 3 else Path(parts[-1]).stem
    return collection, stable_slug


def main() -> None:
    manifest = json.loads(MANIFEST.read_text(encoding="utf-8"))
    assets = manifest["assets"]
    known = {asset["local_url"] for asset in assets}

    pending: dict[str, str] = {}
    for mdx in sorted(CONTENT.rglob("*.mdx")):
        for local_url in HERO_RE.findall(mdx.read_text(encoding="utf-8")):
            if local_url not in known:
                pending[local_url] = str(mdx.relative_to(ROOT))

    if not pending:
        print("nothing to append: every local heroImage is already in the manifest")
        return

    for local_url, mdx_rel in sorted(pending.items()):
        local_path = ROOT / "public" / local_url.lstrip("/")
        if not local_path.is_file():
            raise SystemExit(f"missing local file for {local_url}")
        data = local_path.read_bytes()
        width, height = jpeg_size(data)
        collection, stable_slug = classify(local_url)
        path_hash = hashlib.sha256(local_url.encode()).hexdigest()[:10]
        public_id = f"{PREFIX}/{collection}/{stable_slug}/hero-{path_hash}"
        assets.append(
            {
                "key": local_url,
                "local_url": local_url,
                "absolute_local_url": f"{SITE}{local_url}",
                "local_path": f"public{local_url}",
                "source_sha256": hashlib.sha256(data).hexdigest(),
                "bytes": len(data),
                "width": width,
                "height": height,
                "format": "jpeg",
                "collection": collection,
                "stable_slug": stable_slug,
                "role": "hero",
                "public_id": public_id,
                "references": [{"file": mdx_rel, "context": "heroImage", "count": 1}],
                "source_metadata": None,
            }
        )
        print(f"appended {local_url} -> {public_id} ({width}x{height}, {len(data)} bytes)")

    added = len(pending)
    assets.sort(key=lambda asset: asset["local_url"])
    inventory = manifest["inventory"]
    for field in (
        "local_files",
        "distinct_live_local_urls",
        "total_live_references",
        "mdx_references",
        "mapped_assets",
    ):
        inventory[field] += added

    MANIFEST.write_text(json.dumps(manifest, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print(f"manifest now holds {len(assets)} assets")


if __name__ == "__main__":
    main()
