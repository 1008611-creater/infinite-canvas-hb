@echo off
setlocal
chcp 65001 >nul
title 停止 天宫漫剧·视频工作台

echo  正在停止视频工作台服务...
echo  --------------------------------------------

REM 用 PowerShell 精准杀掉占用 8787/17371/3000 的 node 进程
REM 双重条件：端口匹配 + 命令行关键字匹配，避免误杀其它 node 进程
powershell -NoProfile -ExecutionPolicy Bypass -Command ^
  "$ports=8787,17371,3000; $done=$false; $conns=Get-NetTCPConnection -State Listen -ErrorAction SilentlyContinue | Where-Object {$ports -contains $_.LocalPort}; foreach($c in $conns){ $p=Get-CimInstance Win32_Process -Filter ('ProcessId='+$c.OwningProcess) -ErrorAction SilentlyContinue; if($p -and $p.CommandLine -match 'agnes-video-proxy|server\.js|vite\.js|canvas-agent'){ Write-Host ('  已停止: 端口 '+$c.LocalPort+' (PID '+$p.ProcessId+')') -ForegroundColor Green; Stop-Process -Id $p.ProcessId -Force -ErrorAction SilentlyContinue; $done=$true } }; if(-not $done){ Write-Host '  没有在运行中的本项目服务（或已被停止）' -ForegroundColor Yellow }"

echo  --------------------------------------------
echo  完成。
echo.
pause
