# STEP-M-S2：維度階梯＋偏振＋docent 解說層
依賴：M-S1｜預估：大｜卡：S-DIM, S-POL, S-EXPLAIN｜契約：v3 請求（多維場、分量數）

## 0 目標
D=1..4 同脈衝並排跑，尾跡差異可見；偏振箭頭層；docent 側欄預設開。
完成圖：四格階梯——D=3 格波前鋭利無尾、其餘留尾；側欄寫住「奇數維強 Huygens」。

## 1 前置
- 卡 S-DIM/S-POL/S-EXPLAIN；格數預算 512/96²/32³/16⁴。
- 現實簽名：Malus cos²θ、Rayleigh λ⁻⁴（real_sigs.json）。

## 2 實作步驟
1. `scene.rs`：`dim: u32` 參數；`fn alloc_grid(dim)->Vec<f32>` 按預算。
2. `solver.rs`：泛維 neighbor 步進（index stride 表）；脈衝 emitter。
3. `field.rs`（新）：2-分量 (ψx,ψy)；偏振器 `P(θ)` 投影算符作用於 mask 區。
4. `lib.rs`：`set_dim(d)`、每維場 ptr/len、`pol_angle` 參數。
5. `main.ts`：M-dims 模式（四 viewport 拼貼）＋docent 側欄（讀 preset.explain[]）。
6. `wgsl`：viewport uniform（offset/scale）；偏振取向箭頭疊加；4D 格用 slice 網格拼貼。

## 3 契約影響
請求 v3：多維場 buffer 表＋分量數欄＋viewport uniform 擴充。

## 4 驗證
03 四步＋unit：D=3 脈衝尾跡能量≈0、D=2 >0；Malus fit 誤差<2%。

## 5 驗收
- 04 行 S-DIM/S-POL/S-EXPLAIN 轉 ✓；SCENES 關 7/8/14 過。
- 截圖：四格尾跡對比＋側欄文字正確顯示。

## 6 回滚/隔離
flag `dims_ladder_enabled`；off 時單一 D=2（現狀）。
完成紀錄：—
