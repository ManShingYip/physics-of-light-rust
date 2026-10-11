# STEP-M1：粒子受力飛行＋尾跡
依賴：M-S1｜預估：中｜卡：S-FORCE-GRAV, S-INTEGRATOR, S-SOLVER-PARTICLE｜契約：trails（v1 已列）

## 0 目標
光子作為真粒子 spawn、受重力井拗彎、留漸隱尾跡。
完成圖：星暈旁一批彎曲尾跡掃過，雙縫場景下尾跡穿縫後散開。

## 1 前置
- 卡 S-FORCE-GRAV/S-INTEGRATOR；契約 trails buffer（{x,y,hue,age}×1024, 16B）。
- 圓軌道能量漂移測試規格（03 測試矩陣）。

## 2 實作步驟
1. `src-rs/src/force.rs`：`struct Particle{pos,vel,alive}`；`struct Gravity{sources}`；
   `fn accel(...)` 軟核 `(|d|²+ε²)^{3/2}`；`fn integrate(p, F, dt)` 半隱式＋|v| clamp。
2. `lib.rs`：`spawn(n, seed)`、`step_force(dt)`、`trails_ptr/trails_len`、`set_source(i,x,y,m)`。
3. `main.ts`：trails buffer 建立＋每幀 upload；spawn 滑桿。
4. `wgsl`：binding 6 = trails；L2 層：點sprite、age→alpha 漸隱、hue 暫灰。

## 3 契約影響
無新增（trails 已喺 v1 表）；binding index 6 確認。

## 4 驗證
03 四步＋`cargo test`（圓軌道漂移<ε、同 seed 重現）。

## 5 驗收
- 04 行 S-FORCE-GRAV/S-INTEGRATOR/S-SOLVER-PARTICLE 轉 ✓。
- 截圖：尾跡彎曲方向符重力井位置；關重力→直線。

## 6 回滚/隔離
flag `particles_enabled`；off 時純波場模式（M0 畫面）。
完成紀錄：—
