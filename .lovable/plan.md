# Integración de Onboarding Hub en API Gatekeeper

## Inventario
- **API Gatekeeper (este proyecto):** login propio, panel `/admin/*` (10 pantallas), API pública v1/v2, OpenAPI, claves, límites, logs, auditoría, diagnóstico IA. Datos reales en la base de datos.
- **Onboarding Hub (ZIP):** sin login ni base de datos. Pantallas `/aprovisionamiento/*` (5), `/portal/*` (11), `/integraciones`. Datos de demostración detrás de "puertos" sustituibles (suscripciones, facturación, soporte, documentos, consumo, CRM, auditoría, contabilidad). 6 roles de portal con permisos `portal.*`.

## Conflictos detectados
| Punto | Decisión |
|---|---|
| Página `/` en ambos | Se mantiene la de Gatekeeper y se le añaden accesos a Aprovisionamiento, Portal e Integraciones. La portada de Onboarding pasa a `/inicio-onboarding` sin cambios. |
| Estilos (colores, fuentes, sombras propias de Onboarding) | Se añaden los tokens que faltan (success/warning/info, fuentes, sombras) sin cambiar los existentes, para que ambas apps se vean como hoy. Radio y fondo de Onboarding se aplican solo dentro de sus pantallas. |
| Raíz de la app | Se fusiona: fuentes de Onboarding cargadas en la cabecera; Toaster único. |
| Componentes base | Mismos ficheros; se conservan los de Gatekeeper. |
| Dependencias | Se añade `jspdf` (PDF de demostración). Versiones de TanStack se mantienen. |
| Auditoría | El puerto de auditoría de Onboarding escribirá en la auditoría de Gatekeeper (un solo sistema). |

## Acceso y permisos
- Un solo login (el de Gatekeeper). Aprovisionamiento, Portal e Integraciones pasan a exigir sesión, conservando sus URLs.
- Roles internos (admin/consulta) y roles de portal siguen separados. Mapeo explícito: admin interno → puede ver Aprovisionamiento e Integraciones; Portal usa un contexto de empresa (tenant) y rol de portal de demostración, nunca convierte a nadie en administrador.

## Navegación
- Menú común superior con: Gestión API, Aprovisionamiento, Portal cliente, Integraciones. Los menús internos de cada módulo no cambian.

## Fuera de alcance
- Service Hub, proveedores externos reales, copiar datos de demostración a tablas permanentes.

## Detalles técnicos
- Copiar `src/lib/{domain,integration,portal,provisioning,format,route-meta}`, `src/components/{common,layout}` y rutas, moviendo `aprovisionamiento*`, `portal*`, `integraciones` bajo `_authenticated/` (URLs idénticas).
- Adaptador de auditoría: `AuditPort.record` → server function que inserta en `audit_logs` de Gatekeeper.
- Verificación: build, tests existentes + test del mapeo de roles, Playwright con sesión en cada módulo, API v1/v2 sin cambios.
