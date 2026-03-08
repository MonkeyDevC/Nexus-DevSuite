# Guía: Cómo subir tu entrega a GitHub (paso a paso)

**Para quien está aprendiendo Git/GitHub.**  
Esta guía explica el flujo de **subida a la rama master** y, más adelante, el uso de **ramas**.

---

## 1. Qué significa "subir a GitHub"

En la práctica son **dos pasos**:

| Paso | Comando | Qué hace |
|------|---------|----------|
| **1. Commit** | `git commit -m "mensaje"` | Guarda en tu PC todos los cambios que tienes preparados (staged), con una **descripción**. Todavía no se sube a internet. |
| **2. Push** | `git push` | Envía ese commit (y los anteriores que no estén en GitHub) a la **rama master** del repositorio en GitHub. Ahí ya lo ve todo el equipo. |

**Resumen:** Commit = "guardar con descripción en mi máquina". Push = "enviar esa guardada a GitHub".

---

## 2. Antes de hacer commit: comprobar qué vas a subir

Desde la **raíz del proyecto** (carpeta `NEXUS DevSuite`):

```bash
git status
```

- **"Changes to be committed"** = archivos que entrarán en el próximo commit.  
- Si algo no debería ir, quítalo del área de preparación:  
  `git restore --staged <ruta del archivo>`

---

## 3. Hacer el commit (con una descripción que refleje el impacto)

Un solo comando con el mensaje entre comillas. El mensaje debe describir **qué se hizo** y **por qué importa**.

**Ejemplo para esta entrega** (sistema de migración de agentes + sistema de entregas formalizado):

```bash
git commit -m "[CHECKLIST] Autor: Santy | Archivo: docs/ | Acción: Sistema de migración de agentes Cursor (docs/nexus-agents-rules, prompts migración y asumir rol) y formalización del sistema de entregas a GitHub (project-logs, SISTEMA_TRAZABILIDAD_LOGS, reportes diarios, checklist-change-log). Impacto: onboarding de nuevos miembros con un solo prompt; entregas trazables y documentadas antes de cada push."
```

**Qué dice ese mensaje:**
- **Qué se hizo:** migración de agentes (reglas .mdc, prompts) y sistema de entregas (logs, reportes, trazabilidad).
- **Impacto:** nuevos miembros pueden replicar el sistema de agentes con un prompt; cada entrega queda documentada antes de subir a GitHub.

Puedes acortar el mensaje si lo prefieres, pero que siempre incluya al menos: qué cambió y que se formalizó migración de agentes y entregas.

---

## 4. Subir a la rama master en GitHub (push)

Sigue en la raíz del proyecto:

```bash
git push origin master
```

- **origin** = el repositorio en GitHub (configurado al clonar o al añadir el remote).  
- **master** = la rama principal donde quieres que se vea la entrega.

Si tu rama por defecto ya es `master` y está enlazada con `origin`, a veces basta con:

```bash
git push
```

Si te pide usuario y contraseña: en GitHub ya no se usa contraseña de la cuenta; se usa un **Personal Access Token (PAT)** como contraseña, o login por navegador si tienes GitHub CLI / Git Credential Manager.

---

## 5. Resumen rápido para esta entrega

1. Abre la terminal en la carpeta **NEXUS DevSuite**.
2. Comprueba: `git status` (todo lo que quieras subir debe estar en "Changes to be committed").
3. Commit con descripción:
   ```bash
   git commit -m "[CHECKLIST] Autor: Santy | Archivo: docs/ | Acción: Sistema de migración de agentes Cursor y formalización del sistema de entregas a GitHub (trazabilidad, project-logs, reportes diarios)."
   ```
4. Subir a GitHub: `git push origin master` (o `git push` si ya está configurado).

Después de esto, tu entrega estará en la rama **master** del proyecto en GitHub y el impacto (migración de agentes + entregas formalizadas) quedará reflejado en la descripción del commit.

---

## 6. Próximo paso: trabajar con ramas

Cuando quieras hacer **otra modificación** y subirla en una **rama** (en lugar de directo a master), se hace así en resumen:

1. Crear una rama nueva a partir de master:  
   `git checkout -b nombre-de-la-rama`
2. Hacer tus cambios, luego:  
   `git add ...` → `git commit -m "..."` (igual que ahora).
3. Subir esa rama a GitHub:  
   `git push origin nombre-de-la-rama`
4. En GitHub puedes abrir un **Pull Request** de esa rama hacia **master** para revisar y fusionar.

En otro documento o mensaje podemos detallar el flujo de ramas con tus nombres concretos de rama y repositorio.
