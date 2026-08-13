@echo off
cd /d "%~dp0"
set APK=android\app\build\outputs\apk\release\app-release.apk

if not exist "%APK%" (
    echo No release APK found. Run build-gradle.bat first.
    pause
    exit /b 1
)

echo Force-stopping app (releases foreground service and widget lock)...
adb shell am force-stop com.ndplayer.app

echo Uninstalling existing version...
adb shell pm uninstall --user 0 com.ndplayer.app 2>nul || adb uninstall com.ndplayer.app

echo Installing %APK%...
adb install "%APK%"
if %errorlevel% == 0 (
    echo Installed successfully! Launching app...
    adb shell monkey -p com.ndplayer.app -c android.intent.category.LAUNCHER 1
) else (
    echo Install failed. Make sure your device is connected with USB debugging enabled.
)
pause
