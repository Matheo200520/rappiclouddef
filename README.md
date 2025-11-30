# Rappicloud – Plataforma de entrega basada en microservicios 

## 1. Integrantes y roles


- Matheo 1 – Arquitectura / Backend  
- Jorge 2 – DevOps / CI/CD  
- Cristian 3 – Monitoreo / Pruebas  
- Santiago 4 – Documentación / Video  


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
