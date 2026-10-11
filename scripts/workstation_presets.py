"""Workstation UI: description and install state of every Forge UI Preset, for the grouped dropdown."""

from pathlib import Path

from fastapi import FastAPI

from lib_workstation import registry
from lib_workstation.forge_paths import model_roots
from modules import script_callbacks, sd_models


def on_app_started(_demo, app: FastAPI):
    @app.get("/workstation/presets")
    def get_presets():
        knowledge = registry.load_knowledge()
        roles = registry.installed_roles(knowledge, registry.scan_files(model_roots()))
        checkpoint_paths = [Path(info.filename) for info in sd_models.checkpoints_list.values()]
        return registry.preset_status(knowledge, roles, checkpoint_paths)


script_callbacks.on_app_started(on_app_started)
