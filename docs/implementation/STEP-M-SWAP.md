# STEP-M-SWAP：力槽交換＋3D 源操作六項＋時間反演
依賴：M-3D｜預估：中｜卡：S-SLOT, S-REV｜契約：配置 JSON schema 請求

## 0 目標
四槽律可選可 swap；源可 3D 拖曳/深度/加刪/反轉；kick；時間反演；配置存讀。
完成圖：swap guid↔grav 後尾跡行為即時互換；T 鍵波場倒放回初態。

## 1 前置
- S-SLOT/S-REV 卡；配置 schema（sources/slots/weights/globals/camera）。
- 反演回合測試規格（ε<1e-3）。

## 2 實作步驟
1. lib.rs：slots: [LawId;4]；swap_slots(i,j)；law 枚举含 vortex（切向力）與 custom-expr 槽。
2. lib.rs：sources 擴至 6；set_source_depth；flip_sign；add/remove；kick(impulse)；
   reverse_time()（pre↔cur 交換＋粒子 v 反轉＋trails 倒放指針）。
3. lib.rs：config_json() / load_config(json) round-trip。
4. main.ts：slot 下拉×4＋swap 鈕（i,j select）；源 gizmo：click 選→drag 平面＋Q/E 深度；
   X 刪、C 加、V 反轉、K kick、T 反演；S/L 存讀（localStorage＋download）。
5. 快捷鍵併入 help overlay；docent 加 swap/反演解說。

## 3 契約影響
請求 v4：sources buffer（6×16B）＋slots uniform 欄；config schema 入 02 附錄。

## 4 驗證
03 四步＋unit：swap 不變性（等權交換 net 不變）、JSON round-trip、反演回合 ε。
playwright：swap 前後截圖對比＋反演回合截圖（t0 vs rev-end）。

## 5 驗收
- 04 行 S-SLOT/S-REV 轉 ✓；TESTS.md 快捷鍵表更新；EXPERIMENTS 加 swap/反演 entry。

## 6 回滚/隔離
flag `swap_enabled`；反演獨立鍵無副作用。
完成紀錄：—
