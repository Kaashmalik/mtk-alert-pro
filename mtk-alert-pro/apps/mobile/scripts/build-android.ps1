# MTK AlertPro Android Build Script
# This script works around pnpm monorepo symlink issues with EAS Build

param(
    [string]$Profile = "preview",
    [switch]$ClearCache
)

$ErrorActionPreference = "Stop"
$BuildDir = "C:\Temp\mtk-build-$(Get-Date -Format 'yyyyMMdd-HHmmss')"
$SourceDir = $PSScriptRoot | Split-Path -Parent

Write-Host "🚀 MTK AlertPro Android Build" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
Write-Host "Source: $SourceDir"
Write-Host "Build Dir: $BuildDir"
Write-Host "Profile: $Profile"
Write-Host ""

# Step 1: Create isolated build directory
Write-Host "📁 Step 1: Creating isolated build directory..." -ForegroundColor Yellow
if (Test-Path $BuildDir) {
    Remove-Item -Recurse -Force $BuildDir
}
New-Item -ItemType Directory -Path $BuildDir | Out-Null

# Step 2: Copy source files (excluding node_modules, .expo, etc.)
Write-Host "📋 Step 2: Copying source files..." -ForegroundColor Yellow
$excludes = @("node_modules", ".expo", ".expo-shared", "ios", "dist", "build", ".git")
Get-ChildItem -Path $SourceDir -Exclude $excludes | ForEach-Object {
    Copy-Item -Path $_.FullName -Destination $BuildDir -Recurse -Force
}
Write-Host "   Copied $(Get-ChildItem $BuildDir -Recurse -File | Measure-Object | Select-Object -ExpandProperty Count) files"

# Step 3: Install dependencies with npm
Write-Host "📦 Step 3: Installing dependencies with npm..." -ForegroundColor Yellow
Push-Location $BuildDir
try {
    # Create .npmrc for legacy peer deps
    "@" | Set-Content .npmrc
    "legacy-peer-deps=true" | Set-Content .npmrc
    
    npm install --legacy-peer-deps 2>&1 | Out-Null
    Write-Host "   Dependencies installed successfully"
} finally {
    Pop-Location
}

# Step 4: Run EAS Build
Write-Host "🔨 Step 4: Running EAS Build..." -ForegroundColor Yellow
Push-Location $BuildDir
try {
    $buildArgs = @("build", "--platform", "android", "--profile", $Profile)
    if ($ClearCache) {
        $buildArgs += "--clear-cache"
    }
    
    & eas @buildArgs
    $buildExitCode = $LASTEXITCODE
} finally {
    Pop-Location
}

# Step 5: Cleanup
Write-Host "🧹 Step 5: Cleaning up..." -ForegroundColor Yellow
# Keep the build dir for debugging, but offer to clean
Write-Host "   Build directory kept at: $BuildDir"
Write-Host "   Run 'Remove-Item -Recurse -Force `"$BuildDir`"' to clean up"

if ($buildExitCode -eq 0) {
    Write-Host ""
    Write-Host "✅ Build completed successfully!" -ForegroundColor Green
} else {
    Write-Host ""
    Write-Host "❌ Build failed with exit code: $buildExitCode" -ForegroundColor Red
    exit $buildExitCode
}
