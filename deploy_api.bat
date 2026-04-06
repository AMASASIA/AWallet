@echo off
echo ========================================================
echo 1. Building Frontend (AWallet UI)...
echo ========================================================
cd /d "%~dp0frontend"
call npm install
call npm run build

echo.
echo ========================================================
echo 2. Copying Frontend to API serving directory...
echo ========================================================
cd /d "%~dp0"
if exist "api\public" rmdir /s /q "api\public"
mkdir "api\public"
xcopy /e /k /h /i "frontend\build\*" "api\public\"

echo.
echo ========================================================
echo 3. Deploying Total System to Google Cloud Run from ROOT...
echo ========================================================
cd /d "%~dp0"
gcloud run deploy awallet-api --source . --allow-unauthenticated --region asia-northeast1

echo.
echo ========================================================
echo Deployment Complete! Check the Service URL above.
echo ========================================================
pause
