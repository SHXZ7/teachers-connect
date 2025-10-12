# Use lightweight Python image
FROM python:3.10-slim

# Set working directory
WORKDIR /app

# Copy backend source code
COPY backend ./backend

# Copy requirements file
COPY backend/requirements.txt ./requirements.txt

# Install dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Expose Hugging Face's expected port
EXPOSE 7860

# Start FastAPI app
CMD ["uvicorn", "backend.main:app", "--host", "0.0.0.0", "--port", "7860"]
