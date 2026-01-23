@echo off
setlocal enabledelayedexpansion

set "UPDATES_PATH=%~1"
if "%UPDATES_PATH%"=="" set "UPDATES_PATH=C:\Software\updates"

set "REPO_ROOT=%~dp0.."
for %%I in ("%REPO_ROOT%") do set "REPO_ROOT=%%~fI"
set "RELEASE_ROOT=%REPO_ROOT%\release"

if not exist "%RELEASE_ROOT%" (
  echo Release folder not found: "%RELEASE_ROOT%"
  exit /b 1
)

for /f "delims=" %%D in ('dir "%RELEASE_ROOT%" /ad /b /o:-d 2^>nul') do (
  set "LATEST_RELEASE=%%D"
  goto :found_release
)

echo No release folder found in: "%RELEASE_ROOT%"
exit /b 1

:found_release
set "LATEST_PATH=%RELEASE_ROOT%\%LATEST_RELEASE%"

if not exist "%UPDATES_PATH%" (
  mkdir "%UPDATES_PATH%"
)

set "COPIED=0"
for %%F in ("%LATEST_PATH%\*.yml" "%LATEST_PATH%\*.exe" "%LATEST_PATH%\*.blockmap") do (
  if exist "%%~fF" (
    copy /y "%%~fF" "%UPDATES_PATH%" >nul
    set "COPIED=1"
  )
)

if "%COPIED%"=="0" (
  echo No update files found in: "%LATEST_PATH%"
  exit /b 1
)

echo Copied update files from: "%LATEST_PATH%"
echo To: "%UPDATES_PATH%"
endlocal
