@echo off
cd /d "%~dp0android"
echo Building release APK with Gradle...
call gradlew.bat assembleRelease -PenableMinifyInReleaseBuilds=false
if %errorlevel% == 0 (
    echo.
    echo Build successful!
    echo APK: %~dp0android\app\build\outputs\apk\release\app-release.apk
    echo.
    set /p install="Install on connected device? (y/n): "
    if /i "%install%"=="y" (
        adb uninstall com.ndplayer.app
        adb install "%~dp0android\app\build\outputs\apk\release\app-release.apk"
        if %errorlevel% == 0 (
            echo Installed successfully!
            adb shell monkey -p com.ndplayer.app -c android.intent.category.LAUNCHER 1
        ) else (
            echo Install failed. Make sure your device is connected with USB debugging enabled.
        )
    )
) else (
    echo.
    echo Build failed. Check the output above for errors.
)
pause
