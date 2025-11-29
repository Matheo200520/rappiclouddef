const express = require('express');
const cors = require('cors');
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
  name: 'restaurantes_http_request_duration_ms',
  help: 'Duración de las peticiones HTTP en el servicio RESTAURANTES (ms)',
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

let restaurantes = [];

// Obtener todos los restaurantes
app.get('/restaurantes', (req, res) => {
  res.json(restaurantes);
});

// Crear restaurante
app.post('/restaurantes', (req, res) => {
  restaurantes.push(req.body);
  res.json({ mensaje: 'Restaurante agregado' });
});

// ========================
//  HEALTH & MÉTRICAS
// ========================

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', servicio: 'restaurantes' });
});

// Endpoint de métricas para Prometheus
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
const PORT = process.env.PORT || 3002;

app.listen(PORT, () => {
  console.log(`🍽️  Servicio RESTAURANTES corriendo en puerto ${PORT}`);
});
