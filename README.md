# Medical Image Diagnosis Support App (Prototype)

AWS Lambda（サーバーレス）での運用を想定した、医用画像診断支援AIのプロトタイプアプリケーションです。
Next.js によるフロントエンドと、PyTorch による推論・可視化（Grad-CAM）を行うバックエンドで構成されています。

## 📖 概要

アップロードされた医用画像（デモでは任意の画像）に対してAIが診断を行い、以下の結果を表示します。
1.  **診断スコア**: モデルが算出した確信度。
2.  **Grad-CAM 可視化**: AIが画像の「どこ」を見て判断したかをヒートマップで可視化した画像。

**※注意**: 本環境はデモ用のため、モデルは一般的な `ResNet18`（ImageNet事前学習済み）を使用しており、実際の医療診断機能は持ちません。

## 🏗 システム構成

開発環境は Docker Compose 上で完結しており、本番環境の AWS アーキテクチャを模倣しています。

- **Frontend**: Next.js 14 (App Router), TypeScript, Tailwind CSS
- **Backend**: Python 3.10, PyTorch, Hydra, Matplotlib (AWS Lambda Container Image)
- **Infrastructure**: Docker (Local), AWS Lambda/S3/Amplify (Target)

## 🚀 セットアップと起動方法

### 前提条件
- Docker Desktop がインストールされ、起動していること。

### 起動手順

1. **リポジトリのクローン**（またはディレクトリへの移動）
    ```bash
    cd prj-medicalimage-app
    ```

2. **Docker コンテナのビルドと起動**
    ```bash
    docker compose up --build
    ```
    * 初回はイメージのダウンロードとビルドに数分かかります。

3. **アプリケーションへのアクセス**
    ブラウザで以下のURLを開いてください。
    * [http://localhost:3000](http://localhost:3000)

4. **利用方法**
    * 画面中央のエリアに画像をドラッグ＆ドロップ（またはクリックして選択）します。
    * 「Run Diagnosis」ボタンをクリックすると、数秒後に診断結果とGrad-CAM画像が表示されます。

## 🛠 開発者向け情報

### ディレクトリ構成
```
.
├── conf/                 # Hydra設定ファイル (Backend)
├── src/                  # AI/ML ソースコード (Backend)
│   ├── models/           # モデル定義
│   └── visualization/    # Grad-CAM 可視化ロジック
├── frontend/             # Next.js アプリケーション
├── lambda_handler.py     # Lambda エントリーポイント
├── Dockerfile            # Backend用 Dockerfile
└── docker-compose.yml    # ローカル開発環境定義
```

### トラブルシューティング

**Q. `Cannot find module ...` のようなエラーが出る**
コンテナ内の `node_modules` がホストと同期されていない可能性があります。以下を実行してください。
```bash
docker compose run --rm frontend npm install
docker compose restart frontend
```

**Q. 初回アクセス時にページが表示されない**
Next.js のコンパイルが走っているため、起動直後は表示まで少し時間がかかります。コンソールのログを確認し、`Ready in ...` と表示されてからリロードしてください。
