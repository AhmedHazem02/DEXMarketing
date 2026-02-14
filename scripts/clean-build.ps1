# Clean Build Script
# Run this if you encounter "module factory is not available" errors

Write-Host "Stopping all Node processes..." -ForegroundColor Yellow
taskkill /F /IM node.exe /T 2>$null

Write-Host "Waiting for processes to terminate..." -ForegroundColor Yellow
Start-Sleep -Seconds 2

Write-Host "Removing build cache..." -ForegroundColor Yellow
Remove-Item -Path ".next" -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item -Path "node_modules/.cache" -Recurse -Force -ErrorAction SilentlyContinue

Write-Host "Build cache cleared!" -ForegroundColor Green
Write-Host "Starting development server..." -ForegroundColor Cyan

npm run dev
