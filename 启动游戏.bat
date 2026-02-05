@echo off
chcp 65001 >nul
echo ========================================
echo   Roguelike v2.0 游戏启动中...
echo ========================================
echo.

cd /d "%~dp0"

:: 启动服务器并在后台运行
start /min cmd /c "node server.js"

:: 等待服务器启动
timeout /t 1 /nobreak >nul

:: 打开浏览器
start http://localhost:8080

echo 游戏已在浏览器中打开！
echo 关闭此窗口不会影响游戏运行。
echo 要停止服务器，请关闭最小化的命令行窗口。
echo.
pause
