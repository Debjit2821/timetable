# Push script to publish code to GitHub
Write-Host "Checking git status..." -ForegroundColor Cyan
git status

Write-Host "`nAttempting to push to origin main..." -ForegroundColor Yellow
git push -u origin main

if ($LASTEXITCODE -eq 0) {
    Write-Host "`n Successfully pushed to GitHub!" -ForegroundColor Green
    Write-Host "Now go to https://vercel.com/new and import 'TIMETABLE' to deploy live!" -ForegroundColor Cyan
} else {
    Write-Host "`n Note: If the repository doesn't exist yet on GitHub:" -ForegroundColor Red
    Write-Host "1. Create it at: https://github.com/new (Name: TIMETABLE)" -ForegroundColor Yellow
    Write-Host "2. Run: git push -u origin main" -ForegroundColor Yellow
}
