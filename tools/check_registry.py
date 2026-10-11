"""Check registry/knowledge.json for broken references and list model files nobody has registered yet.

Read-only: nothing is written. Run it after editing knowledge.json or after dropping new models in.

Usage: python -I check_registry.py [model_root ...]     (default: Forge's models/ folder)
       e.g. python -I check_registry.py D:/SD-models   (the folder passed to --forge-ref-comfy-home)
Exit code 1 when knowledge.json has errors (bad references); unregistered files are only reported.
"""

import json
import sys
from pathlib import Path

EXT_DIR = Path(__file__).resolve().parent.parent
KNOWLEDGE_FILE = EXT_DIR / "registry" / "knowledge.json"
STYLES_FILE = EXT_DIR / "model_styles.json"
MODEL_EXTS = {".safetensors", ".sft", ".gguf", ".ckpt", ".pt", ".pth", ".bin"}
SKIP_DIRS = {"_archive", "_inbox"}
# Folders holding main models: the ones the planner and the hover cards care about
MAIN_DIRS = {"checkpoints", "diffusion_models", "unet", "Stable-diffusion"}


def scan(roots: list[Path]) -> dict[str, Path]:
    found: dict[str, Path] = {}
    for root in roots:
        for p in root.rglob("*") if root.is_dir() else []:
            if p.suffix.lower() in MODEL_EXTS and p.is_file() and not SKIP_DIRS & set(p.relative_to(root).parts):
                found.setdefault(p.name, p.relative_to(root))
    return found


def check(k: dict) -> list[str]:
    errors = []
    caps, archs, presets = k["capabilities"], k["architectures"], k.get("presets", {})
    defined_roles = {a["role"] for a in k["assets"]}

    for t in k["tasks"]:
        errors += [f"task {t['id']}: unknown capability {c}" for c in t["needs"] if c not in caps]
    for arch_id, a in archs.items():
        if a["forge_preset"] not in presets:
            errors.append(f"architecture {arch_id}: forge_preset {a['forge_preset']} not in presets")
    for r in k["routes"]:
        where = f"route {r['arch']}/{r['capability']}"
        if r["arch"] not in archs:
            errors.append(f"{where}: unknown architecture")
        if r["capability"] not in caps:
            errors.append(f"{where}: unknown capability")
        errors += [f"{where}: requires role {role} that no asset defines" for role in r.get("requires", []) if role not in defined_roles]
    files = [a["file"] for a in k["assets"]]
    errors += [f"asset {f}: listed twice" for f in sorted({f for f in files if files.count(f) > 1})]
    for a in k["assets"]:
        errors += [f"asset {a['file']}: companion role {c} that no asset defines" for c in a.get("companions", []) if c not in defined_roles]
    return errors


def main(roots: list[Path]) -> int:
    sys.stdout.reconfigure(encoding="utf-8")  # -I ignores PYTHONIOENCODING; file names may be non-ASCII
    k = json.loads(KNOWLEDGE_FILE.read_text(encoding="utf-8"))
    styles = json.loads(STYLES_FILE.read_text(encoding="utf-8")) if STYLES_FILE.is_file() else {}
    errors = check(k)
    on_disk = scan(roots)
    registered = {a["file"] for a in k["assets"]}
    main_roles = {a["slots"]["main"]["role"] for a in k["architectures"].values()}

    print(f"knowledge.json: {len(k['assets'])} assets, {len(k['architectures'])} architectures, {len(k['routes'])} routes")
    for e in errors:
        print(f"  ERROR  {e}")

    mains_on_disk = {n: p for n, p in on_disk.items() if p.parts[0] in MAIN_DIRS}
    unregistered = sorted(n for n in mains_on_disk if n not in registered)
    print(f"\nMain models on disk not in knowledge.json assets (the Plans panel will not list them): {len(unregistered)}")
    for n in unregistered:
        print(f"  {mains_on_disk[n]}")

    no_style = sorted(n for n in mains_on_disk if Path(n).stem not in styles)
    print(f"\nMain models on disk without a model_styles.json entry (no hover description): {len(no_style)}")
    for n in no_style:
        print(f"  {mains_on_disk[n]}")

    no_family = sorted(a["file"] for a in k["assets"] if a["file"] in on_disk and a["role"].split(".")[0] in ("checkpoint", "diffusion") and a["role"] not in main_roles)
    print(f"\nRegistered main models whose role has no architecture yet (hidden in the Plans panel): {len(no_family)}")
    for n in no_family:
        print(f"  {n}")

    missing = sorted(registered - on_disk.keys())
    print(f"\nRegistered but not on disk (shown as missing, fine if intentional): {len(missing)}")
    for n in missing:
        print(f"  {n}")

    return 1 if errors else 0


if __name__ == "__main__":
    sys.exit(main([Path(a) for a in sys.argv[1:]] or [EXT_DIR.parent.parent / "models"]))
