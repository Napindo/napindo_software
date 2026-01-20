$ErrorActionPreference = "Stop"

param(
  [string]$UpdatesPath = "E:\updates"
)

$repoRoot = Resolve-Path (Join-Path $PSScriptRoot "..")
$releaseRoot = Join-Path $repoRoot "release"

if (!(Test-Path $releaseRoot)) {
  throw "Release folder not found: $releaseRoot"
}

$latestRelease = Get-ChildItem -Path $releaseRoot -Directory |
  Sort-Object LastWriteTime -Descending |
  Select-Object -First 1

if (-not $latestRelease) {
  throw "No release folder found in: $releaseRoot"
}

if (!(Test-Path $UpdatesPath)) {
  New-Item -ItemType Directory -Path $UpdatesPath | Out-Null
}

$filesToCopy = Get-ChildItem -Path $latestRelease.FullName -File |
  Where-Object { $_.Name -match "\.exe$|\.yml$|\.blockmap$" }

if (-not $filesToCopy) {
  throw "No update files found in: $($latestRelease.FullName)"
}

foreach ($file in $filesToCopy) {
  Copy-Item -Path $file.FullName -Destination $UpdatesPath -Force
}

Write-Host "Copied update files from: $($latestRelease.FullName)"
Write-Host "To: $UpdatesPath"
