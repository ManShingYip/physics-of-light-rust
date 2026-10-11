# Physics of Light — 專案總計劃（多力交互宇宙版）

狀態：規劃中（M0 已完成並上線）
修訂：v3 — 主軸重設。雙縫實驗**降格為 preset #5（判別關）**，
主軸 = 可組合光現象沙盒（見 `docs/SCENES.md`：13 preset 判別表）。
上線位址：https://manshingyip.github.io/physics-of-light-rust/
源碼：https://github.com/ManShingYip/physics-of-light-rust
修訂：v2 — 展示核心由「單力對決」改為「多種力交互嘅微型宇宙」

---

## 0. 文件目的

將本專案已驗證嘅架構、核心假說、以及「多力宇宙」嘅**展示方式**
整理成單一可執行計劃。任何新成員或 AI agent 讀完本文件，
應能理解：我哋展示緊乜、點解咁展示、下一步改邊個檔。

---

## 1. 核心假說 H：光係一種力

### 1.1 陳述
光嘅傳播與分佈，可以被理解為一種**力**作用喺光子（真粒子）上嘅後果。
而呢種力唔係孤立存在——佢同宇宙中其他力（重力、電磁、邊界）**同時在場、
互相疊加、甚至互相修改**。

### 1.2 操作化定義（寫入代碼嘅形式）
每種力 = 一個函數：`F_i(位置, 時間, 環境場) -> 二維向量`。
粒子受**淨力** `F_net = Σ w_i · F_i` 驅動（w_i 為該力權重）。
力與力嘅交互（進階）= 一個力嘅場修改另一個力嘅場（見 2.4）。

### 1.3 力族登記表（Force Registry）
| 代號 | 力 | 律 | 源 | 色相 |
|---|---|---|---|---|
| F_L | 光力（假說本體） | 導引 ∇phase(ψ) 或自訂 | 雙縫波場 | 青 |
| F_G | 重力 | 平方反比吸引 | 可拖曳質量點（星） | 橙 |
| F_E | 電磁 | Coulomb 吸/斥 | 可拖曳電荷點 | 品紅 |
| F_B | 邊界 | 短程排斥 | 屏障牆 | 灰 |
| F_X | 自訂槽 | 用家公式 | 用家定義 | 綠 |

假說喺呢個宇宙入面嘅地位：**光力係力族嘅平等一員**，
可以同其他力疊加、競爭、抵消——呢個正係「光即力」最自然嘅呈現。

### 1.4 誠實邊界
純經典力（無波場參與） historically 堆唔出干涉條紋。
F_L 因有波場參與，堆得出。畫面會如實顯示邊種力組合過到關、邊種過唔到。

---

## 1.5 主軸重設（v3）
本專案**唔係雙縫模擬器**，而係**光現象沙盒**：
- 一等公民 = Scene（光源/介質/障礙/力源/探測器，見 SCENES.md §1）。
- 雙縫 = preset #5，角色係「最鋭判別關」，因為它一次性殺死微粒說、
  並區分場論與粒子論；但佢只係 13 關之一。
- 假說 H 嘅合格線 = 跑晒 13 關（影、反射、色散、衍射、干涉、薄膜、
  偏振、散射、光電、lensing、焦散、單光子、AB），唔係過一關。
- 所有顯示層、通道、投影皆場景中立；新場景=純資料preset，唔郁求解器。

---

## 2. 展示方式（本計劃核心）：多力交互宇宙

### 2.1 設計原則
1. **畫面係一個微型宇宙**：暗底太空，力源係發光節點（星/電荷/牆），
   光粒子喺當中穿行，被淨力拗彎。
2. **渲染管線假說中立**：WGSL 只畫後端交出嘅場、箭頭、軌跡、點。
3. **每種力有自己嘅視覺簽名**（色相），交互結果先至睇得清。
4. **前後端哲學不變**：Rust 持有狀態與隨機性；前端只投影已提交事實。

### 2.2 四層宇宙視圖
| 層 | 畫面 | 回答嘅問題 | 實作 |
|---|---|---|---|
| L0 宇宙層 | 暗底 + 發光力源（星暈/電荷光環/牆體） | 宇宙入面有乜 | WGSL 按 sources buffer 畫輻射光暈 |
| L1 力場層 | 每力一層流線/箭頭，各自色相，可獨立開關；**淨力層白色** | 邊種力喺邊、推往邊 | Rust 算粗網格（48×48）每力向量 + 淨力，上傳 storage；WGSL 畫箭頭 |
| L2 軌跡層 | 粒子尾跡；**每段尾跡染「當時主導力」嘅色相** | 邊種力喺邊一刻抓住光 | Rust 積分時記錄 dominance index；尾跡點帶 hue |
| L3 結果層 | 命中白點累積 + 右緣直方圖（已有） | 多力合謀最終送光去邊 | 沿用 commits + histogram |

**Dominance 染色係本設計嘅靈魂**：一條尾跡由青變橙再變品紅，
即係話光沿途先後被光力、重力、電磁搶奪——「力嘅交互」直接可見。

### 2.3 組合模式
| 模式 | 內容 | 用途 |
|---|---|---|
| M-single | 只開一種力 | 對照：每種力單獨嘅筆跡 |
| M-universe | 全力開啟 | 主視圖：交互宇宙 |
| M-duel | 左 Born / 右宇宙 | 假說 vs 標準 QM 當眾對決 |

### 2.4 力—力交互（進階，M4）
唔止疊加喺粒子身上，而是**場修改場**：
- 重力井令波場折射率 `n(x) = 1 + Φ_G(x)` → 波前彎曲 → F_L 隨之彎曲
  （視覺上：重力 lensing 改變干涉紋，光力跟住變）。
- 電荷區令波場局部相位偏移 → 條紋平移（Aharonov–Bohm 味）。
呢層先至係真正嘅「交互」，而唔係各力各自拉粒子。

### 2.5 互動控制
- 拖曳力源（質量點/電荷點）實時改力場配置
- 每力權重滑桿 w_i + 開關
- 力律 select（F_L：導引/自訂；F_X：公式槽）
- 尾跡長度、粒子數滑桿
- 重用 obs_line_x / sweep：掃過時睇三層點樣反應

### 2.6 哲學對應
- L0/L1 = 潛在原因地圖（pending causes）：多種力同在，未作最終判斷
- L2 = 判斷過程（evaluation in flight）：淨力逐刻做決定，dominance 記錄邊把聲大
- L3 = 已提交結果（committed）：前端唯一該呈現嘅事實

---

## 3. 引擎介面（Rust 側設計）

```rust
pub trait Force {
    fn field(&self, pos: [f32; 2], t: f32, ctx: &FieldCtx) -> [f32; 2];
    fn hue(&self) -> [f32; 3];
}
pub struct Guidance;   // F_L
pub struct Gravity;    // F_G: sources = masses
pub struct Coulomb;    // F_E: sources = charges
pub struct Boundary;   // F_B
pub struct Custom;     // F_X

pub struct Source { pub pos: [f32; 2], pub strength: f32, pub kind: u32 }
pub struct Registry { pub weights: [f32; 5], pub on: [bool; 5] }

pub struct Particle {
    pub pos: [f32; 2], pub vel: [f32; 2],
    pub trail_hue: u32,   // dominance index at spawn of last trail seg
    pub alive: bool,
}
```

- `WaveEngine` 加：`sources` 列表、`set_weight(i, w)`、`spawn(n)`、`step_force(dt)`
- 淨力 `F_net = Σ w_i·F_i`；半隱式歐拉；速度上限防爆
- 上傳 buffers：`sources`、`force_grid`（每力+淨力，48×48×(5+1)×2 f32）、
  `trails`（x, y, hue, age，16-byte 對齊）、沿用 `commits`

---

## 4. 檔案計劃（代碼）

| 檔 | 動作 | 內容 |
|---|---|---|
| `src-rs/src/force.rs` | 新增 | Force trait、五力、Registry、積分器、dominance |
| `src-rs/src/sources.rs` | 新增 | Source 列表、拖曳 API、force_grid 計算 |
| `src-rs/src/lib.rs` | 修改 | 接 spawn / step_force / 各 ptr / set_weight |
| `src/render/wave_blend.wgsl` | 修改 | L0 光暈、L1 箭頭（含淨力白層）、L2 dominance 尾跡 |
| `src/main.ts` | 修改 | 拖曳力源、權重滑桿、模式切換、buffers 上傳 |
| `index.html` | 修改 | 模式 radio、力開關、權重滑桿 |
| `docs/PROJECT_PLAN.md` | 本文件 | 總計劃（v2） |
| `docs/research/README.md` | 新增 | 光理論派系調查索引＋三問方法論 |
| `docs/research/01–10*.md` | 新增 | 九大派系＋假說 H 定位檔 |
| `docs/research/11–12*.md` | 新增 | 組合框架（通道+K）＋投影框架（圖冊+膠合） |
| `docs/engineering/README.md` | 新增 | 兩級工程模型（架構師/工程師分離）＋交接協定 |
| `docs/engineering/01–04*.md` | 新增 | 公式分解卡／架構契約 v1／操作 runbook／追溯矩陣 |
| `docs/implementation/README.md` | 新增 | 統一模板＋依賴圖＋STEP 規則 |
| `docs/implementation/STEP-*.md` | 新增 | 八份里程碑實施步驟（M-S1/M1/M2/M-S2/M3/M4/M-S3/M5） |
| `docs/EXPERIMENTS.md` | 未來 | 對決與交互實驗記錄（M5 起） |

---

## 5. 里程碑

| 里程碑 | 內容 | 完成定義 |
|---|---|---|
| M0 | 現狀：Born 雙縫 + 直方圖 + 上線 | 已完成 |
| M-S1 | 場景系統：Scene 描述＋n/mask buffers＋preset loader；preset 1/3/5（影、色散、雙縫） | 三場景可切換、求解器場景中立 |
| M-S2 | 維度階梯 D=1..4＋偏振分量＋docent 解說層（SCENES §5） | 四格並跑見尾跡差異；Malus 過關 |
| M-S3 | 環境網格批次 runner＋統一矩陣 M-unity（SCENES §6 同時接納） | 一列全綠可判定；改全局參數全矩陣同動 |
| M1 | 粒子 + 尾跡 + 單一重力井 | 見到光被星拗彎 |
| M2 | Registry + 多力疊加 + dominance 染色 | 尾跡變色可見 |
| M3 | 拖曳力源 + 權重滑桿 + L0/L1 層 | 宇宙可玩 |
| M4 | 力—力交互（重力 lensing 波場） | 條紋隨星移動而彎 |
| M5 | M-duel + F_X 自訂槽 + EXPERIMENTS.md | 對決可記 |

---

## 6. 驗證協定（沿用已立規則）

1. 唔起長駐 server；驗證只用 `cargo check` / `wasm-pack` / `tsc` / `vite build`，完即停。
2. 見到 `Backend ready / 2+2=4 / webgpu: ready` 即停手回報。
3. 畫面驗證用 headless Chrome 一次性截圖（軟 GPU 攞唔到 adapter 時如實報告）。
4. 部署：build → commit → subtree split → push gh-pages。

---

## 7. 風險

- 數值穩定：多力疊加易爆積分 → 限 dt、限速度、力軟核（r²+ε²）。
- 效能：force_grid 粗網格化（48×48）+ 尾跡點上限常數化。
- 視覺混亂：五層全開會糊 → 預設只開 F_L+F_G，其餘逐個加；L1 預設淨力層。
- 解讀風險：duel 輸咗 ≠ 假說全死，只代表該力組合過唔到雙縫關；
  文件與 UI 文案避免「證偽=全盤否定」嘅誤導。
