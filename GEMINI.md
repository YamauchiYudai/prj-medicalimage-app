# GEMINI.md

## コンテキスト

私はMLエンジニアであり、現在ローカルPC上の以下のディレクトリで開発を行っています。
**プロジェクトルート**: `C:\Users\yudai\OneDrive\Desktop\prj-medicalimage-app`

このディレクトリには、医療画像分類（バックエンド）のコードと学習済みの重みファイルが存在します。
これらを活用し、就職活動のポートフォリオとなるWebアプリケーション（推論専用）を作成したいと考えています。

**重要な前提**:
このプロジェクトでは**モデルの学習は行いません**。学習済みの重みを使って推論することのみを目的とします。
したがって、学習設定用の `conf/` ディレクトリ（Hydra設定ファイル群）は使用せず、推論に必要な設定はコード内で最小限に定義する方針とします。

## 目標

ユーザーがX線画像をアップロードすると、AIが病変確率を解析し、判断根拠（Grad-CAM）を可視化して表示するWebアプリを構築する。

## 技術スタック

* **Infrastructure**: Supabase (Auth, Database, Storage)
* **Frontend**: Next.js (App Router), Tailwind CSS
* **Backend (ML API)**: FastAPI, PyTorch, Docker (既存Pythonコードを活用)

## ディレクトリ構成

現在のプロジェクトルート直下に、以下の構成でディレクトリを追加・構築してください。

```text
prj-medicalimage-app/ (Current Root)
├── api/                # [新規] FastAPIサーバー (Dockerで動作)
├── web/                # [新規] Next.js フロントエンド
├── src/                # [既存] MLモデル・前処理ロジック (confは使わずここを参照)
├── outputs/            # [既存] 学習結果（best_model.pth等）
└── ...

```

---

## 実装ステップ

### Step 1: ML推論 APIサーバーの構築 (`api/`)

プロジェクトルート直下に `api/` ディレクトリを作成し、既存の `src/` コードを呼び出すFastAPIサーバーを構築してください。

1. **環境構築**:
* `api/Dockerfile` を作成。`fastapi`, `uvicorn`, `python-multipart`, `torch`, `torchvision` 等、推論に必要なライブラリをインストールする記述を行う。
* `docker-compose.yml` を更新し、APIサービス（Port 8000）を追加。


2. **実装 (`api/main.py`)**:
* **Configの廃止**: Hydra (`conf/`) は使用しないこと。`src.models.factory.get_model` が `cfg` オブジェクトを要求する場合は、必要な属性（`model.name`, `dataset.num_classes` 等）を持ったシンプルなクラスや辞書をPythonコード内で作成して渡すこと（ハードコーディング可）。
* **モデルロード**: サーバー起動時に `outputs/` ディレクトリ等にある学習済み重み（`.pth`）を一度だけロードする。
* **エンドポイント**: `POST /predict`
* **処理**:
1. 画像ファイルを受け取る。
2. 学習済みモデルで推論し、確率を計算する。
3. Grad-CAM画像を生成する。
4. 結果（確率と、Base64エンコードされた画像または画像URL）をJSONで返す。





### Step 2: Supabase 設計と連携

Supabaseのプロジェクト設定に必要なSQLを作成してください。

1. **Database**:
* `inference_logs` テーブル: ユーザーID、画像パス、推論結果JSON、作成日時などを記録。


2. **Storage**:
* `xray-images` バケット: ユーザーごとにディレクトリを分けて画像を保存。RLSポリシーでセキュリティを確保。



### Step 3: フロントエンドの実装 (`web/`)

プロジェクトルート直下に `web/` ディレクトリを作成（`npx create-next-app@latest`）し、UIを構築してください。

1. **構成**: Next.js (App Router), TypeScript, Tailwind CSS。
2. **機能**:
* **Supabase Auth**: ログイン・サインアップ機能。
* **画像アップロード**: ドラッグ＆ドロップでX線画像をアップロード。
* **API連携**: 画像を `api/` (FastAPI) へ送信し、解析結果を取得。
* **結果表示**:
* 元画像とGrad-CAM画像の表示。
* 病変確率のグラフ表示。





## 制約事項

* **学習機能の除外**: 学習ループやHydraの設定ファイル読み込み処理は含めないこと。あくまで「推論アプリケーション」として構築する。
* **パスの扱い**: Dockerコンテナ内パスとホストパスを混同しないよう注意。
* **既存コードの利用**: `src/models` や `src/visualization` は有用なので、`sys.path` を通すなどしてインポートして利用すること。

## 開発フローへの指示

まずは **Step 1: ML推論 APIサーバー** の構築から開始してください。
`docker-compose up` でAPIサーバーが起動し、Hydraを使わずにモデルが正しくロードされ、`curl` 等で推論リクエストが成功することを確認してから、フロントエンドの実装に移ってください。