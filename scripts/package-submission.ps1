$ErrorActionPreference = 'Stop'
$projectRoot = [System.IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..'))
$outputDirectory = Join-Path $projectRoot 'submission'
$archivePath = Join-Path $outputDirectory 'AKIM-5-HOURS.zip'

# An explicit allowlist keeps dependencies, build output, caches and secrets out.
$names = @(
  '.env.example', '.gitignore', '.npmrc',
  'AGENTS.md', 'CLAUDE.md', 'README.md',
  'MASTER_SPEC_AKIM_5_HOURS.md', 'official-dataset.json',
  'package.json', 'pnpm-lock.yaml', 'pnpm-workspace.yaml',
  'tsconfig.json', 'next-env.d.ts', 'next.config.ts',
  'eslint.config.mjs', 'vitest.config.ts', 'playwright.config.ts',
  'src', 'scripts', 'tests', 'e2e', 'docs'
)
$sources = $names | ForEach-Object { Join-Path $projectRoot $_ }
foreach ($source in $sources) {
  if (-not (Test-Path -LiteralPath $source)) { throw "Missing submission input: $source" }
}
New-Item -ItemType Directory -Path $outputDirectory -Force | Out-Null
Compress-Archive -LiteralPath $sources -DestinationPath $archivePath -Force

$archive = [System.IO.Compression.ZipFile]::OpenRead($archivePath)
try {
  $entries = @($archive.Entries | ForEach-Object { $_.FullName.Replace('\', '/') })
  if ($entries | Where-Object { $_ -match '(^|/)(node_modules|\.next|\.pnpm-store|\.cache|\.test-results|\.git)/|(^|/)\.env(\.local)?$' }) {
    throw 'Submission archive contains an excluded path'
  }
  foreach ($required in @('package.json', 'official-dataset.json', 'MASTER_SPEC_AKIM_5_HOURS.md', '.gitignore', '.env.example')) {
    if ($entries -notcontains $required) { throw "Archive is missing $required" }
  }
  Write-Output "Verified $($entries.Count) archive entries."
} finally { $archive.Dispose() }
Get-Item -LiteralPath $archivePath | Select-Object FullName, Length
