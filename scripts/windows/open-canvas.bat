@echo off
setlocal enabledelayedexpansion
chcp 65001 >nul
title 天宫漫剧·打开画布

REM ============================================================
REM  快速入口：服务已在线则直接开浏览器（秒开），否则走完整启动。
REM
REM  用法：
REM    scripts\windows\open-canvas.bat
REM
REM  与 start.bat 的区别：
REM    start.bat   无条件跑完整流程（代理→Agent→前端→开浏览器）
REM    open-canvas 先探测，前端与代理都在线就只开浏览器，不重复等待
REM ============================================================

pushd "%~dp0..\..\.." >nul 2>&1
set "ROOT=%CD%"
popd
set "SCRIPTS=%ROOT%\infinite-canvas\scripts\windows"
set "START_BAT=%SCRIPTS%\start.bat"

if not exist "%START_BAT%" (
    echo.
    echo   [!!] 未找到启动脚本：%START_BAT%
    echo.
    pause
    exit /b 1
)

REM ---- 探测：前端(3000) 与 代理(8787) 是否都已在线 ----
set "WEB_UP="
set "PROXY_UP="
netstat -ano | findstr /c:":3000 " | findstr /i "LISTENING" >nul 2>&1
if %errorlevel%==0 set "WEB_UP=1"
netstat -ano | findstr /c:":8787 " | findstr /i "LISTENING" >nul 2>&1
if %errorlevel%==0 set "PROXY_UP=1"

REM ---- 都在线：直接开浏览器，窗口一闪即过 ----
if defined WEB_UP (
    if defined PROXY_UP (
        start "" http://localhost:3000
        exit /b 0
    )
)

REM ---- 否则：完整启动（/headless 让 start.bat 不 pause、不自己开浏览器）----
echo.
echo   [..] 首次启动，正在拉起三个服务，约需 20 秒，请稍候...
echo.
call "%START_BAT%" /headless

REM 给前端几秒缓冲，避免浏览器打开时页面还没起来
timeout /t 3 /nobreak >nul
start "" http://localhost:3000
endlocal
exit /b 0
