# Evidencia de Cierre — Punto 1 / Fase 1 (Infra base)

## Estado de fase
- Estado: APROBADA (condicional a microajustes de gobernanza aplicados)
- Fecha de cierre endurecido: 2026-03-26
- Alcance: solo Fase 1, sin inicio de Fase 2

## 1) Archivos creados (Fase 1)
- `frontend-react/src/shared/http/requestConfig.js`
- `frontend-react/src/shared/http/index.js`

## 2) Archivos modificados (Fase 1)
- `frontend-react/eslint.config.js`

## 3) Reglas agregadas (guardrails bloqueantes)
- `no-restricted-imports` en severidad `error` para restringir `axios` fuera de `shared/http/httpClient.js` (con excepción temporal controlada).
- `no-restricted-syntax` en severidad `error` para restringir:
  - `fetch` en `frontend-react/src/**` (con excepción temporal controlada en pantallas existentes).
  - escritura efectiva de `nexus_access_token` y `nexus_refresh_token` fuera de `tokenStorage`, ya sea por literal o por constantes `KEY_ACCESS/KEY_REFRESH`.
- Regla de gobernanza reforzada (normativa):
  - ninguna escritura efectiva de tokens puede ocurrir fuera del futuro `shared/http/tokenStorage.js`, independientemente de si la key se pasa por literal, constante, variable, helper o wrapper.

## 4) Excepciones temporales activas (deuda controlada)

### EXC-HTTP-001
- Archivo: `frontend-react/src/services/apiClient.js`
- Regla exceptuada: `no-restricted-imports` (import de `axios`) + `no-restricted-syntax` (escritura efectiva de tokens)
- Motivo: puente transitorio antes de delegar al núcleo `shared/http` y autoridad residual de escritura token
- Fase exacta de eliminación: **Fase 2**
- Criterio de cierre:
  - `apiClient.js` deja de importar `axios`
  - `apiClient.js` delega completamente en `shared/http/index`
  - `apiClient.js` no realiza escrituras efectivas de `nexus_access_token`/`nexus_refresh_token`

### EXC-HTTP-002
- Archivos:
  - `frontend-react/src/pages/Backlog.jsx`
  - `frontend-react/src/pages/FeatureDetail.jsx`
  - `frontend-react/src/pages/Features.jsx`
  - `frontend-react/src/pages/IncidentDetail.jsx`
  - `frontend-react/src/pages/Incidents.jsx`
  - `frontend-react/src/pages/ReleaseDetail.jsx`
  - `frontend-react/src/pages/Releases.jsx`
  - `frontend-react/src/pages/SprintDetail.jsx`
  - `frontend-react/src/pages/Sprints.jsx`
  - `frontend-react/src/pages/StoryDetail.jsx`
- Regla exceptuada: `no-restricted-syntax` (uso de `fetch`)
- Motivo: consumo legacy-react preexistente, fuera de alcance de Fase 1
- Fase exacta de eliminación: **Punto 1, cierre de Fase 4**
- Criterio de cierre:
  - cero usos de `fetch` en `frontend-react/src/pages/*`
  - consumo migrado a `shared/http/index`

### EXC-HTTP-003
- Archivo: `frontend-react/src/context/AuthContext.jsx`
- Regla exceptuada: `no-restricted-syntax` (escritura efectiva de tokens)
- Motivo: autoridad residual de escritura token en flujo de sesión previo a `tokenStorage`
- Fase exacta de eliminación: **Fase 2**
- Criterio de cierre:
  - `AuthContext.jsx` no realiza escrituras efectivas de `nexus_access_token`/`nexus_refresh_token`
  - `AuthContext.jsx` coordina sesión sin autoridad de persistencia de tokens

## 5) Clasificación de usos de tokens (estado Fase 1)

### `nexus_access_token`
- `frontend-react/src/services/apiClient.js`
  - Clasificación: **consumo permitido sin autoridad** (lectura) + **escritura residual a eliminar**
  - Riesgo: **autoridad ambigua de sesión** (escribe/limpia tokens fuera del storage autorizado objetivo)
  - Acción planificada: mover escritura/limpieza a `tokenStorage` en Fase 2
- `frontend-react/src/context/AuthContext.jsx`
  - Clasificación: **escritura residual a eliminar**
  - Riesgo: **autoridad ambigua de sesión** (escribe/limpia tokens fuera del storage autorizado objetivo)
  - Acción planificada: en Fase 2 deja de escribir storage directo; pasa a coordinación por sesión
- `frontend-react/src/utils/runtimeMode.js`
  - Clasificación: **consumo permitido sin autoridad** (lectura de estado)
  - Acción planificada: mantener lectura de runtime, sin autoridad de storage
- `frontend-react/src/pages/*.jsx` (archivos en EXC-HTTP-002)
  - Clasificación: **lectura temporal permitida**
  - Acción planificada: eliminar al migrar consumo HTTP en Punto 1

### `nexus_refresh_token`
- `frontend-react/src/services/apiClient.js`
  - Clasificación: **consumo permitido sin autoridad** (lectura) + **escritura residual a eliminar**
  - Riesgo: **autoridad ambigua de sesión** (escribe/limpia tokens fuera del storage autorizado objetivo)
  - Acción planificada: mover escritura/limpieza a `tokenStorage` en Fase 2
- `frontend-react/src/context/AuthContext.jsx`
  - Clasificación: **escritura residual a eliminar**
  - Riesgo: **autoridad ambigua de sesión** (escribe/limpia tokens fuera del storage autorizado objetivo)
  - Acción planificada: dejar de escribir storage directo en Fase 2

## 6) Blindaje de autoridad de sesión (declaración formal)
- `AuthContext.jsx` **no será autoridad de storage** en Fase 2.
- `runtimeMode.js` **no será autoridad de sesión**; solo evalúa estado runtime.
- La autoridad de persistencia de sesión será `shared/http/tokenStorage.js` (a crear en Fase 2).
- Prohibición vigente: escritura efectiva de tokens fuera de `tokenStorage` (regla bloqueante activa).

## 7) Validaciones ejecutadas
- Lint ejecutado en `frontend-react`:
  - comando: `npm run lint`
  - resultado: **OK** (exit code 0)
- Verificación de patrones (evidencia técnica):
  - `axios` detectado solo en `src/services/apiClient.js` (excepción EXC-HTTP-001)
  - `fetch` detectado en pantallas listadas en EXC-HTTP-002
  - se detectaron escrituras efectivas residuales de tokens por constantes `KEY_ACCESS/KEY_REFRESH` en:
    - `src/services/apiClient.js`
    - `src/context/AuthContext.jsx`
  - estas escrituras quedan formalmente registradas como deuda obligatoria de eliminación en Fase 2 (EXC-HTTP-001 y EXC-HTTP-003)

## 8) Riesgos residuales de Fase 1
- Persisten usos legacy de `fetch` en pantallas (controlados por EXC-HTTP-002).
- Persisten escrituras de tokens en `apiClient/AuthContext` hasta Fase 2 (deuda controlada, salida definida).
- Riesgo de ambigüedad mitigado con fase exacta de eliminación y criterio de cierre por excepción.

## 9) Criterio formal de invalidez de Fase 1
La Fase 1 se considera **INVÁLIDA** si ocurre cualquiera de los siguientes casos:
- aparece nuevo `axios` fuera de `shared/http/httpClient.js` y fuera de excepción aprobada EXC-HTTP-001.
- aparece nuevo `fetch` fuera de excepción aprobada EXC-HTTP-002.
- existe cualquier nueva escritura efectiva de `nexus_access_token` o `nexus_refresh_token` fuera del futuro `tokenStorage`, incluso si la key se pasa por constante, variable, helper o wrapper.
- existe cualquier excepción activa sin fase exacta de eliminación y sin criterio de cierre verificable.

## 10) Condición explícita de entrada a Fase 2
- Fase 2 inicia con obligación operativa de eliminar toda autoridad real de escritura de tokens fuera de `shared/http/tokenStorage.js`.
- Esto incluye escrituras por literal, constante, variable, helper y wrapper.
- Cierre mínimo de obligación en Fase 2:
  - `src/services/apiClient.js` sin escritura/limpieza de tokens.
  - `src/context/AuthContext.jsx` sin escritura/limpieza de tokens.
  - toda persistencia concentrada en `tokenStorage`.

## 11) Resultado de cierre
- Fase 1 queda cerrada con guardrails bloqueantes, excepciones formalizadas como deuda controlada y evidencia mínima ISO persistida.
- Condición para avanzar: aprobación explícita y mantenimiento de este estado de control hasta iniciar Fase 2.

