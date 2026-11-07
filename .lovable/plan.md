# Completar la integración funcional de la plataforma

## Estado comprobado
- API Gatekeeper y Onboarding están unidos y comparten inicio de sesión; las diez pruebas existentes pasan.
- La lista de tareas anterior estaba cerrada, pero la revisión del código detectó funciones incompletas: permisos del portal definidos pero no aplicados, datos de demostración sin aislamiento por empresa, cambios que desaparecen al volver a una pantalla y errores de auditoría que se ocultan.
- Los reintentos de aprovisionamiento siempre terminan con éxito, sin representar errores; los contratos de Integraciones incluyen direcciones documentadas que no son servicios disponibles.

## Límites que se conservan
- Mantener pantallas, aspecto, mensajes, validaciones y direcciones actuales; solo ajustar mensajes cuando una operación simulada se presente erróneamente como real.
- Mantener API v1 y v2, sus respuestas, claves, permisos, límites, logs y OpenAPI compatibles.
- No integrar Service Hub ni proveedores externos; no solicitar credenciales ni crear tablas permanentes con datos de demostración.
- Mantener separados los roles del portal y los de administración de API. Nunca elevar permisos por cambios de rol en el portal.

## 1. Acceso y permisos efectivos
- Verificar en el servidor el rol interno antes de abrir Aprovisionamiento e Integraciones; una sesión por sí sola no concede acceso administrativo.
- Definir explícitamente el acceso al portal de demostración: administrador interno → administrador de la empresa de demostración; consulta interna → solo lectura de esa empresa. Este mapeo no representa pertenencia a empresas reales.
- Aplicar permisos a navegación, acceso directo a pantallas y acciones, no únicamente a botones visibles. Las operaciones privilegiadas del servidor deben comprobar permisos por sí mismas.
- Mantener las asignaciones de empresa y los roles de demostración en un punto sustituible, sin duplicar el sistema de identidades.

## 2. Datos de demostración coherentes
- Aislar las colecciones, descargas y modificaciones por empresa; rechazar identificadores que no pertenezcan a la empresa solicitada.
- Unificar el almacenamiento simulado de usuarios, soporte, sesiones, políticas de seguridad y preferencias de notificaciones para que los cambios guardados se lean al navegar y recargar.
- Conservar perfil y solicitudes de suscripción como pendientes de validación cuando ese sea su comportamiento actual; no convertirlos en modificaciones reales de clientes o contratos.
- Usar almacenamiento local solo para datos simulados, identificado por cuenta y empresa; nunca para decidir permisos administrativos ni guardar credenciales.

## 3. Auditoría común fiable
- Obtener el actor real de la sesión verificada y distinguir correctamente el módulo y el tipo de actor.
- Registrar las acciones integradas que actualmente solo publican eventos: usuarios, seguridad, soporte, solicitudes y reglas.
- Dejar de responder que una escritura de auditoría se completó cuando falla. Mostrar el fallo y permitir recuperar el registro sin ejecutar otra vez la acción original.
- Mantener el sistema de auditoría existente; no crear otro registro permanente paralelo.

## 4. Aprovisionamiento funcional
- Validar las transiciones y evitar reintentos simultáneos o acciones incompatibles con el estado actual.
- Resolver el resultado de los reintentos mediante el adaptador simulado, contemplando éxito, error y resultado parcial; actualizar tareas, duración, errores y eventos de forma coherente.
- Generar identificadores y referencias sin colisiones y conservar su lectura desde el detalle de solicitud.
- Comprobar las acciones de solicitudes y las reglas sin conectar sistemas destino reales.

## 5. Compatibilidad y documentación
- Recuperar la consulta pública de versiones que anteriormente no exigía clave, conservando su formato; comprobar ambas versiones y que el resto de endpoints sigue protegido.
- Añadir pruebas de compatibilidad v1/v2: métodos, permisos, respuestas, acceso por versión de la clave y límites.
- No retirar automáticamente una versión por una fecha de fin: conservar el comportamiento actual de compatibilidad hasta definir expresamente esa política.
- Diferenciar en Integraciones los contratos de diseño, los adaptadores simulados y los endpoints reales de Gatekeeper sin publicar servicios externos nuevos.
- Revisar que cada página de contenido tenga título y descripción propios para compartirla.

## Verificación y entrega
- Pruebas concretas de aislamiento por empresa, permisos, persistencia simulada, errores de auditoría, transiciones y compatibilidad.
- Con sesión iniciada: crear y responder una incidencia; modificar un usuario y volver a leerlo; guardar preferencias; crear/reintentar una solicitud y comprobar su entrada en Auditoría.
- Revisar acceso directo no autorizado, navegación y pantallas a tamaños de escritorio y móvil.
- Actualizar la lista de pendientes con resultados comprobados; señalar por separado lo que sigue siendo simulación, sin afirmar que se conectaron proveedores reales.

## Detalles técnicos
- Conservar TanStack Start y el inicio de sesión de Gatekeeper; funciones internas con middleware de autenticación y comprobación de roles usando el cliente de la sesión.
- Separar contexto de acceso, estado simulado por empresa y puertos sustituibles; ninguna autorización depende del almacenamiento del navegador.
- Mantener el contrato de `PlatformPorts`, ampliándolo solo donde las acciones existentes necesitan lectura/escritura coherentes.
- Registrar las decisiones estructurales en `AGENTS.md` y conservar pruebas junto a los módulos existentes.