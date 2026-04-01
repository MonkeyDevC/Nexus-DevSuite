# Nexus DevSuite — frontend React (Vite)

- **Desarrollo aislado:** `npm run dev` (puerto 5173). Las llamadas al API usan la base relativa `/api/v1`; Vite proxifica `/api` al backend (origen configurable con `NEXUS_DEV_API_ORIGIN` en el `.env` de la raíz del monorepo).
- **Desarrollo unificado con el repo:** desde la raíz, `npm run dev:stack` (Express + Vite). Ver [../docs/ARRANQUE_DEV_Y_PRODUCCION.md](../docs/ARRANQUE_DEV_Y_PRODUCCION.md).
- **Build para producción:** `npm run build` → salida en `../public/react-app/`; el servidor Express sirve ese bundle en el mismo puerto que la API.

---

# React + Vite (plantilla base)

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.
