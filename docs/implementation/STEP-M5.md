# STEP-M5：M-duel 對決＋自訂力律槽＋EXPERIMENTS
依賴：M-S3｜預估：中｜卡：F_X 槽、docs/EXPERIMENTS.md｜契約：無新增

## 0 目標
左 Born 右宇宙分割對決；F_X 自訂公式槽（安全表達式解析）；實驗紀錄制度化。
完成圖：分割線兩側同步跑；自訂槽輸入 `w*exp(-d2/λ)` 即時生效；EXPERIMENTS.md 有新 entry。

## 1 前置
- M-S3 完成（對決即兩 formula 並列之特例）。
- 表達式文法白名單：`+ - * / ^ sin cos exp sqrt abs`、變數 `x y t rx ry w d2`。

## 2 實作步驟
1. `src-rs/src/expr.rs`（新）：recursive descent parser→`Vec<Op>` 直譯器；
   拒絕任何非白名單 token（安全：無 IO/無迴圈）。
2. `force.rs`：`Custom{prog}` impl Force。
3. `main.ts`：duel 模式（雙 viewport 共享 uniforms、左 formula=Born 右=H）；
   自訂槽 input＋parse 錯誤紅字顯示。
4. `docs/EXPERIMENTS.md`（新）：entry 模板：日期/環境/公式/签名/現實對照/結論/截圖檔名。

## 3 契約影響
無。

## 4 驗證
03 四步＋unit：parser 白名單拒絕測試（`;`、`(` 嵌套深度>8、未知變數）。

## 5 驗收
- 04 行 F_X/duel 轉 ✓；SCENES §2 判別邏輯可喺 duel 內執行。
- 手動：自訂公式改參數即時變；EXPERIMENTS 模板填一範例 entry。

## 6 回滚/隔離
duel/自訂槽各自 flag；parser 失敗自動回 Guidance 律並紅字提示。
完成紀錄：—
