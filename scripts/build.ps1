$ErrorActionPreference = "Stop"
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

Write-Host "========================================================" -ForegroundColor Cyan
Write-Host "  子文件夹图片自动化命名工具 - 免安装绿色版一键打包" -ForegroundColor Yellow
Write-Host "========================================================" -ForegroundColor Cyan
Write-Host ""

$rootPath = Resolve-Path (Join-Path $PSScriptRoot "..")
Set-Location $rootPath

# 释放可能正在运行或占用的旧进程
Get-Process -Name "electron", "子文件夹图片自动化命名工具" -ErrorAction SilentlyContinue | Stop-Process -Force

Write-Host "[1/2] 正在编译前端与桌面进程代码..." -ForegroundColor Green
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "[错误] 编译失败，请检查上方日志！" -ForegroundColor Red
    Read-Host "按回车键退出..."
    exit $LASTEXITCODE
}

Write-Host ""
Write-Host "[2/2] 正在封装单文件免安装 EXE（大约需要 15 秒，请稍候）..." -ForegroundColor Green
npx electron-builder --win portable
if ($LASTEXITCODE -ne 0) {
    Write-Host "[错误] 生成 EXE 失败，请检查上方日志！" -ForegroundColor Red
    Read-Host "按回车键退出..."
    exit $LASTEXITCODE
}

# 将生成的英文名重命名为友好的中文文件名
$rawExe = Join-Path $rootPath "release\subfolder-image-renamer-portable.exe"
$targetExe = Join-Path $rootPath "release\子文件夹图片自动化命名工具_免安装绿色版.exe"
if (Test-Path $rawExe) {
    if (Test-Path $targetExe) {
        Remove-Item $targetExe -Force
    }
    Rename-Item -Path $rawExe -NewName "子文件夹图片自动化命名工具_免安装绿色版.exe" -Force
}

Write-Host ""
Write-Host "========================================================" -ForegroundColor Green
Write-Host "  🎉 打包大功告成！" -ForegroundColor Green
Write-Host "  单文件 EXE 文件已生成：" -ForegroundColor Yellow
Write-Host "  路径：release\子文件夹图片自动化命名工具_免安装绿色版.exe" -ForegroundColor Cyan
Write-Host "  双击直接运行，无任何安装过程！" -ForegroundColor Yellow
Write-Host "========================================================" -ForegroundColor Green
Write-Host ""

# 自动在资源管理器中选中生成的单文件 EXE
if (Test-Path $targetExe) {
    explorer /select,$targetExe
} else {
    explorer (Join-Path $rootPath "release")
}

Write-Host "按回车键关闭窗口..."
Read-Host