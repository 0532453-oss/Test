# FlexDesk Package Migration Script (PowerShell)
# Run this script after closing all IDEs and dev servers
# Usage: .\scripts\migrate-package-names.ps1

$ErrorActionPreference = "Stop"

$PackagesDir = "packages"

Write-Host "🚀 FlexDesk Package Migration" -ForegroundColor Cyan
Write-Host "=============================" -ForegroundColor Cyan
Write-Host ""

function Rename-Package {
    param (
        [string]$OldName,
        [string]$NewName
    )

    $OldPath = Join-Path $PackagesDir $OldName
    $NewPath = Join-Path $PackagesDir $NewName

    if (Test-Path $OldPath) {
        if (Test-Path $NewPath) {
            Write-Host "⚠️  $NewName already exists, skipping $OldName" -ForegroundColor Yellow
        } else {
            try {
                Rename-Item -Path $OldPath -NewName $NewName -ErrorAction Stop
                Write-Host "✅ Renamed $OldName → $NewName" -ForegroundColor Green
            } catch {
                Write-Host "❌ Failed to rename $OldName : $_" -ForegroundColor Red
            }
        }
    } else {
        Write-Host "⏭️  $OldName not found (may already be renamed)" -ForegroundColor Gray
    }
}

Write-Host "📦 Renaming packages..." -ForegroundColor Cyan
Write-Host ""

# Rename remaining packages
Rename-Package "service-flex-admin-kit" "flexdesk-admin"
Rename-Package "service-flex-website" "flexdesk-website"
Rename-Package "simple-jobber-preview" "flexdesk-preview"
Rename-Package "service-flex-types" "flexdesk-shared"
Rename-Package "service-flex-core" "flexdesk-core"
Rename-Package "service-flex-analytics" "flexdesk-analytics"
Rename-Package "service-flex-front" "flexdesk-front"
Rename-Package "service-flex-web-admin" "flexdesk-web-admin"
Rename-Package "service-flex-cli" "flexdesk-cli"
Rename-Package "service-flex-maps" "flexdesk-maps"
Rename-Package "create-service-flex-app" "create-flexdesk-app"

Write-Host ""
Write-Host "📝 Updating project.json sourceRoot paths..." -ForegroundColor Cyan

# Update project.json files with new paths
Get-ChildItem -Path $PackagesDir -Directory | Where-Object { $_.Name -like "flexdesk-*" } | ForEach-Object {
    $ProjectJson = Join-Path $_.FullName "project.json"
    if (Test-Path $ProjectJson) {
        $PackageName = $_.Name
        $Content = Get-Content $ProjectJson -Raw
        $Content = $Content -replace 'packages/service-flex-[^/]+/', "packages/$PackageName/"
        $Content = $Content -replace 'packages/simple-jobber-preview/', "packages/$PackageName/"
        Set-Content -Path $ProjectJson -Value $Content
        Write-Host "✅ Updated $ProjectJson" -ForegroundColor Green
    }
}

Write-Host ""
Write-Host "🎉 Migration complete!" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "1. Run 'pnpm install' to update workspace links"
Write-Host "2. Run 'npx nx graph' to verify the dependency graph"
Write-Host "3. Run 'npx nx run-many --target=build --all' to verify builds"
