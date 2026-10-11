// Workstation UI: "?" hint badges next to field labels, in English or Traditional Chinese.
// Additive only: a badge is inserted next to an existing label, nothing is moved or removed.

(function () {
    "use strict";

    const h = (en, zh) => ({ en, zh_TW: zh });

    // ---------- label text -> explanation ----------
    const HINTS = {
        "UI Preset": h(
            "Model family (architecture). Must match the Checkpoint's family, otherwise the default parameters are wrong. Open the list to see what each family is for.",
            "選模型家族（架構）。要跟 Checkpoint 的家族一致，否則預設參數會錯。展開選單可看每個家族的用途。",
        ),
        "Checkpoint": h(
            "The main model; it decides the overall look. Hover an item in the list to preview its style. SDXL checkpoints already contain the VAE and text encoder.",
            "主模型，決定整體畫風。滑鼠移到下拉選單的每一項上，可以預覽風格。SDXL 模型已內含 VAE 與文字編碼器。",
        ),
        "VAE / Text Encoder": h(
            "Extra VAE or text encoder files. Leave empty for SDXL (built in). Files that contain only the diffusion model, such as FLUX.2 Klein, need their text encoder and VAE selected here (e.g. qwen_3_4b + flux2-vae).",
            "額外的 VAE 或文字編碼器。SDXL 留空即可（已內建）；FLUX.2 Klein 這類「只有主模型」的檔案，要在這裡同時選 qwen_3_4b 和 flux2-vae。",
        ),
        "Diffusion in Low Bits": h(
            "Load the model in lower precision (fp8 / nf4) to save VRAM. Slightly lower quality, less VRAM. Automatic is fine for SD / SDXL on a 24 GB card.",
            "用較低精度載入模型以省顯存（如 fp8 / nf4）。畫質可能略降，速度與顯存較省。24GB 顯卡跑 SD/SDXL 用 Automatic 即可。",
        ),
        "Prompt": h(
            "What you want in the image. Earlier words weigh more; (word:1.2) strengthens a word.",
            "正向提示詞：描述你想要的內容。越前面的字權重越高；用 (字:1.2) 可加強。",
        ),
        "Negative Prompt": h(
            "What you don't want, e.g. lowres, bad hands, watermark.",
            "反向提示詞：不想出現的東西，例如 lowres, bad hands, watermark。",
        ),
        "Sampling Method": h(
            "How each step removes noise. Euler a varies more, DPM++ 2M is stable and sharp, DPM++ SDE has more detail but is slower. The same seed gives a different image with another sampler.",
            "取樣器：每一步怎麼「去噪」。Euler a 變化較多、DPM++ 2M 穩定清晰、DPM++ SDE 細節多但較慢。換取樣器同一個 Seed 結果也會不同。",
        ),
        "Schedule Type": h(
            "How the denoising strength is spread over the steps. Karras takes big steps early and refines late, usually sharper. For Lightning / Turbo models follow the model page.",
            "排程：每一步去噪力道怎麼分配。Karras 前期大步、後期細修，通常較清晰；Lightning/Turbo 類模型依模型頁建議設定。",
        ),
        "Sampling Steps": h(
            "Number of denoising steps. Too few looks blurry or unfinished; 20-30 is usually enough, above 40 is mostly slower. Lightning models need only 4-8.",
            "去噪步數。太少→模糊、未完成；一般 20-30 足夠，超過 40 改善有限只是更慢。Lightning 模型只要 4-8 步。",
        ),
        "Width": h(
            "Width in pixels. SD 1.5 is built around 512, SDXL around 1024; straying far causes duplicated subjects or broken composition.",
            "寬度（像素）。SD1.5 以 512 為基準、SDXL 以 1024 為基準；偏離太多容易出現重複人物或構圖崩壞。",
        ),
        "Height": h(
            "Height in pixels. Common portrait sizes: SD 1.5 512x768, SDXL 832x1216.",
            "高度（像素）。直式人像常用 SD1.5: 512x768、SDXL: 832x1216。",
        ),
        "Batch Count": h("How many runs, one after another. No extra VRAM, only more time.", "要跑幾輪（依序執行）。不吃額外顯存，只是時間變長。"),
        "Batch Size": h("Images per run, generated in parallel. Faster but uses more VRAM.", "每輪同時生幾張（平行執行）。比較快但吃顯存。"),
        "CFG Scale": h(
            "How strictly the prompt is followed. Low (3-5) looks natural; high (7-10) follows the prompt more but oversaturates easily. Lightning models use about 1-2, FLUX uses 1.",
            "提示詞服從度。低（3-5）較自然有創意；高（7-10）更貼提示詞但容易過飽和、過曝。Lightning 模型約 1-2、FLUX 為 1。",
        ),
        "Distilled CFG Scale": h("Guidance for FLUX dev-style models, usually 3-4. Not used by SD / SDXL.", "FLUX dev 類模型專用的引導強度，通常 3-4。SD/SDXL 不使用。"),
        "Rescale CFG": h("Reduces burned colors at high CFG, mainly for v-pred models. Keep 0 for regular models.", "降低高 CFG 造成的色彩過曝，主要給 v-pred 模型用。一般模型保持 0。"),
        "MaHiRo": h("An alternative CFG formula that holds up better at high CFG. Experimental; can stay off.", "另一種 CFG 計算方式，可讓高 CFG 時畫面較不崩。實驗性選項，可先不開。"),
        "Seed": h(
            "Random seed. Same settings + same seed = same image. -1 is random each time; note the seed of an image you like before tweaking other settings.",
            "隨機種子。相同參數＋相同 Seed＝相同圖片。-1 為每次隨機；找到喜歡的圖時記下 Seed 再微調其他參數。",
        ),
        "Variation seed": h("A second seed mixed into the main one, for small variations of the same composition.", "第二顆種子，跟主 Seed 混合，用來做「同構圖的微變化」。"),
        "Variation strength": h(
            "How much of the variation seed is mixed in. 0 = original, 1 = entirely the new seed; 0.1-0.3 for small changes.",
            "混入 Variation seed 的比例。0＝完全原圖，1＝完全新種子；0.1-0.3 適合做小變化。",
        ),
        "Hires. fix": h(
            "Generate small, then upscale and redraw. Avoids the broken composition of generating large directly and adds detail. Takes longer.",
            "高解析修復：先生小圖再放大重繪。可避免直接生大圖造成的構圖崩壞，並補細節。會多花時間。",
        ),
        "Upscaler": h("Upscaling method. Latent ones redraw more detail; ESRGAN / 4x ones stay closer to the original.", "放大演算法。Latent 系列會重繪較多細節；ESRGAN / 4x 系列較忠於原圖。"),
        "Upscale by": h("Upscale factor. 1.5-2x is the most common.", "放大倍率。1.5-2 倍最常用。"),
        "Hires steps": h("Steps for the upscale pass; 0 = same as the main steps.", "放大重繪的步數，0＝與原本步數相同。"),
        "Denoising strength": h(
            "How much is redrawn. 0 = unchanged, 1 = completely new. Hires. fix: 0.3-0.5; img2img: 0.3 for small edits, 0.6+ for big changes.",
            "重繪強度。0＝不改，1＝完全重畫。Hires. fix 建議 0.3-0.5；img2img 改動小用 0.3、大改用 0.6 以上。",
        ),
        "Hires CFG Scale": h("CFG for the upscale pass, usually the same as the main CFG.", "放大重繪階段使用的 CFG，通常與主 CFG 相同。"),
        "Hires Checkpoint": h("Use another model for the upscale pass, e.g. a realistic one for detail. Use same is fine.", "放大重繪時換用另一個模型，例如用寫實模型補細節。保持 Use same 即可。"),
        "Hires sampling method": h("Sampler for the upscale pass; keep it the same as the main sampler.", "放大重繪階段的取樣器，保持與主取樣器相同即可。"),
        "Hires schedule type": h("Schedule for the upscale pass; keep it the same as the main one.", "放大重繪階段的排程，保持與主設定相同即可。"),
        "Resize width to": h("Exact width after upscaling; 0 = use Upscale by.", "直接指定放大後寬度；0＝改用「Upscale by」倍率。"),
        "Resize height to": h("Exact height after upscaling; 0 = use Upscale by.", "直接指定放大後高度；0＝改用「Upscale by」倍率。"),
        "Refiner": h("Hand the last part of generation to another model (e.g. the SDXL refiner). Community models don't need it.", "生圖後段換另一個模型接手（例如 SDXL refiner）。一般社群模型不需要。"),
        "Switch at": h("Progress at which the refiner takes over. 0.8 = the main model does the first 80%.", "在多少進度時換成 Refiner 模型。0.8＝前 80% 用主模型。"),
        "Resize Mode": h("What to do when the input and output aspect ratios differ: stretch, crop, or pad.", "輸入圖與目標尺寸比例不同時的處理方式：直接拉伸、裁切、或補邊。"),
        "Mask blur": h("Feathering of the mask edge in pixels. Larger blends seams better but affects a wider area.", "遮罩邊緣羽化程度（像素）。越大接縫越自然，但影響範圍變大。"),
        "Masked content": h(
            "What fills the mask before redrawing: original keeps the image (small change), fill uses surrounding colors, latent noise starts from noise (big change, needs high denoising).",
            "遮罩區域重繪前要填什麼：original 保留原圖（改動小）、fill 填周圍色、latent noise 填雜訊（大改，需高重繪強度）。",
        ),
        "Inpaint area": h(
            "Whole picture = redraw with the full image as context; Only masked = enlarge and redraw just the masked area, better detail (faces, hands).",
            "Whole picture＝以整張圖為參考重繪；Only masked＝只放大遮罩區域重繪，細節較好（適合修臉、修手）。",
        ),
        "Only masked padding, pixels": h("With Only masked: how many pixels around the mask are used as context. Too small looks out of place.", "「Only masked」時，遮罩外多取多少像素當參考。太小會不協調。"),
        "Image CFG Scale": h("How closely to follow the source image (instruct models). Higher stays closer.", "對原圖的服從度（instruct 類模型用）。越高越像原圖。"),
        "Scale": h("Output size factor for img2img.", "img2img 的輸出尺寸倍率。"),
        "Script": h("Extra scripts. X/Y/Z plot builds a grid comparing parameter values, a good way to learn what each one does.", "附加腳本，例如 X/Y/Z plot 可以自動產生「參數對照表」，很適合學習每個參數的效果。"),
        "X type": h("Parameter compared along X, e.g. Checkpoint to compare model styles side by side.", "X 軸要比較的參數，例如 Checkpoint 可並排比較不同模型風格。"),
        "Y type": h("Parameter compared along Y, e.g. CFG Scale.", "Y 軸要比較的參數，例如 CFG Scale。"),
        "Z type": h("Parameter compared along Z.", "Z 軸要比較的參數。"),
        "X values": h("Values for X, comma separated, e.g. 20,30,40.", "X 軸的值，用逗號分隔，例如 20,30,40。"),
        "Y values": h("Values for Y, comma separated, e.g. 3,5,7.", "Y 軸的值，用逗號分隔，例如 3,5,7。"),
        "Z values": h("Values for Z, comma separated.", "Z 軸的值，用逗號分隔。"),
        "Upscaler 1": h("Upscaler for Extras. Photos: 4x-UltraSharp / R-ESRGAN 4x+; anime: R-ESRGAN 4x+ Anime6B.", "Extras 放大使用的演算法。照片用 4x-UltraSharp / R-ESRGAN 4x+，動漫用 R-ESRGAN 4x+ Anime6B。"),
        "Upscaler 2": h("A second upscaler blended with the first.", "第二個放大演算法，與第一個混合。"),
        "Upscaler 2 visibility": h("Blend ratio of the second upscaler.", "第二個放大演算法的混合比例。"),

        // Built-in extension panels (accordion titles)
        "ADetailer": h(
            "Automatic face / hand fix: detects faces, hands or people, then inpaints just that area to repair broken features and fingers. Tick to enable (faces by default); takes a bit longer.",
            "自動修臉、修手：先偵測臉、手或人物，再針對那一塊局部重繪，修正崩壞的五官和手指。勾選即可使用，預設偵測臉；會多花一點時間。",
        ),
        "ControlNet Integrated": h(
            "Control composition with a reference image: edges, pose, depth, style and more. Open it, tick Enable in unit 1, pick a Control Type and upload the reference. Supports SD 1.5 and SDXL; Anima supports only LLLite / Region; FLUX, Klein, Qwen etc. are not supported.",
            "用參考圖控制構圖：輪廓、姿勢、深度、風格參考等。展開後在單元 1 勾 Enable、選 Control Type、上傳參考圖。支援 SD1.5、SDXL；Anima 只支援 LLLite / Region 類型；FLUX、Klein、Qwen 等不支援。",
        ),
        "Sparse Attention Integrated": h(
            "Sparse attention speed-up: computes only the more important parts. Mainly for large sizes, video, or new architectures like FLUX and Qwen. Higher Tau is faster but lower quality. Not needed for SDXL.",
            "稀疏注意力加速：只計算比較重要的部分來換速度，主要給大尺寸、影片或 FLUX、Qwen 這類新架構用。Tau 越高越快但品質越差。SDXL 一般不需要開。",
        ),
        "Never OOM Integrated": h(
            "Avoid out-of-memory errors. UNet: always offload the main model (slower, never runs out); VAE: tiled decoding for very large images. Not needed on a 24 GB card unless you hit OOM.",
            "防止顯存不足（OOM）。UNet 選項：主模型一律移出顯存，變慢但不會爆；VAE 選項：分塊解碼，生超大圖時用。24GB 顯卡平常不用開，遇到顯存不足再開。",
        ),
        "ImageStitch Integrated": h(
            "Reference images for editing models such as FLUX.2 Klein, Qwen-Image-Edit and Flux Kontext. txt2img: use a reference with a custom output size; img2img: several references at once (e.g. \"put the clothes of image 2 on the person in image 1\"). Images are not literally stitched. Not used by SDXL.",
            "給 FLUX.2 Klein、Qwen-Image-Edit、Flux Kontext 這類「編輯型」模型放參考圖。txt2img：用參考圖並自訂輸出尺寸；img2img：一次放多張參考圖（例如「把圖 2 的衣服換到圖 1 的人身上」）。不會真的把圖拼起來。SDXL 用不到。",
        ),
        "Spectrum Integrated": h(
            "Speed-up that predicts later steps and skips some computation, trading a little accuracy for speed. Most effective with many steps; leave off for maximum quality.",
            "生成加速：預測後面幾步的結果，跳過部分計算，用少許精準度換速度。步數多時效果明顯；追求最高品質時不要開。",
        ),
        "MultiDiffusion Integrated": h(
            "Tiled redraw: splits a large image into tiles and joins them back, to upscale very large images without running out of VRAM. Larger Tile Overlap hides seams better.",
            "分塊重繪：把大圖切成小塊分別處理再接回去，用在放大超大圖時避免顯存不足。Tile Overlap 越大，接縫越不明顯。",
        ),
        "PiD Integrated": h("Upscale and add detail with a PiD model after generation (shown only when a PiD model is installed).", "生成後自動用 PiD 模型放大補細節（要另外下載 PiD 模型，這個區塊才會出現）。"),
        "RadialAttention Integrated": h("Speed-up for video models (Wan); not used for images.", "影片模型（Wan）專用的加速，生圖用不到。"),
        "Torch Compile Integrated": h("Compile the model ahead of time for speed; needs Triton. The first run waits a long time, later runs are faster.", "預先編譯模型來加速，需要 Triton。第一次執行會等很久，之後才會變快。"),
        "Soft Inpainting": h("Soft transition at the mask edge when inpainting, so old and new content blend.", "局部重繪時讓遮罩邊緣柔和過渡，新舊內容的接縫更自然。"),
    };

    // ---------- ControlNet: scoped so generic words like "Enable" don't collide with other panels ----------
    const CN_SCOPE = '[id*="controlnet"]';

    // Field titles and checkboxes inside a ControlNet unit
    const CN_HINTS = {
        "Enable": h("This unit does nothing unless ticked.", "勾選後這個 ControlNet 單元才會生效。沒勾等於沒用。"),
        "Pixel Perfect": h("Sets the preprocessor resolution from the output size. Keep it on so you never tune Preprocessor resolution by hand.", "自動依輸出尺寸決定前處理解析度，建議保持勾選，省去手動調「Preprocessor resolution」。"),
        "Allow Preview": h("Show the preprocessor result (lines, depth, skeleton) to check the control signal before generating.", "顯示前處理結果（線稿、深度圖、骨架圖），可以先確認控制訊號對不對再生圖。"),
        "Use Mask": h("Apply ControlNet only inside the mask.", "只讓遮罩範圍受 ControlNet 控制。"),
        "Preview as Input": h("Use the preview itself as the control image (e.g. line art you edited by hand).", "直接把預覽結果當成控制圖使用（例如你手動修過的線稿）。"),
        "Upload independent control image": h("In img2img, upload a separate control image instead of reusing the img2img source.", "img2img 時另外上傳一張控制圖，不沿用 img2img 的原圖。"),
        "Control Type": h(
            "Kind of control. Picking one filters the preprocessor and model lists below. Each option has its own ? with a plain explanation.",
            "控制的種類。選一個類型後，下方的前處理器和模型清單會自動篩選成對應項目。每個選項旁的 ? 有白話說明。",
        ),
        "Preprocessor": h(
            "Turns the reference into a control signal (lines, depth, skeleton...). Downloaded on first use, so the first run is slower. None means your upload already is the control image.",
            "前處理器：把參考圖轉成控制訊號（線稿、深度圖、骨架…）。第一次使用時會自動下載，所以會慢一點。選 None 代表你上傳的就已經是控制圖。",
        ),
        "Model": h(
            "The control model that makes the main model follow the signal. Must match the main model's family (SDXL with SDXL). None means no model is installed for this type.",
            "控制模型：讓主模型遵守控制訊號。必須跟主模型同系列（SDXL 主模型配 SDXL 控制模型）。顯示 None 代表這個類型還沒有安裝模型。",
        ),
        "Control Weight": h("Strength. 1 is standard; 0.5-0.8 leaves more freedom, higher follows the control image more strictly.", "控制強度。1 為標準；調低（0.5-0.8）讓 AI 有更多發揮空間，調高則更嚴格照著控制圖。"),
        "Timestep Range": h(
            "Part of the generation where control applies. 0 to 1 is the whole run; ending at 0.6-0.8 fixes composition early and frees details late, usually more natural.",
            "控制在生成過程的哪一段生效。0 到 1 為全程；把結束點調到 0.6-0.8，前期定構圖、後期讓細節自由發揮，畫面通常更自然。",
        ),
        "Preprocessor resolution": h("Preprocessing resolution. Higher is more detailed but slower; not needed with Pixel Perfect.", "前處理的解析度。越高細節越多但越慢；勾了 Pixel Perfect 就不用調。"),
        "Threshold A": h("Preprocessor parameter A; meaning depends on the type (e.g. Canny low threshold: lower finds more lines).", "前處理器的參數 A，依類型不同意義不同（例如 Canny 的低門檻：越低抓到的線越多）。"),
        "Threshold B": h("Preprocessor parameter B; meaning depends on the type (e.g. Canny high threshold).", "前處理器的參數 B，依類型不同意義不同（例如 Canny 的高門檻）。"),
        "Control Mode": h(
            "Prompt or control image, which matters more. Balanced; My prompt is more important; ControlNet is more important.",
            "提示詞和控制圖誰比較重要。Balanced 平衡；My prompt is more important 偏向提示詞；ControlNet is more important 偏向控制圖。",
        ),
        "Resize Mode": h("When the control image and output ratios differ: stretch, crop, or pad. Matching the ratio avoids the question.", "控制圖和輸出尺寸比例不同時怎麼處理：直接拉伸、裁切、或補邊。建議跟輸出比例一致就不用煩惱。"),
        "Hires-Fix Option": h("With Hires. fix: apply ControlNet in both passes, only the small pass, or only the upscale pass.", "開 Hires. fix 時，ControlNet 要在哪個階段生效：兩階段都用、只在小圖、或只在放大階段。"),
    };

    // Options of the "Control Type" radio group (and other ControlNet radios)
    const CN_OPTION_HINTS = {
        "All": h("Show every preprocessor and model, no filter.", "顯示全部前處理器與模型，不做篩選。"),
        "Canny": h("Keeps the outlines of products, people and buildings. Good for new backgrounds or styles with the same shape.", "保留產品、人物及建築的輪廓。把參考圖轉成清楚的邊線，適合商品換背景、換風格但外形不變。"),
        "Depth": h("Keeps distance, perspective and what is in front of what. Good for storyboards and scene layout.", "保持遠近、空間透視、人物與背景的前後關係。適合電影分鏡、場景構圖。"),
        "OpenPose": h("Controls the body skeleton and pose, taken from a reference photo.", "控制人物骨架、動作、姿勢。從參考照片抓出人體骨架，讓生成的人照同樣姿勢擺。"),
        "IP-Adapter": h("Borrows the style, look and lighting of a reference, not its outlines. Preprocessor: CLIP-ViT-H (IPAdapter).", "參考圖片的風格、人物外觀、光影。不是照輪廓，而是「感覺像這張圖」。前處理器選 CLIP-ViT-H (IPAdapter)。"),
        "Lineart": h("Keeps clean line art and illustration structure; more hand-drawn than Canny.", "保留乾淨線稿、造型及插畫結構。比 Canny 更像手繪線條。"),
        "SoftEdge": h("Keeps soft boundaries and forms; looser than Canny.", "保留柔和的邊界、形體與細節。比 Canny 寬鬆，AI 發揮空間較大。"),
        "Scribble": h("A rough doodle sets the composition.", "用簡單塗鴉決定構圖，AI 依塗鴉的大概形狀去畫。"),
        "Sketch": h("Follows a sketch more closely than Scribble.", "依草圖生成，比 Scribble 更依照筆畫細節。"),
        "MLSD": h("Straight lines only; for architecture and interiors.", "只抓直線，適合建築、室內設計、透視線條。"),
        "NormalMap": h("Keeps surface relief and volume (normal map).", "保留物體表面的凹凸與立體感（法線圖）。"),
        "Segmentation": h("Controls what goes in each region (sky, building, person...).", "依區塊分割（天空、建築、人…）控制畫面每一區要放什麼。"),
        "Shuffle": h("Scrambles the reference and borrows only colors and mood.", "打散參考圖的內容，只借用色彩與氛圍。"),
        "Tile": h("For upscaling or adding detail: keeps structure, redraws texture.", "放大或補細節時用，保持原圖結構只重繪紋理。"),
        "Inpaint": h("Redraws only the masked area and blends it with the surroundings.", "局部重繪：只改遮罩範圍，讓新內容跟周圍自然接合。"),
        "Instant-ID": h("Keeps a specific face (needs face models and InsightFace).", "保留特定人臉的長相（需要人臉模型與 InsightFace）。"),
        "Reference": h("References a picture's style and content directly, no extra model.", "直接參考一張圖的風格與內容，不需要額外模型。"),
        "Blur": h("Generates a sharp version of a blurry reference; often used for upscaling.", "依模糊的參考圖生成清晰版本，常用於放大補細節。"),
        "T2I-Adapter": h("A lighter control model format, similar to ControlNet.", "另一種輕量的控制模型格式，效果類似 ControlNet。"),
        "Region": h("Regional control: different ControlNets act on different areas.", "分區控制：讓不同 ControlNet 只作用在畫面的不同區域。"),
        "Balanced": h("Prompt and control image weigh the same (recommended).", "提示詞與控制圖同等重要（建議預設）。"),
        "My prompt is more important": h("Leans on the prompt; the control image is a guide.", "偏向提示詞，控制圖只當參考。"),
        "ControlNet is more important": h("Leans on the control image and follows it strictly.", "偏向控制圖，嚴格照著控制訊號。"),
        "Just Resize": h("Stretches to the output size; distorts if the ratio differs.", "直接拉伸成輸出尺寸，比例不同會變形。"),
        "Crop and Resize": h("Keeps the ratio and crops the excess.", "保持比例，裁掉多出來的部分。"),
        "Resize and Fill": h("Keeps the ratio and pads the empty space.", "保持比例，空出來的部分自動補邊。"),
        "Both": h("Apply ControlNet in both the small and upscale passes.", "小圖和放大階段都套用 ControlNet。"),
        "Low res only": h("Apply only in the first, small pass.", "只在第一階段小圖套用。"),
        "High res only": h("Apply only in the Hires. fix pass.", "只在 Hires. fix 放大階段套用。"),
    };

    function makeBadge(key, scope) {
        const badge = document.createElement("span");
        badge.className = "ws-hint";
        badge.textContent = "?";
        badge.dataset.key = key;
        badge.dataset.scope = scope;
        return badge;
    }

    function addHints(root) {
        // Field titles: ControlNet-specific wording wins inside a ControlNet unit
        root.querySelectorAll('span[data-testid="block-info"], .label-wrap > span:first-child').forEach((label) => {
            if (label.dataset.wsHint) return;
            label.dataset.wsHint = "1";
            // Forge appends its own "?" link to some labels (VAE / Text Encoder); it is not part of the title
            const text = (label.textContent || "").trim().replace(/\?$/, "").trim();
            const scope = label.closest(CN_SCOPE) && CN_HINTS[text] ? "cn" : HINTS[text] ? "main" : "";
            if (!scope) return;
            const badge = makeBadge(text, scope);
            const link = label.querySelector("a");
            if (label.classList.contains("sr-only") || label.classList.contains("hide")) {
                // Hidden title (prompt boxes): float the badge inside the field instead of adding an empty row
                badge.classList.add("ws-hint-float");
                label.parentElement.appendChild(badge);
            } else if (link) {
                label.insertBefore(badge, link);
            } else if (label.parentElement.classList.contains("label-wrap")) {
                // Accordion titles: glue the badge to the title text, before extras such as ControlNet's hidden unit badge
                const textNode = [...label.childNodes].reverse().find((n) => n.nodeType === Node.TEXT_NODE && n.textContent.trim());
                if (textNode) textNode.after(badge);
                else label.appendChild(badge);
            } else {
                label.after(badge);
            }
        });

        // Radio options and checkboxes inside ControlNet: badge goes inside the <label>, after its text
        root.querySelectorAll(`${CN_SCOPE} .gradio-radio label > span, ${CN_SCOPE} .gradio-checkbox label > span`).forEach((span) => {
            if (span.dataset.wsHint) return;
            span.dataset.wsHint = "1";
            const text = (span.textContent || "").trim();
            const scope = CN_OPTION_HINTS[text] ? "option" : CN_HINTS[text] ? "cn" : "";
            if (scope) span.after(makeBadge(text, scope));
        });
    }

    const TABLES = { main: HINTS, cn: CN_HINTS, option: CN_OPTION_HINTS };

    // Text is looked up when shown, so a language change needs no re-render.
    // Other features can replace the content for a key through wsUI.hintHtml[key]().
    document.addEventListener("mouseover", (e) => {
        const badge = e.target.closest && e.target.closest(".ws-hint");
        if (!badge) return;
        const { key, scope } = badge.dataset;
        const custom = wsUI.hintHtml[key] && wsUI.hintHtml[key]();
        const text = wsUI.tr(TABLES[scope] && TABLES[scope][key]);
        wsUI.showTip(custom || `<div class="ws-tip-text">${wsUI.esc(text)}</div>`, badge, "below");
    });
    wsUI.hideTipOnLeave(".ws-hint");

    // A badge inside a <label> must not toggle its checkbox / accordion
    document.addEventListener(
        "click",
        (e) => {
            if (e.target.closest && e.target.closest(".ws-hint")) {
                e.preventDefault();
                e.stopPropagation();
            }
        },
        true,
    );

    onUiLoaded(() => addHints(gradioApp()));
    wsUI.onUpdate(addHints);
})();
