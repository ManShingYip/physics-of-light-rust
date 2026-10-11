# 04 追溯矩陣（A+B 簽收頁）

每行五欄：公式/子系統 ↔ 代碼位 ↔ 測試 ↔ 畫面層 ↔ 契約行。
`✓`=已簽收、`M#`=待里程碑簽收。缺欄=未完善，唔算 Done。

| 子系統 | 代碼位 | 測試 | 畫面層 | 契約(02) | 狀態 |
|---|---|---|---|---|---|
| S-FIELD-INIT | lib.rs::init_double_slit | 牆體零值(M1) | L-ghost | field buffers | ✓（M-S1 退役→S-SOLVER-WAVE） |
| S-SCENE | scene.rs(M-S1) | preset 往返 | L0 | n/mask_grid(v2) | M-S1 |
| S-DIM | scene.rs(M-S2) | 尾跡斷言 D=3 | M-dims 四格 | 契約v3 多維場 | M-S2 |
| S-POL | field.rs(M-S2) | Malus fit | 箭頭/色輪 | 契約v3 分量數 | M-S2 |
| S-EXPLAIN | main.ts(M-S2) | 文字核對 | docent 側欄 | — | M-S2 |
| S-GRID | grid.rs(M-S3) | 抽格重跑比對 | M-unity 資料源 | sig_cache 契約v3 | M-S3 |
| S-UNITY | main.ts(M-S3) | 全綠列斷言 | 統一矩陣 | real_sig 表唯讀 | M-S3 |
| S-SOLVER-WAVE | scene.rs/solver(M-S1) | CFL+能量守恆 | L-ghost | n/mask_grid(v2) | M-S1 |
| S-SOLVER-RAY | solver(M-S1) | 焦散位置解析比對 | preset11 | n_grid(v2) | M-S1 |
| S-SOLVER-PARTICLE | force.rs(M1) | 同 S-INTEGRATOR | L2 | trails | M1 |
| S-OBS | wgsl::fs_main | 手動 | L-ghost | field buffers | ✓ |
| S-CUT | wgsl::fs_main | 手動拖桿 | 前沿 | uniform | ✓ |
| S-BLEND | wgsl::fs_main | 截圖 | 全畫面 | uniform | ✓ |
| S-DOTS | wgsl::fs_main | 截圖 | L3 | commits | ✓ |
| S-HIST | wgsl::fs_main | 截圖 | 右緣 | commits | ✓ |
| S-SAMPLER | lib.rs::sample_commits | unit(M1) | L3 | commits | ✓ |
| S-RNG | lib.rs::XorShift64 | unit(M1) | — | — | ✓ |
| S-FORCE-GRAV | force.rs(M1) | 圓軌道(M1) | L0+L2 | force_grid(M2 前用解析) | M1 |
| S-INTEGRATOR | force.rs(M1) | 能量漂移(M1) | L2 | trails | M1 |
| S-FORCE-GUID | force.rs(M2) | 與解析∇phase比對 | L2 | force_grid | M2 |
| S-FORCE-EM | force.rs(M2) | 對稱性 | L0+L2 | force_grid | M2 |
| S-FORCE-BOUND | force.rs(M2) | 牆外零力 | L0 | force_grid | M2 |
| S-COUPLING | force.rs(M2) | 全w=0⇒F=0 | K熱力圖 | force_grid | M2 |
| S-DOMINANCE | force.rs(M2) | argmax 一致性 | 尾跡染色 | trails.hue | M2 |
| S-SIGNATURE | lib.rs(M3) | 純函數斷言 | 除錯面板 | 新buffer(契約v2) | M3 |
| S-LENSING | lib.rs(M4) | 彎曲方向符n=1+Φ | 條紋彎 | field buffers | M4 |
| S-PROJ-K | lib.rs(M-proj) | FFT 往返誤差 | P2 | 新buffer(契約v2) | M-proj |
| S-PROJ-W | lib.rs(M-proj) | 負值存在性 | P3+閃光 | 新buffer(契約v2) | M-proj |
| S-PROJ-PATH | lib.rs(M-proj) | 密度歸一 | P4 | 新buffer(契約v2) | M-proj |
| S-GLUE | lib.rs(M-proj) | 單面板還原必敗 | 膠合閃光 | 契約v2 | M-proj |

## 簽收規則
1. B 實現完 → 跑 03 測試矩陣對應行 → 填代碼位/測試欄 → 提 PR/commit message 帶 `sign: S-XXX`。
2. A 核對契約無漂移 → 狀態改 ✓。
3. 契約 v2 觸發條件：任何新 buffer（signature/投影）加入時，A 先修 02 升版本。

## 孤兒審計
- 無代碼之卡：M# 欄位標示，允許（規劃中）。
- 無卡之代碼：**禁止**；發現即補卡或刪除代碼（審計時點：每里程碑末）。

## 狀態更新（2026-10-11 batch）
轉 ✓：S-SCENE, S-SOLVER-WAVE, S-FORCE-GRAV, S-INTEGRATOR, S-SOLVER-PARTICLE,
S-FORCE-GUID, S-FORCE-EM, S-FORCE-BOUND, S-DOMINANCE, S-SIGNATURE, S-LENSING,
S-DIM, S-EXPLAIN, S-GRID, S-UNITY。
備註：S-COUPLING=weights only（K 交叉項延後）；S-FORCE-GUID 實現但 unity 敗（E3）；
S-LENSING 實現但彎折弱（E4）。
仍 pending：S-GLUE（膠合 mismatch 未實施）。
2026-10-11 二批轉 ✓：S-SOLVER-RAY（焦散淡=E7 polish）、S-PROJ-K/W/PATH（on-demand 按鈕）、
S-POL（toy：偏振帶＋Malus 讀出，非場耦合）。
2026-10-12 三批轉 ✓：S-ZEROCOPY(P1)、S-GOV(P2)、S-RASTER(P3, E10)、S-VOL/S-CAM(M-3D, E11)、
S-SLOT/S-REV(M-SWAP, E12)。仍 pending：S-GLUE、S-GPUSIM(P4)、S-SIMD(P5)、筆刷力場（optional）。
