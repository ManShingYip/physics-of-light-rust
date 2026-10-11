# 01 公式→子系統分解（A 級交付）

模板：每卡 = 公式／層／入／出／契約／不變量／失效模式／測試／代碼位／畫面層。
狀態：`✓`=已實現、`M#`=里程碑。

---

### S-FIELD-INIT ✓（**特例**：S-SOLVER-WAVE 喺雙縫場景嘅解析解；M-S1 後由 solver 取代）
公式：雙縫 Huygens 和：牆左 `ψ=e^{iku}`；牆右 `ψ=Σ_j a_j e^{ik r_j}/√(r_j/0.2+1)`；牆體=0（縫口除外）
層：backend｜入：barrier_u, y1, y2, k｜出：real[], imag[] (w×h f32)
契約：pre `0≤barrier≤1, 5≤k≤400`；post 陣列長度=w×h、有限值
不變量：牆體非縫口處 |ψ|=0 嚴格
失效：k 過大→混疊（視覺鋸齒）｜測試：牆體零值斷言｜代碼：`src-rs/src/lib.rs::init_double_slit`｜畫面：L-ghost

### S-OBS ✓
公式：`ρ=re²+im²`、`θ=atan2(im,re)`
層：render｜入：field buffers｜出：每像素標量
契約：ρ≥0｜不變量：ρ=0 ⇒ ghost 色=0｜失效：NaN 場→全黑｜測試：手動｜代碼：`wave_blend.wgsl::fs_main`｜畫面：L-ghost

### S-CUT ✓
公式：`C=smoothstep(x_obs−w/2, x_obs+w/2, x)`，`w=max(w,1e-4)`
層：render｜入：uniform｜出：C∈[0,1]
不變量：C 對 x 單調非遞減｜失效：w=0 退化（已夾）｜代碼：wgsl｜畫面：前沿

### S-BLEND ✓
公式：`rgb=(1−C)·ghost + C·dot`；alpha≡1
層：render｜契約：無點區 dot≡0 ⇒ C=1 區純黑｜不變量：能量唔憑空出現｜畫面：全畫面

### S-DOTS ✓
公式：`dot=Σ_k exp(−(d_k/r)²·3)`，d>2r 截斷
層：render｜契約：num_commits≤256｜失效：點疊加>1 已 clamp｜畫面：L3

### S-HIST ✓
公式：24 bin 計數／10 clamp 成棒長
層：render｜契約：bin 邊界覆蓋 [0,1)｜畫面：右緣

### S-SAMPLER ✓（Born）
公式：CDF 前綴和＋二分＋sub-pixel jitter `y=(idx+0.5+u)/h`
層：backend｜入：x_obs, n, seed｜出：commits 追加
契約：pre 列能量 E≥1e-6（否則 early-exit 不產點）；post commits≤256（drain 舊）
不變量：真空⇒無假點｜失效：E 極小→分佈噪｜測試：CDF 單調、真空、上限（M1 補 unit test）｜代碼：`lib.rs::sample_commits`｜畫面：L3

### S-RNG ✓
公式：XorShift64；`u = (s>>40)/2^24`
契約：seed=0→替換常數｜不變量：同 seed 可重現｜測試：序列確定性

### S-GRID `M-S3`（環境網格批次卡）
公式：batch over (formula × env) → signature 快取
層：backend（離線）｜入：候選公式列表、環境網格｜出：sig_cache[(f,e)]
契約：每格只准全局常數（6.2 誠實規則）；環境參數唯讀自 preset 檔
不變量：同 (f,e,全局參數) 必同 signature（可重現）｜失效：快取陳舊→hash 鍵含公式版本
測試：抽格重跑比對｜代碼：`src-rs/src/grid.rs`｜畫面：M-unity 資料源

### S-UNITY `M-S3`
公式：無（ ledger ）：cell = match(sig, real_signature) → ✓/✗；column_all_green(formula)
層：L3/L4｜契約：real_signature 表唯讀、來源標註（實驗/文獻）｜畫面：統一矩陣＋展開互動

### S-DIM `M-S2`（維度階梯卡）
公式：D 維波動/Huygens 步進，D∈{1,2,3,4}；Green 函數尾跡結構為輸出簽名
層：backend｜入：scene＋D｜出：每 D 一格場
契約：格數預算 512/96²/32³/16⁴；步進同 dt｜不變量：奇數維鋭前、偶數維尾跡（判別關14）
失效：4D 記憶體超支→降 12⁴｜測試：脈衝尾跡斷言（D=3 尾跡能量≈0）｜畫面：M-dims 四格

### S-POL `M-S2`
公式：2-分量向量場 (ψx, ψy)；偏振器＝投影算符 P(θ)；Malus `I∝cos²θ`
層：backend＋render｜契約：標量場景=1 分量退化｜不變量：無偏振元件時強度不變
測試：Malus 曲線 fit｜畫面：取向箭頭/色輪

### S-EXPLAIN `M-S2`
公式：無（純資料）：preset.explain[] → 面板註解＋側欄
層：L4｜契約：註解純文字、無邏輯｜畫面：docent mode

### S-ZEROCOPY `P1`
公式：無；writeBuffer 直接食 wasm memory view（無 slice）；Solver scratch 滅每幀 alloc
契約：view 失效僅於 memory.grow→每幀重建 view 對象（廉價）｜測試：幀 alloc 計數=0（instrument）

### S-GOV `P2`
公式：ema(frame_ms) > 22 → 降階；< 12 持續 3s → 升階；階梯狀態機
層：L3｜契約：perf 燈 DOM＋manual override｜測試：throttle 模擬觸發降階

### S-RASTER `P3`
公式：Rust 側 ρ/phase→RGBA pixel buffer（2D slice 或 3D 中slice）；TS putImageData
契約：pixel buffer ptr/len 導出；無 WebGPU 自動啟用｜測試：無 GPU 環境截圖非黑

### S-GPUSIM `P4 stretch`
公式：WGSL compute ping-pong 波步進；Rust 讀回只 obs 列（mapAsync）
契約：field buffer 改 STORAGE|COPY_SRC；fallback CPU 路不變｜測試：CPU/GPU 路 signature 差<ε

### S-VOL `M-3D1`
公式：raymarch：t 步進、ρ 累積、phase 着色、commit/源發光；步數=品質滑桿
契約：uniform v4 相機(yaw,pitch,dist,pan2)＋品質｜失效：SwiftShader 慢→governor 降 R1/R2

### S-CAM `M-3D1`
公式：orbit 相機→view 矩陣（CPU 算，uniform 上傳）｜契約：拖曳/滾輪/shift-pan 事件→參數

### S-SLOT `M-SWAP`
公式：slot[i].law ∈ enum；swap(i,j) 交換 law；權重留槽
契約：配置 JSON schema（sources/slots/weights/globals）存讀 round-trip｜測試：swap 不變性

### S-REV `M-3D2`
公式：leapfrog 反演=pre↔cur 交換；粒子 v→−v；尾跡倒放
契約：反演回合測試 step N→rev→step N ε 內｜測試：ε<1e-3

### S-SCENE `M-S1`（主軸卡）
公式：無單一式；Scene = {emitters, n(x,y,λ), mask(x,y), forces, detectors} 之組合描述
層：backend｜入：preset JSON/參數｜出：n-grid、mask-grid、源列表
契約：mask∈{0,1}、n>0、幾何**只**來自 scene（求解器無硬編碼縫）
不變量：I8 場景描述係幾何唯一來源｜失效：n≤0 區域→clamp＋警告徽章
測試：preset 往返（載入→導出→相等）｜代碼：`src-rs/src/scene.rs`｜畫面：L0

### S-SOLVER-WAVE `M-S1`
公式：Huygens 步進 over n(x)：`ψ' = Σ neighbours ψ·k(n)`；M0 解析解為其特例
契約：CFL 穩定條件 dt≤dx/(c·n_max)｜不變量：能量守恆誤差<ε
失效：n 跳變→數值反射（記錄為特徵而非 bug）｜畫面：L-ghost

### S-SOLVER-RAY `M-S1`
公式：幾何光學：dn 梯度彎 ray（eikonal）＋焦散累積
契約：ray 數上限 4096｜畫面：preset 11 焦散

### S-SOLVER-PARTICLE `M1`
公式：力驅動積分（S-INTEGRATOR）於 scene forces 下
契約：同 S-INTEGRATOR｜畫面：L2

### S-FORCE-GUID `M2`
公式：`v ∝ ∇phase(ψ)`（有限差分）
契約：|v|≤v_max｜失效：相位渦旋點→∇爆（軟核 ε）｜畫面：L2 尾跡

### S-FORCE-GRAV `M1`
公式：`F = −G m (p−s)/(|p−s|²+ε²)^{3/2}`
契約：軟核 ε>0｜不變量：能量有界｜畫面：L0 星暈＋L2 彎跡

### S-FORCE-EM `M2`
公式：Coulomb 同型，電荷符號可負｜畫面：L0 光環

### S-FORCE-BOUND `M2`
公式：牆短程排斥 `F ∝ exp(−d/λ)` 法向｜畫面：L0 牆

### S-COUPLING `M2`
公式：`F_net = Σ_i w_i F_i + Σ_ij k_ij mix(F_i,F_j)`
契約：K 對稱、|k|≤1｜不變量：全 w=0 ⇒ F_net=0｜畫面：K 熱力圖

### S-INTEGRATOR `M1`
公式：半隱式歐拉 `v+=F dt; x+=v dt`；|v| clamp
契約：dt≤0.033｜失效：dt 過大→軌跡爆（clamp 兜底）｜測試：圓軌道能量漂移<ε

### S-DOMINANCE `M2`
公式：`argmax_i |w_i F_i|` 每步記錄｜畫面：尾跡通道染色

### S-LENSING `M4`
公式：`n(x)=1+Φ_G(x)` 修改波場相位累積｜契約：n>0｜畫面：條紋彎曲

### S-PROJ-K `M-proj`
公式：`ψ̂=FFT(ψ)`、顯示 |ψ̂|²｜契約：尺寸 2 冪或 naive｜畫面：P2 面板＋失效徽章 Δx

### S-PROJ-W `M-proj`
公式：Wigner slice `W(x,p)=∫ ψ*(x+y/2)ψ(x−y/2)e^{ipy}dy`｜失效展示：負值區閃光｜畫面：P3

### S-PROJ-PATH `M-proj`
公式：Monte Carlo 路徑密度熱圖｜畫面：P4

### S-SIGNATURE `M3`
公式：`(fringe_shift, deflection, hist_corr, dominance_seq)` 每幀提取
契約：純函數 of state｜用途：反推循環輸入｜畫面：除錯面板/匯出

### S-GLUE `M-proj`
公式：還原 mismatch `‖ψ_recon−ψ‖`、obstruction hotspots｜契約：ε 閾值可調｜畫面：膠合面板閃光

---
孤兒檢查：research 01–12 出現之公式已全部領卡；新公式須先領卡後實現（交接協定 3）。
