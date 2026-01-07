# 開発進捗ログ

## 2026-01-07
### Phase 1: Backend Refactoring for Serverless
- **サーバーレス対応**:
    - `src/visualization/gradcam.py`: ファイルシステムへの保存（`plt.savefig`）を廃止し、オンメモリ（`io.BytesIO`）で画像処理を行うように改修。Matplotlibのバックエンドを非GUIの `Agg` に設定。
    - `lambda_handler.py`: AWS Lambda形式のイベントを受け取るハンドラを作成。Base64エンコードされた画像を受け取り、推論結果とGrad-CAM画像をJSONで返却するロジックを実装。
- **コンテナ化**:
    - `Dockerfile`: `public.ecr.aws/lambda/python:3.10` をベースに作成。イメージサイズ削減のため、PyTorchはCPU版を指定してインストール。

### Phase 2: Frontend Setup
- **Next.js 環境構築**:
    - Docker接続エラーを回避するため、手動で Next.js 14 + TypeScript + Tailwind CSS のプロジェクト構造を構築。
    - 必要な設定ファイル（`package.json`, `tsconfig.json`, `tailwind.config.ts`, `postcss.config.js` 等）を作成。
- **機能実装**:
    - `app/page.tsx`: ドラッグ＆ドロップ対応の画像アップロードUIと、解析結果（スコア、Grad-CAMヒートマップ）表示コンポーネントを実装。
    - `app/api/predict/route.ts`: フロントエンドからバックエンドコンテナ（Lambda RIE）へリクエストを中継するBFF（Backend for Frontend）層を実装。

### Phase 3: Integration & Fixes
- **Docker Compose**:
    - `backend` (Python/Lambda) と `frontend` (Node.js) を連携させる `docker-compose.yml` を定義。
- **バグ修正**:
    - `frontend`: `autoprefixer` が依存関係から欠落していたことによるビルドエラーを修正（`package.json` への追加と再インストール）。
    - アプリケーションが正常に起動し、ブラウザ上で推論・可視化ができることを確認。
