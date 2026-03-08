# Si el terminal no reconoce `npm` o `node`

Node.js está instalado en `C:\Program Files\nodejs` y ya está añadido al **PATH de Windows** (usuario y sistema). Si aun así el terminal dice *"npm no se reconoce"*, suele ser porque **la terminal se abrió antes de que se actualizara el PATH** (o Cursor se inició antes del cambio).

---

## Error: "la ejecución de scripts está deshabilitada" (npm.ps1 bloqueado)

Si al ejecutar `npm` aparece un error de **Execution Policy** o **scripts deshabilitados**, PowerShell está bloqueando `npm.ps1`. Puedes hacer una de estas dos cosas:

### Opción A — Arreglo permanente (recomendado, una sola vez)

1. Abre **PowerShell como administrador** (clic derecho en Inicio → Windows PowerShell → Ejecutar como administrador).
2. Ejecuta:
   ```powershell
   Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope LocalMachine
   ```
3. Cierra y vuelve a abrir Cursor. Después de eso, `npm` debería funcionar con normalidad.

### Opción B — Usar el wrapper del proyecto (sin tocar el sistema)

Desde la **raíz del proyecto**, en lugar de `npm run dev` usa:

```batch
.\npm run dev
```

(igual con `.\npm run db:setup`, `.\npm run db:migrate`, etc.). El archivo `npm.bat` del proyecto llama a `npm.cmd` y no depende de la política de ejecución de PowerShell.

---

## Solución: reiniciar Cursor (cuando npm no se reconoce)

1. **Cierra Cursor por completo** (Archivo → Salir, o cerrar la ventana).
2. **Vuelve a abrir Cursor** y abre el proyecto.
3. Abre una **terminal nueva** (Terminal → Nueva terminal).
4. Prueba: `npm --version` y `node --version`.

En esa nueva terminal, `npm` y `node` deberían reconocerse. Las terminales que estaban abiertas antes del cambio seguirán sin tener Node en el PATH hasta que las cierres y abras una nueva (o reinicies Cursor).

---

## Mientras tanto: usar scripts sin `npm`

Desde la raíz del proyecto puedes ejecutar todo con scripts PowerShell (ellos añaden Node al PATH de la sesión):

| Quieres hacer      | Comando (desde la raíz) |
|--------------------|-------------------------|
| Crear BD           | `powershell -ExecutionPolicy Bypass -File scripts/run-db-setup.ps1` |
| Migraciones        | `powershell -ExecutionPolicy Bypass -File scripts/run-db-migrate.ps1` |
| Seed               | `powershell -ExecutionPolicy Bypass -File scripts/run-db-seed.ps1` |
| Arrancar servidor  | `powershell -ExecutionPolicy Bypass -File scripts/run-dev.ps1` |

---

## Comprobar que Node está en el PATH

En PowerShell:

```powershell
[Environment]::GetEnvironmentVariable("Path", "User") -split ';' | Where-Object { $_ -like '*node*' }
```

Debería mostrar `C:\Program Files\nodejs`. Si no aparece, añade manualmente esa carpeta a la variable PATH del usuario en: *Configuración de Windows → Cuenta → Opciones de inicio de sesión → Variables de entorno*.
