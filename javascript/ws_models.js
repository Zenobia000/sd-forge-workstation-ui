// Workstation UI: preview card when hovering a Checkpoint item, and the side-by-side model comparison tab.
// Previews are <model>.preview.<ext> files next to the weights; descriptions come from model_styles.json.

(function () {
    "use strict";

    const { t, tr, esc } = wsUI;

    wsUI.define({
        "models.noPreview": { en: "No preview yet", zh_TW: "尚無預覽圖" },
        "models.style": { en: "Style", zh_TW: "風格" },
        "models.bestFor": { en: "Best for", zh_TW: "適合" },
        "models.settings": { en: "Settings", zh_TW: "建議" },
        "compare.tab": { en: "Model Compare", zh_TW: "模型對比" },
        "compare.head": {
            en: "Compare models of the same family (SD1.5 / SDXL / FLUX) directly. Previews come from the model authors or your own test images.",
            zh_TW: "同一個系列（SD1.5 / SDXL / FLUX）的模型才適合直接比較。預覽圖來自模型作者或你自己生成的對照圖。",
        },
        "compare.reload": { en: "Refresh", zh_TW: "重新整理" },
        "compare.count": { en: "{0} models", zh_TW: "{0} 個模型" },
        "compare.loading": {
            en: "Loading… If this stays empty, refresh the Checkpoint list and come back to this tab.",
            zh_TW: "載入中… 若一直空白，請按 Checkpoint 旁的重新整理後再切回此分頁。",
        },
    });

    let models = null;
    let modelsPromise = null;
    function loadModels(force) {
        if (models && !force) return Promise.resolve(models);
        if (!modelsPromise || force) {
            modelsPromise = fetch("./workstation/models")
                .then((r) => (r.ok ? r.json() : []))
                .then((list) => (models = list))
                .catch(() => (models = []))
                .finally(() => (modelsPromise = null));
        }
        return modelsPromise;
    }

    const previewUrl = (m) => `./workstation/preview?stem=${encodeURIComponent(m.stem)}`;

    function findModel(text) {
        if (!models) return null;
        const s = text.trim();
        return models.find((m) => m.title === s || m.name === s || s.startsWith(m.name) || s.includes(m.stem)) || null;
    }

    function modelCardHtml(m, compact) {
        const img = m.hasPreview ? `<img src="${previewUrl(m)}" alt="">` : `<div class="ws-noimg">${esc(t("models.noPreview"))}</div>`;
        const row = (key, v) => (tr(v) ? `<div class="ws-row"><b>${esc(t(key))}</b>${esc(tr(v))}</div>` : "");
        return `
            <div class="ws-card${compact ? " ws-card-compact" : ""}">
                <div class="ws-card-img">${img}</div>
                <div class="ws-card-body">
                    <div class="ws-card-title"><span class="ws-tag">${esc(m.family)}</span>${esc(m.stem)}</div>
                    ${row("models.style", m.style)}${row("models.bestFor", m.bestFor)}${row("models.settings", m.settings)}
                    ${tr(m.notes) ? `<div class="ws-row ws-note">${esc(tr(m.notes))}</div>` : ""}
                </div>
            </div>`;
    }

    // Hover over an item of the Checkpoint dropdown -> floating preview card
    document.addEventListener("mouseover", (e) => {
        const li = e.target.closest && e.target.closest("#setting_sd_model_checkpoint ul.options li");
        if (!li) return;
        const label = li.getAttribute("aria-label") || li.dataset.value || li.textContent || "";
        loadModels().then(() => {
            const m = findModel(label);
            if (m && li.matches(":hover")) wsUI.showTip(modelCardHtml(m, true), li, "side");
        });
    });
    wsUI.hideTipOnLeave("#setting_sd_model_checkpoint li");

    // ---------- comparison tab ----------
    function renderCompare(force) {
        const root = document.getElementById("ws_compare_root");
        if (!root) return;
        loadModels(force).then((list) => {
            if (!list.length) {
                root.innerHTML = `<p class="ws-compare-hint">${esc(t("compare.loading"))}</p>`;
                return;
            }
            const groups = {};
            list.forEach((m) => (groups[m.family] = groups[m.family] || []).push(m));
            root.innerHTML =
                `<div class="ws-compare-head">
                    <span>${esc(t("compare.head"))}</span>
                    <button class="ws-btn" id="ws_compare_reload">${esc(t("compare.reload"))}</button>
                </div>` +
                Object.entries(groups)
                    .map(([fam, ms]) => `<h3 class="ws-group">${esc(fam)}<small>${esc(t("compare.count", ms.length))}</small></h3><div class="ws-grid">${ms.map((m) => modelCardHtml(m, false)).join("")}</div>`)
                    .join("");
            root.querySelector("#ws_compare_reload").addEventListener("click", () => renderCompare(true));
        });
    }

    // The tab title is created by Python in English; show it in the UI language
    function labelTab(root) {
        const names = [t("compare.tab"), "Model Compare", "模型對比"];
        const btn = [...root.querySelectorAll("#tabs > .tab-nav > button")].find((b) => names.includes(b.textContent.trim()));
        if (btn && btn.textContent.trim() !== names[0]) btn.textContent = names[0];
    }

    // Preload metadata early so the first dropdown hover is instant
    onUiLoaded(() => {
        loadModels();
        renderCompare(false);
        labelTab(gradioApp());
    });
    // opts (and so the language) may arrive after the UI is built, and Gradio re-creates the tab buttons
    onOptionsChanged(() => labelTab(gradioApp()));
    wsUI.onUpdate(labelTab);

    onUiTabChange(() => {
        const tab = get_uiCurrentTabContent();
        if (tab && tab.id === "tab_workstation_compare") renderCompare(true);
    });
})();
