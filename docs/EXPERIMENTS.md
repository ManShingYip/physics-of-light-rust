# 實驗紀錄（EXPERIMENTS）

模板：日期／環境／公式／签名／現實對照／結論／截圖。

## E1 — 2026-10-11 雙縫干涉（scene5）
公式：wave / born｜签名：peaks=5, hist_corr=0.87｜現實：Young 1801 條紋｜結論：PASS｜截圖：unity4.png

## E2 — 2026-10-11 微粒說重演（scene5/1/3）
公式：corpuscular（無力彈道＋mask 吸收）｜签名：peaks<3、無中凹｜現實：歷史否證｜結論：三關全 fail，重現 1801 年判決｜截圖：unity4.png

## E3 — 2026-10-11 導引律雙縫（開放項）
公式：guidance（∇phase 速度 steering 0.2 blend）／hforce（guid+grav0.3+bnd）｜签名：peaks<3｜結論：FAIL——toy Bohm 缺量子勢項或 steering 未調好；**開放研究項**，唔銷毀紀錄｜截圖：unity4.png

## E4 — 2026-10-11 棱鏡彎折（開放項）
公式：wave/born @ n=2.2 傍軸 phase kick｜签名：centroid shift <0.02｜結論：FAIL——傍軸近似彎折太弱；需全 Helmholtz 或更厚楔｜開放項

## E5 — 2026-10-11 維度階梯
環境：D=1..4 同脈衝｜观察：D=2 面板尾跡模糊、D=3 面板波前鋭利｜現實：強 Huygens 只喺奇數維≥3｜結論：PASS（定性）｜截圖：all2.png

## E6 — 2026-10-11 密封牆隧穿
環境：全封牆＋300 步｜观察：牆後 E>1e-6（吸收率 0.55/step 唔完美）｜結論：吸收牆=近似黑體，有數值隧穿；selftest 真空改以 t=0 未演化場定義｜紀錄保留

## E7 — 2026-10-11 透鏡焦散（scene11）
環境：n=1.6 圓盤＋180 幾何 ray｜观察：介質壓縮格可見；ray 彎折包絡（焦散）偏淡｜結論：PASS（顯示）/POLISH（焦散對比）｜截圖：fix2.png

## E8 — 2026-10-11 WebGPU storage limit 事件
環境：binding 數達 9｜观察：fragment stage 預設 maxStorageBuffersPerShaderStage=8 → pipeline invalid → 全黑｜結論：requestDevice 須 requiredLimits=16；工程教訓：**buffer 數入契約審查清單**｜已修

## E9 — 2026-10-11 Bohm 全速度 steering 再試（E3 跟進）
公式：guidance 全速度覆蓋（無其他力時 mixw=1）｜签名：unity scene5 guidance 仍 fail｜結論：toy Bohm 缺量子勢／相位渦旋處理，**維持開放**｜截圖：unity5.png
