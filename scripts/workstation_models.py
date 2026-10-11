"""Workstation UI: model preview / style API and a side-by-side model comparison tab.

Purely additive: no existing component is moved or replaced. Text fields in model_styles.json may be a plain
string or {"en": ..., "zh_TW": ...}; the browser picks the language.
"""

import json
from pathlib import Path

import gradio as gr
from fastapi import FastAPI, HTTPException
from fastapi.responses import FileResponse

from modules import script_callbacks, sd_models

EXT_DIR = Path(__file__).resolve().parent.parent
STYLES_FILE = EXT_DIR / "model_styles.json"
PREVIEW_EXTS = ("png", "jpg", "jpeg", "webp", "avif")


def load_styles() -> dict:
    try:
        return json.loads(STYLES_FILE.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError):
        return {}


def find_preview(model_path: Path) -> Path | None:
    stem = model_path.with_suffix("")
    for ext in PREVIEW_EXTS:
        for candidate in (Path(f"{stem}.preview.{ext}"), Path(f"{stem}.{ext}")):
            if candidate.is_file():
                return candidate
    return None


def guess_family(path: Path) -> str:
    parts = {p.lower() for p in path.parts}
    if "flux2" in parts:
        return "FLUX.2"
    if "flux" in parts:
        return "FLUX"
    if "sdxl" in parts:
        return "SDXL"
    if "sd1.5" in parts or "sd15" in parts:
        return "SD1.5"
    return "unknown"


def model_entries() -> list[dict]:
    styles = load_styles()
    entries = []
    for info in sd_models.checkpoints_list.values():
        path = Path(info.filename)
        style = styles.get(path.stem, {})
        entries.append(
            {
                "title": info.title,
                "name": info.name,
                "stem": path.stem,
                "family": style.get("family") or guess_family(path),
                "hasPreview": find_preview(path) is not None,
                "style": style.get("style", ""),
                "bestFor": style.get("best_for", ""),
                "settings": style.get("settings", ""),
                "notes": style.get("notes", ""),
            }
        )
    order = {"SD1.5": 0, "SDXL": 1, "FLUX": 2, "FLUX.2": 3}
    entries.sort(key=lambda e: (order.get(e["family"], 9), e["stem"].lower()))
    return entries


def on_app_started(_demo, app: FastAPI):
    @app.get("/workstation/models")
    def list_models():
        return model_entries()

    @app.get("/workstation/preview")
    def preview(stem: str):
        # Resolve only through the registered checkpoint list, never a client-supplied path
        for info in sd_models.checkpoints_list.values():
            path = Path(info.filename)
            if path.stem == stem:
                found = find_preview(path)
                if found:
                    return FileResponse(found, headers={"Cache-Control": "max-age=3600"})
                break
        raise HTTPException(status_code=404, detail="No preview")


def on_ui_tabs():
    with gr.Blocks(analytics_enabled=False) as tab:
        gr.HTML(
            '<div id="ws_compare_root" class="ws-compare">'
            '<p class="ws-compare-hint">Loading…</p>'
            "</div>"
        )
    return [(tab, "Model Compare", "workstation_compare")]


script_callbacks.on_app_started(on_app_started)
script_callbacks.on_ui_tabs(on_ui_tabs)
