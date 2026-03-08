# Prompt de migración del sistema de agentes NEXUS DevSuite

**Objetivo:** Que un único agente de Cursor recree en este workspace la programación (cerebro) de todos los agentes del equipo NEXUS, con los mismos nombres y la misma programación que el equipo actual.

**Contexto:** Incorporación de un nuevo miembro al equipo. El nuevo miembro clona el repositorio y debe tener operativo el mismo sistema de agentes (reglas Cursor en `.cursor/rules/`) sin depender de una copia manual de archivos.

---

## Instrucción para el agente (copiar y pegar en Cursor)

```
Eres el agente de MIGRACIÓN DEL SISTEMA DE AGENTES NEXUS.

Tu ÚNICA tarea es instalar la programación (cerebro) de todos los agentes del proyecto NEXUS DevSuite en la carpeta de reglas de Cursor.

PASOS OBLIGATORIOS (ejecutar en este orden):

1. CREAR CARPETA DE DESTINO
   - Si no existe, crea la carpeta: .cursor/rules/
   - Si ya existe, úsala como destino.

2. ORIGEN DE LAS REGLAS
   - Todas las reglas (archivos .mdc) están en: docs/nexus-agents-rules/
   - Cada archivo de esa carpeta es la definición exacta de un agente/rol del equipo NEXUS.

3. CREAR CADA AGENTE (archivo .mdc)
   - Para CADA archivo en docs/nexus-agents-rules/ cuyo nombre termina en .mdc:
     a) Lee el contenido completo del archivo (desde la primera línea hasta la última).
     b) Crea o sobrescribe el archivo .cursor/rules/<MISMO_NOMBRE_EXACTO> con ese contenido byte a byte.
     c) No modifiques el contenido: ni frontmatter (--- description, alwaysApply ---) ni el cuerpo en markdown.
   - Nombres exactos que deben quedar en .cursor/rules/:
     - nexus-alcance-y-principios.mdc
     - nexus-arranque-servidor.mdc
     - nexus-autonomous-development-loop.mdc
     - nexus-contexto-arquitectonico.mdc
     - nexus-engineering-execution.mdc
     - nexus-logging-y-metricas.mdc
     - nexus-master-developer.mdc
     - nexus-migraciones.mdc
     - nexus-modificacion-y-documentacion.mdc
     - nexus-plan-maestro-etapas.mdc
     - nexus-po-master-gobernanza.mdc
     - nexus-qa-engineer.mdc
     - nexus-seguridad-y-errores.mdc
     - nexus-system-architect.mdc

4. VERIFICACIÓN
   - Tras crear/actualizar todos los archivos, confirma que en .cursor/rules/ existen exactamente los 14 archivos listados arriba y que cada uno tiene el mismo contenido que su origen en docs/nexus-agents-rules/.

RESTRICCIONES:
- No inventes ni omitas ningún archivo.
- No cambies nombres de archivo.
- No edites el contenido de las reglas (descripción, alwaysApply, ni el texto markdown).
- Si un archivo en .cursor/rules/ ya existe y tiene el mismo contenido que el origen, puedes dejarlo como está o sobrescribirlo; el resultado debe ser idéntico al origen.

Cuando termines, responde en una sola frase: "Migración completada: 14 reglas instaladas en .cursor/rules/."
```

---

## Uso por el nuevo miembro del equipo

1. **Clonar el repositorio** (si aún no lo tiene):
   ```bash
   git clone https://github.com/MonkeyDevC/Nexus-DevSuite.git
   cd Nexus-DevSuite
   ```

2. **Abrir el proyecto en Cursor** (File → Open Folder → Nexus-DevSuite).

3. **Abrir este documento** en Cursor: `docs/PROMPT_MIGRACION_AGENTES_NEXUS.md`.

4. **Copiar el bloque de instrucción** que está bajo "Instrucción para el agente (copiar y pegar en Cursor)" (desde "Eres el agente de MIGRACIÓN..." hasta "...en .cursor/rules/.").

5. **Pegar en el chat de Cursor** (Composer o Chat) y enviar. Un solo agente ejecutará la tarea y creará los 14 archivos en `.cursor/rules/`.

6. **Comprobar** que existe la carpeta `.cursor/rules/` con los 14 archivos `.mdc`. A partir de ahí, Cursor aplicará las reglas según su configuración (alwaysApply o por mención).

---

## Contenido de la carpeta origen (docs/nexus-agents-rules/)

En esta carpeta del repositorio se guardan las copias maestras de las reglas:

| Archivo | Rol / descripción breve |
|---------|--------------------------|
| nexus-alcance-y-principios.mdc | Alcance, principios y modelo mental del agente |
| nexus-arranque-servidor.mdc | Protocolo pre-flight y arranque del servidor |
| nexus-autonomous-development-loop.mdc | Loop de desarrollo autónomo |
| nexus-contexto-arquitectonico.mdc | Contexto arquitectónico del sistema |
| nexus-engineering-execution.mdc | Ejecución de ingeniería |
| nexus-logging-y-metricas.mdc | Logging y métricas |
| nexus-master-developer.mdc | MASTER DEVELOPER (MD NEXUS) |
| nexus-migraciones.mdc | Reglas de migraciones de BD |
| nexus-modificacion-y-documentacion.mdc | Modificación y documentación |
| nexus-plan-maestro-etapas.mdc | Plan maestro y etapas |
| nexus-po-master-gobernanza.mdc | PO MASTER – gobernanza |
| nexus-qa-engineer.mdc | QA ENGINEER |
| nexus-seguridad-y-errores.mdc | Seguridad y manejo de errores |
| nexus-system-architect.mdc | SYSTEM ARCHITECT (NEXUS ARCHITECT) |

**Importante:** No edites los archivos dentro de `docs/nexus-agents-rules/` salvo que quieras cambiar la “programación” que se instalará en todos los entornos. Cualquier cambio ahí será lo que el agente de migración copie a `.cursor/rules/` la próxima vez que se ejecute el prompt.
