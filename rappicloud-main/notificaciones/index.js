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

// Métricas por defecto (CPU, memoria, etc.)
client.collectDefaultMetrics();

// Histograma para duración de peticiones HTTP
const httpRequestDurationMs = new client.Histogram({
  name: 'notificaciones_http_request_duration_ms',
  help: 'Duración de las peticiones HTTP en el servicio NOTIFICACIONES (ms)',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [50, 100, 200, 300, 400, 500, 1000],
});

// Middleware para medir cada request
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
//  LÓGICA DEL SERVICIO
// ========================

// Simulación de envío de notificaciones
app.post('/notificaciones/enviar', (req, res) => {
  const { tipo, mensaje, usuario_id } = req.body;

  console.log(`📨 Notificación enviada:
    Tipo: ${tipo}
    Usuario: ${usuario_id}
    Mensaje: ${mensaje}
  `);

  res.json({ mensaje: 'Notificación enviada correctamente' });
});

// ========================
//  HEALTH & MÉTRICAS
// ========================

app.get('/health', (req, res) => {
  res.json({ status: 'ok', servicio: 'notificaciones' });
});

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
const PORT = process.env.PORT || 3006;

app.listen(PORT, () => {
  console.log(`📨 Servicio de NOTIFICACIONES en puerto ${PORT}`);
});
