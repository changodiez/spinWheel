#!/bin/bash
# Directorio del proyecto
cd "$HOME/Documentos/vscode/spinWheel" || exit

# Levantar la app Node (npm run start) en segundo plano
npm run start &

# Esperar unos segundos para que el servidor esté listo
sleep 5

# Abrir Chrome en modo kiosk total (sin barra, sin bordes, pantalla completa)
chromium-browser --kiosk --fullscreen --noerrdialogs --disable-infobars --incognito --start-fullscreen http://localhost:3000/

exit 0
