# sd-forge-workstation-ui

[繁體中文](README.zh-TW.md)

An extension for [Stable Diffusion WebUI Forge - Neo](https://github.com/Haoming02/sd-webui-forge-classic/tree/neo) that helps people who don't know every model family pick the right model and the right tool.
It only adds to the UI: Forge's own buttons and fields stay where they are and keep working the same way.

## Features

- **Monochrome theme**: a quiet black-and-white theme, line icons instead of emoji, a readable Settings sidebar.
- **Hints**: a "?" next to common fields explains what they do and which values make sense.
- **UI Preset by architecture**: the preset dropdown is grouped into U-Net / DiT, with one line on what each family is for and whether you have a model for it.
- **Model previews**: hover a Checkpoint to see its preview image and style; a Model Compare tab shows them side by side.

## Install

**Extensions › Install from URL**, paste `https://github.com/Zenobia000/sd-forge-workstation-ui`, install, then restart Forge.

## Language

English and Traditional Chinese. The extension follows **Settings › User interface › Localization**:
a `zh*` localization shows Chinese, anything else shows English. With no localization selected, the browser language decides.
The extension ships a small `zh_TW` localization file so the option exists even without a full translation pack.

## License

[AGPL-3.0](LICENSE), the same as Forge.
