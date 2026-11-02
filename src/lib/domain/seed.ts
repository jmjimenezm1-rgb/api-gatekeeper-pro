import type {
  AccessLogEntry,
  Application,
  AuditEntry,
  Connector,
  DocumentItem,
  Invoice,
  NotificationItem,
  NotificationPreferences,
  PortalUser,
  ProvisioningRequest,
  ProvisioningRule,
  SessionInfo,
  Subscription,
  Tenant,
  Ticket,
  UsagePoint,
} from "./types";

export const applications: Application[] = [
  { id: "app_flow", nombre: "FlowDesk", clave: "flowdesk", version: "4.2.1", categoria: "Productividad" },
  { id: "app_bill", nombre: "BillCore", clave: "billcore", version: "3.8.0", categoria: "Finanzas" },
  { id: "app_track", nombre: "TrackOps", clave: "trackops", version: "2.5.4", categoria: "Operaciones" },
  { id: "app_sign", nombre: "SignHub", clave: "signhub", version: "1.9.2", categoria: "Documental" },
  { id: "app_bi", nombre: "InsightBI", clave: "insightbi", version: "5.0.0", categoria: "Analítica" },
];

export const tenants: Tenant[] = [
  {
    id: "tn_arcadia",
    slug: "arcadia",
    organizacion: "Arcadia Logística S.L.",
    cif: "B12345678",
    plan: "Business",
    estado: "activo",
    locale: "es-ES",
    zonaHoraria: "Europe/Madrid",
    creadoEn: "2025-03-11T09:12:00Z",
    limites: { usuarios: 150, almacenamientoGb: 500, llamadasApiMes: 1_000_000 },
  },
  {
    id: "tn_norvia",
    slug: "norvia",
    organizacion: "Norvia Health Group",
    cif: "A87654321",
    plan: "Enterprise",
    estado: "activo",
    locale: "en-GB",
    zonaHoraria: "Europe/London",
    creadoEn: "2024-11-02T14:30:00Z",
    limites: { usuarios: 800, almacenamientoGb: 2000, llamadasApiMes: 5_000_000 },
  },
  {
    id: "tn_maresa",
    slug: "maresa",
    organizacion: "Maresa Retail",
    cif: "B99887766",
    plan: "Starter",
    estado: "suspendido",
    locale: "es-ES",
    zonaHoraria: "Atlantic/Canary",
    creadoEn: "2026-01-22T08:05:00Z",
    limites: { usuarios: 25, almacenamientoGb: 50, llamadasApiMes: 100_000 },
  },
];

/** Tenant con el que se navega el Portal del Cliente en esta demo. */
export const currentTenant = tenants[0]!;

const tareasAlta = (sistema: string) => [
  { id: "t1", nombre: "Crear organización y tenant", sistema: "core", estado: "ok" as const, duracionMs: 420 },
  { id: "t2", nombre: "Asignar identificadores y slug", sistema: "core", estado: "ok" as const, duracionMs: 110 },
  { id: "t3", nombre: "Crear espacio de trabajo inicial", sistema: sistema, estado: "ok" as const, duracionMs: 890 },
  { id: "t4", nombre: "Crear usuarios iniciales", sistema: "identity", estado: "ok" as const, duracionMs: 640 },
  { id: "t5", nombre: "Asignar licencias y aplicaciones", sistema: "licensing", estado: "ok" as const, duracionMs: 300 },
  { id: "t6", nombre: "Asignar permisos y roles", sistema: "identity", estado: "ok" as const, duracionMs: 250 },
  { id: "t7", nombre: "Generar credenciales y claves API", sistema: "identity", estado: "ok" as const, duracionMs: 180 },
  { id: "t8", nombre: "Configurar idioma y zona horaria", sistema: "core", estado: "ok" as const, duracionMs: 90 },
  { id: "t9", nombre: "Aplicar límites de consumo y almacenamiento", sistema: "quotas", estado: "ok" as const, duracionMs: 210 },
  { id: "t10", nombre: "Crear recursos iniciales (plantillas)", sistema: sistema, estado: "ok" as const, duracionMs: 1520 },
  { id: "t11", nombre: "Enviar información de acceso al cliente", sistema: "notificaciones", estado: "ok" as const, duracionMs: 340 },
];

export const provisioningRequests: ProvisioningRequest[] = [
  {
    id: "pr_1041",
    referencia: "APRV-2026-1041",
    operacion: "alta",
    origen: "suscripciones",
    estado: "completado",
    tenantId: "tn_arcadia",
    organizacion: "Arcadia Logística S.L.",
    aplicacionId: "app_flow",
    aplicacion: "FlowDesk",
    solicitadoPor: "suscripciones.svc",
    creadoEn: "2026-08-05T08:14:00Z",
    actualizadoEn: "2026-08-05T08:14:06Z",
    duracionMs: 5_960,
    reintentos: 0,
    licencias: 40,
    correlationId: "corr_9f31ab",
    tareas: tareasAlta("flowdesk"),
  },
  {
    id: "pr_1042",
    referencia: "APRV-2026-1042",
    operacion: "ampliacion",
    origen: "crm",
    estado: "en_proceso",
    tenantId: "tn_norvia",
    organizacion: "Norvia Health Group",
    aplicacionId: "app_bi",
    aplicacion: "InsightBI",
    solicitadoPor: "l.ferrer@plataforma.io",
    creadoEn: "2026-08-06T18:52:00Z",
    actualizadoEn: "2026-08-06T18:52:12Z",
    duracionMs: 12_400,
    reintentos: 0,
    licencias: 120,
    correlationId: "corr_bb7712",
    tareas: [
      { id: "t1", nombre: "Validar cuota del plan", sistema: "quotas", estado: "ok", duracionMs: 180 },
      { id: "t2", nombre: "Ampliar licencias", sistema: "licensing", estado: "ok", duracionMs: 420 },
      { id: "t3", nombre: "Sincronizar usuarios (SCIM)", sistema: "scim", estado: "pendiente", duracionMs: 0 },
      { id: "t4", nombre: "Notificar al cliente", sistema: "notificaciones", estado: "pendiente", duracionMs: 0 },
    ],
  },
  {
    id: "pr_1043",
    referencia: "APRV-2026-1043",
    operacion: "alta",
    origen: "api_externa",
    estado: "error",
    tenantId: "tn_maresa",
    organizacion: "Maresa Retail",
    aplicacionId: "app_sign",
    aplicacion: "SignHub",
    solicitadoPor: "partner-api/key_38fa",
    creadoEn: "2026-08-06T17:03:00Z",
    actualizadoEn: "2026-08-06T17:05:41Z",
    duracionMs: 161_000,
    reintentos: 3,
    licencias: 10,
    correlationId: "corr_4c9012",
    tareas: [
      { id: "t1", nombre: "Crear organización y tenant", sistema: "core", estado: "ok", duracionMs: 380 },
      { id: "t2", nombre: "Crear usuarios iniciales", sistema: "identity", estado: "ok", duracionMs: 610 },
      {
        id: "t3",
        nombre: "Provisionar en Microsoft 365",
        sistema: "microsoft365",
        estado: "error",
        duracionMs: 30_000,
        detalle: "Tiempo de espera agotado al llamar a Graph API (/groups)",
      },
      { id: "t4", nombre: "Asignar licencias", sistema: "licensing", estado: "omitido", duracionMs: 0 },
    ],
    error: {
      codigo: "PRV-504-M365",
      motivo: "Tiempo de espera agotado en Microsoft Graph al crear el grupo de seguridad.",
      sistemaAfectado: "Microsoft 365",
      reintentos: 3,
      reintentable: true,
    },
  },
  {
    id: "pr_1044",
    referencia: "APRV-2026-1044",
    operacion: "suspension",
    origen: "automatizaciones",
    estado: "esperando_validacion",
    tenantId: "tn_maresa",
    organizacion: "Maresa Retail",
    aplicacionId: "app_bill",
    aplicacion: "BillCore",
    solicitadoPor: "regla:impago-30d",
    creadoEn: "2026-08-06T09:00:00Z",
    actualizadoEn: "2026-08-06T09:00:02Z",
    duracionMs: 2_100,
    reintentos: 0,
    licencias: 12,
    correlationId: "corr_77aa31",
    tareas: [
      { id: "t1", nombre: "Comprobar impago (módulo Cobros)", sistema: "cobros", estado: "ok", duracionMs: 260 },
      { id: "t2", nombre: "Requiere aprobación de un administrador", sistema: "core", estado: "pendiente", duracionMs: 0 },
    ],
  },
  {
    id: "pr_1045",
    referencia: "APRV-2026-1045",
    operacion: "modificacion",
    origen: "clientes",
    estado: "completado_parcial",
    tenantId: "tn_norvia",
    organizacion: "Norvia Health Group",
    aplicacionId: "app_track",
    aplicacion: "TrackOps",
    solicitadoPor: "m.oliva@plataforma.io",
    creadoEn: "2026-08-04T11:20:00Z",
    actualizadoEn: "2026-08-04T11:21:10Z",
    duracionMs: 70_400,
    reintentos: 1,
    licencias: 60,
    correlationId: "corr_1d0f55",
    tareas: [
      { id: "t1", nombre: "Actualizar plan y límites", sistema: "quotas", estado: "ok", duracionMs: 320 },
      { id: "t2", nombre: "Sincronizar directorio LDAP", sistema: "ldap", estado: "error", duracionMs: 45_000, detalle: "3 usuarios sin atributo mail" },
      { id: "t3", nombre: "Notificar al cliente", sistema: "notificaciones", estado: "ok", duracionMs: 280 },
    ],
    error: {
      codigo: "PRV-422-LDAP",
      motivo: "3 de 60 usuarios no cumplen el esquema requerido (atributo mail vacío).",
      sistemaAfectado: "LDAP corporativo",
      reintentos: 1,
      reintentable: true,
    },
  },
  {
    id: "pr_1046",
    referencia: "APRV-2026-1046",
    operacion: "baja",
    origen: "suscripciones",
    estado: "pendiente",
    tenantId: "tn_arcadia",
    organizacion: "Arcadia Logística S.L.",
    aplicacionId: "app_sign",
    aplicacion: "SignHub",
    solicitadoPor: "suscripciones.svc",
    creadoEn: "2026-08-06T19:10:00Z",
    actualizadoEn: "2026-08-06T19:10:00Z",
    duracionMs: 0,
    reintentos: 0,
    licencias: 15,
    correlationId: "corr_5ee901",
    tareas: [
      { id: "t1", nombre: "Programar retención de datos (30 días)", sistema: "core", estado: "pendiente", duracionMs: 0 },
      { id: "t2", nombre: "Revocar licencias y accesos", sistema: "licensing", estado: "pendiente", duracionMs: 0 },
      { id: "t3", nombre: "Exportar datos del cliente (RGPD)", sistema: "storage", estado: "pendiente", duracionMs: 0 },
    ],
  },
  {
    id: "pr_1039",
    referencia: "APRV-2026-1039",
    operacion: "reactivacion",
    origen: "manual",
    estado: "revertido",
    tenantId: "tn_maresa",
    organizacion: "Maresa Retail",
    aplicacionId: "app_flow",
    aplicacion: "FlowDesk",
    solicitadoPor: "a.serra@plataforma.io",
    creadoEn: "2026-08-01T10:00:00Z",
    actualizadoEn: "2026-08-01T10:04:00Z",
    duracionMs: 240_000,
    reintentos: 2,
    licencias: 8,
    correlationId: "corr_31bb90",
    tareas: [
      { id: "t1", nombre: "Reactivar tenant", sistema: "core", estado: "ok", duracionMs: 300 },
      { id: "t2", nombre: "Rollback por impago confirmado", sistema: "core", estado: "ok", duracionMs: 900 },
    ],
  },
];

export const provisioningRules: ProvisioningRule[] = [
  {
    id: "rl_01",
    nombre: "Alta estándar de aplicación",
    evento: "contratacion.creada",
    condicion: "aplicacion.clave EN [flowdesk, trackops] Y plan != trial",
    activa: true,
    prioridad: 10,
    ejecuciones: 482,
    acciones: [
      { tipo: "crear_grupo", parametros: { nombre: "{{aplicacion.clave}}-usuarios" } },
      { tipo: "crear_usuario_admin", parametros: { email: "{{contacto.email}}" } },
      { tipo: "asignar_permisos", parametros: { rol: "admin_empresa" } },
      { tipo: "asignar_almacenamiento", parametros: { gb: 50 } },
      { tipo: "enviar_correo", parametros: { plantilla: "bienvenida_aprovisionamiento" } },
    ],
  },
  {
    id: "rl_02",
    nombre: "Clave API para integraciones Enterprise",
    evento: "contratacion.creada",
    condicion: "plan = Enterprise",
    activa: true,
    prioridad: 20,
    ejecuciones: 76,
    acciones: [
      { tipo: "crear_api_key", parametros: { alcance: "read:write", caducidadDias: 365 } },
      { tipo: "webhook", parametros: { url: "https://hooks.cliente.example/provisioning" } },
    ],
  },
  {
    id: "rl_03",
    nombre: "Suspensión por impago a 30 días",
    evento: "pago.fallido",
    condicion: "diasImpago >= 30",
    activa: true,
    prioridad: 5,
    ejecuciones: 14,
    acciones: [
      { tipo: "suspender_tenant", parametros: { gracia: 5 } },
      { tipo: "enviar_correo", parametros: { plantilla: "aviso_suspension" } },
    ],
  },
  {
    id: "rl_04",
    nombre: "Sincronización SCIM al invitar usuario",
    evento: "usuario.invitado",
    condicion: "tenant.directorio = scim",
    activa: false,
    prioridad: 30,
    ejecuciones: 0,
    acciones: [{ tipo: "webhook", parametros: { url: "https://scim.interno/v2/Users" } }],
  },
];

export const connectors: Connector[] = [
  { id: "cn_rest", nombre: "REST API genérica", tipo: "generico", protocolo: "HTTPS / JSON", estado: "conectado", ultimaSync: "2026-08-06T19:02:00Z", simulado: true },
  { id: "cn_hooks", nombre: "Webhooks salientes", tipo: "generico", protocolo: "HMAC-SHA256", estado: "conectado", ultimaSync: "2026-08-06T18:59:00Z", simulado: true },
  { id: "cn_oauth", nombre: "OAuth 2.0", tipo: "identidad", protocolo: "OAuth 2.1", estado: "conectado", ultimaSync: "2026-08-06T12:00:00Z", simulado: true },
  { id: "cn_oidc", nombre: "OpenID Connect", tipo: "identidad", protocolo: "OIDC", estado: "conectado", ultimaSync: "2026-08-06T12:00:00Z", simulado: true },
  { id: "cn_saml", nombre: "SAML 2.0", tipo: "identidad", protocolo: "SAML", estado: "no_configurado", simulado: true },
  { id: "cn_scim", nombre: "SCIM 2.0", tipo: "directorio", protocolo: "SCIM", estado: "conectado", ultimaSync: "2026-08-06T06:00:00Z", simulado: true },
  { id: "cn_ldap", nombre: "LDAP", tipo: "directorio", protocolo: "LDAPv3", estado: "error", ultimaSync: "2026-08-04T11:21:00Z", simulado: true },
  { id: "cn_ad", nombre: "Active Directory", tipo: "directorio", protocolo: "Kerberos / LDAP", estado: "no_configurado", simulado: true },
  { id: "cn_gw", nombre: "Google Workspace", tipo: "directorio", protocolo: "Admin SDK", estado: "conectado", ultimaSync: "2026-08-06T05:30:00Z", simulado: true },
  { id: "cn_m365", nombre: "Microsoft 365", tipo: "directorio", protocolo: "Microsoft Graph", estado: "error", ultimaSync: "2026-08-06T17:05:00Z", simulado: true },
  { id: "cn_stripe", nombre: "Stripe", tipo: "pagos", protocolo: "REST + Webhooks", estado: "conectado", ultimaSync: "2026-08-06T18:40:00Z", simulado: true },
  { id: "cn_paypal", nombre: "PayPal", tipo: "pagos", protocolo: "REST", estado: "no_configurado", simulado: true },
];

export const auditLog: AuditEntry[] = [
  { id: "au_1", fecha: "2026-08-06T19:10:00Z", actor: "suscripciones.svc", accion: "provisioning.request.created", entidad: "APRV-2026-1046", tenantId: "tn_arcadia", resultado: "ok", duracionMs: 40, detalle: "Baja de SignHub (15 licencias)" },
  { id: "au_2", fecha: "2026-08-06T18:52:12Z", actor: "l.ferrer@plataforma.io", accion: "provisioning.request.started", entidad: "APRV-2026-1042", tenantId: "tn_norvia", resultado: "ok", duracionMs: 12_400, detalle: "Ampliación a 120 licencias de InsightBI" },
  { id: "au_3", fecha: "2026-08-06T17:05:41Z", actor: "provisioning.worker", accion: "provisioning.task.failed", entidad: "APRV-2026-1043", tenantId: "tn_maresa", resultado: "error", duracionMs: 30_000, detalle: "PRV-504-M365 · Microsoft Graph timeout" },
  { id: "au_4", fecha: "2026-08-06T16:44:00Z", actor: "a.serra@plataforma.io", accion: "portal.user.invited", entidad: "c.roig@arcadia.example", tenantId: "tn_arcadia", resultado: "ok", duracionMs: 120, detalle: "Rol responsable_usuarios" },
  { id: "au_5", fecha: "2026-08-06T09:00:02Z", actor: "regla:impago-30d", accion: "rules.engine.matched", entidad: "rl_03", tenantId: "tn_maresa", resultado: "ok", duracionMs: 2_100, detalle: "Suspensión pendiente de validación" },
  { id: "au_6", fecha: "2026-08-05T08:14:06Z", actor: "provisioning.worker", accion: "provisioning.request.completed", entidad: "APRV-2026-1041", tenantId: "tn_arcadia", resultado: "ok", duracionMs: 5_960, detalle: "11 tareas correctas, 0 errores" },
  { id: "au_7", fecha: "2026-08-04T11:21:10Z", actor: "provisioning.worker", accion: "provisioning.request.partial", entidad: "APRV-2026-1045", tenantId: "tn_norvia", resultado: "error", duracionMs: 70_400, detalle: "LDAP: 3 usuarios rechazados" },
];

export const portalUsers: PortalUser[] = [
  { id: "us_1", nombre: "Elena Ruiz", email: "elena.ruiz@arcadia.example", rol: "admin_empresa", estado: "activo", mfa: true, ultimoAcceso: "2026-08-06T18:31:00Z", aplicaciones: ["app_flow", "app_bill", "app_bi"] },
  { id: "us_2", nombre: "Marc Puig", email: "marc.puig@arcadia.example", rol: "admin_tecnico", estado: "activo", mfa: true, ultimoAcceso: "2026-08-06T16:02:00Z", aplicaciones: ["app_flow", "app_track"] },
  { id: "us_3", nombre: "Lucía Bravo", email: "lucia.bravo@arcadia.example", rol: "admin_financiero", estado: "activo", mfa: false, ultimoAcceso: "2026-08-05T09:47:00Z", aplicaciones: ["app_bill"] },
  { id: "us_4", nombre: "Iván Solé", email: "ivan.sole@arcadia.example", rol: "responsable_usuarios", estado: "activo", mfa: false, ultimoAcceso: "2026-08-04T13:10:00Z", aplicaciones: ["app_flow"] },
  { id: "us_5", nombre: "Carla Roig", email: "c.roig@arcadia.example", rol: "usuario_estandar", estado: "invitado", mfa: false, ultimoAcceso: null, aplicaciones: ["app_flow"] },
  { id: "us_6", nombre: "Pau Ferrán", email: "pau.ferran@arcadia.example", rol: "solo_lectura", estado: "desactivado", mfa: false, ultimoAcceso: "2026-06-19T07:55:00Z", aplicaciones: [] },
];

export const subscriptions: Subscription[] = [
  { id: "sb_1", aplicacionId: "app_flow", aplicacion: "FlowDesk", version: "4.2.1", estado: "activa", contratadaEn: "2025-03-11", renuevaEn: "2027-03-11", licenciasTotales: 40, licenciasUsadas: 34, consumoMes: 128_400, limiteConsumo: 200_000, unidadConsumo: "acciones" },
  { id: "sb_2", aplicacionId: "app_bill", aplicacion: "BillCore", version: "3.8.0", estado: "activa", contratadaEn: "2025-06-01", renuevaEn: "2026-09-01", licenciasTotales: 12, licenciasUsadas: 12, consumoMes: 8_950, limiteConsumo: 10_000, unidadConsumo: "documentos" },
  { id: "sb_3", aplicacionId: "app_bi", aplicacion: "InsightBI", version: "5.0.0", estado: "en_renovacion", contratadaEn: "2026-02-14", renuevaEn: "2026-08-14", licenciasTotales: 20, licenciasUsadas: 9, consumoMes: 41_200, limiteConsumo: 60_000, unidadConsumo: "consultas" },
  { id: "sb_4", aplicacionId: "app_sign", aplicacion: "SignHub", version: "1.9.2", estado: "baja_solicitada", contratadaEn: "2025-09-20", renuevaEn: "2026-09-20", licenciasTotales: 15, licenciasUsadas: 4, consumoMes: 310, limiteConsumo: 2_000, unidadConsumo: "firmas" },
];

export const invoices: Invoice[] = [
  { id: "in_1", numero: "F-2026-00841", fecha: "2026-08-01", vencimiento: "2026-08-15", importe: 3_240, impuestos: 680.4, estado: "pendiente", metodoPago: "Domiciliación SEPA", pdfUrl: "#" },
  { id: "in_2", numero: "F-2026-00712", fecha: "2026-07-01", vencimiento: "2026-07-15", importe: 3_240, impuestos: 680.4, estado: "pagada", metodoPago: "Domiciliación SEPA", pdfUrl: "#" },
  { id: "in_3", numero: "F-2026-00598", fecha: "2026-06-01", vencimiento: "2026-06-15", importe: 2_980, impuestos: 625.8, estado: "pagada", metodoPago: "Tarjeta ·· 4242", pdfUrl: "#" },
  { id: "in_4", numero: "F-2026-00455", fecha: "2026-05-01", vencimiento: "2026-05-15", importe: 2_980, impuestos: 625.8, estado: "vencida", metodoPago: "Transferencia", pdfUrl: "#" },
];

export const documents: DocumentItem[] = [
  { id: "dc_1", nombre: "Contrato marco de servicios", tipo: "contrato", actualizadoEn: "2025-03-11", tamano: "412 KB", url: "#" },
  { id: "dc_2", nombre: "Anexo II · Ampliación FlowDesk", tipo: "contrato", actualizadoEn: "2026-02-14", tamano: "180 KB", url: "#" },
  { id: "dc_3", nombre: "Licencias activas (resumen)", tipo: "licencia", actualizadoEn: "2026-08-01", tamano: "96 KB", url: "#" },
  { id: "dc_4", nombre: "Manual de administración FlowDesk", tipo: "manual", actualizadoEn: "2026-07-18", tamano: "2,4 MB", url: "#" },
  { id: "dc_5", nombre: "Guía de integración API", tipo: "documentacion", actualizadoEn: "2026-06-30", tamano: "1,1 MB", url: "#" },
  { id: "dc_6", nombre: "Condiciones del servicio (v4)", tipo: "condiciones", actualizadoEn: "2026-01-10", tamano: "220 KB", url: "#" },
];

export const tickets: Ticket[] = [
  {
    id: "tk_1",
    referencia: "SOP-2026-0391",
    asunto: "Error al exportar informes en InsightBI",
    aplicacion: "InsightBI",
    prioridad: "alta",
    estado: "en_curso",
    creadaEn: "2026-08-05T10:12:00Z",
    mensajes: [
      { id: "m1", autor: "Elena Ruiz", interno: false, fecha: "2026-08-05T10:12:00Z", cuerpo: "Al exportar a XLSX obtenemos un error 500 desde ayer.", adjuntos: ["captura-error.png"] },
      { id: "m2", autor: "Soporte N2", interno: true, fecha: "2026-08-05T11:40:00Z", cuerpo: "Reproducido en el entorno de pruebas. Escalado a producto.", adjuntos: [] },
    ],
  },
  {
    id: "tk_2",
    referencia: "SOP-2026-0384",
    asunto: "Solicitud de alta de 5 usuarios en FlowDesk",
    aplicacion: "FlowDesk",
    prioridad: "media",
    estado: "esperando_cliente",
    creadaEn: "2026-08-03T08:20:00Z",
    mensajes: [
      { id: "m1", autor: "Iván Solé", interno: false, fecha: "2026-08-03T08:20:00Z", cuerpo: "Necesitamos 5 accesos para el equipo de almacén.", adjuntos: [] },
      { id: "m2", autor: "Soporte N1", interno: false, fecha: "2026-08-03T09:05:00Z", cuerpo: "¿Nos confirmáis los correos corporativos?", adjuntos: [] },
    ],
  },
  {
    id: "tk_3",
    referencia: "SOP-2026-0350",
    asunto: "Consulta sobre facturación de julio",
    aplicacion: "BillCore",
    prioridad: "baja",
    estado: "resuelta",
    creadaEn: "2026-07-22T15:44:00Z",
    mensajes: [
      { id: "m1", autor: "Lucía Bravo", interno: false, fecha: "2026-07-22T15:44:00Z", cuerpo: "El importe no coincide con el anexo firmado.", adjuntos: ["anexo.pdf"] },
      { id: "m2", autor: "Soporte N1", interno: false, fecha: "2026-07-23T08:02:00Z", cuerpo: "Regularizado en la siguiente factura. Disculpad la molestia.", adjuntos: [] },
    ],
  },
];

export const usageSeries: UsagePoint[] = Array.from({ length: 30 }, (_, i) => {
  const dia = i + 1;
  const base = 24 + Math.round(8 * Math.sin(i / 3.2));
  return {
    fecha: `2026-07-${String(dia).padStart(2, "0")}`,
    usuariosActivos: base + (dia % 7 === 0 ? -9 : 0),
    consumo: 3_200 + Math.round(1_400 * Math.sin(i / 2.1)) + i * 42,
    almacenamientoGb: 180 + i * 1.8,
  };
});

export const sessions: SessionInfo[] = [
  { id: "se_1", dispositivo: "Chrome 138 · macOS", ubicacion: "Barcelona, ES", ip: "88.12.44.9", inicio: "2026-08-06T18:31:00Z", actual: true },
  { id: "se_2", dispositivo: "Safari · iPhone", ubicacion: "Barcelona, ES", ip: "88.12.44.9", inicio: "2026-08-06T07:11:00Z", actual: false },
  { id: "se_3", dispositivo: "Edge 137 · Windows 11", ubicacion: "Zaragoza, ES", ip: "212.98.4.31", inicio: "2026-08-02T09:02:00Z", actual: false },
];

export const accessLog: AccessLogEntry[] = [
  { id: "al_1", fecha: "2026-08-06T18:31:00Z", usuario: "elena.ruiz@arcadia.example", ip: "88.12.44.9", metodo: "sso_google", resultado: "ok" },
  { id: "al_2", fecha: "2026-08-06T16:02:00Z", usuario: "marc.puig@arcadia.example", ip: "88.12.44.9", metodo: "password", resultado: "ok" },
  { id: "al_3", fecha: "2026-08-06T15:58:00Z", usuario: "marc.puig@arcadia.example", ip: "88.12.44.9", metodo: "password", resultado: "fallido" },
  { id: "al_4", fecha: "2026-08-05T09:47:00Z", usuario: "lucia.bravo@arcadia.example", ip: "77.230.1.4", metodo: "saml", resultado: "ok" },
];

export const notifications: NotificationItem[] = [
  { id: "nt_1", tipo: "renovacion", titulo: "InsightBI renueva en 8 días", cuerpo: "La suscripción de InsightBI se renovará automáticamente el 14/08/2026.", fecha: "2026-08-06T08:00:00Z", leida: false },
  { id: "nt_2", tipo: "alerta", titulo: "BillCore al 89% del límite de consumo", cuerpo: "Has consumido 8.950 de 10.000 documentos del mes.", fecha: "2026-08-05T20:15:00Z", leida: false },
  { id: "nt_3", tipo: "incidencia", titulo: "Actualización en SOP-2026-0391", cuerpo: "Soporte ha escalado la incidencia al equipo de producto.", fecha: "2026-08-05T11:41:00Z", leida: true },
  { id: "nt_4", tipo: "cambio", titulo: "Nueva versión de FlowDesk 4.2.1", cuerpo: "Incluye mejoras de accesibilidad y exportación masiva.", fecha: "2026-07-30T07:00:00Z", leida: true },
  { id: "nt_5", tipo: "aviso", titulo: "Mantenimiento programado", cuerpo: "El 12/08 de 23:00 a 00:30 (CEST) habrá una ventana de mantenimiento.", fecha: "2026-07-28T09:30:00Z", leida: true },
];

export const notificationPreferences: NotificationPreferences = {
  renovaciones: true,
  consumo: true,
  incidencias: true,
  facturacion: true,
  productoNovedades: false,
  canal: "ambos",
};
