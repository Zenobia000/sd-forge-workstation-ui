// Workstation planner: pick a task, see suggested combinations, apply one onto Forge's own fields.
// Advisory only: every option can be applied; statuses explain the evidence behind each suggestion.

(function () {
    "use strict";

    const { t, tr, esc } = wsUI;

    wsUI.define({
        "planner.button": { en: "Plans", zh_TW: "選擇方案" },
        "planner.title": { en: "Plans", zh_TW: "選擇方案" },
        "planner.sub": {
            en: "Pick what you want to do, then apply a combination. Statuses are only suggestions; any combination can be applied to test it.",
            zh_TW: "先選要做的事，再挑一個組合套用。狀態只是建議，任何組合都可以套用來測試。",
        },
        "planner.close": { en: "Close", zh_TW: "關閉" },
        "planner.foot": {
            en: "Applying changes only UI Preset, Checkpoint and VAE / Text Encoder, plus ControlNet unit 1 of txt2img and img2img when the plan uses ControlNet. Prompts, sizes and all other fields stay as they are.",
            zh_TW: "套用只會變更：UI Preset、Checkpoint、VAE / Text Encoder；用到 ControlNet 時，另外設定 txt2img 與 img2img 的 ControlNet 單元 1。提示詞、尺寸等其他欄位不變。",
        },
        "planner.pickTask": { en: "← Pick what you want to do", zh_TW: "← 先選要做的事" },
        "planner.loading": { en: "Loading…", zh_TW: "讀取中…" },
        "planner.loadFailed": { en: "Could not load: {0}", zh_TW: "讀取失敗：{0}" },
        "planner.prepare": { en: "Prepare: {0}", zh_TW: "需要準備：{0}" },
        "planner.model": { en: "Model", zh_TW: "模型" },
        "planner.noMain": { en: "No main model installed", zh_TW: "沒有已安裝的主模型" },
        "planner.companions": { en: "Adds: {0}", zh_TW: "自動帶入：{0}" },
        "planner.builtIn": { en: "VAE / Text Encoder built in; the field will be cleared", zh_TW: "VAE / Text Encoder 已內建，會清空該欄位" },
        "planner.modelMissing": { en: "This model lacks: {0}", zh_TW: "此模型缺少：{0}" },
        "planner.missing": { en: "Missing: {0} (can still be applied; missing parts are skipped)", zh_TW: "缺少：{0}（仍可套用，缺的部分不會設定）" },
        "planner.yourResult": { en: "Your record ({0}): {1}", zh_TW: "你的紀錄（{0}）：{1}" },
        "planner.works": { en: "works", zh_TW: "可行" },
        "planner.fails": { en: "doesn't work", zh_TW: "不行" },
        "planner.apply": { en: "Apply", zh_TW: "套用" },
        "planner.note": { en: "Test note (optional)", zh_TW: "測試備註（選填）" },
        "planner.markOk": { en: "✓ Works", zh_TW: "✓ 可行" },
        "planner.markOkTitle": { en: "Record: this combination works", zh_TW: "記錄：這個組合可行" },
        "planner.markBad": { en: "✗ Fails", zh_TW: "✗ 不行" },
        "planner.markBadTitle": { en: "Record: this combination doesn't work", zh_TW: "記錄：這個組合不行" },
        "planner.clear": { en: "Clear", zh_TW: "清除" },
        "planner.clearTitle": { en: "Clear your record", zh_TW: "清除你的紀錄" },
        "planner.noApplyTarget": { en: "Apply controls not found; reload the page", zh_TW: "找不到套用元件，請重新整理頁面" },
        "planner.recordFailed": { en: "Could not save the record: {0}", zh_TW: "記錄失敗：{0}" },
        "planner.applyFailed": { en: "Apply failed: {0}", zh_TW: "套用失敗：{0}" },
        "planner.unknownError": { en: "unknown error", zh_TW: "未知錯誤" },
        "planner.badResult": { en: "could not read the result", zh_TW: "無法解析結果" },
        "planner.applied": { en: "Applied:", zh_TW: "已套用：" },
        "planner.toImg2img": { en: "Switched to the img2img tab", zh_TW: "已切到 img2img 分頁" },
        "planner.preprocessor": { en: "preprocessor", zh_TW: "前處理器" },
        "planner.weight": { en: "weight", zh_TW: "強度" },

        "status.verified": { en: "Works (you tested it)", zh_TW: "你測過可行" },
        "status.suggested": { en: "Suggested (from docs, untested)", zh_TW: "建議（依官方文件，未實測）" },
        "status.unknown": { en: "Unknown (nobody tested it)", zh_TW: "未知（沒人測過）" },
        "status.missing": { en: "Files missing", zh_TW: "缺少檔案" },
        "status.limit": { en: "Known engine limit", zh_TW: "已知引擎限制" },
        "status.failed": { en: "Fails (you tested it)", zh_TW: "你測過不行" },

        "method.native": { en: "Built in", zh_TW: "內建功能" },
        "method.controlnet": { en: "ControlNet", zh_TW: "ControlNet" },
        "method.ipadapter": { en: "IP-Adapter (in ControlNet)", zh_TW: "IP-Adapter（ControlNet 內）" },
        "method.reference_edit": { en: "Reference editing", zh_TW: "參考圖編輯" },
        "method.upscaler": { en: "Upscaler", zh_TW: "放大模型" },
        "method.adetailer": { en: "ADetailer", zh_TW: "ADetailer" },
        "method.engine_limit": { en: "Not supported by Forge", zh_TW: "Forge 不支援" },
        "method.unknown": { en: "No known method", zh_TW: "沒有已知做法" },

        "input.source_image": { en: "upload the image to change in the img2img tab", zh_TW: "到 img2img 分頁上傳要修改的圖" },
        "input.mask": { en: "paint the area to redraw in the Inpaint tab", zh_TW: "在 Inpaint 分頁塗上要重繪的範圍" },
        "input.reference_image": { en: "upload the reference in ControlNet unit 1", zh_TW: "在 ControlNet 單元 1 上傳參考圖" },
        "input.pose_image": { en: "upload the pose photo in ControlNet unit 1", zh_TW: "在 ControlNet 單元 1 上傳姿勢照片" },

        // Messages from the apply action ([key, ...args] sent by workstation_planner.py)
        "error.unknownPlan": { en: "unknown plan", zh_TW: "未知的方案" },
        "applied.preset": { en: "UI Preset → {0}", zh_TW: "UI Preset → {0}" },
        "applied.checkpoint": { en: "Checkpoint → {0}", zh_TW: "Checkpoint → {0}" },
        "warn.noMain": { en: "Main model {0} not found; Checkpoint unchanged", zh_TW: "找不到主模型 {0}，Checkpoint 未變更" },
        "applied.modules": { en: "VAE / Text Encoder → {0}", zh_TW: "VAE / Text Encoder → {0}" },
        "applied.modulesEmpty": { en: "VAE / Text Encoder → empty (built in)", zh_TW: "VAE / Text Encoder → 留空（已內建）" },
        "applied.kleinReference": { en: "Klein reference (edit) mode → on", zh_TW: "Klein reference（編輯）模式 → 開啟" },
        "warn.cnMissing": {
            en: "ControlNet model not installed or not detected by Forge ({0}); model field unchanged",
            zh_TW: "ControlNet 模型未安裝或未被 Forge 偵測到（{0}），模型欄位維持原樣",
        },
        "applied.controlnet": {
            en: "ControlNet unit 1 (txt2img, img2img) → {0} / {1} / {2}, weight {3}",
            zh_TW: "ControlNet 單元 1（txt2img、img2img）→ {0}／{1}／{2}，強度 {3}",
        },
        "applied.controlnetNone": { en: "ControlNet → unchanged", zh_TW: "ControlNet → 未變更" },
        "applied.unspecified": { en: "(none)", zh_TW: "（未指定）" },
        "applied.modelUnchanged": { en: "model unchanged", zh_TW: "模型未變更" },
    });

    const STATUS_CLS = { verified: "ok", suggested: "info", unknown: "muted", missing: "warn", limit: "warn", failed: "bad" };

    // [key, ...args] from the server -> text; empty args get a readable placeholder
    function message([key, ...args]) {
        if (key === "warn.noMain") args[0] = args[0] || t("applied.unspecified");
        if (key === "applied.controlnet") args[2] = args[2] || t("applied.modelUnchanged");
        return t(key, ...args);
    }

    let data = null;
    let currentTask = null;
    let root = null;

    function ensureRoot() {
        if (root) return root;
        root = document.createElement("div");
        root.id = "ws_planner";
        root.className = "ws-planner";
        root.innerHTML = `
            <div class="ws-planner-backdrop"></div>
            <div class="ws-planner-dialog" role="dialog">
                <div class="ws-planner-head">
                    <div>
                        <div class="ws-planner-title"></div>
                        <div class="ws-planner-sub"></div>
                    </div>
                    <button class="ws-btn ws-planner-close">✕</button>
                </div>
                <div class="ws-planner-body">
                    <div class="ws-planner-tasks"></div>
                    <div class="ws-planner-options"></div>
                </div>
                <div class="ws-planner-foot"></div>
            </div>`;
        document.body.appendChild(root);
        root.querySelector(".ws-planner-backdrop").addEventListener("click", close);
        root.querySelector(".ws-planner-close").addEventListener("click", close);
        document.addEventListener("keydown", (e) => {
            if (e.key === "Escape" && root.classList.contains("ws-open")) close();
        });
        return root;
    }

    // Static texts are set on every open, so they follow a language change
    function renderFrame() {
        root.querySelector(".ws-planner-dialog").setAttribute("aria-label", t("planner.title"));
        root.querySelector(".ws-planner-title").textContent = t("planner.title");
        root.querySelector(".ws-planner-sub").textContent = t("planner.sub");
        root.querySelector(".ws-planner-close").title = t("planner.close");
        root.querySelector(".ws-planner-foot").textContent = t("planner.foot");
    }

    function close() {
        if (root) root.classList.remove("ws-open");
    }

    async function load() {
        const r = await fetch("./workstation/plans");
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        data = await r.json();
    }

    function renderTasks() {
        const box = root.querySelector(".ws-planner-tasks");
        box.innerHTML = data.tasks
            .map((task) => {
                const cls = STATUS_CLS[task.options[0] ? task.options[0].status : "unknown"];
                return `<button class="ws-task${task.id === currentTask ? " ws-active" : ""}" data-task="${esc(task.id)}">
                    <span>${esc(tr(task.label))}</span><i class="ws-dot ws-${cls}"></i></button>`;
            })
            .join("");
        box.querySelectorAll(".ws-task").forEach((b) =>
            b.addEventListener("click", () => {
                currentTask = b.dataset.task;
                renderTasks();
                renderOptions();
            }),
        );
    }

    function stepHtml(s) {
        const forge = s.forge ? `: ${esc(s.forge.control_type)} → ${esc(t("planner.preprocessor"))} <code>${esc(s.forge.preprocessor)}</code>, ${esc(t("planner.weight"))} ${esc(s.forge.weight)}` : "";
        const hint = s.hint ? `<div class="ws-step-hint">${esc(tr(s.hint))}</div>` : "";
        return `<li><b>${esc(tr(s.label))}</b>　${esc(t(`method.${s.method}`))}${forge}${hint}</li>`;
    }

    const tagText = (tags) => (tags.length ? ` (${tags.map(tr).join(", ")})` : "");

    // Companion files depend on the chosen model (e.g. Klein 4B vs 9B use different text encoders)
    function companionsHtml(m) {
        if (!m) return "";
        const parts = [];
        if (m.companions.length) parts.push(esc(t("planner.companions", m.companions.join(", "))));
        else if (!m.missing.length) parts.push(esc(t("planner.builtIn")));
        if (m.missing.length) parts.push(`<span class="ws-warn-text">${esc(t("planner.modelMissing", m.missing.join(", ")))}</span>`);
        return parts.join("; ");
    }

    function optionHtml(o, i) {
        const mains = o.mains.length
            ? `<select class="ws-main">${o.mains.map((m) => `<option value="${esc(m.file)}">${esc(m.label)}${esc(tagText(m.tags))}</option>`).join("")}</select>`
            : `<span class="ws-warn-text">${esc(t("planner.noMain"))}</span>`;
        const steps = o.steps.length ? `<ul class="ws-steps">${o.steps.map(stepHtml).join("")}</ul>` : "";
        const missing = o.missing.length ? `<div class="ws-warn-text">${esc(t("planner.missing", o.missing.join(", ")))}</div>` : "";
        const r = o.user_result;
        const result = r ? `<div class="ws-result">${esc(t("planner.yourResult", r.at, r.note || t(r.outcome === "verified" ? "planner.works" : "planner.fails")))}</div>` : "";
        return `
            <div class="ws-option" data-index="${i}">
                <div class="ws-option-head">
                    <span class="ws-option-arch">${esc(o.arch_label)}${o.arch_tag ? `<span class="ws-tag">${esc(o.arch_tag)}</span>` : ""}</span>
                    <span class="ws-badge ws-${STATUS_CLS[o.status] || "muted"}">${esc(t(`status.${o.status}`))}</span>
                </div>
                <div class="ws-row"><b>${esc(t("planner.model"))}</b>${mains}</div>
                <div class="ws-row ws-muted-text"><span class="ws-companions">${companionsHtml(o.mains[0])}</span> | Preset: ${esc(o.preset)}</div>
                ${steps}${missing}${result}
                <div class="ws-option-actions">
                    <button class="ws-btn ws-primary ws-apply">${esc(t("planner.apply"))}</button>
                    <span class="ws-record">
                        <input class="ws-note-input" placeholder="${esc(t("planner.note"))}">
                        <button class="ws-btn ws-mark" data-outcome="verified" title="${esc(t("planner.markOkTitle"))}">${esc(t("planner.markOk"))}</button>
                        <button class="ws-btn ws-mark" data-outcome="failed" title="${esc(t("planner.markBadTitle"))}">${esc(t("planner.markBad"))}</button>
                        ${r ? `<button class="ws-btn ws-mark" data-outcome="clear" title="${esc(t("planner.clearTitle"))}">${esc(t("planner.clear"))}</button>` : ""}
                    </span>
                </div>
            </div>`;
    }

    function renderOptions() {
        const box = root.querySelector(".ws-planner-options");
        const task = data.tasks.find((x) => x.id === currentTask);
        if (!task) {
            box.innerHTML = `<div class="ws-empty">${esc(t("planner.pickTask"))}</div>`;
            return;
        }
        const inputs = (task.inputs || []).filter((x) => x !== "text").map((x) => t(`input.${x}`));
        box.innerHTML =
            `<div class="ws-task-head">${esc(tr(task.label))}${inputs.length ? `<div class="ws-muted-text">${esc(t("planner.prepare", inputs.join("; ")))}</div>` : ""}</div>` +
            task.options.map(optionHtml).join("");

        box.querySelectorAll(".ws-option").forEach((card) => {
            const o = task.options[Number(card.dataset.index)];
            card.querySelector(".ws-apply").addEventListener("click", () => apply(task, o, card));
            const sel = card.querySelector(".ws-main");
            if (sel) sel.addEventListener("change", () => (card.querySelector(".ws-companions").innerHTML = companionsHtml(o.mains[sel.selectedIndex])));
            card.querySelectorAll(".ws-mark").forEach((b) =>
                b.addEventListener("click", () => mark(task, o, b.dataset.outcome, card.querySelector(".ws-note-input").value)),
            );
        });
    }

    function apply(task, o, card) {
        const main = card.querySelector(".ws-main");
        const payload = JSON.stringify({ task: task.id, arch: o.arch, main: main ? main.value : "" });
        const box = gradioApp().querySelector("#ws_planner_payload textarea");
        const btn = gradioApp().querySelector("#ws_planner_apply");
        if (!box || !btn) {
            toast([t("planner.noApplyTarget")], true);
            return;
        }
        box.value = payload;
        updateInput(box);
        btn.click();
        close();
    }

    async function mark(task, o, outcome, note) {
        try {
            const r = await fetch("./workstation/result", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ task: task.id, arch: o.arch, outcome, note }),
            });
            if (!r.ok) throw new Error(`HTTP ${r.status}`);
            await load();
            renderTasks();
            renderOptions();
        } catch (e) {
            toast([t("planner.recordFailed", e.message)], true);
        }
    }

    function toast(lines, isError) {
        const el = document.createElement("div");
        el.className = `ws-toast${isError ? " ws-toast-error" : ""}`;
        el.innerHTML = lines.map((l) => `<div>${esc(l)}</div>`).join("");
        document.body.appendChild(el);
        setTimeout(() => el.classList.add("ws-toast-out"), 7000);
        setTimeout(() => el.remove(), 7600);
    }

    window.wsOpenPlanner = async function () {
        ensureRoot().classList.add("ws-open");
        renderFrame();
        root.querySelector(".ws-planner-options").innerHTML = `<div class="ws-empty">${esc(t("planner.loading"))}</div>`;
        try {
            await load();
            if (!currentTask) currentTask = data.tasks[0]?.id;
            renderTasks();
            renderOptions();
        } catch (e) {
            root.querySelector(".ws-planner-options").innerHTML = `<div class="ws-empty">${esc(t("planner.loadFailed", e.message))}</div>`;
        }
        return [];
    };

    window.wsAfterApply = function (resultJson) {
        let r;
        try {
            r = JSON.parse(resultJson || "{}");
        } catch {
            r = { ok: false, error: ["planner.badResult"] };
        }
        if (!r.ok) {
            toast([t("planner.applyFailed", r.error ? message(r.error) : t("planner.unknownError"))], true);
            return [resultJson];
        }
        const lines = [t("planner.applied"), ...r.done.map((d) => "・" + message(d)), ...r.warnings.map((w) => "⚠ " + message(w))];
        const needsImg2img = (r.inputs || []).includes("source_image");
        if (needsImg2img) lines.push(t("planner.toImg2img"));
        toast(lines, r.warnings.length > 0);
        if (needsImg2img && typeof switch_to_img2img_tab === "function") switch_to_img2img_tab(0);
        return [resultJson];
    };

    // The open button is created by Python in English; show it in the UI language
    function labelButton() {
        const btn = gradioApp().querySelector("#ws_planner_open");
        if (btn && btn.textContent.trim() !== t("planner.button")) btn.textContent = t("planner.button");
    }
    onUiLoaded(labelButton);
    onOptionsChanged(labelButton);
    wsUI.onUpdate(labelButton);
})();
