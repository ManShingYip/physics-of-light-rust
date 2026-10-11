# 02 架構視圖（A 級交付）— 契約版本 v2
<!-- changelog: v2 (M-S1): bindings 4/5 n_grid/mask_grid 生效；牆體幾何改由 mask_grid 提供（I8）。 -->

## 1. 層與邊界
```
┌─────────────────────────────────────────────┐
│ L4 UI (HTML/TS controls)   只產參數事件      │
├─────────────────────────────────────────────┤
│ L3 Bridge (TS main.ts)     記憶體視圖/上傳/RAF│
├─────────────────────────────────────────────┤
│ L2 Render (WGSL)           純函數: buffers→像素│
├─────────────────────────────────────────────┤
│ L1 Backend (Rust/Wasm)     狀態+隨機性唯一持有者│
└─────────────────────────────────────────────┘
資料流：L1 →(memory view)→ L3 →(writeBuffer)→ L2 → 螢幕
事件流：L4 →(params)→ L3 →(call)→ L1
禁止：L2 讀 L1 記憶體；L4 直接碰 buffer；L1 碰 DOM。
```

## 2. Buffer 契約（byte 級）
| Buffer | 佈局 | 大小 | usage | 寫者 | 讀者 |
|---|---|---|---|---|---|
| uniform | 12×f32：obs_x, obs_w, dot_r, num_commits(u32), fw(u32), fh(u32), time, pad, barrier, y1, y2, hist_on | 48B | UNIFORM\|COPY_DST | L3 | L2 |
| commits | {x,y,t,pad}×256 | 4096B | STORAGE\|COPY_DST | L3(view of L1) | L2 |
| field_real / field_imag | f32×(w·h) | 36864B@96² | STORAGE\|COPY_DST | L3(view of L1) | L2 |
| trails `M1` | {x,y,hue,age}×1024 | 16384B | STORAGE\|COPY_DST | L3 | L2 |
| force_grid `M2` | 48²×(n_ch+1)×2 f32 | — | STORAGE\|COPY_DST | L3 | L2 |
| n_grid ✓v2 | f32×48² 折射率場 | 9216B | STORAGE\|COPY_DST | L3 | L2 |
| mask_grid ✓v2 | f32×48² 障礙遮罩 | 9216B | STORAGE\|COPY_DST | L3 | L2 |
對齊規則：所有 struct 16-byte；陣列元素步長=16B（commits/trails）。

## 3. 介面契約（簽名級，無本體）
```
L1: WaveEngine::new(w,h) / step(dt) / init_double_slit(b,y1,y2,k)
    sample_commits(x,n,seed) / commits_ptr|len / real_ptr|len / imag_ptr|len
    [M1] spawn(n) / step_force(dt) / trails_ptr|len / set_weight(i,w)
L3: readF32(ptr,len) / uploadCommits() / uploadField() / writeUniform(obsX)
L2: vs_main / fs_main（唯讀 bindings 0..3）
```
變更任何簽名或佈局 = 契約變更 → README 交接協定 1（版本 +1）。

## 4. 不變量（全系統憲法）
I1 隨機性唯一持有者 = L1（L2/L3 無 RNG）。
I2 L2 無狀態：同 buffers 必同像素。
I3 真空列（E<1e-6）⇒ 不產 commit。
I4 一切 buffer 有編譯期/常數上限（256/1024/48²）。
I5 C∈[0,1] 且對 x 單調；alpha≡1。
I6 同 seed 全鏈可重現（L1 決定論＋L3 無隨機）。
I7 觀測/commit 唔修改場（測量非侵入，除非 M4 lensing 明示）。
I8 幾何唯一來源 = Scene 描述；求解器與著色器禁止硬編碼縫/牆（雙縫解析解於 M-S1 退役）。

## 5. ADR 紀錄
| # | 決定 | 理由 | 後果 |
|---|---|---|---|
| 1 | Rust+Wasm 做 L1，唔用 JS | 精度/效能/無 GC 抖動 | 需 wasm-pack 工具鏈 |
| 2 | WGSL 而非 GLSL | Compute/Storage 語義貼「後端」隱喻 | 需 WebGPU 瀏覽器 |
| 3 | commits 用記憶體視圖零拷貝+slice | 幀率 | L3 持 try/catch 兜底 |
| 4 | 解析雙縫場而非 FDTD（M0） | 原型速度 | M4 後可換真 solver（契約不變） |
| 5 | uniform 48B 單塊 | 簡化 bind group | 新增參數須留 pad 或升版本 |

## 6. 非目標（明確唔做）
- 唔做相對論修正、唔做真 QED 環圖、唔做多機分散式。
- L2 永遠唔發明事件（無點=0，唔補假點）。
