#!/usr/bin/env python3
"""Idempotently upload the exact live Invest Gulf local-image manifest."""
from __future__ import annotations

import argparse
import base64
import hashlib
import json
import mimetypes
import os
import time
import urllib.error
import urllib.parse
import urllib.request
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SOURCE_MANIFEST = ROOT / "scripts/gulf-cloudinary-source-manifest.json"
UPLOAD_MANIFEST = ROOT / "scripts/gulf-cloudinary-upload-manifest.json"
EXPECTED_CLOUD = "dlrrtf6bq"
PREFIX = "more-group/gulf"
MAX_EDGE = 1920
WARNING_PERCENT = 50.0
HARD_STOP_PERCENT = 60.0
CHECKPOINT_SIZE = 25
INCOMING_TRANSFORMATION = "c_limit,w_1920,h_1920,q_auto:good"


def load_env_file(path: Path) -> None:
    if not path.is_file():
        return
    for raw in path.read_text(encoding="utf-8").splitlines():
        line = raw.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, value = line.split("=", 1)
        os.environ.setdefault(key.strip(), value.strip().strip("\"'"))


def credentials() -> tuple[str, str, str]:
    load_env_file(ROOT.parent / "99_Системное" / ".env.cloudinary-niche")
    cloud = os.environ.get("CLOUDINARY_CLOUD_NAME", EXPECTED_CLOUD)
    key = os.environ.get("CLOUDINARY_API_KEY", "")
    secret = os.environ.get("CLOUDINARY_API_SECRET", "")
    if cloud != EXPECTED_CLOUD:
        raise SystemExit(f"Refusing upload: expected cloud {EXPECTED_CLOUD}, got {cloud}")
    if not key or not secret:
        raise SystemExit("Missing local Cloudinary credentials")
    return cloud, key, secret


def auth_header(key: str, secret: str) -> str:
    token = base64.b64encode(f"{key}:{secret}".encode()).decode()
    return f"Basic {token}"


def admin_json(path: str, key: str, secret: str) -> dict:
    request = urllib.request.Request(f"https://api.cloudinary.com/v1_1/{EXPECTED_CLOUD}{path}")
    request.add_header("Authorization", auth_header(key, secret))
    with urllib.request.urlopen(request, timeout=60) as response:
        return json.load(response)


def usage(key: str, secret: str) -> dict:
    return admin_json("/usage", key, secret)


def usage_percent(data: dict) -> float:
    credits = data["credits"]
    return float(credits["usage"]) / float(credits["limit"]) * 100


def nested_number(data: dict, section: str, field: str) -> float:
    return float((data.get(section) or {}).get(field, 0) or 0)


def usage_snapshot(data: dict, label: str) -> dict:
    return {
        "label": label,
        "checked_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "percent": round(usage_percent(data), 4),
        "credits": round(float(data["credits"]["usage"]), 4),
        "credit_limit": round(float(data["credits"]["limit"]), 4),
        "storage_bytes": round(nested_number(data, "storage", "usage"), 2),
        "storage_credits": round(nested_number(data, "storage", "credits_usage"), 4),
        "bandwidth_bytes": round(nested_number(data, "bandwidth", "usage"), 2),
        "bandwidth_credits": round(nested_number(data, "bandwidth", "credits_usage"), 4),
        "transformations": round(nested_number(data, "transformations", "usage"), 2),
        "transformation_credits": round(nested_number(data, "transformations", "credits_usage"), 4),
    }


def projected_percent(current: dict, assets: list[dict]) -> float:
    conservative_bytes = sum(max(int(asset["bytes"]), 1_000_000) for asset in assets)
    storage_credits = conservative_bytes / 1_000_000_000
    transformation_credits = (len(assets) * 4) / 1000
    projected = float(current["credits"]["usage"]) + storage_credits + transformation_credits
    return projected / float(current["credits"]["limit"]) * 100


def enforce_usage(current: dict, next_assets: list[dict], label: str) -> None:
    percent = usage_percent(current)
    projected = projected_percent(current, next_assets)
    print(
        f"Usage checkpoint {label}: {percent:.2f}% "
        f"(projected after next {len(next_assets)}: {projected:.2f}%)"
    )
    if percent >= HARD_STOP_PERCENT or projected > HARD_STOP_PERCENT:
        raise SystemExit(
            f"HARD STOP: usage {percent:.2f}%, projected {projected:.2f}% after next batch"
        )
    if percent >= WARNING_PERCENT:
        print(f"WARNING: usage is at or above {WARNING_PERCENT:.0f}%")


def list_existing(key: str, secret: str) -> dict[str, dict]:
    existing: dict[str, dict] = {}
    cursor = ""
    while True:
        query = urllib.parse.urlencode(
            {
                "type": "upload",
                "prefix": f"{PREFIX}/",
                "max_results": 500,
                "context": "true",
                **({"next_cursor": cursor} if cursor else {}),
            }
        )
        result = admin_json(f"/resources/image/upload?{query}", key, secret)
        for resource in result.get("resources", []):
            existing[resource["public_id"]] = resource
        cursor = result.get("next_cursor", "")
        if not cursor:
            return existing


def sign(params: dict[str, str], secret: str) -> str:
    payload = "&".join(f"{key}={params[key]}" for key in sorted(params))
    return hashlib.sha1(f"{payload}{secret}".encode()).hexdigest()


def multipart(fields: dict[str, str], file_path: Path) -> tuple[bytes, str]:
    boundary = f"----MGGulf{int(time.time() * 1000)}"
    chunks: list[bytes] = []
    for key, value in fields.items():
        chunks.append(
            (
                f"--{boundary}\r\n"
                f'Content-Disposition: form-data; name="{key}"\r\n\r\n'
                f"{value}\r\n"
            ).encode()
        )
    content_type = mimetypes.guess_type(file_path.name)[0] or "application/octet-stream"
    chunks.append(
        (
            f"--{boundary}\r\n"
            f'Content-Disposition: form-data; name="file"; filename="{file_path.name}"\r\n'
            f"Content-Type: {content_type}\r\n\r\n"
        ).encode()
    )
    chunks.extend([file_path.read_bytes(), f"\r\n--{boundary}--\r\n".encode()])
    return b"".join(chunks), boundary


def upload(asset: dict, key: str, secret: str) -> dict:
    local_path = ROOT / asset["local_path"]
    data = local_path.read_bytes()
    source_sha = hashlib.sha256(data).hexdigest()
    if source_sha != asset["source_sha256"]:
        raise RuntimeError(f"Local source changed after inventory: {asset['local_url']}")
    local_path_sha = hashlib.sha256(asset["local_url"].encode()).hexdigest()
    timestamp = str(int(time.time()))
    signed = {
        "context": f"source_sha256={source_sha}|local_path_sha256={local_path_sha}",
        "overwrite": "false",
        "public_id": asset["public_id"],
        "timestamp": timestamp,
        "transformation": INCOMING_TRANSFORMATION,
        "unique_filename": "false",
    }
    fields = {**signed, "api_key": key, "signature": sign(signed, secret)}
    body, boundary = multipart(fields, local_path)
    request = urllib.request.Request(
        f"https://api.cloudinary.com/v1_1/{EXPECTED_CLOUD}/image/upload",
        data=body,
        headers={"Content-Type": f"multipart/form-data; boundary={boundary}"},
        method="POST",
    )
    for attempt in range(4):
        try:
            with urllib.request.urlopen(request, timeout=180) as response:
                result = json.load(response)
            break
        except (urllib.error.URLError, TimeoutError) as error:
            if attempt == 3:
                raise RuntimeError(f"Upload network failure: {error}") from error
            time.sleep(2 * (attempt + 1))
        except urllib.error.HTTPError as error:
            detail = error.read().decode(errors="replace")[:300]
            raise RuntimeError(f"Cloudinary HTTP {error.code}: {detail}") from error
    if result.get("public_id") != asset["public_id"]:
        raise RuntimeError(f"Unexpected public ID for {asset['local_url']}")
    if max(int(result.get("width", 0)), int(result.get("height", 0))) > MAX_EDGE:
        raise RuntimeError(f"Uploaded source exceeds {MAX_EDGE}px: {asset['public_id']}")
    return {
        "public_id": result["public_id"],
        "local_url": asset["local_url"],
        "local_path": asset["local_path"],
        "source_sha256": source_sha,
        "local_path_sha256": local_path_sha,
        "source_metadata": asset.get("source_metadata"),
        "secure_url": result["secure_url"],
        "version": result.get("version"),
        "format": result.get("format"),
        "width": result.get("width"),
        "height": result.get("height"),
        "bytes": result.get("bytes"),
        "uploaded_at": result.get("created_at"),
        "incoming_transformation": INCOMING_TRANSFORMATION,
    }


def rename_asset(from_public_id: str, to_public_id: str, key: str, secret: str) -> dict:
    timestamp = str(int(time.time()))
    signed = {
        "from_public_id": from_public_id,
        "overwrite": "false",
        "timestamp": timestamp,
        "to_public_id": to_public_id,
    }
    fields = {**signed, "api_key": key, "signature": sign(signed, secret)}
    request = urllib.request.Request(
        f"https://api.cloudinary.com/v1_1/{EXPECTED_CLOUD}/image/rename",
        data=urllib.parse.urlencode(fields).encode(),
        headers={"Content-Type": "application/x-www-form-urlencoded"},
        method="POST",
    )
    try:
        with urllib.request.urlopen(request, timeout=120) as response:
            result = json.load(response)
    except urllib.error.HTTPError as error:
        detail = error.read().decode(errors="replace")[:300]
        raise RuntimeError(f"Cloudinary rename HTTP {error.code}: {detail}") from error
    if result.get("public_id") != to_public_id:
        raise RuntimeError(f"Unexpected rename response for {from_public_id}")
    return result


def save_state(state: dict) -> None:
    state["updated_at"] = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
    UPLOAD_MANIFEST.write_text(
        json.dumps(state, indent=2, ensure_ascii=False) + "\n",
        encoding="utf-8",
    )


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--dry-run", action="store_true")
    parser.add_argument("--rekey", action="store_true")
    parser.add_argument("--asset", action="append", default=[])
    parser.add_argument("--workers", type=int, default=3)
    args = parser.parse_args()

    cloud, key, secret = credentials()
    source = json.loads(SOURCE_MANIFEST.read_text(encoding="utf-8"))
    assets = source["assets"]
    inventory = source["inventory"]
    if (
        inventory["mapped_assets"] != 285
        or len(assets) != 285
        or inventory["missing_local_files"]
        or inventory["public_id_collisions"]
    ):
        raise SystemExit("Source manifest is not the exact clean 285-asset inventory")
    if len({asset["local_url"] for asset in assets}) != len(assets):
        raise SystemExit("Duplicate local URLs in source manifest")
    if len({asset["public_id"] for asset in assets}) != len(assets):
        raise SystemExit("Duplicate public IDs in source manifest")
    if args.asset:
        selected = set(args.asset)
        assets = [asset for asset in assets if asset["local_url"] in selected]
        missing = selected - {asset["local_url"] for asset in assets}
        if missing:
            raise SystemExit(f"Unknown asset(s): {', '.join(sorted(missing))}")

    state = (
        json.loads(UPLOAD_MANIFEST.read_text(encoding="utf-8"))
        if UPLOAD_MANIFEST.exists()
        else {
            "version": 1,
            "cloud": cloud,
            "prefix": PREFIX,
            "source_manifest_generated_at": source["generated_at"],
            "uploaded": {},
            "failed": [],
            "usage_checkpoints": [],
        }
    )
    uploaded = state.setdefault("uploaded", {})
    remote = list_existing(key, secret)
    if args.rekey:
        changes = []
        for asset in assets:
            saved = uploaded.get(asset["local_url"])
            if not saved:
                raise SystemExit(f"Cannot rekey missing upload: {asset['local_url']}")
            if saved.get("public_id") == asset["public_id"]:
                continue
            local_path_sha = hashlib.sha256(asset["local_url"].encode()).hexdigest()
            if (
                saved.get("source_sha256") != asset["source_sha256"]
                or saved.get("local_path_sha256") != local_path_sha
            ):
                raise SystemExit(f"Rekey collision guard failed: {asset['local_url']}")
            if saved["public_id"] not in remote:
                raise SystemExit(f"Rekey source missing remotely: {saved['public_id']}")
            if asset["public_id"] in remote:
                raise SystemExit(f"Rekey destination already exists: {asset['public_id']}")
            changes.append((asset, saved))
        print(f"Gulf rekey: pending={len(changes)} dry_run={args.dry_run}")
        if args.dry_run:
            return
        for offset in range(0, len(changes), CHECKPOINT_SIZE):
            current = usage(key, secret)
            enforce_usage(current, [], f"before-rekey-{offset}")
            for asset, saved in changes[offset : offset + CHECKPOINT_SIZE]:
                result = rename_asset(saved["public_id"], asset["public_id"], key, secret)
                saved["public_id"] = asset["public_id"]
                saved["secure_url"] = result.get("secure_url", saved.get("secure_url"))
                print(f"rekeyed {asset['public_id']}")
                save_state(state)
            current = usage(key, secret)
            state.setdefault("usage_checkpoints", []).append(
                usage_snapshot(current, f"after-rekey-{min(offset + CHECKPOINT_SIZE, len(changes))}")
            )
            save_state(state)
        state["source_manifest_generated_at"] = source["generated_at"]
        save_state(state)
        print(f"Rekey complete: {len(changes)} asset(s)")
        return

    jobs: list[dict] = []
    resumed = 0
    for asset in assets:
        saved = uploaded.get(asset["local_url"])
        local_path_sha = hashlib.sha256(asset["local_url"].encode()).hexdigest()
        if (
            saved
            and saved.get("public_id") == asset["public_id"]
            and saved.get("source_sha256") == asset["source_sha256"]
            and saved.get("local_path_sha256") == local_path_sha
        ):
            resumed += 1
            continue
        existing = remote.get(asset["public_id"])
        if existing:
            context = (existing.get("context") or {}).get("custom", {})
            if (
                context.get("source_sha256") != asset["source_sha256"]
                or context.get("local_path_sha256") != local_path_sha
            ):
                raise SystemExit(
                    f"Collision guard: {asset['public_id']} has different path/source markers"
                )
            raise SystemExit(
                f"Remote asset {asset['public_id']} matches but is absent from local state; recover first"
            )
        jobs.append(asset)

    print(
        f"Gulf assets: selected={len(assets)} pending={len(jobs)} "
        f"resumed={resumed} dry_run={args.dry_run}"
    )
    current = usage(key, secret)
    preview = jobs[:CHECKPOINT_SIZE]
    enforce_usage(current, preview, "dry-run" if args.dry_run else "before-upload")
    if args.dry_run or not jobs:
        print(json.dumps(usage_snapshot(current, "dry-run"), indent=2))
        return

    checkpoints = state.setdefault("usage_checkpoints", [])
    checkpoints.append(usage_snapshot(current, "before-upload"))
    save_state(state)
    failures: list[dict] = []
    for offset in range(0, len(jobs), CHECKPOINT_SIZE):
        batch = jobs[offset : offset + CHECKPOINT_SIZE]
        with ThreadPoolExecutor(max_workers=max(1, min(args.workers, 4))) as pool:
            futures = {pool.submit(upload, asset, key, secret): asset for asset in batch}
            for future in as_completed(futures):
                asset = futures[future]
                try:
                    uploaded[asset["local_url"]] = future.result()
                    print(f"uploaded {asset['public_id']}")
                except Exception as error:  # noqa: BLE001
                    failures.append(
                        {"local_url": asset["local_url"], "error": str(error)[:300]}
                    )
                    print(f"failed {asset['public_id']}: {error}")
                state["failed"] = failures
                save_state(state)

        current = usage(key, secret)
        completed = min(offset + len(batch), len(jobs))
        label = f"after-{completed}-new"
        checkpoints.append(usage_snapshot(current, label))
        state["usage_checkpoints"] = checkpoints
        save_state(state)
        next_batch = jobs[completed : completed + CHECKPOINT_SIZE]
        enforce_usage(current, next_batch, label)
        if failures:
            break

    if failures:
        raise SystemExit(f"{len(failures)} upload(s) failed; rerun to resume")
    print(f"Complete: {len(uploaded)} asset(s) recorded")


if __name__ == "__main__":
    main()
