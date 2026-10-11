"""Fetch a preview image for every checkpoint and save it as <model>.preview.<ext> next to the weights.

Order of sources:
  1. existing <model>.preview.* / <model>.png  -> skipped
  2. thumbnail embedded in safetensors metadata (modelspec.thumbnail)
  3. Civitai lookup by SHA256 (only images rated PG, nsfwLevel == 1)

Only the file hash is sent to Civitai. Weights are never modified.

Usage: python -I fetch_previews.py <checkpoint folder> [<folder> ...]
       e.g. python -I fetch_previews.py D:/SD-models/checkpoints D:/SD-models/diffusion_models
"""

import base64
import hashlib
import json
import struct
import sys
from pathlib import Path

import requests

HASH_CACHE = Path(__file__).with_name("sha256_cache.json")
PREVIEW_EXTS = ("png", "jpg", "jpeg", "webp", "avif")
API = "https://civitai.com/api/v1/model-versions/by-hash/{}"


def has_preview(model: Path) -> bool:
    stem = model.with_suffix("")
    return any(Path(f"{stem}{suffix}.{ext}").is_file() for ext in PREVIEW_EXTS for suffix in (".preview", ""))


def sha256_of(model: Path, cache: dict) -> str:
    st = model.stat()
    key = str(model)
    hit = cache.get(key)
    if hit and hit["size"] == st.st_size and hit["mtime"] == st.st_mtime:
        return hit["sha256"]
    h = hashlib.sha256()
    with model.open("rb") as f:
        while chunk := f.read(16 * 1024 * 1024):
            h.update(chunk)
    cache[key] = {"size": st.st_size, "mtime": st.st_mtime, "sha256": h.hexdigest()}
    HASH_CACHE.write_text(json.dumps(cache, indent=1), encoding="utf-8")
    return cache[key]["sha256"]


def embedded_thumbnail(model: Path) -> tuple[bytes, str] | None:
    with model.open("rb") as f:
        n = struct.unpack("<Q", f.read(8))[0]
        meta = json.loads(f.read(n)).get("__metadata__") or {}
    thumb = meta.get("modelspec.thumbnail", "")
    if not thumb.startswith("data:image/"):
        return None
    head, data = thumb.split(",", 1)
    ext = head[len("data:image/"):].split(";")[0].replace("jpeg", "jpg")
    return base64.b64decode(data), ext


def civitai_preview(sha256: str) -> tuple[bytes, str, str] | None:
    r = requests.get(API.format(sha256), timeout=30)
    if r.status_code == 404:
        return None
    r.raise_for_status()
    info = r.json()
    for img in info.get("images", []):
        if img.get("type", "image") != "image" or img.get("nsfwLevel", 99) > 1:
            continue
        url = img["url"]
        resp = requests.get(url, timeout=60)
        resp.raise_for_status()
        ctype = resp.headers.get("content-type", "image/jpeg")
        ext = {"image/png": "png", "image/webp": "webp", "image/avif": "avif"}.get(ctype, "jpg")
        page = f"https://civitai.com/models/{info.get('modelId')}?modelVersionId={info.get('id')}"
        return resp.content, ext, page
    return None


def main(roots: list[str]) -> None:
    cache = json.loads(HASH_CACHE.read_text(encoding="utf-8")) if HASH_CACHE.is_file() else {}
    models = sorted(p for root in roots for p in Path(root).rglob("*.safetensors"))
    for model in models:
        tag = model.name
        if has_preview(model):
            print(f"[skip]     {tag}: preview exists", flush=True)
            continue
        try:
            emb = embedded_thumbnail(model)
            if emb:
                data, ext = emb
                model.with_suffix(f".preview.{ext}").write_bytes(data)
                print(f"[embedded] {tag}", flush=True)
                continue
            print(f"[hashing]  {tag} ...", flush=True)
            digest = sha256_of(model, cache)
            got = civitai_preview(digest)
            if not got:
                print(f"[none]     {tag}: no PG preview on Civitai (sha256={digest[:12]})", flush=True)
                continue
            data, ext, page = got
            model.with_suffix(f".preview.{ext}").write_bytes(data)
            print(f"[civitai]  {tag} <- {page}", flush=True)
        except Exception as e:
            print(f"[error]    {tag}: {type(e).__name__}: {e}", flush=True)


if __name__ == "__main__":
    main(sys.argv[1:])
