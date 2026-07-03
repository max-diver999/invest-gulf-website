#!/usr/bin/env python3
"""Fetch unique Wikimedia images per Gulf area, download locally, write manifest."""
from __future__ import annotations

import json
import re
import time
import urllib.parse
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUT_DIR = ROOT / "public/images/areas"
MANIFEST_PATH = Path(__file__).resolve().parent / "gulf-area-images-all.json"
SITE = "https://invest-gulf.com"
UA = "Mozilla/5.0 InvestGulf/1.0 (area-images; contact@invest-gulf.com)"

# slug -> (display name, country/region for fallback searches)
AREAS: dict[str, tuple[str, str]] = {
    "al-barari": ("Al Barari Dubai", "Dubai UAE"),
    "al-furjan": ("Al Furjan Dubai", "Dubai UAE"),
    "al-ghadeer": ("Al Ghadeer Abu Dhabi", "Abu Dhabi UAE"),
    "al-hamra-village": ("Al Hamra Village Ras Al Khaimah", "Ras Al Khaimah UAE"),
    "al-marjan-island": ("Al Marjan Island", "Ras Al Khaimah UAE"),
    "al-maryah-island": ("Al Maryah Island Abu Dhabi", "Abu Dhabi UAE"),
    "al-nakheel-rak": ("Al Nakheel Ras Al Khaimah", "Ras Al Khaimah UAE"),
    "al-raha-beach": ("Al Raha Beach Abu Dhabi", "Abu Dhabi UAE"),
    "al-reef-abu-dhabi": ("Al Reef Abu Dhabi", "Abu Dhabi UAE"),
    "al-reem-island": ("Al Reem Island Abu Dhabi", "Abu Dhabi UAE"),
    "al-zahia-sharjah": ("Al Zahia Sharjah", "Sharjah UAE"),
    "aljada-sharjah": ("Aljada Sharjah", "Sharjah UAE"),
    "amwaj-islands": ("Amwaj Islands Bahrain", "Bahrain"),
    "arabian-ranches": ("Arabian Ranches Dubai", "Dubai UAE"),
    "bluewaters-island": ("Bluewaters Island Dubai", "Dubai UAE"),
    "business-bay": ("Business Bay Dubai", "Dubai UAE"),
    "city-walk": ("City Walk Dubai", "Dubai UAE"),
    "damac-hills": ("DAMAC Hills Dubai", "Dubai UAE"),
    "dammam-khobar": ("Al Khobar Dammam", "Saudi Arabia Eastern Province"),
    "discovery-gardens": ("Discovery Gardens Dubai", "Dubai UAE"),
    "downtown-dubai": ("Downtown Dubai Burj Khalifa", "Dubai UAE"),
    "dubai-creek-harbour": ("Dubai Creek Harbour", "Dubai UAE"),
    "dubai-harbour": ("Dubai Harbour JBR", "Dubai UAE"),
    "dubai-hills-estate": ("Dubai Hills Estate", "Dubai UAE"),
    "dubai-islands": ("Dubai Islands Deira", "Dubai UAE"),
    "dubai-marina": ("Dubai Marina", "Dubai UAE"),
    "dubai-production-city": ("Dubai Production City IMPZ", "Dubai UAE"),
    "dubai-silicon-oasis": ("Dubai Silicon Oasis", "Dubai UAE"),
    "dubai-south": ("Dubai South Al Maktoum", "Dubai UAE"),
    "dubai-sports-city": ("Dubai Sports City", "Dubai UAE"),
    "hudayriyat-island": ("Hudayriyat Island Abu Dhabi", "Abu Dhabi UAE"),
    "impz": ("IMPZ Dubai", "Dubai UAE"),
    "jbr": ("Jumeirah Beach Residence Dubai", "Dubai UAE"),
    "jebel-ali-village": ("Jebel Ali Dubai", "Dubai UAE"),
    "jeddah": ("Jeddah Corniche", "Saudi Arabia"),
    "jlt": ("Jumeirah Lake Towers Dubai", "Dubai UAE"),
    "jvc": ("Jumeirah Village Circle Dubai", "Dubai UAE"),
    "khalifa-city": ("Khalifa City Abu Dhabi", "Abu Dhabi UAE"),
    "lusail-city": ("Lusail City Qatar", "Qatar"),
    "manama": ("Manama Bahrain skyline", "Bahrain"),
    "masdar-city": ("Masdar City Abu Dhabi", "Abu Dhabi UAE"),
    "mbr-city": ("Mohammed Bin Rashid City Dubai", "Dubai UAE"),
    "meydan-horizon": ("Meydan Dubai", "Dubai UAE"),
    "mina-al-arab": ("Mina Al Arab Ras Al Khaimah", "Ras Al Khaimah UAE"),
    "motor-city": ("Motor City Dubai", "Dubai UAE"),
    "mudon": ("Mudon Dubai", "Dubai UAE"),
    "muscat-al-mouj": ("Al Mouj Marina Muscat", "Oman"),
    "muscat-qurum": ("Qurum Muscat beach", "Oman"),
    "palm-jumeirah": ("Palm Jumeirah Dubai", "Dubai UAE"),
    "riyadh": ("Riyadh skyline KAFD", "Saudi Arabia"),
    "saadiyat-island": ("Saadiyat Island Abu Dhabi", "Abu Dhabi UAE"),
    "the-pearl-lusail": ("The Pearl Qatar Doha", "Qatar"),
    "the-valley-dubai": ("The Valley Dubai Emaar", "Dubai UAE"),
    "tilal-al-ghaf": ("Tilal Al Ghaf Dubai", "Dubai UAE"),
    "town-square": ("Town Square Dubai", "Dubai UAE"),
    "villanova": ("Villanova Dubai", "Dubai UAE"),
    "west-bay-doha": ("West Bay Doha skyline", "Qatar"),
    "yas-island": ("Yas Island Abu Dhabi", "Abu Dhabi UAE"),
    # Phase 2 recovery — expand hero pool (15 new areas, Jul 2026)
    "ajman": ("Ajman Corniche UAE", "Ajman UAE"),
    "al-ain": ("Al Ain oasis city", "Al Ain UAE"),
    "al-barsha": ("Al Barsha Dubai", "Dubai UAE"),
    "al-khor": ("Al Khor Qatar", "Qatar"),
    "deira": ("Deira Dubai creek", "Dubai UAE"),
    "difc": ("DIFC Dubai financial centre", "Dubai UAE"),
    "doha-corniche": ("Doha Corniche Qatar", "Qatar"),
    "dubai-expo-city": ("Dubai Expo City", "Dubai UAE"),
    "fujairah": ("Fujairah beach UAE", "Fujairah UAE"),
    "kuwait-city": ("Kuwait City skyline", "Kuwait"),
    "neom": ("NEOM Saudi Arabia", "Saudi Arabia Tabuk"),
    "salalah": ("Salalah Oman coast", "Oman Dhofar"),
    "seef-bahrain": ("Seef Bahrain district", "Bahrain"),
    "sohar": ("Sohar Oman port", "Oman"),
    "umm-al-quwain": ("Umm Al Quwain UAE", "Umm Al Quwain UAE"),
}

INLINE_SUFFIXES = (" waterfront", " aerial view", " district")


def commons_search(query: str, limit: int = 15) -> list[dict]:
    params = urllib.parse.urlencode(
        {
            "action": "query",
            "format": "json",
            "generator": "search",
            "gsrsearch": f"filetype:bitmap {query}",
            "gsrlimit": str(limit),
            "gsrnamespace": "6",
            "prop": "imageinfo",
            "iiprop": "url|mime|size",
            "iiurlwidth": "1200",
        }
    )
    url = f"https://commons.wikimedia.org/w/api.php?{params}"
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    with urllib.request.urlopen(req, timeout=30) as resp:
        data = json.loads(resp.read().decode())
    pages = data.get("query", {}).get("pages", {})
    results: list[dict] = []
    for page in pages.values():
        info = (page.get("imageinfo") or [{}])[0]
        thumb = info.get("thumburl") or info.get("url")
        if not thumb or not thumb.startswith("https://upload.wikimedia.org/"):
            continue
        mime = info.get("mime", "")
        if mime and not mime.startswith("image/"):
            continue
        if info.get("size", 1) < 30_000:
            continue
        title = page.get("title", "").replace("File:", "")
        results.append({"title": title, "url": thumb})
    return results


def normalize_url(url: str) -> str:
    return re.sub(r"/thumb/", "/", url).split("/1200px-")[0].rsplit("/", 1)[0]


def download(url: str, dest: Path) -> None:
    dest.parent.mkdir(parents=True, exist_ok=True)
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    with urllib.request.urlopen(req, timeout=60) as resp:
        data = resp.read()
    dest.write_bytes(data)


def pick_images(slug: str, name: str, region: str, used: set[str]) -> list[dict]:
    queries = [
        name,
        f"{name} UAE",
        f"{region} skyline",
        f"{region} waterfront",
        f"{region} cityscape",
        f"{region} architecture",
        f"{region} marina",
        f"{region} beach",
        f"{region} aerial",
        f"{region}",
    ]
    pool: list[dict] = []
    seen_norm: set[str] = set()
    for q in queries:
        try:
            for hit in commons_search(q, limit=20):
                norm = normalize_url(hit["url"])
                if norm in seen_norm:
                    continue
                seen_norm.add(norm)
                pool.append(hit)
            time.sleep(0.3)
        except Exception as exc:
            print(f"  warn {slug}: search '{q}' failed: {exc}")

    roles = ["hero", "inline-1", "inline-2"]
    picked: list[dict] = []
    for role in roles:
        chosen = None
        for hit in pool:
            norm = normalize_url(hit["url"])
            if norm in used:
                continue
            chosen = hit
            used.add(norm)
            break
        if not chosen:
            # Last resort: global unused image from extended region search
            for extra_q in (f"{region} tourism", f"{region} panorama", f"Gulf {region}"):
                for hit in commons_search(extra_q, limit=25):
                    norm = normalize_url(hit["url"])
                    if norm in used:
                        continue
                    chosen = hit
                    used.add(norm)
                    break
                if chosen:
                    break
                time.sleep(0.3)
        if not chosen:
            raise RuntimeError(f"No unique image for {slug} role {role} (pool={len(pool)})")
        alt = f"{name} — {role.replace('-', ' ')}"
        if role == "hero":
            alt = f"{name} — investment area overview"
        picked.append({"role": role, "sourceUrl": chosen["url"], "alt": alt, "title": chosen["title"]})
    return picked


def load_existing_used() -> tuple[set[str], list[dict]]:
    used: set[str] = set()
    articles: list[dict] = []
    if not MANIFEST_PATH.is_file():
        return used, articles
    data = json.loads(MANIFEST_PATH.read_text(encoding="utf-8"))
    for entry in data.get("articles", []):
        articles.append(entry)
        for img in entry.get("images", []):
            src = img.get("source")
            if src:
                used.add(normalize_url(src))
    return used, articles


def recover_partial(articles: list[dict], done_slugs: set[str]) -> None:
    """Recover manifest entries from images already on disk (interrupted build)."""
    for slug in sorted(AREAS):
        if slug in done_slugs:
            continue
        area_dir = OUT_DIR / slug
        roles = ["hero", "inline-1", "inline-2"]
        found: list[tuple[str, Path]] = []
        for role in roles:
            for ext in (".jpg", ".png", ".webp"):
                p = area_dir / f"{role}{ext}"
                if p.is_file():
                    found.append((role, p))
                    break
        if len(found) != 3:
            continue
        name = AREAS[slug][0]
        images_out: list[dict] = []
        for role, p in found:
            rel = f"/images/areas/{slug}/{p.name}"
            images_out.append(
                {
                    "role": role,
                    "url": f"{SITE}{rel}",
                    "alt": f"{name} — investment area overview" if role == "hero" else f"{name} — {role}",
                    "source": f"recovered:{rel}",
                }
            )
        articles.append({"slug": slug, "file": f"{slug}-property-investment", "images": images_out})
        done_slugs.add(slug)
        print(f"Recovered {slug} from disk ({len(found)} images)")


def main() -> None:
    used, articles = load_existing_used()
    done_slugs = {a["slug"] for a in articles}
    recover_partial(articles, done_slugs)

    for slug in sorted(AREAS):
        if slug in done_slugs:
            print(f"Skip {slug} (already in manifest)")
            continue
        name, region = AREAS[slug]
        print(f"Processing {slug}...")
        images_meta = pick_images(slug, name, region, used)
        images_out: list[dict] = []
        for img in images_meta:
            role = img["role"]
            ext = ".jpg"
            if img["sourceUrl"].lower().endswith(".png"):
                ext = ".png"
            rel = f"/images/areas/{slug}/{role}{ext}"
            dest = ROOT / "public" / rel.lstrip("/")
            download(img["sourceUrl"], dest)
            images_out.append(
                {
                    "role": role,
                    "url": f"{SITE}{rel}",
                    "alt": img["alt"],
                    "source": img["sourceUrl"],
                }
            )
            print(f"  {role} -> {rel}")
        articles.append({"slug": slug, "file": f"{slug}-property-investment", "images": images_out})

    manifest = {
        "rollout": "gulf-area-images-p1",
        "verified": time.strftime("%Y-%m-%d"),
        "rule": "58 areas x 3 images — unique source URLs, self-hosted on invest-gulf.com",
        "articles": articles,
    }
    MANIFEST_PATH.write_text(json.dumps(manifest, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")

    all_urls = [i["url"] for a in articles for i in a["images"]]
    sources = [
        i["source"]
        for a in articles
        for i in a["images"]
        if not str(i.get("source", "")).startswith("recovered:")
    ]
    assert len(all_urls) == len(set(all_urls)), "duplicate self-hosted URLs"
    assert len(sources) == len(set(sources)), "duplicate source URLs"
    print(f"Manifest: {MANIFEST_PATH}")
    print(f"Done: {len(articles)} areas, {len(all_urls)} unique images")


if __name__ == "__main__":
    main()
