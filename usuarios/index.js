const express = require('express');
const cors = require('cors');
require('dotenv').config();
const client = require('prom-client');

const app = express();
app.use(cors());
app.use(express.json());

// ========================
//  MÉTRICAS – PROMETHEUS
// ========================

client.collectDefaultMetrics();

const httpRequestDurationMs = new client.Histogram({
  name: 'usuarios_http_request_duration_ms',
  help: 'Duración de las peticiones HTTP en el servicio usuarios (ms)',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [50, 100, 200, 300, 400, 500, 1000],
});

app.use((req, res, next) => {
  const start = Date.now();

  res.on('finish', () => {
    const route = req.route ? req.route.path : req.originalUrl || req.url;
    const duration = Date.now() - start;

    httpRequestDurationMs
      .labels(req.method, route, res.statusCode)
      .observe(duration);
  });

  next();
});

// ========================
//  "BASE DE DATOS" SIMULADA
// ========================

const usuarios = [
  { id: 1, email: 'test@example.com', password: '123456' },
];

// ========================
//  RUTAS DEL SERVICIO USUARIOS
// ========================

// Ruta base de prueba
app.get('/', (req, res) => {
  res.send('Servicio USUARIOS funcionando ✅');
});

// Ejemplo de ruta de listado
app.get('/lista', (req, res) => {
  res.json([
    { id: 1, nombre: 'Usuario demo 1' },
    { id: 2, nombre: 'Usuario demo 2' },
  ]);
});

// 🚨 ESTA es la ruta que nos faltaba
app.post('/usuarios/login', (req, res) => {
  const { email, password } = req.body;

  const user = usuarios.find(
    (u) => u.email === email && u.password === password
  );

  if (!user) {
    return res.status(401).json({ error: 'Credenciales inválidas' });
  }

  res.json({
    mensaje: 'Login exitoso',
    usuario: { id: user.id, email: user.email },
  });
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', servicio: 'usuarios' });
});

// Endpoint de métricas
app.get('/metrics', async (req, res) => {
  try {
    res.set('Content-Type', client.register.contentType);
    res.end(await client.register.metrics());
  } catch (err) {
    res.status(500).end(err.message);
  }
});

// ========================
//  INICIO DEL SERVICIO
// ========================
const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`👤 Servicio USUARIOS corriendo en puerto ${PORT}`);
});
