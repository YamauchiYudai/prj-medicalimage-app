FROM python:3.9-slim

WORKDIR /app

# Install system dependencies if needed (e.g., for opencv)
RUN apt-get update && apt-get install -y \
    libgl1 \
    libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir --default-timeout=100 \
    torch torchvision --index-url https://download.pytorch.org/whl/cpu && \
    pip install --no-cache-dir --default-timeout=100 \
    fastapi \
    uvicorn \
    python-multipart \
    opencv-python-headless \
    matplotlib \
    numpy

# Copy the application code
COPY api /app/api
COPY src /app/src
# We might need outputs or wherever the model is.
# For now, let's assume we mount volumes or copy what's needed.

# Set PYTHONPATH to include /app so we can import src
ENV PYTHONPATH=/app

CMD ["uvicorn", "api.main:app", "--host", "0.0.0.0", "--port", "8000"]
