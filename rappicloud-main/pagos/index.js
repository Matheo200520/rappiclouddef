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
  name: 'pagos_http_request_duration_ms',
  help: 'Duración de las peticiones HTTP en el servicio PAGOS (ms)',
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

let pagos = []; // {id_transaccion, pedido_id, monto, metodo_pago, status}

app.post('/pagos/confirmar', (req, res) => {
  const { pedido_id, monto, metodo_pago } = req.body;

  const nuevoPago = {
    id_transaccion: pagos.length + 1,
    pedido_id,
    monto,
    metodo_pago,
    status: 'aprobado', // simulación
  };

  pagos.push(nuevoPago);

  res.json({ mensaje: 'Pago aprobado', pago: nuevoPago });
});

app.get('/pagos/:id', (req, res) => {
  const pago = pagos.find((p) => p.id_transaccion == req.params.id);
  if (!pago) return res.status(404).json({ error: 'Pago no encontrado' });

  res.json(pago);
});

// ========================
//  HEALTH & MÉTRICAS
// ========================

app.get('/health', (req, res) => {
  res.json({ status: 'ok', servicio: 'pagos' });
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
const PORT = process.env.PORT || 3004;

app.listen(PORT, () => {
  console.log(`💳 Servicio de PAGOS en puerto ${PORT}`);
});
