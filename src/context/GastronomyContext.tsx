'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  UserRole,
  Sale,
  Supplier,
  PurchaseInvoice,
  SupplierPayment,
  Expense,
  Check,
  Employee,
  Advance,
  Dish,
  ChatMessage,
  InitialBalance,
  BankMovement,
  CashMovement,
  Partner,
  PartnerConsumption,
  PartnerWithdrawal,
  PartnerWithdrawalShare,
  PartnerWithdrawalCashLine,
  BudgetItemTarget,
  MonthlyBudget
} from '../types/gastronomy';

import importedData from '../data/imported_suppliers_data.json';

// Interpreta un medio de pago en texto libre (Ventas/Gastos) y dice a qué
// tipo de cuenta afecta. Única función de este tipo en todo el proyecto —
// si en algún módulo hace falta esta lógica, se importa de acá, no se reescribe.
export function classifyPaymentMethod(pm?: string): 'CAJA' | 'MERCADO_PAGO' | 'BANCO' | null {
  if (!pm) return null;
  const v = pm.toUpperCase();
  if (v.includes('EFECTIVO') || v.includes('CAJA CHICA')) return 'CAJA';
  if (v.includes('TRANSFERENCIA') || v.includes('BANCARIA') || v === 'BANCO') return 'BANCO';
  if (v.includes('MERCADO PAGO') || v.includes('MERCADO_PAGO') || v.includes('TARJETA') || v.includes('DEBITO') || v.includes('DÉBITO') || v.includes('CREDITO') || v.includes('CRÉDITO') || v.includes('DIGITAL')) return 'MERCADO_PAGO';
  return null;
}

export function classifyExpenseGroup(category: string, group?: string): 'FUNCIONAMIENTO' | 'IMPUESTOS' | 'VARIOS' {
  if (group === 'FUNCIONAMIENTO' || group === 'IMPUESTOS' || group === 'VARIOS') {
    return group;
  }
  const cat = (category || '').toUpperCase();

  // Impuestos / Tasas / Cargas Sociales / Afip / Arba / IVA / IIBB
  if (
    cat.includes('IMPUESTO') ||
    cat.includes('TASAS') ||
    cat.includes('AFIP') ||
    cat.includes('ARBA') ||
    cat.includes('IIBB') ||
    cat.includes('IVA') ||
    cat.includes('MUNICIPAL') ||
    cat.includes('CARGAS SOCIALES') ||
    cat.includes('MONOTRIBUTO') ||
    cat.includes('GANANCIAS') ||
    cat.includes('DÉBITOS BANCARIOS') ||
    cat.includes('RETENCION')
  ) {
    return 'IMPUESTOS';
  }

  // Funcionamiento / Operativos
  if (
    cat.includes('ALQUILER') ||
    cat.includes('LUZ') ||
    cat.includes('GAS') ||
    cat.includes('AGUA') ||
    cat.includes('INTERNET') ||
    cat.includes('SOFTWARE') ||
    cat.includes('FUDO') ||
    cat.includes('MANTENIMIENTO') ||
    cat.includes('MARKETING') ||
    cat.includes('SEGUROS') ||
    cat.includes('HONORARIOS') ||
    cat.includes('LIMPIEZA') ||
    cat.includes('SERVICIOS') ||
    cat.includes('FUNCIONAMIENTO')
  ) {
    return 'FUNCIONAMIENTO';
  }

  return 'VARIOS';
}

const currentMonthKey = () => new Date().toISOString().slice(0, 7); // 'YYYY-MM'

interface GastronomyContextType {
  role: UserRole;
  setRole: (role: UserRole) => void;
  loginRole: LoginRole;
  isAppAuthenticated: boolean;
  isEmployeesUnlocked: boolean;
  authenticateApp: (pin: string) => Promise<{ success: boolean; message?: string }>;
  authenticateEmployees: (pin: string) => Promise<{ success: boolean; message?: string }>;
  authenticateAdmin: (pin: string) => Promise<{ success: boolean; message?: string }>;
  lockEmployees: () => void;
  logoutApp: () => void;
  sales: Sale[];
  addSale: (sale: Omit<Sale, 'id' | 'netAmount'>) => void;
  editSale: (id: string, saleData: Partial<Sale>) => void;
  deleteSale: (id: string) => void;
  suppliers: Supplier[];
  addSupplier: (supplier: Omit<Supplier, 'id' | 'balanceDue'>) => void;
  editSupplier: (id: string, supplierData: Partial<Supplier>) => void;
  purchases: PurchaseInvoice[];
  addPurchase: (purchase: Omit<PurchaseInvoice, 'id'>) => void;
  editPurchase: (id: string, purchaseData: Partial<PurchaseInvoice>) => void;
  supplierPayments: SupplierPayment[];
  addSupplierPayment: (payment: Omit<SupplierPayment, 'id'>) => void;
  expenses: Expense[];
  addExpense: (expense: Omit<Expense, 'id'>) => void;
  editExpense: (id: string, expenseData: Partial<Expense>) => void;
  checks: Check[];
  addCheck: (check: Omit<Check, 'id'>) => void;
  editCheck: (id: string, checkData: Partial<Check>) => void;
  markCheckAsCovered: (id: string, customBankName?: string) => void;
  toggleCheckCovered: (id: string, customBankName?: string) => void;
  employees: Employee[];
  addEmployee: (employee: Omit<Employee, 'id'>) => void;
  advances: Advance[];
  addAdvance: (advance: Omit<Advance, 'id'>) => void;
  dishes: Dish[];
  chatMessages: ChatMessage[];
  sendChatMessage: (text: string) => Promise<void>;
  // Socios: consumo interno no cobrado y su liquidación como Retiro
  partners: Partner[];
  addPartner: (partner: Omit<Partner, 'id'>) => void;
  editPartner: (id: string, partnerData: Partial<Partner>) => void;
  partnerConsumptions: PartnerConsumption[];
  addPartnerConsumption: (consumption: Omit<PartnerConsumption, 'id' | 'settled' | 'settlementId'>) => void;
  partnerWithdrawals: PartnerWithdrawal[];
  addPartnerWithdrawal: (withdrawal: {
    partnerId: string;
    date: string;
    cashAmount?: number;
    cashAccountType?: 'CAJA' | 'MERCADO_PAGO' | 'BANCO';
    bankName?: string;
    cashLines?: PartnerWithdrawalCashLine[];
    notes?: string;
  }) => void;
  // Saldos Iniciales & Bancos
  initialBalances: InitialBalance[];
  addInitialBalance: (ib: Omit<InitialBalance, 'id'>) => void;
  editInitialBalance: (id: string, ibData: Partial<InitialBalance>) => void;
  deleteInitialBalance: (id: string) => void;
  bankMovements: BankMovement[];
  addBankMovement: (bm: Omit<BankMovement, 'id'>) => void;
  editBankMovement: (id: string, bmData: Partial<BankMovement>) => void;
  deleteBankMovement: (id: string) => void;
  // Libro mayor de Caja y MercadoPago (equivalente de bankMovements para esas dos cuentas)
  cashMovements: CashMovement[];
  // Saldos centralizados — única fuente de verdad, usada por Dashboard, Ventas, Bancos y el Asistente IA
  cajaMayorBalance: number;
  mercadoPagoBalance: number;
  bancosBalance: number;
  bancosPorEntidad: Record<string, number>;
  // Computed KPIs
  totalSalesNetMonth: number;
  totalPurchasesMonth: number;
  totalLaborMonth: number;
  primeCostPercentage: number;
  foodCostPercentage: number;
  laborCostPercentage: number;
  totalFixedExpensesMonth: number;
  netProfitEstMonth: number;
  breakEvenTarget: number;
  pendingChecksAmount7Days: number;
  pendingServicesAmount: number;
  totalCoversMonth: number;
  averageTicketPerCover: number;
  totalSupplierDebt: number;
  // Indicadores BI sobre Facturación Bruta (Ideal: Personal 20%, Compras 45%, Funcionamiento 13%, Impuestos 7%)
  totalSalesGrossMonth: number;
  totalOperatingExpensesMonth: number;
  totalTaxExpensesMonth: number;
  laborGrossPercentage: number;
  purchasesGrossPercentage: number;
  operatingExpensesPercentage: number;
  taxExpensesPercentage: number;
  // Presupuestos & Planificación Financiera
  budgets: MonthlyBudget[];
  saveMonthlyBudget: (budget: MonthlyBudget) => void;
  getBudgetForMonth: (monthKey: string) => MonthlyBudget | undefined;
  copyPreviousMonthBudget: (currentMonthKey: string) => void;
}

const INITIAL_SALES: Sale[] = [];
const INITIAL_SUPPLIERS: Supplier[] = importedData.suppliers as Supplier[];
const INITIAL_PURCHASES: PurchaseInvoice[] = importedData.purchases as PurchaseInvoice[];
const INITIAL_SUPPLIER_PAYMENTS: SupplierPayment[] = importedData.payments as SupplierPayment[];
const INITIAL_EXPENSES: Expense[] = [];
const INITIAL_CHECKS: Check[] = importedData.checks as Check[];
const INITIAL_EMPLOYEES: Employee[] = [];
const INITIAL_ADVANCES: Advance[] = [];
const INITIAL_DISHES: Dish[] = [];

const INITIAL_CHAT_MESSAGES: ChatMessage[] = [
  {
    id: 'm1',
    sender: 'assistant',
    text: '¡Hola! Soy tu Asistente Financiero y Administrativo IA para el restaurante. Puedo responder preguntas sobre tus ventas, pagos a proveedores, cheques, sueldos y estado de rentabilidad en tiempo real. ¿En qué puedo ayudarte hoy?',
    timestamp: '18:35'
  }
];

const INITIAL_INITIAL_BALANCES: InitialBalance[] = [];

const INITIAL_PARTNERS: Partner[] = [
  { id: 'soc1', name: 'Franco', active: true },
  { id: 'soc2', name: 'David', active: true },
  { id: 'soc3', name: 'Gabriel', active: true },
  // Diego comparte el 50% de Gabriel — no es un socio titular independiente,
  // así que su consumo se suma al de Gabriel y el Retiro se hace siempre
  // sobre Gabriel (ver getPartnerGroup / addPartnerWithdrawal más abajo).
  { id: 'assoc1', name: 'Diego', active: true, linkedToPartnerId: 'soc3', sharePercentage: 50 },
];

const INITIAL_PARTNER_CONSUMPTIONS: PartnerConsumption[] = [];
const INITIAL_PARTNER_WITHDRAWALS: PartnerWithdrawal[] = [];

const INITIAL_BANK_MOVEMENTS: BankMovement[] = [];

const GastronomyContext = createContext<GastronomyContextType | undefined>(undefined);

export type LoginRole = 'admin' | 'colab' | null;

export const GastronomyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [role, setRole] = useState<UserRole>('ADMIN');
  const [isAppAuthenticated, setIsAppAuthenticated] = useState<boolean>(false);
  const [isEmployeesUnlocked, setIsEmployeesUnlocked] = useState<boolean>(false);
  const [loginRole, setLoginRole] = useState<LoginRole>('admin');
  const [sales, setSales] = useState<Sale[]>(INITIAL_SALES);
  const [suppliers, setSuppliers] = useState<Supplier[]>(INITIAL_SUPPLIERS);
  const [purchases, setPurchases] = useState<PurchaseInvoice[]>(INITIAL_PURCHASES);
  const [supplierPayments, setSupplierPayments] = useState<SupplierPayment[]>(INITIAL_SUPPLIER_PAYMENTS);
  const [expenses, setExpenses] = useState<Expense[]>(INITIAL_EXPENSES);
  const [checks, setChecks] = useState<Check[]>(INITIAL_CHECKS);
  const [employees, setEmployees] = useState<Employee[]>(INITIAL_EMPLOYEES);
  const [advances, setAdvances] = useState<Advance[]>(INITIAL_ADVANCES);
  const [dishes] = useState<Dish[]>(INITIAL_DISHES);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>(INITIAL_CHAT_MESSAGES);
  const [initialBalances, setInitialBalances] = useState<InitialBalance[]>(INITIAL_INITIAL_BALANCES);
  const [bankMovements, setBankMovements] = useState<BankMovement[]>(INITIAL_BANK_MOVEMENTS);
  const [cashMovements, setCashMovements] = useState<CashMovement[]>([]);
  const [partners, setPartners] = useState<Partner[]>(INITIAL_PARTNERS);
  const [partnerConsumptions, setPartnerConsumptions] = useState<PartnerConsumption[]>(INITIAL_PARTNER_CONSUMPTIONS);
  const [partnerWithdrawals, setPartnerWithdrawals] = useState<PartnerWithdrawal[]>(INITIAL_PARTNER_WITHDRAWALS);
  const [budgets, setBudgets] = useState<MonthlyBudget[]>([]);

  // Registra un movimiento de Caja o MercadoPago. Es el único lugar del código
  // que debe escribir en cashMovements — todas las funciones de venta, pago,
  // gasto y adelanto pasan por acá en vez de tocar saldos "a mano".
  const pushCashMovement = (cm: Omit<CashMovement, 'id'>) => {
    setCashMovements(prev => {
      const updated = [{ ...cm, id: `cm_${Date.now()}_${Math.random().toString(36).slice(2, 7)}` }, ...prev];
      try { localStorage.setItem('gastro_cash_movements', JSON.stringify(updated)); } catch (e) {}
      return updated;
    });
  };

  // Quita cualquier movimiento de caja/MP ya generado para un origen dado
  // (por ejemplo, una venta editada) antes de volver a registrarlo.
  const removeCashMovementsBySource = (sourceModule: CashMovement['sourceModule'], sourceId: string) => {
    setCashMovements(prev => {
      const updated = prev.filter(cm => !(cm.sourceModule === sourceModule && cm.sourceId === sourceId));
      try { localStorage.setItem('gastro_cash_movements', JSON.stringify(updated)); } catch (e) {}
      return updated;
    });
  };

  useEffect(() => {
    try {
      if (!localStorage.getItem('gastro_reset_datos_zero_v6')) {
        [
          'gastro_sales', 'gastro_suppliers', 'gastro_purchases',
          'gastro_supplier_payments', 'gastro_expenses', 'gastro_checks',
          'gastro_employees', 'gastro_advances', 'gastro_initial_balances',
          'gastro_bank_movements', 'gastro_cash_movements',
        ].forEach(key => localStorage.removeItem(key));
        localStorage.setItem('gastro_reset_datos_zero_v6', 'true');
      }

      const savedSales = localStorage.getItem('gastro_sales');
      if (savedSales) {
        const parsedSales: Sale[] = JSON.parse(savedSales);
        const seen = new Set<string>();
        const deduplicatedSales = parsedSales.filter(s => {
          const key = `${s.date}_${s.shift}_${s.paymentMethod}_${s.grossAmount}`;
          if (seen.has(key)) return false;
          seen.add(key);
          return true;
        });
        setSales(deduplicatedSales);
        try { localStorage.setItem('gastro_sales', JSON.stringify(deduplicatedSales)); } catch (e) {}
      }

      const authedCookie = document.cookie.split('; ').find(c => c.startsWith('app_authenticated='));
      const authedLocal = localStorage.getItem('gastro_app_authed');
      if (authedCookie || authedLocal === 'true') {
        setIsAppAuthenticated(true);
      }

      const employeesUnlockedLocal = localStorage.getItem('gastro_employees_unlocked');
      const employeesUnlockedCookie = document.cookie.split('; ').find(c => c.startsWith('employees_unlocked='));
      if (employeesUnlockedLocal === 'true' || employeesUnlockedCookie) {
        setIsEmployeesUnlocked(true);
      }

      const savedSuppliers = localStorage.getItem('gastro_suppliers');
      if (savedSuppliers) setSuppliers(JSON.parse(savedSuppliers));

      const savedPurchases = localStorage.getItem('gastro_purchases');
      if (savedPurchases) setPurchases(JSON.parse(savedPurchases));

      const savedPayments = localStorage.getItem('gastro_supplier_payments');
      if (savedPayments) setSupplierPayments(JSON.parse(savedPayments));

      const savedExpenses = localStorage.getItem('gastro_expenses');
      if (savedExpenses) {
        const parsed: Expense[] = JSON.parse(savedExpenses);
        setExpenses(parsed.map(e => ({
          ...e,
          paymentMethod: e.paymentMethod || (e.category === 'LUZ' || e.category === 'ALQUILER' || e.category === 'SOFTWARE' ? 'TRANSFERENCIA BANCARIA' : 'EFECTIVO (Caja Chica)')
        })));
      }

      const savedChecks = localStorage.getItem('gastro_checks');
      if (savedChecks) setChecks(JSON.parse(savedChecks));

      const savedEmployees = localStorage.getItem('gastro_employees');
      if (savedEmployees) setEmployees(JSON.parse(savedEmployees));

      const savedAdvances = localStorage.getItem('gastro_advances');
      if (savedAdvances) setAdvances(JSON.parse(savedAdvances));

      const savedIB = localStorage.getItem('gastro_initial_balances');
      if (savedIB) setInitialBalances(JSON.parse(savedIB));

      const savedBM = localStorage.getItem('gastro_bank_movements');
      if (savedBM) setBankMovements(JSON.parse(savedBM));

      const savedCM = localStorage.getItem('gastro_cash_movements');
      if (savedCM) setCashMovements(JSON.parse(savedCM));

      const savedPartners = localStorage.getItem('gastro_partners');
      if (savedPartners) {
        const parsedPartners: Partner[] = JSON.parse(savedPartners);
        // Reparación automática: los socios reales de este negocio son
        // siempre Franco, David y Gabriel (titulares) más Diego (adherente
        // de Gabriel). Si a un navegador le falta Franco o David activos —ya
        // sea porque todavía tiene los "Socio 1/2/3" genéricos de antes, o
        // porque quedó una carga manual a medio hacer con nombres o
        // vinculaciones mezcladas—, se reemplaza toda la lista por la
        // correcta. Una vez que Franco y David ya están cargados bien, esta
        // condición no se vuelve a cumplir y no se toca nada más.
        const faltanLosTitularesReales = !(
          parsedPartners.some(p => p.name === 'Franco' && p.active) &&
          parsedPartners.some(p => p.name === 'David' && p.active)
        );
        if (faltanLosTitularesReales) {
          setPartners(INITIAL_PARTNERS);
          try { localStorage.setItem('gastro_partners', JSON.stringify(INITIAL_PARTNERS)); } catch (e) {}
        } else {
          setPartners(parsedPartners);
        }
      }

      const savedPC = localStorage.getItem('gastro_partner_consumptions');
      if (savedPC) setPartnerConsumptions(JSON.parse(savedPC));

      const savedPW = localStorage.getItem('gastro_partner_withdrawals');
      if (savedPW) setPartnerWithdrawals(JSON.parse(savedPW));

      const savedBudgets = localStorage.getItem('gastro_budgets');
      if (savedBudgets) setBudgets(JSON.parse(savedBudgets));
    } catch (e) {
      console.error(e);
    }
  }, []);

  // Toda venta cobrada mueve plata a alguna cuenta. EFECTIVO va a Caja; el resto
  // de los medios (MercadoPago, Débito, Crédito, Transferencia) se agrupa por ahora
  // como "digital" en MercadoPago, igual que ya hacía la vista de Ventas — separar
  // Transferencia en su banco específico queda para cuando haya un selector de banco en Ventas.
  const registerSaleCashMovement = (sale: Sale) => {
    if (sale.netAmount === 0) return;
    const accountType: 'CAJA' | 'MERCADO_PAGO' = sale.paymentMethod === 'EFECTIVO' ? 'CAJA' : 'MERCADO_PAGO';
    pushCashMovement({
      accountType,
      date: sale.date,
      direction: 'INGRESO',
      concept: `Venta ${sale.channel} (${sale.shift})`,
      amount: sale.netAmount,
      sourceModule: 'VENTA',
      sourceId: sale.id
    });
  };

  const addSale = (saleData: Omit<Sale, 'id' | 'netAmount'>) => {
    const netAmount = saleData.grossAmount - saleData.commissionAmount;
    let saleToRegister: Sale | undefined;

    setSales(prev => {
      // Si es una importación desde Fudo, actualizar el registro existente si coincide fecha y turno
      const isFudoImport = saleData.notes?.includes('Fudo POS');
      if (isFudoImport) {
        const existingIdx = prev.findIndex(
          s => s.date === saleData.date && s.shift === saleData.shift && s.paymentMethod === saleData.paymentMethod && s.notes?.includes('Fudo POS')
        );
        if (existingIdx >= 0) {
          const existingId = prev[existingIdx].id;
          removeCashMovementsBySource('VENTA', existingId);
          saleToRegister = { ...saleData, id: existingId, netAmount };
          const updated = [...prev];
          updated[existingIdx] = saleToRegister;
          try { localStorage.setItem('gastro_sales', JSON.stringify(updated)); } catch (e) {}
          return updated;
        }
      }

      saleToRegister = { ...saleData, id: `s_${Date.now()}`, netAmount };
      const updated = [saleToRegister, ...prev];
      try { localStorage.setItem('gastro_sales', JSON.stringify(updated)); } catch (e) {}
      return updated;
    });

    if (saleToRegister) {
      registerSaleCashMovement(saleToRegister);
    }
  };

  const deleteSale = (id: string) => {
    setSales(prev => {
      const updated = prev.filter(s => s.id !== id);
      try { localStorage.setItem('gastro_sales', JSON.stringify(updated)); } catch (e) {}
      return updated;
    });
    removeCashMovementsBySource('VENTA', id);
  };

  const editSale = (id: string, saleData: Partial<Sale>) => {
    let updatedSale: Sale | undefined;
    setSales(prev => {
      const updated = prev.map(s => {
        if (s.id === id) {
          const grossAmount = saleData.grossAmount ?? s.grossAmount;
          const commissionAmount = saleData.commissionAmount ?? s.commissionAmount;
          const netAmount = grossAmount - commissionAmount;
          updatedSale = {
            ...s,
            ...saleData,
            netAmount,
            lastModifiedBy: role,
            lastModifiedAt: new Date().toISOString()
          };
          return updatedSale;
        }
        return s;
      });
      try { localStorage.setItem('gastro_sales', JSON.stringify(updated)); } catch (e) {}
      return updated;
    });
    // Re-generar el movimiento de caja/MP con los datos actualizados de la venta
    removeCashMovementsBySource('VENTA', id);
    if (updatedSale) registerSaleCashMovement(updatedSale);
  };

  const addSupplier = (supplierData: Omit<Supplier, 'id' | 'balanceDue'>) => {
    const initBalance = supplierData.initialBalanceDue || 0;
    const newSup: Supplier = {
      ...supplierData,
      id: `sup_${Date.now()}`,
      initialBalanceDue: initBalance,
      balanceDue: initBalance
    };
    setSuppliers(prev => {
      const updated = [...prev, newSup];
      try { localStorage.setItem('gastro_suppliers', JSON.stringify(updated)); } catch (e) {}
      return updated;
    });
  };

  const editSupplier = (id: string, supplierData: Partial<Supplier>) => {
    setSuppliers(prev => {
      const updated = prev.map(s => {
        if (s.id === id) {
          const initDue = supplierData.initialBalanceDue ?? s.initialBalanceDue ?? 0;
          const totalInvoices = purchases.filter(p => p.supplierId === id).reduce((acc, p) => acc + p.amount, 0);
          const totalPayments = supplierPayments.filter(sp => sp.supplierId === id).reduce((acc, sp) => acc + sp.amount, 0);
          const balanceDue = initDue + totalInvoices - totalPayments;
          return {
            ...s,
            ...supplierData,
            initialBalanceDue: initDue,
            balanceDue,
            lastModifiedBy: role,
            lastModifiedAt: new Date().toISOString()
          };
        }
        return s;
      });
      try { localStorage.setItem('gastro_suppliers', JSON.stringify(updated)); } catch (e) {}
      return updated;
    });
  };

  const addPurchase = (purchaseData: Omit<PurchaseInvoice, 'id'>) => {
    const newPurchase: PurchaseInvoice = { ...purchaseData, id: `p_${Date.now()}`, paidAmount: 0, status: 'PENDIENTE' };
    setPurchases(prev => {
      const updated = [newPurchase, ...prev];
      try { localStorage.setItem('gastro_purchases', JSON.stringify(updated)); } catch (e) {}
      return updated;
    });

    // Aumentar saldo adeudado del proveedor
    setSuppliers(prev => {
      const updated = prev.map(s => s.id === purchaseData.supplierId ? { ...s, balanceDue: s.balanceDue + purchaseData.amount } : s);
      try { localStorage.setItem('gastro_suppliers', JSON.stringify(updated)); } catch (e) {}
      return updated;
    });
  };

  const editPurchase = (id: string, purchaseData: Partial<PurchaseInvoice>) => {
    const existing = purchases.find(p => p.id === id);
    const amountChanged = purchaseData.amount !== undefined && existing && purchaseData.amount !== existing.amount;

    setPurchases(prev => {
      const updated = prev.map(p => {
        if (p.id === id) {
          return {
            ...p,
            ...purchaseData,
            lastModifiedBy: role,
            lastModifiedAt: new Date().toISOString()
          };
        }
        return p;
      });
      try { localStorage.setItem('gastro_purchases', JSON.stringify(updated)); } catch (err) {}
      return updated;
    });

    // Antes, corregir el monto de una factura no tocaba la deuda del proveedor.
    // Recalculamos balanceDue desde cero (saldo inicial + facturas - pagos), igual
    // que ya hace editSupplier, para que quede consistente con el nuevo monto.
    if (amountChanged && existing) {
      const supplierId = existing.supplierId;
      setSuppliers(prevSuppliers => {
        const updated = prevSuppliers.map(s => {
          if (s.id !== supplierId) return s;
          const totalInvoices = purchases
            .map(p => (p.id === id ? { ...p, ...purchaseData } : p))
            .filter(p => p.supplierId === supplierId)
            .reduce((acc, p) => acc + p.amount, 0);
          const totalPayments = supplierPayments.filter(sp => sp.supplierId === supplierId).reduce((acc, sp) => acc + sp.amount, 0);
          const initDue = s.initialBalanceDue ?? 0;
          return { ...s, balanceDue: initDue + totalInvoices - totalPayments };
        });
        try { localStorage.setItem('gastro_suppliers', JSON.stringify(updated)); } catch (e) {}
        return updated;
      });
    }
  };

  const addSupplierPayment = (paymentData: Omit<SupplierPayment, 'id'>) => {
    const newPayment: SupplierPayment = { ...paymentData, id: `pay_${Date.now()}` };
    setSupplierPayments(prev => {
      const updated = [newPayment, ...prev];
      try { localStorage.setItem('gastro_supplier_payments', JSON.stringify(updated)); } catch (e) {}
      return updated;
    });

    // 1. Descontar saldo adeudado del proveedor
    setSuppliers(prev => {
      const updated = prev.map(s => {
        if (s.id === paymentData.supplierId) {
          const newBalance = Math.max(0, s.balanceDue - paymentData.amount);
          return { ...s, balanceDue: newBalance };
        }
        return s;
      });
      try { localStorage.setItem('gastro_suppliers', JSON.stringify(updated)); } catch (e) {}
      return updated;
    });

    // 2. Si se especificó una factura, actualizar su monto pagado y estado
    if (paymentData.invoiceId) {
      setPurchases(prev => {
        const updated = prev.map(inv => {
          if (inv.id === paymentData.invoiceId) {
            const currentPaid = inv.paidAmount || 0;
            const newPaid = currentPaid + paymentData.amount;
            let newStatus: PurchaseInvoice['status'] = 'PARCIAL';
            if (newPaid >= inv.amount) {
              newStatus = 'PAGADO';
            }
            return { ...inv, paidAmount: newPaid, status: newStatus };
          }
          return inv;
        });
        try { localStorage.setItem('gastro_purchases', JSON.stringify(updated)); } catch (e) {}
        return updated;
      });
    }

    // 3. Descontar el pago de la cuenta real usada (esto es lo que antes faltaba):
    //    EFECTIVO baja la Caja; TRANSFERENCIA baja el banco indicado en el pago.
    //    CHEQUE_* y BONIFICACION_ACUERDO no mueven caja/banco de forma inmediata
    //    (el cheque descuenta el banco recién cuando se marca "cubierto").
    if (paymentData.paymentMethod === 'EFECTIVO') {
      pushCashMovement({
        accountType: 'CAJA',
        date: paymentData.date,
        direction: 'EGRESO',
        concept: `Pago a proveedor: ${paymentData.supplierName}${paymentData.invoiceNumber ? ` (Fact. ${paymentData.invoiceNumber})` : ''}`,
        amount: paymentData.amount,
        sourceModule: 'PAGO_PROVEEDOR',
        sourceId: newPayment.id
      });
    } else if (paymentData.paymentMethod === 'TRANSFERENCIA') {
      if (paymentData.bank) {
        addBankMovement({
          bankName: paymentData.bank,
          date: paymentData.date,
          type: 'EGRESO',
          concept: `Pago a proveedor: ${paymentData.supplierName}${paymentData.invoiceNumber ? ` (Fact. ${paymentData.invoiceNumber})` : ''}`,
          amount: paymentData.amount,
          referenceNumber: undefined,
          notes: 'Generado automáticamente desde Proveedores'
        });
      } else {
        console.warn(`Pago por transferencia a ${paymentData.supplierName} sin banco especificado: no se descontó de ningún saldo bancario.`);
      }
    }

    // 4. Si el pago se realizó con Cheque (Propio o Tercero), registrarlo/reflejarlo en el módulo Cheques
    if (paymentData.paymentMethod === 'CHEQUE_PROPIO' || paymentData.paymentMethod === 'CHEQUE_TERCERO') {
      const newCheck: Check = {
        id: `c_${Date.now()}`,
        type: paymentData.paymentMethod === 'CHEQUE_PROPIO' ? 'PROPIO' : 'TERCERO',
        number: paymentData.checkNumber || `CHK-${Date.now().toString().slice(-6)}`,
        bank: paymentData.bank || 'Banco Galicia',
        issuerOrRecipient: paymentData.supplierName,
        issueDate: paymentData.date,
        dueDate: paymentData.dueDate || paymentData.date,
        amount: paymentData.amount,
        status: paymentData.paymentMethod === 'CHEQUE_PROPIO' ? 'PENDIENTE' : 'ENDOSADO',
        notes: `Entregado como pago a proveedor ${paymentData.supplierName} (${paymentData.invoiceNumber || 'Pago general'})`
      };
      setChecks(prev => {
        const updated = [newCheck, ...prev];
        try { localStorage.setItem('gastro_checks', JSON.stringify(updated)); } catch (e) {}
        return updated;
      });
    }
  };

  const registerExpenseMovement = (exp: Expense) => {
    if (exp.status !== 'PAGADO') return;
    const kind = classifyPaymentMethod(exp.paymentMethod);
    if (kind === 'CAJA') {
      pushCashMovement({
        accountType: 'CAJA',
        date: exp.date,
        direction: 'EGRESO',
        concept: `Gasto: ${exp.description} (${exp.category})`,
        amount: exp.amount,
        sourceModule: 'GASTO',
        sourceId: exp.id
      });
    } else if (kind === 'MERCADO_PAGO') {
      pushCashMovement({
        accountType: 'MERCADO_PAGO',
        date: exp.date,
        direction: 'EGRESO',
        concept: `Gasto: ${exp.description} (${exp.category})`,
        amount: exp.amount,
        sourceModule: 'GASTO',
        sourceId: exp.id
      });
    } else if (kind === 'BANCO') {
      const bankToUse = exp.bankName || 'Banco Galicia';
      addBankMovement({
        bankName: bankToUse,
        date: exp.date,
        type: 'EGRESO',
        concept: `Gasto: ${exp.description} (${exp.category})`,
        amount: exp.amount,
        notes: 'Generado automáticamente desde Gastos'
      });
    }
  };

  const addExpense = (expenseData: Omit<Expense, 'id'>) => {
    const newExp: Expense = { ...expenseData, id: `e_${Date.now()}` };
    setExpenses(prev => {
      const updated = [newExp, ...prev];
      try { localStorage.setItem('gastro_expenses', JSON.stringify(updated)); } catch (e) {}
      return updated;
    });
    registerExpenseMovement(newExp);
  };

  const editExpense = (id: string, expenseData: Partial<Expense>) => {
    let updatedExp: Expense | undefined;
    setExpenses(prev => {
      const updated = prev.map(e => {
        if (e.id === id) {
          updatedExp = {
            ...e,
            ...expenseData,
            lastModifiedBy: role,
            lastModifiedAt: new Date().toISOString()
          };
          return updatedExp;
        }
        return e;
      });
      try { localStorage.setItem('gastro_expenses', JSON.stringify(updated)); } catch (err) {}
      return updated;
    });
    removeCashMovementsBySource('GASTO', id);
    if (updatedExp) registerExpenseMovement(updatedExp);
  };

  const addCheck = (checkData: Omit<Check, 'id'>) => {
    const newChk: Check = { ...checkData, id: `c_${Date.now()}` };
    setChecks(prev => {
      const updated = [newChk, ...prev];
      try { localStorage.setItem('gastro_checks', JSON.stringify(updated)); } catch (e) {}
      return updated;
    });

    // Verificar si el destinatario/proveedor coincide con un proveedor en la base de datos
    const recipientClean = (checkData.issuerOrRecipient || '').toLowerCase().trim();
    const targetSupplier = suppliers.find(
      s => s.name.toLowerCase().trim() === recipientClean ||
           s.name.toLowerCase().trim().includes(recipientClean) ||
           (recipientClean.length >= 3 && recipientClean.includes(s.name.toLowerCase().trim()))
    );

    if (targetSupplier) {
      // 1. Descontar saldo adeudado del proveedor
      setSuppliers(prev => {
        const updated = prev.map(s => {
          if (s.id === targetSupplier.id) {
            const newBalance = Math.max(0, s.balanceDue - checkData.amount);
            return { ...s, balanceDue: newBalance };
          }
          return s;
        });
        try { localStorage.setItem('gastro_suppliers', JSON.stringify(updated)); } catch (e) {}
        return updated;
      });

      // 2. Imputar a la factura pendiente más antigua si existe
      const oldestPendingInvoice = purchases.find(
        p => p.supplierId === targetSupplier.id && p.status !== 'PAGADO'
      );

      if (oldestPendingInvoice) {
        setPurchases(prev => {
          const updated = prev.map(inv => {
            if (inv.id === oldestPendingInvoice.id) {
              const currentPaid = inv.paidAmount || 0;
              const newPaid = currentPaid + checkData.amount;
              const newStatus: PurchaseInvoice['status'] = newPaid >= inv.amount ? 'PAGADO' : 'PARCIAL';
              return { ...inv, paidAmount: newPaid, status: newStatus };
            }
            return inv;
          });
          try { localStorage.setItem('gastro_purchases', JSON.stringify(updated)); } catch (e) {}
          return updated;
        });
      }

      // 3. Registrar el pago en el historial de pagos a proveedores
      const newPayment: SupplierPayment = {
        id: `pay_${Date.now()}`,
        supplierId: targetSupplier.id,
        supplierName: targetSupplier.name,
        invoiceId: oldestPendingInvoice?.id,
        invoiceNumber: oldestPendingInvoice?.invoiceNumber,
        date: checkData.issueDate || new Date().toISOString().split('T')[0],
        paymentMethod: checkData.type === 'PROPIO' ? 'CHEQUE_PROPIO' : 'CHEQUE_TERCERO',
        amount: checkData.amount,
        checkNumber: checkData.number,
        bank: checkData.bank,
        dueDate: checkData.dueDate,
        notes: `Pago registrado desde la Chequera (Cheque N° ${checkData.number})`
      };

      setSupplierPayments(prev => {
        const updated = [newPayment, ...prev];
        try { localStorage.setItem('gastro_supplier_payments', JSON.stringify(updated)); } catch (e) {}
        return updated;
      });
    }
  };

  const editCheck = (id: string, checkData: Partial<Check>) => {
    setChecks(prev => {
      const updated = prev.map(c => {
        if (c.id === id) {
          return {
            ...c,
            ...checkData,
            lastModifiedBy: role,
            lastModifiedAt: new Date().toISOString()
          };
        }
        return c;
      });
      try { localStorage.setItem('gastro_checks', JSON.stringify(updated)); } catch (err) {}
      return updated;
    });

    // Si se editó el cheque y está asignado a un proveedor, sincronizar el pago al proveedor
    if (checkData.issuerOrRecipient || checkData.amount) {
      const existingCheck = checks.find(c => c.id === id);
      const recipientName = checkData.issuerOrRecipient || existingCheck?.issuerOrRecipient || '';
      const recipientClean = recipientName.toLowerCase().trim();
      const targetSupplier = suppliers.find(
        s => s.name.toLowerCase().trim() === recipientClean ||
             s.name.toLowerCase().trim().includes(recipientClean) ||
             (recipientClean.length >= 3 && recipientClean.includes(s.name.toLowerCase().trim()))
      );

      if (targetSupplier) {
        const checkNumber = checkData.number || existingCheck?.number;
        const existingPayment = supplierPayments.find(sp => sp.checkNumber === checkNumber);
        if (!existingPayment) {
          const newPayment: SupplierPayment = {
            id: `pay_${Date.now()}`,
            supplierId: targetSupplier.id,
            supplierName: targetSupplier.name,
            date: checkData.issueDate || existingCheck?.issueDate || new Date().toISOString().split('T')[0],
            paymentMethod: (checkData.type || existingCheck?.type) === 'PROPIO' ? 'CHEQUE_PROPIO' : 'CHEQUE_TERCERO',
            amount: checkData.amount || existingCheck?.amount || 0,
            checkNumber: checkNumber,
            bank: checkData.bank || existingCheck?.bank,
            dueDate: checkData.dueDate || existingCheck?.dueDate,
            notes: `Pago actualizado desde la Chequera (Cheque N° ${checkNumber})`
          };

          setSupplierPayments(prev => {
            const updated = [newPayment, ...prev];
            try { localStorage.setItem('gastro_supplier_payments', JSON.stringify(updated)); } catch (e) {}
            return updated;
          });
        }
      }
    }
  };

  const toggleCheckCovered = (checkId: string, customBankName?: string) => {
    const targetCheck = checks.find(c => c.id === checkId);
    if (!targetCheck) return;

    const bankToUse = customBankName || targetCheck.bank || 'Banco Galicia';
    const isCurrentlyCovered = targetCheck.status === 'CUBIERTO' || targetCheck.status === 'PAGADO';

    if (isCurrentlyCovered) {
      // DESMARCAR: Cambiar estado a PENDIENTE y eliminar el egreso de banco (reponiendo el saldo)
      setChecks(prev => {
        const updated = prev.map(c => c.id === checkId ? { ...c, status: 'PENDIENTE' as const, lastModifiedBy: role, lastModifiedAt: new Date().toISOString() } : c);
        try { localStorage.setItem('gastro_checks', JSON.stringify(updated)); } catch (e) {}
        return updated;
      });

      setBankMovements(prev => {
        const updated = prev.filter(bm => !(bm.referenceNumber === targetCheck.number && bm.type === 'EGRESO'));
        try { localStorage.setItem('gastro_bank_movements', JSON.stringify(updated)); } catch (e) {}
        return updated;
      });
    } else {
      // MARCAR: Cambiar estado a CUBIERTO y registrar egreso en el banco (descontando del saldo)
      setChecks(prev => {
        const updated = prev.map(c => c.id === checkId ? { ...c, status: 'CUBIERTO' as const, lastModifiedBy: role, lastModifiedAt: new Date().toISOString() } : c);
        try { localStorage.setItem('gastro_checks', JSON.stringify(updated)); } catch (e) {}
        return updated;
      });

      const newBm: BankMovement = {
        id: `bm_${Date.now()}`,
        bankName: bankToUse,
        date: new Date().toISOString().split('T')[0],
        type: 'EGRESO',
        concept: `Débito por Cobertura de Cheque N° ${targetCheck.number} (${targetCheck.issuerOrRecipient})`,
        amount: targetCheck.amount,
        referenceNumber: targetCheck.number,
        notes: `Cheque marcado como cubierto en banco ${bankToUse}`
      };

      setBankMovements(prev => {
        const updated = [newBm, ...prev];
        try { localStorage.setItem('gastro_bank_movements', JSON.stringify(updated)); } catch (e) {}
        return updated;
      });
    }
  };

  const markCheckAsCovered = (checkId: string, customBankName?: string) => {
    toggleCheckCovered(checkId, customBankName);
  };

  const addEmployee = (employeeData: Omit<Employee, 'id'>) => {
    const newEmp: Employee = { ...employeeData, id: `emp_${Date.now()}` };
    setEmployees(prev => {
      const updated = [...prev, newEmp];
      try { localStorage.setItem('gastro_employees', JSON.stringify(updated)); } catch (e) {}
      return updated;
    });
  };

  const addAdvance = (advanceData: Omit<Advance, 'id'>) => {
    const newAdv: Advance = { ...advanceData, id: `adv_${Date.now()}` };
    setAdvances(prev => {
      const updated = [newAdv, ...prev];
      try { localStorage.setItem('gastro_advances', JSON.stringify(updated)); } catch (e) {}
      return updated;
    });

    // 1. Descontar de Caja Chica por defecto (el adelanto es salida de efectivo)
    pushCashMovement({
      accountType: 'CAJA',
      date: advanceData.date,
      direction: 'EGRESO',
      concept: `Adelanto de sueldo a ${advanceData.employeeName}`,
      amount: advanceData.amount,
      sourceModule: 'ADELANTO',
      sourceId: newAdv.id
    });

    // 2. Crear un gasto en el módulo de Gastos para que quede trazable en la categoría ADELANTOS_PERSONAL
    const linkedExpense: Expense = {
      id: `e_adv_${Date.now()}`,
      date: advanceData.date,
      category: 'ADELANTOS_PERSONAL',
      type: 'FIJO',
      description: `Adelanto sueldo: ${advanceData.employeeName}`,
      amount: advanceData.amount,
      paymentMethod: 'EFECTIVO (Caja Chica)',
      dueDate: advanceData.date,
      status: 'PAGADO'
    };
    setExpenses(prev => {
      const updated = [linkedExpense, ...prev];
      try { localStorage.setItem('gastro_expenses', JSON.stringify(updated)); } catch (e) {}
      return updated;
    });
  };

  const addPartner = (partnerData: Omit<Partner, 'id'>) => {
    const newPartner: Partner = { ...partnerData, id: `soc_${Date.now()}` };
    setPartners(prev => {
      const updated = [...prev, newPartner];
      try { localStorage.setItem('gastro_partners', JSON.stringify(updated)); } catch (e) {}
      return updated;
    });
  };

  const editPartner = (id: string, partnerData: Partial<Partner>) => {
    setPartners(prev => {
      const updated = prev.map(p => p.id === id ? { ...p, ...partnerData } : p);
      try { localStorage.setItem('gastro_partners', JSON.stringify(updated)); } catch (e) {}
      return updated;
    });
  };

  // Registra el consumo de un socio que no se cobra en el momento. No genera
  // ningún movimiento de Venta, Caja ni Banco — es plata que nunca circuló.
  // Queda "pendiente" hasta que se liquida en un Retiro de Socios.
  const addPartnerConsumption = (consumptionData: Omit<PartnerConsumption, 'id' | 'settled' | 'settlementId'>) => {
    const newConsumption: PartnerConsumption = { ...consumptionData, id: `pc_${Date.now()}`, settled: false };
    setPartnerConsumptions(prev => {
      const updated = [newConsumption, ...prev];
      try { localStorage.setItem('gastro_partner_consumptions', JSON.stringify(updated)); } catch (e) {}
      return updated;
    });
  };

  // Liquida TODO el consumo pendiente de un socio (y sus socios adherentes vinculados)
  // en un único Retiro por porcentaje: marca esos consumos como saldados (compensación contable, no mueve caja/banco)
  // y, si además se especifican montos en efectivo/banco por socio, sí genera los egresos reales correspondientes.
  const addPartnerWithdrawal = (input: {
    partnerId: string;
    date: string;
    cashAmount?: number;
    cashAccountType?: 'CAJA' | 'MERCADO_PAGO' | 'BANCO';
    bankName?: string;
    cashLines?: PartnerWithdrawalCashLine[];
    notes?: string;
  }) => {
    const mainPartner = partners.find(p => p.id === input.partnerId);
    if (!mainPartner) return;

    // Determinar el grupo completo de socios (titular + adherentes vinculados)
    const effectiveMainId = mainPartner.linkedToPartnerId || mainPartner.id;
    const groupPartners = partners.filter(p => p.id === effectiveMainId || p.linkedToPartnerId === effectiveMainId);
    const groupPartnerIds = groupPartners.map(p => p.id);

    // Consumos pendientes de todo el grupo
    const groupConsumptions = partnerConsumptions.filter(pc => groupPartnerIds.includes(pc.partnerId) && !pc.settled);
    const totalGroupConsumption = groupConsumptions.reduce((acc, pc) => acc + pc.amount, 0);

    // Calcular distribución por % para cada integrante del grupo
    const shares: PartnerWithdrawalShare[] = groupPartners.map(p => {
      const pConsTotal = groupConsumptions.filter(pc => pc.partnerId === p.id).reduce((acc, pc) => acc + pc.amount, 0);
      const sharePct = p.sharePercentage !== undefined ? p.sharePercentage : (groupPartners.length > 1 ? 100 / groupPartners.length : 100);
      const withdrawalShare = totalGroupConsumption * (sharePct / 100);
      return {
        partnerId: p.id,
        partnerName: p.name,
        sharePercentage: sharePct,
        consumptionTotal: pConsTotal,
        withdrawalShare
      };
    });

    const totalCashAmount = input.cashLines && input.cashLines.length > 0
      ? input.cashLines.reduce((acc, cl) => acc + (cl.cashAmount || 0), 0)
      : (input.cashAmount || 0);

    const withdrawalId = `pw_${Date.now()}`;
    const newWithdrawal: PartnerWithdrawal = {
      id: withdrawalId,
      partnerId: mainPartner.id,
      partnerName: mainPartner.name,
      date: input.date,
      periodLabel: input.date.slice(0, 7),
      consumptionAmount: totalGroupConsumption,
      cashAmount: totalCashAmount,
      cashAccountType: input.cashAccountType,
      bankName: input.bankName,
      notes: input.notes,
      shares,
      cashLines: input.cashLines,
      groupPartnerIds
    };

    setPartnerWithdrawals(prev => {
      const updated = [newWithdrawal, ...prev];
      try { localStorage.setItem('gastro_partner_withdrawals', JSON.stringify(updated)); } catch (e) {}
      return updated;
    });

    // Marcar como liquidados todos los consumos pendientes de todo el grupo
    setPartnerConsumptions(prev => {
      const updated = prev.map(pc =>
        (groupPartnerIds.includes(pc.partnerId) && !pc.settled)
          ? { ...pc, settled: true, settlementId: withdrawalId }
          : pc
      );
      try { localStorage.setItem('gastro_partner_consumptions', JSON.stringify(updated)); } catch (e) {}
      return updated;
    });

    // Registrar retiros de dinero real (efectivo/banco)
    if (input.cashLines && input.cashLines.length > 0) {
      input.cashLines.forEach(cl => {
        if (cl.cashAmount > 0) {
          if (cl.cashAccountType === 'CAJA' || cl.cashAccountType === 'MERCADO_PAGO') {
            pushCashMovement({
              accountType: cl.cashAccountType,
              date: input.date,
              direction: 'EGRESO',
              concept: `Retiro de socio: ${cl.partnerName}`,
              amount: cl.cashAmount,
              sourceModule: 'RETIRO_SOCIO',
              sourceId: withdrawalId
            });
          } else if (cl.cashAccountType === 'BANCO' && cl.bankName) {
            addBankMovement({
              bankName: cl.bankName,
              date: input.date,
              type: 'EGRESO',
              concept: `Retiro de socio: ${cl.partnerName}`,
              amount: cl.cashAmount,
              notes: 'Generado automáticamente desde Socios'
            });
          }
        }
      });
    } else if (totalCashAmount > 0) {
      if (input.cashAccountType === 'CAJA' || input.cashAccountType === 'MERCADO_PAGO') {
        pushCashMovement({
          accountType: input.cashAccountType,
          date: input.date,
          direction: 'EGRESO',
          concept: `Retiro de socio: ${mainPartner.name}`,
          amount: totalCashAmount,
          sourceModule: 'RETIRO_SOCIO',
          sourceId: withdrawalId
        });
      } else if (input.cashAccountType === 'BANCO') {
        if (input.bankName) {
          addBankMovement({
            bankName: input.bankName,
            date: input.date,
            type: 'EGRESO',
            concept: `Retiro de socio: ${mainPartner.name}`,
            amount: totalCashAmount,
            notes: 'Generado automáticamente desde Socios'
          });
        }
      }
    }
  };

  const addInitialBalance = (ibData: Omit<InitialBalance, 'id'>) => {
    const newIb: InitialBalance = { ...ibData, id: `ib_${Date.now()}` };
    setInitialBalances(prev => {
      const updated = [newIb, ...prev];
      try { localStorage.setItem('gastro_initial_balances', JSON.stringify(updated)); } catch (e) {}
      return updated;
    });
  };

  const editInitialBalance = (id: string, ibData: Partial<InitialBalance>) => {
    setInitialBalances(prev => {
      const updated = prev.map(ib => {
        if (ib.id === id) {
          return {
            ...ib,
            ...ibData,
            lastModifiedBy: role,
            lastModifiedAt: new Date().toISOString()
          };
        }
        return ib;
      });
      try { localStorage.setItem('gastro_initial_balances', JSON.stringify(updated)); } catch (e) {}
      return updated;
    });
  };

  const deleteInitialBalance = (id: string) => {
    setInitialBalances(prev => {
      const updated = prev.filter(ib => ib.id !== id);
      try { localStorage.setItem('gastro_initial_balances', JSON.stringify(updated)); } catch (e) {}
      return updated;
    });
  };

  const addBankMovement = (bmData: Omit<BankMovement, 'id'>) => {
    const newBm: BankMovement = { ...bmData, id: `bm_${Date.now()}` };
    setBankMovements(prev => {
      const updated = [newBm, ...prev];
      try { localStorage.setItem('gastro_bank_movements', JSON.stringify(updated)); } catch (e) {}
      return updated;
    });
  };

  const editBankMovement = (id: string, bmData: Partial<BankMovement>) => {
    setBankMovements(prev => {
      const updated = prev.map(bm => {
        if (bm.id === id) {
          return {
            ...bm,
            ...bmData,
            lastModifiedBy: role,
            lastModifiedAt: new Date().toISOString()
          };
        }
        return bm;
      });
      try { localStorage.setItem('gastro_bank_movements', JSON.stringify(updated)); } catch (e) {}
      return updated;
    });
  };

  const deleteBankMovement = (id: string) => {
    setBankMovements(prev => {
      const updated = prev.filter(bm => bm.id !== id);
      try { localStorage.setItem('gastro_bank_movements', JSON.stringify(updated)); } catch (e) {}
      return updated;
    });
  };

  // KPIs del MES EN CURSO (filtrados por AAA-MM para no acumular histórico)
  const currentKey = currentMonthKey();
  const salesThisMonth = sales.filter(s => s.date.startsWith(currentKey));
  const purchasesThisMonth = purchases.filter(p => p.date.startsWith(currentKey));
  const expensesThisMonth = expenses.filter(e => e.date.startsWith(currentKey));

  const totalSalesNetMonth = salesThisMonth.reduce((acc, s) => acc + s.netAmount, 0);
  const totalSalesGrossMonth = salesThisMonth.reduce((acc, s) => acc + (s.grossAmount || s.netAmount), 0);
  const totalPurchasesMonth = purchasesThisMonth.reduce((acc, p) => acc + p.amount, 0);
  const totalLaborMonth = employees.filter(e => e.active).reduce((acc, e) => acc + e.baseSalary, 0);
  const totalFixedExpensesMonth = expensesThisMonth
    .filter(e => e.type === 'FIJO' || e.type === 'SERVICIO')
    .reduce((acc, e) => acc + e.amount, 0);

  const totalOperatingExpensesMonth = expensesThisMonth
    .filter(e => classifyExpenseGroup(e.category, e.expenseGroup) === 'FUNCIONAMIENTO')
    .reduce((acc, e) => acc + e.amount, 0);

  const totalTaxExpensesMonth = expensesThisMonth
    .filter(e => classifyExpenseGroup(e.category, e.expenseGroup) === 'IMPUESTOS')
    .reduce((acc, e) => acc + e.amount, 0);

  const grossBaseSales = totalSalesGrossMonth > 0 ? totalSalesGrossMonth : totalSalesNetMonth;

  const laborGrossPercentage = grossBaseSales > 0 ? (totalLaborMonth / grossBaseSales) * 100 : 0;
  const purchasesGrossPercentage = grossBaseSales > 0 ? (totalPurchasesMonth / grossBaseSales) * 100 : 0;
  const operatingExpensesPercentage = grossBaseSales > 0 ? (totalOperatingExpensesMonth / grossBaseSales) * 100 : 0;
  const taxExpensesPercentage = grossBaseSales > 0 ? (totalTaxExpensesMonth / grossBaseSales) * 100 : 0;

  const totalCoversMonth = salesThisMonth.reduce((acc, s) => acc + (s.covers || 0), 0);
  const averageTicketPerCover = totalCoversMonth > 0 ? totalSalesNetMonth / totalCoversMonth : 0;
  const totalSupplierDebt = suppliers.reduce((acc, s) => acc + s.balanceDue, 0);

  const foodCostPercentage = totalSalesNetMonth > 0 ? (totalPurchasesMonth / totalSalesNetMonth) * 100 : 0;
  const laborCostPercentage = totalSalesNetMonth > 0 ? (totalLaborMonth / totalSalesNetMonth) * 100 : 0;
  const primeCostPercentage = foodCostPercentage + laborCostPercentage;

  const netProfitEstMonth = totalSalesNetMonth - (totalPurchasesMonth + totalLaborMonth + totalFixedExpensesMonth);
  const breakEvenTarget = 2800000;

  const pendingChecksAmount7Days = checks
    .filter(c => c.status === 'PENDIENTE')
    .reduce((acc, c) => acc + c.amount, 0);

  const pendingServicesAmount = expenses
    .filter(e => e.status === 'PENDIENTE')
    .reduce((acc, e) => acc + e.amount, 0);

  // UNICA FUENTE DE VERDAD PARA SALDOS (Caja Mayor, MercadoPago y Bancos)
  // Combina Saldo Inicial + Libro Mayor Centralizado (cashMovements / bankMovements)
  const initialCash = initialBalances.filter(ib => ib.accountType === 'CAJA').reduce((acc, ib) => acc + ib.amount, 0);
  const cashNet = cashMovements.filter(cm => cm.accountType === 'CAJA').reduce((acc, cm) => acc + (cm.direction === 'INGRESO' ? cm.amount : -cm.amount), 0);
  const cajaMayorBalance = initialCash + cashNet;

  const initialMP = initialBalances.filter(ib => ib.accountType === 'MERCADO_PAGO').reduce((acc, ib) => acc + ib.amount, 0);
  const mpNet = cashMovements.filter(cm => cm.accountType === 'MERCADO_PAGO').reduce((acc, cm) => acc + (cm.direction === 'INGRESO' ? cm.amount : -cm.amount), 0);
  const mercadoPagoBalance = initialMP + mpNet;

  const initialBancosTotal = initialBalances.filter(ib => ib.accountType === 'BANCO').reduce((acc, ib) => acc + ib.amount, 0);
  const bmIngresos = bankMovements.filter(bm => bm.type === 'INGRESO').reduce((acc, bm) => acc + bm.amount, 0);
  const bmEgresos = bankMovements.filter(bm => bm.type === 'EGRESO').reduce((acc, bm) => acc + bm.amount, 0);
  const bancosBalance = initialBancosTotal + bmIngresos - bmEgresos;

  // Mapa de saldos por entidad bancaria especifica (ej. "Banco Galicia", "Banco Nación", "Macro")
  const bancosPorEntidad: Record<string, number> = {};
  initialBalances.filter(ib => ib.accountType === 'BANCO').forEach(ib => {
    const key = ib.bankName || 'Banco Galicia';
    bancosPorEntidad[key] = (bancosPorEntidad[key] || 0) + ib.amount;
  });
  bankMovements.forEach(bm => {
    const key = bm.bankName || 'Banco Galicia';
    const delta = bm.type === 'INGRESO' ? bm.amount : -bm.amount;
    bancosPorEntidad[key] = (bancosPorEntidad[key] || 0) + delta;
  });

  const sendChatMessage = async (text: string) => {
    const userMsg: ChatMessage = {
      id: `u_${Date.now()}`,
      sender: 'user',
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    setChatMessages(prev => [...prev, userMsg]);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: text,
          contextData: {
            cajaMayorBalance,
            mercadoPagoBalance,
            bancosBalance,
            totalSalesNetMonth,
            totalPurchasesMonth,
            totalLaborMonth,
            totalFixedExpensesMonth,
            primeCostPercentage,
            foodCostPercentage,
            laborCostPercentage,
            netProfitEstMonth,
            pendingChecksAmount7Days,
            pendingServicesAmount,
            totalCoversMonth,
            averageTicketPerCover,
            totalSupplierDebt,
            suppliers,
            purchases,
            supplierPayments,
            expenses,
            checks,
            employees,
            bankMovements,
            initialBalances,
            sales
          }
        })
      });

      const data = await res.json();
      const botMsg: ChatMessage = {
        id: `b_${Date.now()}`,
        sender: 'assistant',
        text: data.reply || 'No pude obtener una respuesta en este momento.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        dataSnippet: data.snippet
      };
      setChatMessages(prev => [...prev, botMsg]);
    } catch (err) {
      console.error(err);
      const fallbackMsg: ChatMessage = {
        id: `b_${Date.now()}`,
        sender: 'assistant',
        text: `📊 **Resumen Financiero Automatizado**:\n\n- 💵 **Efectivo Disponible**: $${cajaMayorBalance.toLocaleString('es-AR')}\n- 💳 **MercadoPago Disponible**: $${mercadoPagoBalance.toLocaleString('es-AR')}\n- 🏦 **Bancos Disponible**: $${bancosBalance.toLocaleString('es-AR')}\n- **Facturación Neta Total**: $${totalSalesNetMonth.toLocaleString('es-AR')}\n- **Deuda Total con Proveedores**: $${totalSupplierDebt.toLocaleString('es-AR')}`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setChatMessages(prev => [...prev, fallbackMsg]);
    }
  };

  const authenticateApp = async (pin: string) => {
    try {
      const res = await fetch('/api/auth/verify-pin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin, targetRole: 'app' })
      });
      const data = await res.json();
      if (data.success) {
        setIsAppAuthenticated(true);
        localStorage.setItem('gastro_app_authed', 'true');
        return { success: true };
      }
      return { success: false, message: data.message };
    } catch (e) {
      return { success: false, message: 'Error de conexión.' };
    }
  };

  const authenticateEmployees = async (pin: string) => {
    try {
      const res = await fetch('/api/auth/verify-pin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin, targetRole: 'employees' })
      });
      const data = await res.json();
      if (data.success) {
        setIsEmployeesUnlocked(true);
        localStorage.setItem('gastro_employees_unlocked', 'true');
        return { success: true };
      }
      return { success: false, message: data.message };
    } catch (e) {
      return { success: false, message: 'Error de conexión.' };
    }
  };

  const authenticateAdmin = async (pin: string) => {
    return authenticateEmployees(pin);
  };

  const lockEmployees = () => {
    setIsEmployeesUnlocked(false);
    document.cookie = 'employees_unlocked=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
    localStorage.removeItem('gastro_employees_unlocked');
  };

  const logoutApp = () => {
    setIsAppAuthenticated(false);
    setIsEmployeesUnlocked(false);
    document.cookie = 'app_authenticated=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
    document.cookie = 'employees_unlocked=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
    document.cookie = 'login_role=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
    localStorage.removeItem('gastro_app_authed');
    localStorage.removeItem('gastro_employees_unlocked');
  };

  const saveMonthlyBudget = (budget: MonthlyBudget) => {
    setBudgets(prev => {
      const existingIndex = prev.findIndex(b => b.monthKey === budget.monthKey);
      let updated: MonthlyBudget[];
      if (existingIndex >= 0) {
        updated = [...prev];
        updated[existingIndex] = { ...budget, lastModifiedBy: role, lastModifiedAt: new Date().toISOString() };
      } else {
        updated = [{ ...budget, lastModifiedBy: role, lastModifiedAt: new Date().toISOString() }, ...prev];
      }
      try { localStorage.setItem('gastro_budgets', JSON.stringify(updated)); } catch (e) {}
      return updated;
    });
  };

  const getBudgetForMonth = (monthKey: string) => {
    return budgets.find(b => b.monthKey === monthKey);
  };

  const copyPreviousMonthBudget = (currentMonthKey: string) => {
    const [yearStr, monthStr] = currentMonthKey.split('-');
    const year = parseInt(yearStr, 10);
    const month = parseInt(monthStr, 10);
    const prevDate = new Date(year, month - 2, 1);
    const prevMonthKey = prevDate.toISOString().slice(0, 7);

    const prevBudget = budgets.find(b => b.monthKey === prevMonthKey);
    if (!prevBudget) return;

    const newBudget: MonthlyBudget = {
      ...prevBudget,
      monthKey: currentMonthKey,
      lastModifiedBy: role,
      lastModifiedAt: new Date().toISOString()
    };
    saveMonthlyBudget(newBudget);
  };

  return (
    <GastronomyContext.Provider
      value={{
        role,
        setRole,
        loginRole,
        isAppAuthenticated,
        isEmployeesUnlocked,
        authenticateApp,
        authenticateEmployees,
        authenticateAdmin,
        lockEmployees,
        logoutApp,
        sales,
        addSale,
        editSale,
        deleteSale,
        suppliers,
        addSupplier,
        editSupplier,
        purchases,
        addPurchase,
        editPurchase,
        supplierPayments,
        addSupplierPayment,
        expenses,
        addExpense,
        editExpense,
        checks,
        addCheck,
        editCheck,
        markCheckAsCovered,
        toggleCheckCovered,
        employees,
        addEmployee,
        advances,
        addAdvance,
        dishes,
        chatMessages,
        sendChatMessage,
        partners,
        addPartner,
        editPartner,
        partnerConsumptions,
        addPartnerConsumption,
        partnerWithdrawals,
        addPartnerWithdrawal,
        initialBalances,
        addInitialBalance,
        editInitialBalance,
        deleteInitialBalance,
        bankMovements,
        addBankMovement,
        editBankMovement,
        deleteBankMovement,
        cashMovements,
        cajaMayorBalance,
        mercadoPagoBalance,
        bancosBalance,
        bancosPorEntidad,
        totalSalesNetMonth,
        totalPurchasesMonth,
        totalLaborMonth,
        primeCostPercentage,
        foodCostPercentage,
        laborCostPercentage,
        totalFixedExpensesMonth,
        netProfitEstMonth,
        breakEvenTarget,
        pendingChecksAmount7Days,
        pendingServicesAmount,
        totalCoversMonth,
        averageTicketPerCover,
        totalSupplierDebt,
        totalSalesGrossMonth,
        totalOperatingExpensesMonth,
        totalTaxExpensesMonth,
        laborGrossPercentage,
        purchasesGrossPercentage,
        operatingExpensesPercentage,
        taxExpensesPercentage,
        budgets,
        saveMonthlyBudget,
        getBudgetForMonth,
        copyPreviousMonthBudget
      }}
    >
      {children}
    </GastronomyContext.Provider>
  );
};

export const useGastronomy = () => {
  const context = useContext(GastronomyContext);
  if (!context) throw new Error('useGastronomy debe usarse dentro de GastronomyProvider');
  return context;
};
