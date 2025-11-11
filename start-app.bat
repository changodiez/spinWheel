@echo off
:: Directorio del proyecto
cd /d "C:\Users\thinkPad_Pi\Documents\spinwheel\spinWheel"

:: Levantar la app Node (npm run start)
start "" cmd /k "npm run start"

:: Esperar unos segundos para que el servidor esté listo
timeout /t 5 /nobreak

:: Abrir Chrome en modo kiosk apuntando a localhost
start "" "C:\Program Files\Google\Chrome\Application\chrome.exe" --kiosk --start-fullscreen http://localhost:3000/

exit
