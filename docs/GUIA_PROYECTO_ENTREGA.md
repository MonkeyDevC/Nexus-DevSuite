# Guía: Crear un proyecto y hacer Release Planning desde Nexus DevSuite

Esta guía te permite **acoplar Nexus DevSuite con tu código actual**: crear un proyecto para esta entrega y hacer el ejercicio de planeación de versiones **directamente desde la aplicación**, sin necesidad de subir nada a GitHub hasta que decidas publicar.

---

## Requisitos previos

- Nexus DevSuite en ejecución (backend y frontend).
- Usuario con rol **MASTER** o **EMPLOYEE** (para crear proyectos y releases).
- Navegador abierto en la URL del frontend (ej. `http://localhost:3000` o la que uses).

---

## Paso 1: Ir a Proyectos

1. En el menú lateral, haz clic en **Proyectos** (o abre `#/projects`).
2. Verás la lista de proyectos de la organización. Si es la primera vez, puede estar vacía.

---

## Paso 2: Crear el proyecto para esta entrega

1. Busca el botón **Crear proyecto** / **Nuevo proyecto** (o similar) en la vista de proyectos.
2. Completa el formulario:
   - **Nombre**: por ejemplo `NEXUS DevSuite` o `Entrega Release Planning`.
   - **Descripción** (opcional): ej. "Proyecto para planificar versiones del producto Nexus DevSuite".
   - Los demás campos que pida el formulario (según tu versión de Nexus).
3. Guarda. El proyecto aparecerá en la lista y tendrá un **ID** (UUID).

**Importante:** Anota mentalmente el proyecto o ábrelo desde la lista; lo usarás en los siguientes pasos.

---

## Paso 3: Crear Features del proyecto

Las **releases** se planifican por **Features**. Para esta entrega necesitas al menos una o varias features que representen el alcance del producto o de la versión.

1. Entra al proyecto:
   - Desde la lista de proyectos, haz clic en el nombre del proyecto o en "Ver" / detalle.
   - O ve a **Features** en el menú y filtra por este proyecto (si la vista lo permite).
2. Crea las features que quieras incluir en la primera release, por ejemplo:
   - **Release Planning**: planificación de versiones por proyecto.
   - **Sincronización con GitHub**: tags y releases desde Nexus.
   - **Eliminación de planeación**: borrar releases no publicadas.
   - O una sola feature genérica: **Entrega v0.1.0**.

En cada feature indica al menos **título** (y descripción si quieres). Guarda.

---

## Paso 4: Abrir Release Planning del proyecto

1. Con el proyecto ya creado, entra al detalle del proyecto (desde la lista de proyectos).
2. En la tarjeta o acciones del proyecto, haz clic en **Release Planning** (o en el enlace que lleve a `#/projects/<projectId>/releases`).
3. Se abrirá la vista **Release Planning** de ese proyecto. Verás la lista de releases (vacía si es la primera vez).

---

## Paso 5: Crear la release (versión)

1. En Release Planning, haz clic en **Create Release**.
2. Se abrirá el modal de formulario:
   - **Versión** (obligatorio): por ejemplo `v0.1.0` o `v0.2.0`. Nexus puede sugerir la siguiente versión si ya tienes alguna en GitHub o en el proyecto.
   - **Nombre** (opcional): ej. "Primera entrega" o "Release Planning + GitHub Sync".
   - **Descripción** (opcional): resumen de lo que incluye la versión.
   - **Fecha planificada** (opcional): si quieres fijar una fecha.
3. Pulsa **Crear**. La release se crea en estado **PLANNING** y se abre el detalle de la release.

---

## Paso 6: Asociar Features a la release

1. En el detalle de la release verás dos bloques:
   - **Planned Features**: features que forman parte de esta versión (inicialmente vacío).
   - **Available Features**: features del proyecto que aún no están en la release.
2. Para cada feature que quieras incluir en esta entrega, haz clic en **Add** en la fila correspondiente de **Available Features**.
3. Las features pasarán a **Planned Features**. Puedes usar **Remove** para quitarlas mientras la release siga en **PLANNING**.
4. El **Resumen técnico** (Features, Stories, Work Orders, Code Deliveries, PRs, Commits) se actualiza según las features añadidas. Si aún no tienes stories/work orders/deliveries vinculados, los números serán 0; es normal para una primera planeación.

---

## Paso 6b: Subir tu código (Cursor) a Nexus mediante User Story y orden de trabajo

Para que el trabajo que tienes en Cursor quede **registrado en Nexus** y vinculado a la release (y luego a una rama/PR en GitHub), sigue esta cadena: **User Story → Orden de trabajo → Entrega de código**. Así el resumen técnico de la release (Work Orders, Code Deliveries, PRs) reflejará tu entrega.

### 6b.1 Crear una User Story (si no tienes)

1. Ve al **Product Backlog** del proyecto (`#/projects` → abre el proyecto → Backlog, o menú **Product Backlog** y filtra por el proyecto).
2. Crea una **User Story** asociada a una **Feature que ya esté en la release** (por ejemplo la feature "Release Planning" o "Entrega v0.1.0" que añadiste en el paso 6).
   - Título: por ejemplo "Implementar Release Planning en Nexus" o "Entrega de código v0.1.0".
   - Asigna la feature correcta y guarda.

### 6b.2 Crear una orden de trabajo (Work Order) para esa User Story

1. Desde el **Product Backlog** del proyecto, haz clic en **Órdenes de trabajo** (enlace que lleva a `#/projects/<projectId>/work-orders`).
2. Pulsa **Crear orden de trabajo** (o "Create Work Order").
3. En el modal:
   - **Historia de usuario**: selecciona la User Story que creaste (o una existente de una feature de la release).
   - **Título** y **Descripción** (opcional): por ejemplo "Desarrollo Release Planning" o "Entrega código Cursor".
4. Guarda. La orden de trabajo aparece en la lista (estado PENDING u otro).

### 6b.3 Registrar la entrega de código (Code Delivery)

1. Entra al **detalle de la orden de trabajo** (clic en **View** o en la fila).
2. En la sección **Tasks**: crea al menos una **Task** con **Add Task** (título y descripción si quieres). Sin al menos una task no podrás crear la entrega.
3. En la sección **Entregas de código**, pulsa **Crear entrega**.
4. En el modal **Crear entrega de código**:
   - **Task**: elige la task que creaste.
   - **Título**: por ejemplo "Release Planning + sync GitHub".
   - **Tipo**: el que aplique (Feature, Bugfix, etc.).
5. Guarda. La **entrega de código** queda registrada en Nexus y vinculada a la Work Order y a la User Story (y por tanto a la Feature y a la release).

### 6b.4 (Opcional) Llevar la entrega a GitHub (rama y PR)

1. Con la **conexión GitHub** del proyecto ya configurada, ve a **Repository** del proyecto (`#/projects/<projectId>/repository`).
2. En la tabla **Entregas de código** verás la entrega que creaste.
3. **Crear rama**: pulsa el botón de crear rama para esa entrega. Nexus creará la rama en el repositorio (por ejemplo `delivery/ot-1-entrega-cursor`).
4. En tu máquina (Cursor): haz push de tu código local a esa rama (`git push origin <nombre-rama>`).
5. **Crear PR**: desde la misma vista Repository puedes pulsar **Create PR** para esa entrega y abrir el Pull Request en GitHub.

Con esto, tu código en Cursor queda **subido y trazado en Nexus** (User Story → Work Order → Code Delivery → rama/PR) y el resumen de la release mostrará esas entregas y, cuando existan, los PRs y commits.

---

## Paso 7: Cambiar estado de la release (opcional)

- Si la planificación está lista y no quieres publicar aún en GitHub, puedes cambiar el estado a **READY** (selector "Cambiar estado" en la cabecera).
- En **READY** ya no se pueden agregar ni quitar features; más adelante podrás pulsar **Publish Release** cuando conectes GitHub.

---

## Paso 8: (Opcional) Conectar GitHub y publicar después

Cuando quieras llevar la versión al repositorio real:

1. Configura la **conexión GitHub** del proyecto (OAuth o token en backend) según tu instalación.
2. En Release Planning del proyecto, usa **Sync from GitHub** para importar versiones/tags existentes si ya tienes un `v0.1.0` en el repo.
3. Para una release en estado **READY**, entra al detalle y pulsa **Publish Release**. Nexus creará el tag y la GitHub Release y actualizará el estado a **RELEASED**.

Todo esto lo puedes hacer **después**; la planeación en Nexus es independiente de GitHub hasta que decidas publicar.

---

## Resumen del flujo (sin GitHub al inicio)

| Paso | Dónde | Acción |
|------|--------|--------|
| 1 | Menú → Proyectos | Ir a lista de proyectos |
| 2 | Vista Proyectos | Crear proyecto (nombre, descripción) |
| 3 | Proyecto → Features / Vista Features | Crear features (título, descripción) |
| 4 | Proyecto → Release Planning | Abrir Release Planning del proyecto |
| 5 | Release Planning | Create Release → completar versión, nombre, etc. |
| 6 | Detalle de la release | Add en Available Features para incluir en la versión |
| **6b** | **Backlog → Órdenes de trabajo → Detalle WO** | **Crear User Story (si falta) → Crear orden de trabajo → Crear task → Crear entrega de código** (registra tu código de Cursor en Nexus) |
| 7 | Detalle de la release | Cambiar estado a READY si ya no vas a editar |
| 8 | (Opcional) Repository | Conectar GitHub → Crear rama / push / Create PR para la entrega |
| 9 | (Más adelante) | Publish Release cuando quieras publicar la versión en GitHub |

Así tienes el código **planificada y registrada en Nexus DevSuite** (release + features + stories + órdenes de trabajo + entregas de código); puedes subir a GitHub cuando elijas (rama, PR, Publish Release).

---

## Paso a paso: Probar subida de entrega y publicación en GitHub

Sigue estos pasos en orden para **subir una entrega desde Nexus DevSuite y publicarla en GitHub** de punta a punta.

### Requisitos previos

- Backend y frontend de Nexus DevSuite en ejecución.
- Usuario con rol **MASTER** o **EMPLOYEE**.
- Proyecto creado con al menos una **Feature** y una **Release** (versión, ej. v0.1.0) con esa feature en **Planned Features**.
- Una **User Story** de esa feature, una **Orden de trabajo** (Work Order) de esa story, una **Task** en esa WO y una **Code Delivery** creada (ver Pasos 6b.1–6b.3 arriba).
- **Conexión GitHub** del proyecto configurada (OAuth o `GITHUB_TOKEN` en el backend y repo configurado).

---

### Paso A: Crear la rama de la entrega en GitHub

1. Ve a **Repository** del proyecto: menú o `#/projects/<projectId>/repository`.
2. En la tabla **Entregas de código** localiza tu entrega.
3. Pulsa **Crear rama**. Nexus creará la rama en el repositorio (ej. `feature/task-1-release-planning`).
4. Si no hay conexión GitHub, conéctala antes (botón **Conectar con GitHub** y flujo OAuth).

---

### Paso B: Subir el código desde Delivery Workspace (sin Git local)

> **Tutorial detallado:** Para un paso a paso completo del Delivery Workspace (añadir archivos, Commit & Push, crear PR, Code Review, etc.), consulta [Tutorial: Cómo usar el Delivery Workspace para subir una entrega](TUTORIAL_DELIVERY_WORKSPACE.md).

1. En la misma tabla de entregas, pulsa **Workspace** en la fila de tu entrega. Se abre **Delivery Workspace** (`#/projects/<projectId>/deliveries/<deliveryId>/workspace`).
2. **Añadir archivos** (puedes usar una de las dos formas):
   - **Subir desde proyecto (git status + carpeta) — recomendado:**
     - **Paso 1:** En la consola de tu proyecto (en la raíz), ejecuta `git status` o `git status --short`. Copia la salida completa y pégala en el cuadro **Paso 1 — Salida de git status**. Pulsa **Extraer archivos modificados**. Se mostrará el listado de archivos que Git considera modificados/nuevos.
     - **Paso 2:** Haz clic en **Paso 2 — Carpeta del proyecto** y selecciona la carpeta raíz de tu proyecto (la misma que en Cursor). Solo se listarán los archivos que coincidan con el listado del Paso 1; las rutas se conservan al subir a GitHub.
     - **(Opcional)** Si las rutas incluyen el nombre de la carpeta (ej. `NEXUS DevSuite/src/index.js`), indica en **Prefijo a quitar de rutas** ese nombre (ej. `NEXUS DevSuite/`) para que en GitHub queden en la raíz (ej. `src/index.js`).
     - Marca los archivos que quieras subir (**Seleccionar todos** si quieres todos) y pulsa **Subir seleccionados a la entrega**.
   - **Subir archivo a mano:** en **Subir archivo**, escribe la **ruta** (ej. `src/index.js`) y el **contenido**, luego **Añadir archivo**. Repite si hace falta.
3. **(Opcional) Revisión con IA:** en la sección **AI Code Review** pulsa **Run AI Review**. Revisa resumen, issues, advertencias de seguridad y mejoras. Si el riesgo es alto, Nexus te avisará; no bloquea el flujo.
4. **Commit & Push:**
   - Escribe un **mensaje de commit** (ej. `feat: add release planning module`).
   - Pulsa **Commit & Push**. Nexus hará commit y push a la rama de la entrega en GitHub.
5. Comprueba en GitHub que la rama existe y tiene los commits.

---

### Paso C: Crear el Pull Request

1. Vuelve a **Repository** del proyecto (`#/projects/<projectId>/repository`).
2. En la fila de tu entrega, pulsa **Crear PR**.
3. Si no hay revisión de IA previa, Nexus puede sugerirte **Run AI Code Review before creating PR**. Puedes ir al Workspace, ejecutar la revisión y volver, o continuar y crear el PR igualmente.
4. Si la revisión de IA dio **riesgo alto**, se mostrará una advertencia; puedes crear el PR de todos modos (es solo recomendación).
5. Se abrirá el Pull Request en GitHub (o Nexus lo creará y te mostrará el enlace). Abre el enlace y termina el flujo en GitHub (review, merge, etc.).

---

### Paso D: Publicar la release en GitHub (opcional)

1. Ve a **Release Planning** del proyecto (`#/projects/<projectId>/releases`).
2. Si la release está en **PLANNING**, entra al detalle y cambia el estado a **READY** (selector **Cambiar estado**).
3. Entra al detalle de la release y pulsa **Publish Release**. Nexus creará el **tag** (ej. v0.1.0) y la **GitHub Release** en el repositorio y pondrá la release en estado **RELEASED**.
4. Verifica en GitHub que aparecen el tag y la Release.

---

### Resumen del flujo de prueba

| Paso | Dónde | Acción |
|------|--------|--------|
| A | Repository | **Crear rama** para la entrega |
| B | Workspace (enlace desde Repository) | **Añadir archivos** → (opcional) **Run AI Review** → **Commit & Push** |
| C | Repository | **Crear PR** → revisar/mergear en GitHub |
| D | Release Planning → detalle release | **Publish Release** (tag + GitHub Release) |

Con esto habrás probado: **registro de la entrega en Nexus → rama en GitHub → código subido desde Nexus (Delivery Workspace) → PR creado → release publicada en GitHub**.
