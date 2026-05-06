# Morpha (モルファ)

Morphaは、インディーゲーム開発者向けの「圧倒的に手軽な」独自2Dキャラクターアニメーションシステムです。
「最小限のパーツ分け（または1枚絵）」に対して「ボーン制御」と「深度マップ(Depth Map)による疑似3D変形」を組み合わせたハイブリッド変形システムを提供します。

## プロジェクト構成 (Monorepo)

本プロジェクトは npm workspaces を利用した Monorepo 構成を採用しています。

- `apps/editor`: **Morpha Studio** (Webベースのアニメーションエディタ / Vue 3, Nuxt 3)
- `packages/core`: **Core Types** (共通のデータ構造・型定義など)
- `packages/web-runtime`: **Web Runtime** (Webブラウザ向けWebGL描画・再生ランタイム)
- `packages/unity-runtime`: **Unity Runtime** (Unity 6向け高パフォーマンス再生ランタイム / C#, Job System, Burst Compiler)

## 開発の始め方

リポジトリルートで以下のコマンドを実行し、依存関係をインストールします。

```bash
# 全てのワークスペースの依存関係をインストール
npm install
```

### Morpha Studio (エディタ) の起動

```bash
npm run dev -w @morpha/editor
```
ブラウザで `http://localhost:3000` を開きます。

### コアパッケージのビルド

```bash
npm run build -w @morpha/core
```

## 現在の実装状況

### 🎨 Morpha Studio (Editor)
- [x] UIの基本レイアウト・コンポーネント構築 (Canvas, Parameters, Parts, Timeline)
- [x] プロジェクト状態のストア管理 (Pinia)
- [x] 画像アセット（パーツ）のインポート
- [x] 深度マップ (Depth Map) のインポートとパーツへの割り当て
- [ ] プロジェクトファイル (`.morpha_proj`) のロード・セーブ機構
- [ ] ボーン (Bone) の追加・編集・パーツへのバインドUI
- [ ] タイムライン上でのキーフレーム編集・アニメーション作成機能

### 🌐 Web Runtime
- [x] WebGL描画パイプラインの基礎構築
- [x] 階層構造（親子関係）に基づく座標変換処理
- [x] 深度マップ (Depth Map) を用いた疑似3D変形（パララックス効果）の実装
- [ ] ボーン(Bone)変形の計算および描画反映

### 🎮 Unity Runtime
- [ ] プロジェクト（パッケージ）のセットアップ
- [ ] C# (Job System, Burst Compiler) による高パフォーマンスな変形計算処理の実装
- [ ] Shader Graphを用いた描画パイプラインの構築

### 📦 Core (共通)
- [x] 基本的なデータフォーマット（Rig, Part, Bone, Animation等）の型定義
