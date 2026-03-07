# Estrategia de pruebas — Nexus DevSuite

Documento de referencia para estrategias de testing alineadas con reglas de dominio y aislamiento entre suites.

---

## Aislamiento de suites con reglas globales (anti-downgrade)

Las suites de releases utilizan **generación dinámica de BASE_VERSION** derivada de la última release en estado `RELEASED` en la base de datos. Esto evita colisiones entre suites cuando existen reglas globales como el anti-downgrade (la nueva versión debe ser mayor que la última publicada).

### Objetivos

- **Ejecución conjunta sin dependencia de orden:** Las suites pueden ejecutarse en cualquier orden (p. ej. `releases.negative.test.js` y `releases.hotfix.test.js`) sin fallos por versión menor o duplicada.
- **No debilitamiento de reglas de dominio:** El anti-downgrade y el resto de reglas de negocio se mantienen activas; los tests no las evitan ni las desactivan.
- **Aislamiento entre bloques de versiones:** Cada suite trabaja en un rango propio de versiones (major distinto), sin pisar datos de otras suites.
- **Escalabilidad para futuras suites:** Cualquier nueva suite de releases puede aplicar la misma fórmula y sumarse a la ejecución conjunta sin conflictos.

### Fórmula utilizada

En el `beforeAll` de cada suite que cree releases:

1. Obtener la última release publicada:
   - `latest = await releaseRepository.findLatestReleased()`
2. Calcular el bloque de versiones de la suite:
   - Si no existe ninguna: `baseMajor = 1`
   - Si existe: `baseMajor = latest.major + 10` (usando `parseSemVer(latest.version).major`)
3. Definir la versión base:
   - `BASE_VERSION = ${baseMajor}.0.0` (template literal: `` `${baseMajor}.0.0` ``)

Resumen en código:

```text
baseMajor = latest ? parseSemVer(latest.version).major + 10 : 1
BASE_VERSION = `${baseMajor}.0.0`
```

Todas las versiones creadas en esa suite deben derivarse de `BASE_VERSION` (p. ej. `${baseMajor}.0.1`, `${baseMajor}.1.0`, etc.), garantizando que sean mayores que cualquier `RELEASED` previa y que no se solapen con otras suites.

### Implementación en código

- **releases.negative.test.js:** Calcula `baseMajor` y `BASE_VERSION` en `beforeAll`; duplicado usa `BASE_VERSION`; anti-downgrade usa `${baseMajor}.0.1` (release válida) y versión rechazada `(baseMajor - 1).9.9` o `0.9.9`; el resto de tests usan `${baseMajor}.1.0` … `${baseMajor}.9.0`.
- **releases.hotfix.test.js:** Misma lógica de `baseMajor`/`BASE_VERSION`; tests usan `${baseMajor}.0.0`, `${baseMajor}.0.1`, `${baseMajor}.1.x`, etc.

### Reglas

- No usar versiones fijas (p. ej. `"1.0.0"`, `"505.0.0"`) en suites que creen releases; todas deben construirse de forma dinámica a partir de `baseMajor`/`BASE_VERSION`.
- No desactivar ni mockear anti-downgrade ni otras reglas de dominio para “facilitar” los tests.
- Ejecutar las suites de releases conjuntamente (p. ej. `npx jest src/tests/integration/releases/`) para validar que el aislamiento se cumple con cualquier orden de ejecución.

---

*Documento alineado con ISO 9001 y trazabilidad de evidencias de testing.*
