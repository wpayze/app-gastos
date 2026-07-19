import type {
  BudgetRole,
  Frequency,
  MemberStatus,
  PaymentMethod,
  RecurrentStatus,
} from "./types";

export const ROLE_LABEL: Record<BudgetRole, string> = {
  administrador: "Administrador",
  editor: "Editor",
  lectura: "Solo lectura",
};

export const MEMBER_STATUS_LABEL: Record<MemberStatus, string> = {
  activo: "Activo",
  pendiente: "Invitación pendiente",
  suspendido: "Suspendido",
};

export const FREQUENCY_LABEL: Record<Frequency, string> = {
  semanal: "Semanal",
  quincenal: "Quincenal",
  mensual: "Mensual",
  anual: "Anual",
};

export const PAYMENT_LABEL: Record<PaymentMethod, string> = {
  tarjeta: "Tarjeta",
  efectivo: "Efectivo",
  transferencia: "Transferencia",
  domiciliacion: "Domiciliación",
};

export const RECURRENT_STATUS_LABEL: Record<RecurrentStatus, string> = {
  activo: "Activo",
  pausado: "Pausado",
  finalizado: "Finalizado",
};
