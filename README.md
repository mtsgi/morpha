# Morpha (モルファ)

Morphaは、インディーゲーム開発者向けの「圧倒的に手軽な」独自2Dキャラクターアニメーションシステムです。
Live2D等の代替を目指し、「最小限のパーツ分け（または1枚絵）」に対して「ボーン制御」と「深度マップ(Depth Map)による疑似3D変形」を組み合わせたハイブリッド変形システムを提供します。

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
