import express from 'express';
import { createServer } from 'http';
import { WebSocketServer } from 'ws';
import { fileURLToPath } from 'url';
import { dirname, join, extname } from 'path';
import { readdirSync } from 'fs'; // 👈 AGREGAR ESTA IMPORTACIÓN

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const server = createServer(app);
const wss = new WebSocketServer({ 
  server,
  perMessageDeflate: false
});

// Servir archivos estáticos con MIME types correctos
app.use('/assets', express.static(join(__dirname, 'docs/assets'), {
  setHeaders: (res, path) => {
    const ext = extname(path);
    if (ext === '.js') {
      res.setHeader('Content-Type', 'application/javascript');
    } else if (ext === '.css') {
      res.setHeader('Content-Type', 'text/css');
    }
  }
}));

app.use(express.static(join(__dirname, 'docs')));
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

// Rutas específicas
app.get('/', (req, res) => {
  res.sendFile(join(__dirname, 'docs', 'index.html'));
});

app.get('/admin', (req, res) => {
  res.sendFile(join(__dirname, 'docs', 'admin.html'));
});

// API REST
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

// Ruta para servir archivos JS/CSS específicos
app.get('/assets/:filename', (req, res) => {
  const filename = req.params.filename;
  const filePath = join(__dirname, 'docs', 'assets', filename);
  
  // Establecer MIME type correcto
  if (filename.endsWith('.js')) {
    res.setHeader('Content-Type', 'application/javascript');
  } else if (filename.endsWith('.css')) {
    res.setHeader('Content-Type', 'text/css');
  }
  
  res.sendFile(filePath, (err) => {
    if (err) {
      console.error('Error sirviendo archivo:', filename, err);
      res.status(404).send('Archivo no encontrado');
    }
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`🎡 Servidor ruleta ejecutándose en http://localhost:${PORT}`);
  console.log(`📱 Panel admin disponible en http://localhost:${PORT}/admin`);
  
  // Mostrar archivos de forma segura
  try {
    const files = readdirSync(join(__dirname, 'docs'));
    console.log(`📊 Archivos en docs/:`);
    files.forEach(file => {
      console.log(`   - ${file}`);
    });
  } catch (error) {
    console.log('📊 No se pudo leer la carpeta docs/');
  }
});