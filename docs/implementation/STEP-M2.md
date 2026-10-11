# STEP-M2：多力疊加＋dominance 染色
依賴：M1｜預估：中｜卡：S-FORCE-GUID/EM/BOUND, S-COUPLING, S-DOMINANCE｜契約：force_grid（v2 請求）

## 0 目標
力族登記表上場：導引/重力/電磁/邊界四力疊加；尾跡按主導力染色。
完成圖：一條尾跡青→橙→品紅分段；K 全零時退化為單力行為。

## 1 前置
- M1 完成；卡 S-COUPLING 契約（K 對稱、|k|≤1）。
- force_grid 48²×(n_ch+1)×2 f32。

## 2 實作步驟
1. `force.rs`：`trait Force { fn field(&self,pos,t,ctx)->[f32;2]; fn hue()->[f32;3] }`；
   impl Guidance（∇phase 有限差分＋渦旋軟核）、Coulomb、Boundary（exp 短程）。
2. `force.rs`：`struct Registry{w:[f32;4], on:[bool;4], k:[[f32;4];4]}`；
   `net_force = Σ w_i F_i + Σ k_ij mix`；dominance=argmax 寫入 trail hue。
3. `lib.rs`：`set_weight(i,w)`、`set_k(i,j,v)`、`force_grid_ptr/len`。
4. `main.ts`：力開關 checkbox×4＋權重滑桿×4；upload force_grid。
5. `wgsl`：binding 7 = force_grid；L1 箭頭層（每力色相＋淨力白）。

## 3 契約影響
請求 v2：binding 7 force_grid 行確認尺寸。

## 4 驗證
03 四步＋unit：全 w=0 ⇒ F_net=0；K 對稱性斷言。

## 5 驗收
- 04 行 S-FORCE-*/S-COUPLING/S-DOMINANCE 轉 ✓。
- 截圖：多色尾跡；單力開關逐個切換行為符卡。

## 6 回滚/隔離
flag `multiforce_enabled`；off 時僅重力（M1 狀態）。
完成紀錄：—
