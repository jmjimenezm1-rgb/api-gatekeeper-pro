# API Gateway Hub

A continuación tienes un prompt diseñado específicamente para Lovable. Está redactado para que genere un módulo profesional, escalable y preparado para producción. No se limita a crear unos endpoints, sino que construye una plataforma completa de gestión de API, siguiendo buenas prácticas de arquitectura, seguridad y mantenimiento.



PROMPT PARA LOVABLE

Objetivo

Construye un módulo completo denominado API Management dentro de la aplicación.

Este módulo debe permitir que aplicaciones externas puedan integrarse con la plataforma mediante una API REST segura, documentada, versionada y preparada para producción.

La API debe seguir una arquitectura desacoplada, fácilmente ampliable, y permitir mantener simultáneamente varias versiones activas sin romper la compatibilidad con las integraciones existentes.

El diseño debe ser modular para facilitar la incorporación futura de nuevos endpoints pertenecientes a cualquier módulo de la aplicación.



1. Arquitectura

Crear un módulo independiente denominado:

API Management

Este módulo será responsable de:

Gestión de endpoints.

Versionado.

Seguridad.

Autenticación.

Autorización.

Gestión de API Keys.

Registro de actividad.

Auditoría.

Monitorización.

Documentación OpenAPI.

Configuración de límites de uso.

Todo el código deberá quedar separado de la lógica funcional del resto de módulos.



2. Tecnologías

Diseñar la solución compatible con el stack utilizado por Lovable.

Utilizar:

REST API

JSON

HTTPS

OpenAPI 3.1

Swagger UI

JWT

API Keys

Variables de entorno para secretos

Arquitectura por capas

No utilizar información sensible codificada dentro del código fuente.



3. Versionado

Implementar soporte para múltiples versiones simultáneas.

Ejemplo:

/api/v1/

/api/v2/

/api/v3/

Cada versión deberá poder:

mantenerse activa

deshabilitarse

marcarse como obsoleta

establecer fecha prevista de retirada

La administración podrá decidir qué versiones permanecen disponibles.

Nunca eliminar automáticamente una versión utilizada por clientes externos.



4. Gestión de API Keys

Construir un gestor completo de API Keys.

Cada clave deberá disponer de:

identificador interno

nombre descriptivo

aplicación propietaria

empresa propietaria

persona de contacto

correo electrónico

fecha de creación

fecha de expiración

estado

Estados posibles:

Activa

Suspendida

Revocada

Expirada

Permitir:

crear

regenerar

revocar

suspender temporalmente

reactivar

eliminar

La clave solo deberá mostrarse una vez durante su creación.

Posteriormente únicamente aparecerá parcialmente enmascarada.



5. Autenticación

Implementar dos mecanismos:

API Key

Obligatoria.

JWT

Opcional para futuras ampliaciones.

Toda petición deberá validar la API Key antes de ejecutar cualquier operación.



6. Gestión de usuarios mediante API

Crear endpoints para:

Alta de usuario.

Consulta de usuario.

Modificar usuario.

Suspender temporalmente usuario.

Reactivar usuario.

Dar de baja definitiva.

Consultar estado del usuario.

Consultar roles.

Consultar permisos.

Modificar roles.

Modificar permisos.



7. Estados del usuario

Definir como mínimo:

Activo

Suspendido

Pendiente de activación

Bloqueado

Eliminado

Nunca eliminar físicamente un usuario salvo que un parámetro de configuración lo permita y se cumplan las políticas de conservación de datos.



8. Roles

Construir un sistema totalmente parametrizable.

No dejar los roles fijos.

Permitir crear nuevos roles desde la administración.

Cada rol podrá contener múltiples permisos.

Ejemplo:

Administrador

Supervisor

Empleado

Cliente

Proveedor

Invitado



9. Permisos

Los permisos deberán ser independientes de los roles.

Ejemplos:

usuarios.leer

usuarios.crear

usuarios.modificar

usuarios.eliminar

clientes.leer

clientes.crear

facturas.leer

facturas.generar

configuracion.modificar

Cada rol podrá contener cualquier combinación de permisos.



10. Seguridad

Toda comunicación mediante HTTPS.

Validar:

API Key.

Permisos.

Formato JSON.

Longitud máxima de campos.

Tipos de datos.

Campos obligatorios.

Evitar:

SQL Injection

Cross Site Scripting

Inyección de comandos

Datos malformados

Implementar Rate Limiting configurable.

Permitir limitar llamadas por:

minuto

hora

día



11. Registro de actividad (Logs)

Crear un sistema completo de logs.

Registrar absolutamente todas las llamadas.

Para cada petición almacenar:

Fecha y hora.

Endpoint.

Versión.

Método HTTP.

Aplicación llamante.

API Key utilizada.

Usuario autenticado.

IP origen.

Tiempo de respuesta.

Resultado.

Código HTTP.

Mensaje devuelto.

Identificador interno de la operación.

Tamaño de la petición.

Tamaño de la respuesta.

Nivel del log.

El nivel podrá ser:

Información

Advertencia

Error

Crítico

Nunca registrar contraseñas ni datos sensibles.



12. Auditoría

Registrar además:

Quién realizó la operación.

Qué registro modificó.

Valor anterior.

Valor nuevo.

Fecha.

Aplicación.

Versión de API utilizada.

Motivo del cambio cuando proceda.

Toda auditoría deberá ser inalterable.



13. Gestión de errores

Todas las respuestas deberán seguir un formato uniforme.

Ejemplo:

{
“success”: false,
“errorCode”: “…”,
“message”: “…”,
“requestId”: “…”,
“timestamp”: “…”,
“version”: “v1”
}

No devolver errores técnicos internos.



14. Monitorización

Crear un panel con indicadores.

Mostrar:

Número de llamadas.

Llamadas por versión.

Errores.

Tiempo medio de respuesta.

Clientes más activos.

Endpoints más utilizados.

Distribución de errores.

Uso por API Key.



15. Administración

Crear una pantalla denominada:

Administración de APIs

Desde ella se podrá:

Crear API Keys.

Revocarlas.

Suspenderlas.

Reactivarlas.

Ver estadísticas.

Consultar logs.

Consultar auditoría.

Gestionar versiones.

Activar nuevas versiones.

Desactivar versiones.

Definir límites de uso.

Consultar aplicaciones conectadas.



16. Documentación automática

Generar automáticamente:

Swagger UI.

OpenAPI.

Ejemplos de llamadas.

Ejemplos de respuestas.

Listado de errores.

Listado de permisos necesarios para cada endpoint.



17. Configuración

Crear un apartado de configuración donde puedan parametrizarse:

Tiempo de expiración de API Keys.

Duración de JWT.

Número máximo de llamadas.

Política de bloqueo.

Retención de logs.

Retención de auditoría.

Nivel mínimo de registro.

Versiones activas.

Tiempo máximo de respuesta permitido.



18. Escalabilidad

Toda la arquitectura deberá permitir añadir nuevos endpoints sin modificar la infraestructura existente.

Los nuevos módulos de la aplicación deberán poder registrar automáticamente sus endpoints dentro del sistema API Management.



19. Preparación para producción

Preparar el módulo para incorporar posteriormente:

OAuth 2.0.

OpenID Connect.

Webhooks.

Scopes.

Refresh Tokens.

Firma digital de peticiones.

Lista blanca de IPs.

Lista negra de IPs.

Certificados por cliente.

Portal para desarrolladores.

SDKs.

Límites personalizados por cliente.

Facturación por consumo.



20. Calidad

Todo el código deberá:

Ser modular.

Documentado.

Tipado.

Reutilizable.

Mantener separación entre:

Controladores.

Servicios.

Repositorios.

Modelos.

Seguridad.

Logs.

Configuración.

Documentación.

No duplicar código.

Aplicar principios SOLID.

Preparar pruebas unitarias y pruebas de integración.



Resultado esperado

El resultado debe ser un módulo completamente funcional denominado API Management, integrado con la aplicación, capaz de publicar una API REST segura, versionada, monitorizada y documentada, preparada para que aplicaciones externas gestionen usuarios, roles y permisos mediante API Keys, manteniendo trazabilidad completa, registros de auditoría, logs detallados y capacidad de crecimiento sin rediseñar la arquitectura.

Este prompt está pensado para que Lovable genere una base de nivel empresarial. Posteriormente puedes ampliarlo con un segundo prompt específico para añadir funcionalidades avanzadas como OAuth 2.0 completo, portal para desarrolladores, webhooks, SDKs, limitación por planes de suscripción, firma HMAC, OpenID Connect, OpenAPI enriquecido y gestión de eventos, acercando la API al nivel de plataformas como Stripe, GitHub o Salesforce.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/10553342-cd16-491f-9203-b91b20d5c1e9).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
