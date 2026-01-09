# Medical Image Diagnosis Support App (Inference Prototype)

FastAPI (Backend) と Next.js (Frontend) を使用した医用画像診断支援AIのプロトタイプアプリケーションです。
X線画像をアップロードすると、学習済みモデル (`densenet121` 等) を用いて病変確率を予測し、Grad-CAMによる判断根拠の可視化を行います。

## 📖 概要

*   **推論機能**: アップロードされた画像に対して病変分類を行い、確率を表示。
*   **可視化**: Grad-CAMを用いて、AIが画像のどの部分に注目したかをヒートマップ表示。
*   **アーキテクチャ**:
    *   **Backend**: FastAPI, PyTorch (CPU-optimized for demo), Docker
    *   **Frontend**: Next.js (App Router), Tailwind CSS v4
    *   **Infrastructure**: Supabase (Auth, Database, Storage)

## 📂 ディレクトリ構成

```text
.
├── api/                # FastAPI サーバー (Docker)
│   ├── main.py         # エントリーポイント
│   └── Dockerfile      # Backend用 Dockerfile (CPU PyTorch)
├── web/                # Next.js フロントエンド (Docker)
├── src/                # 共通MLモジュール (モデル定義, Grad-CAM)
├── outputs/            # 学習済み重み配置場所 (.pth)
├── supabase/           # Supabase 設定用SQL
└── docker-compose.yml  # コンテナ構成定義
```

## 🚀 セットアップと起動方法

### 前提条件
*   Docker Desktop がインストールされ、起動していること。
*   Supabase プロジェクトが作成済みであること（オプション：DB保存機能を使う場合）。

### 1. モデル重みの配置
学習済みの重みファイル（`.pth`）を `outputs/` ディレクトリに配置してください。
デフォルトでは `outputs/best_model.pth` を読み込みます。

> **Note**: 現在の構成では `pretrain_information/.hydra/best_model.pth` を `outputs/best_model.pth` として移動・配置済みです。

### 2. 環境変数の設定 (Frontend)
`web/.env.local` ファイルを作成（または編集）し、Supabaseの接続情報を設定してください。
※推論機能のみの確認であれば、デフォルト値のままでも動作する場合がありますが、DB保存機能などは失敗します。

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 3. アプリケーションの起動
以下のコマンドで Backend (API) と Frontend (Web) を起動します。

```bash
docker compose up --build
```
*   初回ビルド時は時間がかかります。
*   APIサーバーはCPU版PyTorchを使用するため、軽量かつGPUなし環境でも動作します。

### 4. 利用方法
1.  ブラウザで [http://localhost:3000](http://localhost:3000) にアクセスします。
2.  画面上のエリアにX線画像をドラッグ＆ドロップします。
3.  「Run Diagnosis」ボタンをクリックすると、解析結果が表示されます。

## ⚙️ 詳細設定

### モデルの切り替え
デフォルトでは `densenet121` が使用されます。モデルを変更したい場合は、`docker-compose.yml` の `api` サービスの環境変数を変更してください。

```yaml
services:
  api:
    environment:
      - MODEL_NAME=resnet50  # または 'densenet121', 'efficientnet'
```
※ 対応するモデル構造と重みファイルが整合している必要があります。現在は `densenet121` 向けの重みが配置されています。

### バックエンド API
*   Docs: [http://localhost:8000/docs](http://localhost:8000/docs)
*   Health Check: [http://localhost:8000/health](http://localhost:8000/health)

## 🛠 開発者向け情報

*   **Tailwind CSS**: v4 を使用しています。設定はCSSファイル内 (`web/app/globals.css`) に記述されており、`tailwind.config.ts` は不要です。
*   **Hydra**: 推論専用APIのため、学習設定 (`conf/`) への依存は排除されています。