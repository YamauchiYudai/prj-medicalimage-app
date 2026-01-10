import torch
import torch.nn.functional as F
import cv2
import numpy as np
import matplotlib.pyplot as plt
import io
import base64

# Ensure Agg backend is used for serverless environment (no GUI)
plt.switch_backend('Agg')

class GradCAM:
    """
    Minimal GradCAM implementation for demo.
    """
    def __init__(self, model, target_layer):
        self.model = model
        self.target_layer = target_layer
        self.gradients = None
        self.activations = None
        self.handlers = []
        
        # Register forward hook only
        # We use the forward hook to capture activation and register a hook on the tensor for gradients
        h = target_layer.register_forward_hook(self.forward_hook)
        self.handlers.append(h)

    def forward_hook(self, module, input, output):
        self.activations = output
        
        # Register hook on the tensor to capture gradients
        # This avoids the "inplace modification" error associated with register_full_backward_hook on modules
        def tensor_hook(grad):
            self.gradients = grad
        
        output.register_hook(tensor_hook)
        
        # Return a clone to prevent subsequent inplace operations (like ReLU(inplace=True))
        # from modifying the captured activation `self.activations` and breaking autograd checks.
        return output.clone()

    def remove_hooks(self):
        for h in self.handlers:
            h.remove()
        self.handlers = []

    def __call__(self, x, class_idx=None):
        # Forward pass
        output = self.model(x)
        if class_idx is None:
            class_idx = torch.argmax(output, dim=1)
        
        # Backward pass
        self.model.zero_grad()
        score = output[0, class_idx]
        score.backward()
        
        # Generate CAM
        if self.gradients is None or self.activations is None:
            # Fallback if hooks didn't fire (e.g. inference mode issue)
            return np.zeros((x.shape[2], x.shape[3])), 0.0

        gradients = self.gradients[0]
        activations = self.activations[0]
        weights = torch.mean(gradients, dim=(1, 2), keepdim=True)
        cam = torch.sum(weights * activations, dim=0).detach().cpu().numpy()
        cam = np.maximum(cam, 0)
        # Resize cam to image size
        cam = cv2.resize(cam, (x.shape[3], x.shape[2]))
        cam = cam - np.min(cam)
        cam_max = np.max(cam)
        if cam_max > 0:
            cam = cam / cam_max
        return cam, score.item()

def visualize_and_return_base64(model, tensor_img, original_img_np, target_layer):
    """
    Refactored visualization function:
    1. Generates Grad-CAM
    2. overlays on original image
    3. Returns base64 string instead of saving to file
    """
    grad_cam = GradCAM(model, target_layer)
    try:
        mask, score = grad_cam(tensor_img)
    finally:
        grad_cam.remove_hooks()
    
    heatmap = cv2.applyColorMap(np.uint8(255 * mask), cv2.COLORMAP_JET)
    heatmap = np.float32(heatmap) / 255
    
    # Resize original image to match heatmap if necessary, or vice versa
    # Assuming original_img_np is HxWxC 
    # tensor_img was likely normalized, so we use original_img_np for visualization
    cam_img = heatmap + np.float32(original_img_np) / 255
    cam_img = cam_img / np.max(cam_img)
    cam_img = np.uint8(255 * cam_img)
    
    # Matplotlib plotting to buffer
    fig = plt.figure(figsize=(10, 10))
    plt.imshow(cv2.cvtColor(cam_img, cv2.COLOR_BGR2RGB))
    plt.axis('off')
    
    # Save to memory buffer
    buf = io.BytesIO()
    plt.savefig(buf, format='png', bbox_inches='tight', pad_inches=0)
    plt.close(fig) # Close to free memory
    buf.seek(0)
    
    # Encode to base64
    img_base64 = base64.b64encode(buf.getvalue()).decode('utf-8')
    return img_base64, score
