export type UserRole = 'ADMIN' | 'COLLABORATOR';

export interface Sale {
  id: string;
  date: string; // YYYY-MM-DD
  shift: 'MEDIODIA' | 'NOCHE';
  covers: number; // Registro de cubiertos / comensales
  channel: 'SALON' | 'TAKEAWAY' | 'DELIVERY_PROPIO' | 'RAPPI' | 'PEDIDOS_YA';
  paymentMethod: 'EFECTIVO' | 'MERCADO_PAGO' | 'DEBITO' | 'CREDITO' | 'TRANSFERENCIA';
  grossAmount: number;
  commissionAmount: number;
  netAmount: number;
  notes?: string;
  lastModifiedBy?: UserRole;
  lastModifiedAt?: string;
}

export interface Supplier {
  id: string;
  name: string;
  cuit: string;
  category: string; // Carne, Verdura, Bebidas, Lácteos, Envasados, etc.
  phone: string;
  email: string;
  paymentTermDays: number;
  initialBalanceDue?: number;
  balanceDue: number;
  lastModifiedBy?: UserRole;
  lastModifiedAt?: string;
}

export interface PurchaseInvoice {
  id: string;
  supplierId: string;
  supplierName: string;
  invoiceNumber: string;
  date: string;
  dueDate: string;
  amount: number;
  paidAmount?: number;
  status: 'PENDIENTE' | 'PARCIAL' | 'PAGADO' | 'VENCIDO';
  items: { description: string; qty: number; unitPrice: number; prevUnitPrice?: number }[];
  fileUrl?: string;
  lastModifiedBy?: UserRole;
  lastModifiedAt?: string;
}

export interface SupplierPayment {
  id: string;
  supplierId: string;
  supplierName: string;
  invoiceId?: string;
  invoiceNumber?: string;
  date: string;
  paymentMethod: 'CHEQUE_PROPIO' | 'CHEQUE_TERCERO' | 'EFECTIVO' | 'TRANSFERENCIA' | 'BONIFICACION_ACUERDO';
  amount: number;
  checkNumber?: string;
  bank?: string;
  dueDate?: string;
  notes?: string;
  lastModifiedBy?: UserRole;
  lastModifiedAt?: string;
}

export interface Expense {
  id: string;
  date: string;
  category: string;
  expenseGroup?: 'FUNCIONAMIENTO' | 'IMPUESTOS' | 'VARIOS';
  type?: string;
  description: string;
  amount: number;
  paymentMethod?: string;
  bankName?: string; // banco específico cuando paymentMethod es una transferencia/débito bancario
  dueDate?: string;
  status: 'PENDIENTE' | 'PAGADO';
  linkedAdvanceId?: string; // presente cuando este gasto fue generado automáticamente desde un Adelanto
  lastModifiedBy?: UserRole;
  lastModifiedAt?: string;
}

export interface Check {
  id: string;
  type: 'PROPIO' | 'TERCERO';
  number: string;
  bank: string;
  issuerOrRecipient: string; // Nombre del proveedor o cliente
  issueDate: string;
  dueDate: string;
  amount: number;
  status: 'PENDIENTE' | 'COBRADO' | 'DEPOSITADO' | 'ENDOSADO' | 'ANULADO' | 'CUBIERTO' | 'PAGADO';
  notes?: string;
  lastModifiedBy?: UserRole;
  lastModifiedAt?: string;
}

export interface Employee {
  id: string;
  name: string;
  role: 'COCINA' | 'MOZO' | 'BARRA' | 'ENCAJERO' | 'LIMPIEZA' | 'GERENTE';
  baseSalary: number;
  paymentType: 'MENSUAL' | 'JORNAL';
  active: boolean;
}

export interface Advance {
  id: string;
  employeeId: string;
  employeeName: string;
  date: string;
  amount: number;
  paymentMethod?: 'EFECTIVO' | 'TRANSFERENCIA' | 'MERCADO_PAGO';
  bankName?: string;
  linkedExpenseId?: string; // el gasto en Pagos generado automáticamente para este adelanto
  notes?: string;
}

export interface Tip {
  id: string;
  date: string;
  totalTips: number;
  distributedAmount: number;
}

export interface Dish {
  id: string;
  name: string;
  category: 'ENTRADA' | 'PRINCIPAL' | 'POSTRE' | 'BEBIDA';
  salesPrice: number;
  costPrice: number;
  salesVolumeMonth: number;
  classification: 'ESTRELLA' | 'VACALUCHERA' | 'INCOGNITA' | 'PERRO';
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
  dataSnippet?: any;
}

export interface InitialBalance {
  id: string;
  accountType: 'CAJA' | 'MERCADO_PAGO' | 'BANCO';
  bankName?: string;
  date: string;
  amount: number;
  notes?: string;
  lastModifiedBy?: UserRole;
  lastModifiedAt?: string;
}

export interface BankMovement {
  id: string;
  bankName: string;
  date: string;
  type: 'INGRESO' | 'EGRESO';
  concept: string;
  amount: number;
  referenceNumber?: string;
  notes?: string;
  lastModifiedBy?: UserRole;
  lastModifiedAt?: string;
}

// Equivalente a BankMovement pero para las cuentas que no son un banco:
// Caja (efectivo) y MercadoPago. Junto con BankMovement, es la única fuente
// de verdad para calcular saldos — ninguna vista debería recalcularlos por su cuenta.
export interface CashMovement {
  id: string;
  accountType: 'CAJA' | 'MERCADO_PAGO';
  date: string;
  direction: 'INGRESO' | 'EGRESO';
  concept: string;
  amount: number;
  sourceModule: 'VENTA' | 'PAGO_PROVEEDOR' | 'GASTO' | 'ADELANTO' | 'RETIRO_SOCIO';
  sourceId?: string; // id de la venta/pago/gasto/adelanto/retiro que originó este movimiento
  notes?: string;
}

export interface AccountBalances {
  caja: number;
  mercadoPago: number;
  bancos: number;
  bancosPorEntidad: Record<string, number>;
}

// --- Socios: consumo interno no cobrado, para computar luego como Retiro ---

export interface Partner { // "Socio"
  id: string;
  name: string;
  active: boolean;
  linkedToPartnerId?: string; // id del socio titular al que está vinculado (si es socio adherente)
  sharePercentage?: number; // % que le corresponde del total de consumos del grupo (ej. 50%)
}

// Consumo de comida/bebida de un socio que no se cobra en el momento. No es
// una Venta (no ingresa plata real) ni un Gasto — queda pendiente hasta que
// se liquida en un Retiro de Socios, que lo descuenta de su parte.
export interface PartnerConsumption {
  id: string;
  partnerId: string;
  partnerName: string;
  date: string; // YYYY-MM-DD
  description: string;
  amount: number; // valor del consumo (a precio de carta)
  notes?: string;
  settled: boolean; // true una vez incluido en un Retiro de Socios
  settlementId?: string;
  lastModifiedBy?: UserRole;
  lastModifiedAt?: string;
}

export interface PartnerWithdrawalShare {
  partnerId: string;
  partnerName: string;
  sharePercentage: number;
  consumptionTotal: number;
  withdrawalShare: number;
}

export interface PartnerWithdrawalCashLine {
  partnerId: string;
  partnerName: string;
  cashAmount: number;
  cashAccountType?: 'CAJA' | 'MERCADO_PAGO' | 'BANCO';
  bankName?: string;
}

// Retiro de Socios: liquida el consumo acumulado y pendiente de un socio (o grupo de socios con %)
// (no mueve caja/banco, es una compensación contable) y opcionalmente
// registra además un retiro en efectivo/banco real (ese sí mueve caja/banco).
export interface PartnerWithdrawal {
  id: string;
  partnerId: string;
  partnerName: string;
  date: string;
  periodLabel: string; // mes que se liquida, ej. "2026-09"
  consumptionAmount: number; // total de consumos liquidados en este retiro (de todo el grupo)
  cashAmount: number; // retiro adicional real total en efectivo/banco, 0 si no hubo
  cashAccountType?: 'CAJA' | 'MERCADO_PAGO' | 'BANCO';
  bankName?: string;
  notes?: string;
  shares?: PartnerWithdrawalShare[];
  cashLines?: PartnerWithdrawalCashLine[];
  groupPartnerIds?: string[];
}

export interface BudgetItemTarget {
  id: string;
  group: 'PERSONAL' | 'COMPRAS' | 'FUNCIONAMIENTO' | 'IMPUESTOS' | 'VARIOS';
  category?: string; // Opcional, para presupuestar una categoría específica como "ALQUILER" o "LUZ / GAS / AGUA"
  targetAmount: number; // Monto objetivo presupuestado en $
  targetPercentage?: number; // % objetivo sobre ventas brutas proyectadas
  notes?: string;
}

export interface MonthlyBudget {
  monthKey: string; // "YYYY-MM"
  projectedSalesGross: number; // Facturación Bruta proyectada esperada
  items: BudgetItemTarget[];
  notes?: string;
  lastModifiedBy?: UserRole;
  lastModifiedAt?: string;
}



