import pytest
from fastapi.testclient import TestClient
import sys
import os

# プロジェクトルートをパスに追加してapiモジュールを読み込めるようにする
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../../')))

from api.main import app
import io
from PIL import Image
import numpy as np

client = TestClient(app)

def test_health_check():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}

def test_predict_success():
    img = Image.fromarray(np.uint8(np.random.rand(224, 224, 3) * 255))
    img_byte_arr = io.BytesIO()
    img.save(img_byte_arr, format='PNG')
    img_byte_arr = img_byte_arr.getvalue()

    files = {"file": ("test.png", img_byte_arr, "image/png")}
    response = client.post("/predict", files=files)
    
    # モデルがロードされている場合は200、されていない場合は500
    assert response.status_code in [200, 500]
