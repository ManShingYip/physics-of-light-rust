# STEP-M3：拖曳力源＋權重互動＋signature 提取
依賴：M2｜預估：中｜卡：S-SIGNATURE｜契約：signature 匯出（v3 請求）

## 0 目標
力源可拖曳、權重即時調；每幀 signature 可提取可匯出 JSON。
完成圖：拖星時尾跡與條紋即時彎；除錯面板顯示 fringe_shift/deflection/hist_corr 數字跳動。

## 1 前置
- M2 完成；卡 S-SIGNATURE（純函數 of state）。
- 04 矩陣 S-SIGNATURE 行。

## 2 實作步驟
1. `lib.rs`：`set_source(i,x,y,m)` 已於 M1；補 `signature() -> [f32;4]`：
   fringe_shift（直方圖峰位移）、deflection（尾跡平均偏角）、hist_corr（與|ψ|²相關）、dominance_seq 壓縮碼。
2. `main.ts`：pointerdown/move 命中力源→drag→`set_source`；
   除錯面板每 30 幀顯示；`export` 鍵下載 JSON（含 K、w、scene、sig）。
3. `wgsl`：力源 sprite 加大命中半徑（視覺回饋）。

## 3 契約影響
請求 v3：signature 匯出格式（JSON schema 入 02 附錄）。

## 4 驗證
03 四步＋unit：signature 純函數（同 state 同輸出）。

## 5 驗收
- 04 行 S-SIGNATURE 轉 ✓。
- 手動：拖星→數字變；匯出 JSON 可讀。

## 6 回滚/隔離
flag `drag_enabled`；off 時力源固定。
完成紀錄：—
