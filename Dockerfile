FROM python:3.12-slim

# System deps for WeasyPrint (text shaping + fonts + render libs)
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libcairo2 \
    libpango-1.0-0 \
    libpangoft2-1.0-0 \
    libharfbuzz0b \
    libfribidi0 \
    libgdk-pixbuf-2.0-0 \
    libxml2 \
    libxslt1.1 \
    libffi8 \
    shared-mime-info \
    fonts-dejavu-core \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app
ENV PYTHONPATH=/app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

ENV PORT=8000
CMD ["python", "-m", "uvicorn", "apps.backend.app.main:app", "--host", "0.0.0.0", "--port", "8000"]
