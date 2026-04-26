$pages = @(
  '/universe/sanctum',
  '/universe/sanctum/defter',
  '/universe/sanctum/ritueller',
  '/universe/sanctum/hafiza',
  '/universe/gaia',
  '/universe/gaia/plants',
  '/universe/gaia/atlas'
)
foreach ($p in $pages) {
  try {
    $r = Invoke-WebRequest -Uri "http://localhost:3000$p" -UseBasicParsing -TimeoutSec 60
    Write-Host ("{0,-36} HTTP {1}" -f $p, $r.StatusCode)
  } catch {
    Write-Host ("{0,-36} ERROR {1}" -f $p, $_.Exception.Message)
  }
}
