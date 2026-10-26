@echo off
chcp 936 >nul
title Antigravity-SubfolderImageRenamer(v0.0.1) - 本地极速调试模式(热更新)

echo ========================================================
echo   Antigravity-SubfolderImageRenamer(v0.0.1) 本地调试
echo   特性：无需打包！1 秒秒开窗口，修改代码实时自动刷新！
echo ========================================================
echo.

call npm run dev

pause
