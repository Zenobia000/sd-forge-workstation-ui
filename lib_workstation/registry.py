"""Suggest which architecture can do which task, given the files actually on disk.

Advisory only: every option stays applicable. Statuses explain the evidence, they never block.
  knowledge.json     platform knowledge (architectures, capabilities, routes, known assets)
  user_results.json  the user's own test results; these override what knowledge.json suggests
Installed state is never stored: it is recomputed from the model folders on every call.
"""

import json
import time
from dataclasses import asdict, dataclass, field
from pathlib import Path

REGISTRY_DIR = Path(__file__).resolve().parent.parent / "registry"
KNOWLEDGE_FILE = REGISTRY_DIR / "knowledge.json"
RESULTS_FILE = REGISTRY_DIR / "user_results.json"
MODEL_EXTS = {".safetensors", ".sft", ".gguf", ".ckpt", ".pt", ".pth", ".bin"}
SKIP_DIRS = {"_archive", "_inbox"}

UNKNOWN_HINT = {
    "en": "No known method and nobody has tested it yet; try it and record the result",
    "zh_TW": "沒有已知做法，尚未有人測試；可以自己試試看並記錄結果",
}

# Display order: what the user proved first, then suggestions, then the uncertain ones
STATUS_ORDER = ["verified", "suggested", "unknown", "missing", "limit", "failed"]


def load_knowledge() -> dict:
    return json.loads(KNOWLEDGE_FILE.read_text(encoding="utf-8"))


def load_results() -> dict:
    try:
        return json.loads(RESULTS_FILE.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError):
        return {}


def record_result(task: str, arch: str, outcome: str, note: str = "") -> dict:
    if outcome not in ("verified", "failed", "clear"):
        raise ValueError(f"bad outcome: {outcome}")
    results = load_results()
    key = f"{task}|{arch}"
    if outcome == "clear":
        results.pop(key, None)
    else:
        results[key] = {"outcome": outcome, "note": note.strip(), "at": time.strftime("%Y-%m-%d %H:%M")}
    RESULTS_FILE.write_text(json.dumps(results, ensure_ascii=False, indent=2), encoding="utf-8")
    return results


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


@dataclass
class Option:
    """One way to attempt a task: an architecture plus the routes it would use."""

    task: str
    arch: str
    arch_label: str
    preset: str
    arch_tag: str
    status: str
    mains: list[dict] = field(default_factory=list)  # installed main models: {file, label, tags, companions, missing}
    missing: list[str] = field(default_factory=list)  # roles not installed (main model / tools)
    steps: list[dict] = field(default_factory=list)  # per capability: method, forge settings, hint, basis
    user_result: dict | None = None


def model_entry(asset: dict, roles: dict[str, list[dict]]) -> dict:
    """A main model plus the companion files it needs (text encoder, VAE); companions depend on the model, not the family."""
    needs = asset.get("companions", [])
    return {
        "file": asset["file"],
        "label": asset.get("label", asset["file"]),
        "tags": asset.get("tags", []),
        "overrides": asset.get("overrides"),
        "companions": [roles[r][0]["file"] for r in needs if r in roles],
        "missing": [r for r in needs if r not in roles],
    }


def companions_for(knowledge: dict, roles: dict[str, list[dict]], main_file: str) -> list[str]:
    asset = next((a for a in knowledge["assets"] if a["file"] == main_file), None)
    return model_entry(asset, roles)["companions"] if asset else []


def resolve_task(knowledge: dict, roles: dict[str, list[dict]], results: dict, task: dict) -> list[Option]:
    routes = {(r["arch"], r["capability"]): r for r in knowledge["routes"]}
    options = []
    for arch_id, arch in knowledge["architectures"].items():
        main_role = arch["slots"]["main"]["role"]
        mains = [model_entry(a, roles) for a in roles.get(main_role, [])]
        missing = [] if mains else [main_role]
        if mains and all(m["missing"] for m in mains):
            missing += mains[0]["missing"]

        steps, unknown, limit = [], False, False
        for cap in task["needs"]:
            route = routes.get((arch_id, cap))
            label = knowledge["capabilities"][cap]["label"]
            if route is None:
                unknown = True
                steps.append({"capability": cap, "label": label, "method": "unknown", "hint": UNKNOWN_HINT})
                continue
            if route["method"] == "engine_limit":
                limit = True
            missing += [r for r in route.get("requires", []) if r not in roles]
            steps.append({"capability": cap, "label": label, "method": route["method"], "forge": route.get("forge"), "hint": route.get("hint"), "basis": route.get("basis", "docs")})

        user_result = results.get(f"{task['id']}|{arch_id}")
        if user_result:
            status = user_result["outcome"]
        elif missing:
            status = "missing"
        elif limit:
            status = "limit"
        elif unknown:
            status = "unknown"
        else:
            status = "suggested"

        options.append(
            Option(
                task=task["id"],
                arch=arch_id,
                arch_label=arch["label"],
                preset=arch["forge_preset"],
                arch_tag=knowledge.get("presets", {}).get(arch["forge_preset"], {}).get("arch", ""),
                status=status,
                mains=mains,
                missing=sorted(set(missing)),
                steps=steps,
                user_result=user_result,
            )
        )
    return sorted(options, key=lambda o: STATUS_ORDER.index(o.status))


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


def plans(roots: list[Path]) -> dict:
    """Everything the panel needs, in one JSON-able dict."""
    knowledge = load_knowledge()
    roles = installed_roles(knowledge, scan_files(roots))
    results = load_results()
    return {
        "tasks": [
            {**task, "options": [asdict(o) for o in resolve_task(knowledge, roles, results, task)]}
            for task in knowledge["tasks"]
        ],
        "roles": {role: [a["file"] for a in assets] for role, assets in roles.items()},
    }
