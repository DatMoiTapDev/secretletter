# ==============================================================================
# PRE-PRODUCTION GATE: RUN PLAYWRIGHT BROWSER E2E TESTS
# Tuân thủ FIX-03, FIX-04, FIX-06, FIX-07 (UTF-8, Localhost Guard, Error Trapping)
# ==============================================================================
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$OutputEncoding = [System.Text.Encoding]::UTF8
$ErrorActionPreference = "Stop"

Write-Host "========================================================" -ForegroundColor Cyan
Write-Host " [PRE-PRODUCTION GATE] CHAY KIEM THU PLAYWRIGHT BROWSER E2E" -ForegroundColor Cyan
Write-Host "========================================================" -ForegroundColor Cyan

# 1. Thiet lap bien moi truong co lap test
$env:VITE_E2E_TEST_MODE = "true"
$env:E2E_TEST_MODE = "true"

# 2. Kiem tra goi @playwright/test
$hasPlaywright = Test-Path "node_modules/@playwright/test"
if (-not $hasPlaywright) {
    Write-Host "`n[THONG BAO CAI DAT] Goi @playwright/test chua co trong node_modules." -ForegroundColor Yellow
    Write-Host "Tien hanh cai dat @playwright/test vao devDependencies..." -ForegroundColor Yellow
    npm install --save-dev @playwright/test
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Cai dat @playwright/test that bai." -ForegroundColor Red
        exit $LASTEXITCODE
    }
} else {
    Write-Host "✔ Thu vien @playwright/test da co san trong node_modules." -ForegroundColor Green
}

# 3. Kiem tra va tai trinh duyet Chromium cho Playwright
Write-Host "`nKiem tra / cai dat trinh duyet Chromium Playwright..." -ForegroundColor Cyan
npx playwright install chromium
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Cai dat trinh duyet Chromium that bai." -ForegroundColor Red
    exit $LASTEXITCODE
}

# 4. Chay kiem thu E2E tren Chromium (co lap tren 127.0.0.1:5173)
Write-Host "`n🚀 Dang chay kiem thu E2E tren trinh duyet Chromium..." -ForegroundColor Cyan
npx playwright test --project=chromium
if ($LASTEXITCODE -ne 0) {
    Write-Host "`n❌ [PRE-PRODUCTION GATE] Co bai kiem thu E2E that bai voi ma loi $LASTEXITCODE." -ForegroundColor Red
    exit $LASTEXITCODE
}

Write-Host "`n🎉 [PRE-PRODUCTION GATE] BROWSER E2E TESTS PASSED 100%!" -ForegroundColor Green
exit 0
