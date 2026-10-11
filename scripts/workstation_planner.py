"""Workstation planner: task -> suggested architecture/model/tool combinations, applied onto Forge's own fields.

Advisory only. Applying a plan sets: UI Preset, Checkpoint, VAE / Text Encoder and (only when the plan uses one)
ControlNet unit 1 of txt2img and img2img. Prompts, sizes and every other field are left alone.
Result messages are [key, *args] pairs; the browser turns them into text in the UI language.
"""

import json
import os
from pathlib import Path

import gradio as gr
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel

from lib_workstation import registry
from lib_workstation.forge_paths import model_roots
from modules import script_callbacks, sd_models, shared

_built = False


def checkpoint_tile(filename: str) -> str | None:
    """The value Forge's Checkpoint dropdown uses for a given weights file."""
    use_short = shared.opts.sd_checkpoint_dropdown_use_short
    for info in sd_models.checkpoints_list.values():
        if os.path.basename(info.filename) == filename:
            return info.short_title if use_short else info.name
    return None


def first_unit_per_tab():
    from lib_controlnet.controlnet_ui.controlnet_ui_group import ControlNetUiGroup

    groups = ControlNetUiGroup.all_ui_groups
    t2i = next((g for g in groups if not g.is_img2img), None)
    i2i = next((g for g in groups if g.is_img2img), None)
    return [g for g in (t2i, i2i) if g is not None]


def cn_outputs(group) -> list:
    return [group.enabled, group.type_filter, group.module, group.model, group.weight, group.timestep_range]


def apply_plan(payload: str, *current_types):
    from lib_controlnet import global_state
    from modules_forge import main_entry

    groups = first_unit_per_tab()
    keep_cn = [gr.update()] * (6 * len(groups))
    data = json.loads(payload or "{}")
    knowledge = registry.load_knowledge()
    arch = knowledge["architectures"].get(data.get("arch"))
    task = next((t for t in knowledge["tasks"] if t["id"] == data.get("task")), None)
    if arch is None or task is None:
        return [gr.update(), gr.update(), gr.update(), *keep_cn, json.dumps({"ok": False, "error": ["error.unknownPlan"]})]

    preset = arch["forge_preset"]
    files = registry.scan_files(model_roots())
    roles = registry.installed_roles(knowledge, files)
    done, warnings = [["applied.preset", preset]], []

    # Main model + required companions, through Forge's own setters so per-preset memory stays consistent
    # The setters return early when the value is unchanged without touching the per-preset memory;
    # on_preset_change then restores that stale memory, so write it explicitly as well.
    tile = checkpoint_tile(data.get("main", ""))
    if tile:
        main_entry.checkpoint_change(tile, preset)
        shared.opts.set(f"forge_checkpoint_{preset}", tile)
        done.append(["applied.checkpoint", data["main"]])
    else:
        warnings.append(["warn.noMain", data.get("main", "")])

    # Companions (text encoder, VAE) come from the chosen model: e.g. Klein 4B and 9B need different text encoders
    companions = registry.companions_for(knowledge, roles, data.get("main", ""))
    main_entry.modules_change(companions, preset)
    shared.opts.set(f"forge_additional_modules_{preset}", sorted(main_entry.module_list[c] for c in companions if c in main_entry.module_list))
    done.append(["applied.modules", ", ".join(companions)] if companions else ["applied.modulesEmpty"])

    routes = {(r["arch"], r["capability"]): r for r in knowledge["routes"]}
    task_routes = [routes.get((data["arch"], cap)) for cap in task["needs"]]
    if any(r and r["method"] == "reference_edit" for r in task_routes):
        shared.opts.set("klein_do_reference", True)
        done.append(["applied.kleinReference"])
    shared.opts.save(shared.config_filename)

    # ControlNet: only touched when the plan uses it
    cn_route = next((r for r in task_routes if r and r.get("forge")), None)
    cn_updates = keep_cn
    if cn_route:
        f = cn_route["forge"]
        model_file = next((roles[r][0]["file"] for r in cn_route.get("requires", []) if r.split(".")[0] in ("controlnet", "ipadapter") and r in roles), None)
        model_name = Path(model_file).stem if model_file else None
        if model_name and model_name not in global_state.controlnet_filename_dict:
            global_state.update_controlnet_filenames()
        if not model_name or model_name not in global_state.controlnet_filename_dict:
            warnings.append(["warn.cnMissing", ", ".join(cn_route.get("requires", []))])
            model_name = None

        cn_updates = []
        for group, current in zip(groups, current_types):
            if current != f["control_type"]:
                group.prevent_next_n_module_update += 1  # keep our preprocessor/model when the type change fires
            cn_updates += [
                gr.update(value=True),
                gr.update(value=f["control_type"]),
                gr.update(value=f["preprocessor"], choices=global_state.get_filtered_preprocessor_names(f["control_type"])),
                gr.update(value=model_name, choices=global_state.get_filtered_controlnet_names(f["control_type"])) if model_name else gr.update(),
                gr.update(value=f.get("weight", 1.0)),
                gr.update(value=(0.0, f.get("end", 1.0))),
            ]
        done.append(["applied.controlnet", f["control_type"], f["preprocessor"], model_name or "", f.get("weight", 1.0)])
    else:
        done.append(["applied.controlnetNone"])

    result = {"ok": True, "done": done, "warnings": warnings, "inputs": task.get("inputs", [])}
    return [
        gr.update(value=preset),
        gr.update(value=tile) if tile else gr.update(),
        gr.update(value=companions),
        *cn_updates,
        json.dumps(result, ensure_ascii=False),
    ]


def on_after_component(component, **kwargs):
    """Build the planner controls right after Forge's top-row dtype dropdown, where preset/checkpoint/vae already exist."""
    global _built
    if _built or kwargs.get("elem_id") != "forge_ui_dtype":
        return
    _built = True

    from modules_forge import main_entry

    groups = first_unit_per_tab()
    # English label; the browser shows it in the UI language
    open_btn = gr.Button("Plans", elem_id="ws_planner_open", variant="secondary", size="sm")
    payload = gr.Textbox(elem_id="ws_planner_payload", elem_classes=["hidden"], show_label=False, container=False)
    result = gr.Textbox(elem_id="ws_planner_result", elem_classes=["hidden"], show_label=False, container=False)
    # Internal trigger driven by the planner JS; hidden by id in style.css (Gradio's default label would read "Run")
    apply_btn = gr.Button("ws-apply", elem_id="ws_planner_apply", elem_classes=["hidden"])

    open_btn.click(fn=None, js="wsOpenPlanner")
    apply_btn.click(
        fn=apply_plan,
        inputs=[payload, *[g.type_filter for g in groups]],
        outputs=[main_entry.ui_forge_preset, main_entry.ui_checkpoint, main_entry.ui_vae, *[c for g in groups for c in cn_outputs(g)], result],
        queue=False,
        show_progress="hidden",
    ).then(fn=None, js="wsAfterApply", inputs=[result])


class ResultBody(BaseModel):
    task: str
    arch: str
    outcome: str
    note: str = ""


def on_app_started(_demo, app: FastAPI):
    @app.get("/workstation/plans")
    def get_plans():
        return registry.plans(model_roots())

    @app.post("/workstation/result")
    def post_result(body: ResultBody):
        try:
            registry.record_result(body.task, body.arch, body.outcome, body.note)
        except ValueError as e:
            raise HTTPException(status_code=400, detail=str(e)) from e
        return {"ok": True}


script_callbacks.on_after_component(on_after_component)
script_callbacks.on_app_started(on_app_started)
