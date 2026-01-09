# Issue 1: ML推論APIサーバーの構築と学習済み重みの実装

## 概要
既存の学習済み重み（`outputs/best_model.pth`想定）を使用し、X線画像の病変分類とGrad-CAMによる可視化を行うFastAPIサーバーを構築する。
`prj-NIH-Chest-X-ray-GradCam`由来の学習ロジックを活用しつつ、推論時はHydra(`conf/`)への依存を排除する。

## 提供資料
'pretrain_information/'ディレクトリにprj-NIH-Chest-X-ray-GradCamで使用していたyamlファイルとbest_model.pthを格納している。`prj-NIH-Chest-X-ray-GradCam`では三つのモデルを使用しているので、このアプリでもそれぞれのモデルに対応できるようにしてください。今回格納にしているのはdensenet121のみ、詳細はpretrain_information/.hydraを確認
# 注意！
本番ではここにモデルやyamlファイルを置きたくないので適切な場所にモデルの重みを格納できるように定義してください。

## 詳細タスク

### 1. ディレクトリと環境構築
- [ ] プロジェクトルート直下に `api/` ディレクトリを作成する。
- [ ] `api/Dockerfile` を作成し、PyTorch, Torchvision, FastAPI, Uvicorn, Python-multipart 等の必要ライブラリをインストールする。
- [ ] `docker-compose.yml` にAPIサービス（Port 8000）を追加する。

### 2. 推論ロジックの実装 (`api/main.py`)
- [ ] **Configのハードコード化**: `src.models.factory` 等が要求する設定値（モデル名、クラス数など）をPython辞書やクラスで定義し、Hydraを経由せずにモデルを初期化できるようにする。
- [ ] **モデルロード**: サーバー起動時（Lifespan event等）に学習済み重み（`.pth`）をロードし、メモリ上に保持する。
- [ ] **既存コードの再利用**: `src/` ディレクトリのモジュール（前処理、モデル定義、Grad-CAM実装）を正しくインポートできるようにパスを設定する。

### 3. APIエンドポイントの実装
- [ ] `POST /predict` エンドポイントを作成する。
    - **Input**: 画像ファイル (`UploadFile`)
    - **Process**:
        1. 画像の前処理（Resize, Normalize等）。
        2. モデルによる推論（確率計算）。
        3. Grad-CAMによるヒートマップ生成と元画像への重ね合わせ。
    - **Output**: JSON形式
        ```json
        {
          "probabilities": { "class_name": 0.95, ... },
          "gradcam_image": "base64_encoded_string_or_url",
          "prediction": "Main Class Name"
        }
        ```

## 完了条件
- `docker-compose up` でAPIサーバーが正常に起動すること。
- cURLやPostman等で画像をPOSTし、推論結果とGrad-CAM画像が返却されること。
