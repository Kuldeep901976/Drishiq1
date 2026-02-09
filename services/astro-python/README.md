# Astro Python Service

Lightweight HTTP service for astro timing computation. Swiss Ephemeris integration is planned; this is the service skeleton and contract only.

## Install dependencies

From this directory:

```bash
pip install -r requirements.txt
```

Or with a virtual environment:

```bash
python -m venv .venv
.venv\Scripts\activate   # Windows
# source .venv/bin/activate  # macOS/Linux
pip install -r requirements.txt
```

## Run locally

Copy environment template and set port (optional):

```bash
copy .env.example .env
```

Start the service:

```bash
uvicorn app:app --host 0.0.0.0 --port %PORT%
```

On Windows PowerShell, if `PORT` is in `.env`, run:

```powershell
$env:PORT = 5001; uvicorn app:app --host 0.0.0.0 --port $env:PORT
```

Or use the default port 5001:

```bash
uvicorn app:app --host 0.0.0.0 --port 5001
```

## Example request

**Health check:**

```bash
curl http://localhost:5001/health
```

**Compute (placeholder):**

```bash
curl -X POST http://localhost:5001/astro/compute ^
  -H "Content-Type: application/json" ^
  -d "{\"dob_date\":\"1990-05-15\",\"dob_time\":\"14:30\",\"latitude\":40.7128,\"longitude\":-74.0060,\"timezone\":\"America/New_York\",\"problem_context\":\"sample\",\"uda_summary\":\"sample\"}"
```

Linux/macOS (single-line body):

```bash
curl -X POST http://localhost:5001/astro/compute \
  -H "Content-Type: application/json" \
  -d '{"dob_date":"1990-05-15","dob_time":"14:30","latitude":40.7128,"longitude":-74.0060,"timezone":"America/New_York","problem_context":"sample","uda_summary":"sample"}'
```
