import json
import base64
import io
import os
import torch
from torchvision import transforms
from PIL import Image
import numpy as np
from src.models.factory import get_model
from src.visualization.gradcam import visualize_and_return_base64

# Global model cache for warm starts
model = None

def load_model_if_needed():
    global model
    if model is None:
        # Simple config dict mock
        config = {'num_classes': 2} 
        model = get_model(config)
        # Assuming we want to visualize the last conv layer of resnet18
        # In resnet, usually layer4 is the last block
    return model

def handler(event, context):
    try:
        # 1. Parse Input
        body = event.get('body', '{}')
        if isinstance(body, str):
            body = json.loads(body)
        
        image_data = body.get('image')
        if not image_data:
            return {
                'statusCode': 400,
                'body': json.dumps({'error': 'No image provided'})
            }

        # Handle base64 header if present (e.g., "data:image/jpeg;base64,....")
        if ',' in image_data:
            image_data = image_data.split(',')[1]
            
        # Decode image
        image_bytes = base64.b64decode(image_data)
        image = Image.open(io.BytesIO(image_bytes)).convert('RGB')
        
        # 2. Preprocess
        # Standard ResNet normalization
        preprocess = transforms.Compose([
            transforms.Resize((224, 224)),
            transforms.ToTensor(),
            transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225]),
        ])
        
        tensor_img = preprocess(image).unsqueeze(0) # Batch dim
        
        # 3. Model Inference
        loaded_model = load_model_if_needed()
        
        # 4. Visualization (Grad-CAM)
        # Target layer for ResNet18: layer4[-1]
        target_layer = loaded_model.layer4[-1]
        
        # Convert original image to numpy for visualization overlay
        # Resize original to 224x224 to match tensor
        image_np = np.array(image.resize((224, 224)))
        
        gradcam_b64, score = visualize_and_return_base64(loaded_model, tensor_img, image_np, target_layer)
        
        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*' # CORS
            },
            'body': json.dumps({
                'score': score,
                'gradcam_image': f"data:image/png;base64,{gradcam_b64}"
            })
        }
        
    except Exception as e:
        print(f"Error: {str(e)}")
        return {
            'statusCode': 500,
            'body': json.dumps({'error': str(e)})
        }
