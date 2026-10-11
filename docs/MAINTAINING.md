# Maintaining the model registry

[繁體中文](MAINTAINING.zh-TW.md)

Nothing here is required to *use* a model. A file you drop into Forge's model folders shows up in the Checkpoint list as usual.
The registry only decides what the hover cards say and what the **Plans** panel can suggest.

| You want | Do this | Needed? |
|---|---|---|
| The model in the Checkpoint list | Put the file in the right model folder and press refresh next to Checkpoint | yes |
| A preview image on hover | `python -I tools/fetch_previews.py <folder>` | optional |
| Style / best for / settings on hover | Add an entry to `model_styles.json` | optional |
| The model in the Plans panel | Add an entry to `assets` in `registry/knowledge.json` | for Plans |
| A new family in the Plans panel | Add `architectures` and `routes` to `knowledge.json` | new family only |

Install state is never stored: every request rescans the model folders. `knowledge.json` and `model_styles.json` are re-read on every request, so a browser refresh is enough after editing them.

## Files

| File | Content | Edited by |
|---|---|---|
| `registry/knowledge.json` | Tasks, capabilities, architectures, routes, known files (assets), UI Preset descriptions | you |
| `model_styles.json` | Description per model; the key is the file name without extension | you |
| `registry/user_results.json` | Your "works / fails" records from the Plans panel | the panel (do not edit) |
| `tools/sha256_cache.json` | Hash cache of the preview tool | the tool |

## Text and languages

Every text value can be a plain string or a pair:

```json
"label": { "en": "Keep outlines", "zh_TW": "保留輪廓" }
```

The UI shows `zh_TW` when Forge's **Settings › User interface › Localization** is a `zh*` file (or, with no localization selected, when the browser language is Chinese) and `en` otherwise. A plain string is shown as is in both languages.

## Adding a model

1. **Put the file** in the folder for its family.
2. **Register it** in `knowledge.json` → `assets` (enough for a family the panel already knows):

   ```json
   {
     "file": "juggernautXL_ragnarokBy.safetensors",
     "role": "checkpoint.sdxl",
     "label": "Juggernaut XL Ragnarok",
     "tags": [{ "en": "realistic", "zh_TW": "寫實" }],
     "source": "https://civitai.com/...",
     "license": "...",
     "sha256": "..."
   }
   ```

   - `file`: the file name only, no path.
   - `role`: which architecture it belongs to. Existing main roles are `checkpoint.sdxl` and `diffusion.flux2_klein`.
   - `companions` (optional): roles of the text encoder / VAE this model needs, e.g. Klein 4B uses `["text_encoder.qwen3_4b", "vae.flux2"]`. Each of those roles needs its own asset entry.
   - `overrides` (optional): model-specific parameters, e.g. a Lightning model `{"steps": 6, "cfg": 2}`.
   - `source` / `license` / `sha256`: recommended, so the origin can be checked later.
3. **Describe it** (optional): add `family`, `style`, `best_for`, `settings`, `notes` to `model_styles.json`.
4. **Fetch a preview** (optional): `python -I tools/fetch_previews.py <checkpoint folder> [<folder> ...]`. It uses the thumbnail embedded in the file, or looks the file hash up on Civitai (only images rated PG are saved).
5. **Check**: `python -I tools/check_registry.py <model folder>`. It reports broken references (misspelled roles, unknown architectures), main models on disk that are not registered, and models without a description. It exits with 1 when there are errors.
6. **Refresh** the browser (Ctrl+F5). No restart needed.

## Adding a family to the Plans panel

The 13 UI Preset descriptions already live in `presets`. Only touch that section when Forge itself adds a preset.

To make a family appear in the Plans panel, add:

- **`architectures`**: a new id.

  ```json
  "zimage": {
    "label": "Z-Image",
    "forge_preset": "zit",
    "slots": { "main": { "role": "diffusion.zimage", "required": true, "note": "..." } },
    "defaults": { "width": 1024, "height": 1024, "steps": 9, "cfg": 1 }
  }
  ```

  `forge_preset` must be a key of `presets`: sd, xl, flux, klein, qwen, qwen21, zit, krea, lumina, ernie, anima, wan, pid. `slots.main.role` must equal the `role` of that family's model assets.

- **`routes`**: how this family does each capability, one entry per capability:

  ```json
  { "arch": "zimage", "capability": "generate", "method": "native", "basis": "docs" }
  ```

  - `method`: `native`, `controlnet`, `ipadapter`, `reference_edit`, `upscaler`, `adetailer`, `engine_limit` (not supported by Forge).
  - With ControlNet, add `requires` (roles of the files needed) and `forge` (`control_type`, `preprocessor`, `weight`, `end`); applying a plan fills ControlNet unit 1 with them.
  - `basis`: `docs` comes from the model card or Forge README, `verified` was tested.
  - A capability without a route shows as "Unknown (nobody tested it)" and can still be applied.

## Test results

"✓ Works" / "✗ Fails" in the Plans panel writes to `user_results.json` and overrides the suggestion from `knowledge.json`.
Once a result is settled, set that route's `basis` to `verified` and press "Clear" in the panel.
