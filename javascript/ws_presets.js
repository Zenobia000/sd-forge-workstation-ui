// Workstation UI: the UI Preset dropdown grouped by architecture, one short line per family.
// Data comes from registry/knowledge.json `presets`; "installed" is recomputed from the model folders.

(function () {
    "use strict";

    const { t, tr, esc } = wsUI;

    wsUI.define({
        "preset.tip.head": { en: "Pick the model family; it must match the Checkpoint.", zh_TW: "選模型家族，要跟 Checkpoint 一致。" },
        "preset.tip.foot": {
            en: "Bold = a model is installed. LoRA, VAE and text encoders are not shared across families.",
            zh_TW: "粗體＝已有模型。LoRA、VAE、Text Encoder 不能跨家族共用。",
        },
        "preset.installed": { en: "Installed", zh_TW: "已有模型" },
        "preset.missing": { en: "Not installed", zh_TW: "未安裝" },
        "preset.arch.Other": { en: "Other", zh_TW: "其他" },
    });

    let presets = null;
    fetch("./workstation/presets")
        .then((r) => (r.ok ? r.json() : null))
        .then((d) => (presets = d))
        .catch(() => {});

    const archLabel = (arch) => (arch === "Other" ? t("preset.arch.Other") : arch);

    // Two levels: architecture -> preset. Order follows knowledge.json.
    function presetGroups() {
        const groups = new Map();
        Object.entries(presets).forEach(([id, p]) => {
            if (!groups.has(p.arch)) groups.set(p.arch, []);
            groups.get(p.arch).push(id);
        });
        return groups;
    }

    // Content of the "?" next to UI Preset: the compact family table instead of plain text
    wsUI.hintHtml["UI Preset"] = () => {
        if (!presets) return null;
        const rows = [...presetGroups()]
            .map(([arch, ids]) => `<div class="ws-preset-tip-row"><b>${esc(archLabel(arch))}</b><span>${ids.map((id) => `<span class="${presets[id].installed ? "ws-on" : "ws-off"}">${esc(id)}</span>`).join("　")}</span></div>`)
            .join("");
        return `<div class="ws-tip-text"><div>${esc(t("preset.tip.head"))}</div>${rows}<div class="ws-muted-text">${esc(t("preset.tip.foot"))}</div></div>`;
    };

    function presetCardHtml(p) {
        const cn = p.controlnet === true ? "ControlNet" : p.controlnet ? `ControlNet: ${p.controlnet}` : "";
        const chips = [cn, tr(p.edit), p.installed ? t("preset.installed") : t("preset.missing")].filter(Boolean);
        return `<div class="ws-tip-text">
            <div class="ws-card-title">${esc(p.name)}</div>
            <div>${esc(tr(p.summary))}</div>
            <div class="ws-chips">${chips.map((c) => `<span class="ws-chip">${esc(c)}</span>`).join("")}</div>
        </div>`;
    }

    // Annotate the open dropdown list. Gradio re-creates the <li> items each time it opens.
    // Items are never moved (Svelte owns them): grouping uses CSS `order`, headers are extra <li>s
    // without data-index, so clicking one is ignored by Gradio. Injected children ignore the pointer
    // so a click always targets the <li> itself (Gradio reads the index from the click target).
    function decoratePresets(root) {
        if (!presets) return;
        const ul = root.querySelector("#forge_ui_preset ul.options");
        if (!ul || ul.dataset.wsDone) return;
        ul.dataset.wsDone = "1";
        ul.classList.add("ws-preset-list");
        let order = 0;
        presetGroups().forEach((ids, arch) => {
            const head = document.createElement("li");
            head.className = order === 0 ? "ws-preset-group ws-first" : "ws-preset-group";
            head.setAttribute("aria-hidden", "true");
            head.textContent = archLabel(arch);
            head.style.order = order++;
            ul.appendChild(head);
            ids.forEach((id) => {
                const li = ul.querySelector(`li[aria-label="${CSS.escape(id)}"]`);
                if (!li) return;
                li.style.order = order++;
                li.classList.add("ws-preset-item");
                li.classList.toggle("ws-preset-on", presets[id].installed);
                const sub = document.createElement("span");
                sub.className = "ws-preset-sub";
                sub.textContent = `${presets[id].name} · ${tr(presets[id].short)}`;
                li.appendChild(sub);
            });
        });
    }

    document.addEventListener("mouseover", (e) => {
        const li = e.target.closest && e.target.closest("#forge_ui_preset ul.options li.ws-preset-item");
        if (!li || !presets) return;
        const id = (li.getAttribute("aria-label") || "").trim();
        if (presets[id]) wsUI.showTip(presetCardHtml(presets[id]), li, "side");
    });
    wsUI.hideTipOnLeave("#forge_ui_preset li");

    wsUI.onUpdate(decoratePresets);
})();
