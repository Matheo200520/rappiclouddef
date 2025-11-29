const express = require('express');
const cors = require('cors');
require('dotenv').config();
const { createProxyMiddleware } = require('http-proxy-middleware');
const client = require('prom-client');

const app = express();
app.use(cors());
app.use(express.json());

// ========================
//  MÉTRICAS – PROMETHEUS
// ========================

// Recolectar métricas por defecto (CPU, memoria, etc.)
client.collectDefaultMetrics();

// Histograma para medir duración de las peticiones HTTP
const httpRequestDurationMs = new client.Histogram({
  name: 'gateway_http_request_duration_ms',
  help: 'Duración de las peticiones HTTP en el API Gateway (ms)',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [50, 100, 200, 300, 400, 500, 1000] // rangos en ms
});

// Middleware para medir cada request que pasa por el gateway
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
//  API GATEWAY – RAPPLICLOUD
// ========================

// Log de todas las peticiones
app.use((req, res, next) => {
  console.log(`[Gateway] ${req.method} - ${req.originalUrl}`);
  next();
});

// Home
app.get('/', (req, res) => {
  res.send('API Gateway RappiCloud funcionando ✅');
});

// Health check del gateway
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'api-gateway' });
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
//  PROXIES A MICROSERVICIOS
// ========================

// Helper para crear proxys
const makeProxy = (path, target) =>
  app.use(
    path,
    createProxyMiddleware({
      target,
      changeOrigin: true,
      logLevel: 'debug',
      pathRewrite: {
        [`^${path}`]: '', // /servicio → /
      },
      onError(err, req, res) {
        console.error(`>>> [Gateway][ERROR ${path}]:`, err.message);
        if (!res.headersSent) {
          res
            .status(502)
            .json({ error: `Error en el gateway al conectar con ${path}` });
        }
      },
    })
  );

// Usuarios
makeProxy('/usuarios', 'http://usuarios:3001');

// Restaurantes
makeProxy('/restaurantes', 'http://restaurantes:3002');

// Pedidos
makeProxy('/pedidos', 'http://pedidos:3003');

// Pagos
makeProxy('/pagos', 'http://pagos:3004');

// Repartidores
makeProxy('/repartidores', 'http://repartidores:3005');

// Notificaciones
makeProxy('/notificaciones', 'http://notificaciones:3006');

// ========================
//  INICIO DEL GATEWAY
// ========================
const PORT = process.env.PORT || 8000;

app.listen(PORT, () => {
  console.log(`🚀 API Gateway corriendo en puerto ${PORT}`);
  console.log('🛣  Rutas activas:');
  console.log('   /usuarios       → usuarios:3001');
  console.log('   /restaurantes   → restaurantes:3002');
  console.log('   /pedidos        → pedidos:3003');
  console.log('   /pagos          → pagos:3004');
  console.log('   /repartidores   → repartidores:3005');
  console.log('   /notificaciones → notificaciones:3006');
  console.log('   /metrics        → métricas del API Gateway');
});
