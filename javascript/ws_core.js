// Workstation UI core: language selection, translation helpers and the floating tooltip.
// Every other ws_*.js file uses window.wsUI; file names sort so this one loads first.

(function () {
    "use strict";

    // Follows Forge's Settings › User interface › Localization (any "zh*" file -> Chinese).
    // With no localization selected, the browser language decides. Only English and Traditional Chinese exist.
    function lang() {
        const loc = String((typeof opts !== "undefined" && opts.localization) || "None");
        const src = loc === "None" ? navigator.language || "" : loc;
        return /^zh/i.test(src) ? "zh_TW" : "en";
    }

    // A text value is either a plain string or {"en": "...", "zh_TW": "..."}
    function tr(v) {
        if (v == null || typeof v === "string") return v ?? "";
        return v[lang()] ?? v.en ?? Object.values(v)[0] ?? "";
    }

    // UI strings shared by the ws_*.js files: key -> {en, zh_TW}; {0}, {1} ... are replaced by args
    const STRINGS = {};
    function define(dict) {
        Object.assign(STRINGS, dict);
    }
    function t(key, ...args) {
        const s = STRINGS[key] ? tr(STRINGS[key]) : key;
        return s.replace(/\{(\d+)\}/g, (_, i) => args[i] ?? "");
    }

    const esc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);

    // ---------- floating tooltip shared by hints, presets and previews ----------
    let tip = null;
    function getTip() {
        if (!tip) {
            tip = document.createElement("div");
            tip.className = "ws-tip";
            document.body.appendChild(tip);
        }
        return tip;
    }

    function placeTip(anchorRect, prefer) {
        const el = getTip();
        const pad = 10;
        const w = el.offsetWidth;
        const h = el.offsetHeight;
        let x = prefer === "side" ? anchorRect.right + pad : anchorRect.left;
        let y = prefer === "side" ? anchorRect.top - 20 : anchorRect.bottom + 6;
        if (x + w > window.innerWidth - pad) x = prefer === "side" ? anchorRect.left - w - pad : window.innerWidth - w - pad;
        if (y + h > window.innerHeight - pad) y = Math.max(pad, (prefer === "side" ? window.innerHeight : anchorRect.top - 6) - h - (prefer === "side" ? pad : 0));
        el.style.left = `${Math.max(pad, x)}px`;
        el.style.top = `${Math.max(pad, y)}px`;
    }

    function showTip(html, anchor, prefer) {
        const el = getTip();
        el.innerHTML = html;
        el.classList.add("ws-tip-show");
        placeTip(anchor.getBoundingClientRect(), prefer);
        el.querySelectorAll("img").forEach((img) => img.addEventListener("load", () => placeTip(anchor.getBoundingClientRect(), prefer), { once: true }));
    }

    function hideTip() {
        if (tip) tip.classList.remove("ws-tip-show");
    }

    // Anything that opened the tooltip registers its selector here; leaving it hides the tooltip
    const tipSources = [];
    function hideTipOnLeave(selector) {
        tipSources.push(selector);
    }
    document.addEventListener("mouseout", (e) => {
        if (e.target.closest && tipSources.some((s) => e.target.closest(s))) hideTip();
    });

    // Run fn on every UI update, at most once per frame
    function onUpdate(fn) {
        let pending = false;
        onUiUpdate(() => {
            if (pending) return;
            pending = true;
            requestAnimationFrame(() => {
                pending = false;
                fn(gradioApp());
            });
        });
    }

    // Custom tooltip content for a hint badge: key -> () => html (falls back to the plain hint text)
    const hintHtml = {};

    // Lets style.css switch CSS-generated text by language
    const markLang = () => (document.documentElement.dataset.wsLang = lang());
    markLang();
    onOptionsChanged(markLang);

    window.wsUI = { lang, tr, t, define, esc, showTip, hideTip, hideTipOnLeave, onUpdate, hintHtml };
})();
