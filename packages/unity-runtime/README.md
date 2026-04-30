# Morpha Unity Runtime

Morphaシステムで作成されたアニメーションを、Unity上で高パフォーマンスに再生するためのランタイムです。

## 技術スタック・最適化
- **Unity 6** (6000.x 以降推奨)
- **Unity Job System / Burst Compiler:** ボーン計算およびメッシュ頂点変形のマルチスレッド高速化
- **Shader Graph:** 深度マップ(Depth Map)を利用した疑似3D描画

## 使い方（予定）
1. Morpha Studio から `.morpha_proj` またはエクスポート用JSONを出力
2. 本パッケージ（Unityパッケージ）をプロジェクトにインポート
3. MorphaImporterを利用してアセットを生成
4. `MorphaRenderer` コンポーネントにセットして再生
