# STEP-M-S3：環境網格批次 runner＋統一矩陣 M-unity
依賴：M3, M-S2｜預估：大｜卡：S-GRID, S-UNITY｜契約：sig_cache（v3 請求）

## 0 目標
離線 batch 跑 (候選公式 × 環境網格)，統一矩陣一頁裁決；一列全綠＝統一公式。
完成圖：表格——行=14 關×維度變體、列=01/02/05/06/H；格內縮圖+✓✗；05 列近全綠、01 列頭兩綠、H 列部分綠；改 K 滑桿全矩陣同動。

## 1 前置
- M3（signature）＋M-S2（維度環境）完成。
- 現實簽名表 `src/data/real_sigs.json` 齊 14 關（文獻來源標註欄）。
- 誠實規則 SCENES §6.2：只准全局常數 fitting。

## 2 實作步驟
1. `src-rs/src/formula.rs`（新）：`trait Formula { fn run(&self, env:&Env)->Signature }`；
   impl：Corpuscular(01)、Wave(02)、Born(05)、Guidance(06)、HForce(K)（讀 Registry）。
2. `src-rs/src/grid.rs`：`fn batch(formulas, envs)->Vec<SigCell>`；快取鍵=(formula_ver, env_hash, globals_hash)。
3. `lib.rs`：`run_grid(json_spec) -> json_result`（一次性呼叫，進度回調）。
4. `main.ts`：M-unity 視圖（DOM table＋每格 mini-canvas 畫直方圖縮圖）；
   格點擊→展開該 (formula,env) 即時互動場景。
5. UI：K 全局滑桿組（改→重跑受影響列，顯示「全矩陣同動」）。

## 3 契約影響
請求 v3：sig_cache JSON schema＋real_sigs.json schema 入 02 附錄。

## 4 驗證
03 四步＋unit：抽 3 格重跑 signature 一致；快取命中時唔重算（計數器）。

## 5 驗收
- 04 行 S-GRID/S-UNITY 轉 ✓。
- 矩陣顯示：01 列綠行={1,2}；05 列綠≥12/14；H 列數字如實。
- 全綠列判定函數 unit：構造假資料驗 all_green。

## 6 回滚/隔離
M-unity 為獨立路由/鍵開關；唔影響主畫面。
完成紀錄：—
