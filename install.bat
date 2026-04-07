@echo off
cd /d "%~dp0"
echo Installing ND Player APK...
adb install -r "dist\nd-player.apk"
if %errorlevel% == 0 (
    echo Done! Launching app...
    adb shell monkey -p com.cyberhirsch.ndplayer -c android.intent.category.LAUNCHER 1
) else (
    echo Install failed. Make sure your device is connected and USB debugging is enabled.
)
pause
