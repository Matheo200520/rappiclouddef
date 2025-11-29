import http from 'k6/http';
import { sleep, check } from 'k6';
import { Trend } from 'k6/metrics';

// Métrica personalizada de latencia del servicio USUARIOS
export const latency = new Trend('usuarios_lista_latency');

export const options = {
  stages: [
    { duration: '20s', target: 5 },   // subida suave
    { duration: '40s', target: 15 },  // carga media
    { duration: '20s', target: 0 },   // bajada
  ],
  thresholds: {
    http_req_failed: ['rate<0.05'],   // menos del 5% de errores
    http_req_duration: ['p(95)<300'], // 95% de peticiones < 300 ms
  },
};

//  servicio de usuarios
const BASE_URL = 'http://localhost:3001';

export default function () {
  const res = http.get(`${BASE_URL}/lista`);

  latency.add(res.timings.duration);

  check(res, {
    'status es 200': (r) => r.status === 200,
  });

  sleep(1);
}
