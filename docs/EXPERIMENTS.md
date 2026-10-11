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

## E13 — 2026-10-12 邊界=吸收修正（M-SCI1）
變更：unity 粒子跑 boundary 改 kill_in_mask（吸收），guidance 全強度｜结果：**guidance 轉 PASS double-slit**（wave/born/guidance 三表述統一）｜新敗績：guidance@shadow fail（Bohm 流填幾何影）、hforce 全敗（grav w=0.3 污染條紋＝矩陣作污染偵測器）｜截圖：k2.png

## E14 — 2026-10-12 maskg2 索引災難（工程）
症狀：v4 batch 後 frame ~30 wasm trap（unreachable）｜因：net_force 重構時 maskg2 收 field-grid 索引（96/64）但 mask 係 48²｜修：映射 (i*48)/w＋clamp｜教訓：**多網格索引映射入契約審查**；host example unity_dbg 作回歸工具

## E15 — 2026-10-12 色散三通道（M-SCI2）
環境：prism＋disp on（R/G/B n 乘 0.75/1/1.3）｜观察：楔區三色 beating＋出射分離；sig shift=-0.196（偏折可測）｜結論：色散 PASS（顯示）；clean rainbow fan 仍 pending（傍軸彎折弱,E4 延續）｜截圖：k3.png

## E16 — 2026-10-12 統一矩陣 v3（M-SCI1 修正後）
配置：per-env obs（5→0.5, 1/3→0.8）、實驗源強度歸零、boundary=吸收｜结果：
**wave/born 列三關全綠（標準 QM 統一）**；guidance/hforce：雙縫 P、shadow f、prism f；corp 全 f｜
解讀：H programme 現狀＝雙縫統一、影與棱鏡未統一＝**精确嘅開放前沿**｜截圖：k2.png＋host unity_dbg

## E17 — 2026-10-12 S-GLUE 首跑
方法：stride-4 DFT 往返 mismatch｜观察：panel0 紅閃含大量混疊噪聲（stride 取樣誤差＞物理 obstruction）｜結論：機制 PASS、訊號未淨；改進＝full-step DFT 或 windowing｜開放｜截圖：m1.png

## E10 — 2026-10-11 無 GPU fallback 驗證（P3）
環境：?nogpu=1（Rust CPU 光柵化＋putImageData）｜观察：完整雙縫干涉畫面、commits 累積｜結論：PASS——最弱設備仍有全畫面｜截圖：g1.png

## E11 — 2026-10-11 3D raymarch 首跑（M-3D）
環境：dim3 + R0 auto｜观察：波前自左面進入、相機軌道可控；早期幀場未充滿｜結論：PASS（顯示）；焦散/點雲待 polish｜截圖：g3.png

## E12 — 2026-10-11 反演回合（S-REV）
環境：cargo test reverse_roundtrip_2d（閉箱、drive/sponge off）｜结果：err<1e-2 PASS｜結論：leapfrog 反演精確（rev 步用 lap(pre)、next=cur−K·pre）；**開箱（drive/sponge）不可逆＝物理誠實**｜紀錄
