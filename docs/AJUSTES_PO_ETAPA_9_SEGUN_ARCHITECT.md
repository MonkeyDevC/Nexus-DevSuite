# Ajustes para el PO — Etapa 9 Panel Administrativo (según SYSTEM ARCHITECT)

**Destinatario:** PO MASTER  
**Origen:** Validación arquitectónica SYSTEM ARCHITECT  
**Documentos de referencia:**  
- `docs/VALIDACION_ARQUITECTONICA_ETAPA_9_PANEL_ADMINISTRATIVO.md`  
- `docs/PLAN_ETAPA_9_PANEL_ADMINISTRATIVO.md`  
- `docs/PROMPT_MASTER_DEVELOPER_ETAPA_9_PANEL_ADMINISTRATIVO.md`

**Estado de la etapa:** APROBADA con observaciones. El PO debe incorporar los ajustes siguientes en el plan y en el prompt antes de enviar el prompt al MASTER DEVELOPER.

---

## 1. Resumen del análisis del arquitecto

- La etapa no modifica backend ni contratos; solo consume endpoints existentes.
- Endpoints usados: GET/POST/PUT/DELETE `/api/v1/users`, PATCH `/api/v1/users/:id/password`, GET `/api/v1/reports/audit`, GET `/api/v1/system/metrics`.
- No existe en el backend un endpoint GET `/roles`; el selector de rol debe basarse en la respuesta de GET /users o en valores documentados.
- Ajustes sugeridos: aclarar en plan y prompt el origen de `role_id`, el manejo de la respuesta de DELETE y el nombre/uso de utilidades UX reutilizables.

---

## 2. Ajustes al PLAN (PLAN_ETAPA_9_PANEL_ADMINISTRATIVO.md)

| Dónde | Ajuste sugerido |
|-------|------------------|
| **Sección 3.2 (Gestión de roles)** | Añadir una frase explícita: “El backend no expone GET /roles; el frontend debe obtener role_id desde la respuesta de GET /users (role_id o role en cada usuario) o desde CONTRATO_API.md / configuración documentada.” |
| **Sección 3.1 (Eliminar usuario)** | Dejar explícito: “Comprobar en CONTRATO_API.md el código de respuesta de DELETE /users/:id (p. ej. 204 sin cuerpo) y manejar esa respuesta en el frontend.” |
| **Sección 2 (Alcance) o 3.5** | Si en Etapa 8 el módulo de utilidades UX tiene otro nombre (no “ux.js”), sustituir “ux.js” por el nombre real (ej. “utilidades de tablas, filtros y paginación de Etapa 8” o el path correcto). |

No es obligatorio reescribir el plan entero; basta con añadir estos matices en los párrafos indicados.

---

## 3. Ajustes al PROMPT — Sección 9 (incorporar tras validación)

Añadir al prompt **una nueva sección 9** con el siguiente contenido (o equivalente), para que el MASTER DEVELOPER lo tenga como obligatorio:

---

### 9️⃣ OBSERVACIONES DEL SYSTEM ARCHITECT (incorporar en implementación)

1. **Selector de rol (role_id):** No existe endpoint GET /roles en el backend. Obtener las opciones MASTER/EMPLOYEE y sus `role_id` desde:
   - la respuesta de GET /api/v1/users (campo role_id o role en cada usuario), o  
   - CONTRATO_API.md / openapi.yaml si se documentan los UUID de roles, o  
   - constantes en frontend documentadas y alineadas con el backend.  
   No asumir ni llamar a GET /roles.

2. **DELETE /users/:id:** Comprobar en CONTRATO_API.md el código de respuesta (204 u otro) y el formato de la respuesta (sin cuerpo o con body). Implementar el manejo en el frontend según el contrato (actualizar listado, mensaje de éxito, etc.).

3. **Guard de rutas #/admin:** Comprobar rol MASTER antes de renderizar cualquier vista #/admin, #/admin/users, #/admin/audit, #/admin/metrics. Si el usuario no es MASTER, redirigir a #/dashboard (o mostrar acceso denegado). No confiar solo en ocultar el menú; proteger también el acceso por URL.

4. **Reutilización de UX:** Usar los mismos patrones de tablas, filtros, paginación y empty state que en Etapa 8. Si existe un archivo o módulo concreto (p. ej. ux.js o similar), referenciarlo por su nombre real en el proyecto.

---

## 4. Checklist para el PO

Antes de enviar el prompt al MASTER DEVELOPER, el PO debe:

- [ ] Haber incorporado en el **plan** los ajustes de la sección 2 (roles, DELETE, nombre de utilidades UX).
- [ ] Haber añadido al **prompt** la **sección 9** con las observaciones del arquitecto (sección 3 de este documento).
- [ ] Opcional: indicar en el prompt que la evidencia de entrega debe citar este documento de ajustes y la validación arquitectónica.

---

## 5. Referencia a la validación completa

Para el detalle de la validación (endpoints verificados, criterios de bloqueo, conclusión), ver:  
**`docs/VALIDACION_ARQUITECTONICA_ETAPA_9_PANEL_ADMINISTRATIVO.md`**
