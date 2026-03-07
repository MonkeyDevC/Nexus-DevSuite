# Estrategia futura de escalabilidad distribuida

Documentación técnica. **No se implementa Redis ni Prometheus en esta fase.**

---

## 1) Rate limit distribuido

### Estado actual

- In-memory.
- Per-instance.
- No compartido entre nodos.
- No cluster-aware.

### Limitación explícita

En multi-instancia cada nodo mantiene contador independiente; el límite efectivo por IP es N × límite por nodo (N = número de instancias).

### Evolución futura definida

- Redis centralizado como store del rate limiter.
- TTL por IP (o por usuario).
- Compatible con cluster y Kubernetes.
- Eliminación de almacenamiento en memoria local para el contador.

---

## 2) Métricas distribuidas

### Estado actual

- Métricas en memoria.
- No agregadas entre instancias.

### Evolución futura definida

- Prometheus scraping del endpoint `/api/v1/system/metrics` (o endpoint dedicado /metrics).
- Integración con Grafana.
- Métricas agregadas por servicio/cluster.

---

## 3) Shutdown en entorno orquestado

### Compatibilidad futura declarada

- Kubernetes SIGTERM lifecycle (ya soportado: señal SIGTERM inicia cierre ordenado).
- Readiness probe: endpoint que retorne 503 durante shutdown (ya soportado vía middleware 503).
- Liveness probe: endpoint de salud que no dependa de estado de cierre.
- Graceful termination period: configurable vía `SHUTDOWN_TIMEOUT_MS` (timeout máximo de cierre).

Las limitaciones declaradas en este documento coinciden con la implementación actual.
