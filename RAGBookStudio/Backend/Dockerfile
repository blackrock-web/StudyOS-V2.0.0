FROM python:3.11-slim

WORKDIR /app

# System deps for PyMuPDF / potential OCR
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libgl1 \
    libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*

COPY Backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy project
COPY Interfaces /app/Interfaces
COPY Core /app/Core
COPY Adapters /app/Adapters
COPY Backend /app/Backend
COPY Models /app/Models
COPY Plugins /app/Plugins

ENV PYTHONPATH=/app

EXPOSE 8000

CMD ["uvicorn", "Backend.app.main:app", "--host", "0.0.0.0", "--port", "8000"]
