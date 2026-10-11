# 04 è¿½æº¯çŸ©é™£ï¼ˆA+B ç°½æ”¶é ï¼‰

æ¯è¡Œäº”æ¬„ï¼šå…¬å¼/å­ç³»çµ± â†” ä»£ç¢¼ä½ â†” æ¸¬è©¦ â†” ç•«é¢å±¤ â†” å¥‘ç´„è¡Œã€‚
`âœ“`=å·²ç°½æ”¶ã€`M#`=å¾…é‡Œç¨‹ç¢‘ç°½æ”¶ã€‚ç¼ºæ¬„=æœªå®Œå–„ï¼Œå””ç®— Doneã€‚

| å­ç³»çµ± | ä»£ç¢¼ä½ | æ¸¬è©¦ | ç•«é¢å±¤ | å¥‘ç´„(02) | ç‹€æ…‹ |
|---|---|---|---|---|---|
| S-FIELD-INIT | lib.rs::init_double_slit | ç‰†é«”é›¶å€¼(M1) | L-ghost | field buffers | âœ“ï¼ˆM-S1 é€€å½¹â†’S-SOLVER-WAVEï¼‰ |
| S-SCENE | scene.rs(M-S1) | preset å¾€è¿” | L0 | n/mask_grid(v2) | M-S1 |
| S-DIM | scene.rs(M-S2) | å°¾è·¡æ–·è¨€ D=3 | M-dims å››æ ¼ | å¥‘ç´„v3 å¤šç¶­å ´ | M-S2 |
| S-POL | field.rs(M-S2) | Malus fit | ç®­é ­/è‰²è¼ª | å¥‘ç´„v3 åˆ†é‡æ•¸ | M-S2 |
| S-EXPLAIN | main.ts(M-S2) | æ–‡å­—æ ¸å° | docent å´æ¬„ | â€” | M-S2 |
| S-GRID | grid.rs(M-S3) | æŠ½æ ¼é‡è·‘æ¯”å° | M-unity è³‡æ–™æº | sig_cache å¥‘ç´„v3 | M-S3 |
| S-UNITY | main.ts(M-S3) | å…¨ç¶ åˆ—æ–·è¨€ | çµ±ä¸€çŸ©é™£ | real_sig è¡¨å”¯è®€ | M-S3 |
| S-SOLVER-WAVE | scene.rs/solver(M-S1) | CFL+èƒ½é‡å®ˆæ† | L-ghost | n/mask_grid(v2) | M-S1 |
| S-SOLVER-RAY | solver(M-S1) | ç„¦æ•£ä½ç½®è§£æžæ¯”å° | preset11 | n_grid(v2) | M-S1 |
| S-SOLVER-PARTICLE | force.rs(M1) | åŒ S-INTEGRATOR | L2 | trails | M1 |
| S-OBS | wgsl::fs_main | æ‰‹å‹• | L-ghost | field buffers | âœ“ |
| S-CUT | wgsl::fs_main | æ‰‹å‹•æ‹–æ¡¿ | å‰æ²¿ | uniform | âœ“ |
| S-BLEND | wgsl::fs_main | æˆªåœ– | å…¨ç•«é¢ | uniform | âœ“ |
| S-DOTS | wgsl::fs_main | æˆªåœ– | L3 | commits | âœ“ |
| S-HIST | wgsl::fs_main | æˆªåœ– | å³ç·£ | commits | âœ“ |
| S-SAMPLER | lib.rs::sample_commits | unit(M1) | L3 | commits | âœ“ |
| S-RNG | lib.rs::XorShift64 | unit(M1) | â€” | â€” | âœ“ |
| S-FORCE-GRAV | force.rs(M1) | åœ“è»Œé“(M1) | L0+L2 | force_grid(M2 å‰ç”¨è§£æž) | M1 |
| S-INTEGRATOR | force.rs(M1) | èƒ½é‡æ¼‚ç§»(M1) | L2 | trails | M1 |
| S-FORCE-GUID | force.rs(M2) | èˆ‡è§£æžâˆ‡phaseæ¯”å° | L2 | force_grid | M2 |
| S-FORCE-EM | force.rs(M2) | å°ç¨±æ€§ | L0+L2 | force_grid | M2 |
| S-FORCE-BOUND | force.rs(M2) | ç‰†å¤–é›¶åŠ› | L0 | force_grid | M2 |
| S-COUPLING | force.rs(M2) | å…¨w=0â‡’F=0 | Kç†±åŠ›åœ– | force_grid | M2 |
| S-DOMINANCE | force.rs(M2) | argmax ä¸€è‡´æ€§ | å°¾è·¡æŸ“è‰² | trails.hue | M2 |
| S-SIGNATURE | lib.rs(M3) | ç´”å‡½æ•¸æ–·è¨€ | é™¤éŒ¯é¢æ¿ | æ–°buffer(å¥‘ç´„v2) | M3 |
| S-LENSING | lib.rs(M4) | å½Žæ›²æ–¹å‘ç¬¦n=1+Î¦ | æ¢ç´‹å½Ž | field buffers | M4 |
| S-PROJ-K | lib.rs(M-proj) | FFT å¾€è¿”èª¤å·® | P2 | æ–°buffer(å¥‘ç´„v2) | M-proj |
| S-PROJ-W | lib.rs(M-proj) | è² å€¼å­˜åœ¨æ€§ | P3+é–ƒå…‰ | æ–°buffer(å¥‘ç´„v2) | M-proj |
| S-PROJ-PATH | lib.rs(M-proj) | å¯†åº¦æ­¸ä¸€ | P4 | æ–°buffer(å¥‘ç´„v2) | M-proj |
| S-GLUE | lib.rs(M-proj) | å–®é¢æ¿é‚„åŽŸå¿…æ•— | è† åˆé–ƒå…‰ | å¥‘ç´„v2 | M-proj |

## ç°½æ”¶è¦å‰‡
1. B å¯¦ç¾å®Œ â†’ è·‘ 03 æ¸¬è©¦çŸ©é™£å°æ‡‰è¡Œ â†’ å¡«ä»£ç¢¼ä½/æ¸¬è©¦æ¬„ â†’ æ PR/commit message å¸¶ `sign: S-XXX`ã€‚
2. A æ ¸å°å¥‘ç´„ç„¡æ¼‚ç§» â†’ ç‹€æ…‹æ”¹ âœ“ã€‚
3. å¥‘ç´„ v2 è§¸ç™¼æ¢ä»¶ï¼šä»»ä½•æ–° bufferï¼ˆsignature/æŠ•å½±ï¼‰åŠ å…¥æ™‚ï¼ŒA å…ˆä¿® 02 å‡ç‰ˆæœ¬ã€‚

## å­¤å…’å¯©è¨ˆ
- ç„¡ä»£ç¢¼ä¹‹å¡ï¼šM# æ¬„ä½æ¨™ç¤ºï¼Œå…è¨±ï¼ˆè¦åŠƒä¸­ï¼‰ã€‚
- ç„¡å¡ä¹‹ä»£ç¢¼ï¼š**ç¦æ­¢**ï¼›ç™¼ç¾å³è£œå¡æˆ–åˆªé™¤ä»£ç¢¼ï¼ˆå¯©è¨ˆæ™‚é»žï¼šæ¯é‡Œç¨‹ç¢‘æœ«ï¼‰ã€‚

## ç‹€æ…‹æ›´æ–°ï¼ˆ2026-10-11 batchï¼‰
è½‰ âœ“ï¼šS-SCENE, S-SOLVER-WAVE, S-FORCE-GRAV, S-INTEGRATOR, S-SOLVER-PARTICLE,
S-FORCE-GUID, S-FORCE-EM, S-FORCE-BOUND, S-DOMINANCE, S-SIGNATURE, S-LENSING,
S-DIM, S-EXPLAIN, S-GRID, S-UNITYã€‚
å‚™è¨»ï¼šS-COUPLING=weights onlyï¼ˆK äº¤å‰é …å»¶å¾Œï¼‰ï¼›S-FORCE-GUID å¯¦ç¾ä½† unity æ•—ï¼ˆE3ï¼‰ï¼›
S-LENSING å¯¦ç¾ä½†å½ŽæŠ˜å¼±ï¼ˆE4ï¼‰ã€‚
ä» pendingï¼šS-GLUEï¼ˆè† åˆ mismatch æœªå¯¦æ–½ï¼‰ã€‚
2026-10-11 äºŒæ‰¹è½‰ âœ“ï¼šS-SOLVER-RAYï¼ˆç„¦æ•£æ·¡=E7 polishï¼‰ã€S-PROJ-K/W/PATHï¼ˆon-demand æŒ‰éˆ•ï¼‰ã€
S-POLï¼ˆtoyï¼šåæŒ¯å¸¶ï¼‹Malus è®€å‡ºï¼Œéžå ´è€¦åˆï¼‰ã€‚
2026-10-12 ä¸‰æ‰¹è½‰ âœ“ï¼šS-ZEROCOPY(P1)ã€S-GOV(P2)ã€S-RASTER(P3, E10)ã€S-VOL/S-CAM(M-3D, E11)ã€
S-SLOT/S-REV(M-SWAP, E12)ã€‚ä» pendingï¼šS-GLUEã€S-GPUSIM(P4)ã€S-SIMD(P5)ã€ç­†åˆ·åŠ›å ´ï¼ˆoptionalï¼‰ã€‚

2026-10-12 三批轉 ✓：S-GLUE（機制通、訊號混疊=E17）、unity per-env obs＋源歸零（E16）。
矩陣現況：wave/born 全綠；guidance/hforce 雙縫綠；corp 全紅。

