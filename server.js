import express from 'express';
import { createServer } from 'http';
import { WebSocketServer } from 'ws';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readdirSync } from 'fs';

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

// Estado de los premios
let prizes = [
  "Tote", "Sticker", "Cool Cap", "Tattoo", "Socks", "T-Shirt", "Mug", "Label", "PeraWallet", "Pin", "Lanyard"

];

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
          broadcast({ type: 'prizes_update', prizes });
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
