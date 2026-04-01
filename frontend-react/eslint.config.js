import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{js,jsx}'],
    extends: [
      js.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
      parserOptions: {
        ecmaVersion: 'latest',
        ecmaFeatures: { jsx: true },
        sourceType: 'module',
      },
    },
    rules: {
      'no-unused-vars': ['error', { varsIgnorePattern: '^[A-Z_]' }],
      'no-restricted-imports': [
        'error',
        {
          paths: [
            {
              name: 'axios',
              message:
                'Axios solo puede importarse en src/shared/http/httpClient.js.',
            },
          ],
        },
      ],
      'no-restricted-syntax': [
        'error',
        {
          selector: 'CallExpression[callee.name="fetch"]',
          message:
            'fetch esta prohibido para nuevos desarrollos en frontend-react/src/**. Use shared/http/index.js.',
        },
        {
          selector: 'MemberExpression[property.name="__nexus"]',
          message:
            '__nexus es metadata interna transitoria del nucleo HTTP. Prohibido consumirla fuera de src/shared/http/**.',
        },
        {
          selector:
            'CallExpression[callee.object.name="sessionStorage"][callee.property.name=/^(setItem|removeItem)$/][arguments.0.type="Literal"][arguments.0.value=/^(nexus_access_token|nexus_refresh_token)$/]',
          message:
            'Escritura efectiva de tokens prohibida fuera de src/shared/http/tokenStorage.js (incluye literales, constantes, variables, helpers y wrappers).',
        },
        {
          selector:
            'CallExpression[callee.object.name="sessionStorage"][callee.property.name=/^(setItem|removeItem)$/][arguments.0.type="Identifier"][arguments.0.name=/^(KEY_ACCESS|KEY_REFRESH)$/]',
          message:
            'Escritura efectiva de tokens prohibida fuera de src/shared/http/tokenStorage.js (incluye literales, constantes, variables, helpers y wrappers).',
        },
      ],
    },
  },
  {
    // EXC-HTTP-002 (deuda controlada):
    // Archivos: pantallas con fetch heredado
    // Regla exceptuada: no-restricted-syntax (fetch)
    // Motivo: consumo legacy-react preexistente, fuera de Fase 1
    // Eliminacion: Punto 1, al finalizar Fase 4 (consumo via shared/http/index)
    // Criterio de cierre: 0 usos de fetch en frontend-react/src/pages/*
    files: [
      'src/pages/Backlog.jsx',
      'src/pages/FeatureDetail.jsx',
      'src/pages/Features.jsx',
      'src/pages/IncidentDetail.jsx',
      'src/pages/Incidents.jsx',
      'src/pages/ReleaseDetail.jsx',
      'src/pages/Releases.jsx',
      'src/pages/SprintDetail.jsx',
      'src/pages/Sprints.jsx',
      'src/pages/StoryDetail.jsx',
    ],
    rules: {
      'no-restricted-syntax': [
        'error',
        {
          selector:
            'CallExpression[callee.object.name="sessionStorage"][callee.property.name=/^(setItem|removeItem)$/][arguments.0.type="Literal"][arguments.0.value=/^(nexus_access_token|nexus_refresh_token)$/]',
          message:
            'Escritura efectiva de tokens prohibida fuera de src/shared/http/tokenStorage.js (incluye literales, constantes, variables, helpers y wrappers).',
        },
        {
          selector:
            'CallExpression[callee.object.name="sessionStorage"][callee.property.name=/^(setItem|removeItem)$/][arguments.0.type="Identifier"][arguments.0.name=/^(KEY_ACCESS|KEY_REFRESH)$/]',
          message:
            'Escritura efectiva de tokens prohibida fuera de src/shared/http/tokenStorage.js (incluye literales, constantes, variables, helpers y wrappers).',
        },
      ],
    },
  },
  {
    // Regla estructural permanente:
    // axios solo permitido en src/shared/http/httpClient.js
    files: ['src/shared/http/httpClient.js'],
    rules: {
      'no-restricted-imports': 'off',
    },
  },
  {
    // Excepcion estructural: __nexus solo puede consumirse dentro del nucleo HTTP.
    files: ['src/shared/http/**/*.js'],
    rules: {
      'no-restricted-syntax': [
        'error',
        {
          selector: 'CallExpression[callee.name="fetch"]',
          message:
            'fetch esta prohibido para nuevos desarrollos en frontend-react/src/**. Use shared/http/index.js.',
        },
        {
          selector:
            'CallExpression[callee.object.name="sessionStorage"][callee.property.name=/^(setItem|removeItem)$/][arguments.0.type="Literal"][arguments.0.value=/^(nexus_access_token|nexus_refresh_token)$/]',
          message:
            'Escritura efectiva de tokens prohibida fuera de src/shared/http/tokenStorage.js (incluye literales, constantes, variables, helpers y wrappers).',
        },
        {
          selector:
            'CallExpression[callee.object.name="sessionStorage"][callee.property.name=/^(setItem|removeItem)$/][arguments.0.type="Identifier"][arguments.0.name=/^(KEY_ACCESS|KEY_REFRESH)$/]',
          message:
            'Escritura efectiva de tokens prohibida fuera de src/shared/http/tokenStorage.js (incluye literales, constantes, variables, helpers y wrappers).',
        },
      ],
    },
  },
  {
    // Regla estructural permanente (prioridad mas alta que shared/http/**/*.js):
    // tokenStorage es la unica ubicacion permitida para persistir/limpiar tokens.
    files: ['src/shared/http/tokenStorage.js'],
    rules: {
      'no-restricted-syntax': 'off',
    },
  },
])
