$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $root

$zipName = 'instagram-better-controls.zip'
$zipPath = Join-Path $root $zipName
if (Test-Path $zipPath) {
  Remove-Item $zipPath -Force
}

$staging = Join-Path $root '.cws-pack'
if (Test-Path $staging) {
  Remove-Item $staging -Recurse -Force
}
New-Item -ItemType Directory -Path $staging | Out-Null

$items = @(
  'manifest.json',
  'background.js',
  'content.js',
  'patch.js',
  'adobe-transcoder.js',
  'popup.html',
  'popup.css',
  'popup.js',
  'icons'
)

foreach ($item in $items) {
  $src = Join-Path $root $item
  if (-not (Test-Path $src)) {
    throw "Missing $item"
  }
  Copy-Item $src -Destination $staging -Recurse
}

Compress-Archive -Path (Join-Path $staging '*') -DestinationPath $zipPath -Force
Remove-Item $staging -Recurse -Force
Write-Output "Wrote $zipPath"
