# STEP-M-S1：場景系統（Scene + solver + preset 1/3/5）
依賴：無｜預估：中｜卡：S-SCENE, S-SOLVER-WAVE, S-SOLVER-RAY｜契約：n_grid/mask_grid（v2 請求）

## 0 目標
場景成為一等公民；下拉選 shadow/prism/doubleslit 三 preset，畫面即時換幾何與場。
完成圖：左 UI 多咗 scene 下拉；選 prism 時見到色散扇形；選 shadow 時見到銳影＋邊緣衍射。

## 1 前置
- 卡 S-SCENE/S-SOLVER-WAVE 已領（01）。
- 契約 02 v2 行：n_grid、mask_grid（48² f32）。
- 現實簽名：preset 3 色散角序（文獻值入 `src/data/real_sigs.json` 開檔）。

## 2 實作步驟
1. `src-rs/src/scene.rs`：`struct Scene { n: Vec<f32>, mask: Vec<f32>, emitters: Vec<Emitter> }`；
   `fn preset(id: u32, params) -> Scene`（id 1=shadow, 3=prism, 5=doubleslit）。
2. `src-rs/src/solver.rs`：`fn wave_step(psi_re, psi_im, scene, dt)` Huygens/FDTD over n；
   CFL guard `dt <= dx/(c*n_max)`。
3. `lib.rs`：engine 持 `scene`；`set_scene(id)`；`step()` 改調 solver；
   `n_ptr/n_len/mask_ptr/mask_len` 導出；`init_double_slit` 標 `#[deprecated]` 保留至驗收。
4. `main.ts`：scene 下拉事件→`set_scene`→uploadField+upload n/mask；
   新增 `uploadGrids()`。
5. `wave_blend.wgsl`：bindings 4/5 = n_grid/mask_grid；牆體改讀 mask（取代 uniform 幾何）。

## 3 契約影響
請求 v2 bump：bindings 4/5（n_grid, mask_grid, 48² f32, STORAGE|COPY_DST）。

## 4 驗證
03 runbook 四步＋附加：console 無 wgsl error；三 preset 各截一張圖。

## 5 驗收
- 04 矩陣 S-SCENE/S-SOLVER-WAVE 行轉 ✓。
- SCENES 關 1/3/5 畫面符描述（影銳、色散扇、條紋）。
- 牆體零值斷言（mask=1 非縫口 |ψ|≈0）。

## 6 回滚/隔離
flag `scene_enabled`（TS 常數）；off 時回旧 init_double_slit 路徑。
完成紀錄：—
