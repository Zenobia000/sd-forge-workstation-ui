# 維護模型登記表

[English](MAINTAINING.md)

只是要「用」模型的話，這裡的東西都不用填。檔案放進 Forge 的模型資料夾，照常就會出現在 Checkpoint 選單裡。
登記表只決定兩件事：滑鼠停留時的說明卡片寫什麼，以及「選擇方案」面板能建議什麼。

| 想要的效果 | 要做的事 | 必填？ |
|---|---|---|
| Checkpoint 選單選得到 | 把檔案放進對應的模型資料夾，按 Checkpoint 旁的重新整理 | 必要 |
| 滑鼠停留時顯示預覽圖 | `python -I tools/fetch_previews.py <資料夾>` | 選填 |
| 滑鼠停留時顯示風格、適合用途、建議參數 | 在 `model_styles.json` 加一筆 | 選填 |
| 出現在「選擇方案」裡 | 在 `registry/knowledge.json` 的 `assets` 加一筆 | 要用方案就必填 |
| 新家族第一次進「選擇方案」 | 在 `knowledge.json` 加 `architectures` 和 `routes` | 新家族才需要 |

「已安裝」狀態不寫在任何表裡，每次請求都會重新掃描模型資料夾。`knowledge.json` 和 `model_styles.json` 也是每次請求都重讀，改完重新整理瀏覽器即可。

## 檔案

| 檔案 | 內容 | 誰維護 |
|---|---|---|
| `registry/knowledge.json` | 任務、能力、架構、做法（routes）、已知檔案（assets）、UI Preset 說明 | 手動 |
| `model_styles.json` | 每個模型的說明，key 是不含副檔名的檔名 | 手動 |
| `registry/user_results.json` | 你在方案面板按「可行／不行」的紀錄 | 面板自動寫，不要手改 |
| `tools/sha256_cache.json` | 預覽工具的 hash 快取 | 自動 |

## 文字與語言

所有文字欄位都可以寫成一般字串，或是中英一組：

```json
"label": { "en": "Keep outlines", "zh_TW": "保留輪廓" }
```

Forge 的 **Settings › User interface › Localization** 選了 `zh` 開頭的檔案時顯示 `zh_TW`。沒選 Localization 時，瀏覽器語言是中文也會顯示 `zh_TW`。其他情況顯示 `en`。寫成一般字串的欄位，兩種語言都顯示同一段文字。

## 上架新模型

1. **放檔案**：把模型放進對應家族的資料夾。
2. **登記檔案**：在 `knowledge.json` 的 `assets` 加一筆（面板已經認得的家族，做到這步就夠了）：

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

   - `file`：只寫檔名，不寫路徑。
   - `role`：決定它屬於哪個架構。現有的主模型角色是 `checkpoint.sdxl` 和 `diffusion.flux2_klein`。
   - `companions`（選填）：這個模型需要另外帶入的 Text Encoder／VAE 角色。例如 Klein 4B 是 `["text_encoder.qwen3_4b", "vae.flux2"]`，這些角色本身也要各有一筆 asset。
   - `overrides`（選填）：這個模型特別的參數，例如 Lightning 版 `{"steps": 6, "cfg": 2}`。
   - `source`／`license`／`sha256`：建議填，之後才查得到來源。
3. **寫說明**（選填）：在 `model_styles.json` 加 `family`、`style`、`best_for`、`settings`、`notes`。
4. **抓預覽圖**（選填）：`python -I tools/fetch_previews.py <checkpoint 資料夾> [<資料夾> ...]`。優先用檔案內嵌的縮圖；沒有的話，用檔案 hash 到 Civitai 查詢，只存分級為 PG 的圖。
5. **檢查**：`python -I tools/check_registry.py <模型資料夾>`。它會列出：
   - 參照錯誤，例如拼錯的角色名、不存在的架構；
   - 硬碟上還沒登記的主模型；
   - 還沒有說明的主模型。

   有錯誤時結束碼是 1。
6. **重新整理**瀏覽器（Ctrl+F5），不用重啟 Forge。

## 新家族加入「選擇方案」

UI Preset 的 13 個家族說明已經寫在 `presets`，只有 Forge 本身新增 Preset 時才需要動這一段。

要讓新家族出現在「選擇方案」，再加兩樣：

- **`architectures`**：一個新的架構 id。

  ```json
  "zimage": {
    "label": "Z-Image",
    "forge_preset": "zit",
    "slots": { "main": { "role": "diffusion.zimage", "required": true, "note": "..." } },
    "defaults": { "width": 1024, "height": 1024, "steps": 9, "cfg": 1 }
  }
  ```

  `forge_preset` 必須是 `presets` 裡的 key：sd、xl、flux、klein、qwen、qwen21、zit、krea、lumina、ernie、anima、wan、pid。`slots.main.role` 要跟該家族模型 asset 的 `role` 相同。

- **`routes`**：這個家族「怎麼做」每一種能力，一種能力一筆：

  ```json
  { "arch": "zimage", "capability": "generate", "method": "native", "basis": "docs" }
  ```

  - `method`：`native`、`controlnet`、`ipadapter`、`reference_edit`、`upscaler`、`adetailer`、`engine_limit`（Forge 不支援）。
  - 用到 ControlNet 時，加上 `requires`（需要哪些檔案角色）和 `forge`（`control_type`、`preprocessor`、`weight`、`end`）。套用方案時，會把這些值填進 ControlNet 單元 1。
  - `basis`：`docs` 是依模型頁或 Forge README 寫的，`verified` 是實測過的。
  - 沒寫 route 的能力，面板會顯示「未知（沒人測過）」，但還是可以套用。

## 測試結果

在方案面板按「✓ 可行」或「✗ 不行」，結果會寫進 `user_results.json`，並且優先於 `knowledge.json` 的建議。
結論確定後，可以把那條 route 的 `basis` 改成 `verified`，再在面板按「清除」。
