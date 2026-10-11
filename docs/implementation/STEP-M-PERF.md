# STEP-M-PERF：效能軌 P1-P3（P4/P5 stretch 另議）
依賴：無（可即刻開工）｜預估：P1 小／P2 中／P3 中｜卡：S-ZEROCOPY, S-GOV, S-RASTER

## 0 目標
弱機可跑：零拷貝零分配；governor 自動降階；無 WebGPU 仍有 Rust 光柵化畫面。
完成圖：perf 燈顯示階梯級；無 GPU 瀏覽器見到 2D 場畫面（非黑非 stub）。

## 1 前置
- 卡 S-ZEROCOPY/S-GOV/S-RASTER；資源憲法 I9-I12（02 §7）。
- 現況罪狀：wave_step 每步 2×to_vec；readF32 每幀 slice 拷貝×5。

## 2 實作步驟
1. P1a：Solver 加 scratch（new_re/new_im 預alloc reuse）；wave_step 簽名不變。
2. P1b：main.ts readF32 改返 view（唔 slice）；writeBuffer 食 view；
   memory.grow 保護：每幀開頭重取 view（廉價）。
3. P2：main.ts governor：ema(frame_ms)；階梯 state {res, render, substep, trailcap}；
   降/升規則 22ms/12ms；perf 燈 DOM（綠/黃/紅＋級名）；manual override select。
4. P3：lib.rs `raster_pixel_ptr/len`：Rust 將 2D 場（或 3D 中slice）rasterize 成 RGBA；
   main.ts：無 adapter 時 setInterval 30Hz 讀 pixel buffer→ImageData→2D canvas blit；
   UI 控制照舊（參數落 Rust）。

## 3 契約影響
請求 v4：pixel buffer 導出行；uniform 不變；governor 純 L3。

## 4 驗證
03 四步＋instrument：幀 alloc 計數（debug_assert 或 log）；
無 GPU 截圖（playwright 加 --disable-gpu 跑 P3 路）非黑；governor throttle 模擬。

## 5 驗收
- 04 行 S-ZEROCOPY/S-GOV/S-RASTER 轉 ✓。
- 弱機組合矩陣：{無GPU, SwiftShader, 真GPU} × {2D,3D} 全可跑（3D 待 M-3D1 後補驗）。

## 6 回滚/隔離
P3 路獨立 branch；governor off 開關；P1 純內部重構無 flag。
完成紀錄：—
