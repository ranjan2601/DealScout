# Start backend FastAPI server (PowerShell)
# Usage: .\start_backend.ps1

# Load .env if exists
if (Test-Path -Path ".env") {
    Get-Content .env | ForEach-Object {
        if ($_ -match "^\s*([^#].+?)=(.+)$") {
            $key = $Matches[1].Trim()
            $val = $Matches[2].Trim()
            # Use Set-Item to safely set environment variables in PowerShell
            Set-Item -Path "Env:$key" -Value $val -Force
        }
    }
}

# Ensure python is available
if (-not (Get-Command python -ErrorAction SilentlyContinue)) {
    Write-Host "Python not found in PATH. Please activate your virtualenv or add Python to PATH." -ForegroundColor Yellow
}

# Start uvicorn with reload for development
Write-Host "Starting backend (uvicorn backend.api:app) on http://localhost:8000 ..." -ForegroundColor Green
python -m uvicorn backend.api:app --host 0.0.0.0 --port 8000 --reload
