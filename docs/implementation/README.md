# 實施步驟計劃（Implementation Steps）

地位：**真正落代碼嘅文件夹**。每里程碑一份 STEP 檔，全部跟統一模板。
上游：`docs/PROJECT_PLAN.md`（點解）、`docs/SCENES.md`（做乜）、
`docs/engineering/`（契約與卡）、`docs/research/`（判據）。

## 0. 統一模板（所有 STEP 檔必須齊七節，缺節唔開工）
```
# STEP-<ID>：<名>
依賴 / 預估 / 對應卡與契約行
## 0 目標        一句話＋畫面完成圖（文字描述）
## 1 前置        卡(01)／契約行(02)／先前 STEP／現實簽名來源
## 2 實作步驟    編號：檔案 → 改乜 → 簽名（無本體代碼，只有介面）
## 3 契約影響    無 / vN bump：邊行 buffer 或簽名
## 4 驗證        03 runbook 命令原樣 copy＋本步附加檢查
## 5 驗收        04 矩陣行轉 ✓ 之條件＋SCENES 關＋截圖核對清單
## 6 回滚/隔離   feature flag 或 branch 策略；失敗時畫面降級行為
```

## 1. 依賴圖
```
M-S1 場景系統 ─┬→ M1 粒子+重力 ─→ M2 多力+dominance ─→ M3 拖曳+signature ─
              ├→ M-S2 維度+偏振+docent ─────────────────────────────────┼→ M-S3 統一矩陣
              └→ (preset 擴充，純資料)                                    │
M2 ─→ M4 lensing                                                        │
全部 ─→ M5 duel+自訂槽+EXPERIMENTS                                       ←┘
```

## 2. 規則
1. 一 STEP = 一條 commit 鏈；commit message 帶 `step: <ID>`＋簽收卡號 `sign: S-XXX`。
2. 驗證只准 03 runbook 命令（bounded：完即停，唔起長駐 server）。
3. 契約 bump 只可由 A 級發起（engineering README 交接協定）；STEP 內「契約影響」節填 bump 請求而非直接改 02。
4. 每 STEP 完成後更新 04 矩陣狀態欄，並喺本檔尾加「完成紀錄」（日期/commit hash/截圖檔名）。
5. 失敗處理：STEP 內驗收不過＝freeze 該 flag，畫面降級回上一 STEP 狀態，絕唔留半壞狀態上線。

## 3. 索引
| 檔 | 里程碑 | 一句目標 |
|---|---|---|
| STEP-M-S1.md | M-S1 | 場景系統：preset 1/3/5 可切換 |
| STEP-M1.md | M1 | 粒子受力飛行＋尾跡可見 |
| STEP-M2.md | M2 | 多力疊加＋dominance 染色 |
| STEP-M-S2.md | M-S2 | 維度階梯＋偏振＋docent |
| STEP-M3.md | M3 | 拖曳力源＋權重＋signature 提取 |
| STEP-M4.md | M4 | 重力 lensing 波場（力—力交互） |
| STEP-M-S3.md | M-S3 | 環境網格批次＋統一矩陣 |
| STEP-M5.md | M5 | duel＋自訂力律槽＋EXPERIMENTS |

## 4. 完成紀錄（2026-10-11，batch completion）
| STEP | 狀態 | 證據 | 備註 |
|---|---|---|---|
| M-S1 | 完成 | sc1/sc3/m1 截圖；dump.png | prism 彎折弱→E4 開放項 |
| M1 | 完成 | m1.png（青色尾跡穿縫） | — |
| M2 | 完成 | all1.png（箭頭層＋青/橙 dominance） | K 交叉項延後（weights only） |
| M-S2 | 部分 | all2.png（D1-4 階梯＋docent） | S-POL 未實施→開放項 |
| M3 | 完成 | sig 行 peaks=5 corr=0.87；export 鍵 | 拖曳已接 pointer events |
| M4 | 完成 | lensing checkbox；E4 記錄彎折弱 | — |
| M-S3 | 完成 | unity4.png 矩陣 | guidance/hforce 敗=E3 開放項 |
| M5 | 完成 | duel checkbox＋expr slot＋EXPERIMENTS.md | parser 白名單 6 tests |
