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
  name: 'pedidos_http_request_duration_ms',
  help: 'Duración de las peticiones HTTP en el servicio PEDIDOS (ms)',
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

// Simulación de base de datos
let pedidos = []; // {id_pedido, usuario_id, items, total, estado, repartidor_id}

app.post('/pedidos', (req, res) => {
  const { usuario_id, items, total } = req.body;

  const nuevoPedido = {
    id_pedido: pedidos.length + 1,
    usuario_id,
    items,
    total,
    estado: 'pendiente',
    repartidor_id: null,
  };

  pedidos.push(nuevoPedido);
  res.json({ mensaje: 'Pedido creado', pedido: nuevoPedido });
});

app.get('/pedidos/:id', (req, res) => {
  const pedido = pedidos.find((p) => p.id_pedido == req.params.id);
  if (!pedido) return res.status(404).json({ error: 'Pedido no encontrado' });
  res.json(pedido);
});

app.patch('/pedidos/:id/estado', (req, res) => {
  const pedido = pedidos.find((p) => p.id_pedido == req.params.id);
  if (!pedido) return res.status(404).json({ error: 'Pedido no existe' });

  pedido.estado = req.body.estado;
  res.json({ mensaje: 'Estado actualizado', pedido });
});

// ========================
//  HEALTH & MÉTRICAS
// ========================

app.get('/health', (req, res) => {
  res.json({ status: 'ok', servicio: 'pedidos' });
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
const PORT = process.env.PORT || 3003;

app.listen(PORT, () => {
  console.log(`🛒 Servicio de PEDIDOS en puerto ${PORT}`);
});
