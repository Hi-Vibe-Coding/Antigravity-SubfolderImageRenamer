$ErrorActionPreference = "Stop"
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

Write-Host "========================================================" -ForegroundColor Cyan
Write-Host "  Antigravity-SubfolderImageRenamer(v0.0.1) 一键打包" -ForegroundColor Yellow
Write-Host "========================================================" -ForegroundColor Cyan
Write-Host ""

$rootPath = Resolve-Path (Join-Path $PSScriptRoot "..")
Set-Location $rootPath

# 释放可能正在运行或占用的旧进程
Get-Process -Name "electron", "Antigravity-SubfolderImageRenamer", "子文件夹图片自动化命名工具" -ErrorAction SilentlyContinue | Stop-Process -Force

Write-Host "[1/2] 正在编译前端与桌面进程代码..." -ForegroundColor Green
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "[错误] 编译失败，请检查上方日志！" -ForegroundColor Red
    Read-Host "按回车键退出..."
    exit $LASTEXITCODE
}

Write-Host ""
Write-Host "[2/2] 正在生成免安装绿色版程序..." -ForegroundColor Green
npx electron-builder --win dir
if ($LASTEXITCODE -ne 0) {
    Write-Host "[错误] 生成程序失败，请检查上方日志！" -ForegroundColor Red
    Read-Host "按回车键退出..."
    exit $LASTEXITCODE
}

# 复制产物到 release 目录并提供统一的项目名称
$distDir = Join-Path $rootPath "dist-release\win-unpacked"
$releaseDir = Join-Path $rootPath "release\Antigravity-SubfolderImageRenamer"
if (-not (Test-Path "release")) {
    New-Item -ItemType Directory -Path "release" -Force | Out-Null
}

try {
    if (Test-Path $releaseDir) {
        Remove-Item -Recurse -Force $releaseDir -ErrorAction SilentlyContinue
    }
    Copy-Item -Path $distDir -Destination $releaseDir -Recurse -Force
} catch {
    Write-Host "[提示] 现有程序正在被访问，新版本已保存在 dist-release 目录中" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "========================================================" -ForegroundColor Green
Write-Host "  🎉 打包大功告成！" -ForegroundColor Green
Write-Host "  免安装绿色版程序已就绪：" -ForegroundColor Yellow
Write-Host "  直接双击根目录下的【启动软件.bat】即可启动运行！" -ForegroundColor Cyan
Write-Host "========================================================" -ForegroundColor Green
Write-Host ""

explorer $releaseDir

Read-Host "按回车键关闭窗口..."