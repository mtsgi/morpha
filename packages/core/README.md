# @morpha/core

Morphaアニメーションシステム全体で共有されるコアデータ仕様、型定義（TypeScript）を含みます。
エディタ（`@morpha/editor`）やWebランタイム（`@morpha/web-runtime`）から参照されます。

## 主な機能
- `.morpha_proj` （エディタ作業用プロジェクトファイル）の型定義
- `.morphamotion` （モーションデータ）の型定義
- `Bone`, `RigData`, `Track`, `Keyframe` などのコア構造体の定義

## ビルド

```bash
npm run build
```
（`tsc` を実行し、`dist/` に型定義ファイルを出力します）
