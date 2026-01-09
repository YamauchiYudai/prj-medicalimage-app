import torch
import torch.nn as nn
from torchvision import models

def get_model(config):
    """
    Factory to load a model.
    """
    model_name = config.get('name', 'resnet18')
    num_classes = config.get('num_classes', 2)
    
    if model_name == 'densenet121':
        model = models.densenet121(weights=models.DenseNet121_Weights.DEFAULT)
        num_ftrs = model.classifier.in_features
        model.classifier = nn.Linear(num_ftrs, num_classes)
    elif model_name == 'resnet50':
        model = models.resnet50(weights=models.ResNet50_Weights.DEFAULT)
        num_ftrs = model.fc.in_features
        model.fc = nn.Linear(num_ftrs, num_classes)
    elif 'efficientnet' in model_name:
        # Defaulting to b0 for 'efficientnet' generic name, or handle variations if needed.
        # Assuming efficientnet_b0 for simplicity unless specific variant logic is added.
        model = models.efficientnet_b0(weights=models.EfficientNet_B0_Weights.DEFAULT)
        num_ftrs = model.classifier[1].in_features
        model.classifier[1] = nn.Linear(num_ftrs, num_classes)
    else:
        # Fallback to ResNet18
        model = models.resnet18(weights=models.ResNet18_Weights.DEFAULT)
        num_ftrs = model.fc.in_features
        model.fc = nn.Linear(num_ftrs, num_classes)
    
    model.eval()
    return model
