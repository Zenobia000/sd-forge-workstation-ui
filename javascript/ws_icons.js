// Workstation UI theme: replace Forge's emoji tool buttons with monochrome line icons.
// The button keeps its handler and gets the emoji as its title.

(function () {
    "use strict";

    const SVG = (body) =>
        `<svg class="ws-icon" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${body}</svg>`;

    // ---------- emoji -> line icon ----------
    const ICONS = {
        "\u{1F3B2}": SVG('<rect x="3" y="3" width="18" height="18" rx="3"/><circle cx="8.5" cy="8.5" r="1"/><circle cx="15.5" cy="15.5" r="1"/><circle cx="12" cy="12" r="1"/>'), // dice
        "♻": SVG('<path d="M3 12a9 9 0 0 1 15.5-6.2L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-15.5 6.2L3 16"/><path d="M3 21v-5h5"/>'), // reuse
        "↙": SVG('<path d="M17 7 7 17"/><path d="M17 17H7V7"/>'), // paste params
        "\u{1F504}": SVG('<path d="M21 12a9 9 0 1 1-3-6.7L21 8"/><path d="M21 3v5h-5"/>'), // refresh
        "\u{1F4BE}": SVG('<path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><path d="M17 21v-8H7v8"/><path d="M7 3v5h8"/>'), // save
        "\u{1F4CB}": SVG('<rect x="8" y="2" width="8" height="4" rx="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/>'), // clipboard
        "\u{1F5D1}": SVG('<path d="M3 6h18"/><path d="M8 6V4h8v2"/><path d="M19 6l-1 14H6L5 6"/>'), // trash
        "\u{1F3B4}": SVG('<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>'), // extra networks
        "⇅": SVG('<path d="M7 4v16"/><path d="m3 8 4-4 4 4"/><path d="M17 20V4"/><path d="m13 16 4 4 4-4"/>'), // swap w/h
        "⇄": SVG('<path d="M4 7h16"/><path d="m16 3 4 4-4 4"/><path d="M20 17H4"/><path d="m8 21-4-4 4-4"/>'), // reverse
        "\u{1F300}": SVG('<path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 3v5h5"/><path d="M12 7v5l3 2"/>'), // restore progress
        "\u{1F4D0}": SVG('<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18"/><path d="M9 21V9"/>'), // size / extras
        "\u{1F4C2}": SVG('<path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>'), // folder
        "\u{1F5C3}": SVG('<rect x="3" y="4" width="18" height="5" rx="1"/><path d="M5 9v10a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V9"/><path d="M10 13h4"/>'), // zip
        "\u{1F5BC}": SVG('<rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-5-5L5 21"/>'), // to img2img
        "\u{1F3A8}": SVG('<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/>'), // to inpaint
        "✨": SVG('<path d="M15 3h6v6"/><path d="M9 21H3v-6"/><path d="M21 3l-7 7"/><path d="M3 21l7-7"/>'), // upscale
        "\u{1F58C}": SVG('<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/>'), // edit style
        "\u{1F4DD}": SVG('<path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><path d="M14 3v6h6"/><path d="M8 13h8M8 17h5"/>'), // copy / open
        "\u{1F4F7}": SVG('<path d="M4 8h3l2-3h6l2 3h3a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1z"/><circle cx="12" cy="13" r="3.5"/>'), // camera
        "\u{1F4A5}": SVG('<polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>'), // run preprocessor
    };

    const stripVS = (s) => s.replace(/️/g, "").trim();

    function replaceIcons(root) {
        root.querySelectorAll("button.tool, button.lg.secondary, button.sm.secondary").forEach((btn) => {
            if (btn.dataset.wsIcon) return;
            const text = stripVS(btn.textContent || "");
            if (!text || text.length > 3) return;
            const svg = ICONS[text];
            if (!svg) return;
            if (!btn.title) btn.title = text;
            btn.dataset.wsIcon = text;
            btn.innerHTML = svg;
        });
    }

    onUiLoaded(() => replaceIcons(gradioApp()));
    let pending = false;
    onUiUpdate(() => {
        if (pending) return;
        pending = true;
        requestAnimationFrame(() => {
            pending = false;
            replaceIcons(gradioApp());
        });
    });
})();
