# Physics of Light — 光即力・前後端・同時接納

**Live**: https://manshingyip.github.io/physics-of-light-rust/
一個可跑、可測、可反推嘅光物理沙盒：後端 Rust/WASM 持有未坍縮場與力驅動粒子，
前端只做「觀測＝渲染」。核心假說 H：**光係一種力**，與宇宙其他力同在、疊加、交互；
每個歷史派系（微粒/波動/電磁/光子/哥本哈根/導引波/QED/幾何/全像）係佢嘅一面，
由**統一矩陣**當眾裁決邊條公式能同時回答所有實驗。

## 三分鐘上手
| 出口 | 命令／位址 | 說明 |
|---|---|---|
| Web（增強） | 開 live URL（Chrome/Edge） | WebGPU：3D raymarch、維度階梯、投影、統一矩陣 |
| Web（universal） | 開 live URL（Firefox/Safari） | 自動 WebGL2 baseline；再唔得自動 Rust CPU raster |
| Web（強制 CPU） | URL 加 `?nogpu=1` | 驗證最弱設備路徑 |
| 原生視窗 | `cd src-rs && cargo run --features native --bin pol-native` | minifb＋Rust raster，零瀏覽器 |
| 终端機 | `cargo run --features term --bin pol-term` | Win32 console＋VT 真彩半格，零 crate 依賴 |
| 影片產物 | `cargo run --example frames` → `ffmpeg -framerate 8 -i frames/f%03d.png out.mp4` | PNG 序列 |

## 畫面語彙
彩色波紋=待定場（色=相位、亮度=機率）｜暗牆/圓盤/楔=場景幾何｜青/橙/品紅尾跡=粒子軌跡（色=主導力）｜
白點=已 commit 事件｜右緣青棒=干涉直方圖｜紅閃=glue obstruction 候選人。
快捷鍵：`?` 開 overlay；`1-4` 場景、`u` 統一矩陣、`t` 時間反演、`k` kick、`c/x/v` 源操作、`Tab` 選源。

## 測試
```
cd src-rs && cargo test                 # 11 unit（含 exact 反演回合、swap 不變、parser）
URL?selftest=1                          # 8 項 in-page 後端自檢
node scripts/shot.mjs out.png <url> <ms> <scene|none> <js|none>   # 全鏈截圖（playwright+SwiftShader）
cd src-rs && cargo run --example unity_dbg   # host 側統一矩陣回歸
```

## 統一矩陣現況（2026-10-12, E16）
| env \ formula | corpuscular | wave | born | guidance | hforce |
|---|---|---|---|---|---|
| doubleslit | fail | PASS | PASS | PASS | PASS |
| shadow | fail | PASS | PASS | fail | fail |
| prism | fail | PASS | PASS | fail | fail |
解讀：標準 QM 三關統一；H（光力）統一雙縫、影與棱鏡未統一＝**精确嘅開放前沿**；
微粒說全紅＝1801 年否證重演。矩陣同時係力污染偵測器（開 grav 權重即見 hforce 轉紅）。

## 文件地圖
`docs/PROJECT_PLAN.md` 總計劃｜`docs/SCENES.md` 場景/維度/同時接納憲法｜
`docs/research/` 13 份派系與框架調查｜`docs/engineering/` 契約/卡/runbook/追溯｜
`docs/implementation/` STEP 步驟與完成紀錄｜`docs/TESTS.md` 測試與快捷鍵｜
`docs/EXPERIMENTS.md` 實驗紀錄（含敗績，不銷毀）。

## 架構一句話
L1 Rust/WASM（狀態+隨機性唯一持有者）→ L3 TS bridge（零拷貝 view）→ L2 WGSL/GLSL（無狀態投影）；
渲染三層：WebGPU 增強 → WebGL2 universal → Rust CPU raster 保險絲（I13：任何環境禁止黑屏）。
