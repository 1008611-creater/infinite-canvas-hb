@echo off
setlocal enabledelayedexpansion
chcp 65001 >nul
title 天宫漫剧·视频工作台

REM ============================================================
REM  一键启动器：后端代理(8787) + Canvas Agent(17371) + 前端画布(3000)
REM
REM  用法：
REM    scripts\windows\start.bat              启动并打开浏览器
REM    scripts\windows\start.bat /headless   不打开浏览器、不暂停
REM  停止：
REM    scripts\windows\stop.bat
REM
REM  本脚本不写死绝对路径。根目录由脚本自身位置推导：
REM    <ROOT>\infinite-canvas\scripts\windows\start.bat
REM ============================================================

set "HEADLESS="
if /i "%~1"=="/headless" set "HEADLESS=1"

pushd "%~dp0..\..\.." >nul 2>&1
set "ROOT=%CD%"
popd

set "PROXY_DIR=%ROOT%\agnes-video-proxy"
set "WEB_DIR=%ROOT%\infinite-canvas\web"
set "VITE_CFG=%WEB_DIR%\vite.config.ts"

if not exist "%WEB_DIR%\package.json" (
    echo.
    echo   [!!] 未找到前端目录：%WEB_DIR%
    echo       请确认本脚本位于 infinite-canvas\scripts\windows\ 下。
    echo.
    if "%HEADLESS%"=="" pause
    exit /b 1
)

REM ---- 自动定位 canvas-agent（npx 缓存目录名是随机 hash，逐个探测）----
set "AGENT_PKG="
for /d %%D in ("%LOCALAPPDATA%\npm-cache\_npx\*") do (
    if exist "%%D\node_modules\@basketikun\canvas-agent\dist\index.js" (
        set "AGENT_PKG=%%D\node_modules\@basketikun\canvas-agent"
    )
)

echo.
echo   [天宫漫剧·视频工作台] 正在启动...
echo   --------------------------------------------
echo   根目录      %ROOT%
echo   后端代理    http://localhost:8787
echo   Canvas Agent http://127.0.0.1:17371
echo   前端画布    http://localhost:3000
echo   --------------------------------------------
echo.

REM ---- 1. 后端代理 ----
netstat -ano | findstr /c:":8787 " /c:":8787" | findstr /i "LISTENING" >nul 2>&1
if %errorlevel%==0 (
    echo   [OK] 后端代理已在运行 (8787)
) else (
    echo   [..] 启动后端代理 (8787) ...
    start "agnes-proxy-8787" /min cmd /c "cd /d "%PROXY_DIR%" && set NODE_OPTIONS= && node server.js"
    timeout /t 2 /nobreak >nul
    netstat -ano | findstr /c:":8787 " /c:":8787" | findstr /i "LISTENING" >nul 2>&1
    if !errorlevel!==0 ( echo   [OK] 后端代理已就绪 ) else ( echo   [!!] 后端代理未在2秒内就绪 )
)

echo.

REM ---- 2. Canvas Agent（画布内 Agent 面板 / MCP 依赖它）----
netstat -ano | findstr /c:":17371 " /c:":17371" | findstr /i "LISTENING" >nul 2>&1
if %errorlevel%==0 (
    echo   [OK] Canvas Agent 已在运行 (17371)
) else (
    echo   [..] 启动 Canvas Agent (17371) ...
    if defined AGENT_PKG (
        start "canvas-agent-17371" /min cmd /c "cd /d "%AGENT_PKG%" && set NODE_OPTIONS= && node dist/index.js"
    ) else (
        echo   [..] 未找到本地 canvas-agent，改用 npx 拉取 ...
        start "canvas-agent-17371" /min cmd /c "set NODE_OPTIONS= && npx -y @basketikun/canvas-agent"
    )
    timeout /t 6 /nobreak >nul
    netstat -ano | findstr /c:":17371 " /c:":17371" | findstr /i "LISTENING" >nul 2>&1
    if !errorlevel!==0 ( echo   [OK] Canvas Agent 已就绪 ) else ( echo   [!!] Canvas Agent 未在6秒内就绪 )
)

echo.

REM ---- 3. 前端画布 ----
netstat -ano | findstr /c:":3000 " /c:":3000" | findstr /i "LISTENING" >nul 2>&1
if %errorlevel%==0 (
    echo   [OK] 前端画布已在运行 (3000)
) else (
    echo   [..] 启动前端画布 (3000) ...
    if not exist "%VITE_CFG%" set "VITE_CFG="
    start "canvas-web-3000" /min cmd /c "cd /d "%WEB_DIR%" && set NODE_OPTIONS= && node node_modules/vite/bin/vite.js --host 0.0.0.0 --port 3000 %VITE_CFG%"
    timeout /t 10 /nobreak >nul
    netstat -ano | findstr /c:":3000 " /c:":3000" | findstr /i "LISTENING" >nul 2>&1
    if !errorlevel!==0 ( echo   [OK] 前端画布已就绪 ) else ( echo   [!!] 前端画布未在10秒内就绪 )
)

echo.
echo   --------------------------------------------
if "%HEADLESS%"=="" (
    echo   正在打开浏览器：前端画布 http://localhost:3000
    start "" http://localhost:3000
) else (
    echo   /headless 模式：不打开浏览器
)
echo   --------------------------------------------
echo.
echo   三个服务已在线： 后端=8787  Agent=17371  前端=3000
echo   关闭本窗口不影响服务。停止请运行 stop.bat
echo.

if "%HEADLESS%"=="" (
    echo   按任意键关闭本窗口...
    pause >nul
)
endlocal
exit /b 0
