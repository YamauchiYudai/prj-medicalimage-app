FROM public.ecr.aws/lambda/python:3.10

# Copy requirements
COPY requirements.txt ${LAMBDA_TASK_ROOT}

# Install PyTorch CPU version specifically to reduce size
RUN pip install --no-cache-dir torch torchvision --index-url https://download.pytorch.org/whl/cpu
# Install other requirements
RUN pip install --no-cache-dir -r requirements.txt

# Copy function code
COPY src/ ${LAMBDA_TASK_ROOT}/src/
COPY conf/ ${LAMBDA_TASK_ROOT}/conf/
COPY lambda_handler.py ${LAMBDA_TASK_ROOT}/

# Set the CMD to your handler (could also be done as a parameter override outside of the Dockerfile)
CMD [ "lambda_handler.handler" ]
