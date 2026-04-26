# Caelinus · Phase 3 — Atelier HTTP smoke test
#
# Hits every public Atelier route and reports the status. Skips routes
# that legitimately require auth (/atelier/dashboard) — those should
# 307 → /atelier/giris if the session is empty.
#
# Run while `npm run dev` is up:
#   powershell -ExecutionPolicy Bypass -File scripts/smoke-atelier-http.ps1

$ErrorActionPreference = "Stop"
$baseUrl = "http://localhost:3000"

$publicRoutes = @(
  "/atelier",
  "/atelier/giris",
  "/atelier/kayit",
  "/atelier/sifremi-unuttum",
  "/atelier/sifre-yenile"
)

$expectedRedirect = @(
  "/atelier/dashboard"
)

$pass = 0
$fail = 0

Write-Host ""
Write-Host "── public 200 ────────────────────────────"

foreach ($route in $publicRoutes) {
  try {
    $r = Invoke-WebRequest -Uri "$baseUrl$route" -UseBasicParsing -MaximumRedirection 0 -ErrorAction Stop
    if ($r.StatusCode -eq 200) {
      Write-Host ("[OK] {0,-30} 200" -f $route) -ForegroundColor Green
      $pass++
    } else {
      Write-Host ("[??] {0,-30} {1}" -f $route, $r.StatusCode) -ForegroundColor Yellow
      $fail++
    }
  } catch {
    Write-Host ("[X ] {0,-30} {1}" -f $route, $_.Exception.Message) -ForegroundColor Red
    $fail++
  }
}

Write-Host ""
Write-Host "── auth-protected (expect redirect) ────"

foreach ($route in $expectedRedirect) {
  try {
    $r = Invoke-WebRequest -Uri "$baseUrl$route" -UseBasicParsing -MaximumRedirection 0 -ErrorAction Stop
    if ($r.StatusCode -eq 307 -or $r.StatusCode -eq 302 -or $r.StatusCode -eq 303) {
      $location = $r.Headers["Location"]
      if ($location -is [array]) { $location = $location[0] }
      Write-Host ("[OK] {0,-30} {1} -> {2}" -f $route, $r.StatusCode, $location) -ForegroundColor Green
      $pass++
    } else {
      Write-Host ("[??] {0,-30} {1} (expected 30x)" -f $route, $r.StatusCode) -ForegroundColor Yellow
      $fail++
    }
  } catch {
    $code = $_.Exception.Response.StatusCode.value__
    if ($code -eq 307 -or $code -eq 302 -or $code -eq 303) {
      $location = $_.Exception.Response.Headers["Location"]
      Write-Host ("[OK] {0,-30} {1} -> {2}" -f $route, $code, $location) -ForegroundColor Green
      $pass++
    } else {
      Write-Host ("[X ] {0,-30} {1}" -f $route, $_.Exception.Message) -ForegroundColor Red
      $fail++
    }
  }
}

Write-Host ""
if ($fail -gt 0) {
  Write-Host "Result: $pass passed, $fail failed." -ForegroundColor Red
  exit 1
} else {
  Write-Host "Result: $pass passed." -ForegroundColor Green
  exit 0
}
