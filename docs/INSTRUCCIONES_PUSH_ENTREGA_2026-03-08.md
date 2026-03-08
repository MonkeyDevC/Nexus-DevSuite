# Instrucciones para subir la entrega del 2026-03-08 a GitHub

Según **docs/SISTEMA_TRAZABILIDAD_LOGS.md** y **docs/project-logs/README.md**, el commit y el push se realizan **manualmente** al final de la jornada.

---

## Requisitos ya cumplidos

- [x] Reporte diario: `docs/project-logs/daily-dev-report-2026-03-08.md`
- [x] Entrada en log de cambios: `docs/project-logs/checklist-change-log.md`
- [x] Actualización de checklist: `docs/CHECKLIST_ETAPAS_PROYECTO.md` (resumen de estado + sección "Mejoras incorporación nuevos miembros")

---

## Comandos para ejecutar (en la raíz del proyecto)

Abre una terminal en la raíz del proyecto (`D:\BACKUP\NEXUS DevSuite` o la ruta que uses) y ejecuta:

```bash
git add .
git status
```

Revisa que se incluyan los archivos esperados (scripts, docs, env.js, dev-clean.ps1, package.json, npm.bat, etc.). Luego:

```bash
git commit -m "[CHECKLIST] Autor: <tu_nombre> | Archivo: docs/CHECKLIST_ETAPAS_PROYECTO.md | Acción: Mejoras incorporación nuevos miembros (onboarding), conexión BD, scripts sin npm en PATH, NPM_NO_RECONOCIDO"
git push
```

Sustituye `<tu_nombre>` por tu nombre o identificador (ej. *Santy*, *Equipo NEXUS*).

---

## Formato de commit (referencia)

El estándar del proyecto para commits que afectan checklists/tareas es:

```
[CHECKLIST] Autor: <nombre> | Archivo: <archivo> | Acción: <resumen>
```

Si prefieres un mensaje más corto:

```
[CHECKLIST] Autor: <tu_nombre> | Archivo: docs/CHECKLIST_ETAPAS_PROYECTO.md | Acción: Onboarding y conexión BD 2026-03-08
```

---

## Después del push

- La entrega quedará registrada en el repositorio.
- El PO puede auditar el cierre con el reporte diario y el log de cambios.

**Referencia:** docs/SISTEMA_TRAZABILIDAD_LOGS.md, docs/project-logs/README.md.
