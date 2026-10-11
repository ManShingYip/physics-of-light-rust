# 測試目錄（Test Catalog）與快捷鍵

## 1. 三層測試
| 層 | 工具 | 命令 | 內容 |
|---|---|---|---|
| 單元 | cargo test | `cd src-rs; cargo test` | 6 項：CDF/真空/上限、RNG 確定、速度夾、parser 拒絕/接受/優先序 |
| 後端整合 | in-page selftest | URL 加 `?selftest=1` | 8 項 PASS/FAIL 印畫面＋console：wasm_add、場能量、commits 上限、雙縫 peaks≥3、真空無點、速度夾、parser×2 |
| 後端物理 | CPU dump | `cargo run --example dump` + `python examples/raw2png.py` | 無 GPU 睇 solver 場（干涉扇形） |
| 全鏈畫面 | playwright | `node scripts/shot.mjs <out> <url> <ms> <scene|none> <js|none>` | 真 Chrome+SwiftShader WebGPU 截圖 |
| 理論裁決 | unity matrix | 畫面按鈕或鍵 `u` | 公式×環境矩陣，一列全綠=統一公式 |

## 2. 快捷鍵（? 開關 help overlay）
| 鍵 | 功能 |
|---|---|
| 1 / 2 / 3 | 場景：shadow / prism / doubleslit |
| p | 粒子＋dominance 尾跡 |
| h | 干涉直方圖 |
| a | 累積打點 |
| d | duel（左 Born 右力律） |
| l | 維度階梯 D=1..4 |
| g | docent 解說 |
| u | 跑統一矩陣（同步 batch ~1-2s） |
| r | 重抽 commits |
| e | 匯出 signature JSON |
| space | 暫停/繼續 |
| [ ] | obs_width 減/加 |
| ← → | obs 線移動 |
| ? | help overlay |

## 3. 手動驗收清單（每里程碑末）
- 三場景切換畫面符 SCENES 描述
- 拖力源：尾跡即時彎
- 權重滑桿全零：尾跡直線
- sweep 來回：Pending↔Committed 可逆
- dims：D=3 格鋭前、D=2 格尾跡
- unity：corpuscular 列全紅、wave/born 列綠 scene5+1

## 4. 已知開放項（見 EXPERIMENTS.md）
guidance/hforce 雙縫敗、prism 彎折弱、S-POL 未實施、S-PROJ/S-GLUE 未實施。
