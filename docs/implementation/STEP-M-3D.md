# STEP-M-3D：3D 場＋相機＋渲染品質階梯
依賴：M-PERF P1（否則拷貝放大）｜預估：大｜卡：S-VOL, S-CAM｜契約：uniform v4 請求

## 0 目標
主場 3D（預設 32³），相機軌道；R0 raymarch／R1 slice／R2 點雲三模式同 buffer；governor 管解析度。
完成圖：拖曳旋轉見到 3D 干涉殼；滾輪推拉；切 R2 見點雲殼。

## 1 前置
- step_nd 已泛維（直接主場用 3D shape）；S-VOL/S-CAM 卡。
- 品質階梯定義 SCENES §7；資源憲法 I10-I12。

## 2 實作步驟
1. lib.rs：主場 shape 改 3D（res 階梯 32/48/64）；scene n/mask 改 16³/24³；
   preset 3D 化（牆=平面、縫=兩孔、盤=球、楔=棱柱、透鏡=球）。
2. lib.rs：camera 參數 (yaw,pitch,dist,panx,pany) setter；CPU 算 view rays 參數上傳。
3. wgsl：R0 raymarch（步數=品質滑桿 32-128）；R1 三 slice 疊加；R2 點雲（ρ 採樣 buffer）；
   模式由 flags bit5/6 選；governor 寫入。
4. main.ts：pointer 軌道事件、wheel dolly、shift pan；品質滑桿；模式 select＋auto。
5. sample_commits 3D：obs 改觀測平面 x=obs；CDF 過 y-z 面（hist 仍投影 y）。

## 3 契約影響
請求 v4：uniform 96B（+camera 5 floats＋res u32）；新增 pointcloud buffer（≤8192×16B）。

## 4 驗證
03 四步＋dump example 3D 中slice PNG＋playwright 三模式截圖＋幀時間 log（governor 輸入）。

## 5 驗收
- 04 行 S-VOL/S-CAM 轉 ✓；SCENES 14 關喺 3D 重跑（unity 矩陣 env 加 dim=3 變體）。
- 反演回合測試通過（S-REV 前置）。

## 6 回滚/隔離
flag `dim3_enabled`；off 回 2D 全鏈（舊路保留至驗收）。
完成紀錄：—
