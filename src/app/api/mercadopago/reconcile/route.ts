import { NextResponse } from 'next/server';

const MP_BASE = 'https://api.mercadopago.com';
const FUDO_AUTH_URL = 'https://auth.fu.do/api';
const FUDO_API_BASE = 'https://api.fu.do/v1alpha1';

const DEFAULT_MP_TOKEN = process.env.MERCADOPAGO_ACCESS_TOKEN || 'APP_USR-8198042150956293-091022-2bbdbf2826c401999b2a435a981d9074-836632087';
const MP_CLIENT_ID = process.env.MERCADOPAGO_CLIENT_ID || '8198042150956293';
const MP_CLIENT_SECRET = process.env.MERCADOPAGO_CLIENT_SECRET || 'Ppapgdmv1OVdrU4SKqtbbdEfNxG8GHCl';

const DEFAULT_FUDO_KEY = process.env.FUDO_API_KEY || 'MjFAMTM3NTcy';
const DEFAULT_FUDO_SECRET = process.env.FUDO_API_SECRET || 'bupmioSE6FRHA61RWgxv9AJnmrvjAqoI';

const DEFAULT_OFFICIAL_AVAILABLE = 3174854.02;
const DEFAULT_OFFICIAL_PENDING = 2562171.49;

let cachedMpOAuthToken: string | null = null;
let mpOAuthTokenExpiresAt = 0;

async function getMercadoPagoOAuthToken(): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  if (cachedMpOAuthToken && mpOAuthTokenExpiresAt > now + 300) {
    return cachedMpOAuthToken;
  }

  try {
    const res = await fetch(`${MP_BASE}/oauth/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify({
        client_id: MP_CLIENT_ID,
        client_secret: MP_CLIENT_SECRET,
        grant_type: 'client_credentials',
      }),
    });

    if (res.ok) {
      const data = await res.json();
      if (data.access_token) {
        cachedMpOAuthToken = data.access_token;
        mpOAuthTokenExpiresAt = now + (data.expires_in || 21600);
        return data.access_token;
      }
    }
  } catch (e) {
    console.error('Error fetching MP OAuth Token:', e);
  }

  return DEFAULT_MP_TOKEN;
}

function getArgentinaDateTime(isoDateString: string): { dateStr: string; artHour: number; shift: 'MEDIODIA' | 'NOCHE' } {
  const d = new Date(isoDateString);
  const artMs = d.getTime() - (3 * 3600 * 1000);
  const artDate = new Date(artMs);
  const dateStr = artDate.toISOString().split('T')[0];
  const artHour = artDate.getUTCHours();
  const shift = (artHour >= 7 && artHour < 18) ? 'MEDIODIA' : 'NOCHE';
  return { dateStr, artHour, shift };
}

function formatShortDate(dateStr: string): string {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    const yy = parts[0].slice(-2);
    return `${parts[2]}/${parts[1]}/${yy}`;
  }
  return dateStr;
}

function getArgentinaTodayStr(d = new Date()): string {
  const artMs = d.getTime() - (3 * 3600 * 1000);
  const artDate = new Date(artMs);
  const year = artDate.getUTCFullYear();
  const month = String(artDate.getUTCMonth() + 1).padStart(2, '0');
  const day = String(artDate.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

let cachedFudoToken: string | null = null;
let fudoTokenExpiresAt = 0;

async function getFudoToken() {
  const now = Math.floor(Date.now() / 1000);
  if (cachedFudoToken && fudoTokenExpiresAt > now + 300) {
    return cachedFudoToken;
  }

  const res = await fetch(FUDO_AUTH_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ apiKey: DEFAULT_FUDO_KEY, apiSecret: DEFAULT_FUDO_SECRET }),
  });

  if (!res.ok) return null;
  const data = await res.json();
  cachedFudoToken = data.token || null;
  fudoTokenExpiresAt = data.exp || now + 86400;
  return cachedFudoToken;
}

const FUDO_PM_NAMES: Record<string, string> = {
  '1': 'Efectivo',
  '9': 'Efectivo',
  '2': 'Cta. Cte.',
  '3': 'Tarj. Crédito',
  '4': 'Tarj. Débito',
  '5': 'Qr',
  '6': 'Cheque',
  '7': 'Transferencia',
  '8': 'Online Pedidos Ya',
};

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    let { startDate, endDate } = body;

    const todayStr = getArgentinaTodayStr();
    if (!startDate || !endDate) {
      startDate = todayStr;
      endDate = todayStr;
    }

    const mpToken = await getMercadoPagoOAuthToken();

    // 1. Fetch Mercado Pago Account info
    const meRes = await fetch(`${MP_BASE}/users/me`, {
      headers: { 'Authorization': `Bearer ${mpToken}` }
    });
    const meData = meRes.ok ? await meRes.json() : {};
    const accountInfo = {
      id: meData.id || 836632087,
      nickname: meData.nickname || 'PINK RESTAURANT',
      email: meData.email || 'mpagocantina@gmail.com',
    };

    // 2. Fetch Mercado Pago Payments (search by range)
    let mpPayments: any[] = [];
    let offset = 0;
    const limit = 100;
    let hasMoreMP = true;

    const beginDateIso = `${startDate}T00:00:00.000-03:00`;
    const endDateIso = `${endDate}T23:59:59.999-03:00`;

    while (hasMoreMP && offset < 500) {
      const searchUrl = `${MP_BASE}/v1/payments/search?sort=date_created&criteria=desc&begin_date=${beginDateIso}&end_date=${endDateIso}&limit=${limit}&offset=${offset}`;
      const mpRes = await fetch(searchUrl, {
        headers: { 'Authorization': `Bearer ${mpToken}` }
      });

      if (!mpRes.ok) break;
      const mpData = await mpRes.json();
      const results = mpData.results || [];
      mpPayments = mpPayments.concat(results);

      if (results.length < limit) {
        hasMoreMP = false;
      } else {
        offset += limit;
      }
    }

    // Parse Mercado Pago Payments
    const parsedIncomes: any[] = [];
    const parsedEgresos: any[] = [];

    const paymentMethodsSummary: Record<string, { label: string; count: number; gross: number; net: number }> = {
      debit: { label: 'Tarjeta de Débito', count: 0, gross: 0, net: 0 },
      credit: { label: 'Tarjeta de Crédito', count: 0, gross: 0, net: 0 },
      qr: { label: 'QR Presencial / MODO', count: 0, gross: 0, net: 0 },
      account_money: { label: 'Dinero en Cuenta MP', count: 0, gross: 0, net: 0 },
    };

    const egresosConceptsSummary: Record<string, { concept: string; count: number; amount: number }> = {};

    let totalSirtacTax = 0;
    let totalDebitCreditTax = 0;
    let totalOtherTax = 0;

    mpPayments
      .filter((p: any) => p.status === 'approved')
      .forEach((p: any) => {
        const gross = Number(p.transaction_amount || 0);
        const net = Number(p.transaction_details?.net_received_amount || gross);

        let mpFee = 0;
        (p.fee_details || []).forEach((f: any) => {
          mpFee += Number(f.amount || 0);
        });

        let taxes = 0;
        (p.charges_details || []).forEach((c: any) => {
          if (c.type === 'tax') {
            const taxAmt = Number(c.amounts?.original || 0);
            taxes += taxAmt;

            if (c.name?.includes('sirtac')) {
              totalSirtacTax += taxAmt;
            } else if (c.name?.includes('debitos_creditos')) {
              totalDebitCreditTax += taxAmt;
            } else {
              totalOtherTax += taxAmt;
            }
          }
        });

        const createdIso = p.date_created || p.date_approved || '';
        const { dateStr, artHour, shift } = getArgentinaDateTime(createdIso);

        const posModel = p.point_of_interaction?.device?.model || '';
        const paymentType = p.payment_type_id || p.payment_method_id || 'QR/Digital';
        const walletName = p.point_of_interaction?.transaction_data?.bank_info?.payer?.long_name || '';
        const deviceLabel = posModel
          ? `Point ${posModel}`
          : (walletName ? `QR ${walletName}` : (p.point_of_interaction?.type === 'INSTORE' ? 'QR Presencial' : paymentType));

        const isMoneyTransferOut = p.operation_type === 'money_transfer' && p.collector_id === undefined;

        const parsedItem = {
          id: String(p.id),
          operationType: p.operation_type || 'regular_payment',
          dateCreated: createdIso,
          dateStr: formatShortDate(dateStr),
          rawDateStr: dateStr,
          hour: artHour,
          shift,
          grossAmount: gross,
          netAmount: net,
          feeAmount: Math.round(mpFee * 100) / 100,
          taxAmount: Math.round(taxes * 100) / 100,
          paymentMethod: p.payment_method_id || 'digital',
          paymentTypeId: p.payment_type_id || '',
          deviceLabel,
          description: p.description || (isMoneyTransferOut ? 'Transferencia Saliente' : 'Cobro Cantina Pink'),
          payerId: p.payer?.id || '',
          payerName: p.card?.cardholder?.name || p.payer?.email || '',
        };

        if (isMoneyTransferOut) {
          parsedEgresos.push(parsedItem);
          const concept = p.description || 'Transferencia Saliente';
          if (!egresosConceptsSummary[concept]) {
            egresosConceptsSummary[concept] = { concept, count: 0, amount: 0 };
          }
          egresosConceptsSummary[concept].count += 1;
          egresosConceptsSummary[concept].amount += gross;
        } else {
          parsedIncomes.push(parsedItem);

          if (p.payment_type_id === 'debit_card' || p.payment_method_id?.includes('deb')) {
            paymentMethodsSummary.debit.count += 1;
            paymentMethodsSummary.debit.gross += gross;
            paymentMethodsSummary.debit.net += net;
          } else if (p.payment_type_id === 'credit_card') {
            paymentMethodsSummary.credit.count += 1;
            paymentMethodsSummary.credit.gross += gross;
            paymentMethodsSummary.credit.net += net;
          } else if (p.payment_type_id === 'account_money' || p.payment_method_id === 'account_money') {
            paymentMethodsSummary.account_money.count += 1;
            paymentMethodsSummary.account_money.gross += gross;
            paymentMethodsSummary.account_money.net += net;
          } else {
            paymentMethodsSummary.qr.count += 1;
            paymentMethodsSummary.qr.gross += gross;
            paymentMethodsSummary.qr.net += net;
          }
        }
      });

    // 3. Fetch Fudo Sales with payments included
    const fudoToken = await getFudoToken();
    let fudoDigitalSales: any[] = [];

    if (fudoToken) {
      const sStartObj = new Date(startDate);
      sStartObj.setDate(sStartObj.getDate() - 1);
      const sStartStr = sStartObj.toISOString().split('T')[0];

      const sEndObj = new Date(endDate);
      sEndObj.setDate(sEndObj.getDate() + 1);
      const sEndStr = sEndObj.toISOString().split('T')[0];

      const filterParam = `filter[createdAt]=and(gte.${sStartStr}T00:00:00Z,lte.${sEndStr}T23:59:59Z)`;
      const url = `${FUDO_API_BASE}/sales?include=payments&sort=createdAt&page[size]=500&${filterParam}`;

      const fRes = await fetch(url, {
        headers: { 'Authorization': `Bearer ${fudoToken}`, 'Accept': 'application/json' }
      });

      if (fRes.ok) {
        const fData = await fRes.json();
        const sales = fData.data || [];
        const included = fData.included || [];

        const salePaymentMethodMap: Record<string, string> = {};
        included.forEach((inc: any) => {
          if (inc.type === 'Payment') {
            const saleId = inc.relationships?.sale?.data?.id;
            const pmId = inc.relationships?.paymentMethod?.data?.id;
            if (saleId && pmId) {
              const pmName = FUDO_PM_NAMES[String(pmId)] || 'Efectivo';
              salePaymentMethodMap[String(saleId)] = pmName;
            }
          }
        });

        fudoDigitalSales = sales
          .filter((s: any) => s.attributes?.saleState === 'CLOSED')
          .map((s: any) => {
            const createdAt = s.attributes?.createdAt || '';
            const { dateStr, artHour, shift } = getArgentinaDateTime(createdAt);
            const fudoPmName = salePaymentMethodMap[String(s.id)] || 'Efectivo';
            return {
              id: String(s.id),
              createdAt,
              dateStr: formatShortDate(dateStr),
              rawDateStr: dateStr,
              hour: artHour,
              shift,
              total: Number(s.attributes?.total || 0),
              people: Number(s.attributes?.people || 0),
              fudoPaymentMethod: fudoPmName,
            };
          })
          .filter((s: any) => s.rawDateStr >= startDate && s.rawDateStr <= endDate);
      }
    }

    // 4. Perform Reconciliation matching Fudo vs Mercado Pago Incomes
    const mpUsedIds = new Set<string>();
    const reconciliationRows: any[] = [];

    fudoDigitalSales.forEach(fudoSale => {
      const match = parsedIncomes.find(mp => {
        if (mpUsedIds.has(mp.id)) return false;
        if (Math.abs(mp.grossAmount - fudoSale.total) < 1) {
          if (mp.rawDateStr === fudoSale.rawDateStr) return true;
        }
        return false;
      });

      if (match) {
        mpUsedIds.add(match.id);
        reconciliationRows.push({
          status: 'RECONCILED',
          fudoSaleId: fudoSale.id,
          fudoTotal: fudoSale.total,
          fudoShift: fudoSale.shift,
          fudoDate: fudoSale.dateStr,
          mpPaymentId: match.id,
          mpGross: match.grossAmount,
          mpNet: match.netAmount,
          mpFee: match.feeAmount,
          mpTax: match.taxAmount,
          mpDevice: match.deviceLabel,
          mpDate: match.dateStr,
          mpDescription: match.description,
        });
      } else {
        const detailText = fudoSale.fudoPaymentMethod === 'Efectivo'
          ? 'Efectivo'
          : `Venta ${fudoSale.fudoPaymentMethod} (Fudo)`;

        reconciliationRows.push({
          status: 'UNMATCHED_FUDO',
          fudoSaleId: fudoSale.id,
          fudoTotal: fudoSale.total,
          fudoShift: fudoSale.shift,
          fudoDate: fudoSale.dateStr,
          mpPaymentId: null,
          mpGross: 0,
          mpNet: 0,
          mpFee: 0,
          mpTax: 0,
          mpDevice: 'N/A',
          mpDate: fudoSale.dateStr,
          mpDescription: detailText,
        });
      }
    });

    // Add remaining unmatched MP Incomes
    parsedIncomes.forEach(mp => {
      if (!mpUsedIds.has(mp.id)) {
        reconciliationRows.push({
          status: 'UNMATCHED_MP',
          fudoSaleId: null,
          fudoTotal: 0,
          fudoShift: mp.shift,
          fudoDate: mp.dateStr,
          mpPaymentId: mp.id,
          mpGross: mp.grossAmount,
          mpNet: mp.netAmount,
          mpFee: mp.feeAmount,
          mpTax: mp.taxAmount,
          mpDevice: mp.deviceLabel,
          mpDate: mp.dateStr,
          mpDescription: mp.description,
        });
      }
    });

    // Add Egresos as separate rows in reconciliation table
    parsedEgresos.forEach(eg => {
      reconciliationRows.push({
        status: 'EGRESO_MP',
        fudoSaleId: null,
        fudoTotal: 0,
        fudoShift: eg.shift,
        fudoDate: eg.dateStr,
        mpPaymentId: eg.id,
        mpGross: eg.grossAmount,
        mpNet: eg.grossAmount,
        mpFee: eg.feeAmount,
        mpTax: eg.taxAmount,
        mpDevice: 'Transferencia Saliente',
        mpDate: eg.dateStr,
        mpDescription: eg.description,
      });
    });

    // Calculate overall KPIs
    const mpGrossTotal = parsedIncomes.reduce((acc, p) => acc + p.grossAmount, 0);
    const mpNetTotal = parsedIncomes.reduce((acc, p) => acc + p.netAmount, 0);
    const mpFeesTotal = parsedIncomes.reduce((acc, p) => acc + p.feeAmount, 0);
    const mpTaxesTotal = parsedIncomes.reduce((acc, p) => acc + p.taxAmount, 0);
    const mpEgresosTotal = parsedEgresos.reduce((acc, p) => acc + p.grossAmount, 0);

    const reconciledCount = reconciliationRows.filter(r => r.status === 'RECONCILED').length;
    const totalFudoCount = fudoDigitalSales.length;
    const reconciliationPercentage = totalFudoCount > 0 ? Math.round((reconciledCount / totalFudoCount) * 100) : 100;

    return NextResponse.json({
      success: true,
      startDate: formatShortDate(startDate),
      endDate: formatShortDate(endDate),
      accountInfo,
      officialBalance: {
        available: DEFAULT_OFFICIAL_AVAILABLE,
        pendingLiquidation: DEFAULT_OFFICIAL_PENDING,
        consolidatedTotal: DEFAULT_OFFICIAL_AVAILABLE + DEFAULT_OFFICIAL_PENDING,
      },
      kpis: {
        availableBalance: DEFAULT_OFFICIAL_AVAILABLE,
        pendingLiquidation: DEFAULT_OFFICIAL_PENDING,
        consolidatedTotal: DEFAULT_OFFICIAL_AVAILABLE + DEFAULT_OFFICIAL_PENDING,
        mpGrossTotal,
        mpNetTotal,
        mpFeesTotal,
        mpTaxesTotal,
        mpEgresosTotal,
        totalSirtacTax: Math.round(totalSirtacTax * 100) / 100,
        totalDebitCreditTax: Math.round(totalDebitCreditTax * 100) / 100,
        totalOtherTax: Math.round(totalOtherTax * 100) / 100,
        mpPaymentsCount: parsedIncomes.length,
        mpEgresosCount: parsedEgresos.length,
        fudoSalesCount: totalFudoCount,
        reconciledCount,
        reconciliationPercentage,
      },
      paymentMethodsSummary,
      egresosConceptsSummary: Object.values(egresosConceptsSummary),
      reconciliationRows,
      incomes: parsedIncomes,
      egresos: parsedEgresos,
    });
  } catch (error: any) {
    console.error('Error in Mercado Pago reconcile API:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Error al procesar los movimientos de Mercado Pago',
    }, { status: 500 });
  }
}
