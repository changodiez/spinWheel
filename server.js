import express from 'express';
import { createServer } from 'http';
import { WebSocketServer } from 'ws';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readdirSync, readFileSync, writeFileSync, existsSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const server = createServer(app);
const wss = new WebSocketServer({ server, perMessageDeflate: false });

// Carpeta de build de Vite
const docsPath = join(__dirname, 'docs');

// Middleware para servir assets con MIME type correcto
app.use('/spinWheel/assets', express.static(join(docsPath, 'assets'), {
  setHeaders: (res, path) => {
    if (path.endsWith('.js')) res.setHeader('Content-Type', 'application/javascript');
    if (path.endsWith('.css')) res.setHeader('Content-Type', 'text/css');
  }
}));

// Servir archivos estáticos generales (index.html, admin.html, etc.)
app.use(express.static(docsPath));
app.use(express.json());

// Ruta del archivo JSON de premios
const PRIZES_FILE = join(__dirname, 'prizes.json');

// Función para cargar premios desde JSON
function loadPrizes() {
  try {
    if (existsSync(PRIZES_FILE)) {
      const data = readFileSync(PRIZES_FILE, 'utf8');
      const loaded = JSON.parse(data);
      console.log('✅ Premios cargados desde prizes.json');
      return loaded;
    } else {
      console.log('⚠️ No se encontró prizes.json, usando valores por defecto');
      return [
        { name: "Tote", quantity: 10, winText: "You win a shiny Tote bag" },
        { name: "Sticker", quantity: 10, winText: "You win a sticky Sticker" },
        { name: "Cool Cap", quantity: 10, winText: "You win a cool Cap" },
        { name: "Tattoo", quantity: 10, winText: "You win a wild Tattoo" },
        { name: "Socks", quantity: 10, winText: "You win magic Socks" },
        { name: "T-Shirt", quantity: 10, winText: "You win an epic T-shirt" },
        { name: "Mug", quantity: 10, winText: "You win a power Mug" },
        { name: "Label", quantity: 10, winText: "You win a cool Tag" },
        { name: "PeraWallet", quantity: 10, winText: "You win a Spin in Pera" },
        { name: "Pin", quantity: 10, winText: "You win a funky Pin" },
        { name: "Lanyard", quantity: 10, winText: "You win a cozy Lanyard" }
      ];
    }
  } catch (error) {
    console.error('❌ Error al cargar premios:', error);
    return [
      { name: "Tote", quantity: 10 },
      { name: "Sticker", quantity: 10 },
      { name: "Cool Cap", quantity: 10 },
      { name: "Tattoo", quantity: 10 },
      { name: "Socks", quantity: 10 },
      { name: "T-Shirt", quantity: 10 },
      { name: "Mug", quantity: 10 },
      { name: "Label", quantity: 10 },
      { name: "PeraWallet", quantity: 10 },
      { name: "Pin", quantity: 10 },
      { name: "Lanyard", quantity: 10 }
    ];
  }
}

// Función para guardar premios en JSON
function savePrizes(prizesToSave) {
  try {
    writeFileSync(PRIZES_FILE, JSON.stringify(prizesToSave, null, 2), 'utf8');
    console.log('💾 Premios guardados en prizes.json');
    return true;
  } catch (error) {
    console.error('❌ Error al guardar premios:', error);
    return false;
  }
}

// Estado de los premios (cargado desde JSON)
let prizes = loadPrizes();

let clients = [];

// WebSocket connection
wss.on('connection', (ws, req) => {
  console.log('Nuevo cliente conectado desde:', req.socket.remoteAddress);
  clients.push(ws);

  try {
    ws.send(JSON.stringify({ type: 'prizes_update', prizes }));
  } catch (err) { console.error(err); }

  ws.on('message', (msg) => {
    try {
      const data = JSON.parse(msg);
      switch (data.type) {
        case 'update_prizes':
          prizes = data.prizes;
          savePrizes(prizes); // Guardar en JSON
          broadcast({ type: 'prizes_update', prizes });
          break;
        case 'update_prize_quantity':
          // Actualizar cantidad de un premio específico
          const prizeIndex = prizes.findIndex(p => {
            const pName = typeof p === 'string' ? p : p.name;
            const dataName = typeof data.prize === 'string' ? data.prize : data.prize.name;
            return pName === dataName;
          });
          if (prizeIndex !== -1) {
            prizes[prizeIndex] = {
              name: typeof prizes[prizeIndex] === 'string' ? prizes[prizeIndex] : prizes[prizeIndex].name,
              quantity: data.quantity
            };
            savePrizes(prizes); // Guardar en JSON
            broadcast({ type: 'prizes_update', prizes });
          }
          break;
        case 'decrement_prize':
          // Decrementar cantidad cuando se gana un premio
          const decPrizeIndex = prizes.findIndex(p => {
            const pName = typeof p === 'string' ? p : p.name;
            return pName === data.prizeName;
          });
          if (decPrizeIndex !== -1) {
            const prize = prizes[decPrizeIndex];
            const prizeName = typeof prize === 'string' ? prize : prize.name;
            const currentQuantity = typeof prize === 'string' ? 0 : (prize.quantity || 0);
            
            if (currentQuantity > 0) {
              prizes[decPrizeIndex] = {
                name: prizeName,
                quantity: currentQuantity - 1
              };
              savePrizes(prizes); // Guardar en JSON después de decrementar
              broadcast({ type: 'prizes_update', prizes });
              console.log(`✅ Premio ${prizeName} decrementado. Cantidad restante: ${prizes[decPrizeIndex].quantity}`);
            }
          }
          break;
        case 'spin_wheel':
          broadcast({ type: 'spin_wheel' });
          break;
      }
    } catch (err) { console.error(err); }
  });

  ws.on('close', () => { clients = clients.filter(c => c !== ws); });
  ws.on('error', () => { clients = clients.filter(c => c !== ws); });
});

function broadcast(msg) {
  const str = JSON.stringify(msg);
  clients.forEach(c => { if (c.readyState === c.OPEN) c.send(str); });
}

// Rutas específicas
app.get('/', (req, res) => res.sendFile(join(docsPath, 'index.html')));
app.get('/admin', (req, res) => res.sendFile(join(docsPath, 'admin.html')));

// API REST
app.get('/api/prizes', (req, res) => res.json(prizes));
app.post('/api/prizes', (req, res) => {
  prizes = req.body.prizes;
  savePrizes(prizes); // Guardar en JSON
  broadcast({ type: 'prizes_update', prizes });
  res.json({ success: true });
});

// Health check
app.get('/health', (req, res) => res.json({ status: 'ok', clients: clients.length, prizes: prizes.length }));

// Mostrar archivos en docs/ al iniciar
try {
  const files = readdirSync(docsPath);
  console.log('📊 Archivos en docs/:', files);
} catch (err) {
  console.log('📊 No se pudo leer docs/');
}

const PORT = process.env.PORT || 3000;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`🎡 Servidor ruleta ejecutándose en http://localhost:${PORT}`);
  console.log(`📱 Panel admin disponible en http://localhost:${PORT}/admin`);
});
