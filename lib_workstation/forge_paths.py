"""Model folders Forge reads from, in the order Forge itself would find a file."""

from pathlib import Path

from modules import paths, shared


def model_roots() -> list[Path]:
    opts = shared.cmd_opts
    dirs = [
        getattr(opts, "forge_ref_comfy_home", None),
        paths.models_path,
        *getattr(opts, "ckpt_dirs", []),
        *getattr(opts, "vae_dirs", []),
        *getattr(opts, "text_encoder_dirs", []),
        *getattr(opts, "controlnet_dirs", []),
        getattr(opts, "esrgan_models_path", None),
    ]
    return [Path(d) for d in dict.fromkeys(str(d) for d in dirs if d)]
