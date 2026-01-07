import torch
import torch.nn as nn
from torchvision import models

def get_model(config):
    """
    Mock factory to load a model. 
    In a real scenario, this would load weights from 'best_model.pth'.
    """
    # Using ResNet18 for lightweight demo purposes, mapping to config usually
    model = models.resnet18(weights=models.ResNet18_Weights.DEFAULT)
    num_ftrs = model.fc.in_features
    model.fc = nn.Linear(num_ftrs, config.get('num_classes', 2))
    
    # Mock loading weights if file existed
    # if os.path.exists("best_model.pth"):
    #     model.load_state_dict(torch.load("best_model.pth", map_location='cpu'))
    
    model.eval()
    return model
