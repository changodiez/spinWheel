import express from 'express';
import { createServer } from 'http';
import { WebSocketServer } from 'ws';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const server = createServer(app);
const wss = new WebSocketServer({ 
  server,
  perMessageDeflate: false // 👈 Ayuda con conexiones inestables
});

// Servir archivos estáticos
app.use(express.static(join(__dirname, 'dist')));
app.use(express.json());

// Estado de los premios
let prizes = [
  "Tote Bag", "Camiseta", "QR1", "Gorra", "Mug", 
  "QR2", "Pin", "Patch", "QR3", "Luggage Tag", "Calcetín"
];

// Clientes conectados
let clients = [];

// WebSocket connection
wss.on('connection', (ws, req) => {
  console.log('Nuevo cliente conectado desde:', req.socket.remoteAddress);
  clients.push(ws);
  
  // Enviar premios actuales al nuevo cliente
  try {
    ws.send(JSON.stringify({
      type: 'prizes_update',
      prizes: prizes
    }));
  } catch (error) {
    console.error('Error enviando premios iniciales:', error);
  }

  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message);
      console.log('Mensaje recibido:', data.type);
      
      switch (data.type) {
        case 'update_prizes':
          prizes = data.prizes;
          broadcastToAll({
            type: 'prizes_update',
            prizes: prizes
          });
          console.log('Premios actualizados:', prizes);
          break;
          
        case 'spin_wheel':
          broadcastToAll({
            type: 'spin_wheel'
          });
          console.log('Comando de girar recibido');
          break;
      }
    } catch (error) {
      console.error('Error procesando mensaje:', error);
    }
  });

  ws.on('close', () => {
    clients = clients.filter(client => client !== ws);
    console.log('Cliente desconectado');
  });

  ws.on('error', (error) => {
    console.error('WebSocket error:', error);
    clients = clients.filter(client => client !== ws);
  });
});

function broadcastToAll(message) {
  const messageStr = JSON.stringify(message);
  clients.forEach(client => {
    try {
      if (client.readyState === client.OPEN) {
        client.send(messageStr);
      }
    } catch (error) {
      console.error('Error enviando mensaje a cliente:', error);
    }
  });
}

// Ruta para la ruleta principal
app.get('/', (req, res) => {
  res.sendFile(join(__dirname, 'dist', 'index.html'));
});

// Ruta para el panel admin
app.get('/admin', (req, res) => {
  res.sendFile(join(__dirname, 'dist', 'admin.html'));
});

// API REST para premios (backup)
app.get('/api/prizes', (req, res) => {
  res.json(prizes);
});

app.post('/api/prizes', (req, res) => {
  prizes = req.body.prizes;
  broadcastToAll({
    type: 'prizes_update',
    prizes: prizes
  });
  res.json({ success: true });
});

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    clients: clients.length,
    prizes: prizes.length 
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`🎡 Servidor ruleta ejecutándose en http://localhost:${PORT}`);
  console.log(`📱 Panel admin disponible en http://localhost:${PORT}/admin`);
  console.log(`🌐 Accesible desde la red local en: http://[TU-IP]:${PORT}`);
  console.log(`❤️  Health check: http://localhost:${PORT}/health`);
});