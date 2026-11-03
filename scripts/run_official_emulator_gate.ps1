# ==============================================================================
# PRE-PRODUCTION GATE: RUN OFFICIAL FIREBASE LOCAL EMULATOR SUITE
# Tuân thủ FIX-01, FIX-02, FIX-05, FIX-06, FIX-07 (UTF-8, Hostname Guard, Error Trapping)
# ==============================================================================
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$OutputEncoding = [System.Text.Encoding]::UTF8
$ErrorActionPreference = "Stop"

Write-Host "========================================================" -ForegroundColor Cyan
Write-Host " [PRE-PRODUCTION GATE] KIEM TRA FIREBASE EMULATOR CHINH THUC" -ForegroundColor Cyan
Write-Host "========================================================" -ForegroundColor Cyan

# 1. Thiet lap bien moi truong co lap tuyet doi (FIX-06)
$env:FIREBASE_AUTH_EMULATOR_HOST = "127.0.0.1:9099"
$env:FIREBASE_DATABASE_EMULATOR_HOST = "127.0.0.1:9000"
$env:GCLOUD_PROJECT = "secretletter-test-emulator"

Write-Host "Cac bien moi truong da duoc khoa chat:" -ForegroundColor Gray
Write-Host " - FIREBASE_AUTH_EMULATOR_HOST     : $env:FIREBASE_AUTH_EMULATOR_HOST" -ForegroundColor Gray
Write-Host " - FIREBASE_DATABASE_EMULATOR_HOST : $env:FIREBASE_DATABASE_EMULATOR_HOST" -ForegroundColor Gray
Write-Host " - GCLOUD_PROJECT                  : $env:GCLOUD_PROJECT" -ForegroundColor Gray

# 2. Kiem tra Java JRE
$javaCmd = Get-Command java -ErrorAction SilentlyContinue
if (-not $javaCmd) {
    Write-Host "`n[CANH BAO] Khong tim thay Java JRE tren may tinh!" -ForegroundColor Yellow
    Write-Host "Firebase Realtime Database Emulator bat buoc can Java (JRE 11+)." -ForegroundColor Yellow
    Write-Host "De cai dat nhanh, hay mo PowerShell voi quyen Admin va chay:" -ForegroundColor White
    Write-Host "    winget install Microsoft.OpenJDK.17" -ForegroundColor Green
    Write-Host "Sau khi cai dat xong, hay mo lai cua so nay va chay lai script.`n" -ForegroundColor White
    exit 1
} else {
    $javaVer = java -version 2>&1 | Select-Object -First 1
    Write-Host "✔ Java da san sang: $javaVer" -ForegroundColor Green
}

# 3. Kiem tra Firebase CLI
$firebaseCmd = Get-Command firebase -ErrorAction SilentlyContinue
if (-not $firebaseCmd) {
    Write-Host "`n[CANH BAO] Khong tim thay Firebase CLI (firebase-tools)!" -ForegroundColor Yellow
    Write-Host "De cai dat Firebase CLI chinh thuc, hay chay:" -ForegroundColor White
    Write-Host "    npm install -g firebase-tools" -ForegroundColor Green
    Write-Host "Sau khi cai dat xong, hay chay lai script nay.`n" -ForegroundColor White
    exit 1
} else {
    $fbVer = firebase --version
    Write-Host "✔ Firebase CLI da san sang: v$fbVer" -ForegroundColor Green
}

# 4. Khoi chay Emulator Suite va thuc thi bo kiem thu (FIX-01, FIX-02, FIX-05)
Write-Host "`n🚀 Dang khoi dong Google Firebase Local Emulator Suite tren 127.0.0.1..." -ForegroundColor Cyan
firebase emulators:exec --project secretletter-test-emulator --only auth,database "node scripts/verify_official_firebase_emulator.mjs"

if ($LASTEXITCODE -ne 0) {
    Write-Host "`n❌ [PRE-PRODUCTION GATE] Kiem thu Firebase Emulator that bai voi ma loi $LASTEXITCODE." -ForegroundColor Red
    exit $LASTEXITCODE
}

Write-Host "`n🎉 [PRE-PRODUCTION GATE] XAC MINH FIREBASE EMULATOR THANH CONG 100%!" -ForegroundColor Green
exit 0
