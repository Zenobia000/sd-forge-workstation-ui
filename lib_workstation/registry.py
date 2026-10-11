"""Platform knowledge (registry/knowledge.json) and what of it is installed, given the files actually on disk.

Installed state is never stored: it is recomputed from the model folders on every call.
"""

import json
from pathlib import Path

REGISTRY_DIR = Path(__file__).resolve().parent.parent / "registry"
KNOWLEDGE_FILE = REGISTRY_DIR / "knowledge.json"
MODEL_EXTS = {".safetensors", ".sft", ".gguf", ".ckpt", ".pt", ".pth", ".bin"}
SKIP_DIRS = {"_archive", "_inbox"}


def load_knowledge() -> dict:
    return json.loads(KNOWLEDGE_FILE.read_text(encoding="utf-8"))


def scan_files(roots: list[Path]) -> dict[str, Path]:
    """filename -> path for every model file under roots (archive / inbox excluded)."""
    found: dict[str, Path] = {}
    for root in roots:
        if not root.is_dir():
            continue
        for p in root.rglob("*"):
            if p.suffix.lower() in MODEL_EXTS and p.is_file() and not SKIP_DIRS & set(p.relative_to(root).parts):
                found.setdefault(p.name, p)
    return found


def installed_roles(knowledge: dict, files: dict[str, Path]) -> dict[str, list[dict]]:
    roles: dict[str, list[dict]] = {}
    for asset in knowledge.get("assets", []):
        if asset["file"] in files:
            roles.setdefault(asset["role"], []).append(asset)
    return roles


def preset_status(knowledge: dict, roles: dict[str, list[dict]], checkpoint_paths: list[Path]) -> dict[str, dict]:
    """Every UI Preset with its description and whether any model for it is on disk.

    A preset counts as installed when a registered main model maps to it, or when a checkpoint sits in a
    folder named after the family (e.g. checkpoints/SDXL, diffusion_models/FLUX2). Advisory only.
    """
    installed = {a["forge_preset"] for a in knowledge.get("architectures", {}).values() if a["slots"]["main"]["role"] in roles}
    for path in checkpoint_paths:
        parts = {p.lower() for p in path.parts}
        installed |= {pid for pid, p in knowledge.get("presets", {}).items() if parts & set(p.get("folders", []))}
    return {pid: {**p, "installed": pid in installed} for pid, p in knowledge.get("presets", {}).items()}
