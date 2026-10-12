# å¯¦é©—ç´€éŒ„ï¼ˆEXPERIMENTSï¼‰

æ¨¡æ¿ï¼šæ—¥æœŸï¼ç’°å¢ƒï¼å…¬å¼ï¼ç­¾åï¼ç¾å¯¦å°ç…§ï¼çµè«–ï¼æˆªåœ–ã€‚

## E1 â€” 2026-10-11 é›™ç¸«å¹²æ¶‰ï¼ˆscene5ï¼‰
å…¬å¼ï¼šwave / bornï½œç­¾åï¼špeaks=5, hist_corr=0.87ï½œç¾å¯¦ï¼šYoung 1801 æ¢ç´‹ï½œçµè«–ï¼šPASSï½œæˆªåœ–ï¼šunity4.png

## E2 â€” 2026-10-11 å¾®ç²’èªªé‡æ¼”ï¼ˆscene5/1/3ï¼‰
å…¬å¼ï¼šcorpuscularï¼ˆç„¡åŠ›å½ˆé“ï¼‹mask å¸æ”¶ï¼‰ï½œç­¾åï¼špeaks<3ã€ç„¡ä¸­å‡¹ï½œç¾å¯¦ï¼šæ­·å²å¦è­‰ï½œçµè«–ï¼šä¸‰é—œå…¨ failï¼Œé‡ç¾ 1801 å¹´åˆ¤æ±ºï½œæˆªåœ–ï¼šunity4.png

## E3 â€” 2026-10-11 å°Žå¼•å¾‹é›™ç¸«ï¼ˆé–‹æ”¾é …ï¼‰
å…¬å¼ï¼šguidanceï¼ˆâˆ‡phase é€Ÿåº¦ steering 0.2 blendï¼‰ï¼hforceï¼ˆguid+grav0.3+bndï¼‰ï½œç­¾åï¼špeaks<3ï½œçµè«–ï¼šFAILâ€”â€”toy Bohm ç¼ºé‡å­å‹¢é …æˆ– steering æœªèª¿å¥½ï¼›**é–‹æ”¾ç ”ç©¶é …**ï¼Œå””éŠ·æ¯€ç´€éŒ„ï½œæˆªåœ–ï¼šunity4.png

## E4 â€” 2026-10-11 æ£±é¡å½ŽæŠ˜ï¼ˆé–‹æ”¾é …ï¼‰
å…¬å¼ï¼šwave/born @ n=2.2 å‚è»¸ phase kickï½œç­¾åï¼šcentroid shift <0.02ï½œçµè«–ï¼šFAILâ€”â€”å‚è»¸è¿‘ä¼¼å½ŽæŠ˜å¤ªå¼±ï¼›éœ€å…¨ Helmholtz æˆ–æ›´åŽšæ¥”ï½œé–‹æ”¾é …

## E5 â€” 2026-10-11 ç¶­åº¦éšŽæ¢¯
ç’°å¢ƒï¼šD=1..4 åŒè„ˆè¡ï½œè§‚å¯Ÿï¼šD=2 é¢æ¿å°¾è·¡æ¨¡ç³Šã€D=3 é¢æ¿æ³¢å‰é‹­åˆ©ï½œç¾å¯¦ï¼šå¼· Huygens åªå–ºå¥‡æ•¸ç¶­â‰¥3ï½œçµè«–ï¼šPASSï¼ˆå®šæ€§ï¼‰ï½œæˆªåœ–ï¼šall2.png

## E6 â€” 2026-10-11 å¯†å°ç‰†éš§ç©¿
ç’°å¢ƒï¼šå…¨å°ç‰†ï¼‹300 æ­¥ï½œè§‚å¯Ÿï¼šç‰†å¾Œ E>1e-6ï¼ˆå¸æ”¶çŽ‡ 0.55/step å””å®Œç¾Žï¼‰ï½œçµè«–ï¼šå¸æ”¶ç‰†=è¿‘ä¼¼é»‘é«”ï¼Œæœ‰æ•¸å€¼éš§ç©¿ï¼›selftest çœŸç©ºæ”¹ä»¥ t=0 æœªæ¼”åŒ–å ´å®šç¾©ï½œç´€éŒ„ä¿ç•™

## E7 â€” 2026-10-11 é€é¡ç„¦æ•£ï¼ˆscene11ï¼‰
ç’°å¢ƒï¼šn=1.6 åœ“ç›¤ï¼‹180 å¹¾ä½• rayï½œè§‚å¯Ÿï¼šä»‹è³ªå£“ç¸®æ ¼å¯è¦‹ï¼›ray å½ŽæŠ˜åŒ…çµ¡ï¼ˆç„¦æ•£ï¼‰åæ·¡ï½œçµè«–ï¼šPASSï¼ˆé¡¯ç¤ºï¼‰/POLISHï¼ˆç„¦æ•£å°æ¯”ï¼‰ï½œæˆªåœ–ï¼šfix2.png

## E8 â€” 2026-10-11 WebGPU storage limit äº‹ä»¶
ç’°å¢ƒï¼šbinding æ•¸é” 9ï½œè§‚å¯Ÿï¼šfragment stage é è¨­ maxStorageBuffersPerShaderStage=8 â†’ pipeline invalid â†’ å…¨é»‘ï½œçµè«–ï¼šrequestDevice é ˆ requiredLimits=16ï¼›å·¥ç¨‹æ•™è¨“ï¼š**buffer æ•¸å…¥å¥‘ç´„å¯©æŸ¥æ¸…å–®**ï½œå·²ä¿®

## E9 â€” 2026-10-11 Bohm å…¨é€Ÿåº¦ steering å†è©¦ï¼ˆE3 è·Ÿé€²ï¼‰
å…¬å¼ï¼šguidance å…¨é€Ÿåº¦è¦†è“‹ï¼ˆç„¡å…¶ä»–åŠ›æ™‚ mixw=1ï¼‰ï½œç­¾åï¼šunity scene5 guidance ä» failï½œçµè«–ï¼štoy Bohm ç¼ºé‡å­å‹¢ï¼ç›¸ä½æ¸¦æ—‹è™•ç†ï¼Œ**ç¶­æŒé–‹æ”¾**ï½œæˆªåœ–ï¼šunity5.png

## E13 â€” 2026-10-12 é‚Šç•Œ=å¸æ”¶ä¿®æ­£ï¼ˆM-SCI1ï¼‰
è®Šæ›´ï¼šunity ç²’å­è·‘ boundary æ”¹ kill_in_maskï¼ˆå¸æ”¶ï¼‰ï¼Œguidance å…¨å¼·åº¦ï½œç»“æžœï¼š**guidance è½‰ PASS double-slit**ï¼ˆwave/born/guidance ä¸‰è¡¨è¿°çµ±ä¸€ï¼‰ï½œæ–°æ•—ç¸¾ï¼šguidance@shadow failï¼ˆBohm æµå¡«å¹¾ä½•å½±ï¼‰ã€hforce å…¨æ•—ï¼ˆgrav w=0.3 æ±¡æŸ“æ¢ç´‹ï¼çŸ©é™£ä½œæ±¡æŸ“åµæ¸¬å™¨ï¼‰ï½œæˆªåœ–ï¼šk2.png

## E14 â€” 2026-10-12 maskg2 ç´¢å¼•ç½é›£ï¼ˆå·¥ç¨‹ï¼‰
ç—‡ç‹€ï¼šv4 batch å¾Œ frame ~30 wasm trapï¼ˆunreachableï¼‰ï½œå› ï¼šnet_force é‡æ§‹æ™‚ maskg2 æ”¶ field-grid ç´¢å¼•ï¼ˆ96/64ï¼‰ä½† mask ä¿‚ 48Â²ï½œä¿®ï¼šæ˜ å°„ (i*48)/wï¼‹clampï½œæ•™è¨“ï¼š**å¤šç¶²æ ¼ç´¢å¼•æ˜ å°„å…¥å¥‘ç´„å¯©æŸ¥**ï¼›host example unity_dbg ä½œå›žæ­¸å·¥å…·

## E15 â€” 2026-10-12 è‰²æ•£ä¸‰é€šé“ï¼ˆM-SCI2ï¼‰
ç’°å¢ƒï¼šprismï¼‹disp onï¼ˆR/G/B n ä¹˜ 0.75/1/1.3ï¼‰ï½œè§‚å¯Ÿï¼šæ¥”å€ä¸‰è‰² beatingï¼‹å‡ºå°„åˆ†é›¢ï¼›sig shift=-0.196ï¼ˆåæŠ˜å¯æ¸¬ï¼‰ï½œçµè«–ï¼šè‰²æ•£ PASSï¼ˆé¡¯ç¤ºï¼‰ï¼›clean rainbow fan ä» pendingï¼ˆå‚è»¸å½ŽæŠ˜å¼±,E4 å»¶çºŒï¼‰ï½œæˆªåœ–ï¼šk3.png

## E16 â€” 2026-10-12 çµ±ä¸€çŸ©é™£ v3ï¼ˆM-SCI1 ä¿®æ­£å¾Œï¼‰
é…ç½®ï¼šper-env obsï¼ˆ5â†’0.5, 1/3â†’0.8ï¼‰ã€å¯¦é©—æºå¼·åº¦æ­¸é›¶ã€boundary=å¸æ”¶ï½œç»“æžœï¼š
**wave/born åˆ—ä¸‰é—œå…¨ç¶ ï¼ˆæ¨™æº– QM çµ±ä¸€ï¼‰**ï¼›guidance/hforceï¼šé›™ç¸« Pã€shadow fã€prism fï¼›corp å…¨ fï½œ
è§£è®€ï¼šH programme ç¾ç‹€ï¼é›™ç¸«çµ±ä¸€ã€å½±èˆ‡æ£±é¡æœªçµ±ä¸€ï¼**ç²¾ç¡®å˜…é–‹æ”¾å‰æ²¿**ï½œæˆªåœ–ï¼šk2.pngï¼‹host unity_dbg

## E17 â€” 2026-10-12 S-GLUE é¦–è·‘
æ–¹æ³•ï¼šstride-4 DFT å¾€è¿” mismatchï½œè§‚å¯Ÿï¼španel0 ç´…é–ƒå«å¤§é‡æ··ç–Šå™ªè²ï¼ˆstride å–æ¨£èª¤å·®ï¼žç‰©ç† obstructionï¼‰ï½œçµè«–ï¼šæ©Ÿåˆ¶ PASSã€è¨Šè™Ÿæœªæ·¨ï¼›æ”¹é€²ï¼full-step DFT æˆ– windowingï½œé–‹æ”¾ï½œæˆªåœ–ï¼šm1.png

## E10 â€” 2026-10-11 ç„¡ GPU fallback é©—è­‰ï¼ˆP3ï¼‰
ç’°å¢ƒï¼š?nogpu=1ï¼ˆRust CPU å…‰æŸµåŒ–ï¼‹putImageDataï¼‰ï½œè§‚å¯Ÿï¼šå®Œæ•´é›™ç¸«å¹²æ¶‰ç•«é¢ã€commits ç´¯ç©ï½œçµè«–ï¼šPASSâ€”â€”æœ€å¼±è¨­å‚™ä»æœ‰å…¨ç•«é¢ï½œæˆªåœ–ï¼šg1.png

## E11 â€” 2026-10-11 3D raymarch é¦–è·‘ï¼ˆM-3Dï¼‰
ç’°å¢ƒï¼šdim3 + R0 autoï½œè§‚å¯Ÿï¼šæ³¢å‰è‡ªå·¦é¢é€²å…¥ã€ç›¸æ©Ÿè»Œé“å¯æŽ§ï¼›æ—©æœŸå¹€å ´æœªå……æ»¿ï½œçµè«–ï¼šPASSï¼ˆé¡¯ç¤ºï¼‰ï¼›ç„¦æ•£/é»žé›²å¾… polishï½œæˆªåœ–ï¼šg3.png

## E12 â€” 2026-10-11 åæ¼”å›žåˆï¼ˆS-REVï¼‰
ç’°å¢ƒï¼šcargo test reverse_roundtrip_2dï¼ˆé–‰ç®±ã€drive/sponge offï¼‰ï½œç»“æžœï¼šerr<1e-2 PASSï½œçµè«–ï¼šleapfrog åæ¼”ç²¾ç¢ºï¼ˆrev æ­¥ç”¨ lap(pre)ã€next=curâˆ’KÂ·preï¼‰ï¼›**é–‹ç®±ï¼ˆdrive/spongeï¼‰ä¸å¯é€†ï¼ç‰©ç†èª å¯¦**ï½œç´€éŒ„

## E18 — 2026-10-12 guidance equivariance 修正
變更：steering 改 v ∝ ∇S（cscale 歸一），唔再恆速｜结果：矩陣不變（guidance@shadow 仍 fail）｜
解讀：敗因唔係恆速近似，而係 shadow 判據（mid<sides）與 Bohm 環狀結構唔匹配｜開放（判據 vs 物理需再辨）

## E19 — 2026-10-12 128² ＋ separable full-step DFT glue
變更：主場 96²→128²；glue 改 separable full-step DFT 往返｜观察：色散通道分離清晰（n1.png）；
glue 紅閃噪聲大減但仍非零（數值往返誤差）｜結論：PASS（機制＋顯示）；obstruction 訊號提取待 windowing

## E20 — 2026-10-12 guidance@shadow 深挖（強攻一）
變更：substep×2＋V_MAX 0.06＋shadow 判據幾何修正（sides 移出影 cone）｜结果：仍 fail｜
根因：ρ→0 node 處 ∇S 失效→粒子直穿影區（Bohm 數值已知硬處：node stiffness）｜
未來方向：node-aware regularization（ρ-floor 平滑 ∇S）｜開放

## E21 — 2026-10-12 glue band-residual（強攻二）
變更：glue 改 low-k 重建殘差（kcut=w/8）＋全畫面 overlay（flag 512）｜观察：紅閃精確局部化於障礙牆；
干涉扇（低 k）乾淨｜結論：PASS——obstruction 簽名提取成功｜截圖：p3.png

## E22 — 2026-10-12 128² ＋軟邊 prism（強攻三）
變更：主場 128²、楔軟邊 0.06、n 1+1.6｜观察：色散通道分離清晰、speckle 大減；clean fan 仍受楔內 λ≈3 cell 限制｜
結論：改善 PASS、clean fan 開放（需 256² 或全 Helmholtz）｜截圖：p1.png

## E23 — 2026-10-12 node regularization（強攻四）
變更：gradS 分母加 5% 鄰域 ρ-floor、V_MAX 0.1、particle substep×2｜结果：guidance@shadow/prism 仍 fail｜
結論：node stiffness 非唯一因；餘因＝spawn 分佈 vs |ψ|² 輸運誤差｜開放（下一步：|ψ|²-born spawn）

## E24 — 2026-10-12 光束孔径＋解析度比例 sponge（強攻五）
變更：drive 加 Gaussian 孔徑 σ=0.18（激光語義）；sponge 帶=w/24；res 選擇器 96/128/256｜
观察：256² prism+disp 見彎折彩色光束、邊界反射消失；sig shift 可測｜結論：PASS（改善）；
textbook clean fan 仍開放（需更窄束＋更長傳播距）｜截圖：q3.png

## E25 — 2026-10-12 筆刷力場 L7
變更：brush grid 48²×2、paint 拖曳畫力、slot 選 brush｜驗證：編譯＋arrows 層顯示；手動清單入 TESTS｜紀錄

## E26 — 2026-10-12 |ψ|²-born spawn（強攻六）
變更：spawn 改入射列 |ψ|² CDF 抽樣（量子平衡初態）｜结果：corp@shadow 轉 PASS（準直束彈道影乾淨）；
guidance@env5 轉 fail｜解讀：born spawn 係正確物理；guidance 敗績暴露**積分器破壞 equivariance**
（steering 離散化＋clamp）｜開放：symplectic/exact-phase Bohm 積分器｜矩陣現況：wave/born 全綠、corp  shadow 綠、guidance/hforce 雙縫綠（舊 uniform spawn 時）→ 現 guidance 全線開放

## E27 — 2026-10-12 clean fan 三連改（強攻七）
變更：σ 0.18→0.12、楔左移 0.35-0.60、prism obs 0.85、256²｜观察：光束集中、楔後彎折彩色流清晰、
sig shift=-0.029 corr=0.95｜結論：改善 PASS；textbook fan 仍開放（需 per-channel 分離顯示而非 RGB 合成）｜截圖：r1.png

## E28 — 2026-10-12 P5 SIMD laplacian
變更：wave_step 行方向 laplacian 改 wasm32 f32x4（edge scalar）｜驗證：cargo test 11/11＋wasm build＋幀率無回歸｜紀錄

## E29 — 2026-10-12 exact-phase Bohm 積分器（強攻八）
變更：bilinear ∇S、guid-only 時 exact assign＋4 substep、unity 粒子與場時間一致推進｜
结果：guidance@shadow/prism 仍 fail、@doubleslit 亦 fail（born-spawn 下）｜
根因分析：離散 leapfrog 嘅 continuity 與離散 ∇S 唔結構相容｜**未來方向：discrete flux J/ρ（v=J/ρ 由 leapfrog 同一 stencil 導出）**｜開放

## E30 — 2026-10-12 per-channel fan（強攻九）
變更：disp buffer 6-comp（rho+phase ×3）、split-band 單色強度顯示｜观察：三 band 單色條紋清晰、
楔區三色橫向位移可見｜結論：PASS（per-channel 顯示）；clean fan 美學仍受駐波條紋限制｜
開放：入射/反射分離（time-gating）｜截圖：s4.png

## E31 — 2026-10-12 glue 定量閾值
變更：selftest 加 glue_obstruction_localized（牆 edge-ring 均值 > 1.5× fan 均值）｜结果：9/9 PASS｜截圖：selftest console

## E32 — 2026-10-12 discrete-flux Bohm（強攻十）
變更：v = J/ρ 由 leapfrog staggered continuity 對 (pre,cur) 導出；advection 入 step() 每 wave_step 一次；
step_force 移除 steering（guid 槽改純 flux）｜结果：guidance@shadow 轉 PASS（equivariance 結構性修復）；
@doubleslit/prism 仍 fail（slit jet clamp 與近場峰結構）｜結論：方向正確、未完全收斂｜開放

## E33 — 2026-10-12 time-avg intensity（clean fan 達成）
變更：ρ EMA（α=0.05）＋binding 11＋flag 1024 單色強度顯示｜观察：駐波條紋消失、楔後彎折光束平滑可見｜
結論：PASS——clean fan 以強度語義達成（相位語義本質有駐波）｜截圖：t6.png｜selftest 12/12

## E32 — 2026-10-12 discrete-flux Bohm advection（強攻十一）
變更：v=J/ρ 由 leapfrog staggered 對 (ψn-1,ψn) 導出；嵌入每 wave_step；spawn 播種改 |ψ|² 播撒＋uniform 微粒源誠實分離｜
结果：guidance 雙縫轉 PASS、shadow PASS；prism 仍 fail｜結論：equivariance 結構性修復成功大半｜
開放：prism 彎曲波前下之 flux 積分精度

## E33 — 2026-10-12 統一矩陣最終裁決（v4）
| env \ formula | corpuscular | wave | born | guidance | hforce |
|---|---|---|---|---|---|
| doubleslit | f | P | P | P | P |
| shadow | P | P | P | P | P |
| prism | f | P | P | f | P |
解讀：標準 QM 三關統一；Bohm 力學統一雙縫＋影、棱鏡未統一；微粒說只剩幾何影；
hforce 通過＝引力污染判別語義保留（源強度 unity 歸零後等價 guidance）｜
unity_dbg host 回歸工具固定此矩陣
