/**
 * Modelo de datos normalizado (núcleo compartido por Aprovisionamiento y Portal).
 * Los identificadores son opacos (string) para permitir su migración a UUID/BD real.
 */

export type Locale = "es-ES" | "en-GB" | "ca-ES" | "pt-PT";

export type ProvisioningOperation =
  | "alta"
  | "baja"
  | "modificacion"
  | "suspension"
  | "reactivacion"
  | "ampliacion"
  | "reduccion";

export type ProvisioningStatus =
  | "pendiente"
  | "en_proceso"
  | "esperando_validacion"
  | "completado"
  | "completado_parcial"
  | "error"
  | "cancelado"
  | "revertido";

export type SourceSystem =
  | "crm"
  | "clientes"
  | "suscripciones"
  | "api_externa"
  | "integraciones"
  | "automatizaciones"
  | "manual";

export interface Tenant {
  id: string;
  slug: string;
  organizacion: string;
  cif: string;
  plan: string;
  estado: "activo" | "suspendido" | "baja";
  locale: Locale;
  zonaHoraria: string;
  creadoEn: string;
  limites: {
    usuarios: number;
    almacenamientoGb: number;
    llamadasApiMes: number;
  };
}

export interface Application {
  id: string;
  nombre: string;
  clave: string;
  version: string;
  categoria: string;
}

export interface ProvisioningTask {
  id: string;
  nombre: string;
  sistema: string;
  estado: "pendiente" | "ok" | "error" | "omitido";
  duracionMs: number;
  detalle?: string;
}

export interface ProvisioningError {
  codigo: string;
  motivo: string;
  sistemaAfectado: string;
  reintentos: number;
  reintentable: boolean;
}

export interface ProvisioningRequest {
  id: string;
  referencia: string;
  operacion: ProvisioningOperation;
  origen: SourceSystem;
  estado: ProvisioningStatus;
  tenantId: string;
  organizacion: string;
  aplicacionId: string;
  aplicacion: string;
  solicitadoPor: string;
  creadoEn: string;
  actualizadoEn: string;
  duracionMs: number;
  reintentos: number;
  licencias: number;
  tareas: ProvisioningTask[];
  error?: ProvisioningError;
  correlationId: string;
}

export type RuleTrigger =
  | "contratacion.creada"
  | "suscripcion.modificada"
  | "suscripcion.cancelada"
  | "pago.fallido"
  | "usuario.invitado";

export interface RuleAction {
  tipo:
    | "crear_grupo"
    | "crear_usuario_admin"
    | "asignar_permisos"
    | "asignar_almacenamiento"
    | "enviar_correo"
    | "crear_api_key"
    | "webhook"
    | "suspender_tenant";
  parametros: Record<string, string | number>;
}

export interface ProvisioningRule {
  id: string;
  nombre: string;
  evento: RuleTrigger;
  condicion: string;
  acciones: RuleAction[];
  activa: boolean;
  prioridad: number;
  ejecuciones: number;
}

export interface Connector {
  id: string;
  nombre: string;
  tipo: "identidad" | "directorio" | "pagos" | "generico";
  protocolo: string;
  estado: "conectado" | "no_configurado" | "error";
  ultimaSync?: string;
  simulado: boolean;
}

export interface AuditEntry {
  id: string;
  fecha: string;
  actor: string;
  accion: string;
  entidad: string;
  tenantId: string;
  resultado: "ok" | "error";
  duracionMs: number;
  detalle: string;
}

/* ---------- Portal del cliente ---------- */

export type PortalRole =
  | "admin_empresa"
  | "admin_tecnico"
  | "admin_financiero"
  | "responsable_usuarios"
  | "usuario_estandar"
  | "solo_lectura";

export interface PortalUser {
  id: string;
  nombre: string;
  email: string;
  rol: PortalRole;
  estado: "activo" | "invitado" | "desactivado";
  mfa: boolean;
  ultimoAcceso: string | null;
  aplicaciones: string[];
}

export interface Subscription {
  id: string;
  aplicacionId: string;
  aplicacion: string;
  version: string;
  estado: "activa" | "suspendida" | "en_renovacion" | "baja_solicitada";
  contratadaEn: string;
  renuevaEn: string;
  licenciasTotales: number;
  licenciasUsadas: number;
  consumoMes: number;
  limiteConsumo: number;
  unidadConsumo: string;
}

export interface Invoice {
  id: string;
  numero: string;
  fecha: string;
  vencimiento: string;
  importe: number;
  impuestos: number;
  estado: "pagada" | "pendiente" | "vencida";
  metodoPago: string;
  pdfUrl: string;
}

export interface DocumentItem {
  id: string;
  nombre: string;
  tipo: "contrato" | "licencia" | "manual" | "documentacion" | "condiciones";
  actualizadoEn: string;
  tamano: string;
  url: string;
}

export interface TicketMessage {
  id: string;
  autor: string;
  interno: boolean;
  fecha: string;
  cuerpo: string;
  adjuntos: string[];
}

export interface Ticket {
  id: string;
  referencia: string;
  asunto: string;
  aplicacion: string;
  prioridad: "baja" | "media" | "alta" | "critica";
  estado: "abierta" | "en_curso" | "esperando_cliente" | "resuelta";
  creadaEn: string;
  mensajes: TicketMessage[];
}

export interface UsagePoint {
  fecha: string;
  usuariosActivos: number;
  consumo: number;
  almacenamientoGb: number;
}

export interface SessionInfo {
  id: string;
  dispositivo: string;
  ubicacion: string;
  ip: string;
  inicio: string;
  actual: boolean;
}

export interface AccessLogEntry {
  id: string;
  fecha: string;
  usuario: string;
  ip: string;
  metodo: "password" | "sso_google" | "sso_microsoft" | "saml";
  resultado: "ok" | "fallido";
}

export interface NotificationItem {
  id: string;
  tipo: "aviso" | "alerta" | "renovacion" | "cambio" | "incidencia" | "mensaje";
  titulo: string;
  cuerpo: string;
  fecha: string;
  leida: boolean;
}

export interface NotificationPreferences {
  renovaciones: boolean;
  consumo: boolean;
  incidencias: boolean
  facturacion: boolean;
  productoNovedades: boolean;
  canal: "email" | "portal" | "ambos";
}
