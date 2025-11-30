# Rappicloud – Plataforma de entrega basada en microservicios 

## 1. Integrantes y roles


- Matheo Lopez Caicedo 1 – Arquitectura / Backend  
- Jorge Ivan Quijano Landazuri 2 – DevOps / CI/CD  
- Cristian Fernando Quiñones Cabezas 3 – Monitoreo / Pruebas  
- Deivi Santiago Quezada Lerma 4 – Documentación / Video  


## 2. Descripción general del sistema

Rappicloud es una **aplicación cloud modular** que simula una plataforma de domicilios
(tipo Rappi). El sistema está dividido en **microservicios independientes**, orquestados
con Docker Compose y expuestos a través de un **API Gateway**.

Flujo general (vista lógica):

1. El usuario se registra y hace login (`usuarios`).
2. Consulta restaurantes y crea un pedido (`restaurantes`, `pedidos`).
3. El pedido genera un proceso de pago (`pagos`).
4. Un repartidor acepta el pedido (`repartidores`).
5. Se envía una notificación al usuario (`notificaciones`).
6. Todo el tráfico pasa por el `api-gateway`.

> Nota: Para el alcance del proyecto formativo, algunos flujos están simulados
> (por ejemplo, pagos y notificaciones), pero la estructura y la arquitectura
> se mantienen orientadas a un entorno cloud real.

---

## 3. Arquitectura y microservicios

### 3.1 Visión general

La arquitectura está basada en **microservicios** comunicados vía HTTP:

- Cada servicio tiene su propio **puerto**, **código**, **Dockerfile** y **lógica**.
- Todos los servicios se levantan con `docker-compose` desde la raíz del proyecto.
- Cada microservicio expone:
  - un endpoint de **salud** (`/health`),
  - y un endpoint de **métricas** (`/metrics`) en formato Prometheus.

### 3.2 Microservicios

- `usuarios` (puerto 3001)  
  - Gestión básica de usuarios (simulada).
  - Endpoints de ejemplo:
    - `GET /` → “Servicio USUARIOS funcionando ”
    - `GET /lista` → lista de usuarios demo.
    - `GET /health` → estado del servicio.
    - `GET /metrics` → métricas para Prometheus.

- `restaurantes` (puerto 3002)  
  - Gestión de restaurantes (simulada).

- `pedidos` (puerto 3003)  
  - Gestión de pedidos y estados.

- `pagos` (puerto 3004)  
  - Simulación de procesamiento de pagos.

- `repartidores` (puerto 3005)  
  - Asignación de repartidores (simulada).

- `notificaciones` (puerto 3006)  
  - Simulación de notificaciones al usuario.

- `api-gateway` (puerto 8000)  
  - Punto central de entrada para los clientes.
  - Encapsula la complejidad de los microservicios internos.

En `/evidencias/arquitectura` se incluye el **diagrama de arquitectura** que resume
esta estructura (microservicios, gateway, monitoreo).

---

## 4. Tecnologías y herramientas

- **Backend y microservicios**
  - Node.js, Express
  - prom-client (métricas Prometheus)

- **Contenedores y orquestación**
  - Docker
  - Docker Compose

- **Monitoreo**
  - Prometheus (recolección de métricas)
  - Grafana (visualización de dashboards)

- **Pruebas de rendimiento**
  - k6 (pruebas de carga y estrés)

- **Control de versiones / CI/CD (pendiente por el equipo)**
  - Git, GitHub  
  - GitHub Actions (planificado para pipeline CI/CD)

---

## 5. Cómo ejecutar el proyecto

### 5.1 Requisitos

- Docker Desktop instalado y en ejecución.
- Docker Compose configurado.
- (Opcional) k6 instalado para ejecutar las pruebas de rendimiento de forma local.

### 5.2 Levantar todos los servicios con Docker

Desde la raíz del proyecto (`rappicloud-main/rappicloud-main`):

```bash
docker-compose up --build

---

## 6. Simulación de Autoescalado

Para demostrar escalabilidad horizontal, se usó Docker Compose con la opción `--scale`.

### 6.1 Prueba inicial

- Configuración: 1 réplica del servicio `pedidos`
- Carga: 15–20 VUs con k6
- Resultado:
  - Latencia p95: 350 ms (aprox. antes del escalado)
  - Errores: 4%

### 6.2 Autoescalado

```bash
docker-compose up -d --scale pedidos=3


  - Docker creó y levantó las nuevas réplicas: rappiclouddef-pedidos-2 y rappiclouddef-pedidos-3.

  - Todos los servicios principales (usuarios, notificaciones, repartidores, restaurantes, pagos, api-gateway, prometheus, grafana) se mantuvieron corriendo.

 ## 3. Prueba después del escalado

  - Resultado con k6:
    - Latencia p95 bajó a ~1.8 ms para el endpoint de usuarios (muy rápida tras el escalado).
    - Errores: 0%, es decir, <1%
    - Interpretación: el sistema soportó la carga sin fallos y mejoró significativamente la latencia bajo un mayor número de réplicas.

 ## Conclusión:
  - El sistema mostró mejora significativa bajo mayor carga, evidenciando capacidad de escalamiento horizontal mediante contenedores.
