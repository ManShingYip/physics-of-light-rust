# STEP-M4：重力 lensing 波場（力—力交互）
依賴：M2｜預估：中｜卡：S-LENSING｜契約：無新增（n_grid 已 v2）

## 0 目標
重力井修改波場折射率 n=1+Φ，干涉紋隨星移動而彎——力與力交互，唔止疊加。
完成圖：拖星過雙縫右側，條紋整體彎向星；關 lensing 回直紋。

## 1 前置
- M2 完成；n_grid 契約行。
- 現實簽名：偏折角 2×Newton（Eddington 1919，real_sigs.json）。

## 2 實作步驟
1. `solver.rs`：`fn apply_lensing(n, sources)`：`n[x] = 1 + Σ Φ_G`（軟核）。
2. `lib.rs`：`lensing_enabled` flag；step 時先 apply 再 wave_step。
3. `main.ts`：lensing checkbox；拖星時重算 n_grid 並 upload。
4. `wgsl`：無改（n_grid 已讀）。

## 3 契約影響
無。

## 4 驗證
03 四步＋unit：彎曲方向符 −∇Φ；關 flag 時 n≡1。

## 5 驗收
- 04 行 S-LENSING 轉 ✓；SCENES 關 10 過（偏折量級符 toy 縮放）。
- 截圖前後對比。

## 6 回滚/隔離
flag `lensing_enabled`（本步核心即 flag）。
完成紀錄：—
