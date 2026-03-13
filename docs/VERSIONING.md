# NEXUS DevSuite — Sistema de Versionado

## Semantic Versioning (SemVer)

Este proyecto utiliza **Semantic Versioning** ([semver.org](https://semver.org/)) para el control de versiones del sistema.

### Formato de versiones

```
MAJOR.MINOR.PATCH
```

### Reglas de versionado

| Componente | Uso | Ejemplo |
|------------|-----|---------|
| **MAJOR** | Cambios incompatibles o ruptura de API. Requiere migración o cambios en integraciones. | `1.0.0` |
| **MINOR** | Nuevas funcionalidades compatibles con versiones anteriores. | `0.2.0` |
| **PATCH** | Correcciones de errores compatibles. Sin cambios de API. | `0.1.1` |

### Versión actual

**Versión actual: v0.1.0**

Esta versión representa el primer estado funcional del sistema con autenticación básica y estructura base del proyecto.

### Etapa pre-1.0

Durante la fase `0.x.x`, el proyecto está en desarrollo activo. Las versiones MINOR pueden incluir cambios que en producción serían considerados MAJOR. Se alcanzará `1.0.0` cuando el sistema esté estable y listo para uso productivo.
