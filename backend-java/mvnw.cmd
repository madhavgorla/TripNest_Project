@REM ----------------------------------------------------------------------------
@REM TripNest Maven Wrapper for Windows (cmd.exe)
@REM ----------------------------------------------------------------------------
@echo off
setlocal

set JAVACMD=java
if not "%JAVA_HOME%"=="" (
  if exist "%JAVA_HOME%\bin\java.exe" set "JAVACMD=%JAVA_HOME%\bin\java.exe"
)

where mvn >nul 2>nul
if %ERRORLEVEL% equ 0 (
  call mvn %*
  exit /b %ERRORLEVEL%
)

echo [TripNest] Checking for Maven...
call mvn %*
exit /b %ERRORLEVEL%
