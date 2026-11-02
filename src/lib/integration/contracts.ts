/** Contratos de integración documentados (diseño API First). */

export interface ApiContract {
  id: string;
  modulo: string;
  objetivo: string;
  metodo: "GET" | "POST" | "PATCH" | "PUT" | "DELETE";
  ruta: string;
  direccion: "expuesto" | "consumido";
  entrada: string;
  respuesta: string;
  errores: { codigo: string; descripcion: string }[];
  eventos: { nombre: string; tipo: "emitido" | "consumido" }[];
}

export const contracts: ApiContract[] = [
  {
    id: "c1",
    modulo: "Aprovisionamiento",
    objetivo: "Recibir una solicitud de aprovisionamiento desde CRM, Clientes, Suscripciones o API externa.",
    metodo: "POST",
    ruta: "/api/v1/provisioning/requests",
    direccion: "expuesto",
    entrada:
      '{ operacion: "alta|baja|modificacion|suspension|reactivacion|ampliacion|reduccion", tenantId, aplicacionId, licencias, plan, contacto: { email, nombre }, locale, zonaHoraria, metadata?, idempotencyKey }',
    respuesta: '201 { id, referencia, estado: "pendiente", correlationId }',
    errores: [
      { codigo: "400 VALIDATION_ERROR", descripcion: "Payload inválido (campos requeridos o enumerados incorrectos)." },
      { codigo: "401 UNAUTHENTICATED", descripcion: "Token OAuth2/OIDC ausente o expirado." },
      { codigo: "403 TENANT_FORBIDDEN", descripcion: "El emisor no tiene acceso a ese tenant." },
      { codigo: "409 DUPLICATE_REQUEST", descripcion: "idempotencyKey ya procesada." },
      { codigo: "422 QUOTA_EXCEEDED", descripcion: "El plan no admite las licencias solicitadas." },
    ],
    eventos: [
      { nombre: "aprovisionamiento.solicitud.recibida", tipo: "emitido" },
      { nombre: "suscripciones.contratacion.creada", tipo: "consumido" },
    ],
  },
  {
    id: "c2",
    modulo: "Aprovisionamiento",
    objetivo: "Consultar el estado y las tareas de una solicitud.",
    metodo: "GET",
    ruta: "/api/v1/provisioning/requests/{referencia}",
    direccion: "expuesto",
    entrada: "path: referencia · query: includeTasks=true",
    respuesta: "200 { referencia, estado, tareas[], error?, duracionMs, reintentos }",
    errores: [{ codigo: "404 NOT_FOUND", descripcion: "Referencia inexistente para el tenant." }],
    eventos: [],
  },
  {
    id: "c3",
    modulo: "Aprovisionamiento",
    objetivo: "Reintentar, reparar o reaprovisionar manualmente una solicitud.",
    metodo: "POST",
    ruta: "/api/v1/provisioning/requests/{referencia}/actions",
    direccion: "expuesto",
    entrada: '{ accion: "reintentar|sincronizar|reparar|actualizar|reaprovisionar|revertir", motivo }',
    respuesta: '202 { referencia, estado: "en_proceso" }',
    errores: [
      { codigo: "409 INVALID_STATE", descripcion: "La solicitud no admite esa transición." },
      { codigo: "424 CONNECTOR_UNAVAILABLE", descripcion: "El sistema destino no responde." },
    ],
    eventos: [
      { nombre: "aprovisionamiento.solicitud.reintentada", tipo: "emitido" },
      { nombre: "aprovisionamiento.solicitud.completada", tipo: "emitido" },
      { nombre: "aprovisionamiento.solicitud.error", tipo: "emitido" },
    ],
  },
  {
    id: "c4",
    modulo: "Suscripciones",
    objetivo: "Enviar solicitudes de ampliación, reducción, alta o baja generadas en el Portal del Cliente.",
    metodo: "POST",
    ruta: "/api/v1/subscriptions/change-requests",
    direccion: "consumido",
    entrada: '{ tenantId, aplicacionId, tipo: "alta|baja|ampliacion|reduccion", licencias?, nota?, solicitante }',
    respuesta: '202 { referencia, estado: "recibida" }',
    errores: [
      { codigo: "403 FORBIDDEN", descripcion: "El rol del usuario no permite solicitar cambios." },
      { codigo: "422 CONTRACT_LOCKED", descripcion: "El contrato está en periodo de compromiso." },
    ],
    eventos: [{ nombre: "suscripciones.cambio.solicitado", tipo: "emitido" }],
  },
  {
    id: "c5",
    modulo: "Facturación",
    objetivo: "Listar facturas del tenant y obtener el PDF firmado.",
    metodo: "GET",
    ruta: "/api/v1/billing/tenants/{tenantId}/invoices",
    direccion: "consumido",
    entrada: "query: estado?, desde?, hasta?, page, pageSize",
    respuesta: "200 { items: [{ numero, fecha, vencimiento, importe, impuestos, estado, metodoPago, pdfUrl }], page, total }",
    errores: [
      { codigo: "404 TENANT_NOT_FOUND", descripcion: "Tenant no registrado en facturación." },
      { codigo: "503 UPSTREAM_UNAVAILABLE", descripcion: "Módulo de facturación no disponible (el portal degrada la vista)." },
    ],
    eventos: [{ nombre: "facturacion.factura.emitida", tipo: "consumido" }],
  },
  {
    id: "c6",
    modulo: "Cobros",
    objetivo: "Consultar el estado del pago y el método predeterminado.",
    metodo: "GET",
    ruta: "/api/v1/payments/tenants/{tenantId}/methods",
    direccion: "consumido",
    entrada: "path: tenantId",
    respuesta: "200 { metodos: [{ tipo, detalle, predeterminado }] }",
    errores: [{ codigo: "402 PAYMENT_REQUIRED", descripcion: "Existen impagos; puede disparar suspensión vía reglas." }],
    eventos: [{ nombre: "cobros.pago.fallido", tipo: "consumido" }],
  },
  {
    id: "c7",
    modulo: "Soporte",
    objetivo: "Crear y responder incidencias desde el Portal del Cliente.",
    metodo: "POST",
    ruta: "/api/v1/support/tickets",
    direccion: "consumido",
    entrada: '{ tenantId, asunto, aplicacion, prioridad: "baja|media|alta|critica", cuerpo, adjuntos[] }',
    respuesta: '201 { referencia, estado: "abierta" }',
    errores: [
      { codigo: "413 PAYLOAD_TOO_LARGE", descripcion: "Adjunto superior a 25 MB." },
      { codigo: "429 RATE_LIMITED", descripcion: "Demasiadas incidencias en poco tiempo." },
    ],
    eventos: [
      { nombre: "soporte.incidencia.creada", tipo: "emitido" },
      { nombre: "soporte.incidencia.actualizada", tipo: "consumido" },
    ],
  },
  {
    id: "c8",
    modulo: "CRM / Gestión de Clientes",
    objetivo: "Devolver el resultado del aprovisionamiento para actualizar la oportunidad o la ficha del cliente.",
    metodo: "POST",
    ruta: "/api/v1/crm/provisioning-results",
    direccion: "consumido",
    entrada: "{ tenantId, referencia, resultado, tareasFallidas[], duracionMs }",
    respuesta: "204 sin contenido",
    errores: [{ codigo: "503 UPSTREAM_UNAVAILABLE", descripcion: "Se reintenta con backoff exponencial desde la cola." }],
    eventos: [{ nombre: "crm.aprovisionamiento.resultado", tipo: "emitido" }],
  },
  {
    id: "c9",
    modulo: "Auditoría",
    objetivo: "Registrar de forma inmutable toda acción de ambos módulos.",
    metodo: "POST",
    ruta: "/api/v1/audit/entries",
    direccion: "consumido",
    entrada: "{ actor, accion, entidad, tenantId, detalle, ip, userAgent, fecha }",
    respuesta: "202 { id }",
    errores: [{ codigo: "500 AUDIT_WRITE_FAILED", descripcion: "Se persiste en cola local y se reenvía." }],
    eventos: [{ nombre: "auditoria.registro", tipo: "emitido" }],
  },
  {
    id: "c10",
    modulo: "BI / Contabilidad",
    objetivo: "Publicar métricas de consumo y apuntes derivados del aprovisionamiento.",
    metodo: "POST",
    ruta: "/api/v1/bi/usage-events",
    direccion: "consumido",
    entrada: "{ tenantId, aplicacionId, periodo, usuariosActivos, consumo, almacenamientoGb }",
    respuesta: "202 { aceptados }",
    errores: [{ codigo: "409 DUPLICATE_PERIOD", descripcion: "El periodo ya fue publicado (idempotencia por periodo)." }],
    eventos: [
      { nombre: "contabilidad.apunte.solicitado", tipo: "emitido" },
      { nombre: "bi.consumo.publicado", tipo: "emitido" },
    ],
  },
];
