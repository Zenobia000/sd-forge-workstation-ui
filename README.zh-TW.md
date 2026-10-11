# sd-forge-workstation-ui

[English](README.md)

這是 [Stable Diffusion WebUI Forge - Neo](https://github.com/Haoming02/sd-webui-forge-classic/tree/neo) 的擴充，幫不熟各種模型家族的人選對模型、用對工具。
它只往介面上加東西，Forge 原本的按鈕和欄位都留在原位，用法也不變。

## 功能

- **黑白主題**：安靜的黑白配色；原本的 emoji 按鈕改成線條圖示；Settings 左側目錄重新排版，比較好讀。
- **欄位提示**：常用欄位旁有「?」，說明這個欄位做什麼、數值怎麼設比較合理。
- **UI Preset 依架構分組**：下拉選單分成 U-Net／DiT，每個家族附一行用途，也標出你有沒有這個家族的模型。

## 安裝

到 **Extensions › Install from URL**，貼上 `https://github.com/Zenobia000/sd-forge-workstation-ui`，安裝後重啟 Forge。

## 語言

支援英文與繁體中文，語言跟著 **Settings › User interface › Localization** 走：
- Localization 選了 `zh` 開頭的檔案時，顯示中文；選其他語言時顯示英文。
- 沒選 Localization 時，依瀏覽器語言決定。

擴充本身附了一個小的 `zh_TW` 語系檔。所以就算沒有安裝完整的中文語系包，Localization 選單裡也會有 zh_TW 可以選。

## 授權

[AGPL-3.0](LICENSE)，與 Forge 相同。
