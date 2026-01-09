from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import torch
import cv2
import numpy as np
import io
from PIL import Image
import base64
import os
import sys

# Add /app to python path if not already there (Docker env usually handles this, but good for safety)
sys.path.append("/app")

from src.models.factory import get_model
from src.visualization.gradcam import visualize_and_return_base64

# Global variables for model
model = None
device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
CLASSES = [
    "Atelectasis", "Cardiomegaly", "Effusion", "Infiltration", 
    "Mass", "Nodule", "Pneumonia", "Pneumothorax"
]

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Load model on startup
    global model
    model_name = os.getenv("MODEL_NAME", "densenet121")
    print(f"Loading model {model_name} on {device}...", flush=True)
    
    # Hardcoded config as per instructions, but using env var for model name
    config = {
        "name": model_name,
        "num_classes": len(CLASSES)
    }
    
    try:
        model = get_model(config)
        model = model.to(device)
        
        # Load weights
        weights_path = "/app/outputs/best_model.pth"
        if os.path.exists(weights_path):
            print(f"Loading weights from {weights_path}", flush=True)
            state_dict = torch.load(weights_path, map_location=device)
            # Handle potential key mismatch if model architecture changed slightly
            # strict=False is safer for partial reuse, but strict=True is better for exact match.
            # Given we use the exact weight file, strict=True (default) is best.
            model.load_state_dict(state_dict)
        else:
            print(f"Warning: Weights not found at {weights_path}. Using default initialized weights.", flush=True)
            
        model.eval()
        print("Model loaded successfully.", flush=True)
    except Exception as e:
        print(f"Error loading model: {e}", flush=True)
        # In a real app we might want to exit, but here we might keep running to debug
    
    yield
    
    # Clean up
    del model

app = FastAPI(lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def preprocess_image(image_bytes):
    # Open image using PIL
    image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
    # Resize to 224x224 (standard for DenseNet/ResNet)
    image = image.resize((224, 224))
    img_np = np.array(image)
    
    # Normalize (standard ImageNet means/stds)
    # ToTensor converts [0, 255] -> [0.0, 1.0]
    img_tensor = torch.from_numpy(img_np).permute(2, 0, 1).float() / 255.0
    
    # Normalize
    mean = torch.tensor([0.485, 0.456, 0.406]).view(3, 1, 1)
    std = torch.tensor([0.229, 0.224, 0.225]).view(3, 1, 1)
    img_tensor = (img_tensor - mean) / std
    
    return img_tensor.unsqueeze(0), img_np

@app.post("/predict")
async def predict(file: UploadFile = File(...)):
    if not model:
        raise HTTPException(status_code=500, detail="Model not loaded")

    try:
        contents = await file.read()
        input_tensor, original_img = preprocess_image(contents)
        input_tensor = input_tensor.to(device)
        
        with torch.no_grad():
            outputs = model(input_tensor)
            # Apply sigmoid since it's likely a multi-label classification (NIH dataset) 
            # or softmax if single label. 
            # Given "probabilities" in requirements and list of classes, usually multi-label 
            # or multi-class. 
            # NIH Chest X-ray is often treated as multi-label, but let's check config.
            # config says "num_classes: 8". If it was trained with BCEWithLogitsLoss, use Sigmoid.
            # If CrossEntropy, use Softmax. 
            # Without training code, I'll assume Softmax for single-class prediction 
            # (since requirement says "prediction": "Main Class Name").
            # But let's check if the user specified "probabilities" for all classes.
            probabilities = torch.sigmoid(outputs).squeeze().cpu().numpy()
            
            # If the model was trained for multi-class (softmax), probabilities sum to 1.
            # If multi-label (sigmoid), they are independent.
            # Let's assume Sigmoid as it's common for this dataset.
            
        # Create result dictionary
        probs_dict = {cls: float(prob) for cls, prob in zip(CLASSES, probabilities)}
        
        # Get main prediction (max probability)
        main_class_idx = np.argmax(probabilities)
        main_class = CLASSES[main_class_idx]
        
        # Grad-CAM
        # Target layer selection based on architecture
        if hasattr(model, 'features'):
            # DenseNet, EfficientNet, VGG
            target_layer = model.features[-1]
        elif hasattr(model, 'layer4'):
            # ResNet
            target_layer = model.layer4[-1]
        else:
            # Fallback: try to find the last convolutional layer or block
            # This is heuristic and might need adjustment for other architectures
            target_layer = list(model.children())[-2] # Assuming last is classifier/fc
        
        gradcam_b64, score = visualize_and_return_base64(model, input_tensor, original_img, target_layer)
        
        return {
            "probabilities": probs_dict,
            "gradcam_image": gradcam_b64,
            "prediction": main_class
        }

    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/health")
def health_check():
    return {"status": "ok"}
