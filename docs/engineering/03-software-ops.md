# 03 軟件工程操作（B 級交付）— 精確 runbook

## 1. Repo 地圖
```
src-rs/src/lib.rs      L1 後端（場、採樣、[M1] 力）
src-rs/src/force.rs    [M1] Force trait/積分器（01 卡 S-FORCE-*）
src/render/wave_blend.wgsl  L2 著色器
src/main.ts            L3 橋接＋L4 事件
index.html             L4 控制項
docs/research/         科學卷　docs/engineering/ 工程卷
pkg/                   wasm-pack 產出（gitignore）
```

## 2. 工具鏈（已 pin，勿手改）
`rust-toolchain.toml` = stable-x86_64-pc-windows-gnu + wasm32 target
`.vscode/settings.json` = RA target=wasm32、procMacro on
原因：本機無 MSVC link.exe；gnu 鏈先編得過（ADR 補充）。

## 3. Build/Verify runbook（bounded 規則：完即停，唔起長駐 server）
```
cd src-rs; cargo check --target wasm32-unknown-unknown
cd src-rs; npx --yes wasm-pack@0.13.1 build --target web --out-dir ..\pkg
npx tsc --noEmit
node node_modules/vite/bin/vite.js build
```
通過標準：四步零錯誤；見到 `Backend ready / 2+2=4 / webgpu: ready` 即停手回報。
畫面驗證：`node scripts/shot.mjs <out.png> <url> <waitMs>`（playwright-core＋系統 Chrome，
real-time 等待＋SwiftShader WebGPU flag）；截圖後用讀圖工具核對畫面元素。
後端物理驗證（無 GPU）：`cargo run --example dump`＋`python examples/raw2png.py` → 讀 dump.png。

## 4. Deploy runbook
```
node node_modules/vite/bin/vite.js build
git add -A; git commit -m "<msg>"
git checkout -b deploy-tmp; git add -f dist; git commit -m "deploy dist"
git subtree split --prefix dist -b gh-pages
git push origin gh-pages --force
git checkout main; git branch -D deploy-tmp gh-pages
```
URL：https://manshingyip.github.io/physics-of-light-rust/

## 5. 測試矩陣
| 對象 | 測試 | 級 | 狀態 |
|---|---|---|---|
| S-SAMPLER | CDF 單調、真空 early-exit、≤256 drain | unit(Rust) | M1 補 |
| S-RNG | 同 seed 同序列 | unit | M1 補 |
| S-INTEGRATOR | 圓軌道能量漂移<ε | unit | M1 |
| 契約 02 | buffer 大小/對齊斷言（TS 啟動時） | runtime | M1 補 |
| L2 | getCompilationInfo errors→on-screen | runtime | ✓ |
| 全鏈 | headless 截圖＋UI 文字核對 | e2e-lite | ✓ |

## 6. 變更レシピ
**加力通道**：A 出卡(01)→02 加 K 行→B: force.rs impl Force→lib 註冊→wgsl hue→html 滑桿→04 簽收。
**加投影面板**：A 出卡→02 加 buffer 行→B: Rust project fn→TS upload→wgsl viewport→04 簽收。
**加 UI 參數**：純 L4/L3：html input→TS read→uniform pad 位（無位=契約變更）。

## 7. 效能預算
場 96²、force_grid 48²、commits≤256、trails≤1024、每幀 writeBuffer≤3 次、
目標 frame<8ms（soft GPU 放寬至 30ms）；超支=回 01 改卡（降解析度屬契約變更）。

## 8. 錯誤政策
WGSL 編譯錯→gpuInfo 顯示行號；wasm memory view→try/catch 回空陣列；
無 adapter→降級文字模式（後端照跑）；任何 silent failure 禁止：寧願畫面報錯唔好黑屏。
