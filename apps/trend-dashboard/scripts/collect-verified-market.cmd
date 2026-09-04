@echo off
setlocal

set "SCRIPT_DIR=%~dp0"
set "APP_DIR=%SCRIPT_DIR%.."
set "LOG_DIR=%APP_DIR%\logs\market-collection"

if not exist "%LOG_DIR%" mkdir "%LOG_DIR%"

for /f %%i in ('powershell -NoProfile -Command "Get-Date -Format yyyy-MM-dd"') do set "LOG_DATE=%%i"

set "LOG_FILE=%LOG_DIR%\%LOG_DATE%.log"

echo [%date% %time%] VERIFIED MARKET COLLECTION >> "%LOG_FILE%"
pushd "%APP_DIR%"
call npm.cmd run collect:verified-market >> "%LOG_FILE%" 2>&1
set "EXIT_CODE=%ERRORLEVEL%"
popd
echo [%date% %time%] EXIT_CODE=%EXIT_CODE% >> "%LOG_FILE%"

exit /b %EXIT_CODE%
