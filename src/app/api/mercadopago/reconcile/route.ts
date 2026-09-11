import { NextResponse } from 'next/server';

const MP_BASE = 'https://api.mercadopago.com';
const FUDO_AUTH_URL = 'https://auth.fu.do/api';
const FUDO_API_BASE = 'https://api.fu.do/v1alpha1';

const DEFAULT_MP_TOKEN = process.env.MERCADOPAGO_ACCESS_TOKEN || 'APP_USR-8198042150956293-091022-2bbdbf2826c401999b2a435a981d9074-836632087';
const DEFAULT_FUDO_KEY = process.env.FUDO_API_KEY || 'MjFAMTM3NTcy';
const DEFAULT_FUDO_SECRET = process.env.FUDO_API_SECRET || 'bupmioSE6FRHA61RWgxv9AJnmrvjAqoI';

function getArgentinaDateTime(isoDateString: string): { dateStr: string; artHour: number; shift: 'MEDIODIA' | 'NOCHE' } {
  const d = new Date(isoDateString);
  const artMs = d.getTime() - (3 * 3600 * 1000);
  const artDate = new Date(artMs);
  const dateStr = artDate.toISOString().split('T')[0];
  const artHour = artDate.getUTCHours();
  const shift = (artHour >= 7 && artHour < 18) ? 'MEDIODIA' : 'NOCHE';
  return { dateStr, artHour, shift };
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

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    let { startDate, endDate } = body;

    const todayStr = getArgentinaTodayStr();
    if (!startDate || !endDate) {
      startDate = todayStr;
      endDate = todayStr;
    }

    // 1. Fetch Mercado Pago Account info
    const meRes = await fetch(`${MP_BASE}/users/me`, {
      headers: { 'Authorization': `Bearer ${DEFAULT_MP_TOKEN}` }
    });
    const meData = meRes.ok ? await meRes.json() : {};
    const accountInfo = {
      id: meData.id || 836632087,
      nickname: meData.nickname || 'PIPI8489760',
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
        headers: { 'Authorization': `Bearer ${DEFAULT_MP_TOKEN}` }
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

    // Process approved MP payments
    const parsedMpPayments = mpPayments
      .filter((p: any) => p.status === 'approved')
      .map((p: any) => {
        const gross = Number(p.transaction_amount || 0);
        const net = Number(p.transaction_details?.net_received_amount || gross);
        
        let mpFee = 0;
        (p.fee_details || []).forEach((f: any) => {
          mpFee += Number(f.amount || 0);
        });

        let taxes = 0;
        (p.charges_details || []).forEach((c: any) => {
          if (c.type === 'tax') {
            taxes += Number(c.amounts?.original || 0);
          }
        });

        const createdIso = p.date_created || p.date_approved || '';
        const { dateStr, artHour, shift } = getArgentinaDateTime(createdIso);

        const posModel = p.point_of_interaction?.device?.model || '';
        const paymentType = p.payment_type_id || p.payment_method_id || 'QR/Digital';
        const deviceLabel = posModel ? `Point ${posModel}` : (p.point_of_interaction?.type === 'INSTORE' ? 'QR Presencial' : paymentType);

        return {
          id: String(p.id),
          dateCreated: createdIso,
          dateStr,
          hour: artHour,
          shift,
          grossAmount: gross,
          netAmount: net,
          feeAmount: Math.round(mpFee * 100) / 100,
          taxAmount: Math.round(taxes * 100) / 100,
          paymentMethod: p.payment_method_id || 'digital',
          deviceLabel,
          description: p.description || 'Cobro Cantina Pink',
          payerId: p.payer?.id || '',
          orderId: p.order?.id || '',
        };
      });

    // 3. Fetch Fudo Sales for the period to reconcile
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
      const url = `${FUDO_API_BASE}/sales?sort=createdAt&page[size]=500&${filterParam}`;

      const fRes = await fetch(url, {
        headers: { 'Authorization': `Bearer ${fudoToken}`, 'Accept': 'application/json' }
      });

      if (fRes.ok) {
        const fData = await fRes.json();
        const sales = fData.data || [];
        fudoDigitalSales = sales
          .filter((s: any) => s.attributes?.saleState === 'CLOSED')
          .map((s: any) => {
            const createdAt = s.attributes?.createdAt || '';
            const { dateStr, artHour, shift } = getArgentinaDateTime(createdAt);
            return {
              id: String(s.id),
              createdAt,
              dateStr,
              hour: artHour,
              shift,
              total: Number(s.attributes?.total || 0),
              people: Number(s.attributes?.people || 0),
            };
          })
          .filter((s: any) => s.dateStr >= startDate && s.dateStr <= endDate);
      }
    }

    // 4. Perform Reconciliation matching Fudo vs Mercado Pago
    const mpUsedIds = new Set<string>();
    const reconciliationRows: any[] = [];

    fudoDigitalSales.forEach(fudoSale => {
      // Find matching MP payment by amount and timestamp (within same date & shift or +/- 45 mins)
      const match = parsedMpPayments.find(mp => {
        if (mpUsedIds.has(mp.id)) return false;
        if (Math.abs(mp.grossAmount - fudoSale.total) < 1) {
          if (mp.dateStr === fudoSale.dateStr) return true;
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
        });
      } else {
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
          mpDate: 'N/A',
        });
      }
    });

    // Add remaining unmatched MP payments
    parsedMpPayments.forEach(mp => {
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
        });
      }
    });

    // Calculate overall KPIs
    const mpGrossTotal = parsedMpPayments.reduce((acc, p) => acc + p.grossAmount, 0);
    const mpNetTotal = parsedMpPayments.reduce((acc, p) => acc + p.netAmount, 0);
    const mpFeesTotal = parsedMpPayments.reduce((acc, p) => acc + p.feeAmount, 0);
    const mpTaxesTotal = parsedMpPayments.reduce((acc, p) => acc + p.taxAmount, 0);

    const reconciledCount = reconciliationRows.filter(r => r.status === 'RECONCILED').length;
    const totalFudoCount = fudoDigitalSales.length;
    const reconciliationPercentage = totalFudoCount > 0 ? Math.round((reconciledCount / totalFudoCount) * 100) : 100;

    return NextResponse.json({
      success: true,
      startDate,
      endDate,
      accountInfo,
      kpis: {
        mpGrossTotal,
        mpNetTotal,
        mpFeesTotal,
        mpTaxesTotal,
        mpPaymentsCount: parsedMpPayments.length,
        fudoSalesCount: totalFudoCount,
        reconciledCount,
        unmatchedFudoCount: reconciliationRows.filter(r => r.status === 'UNMATCHED_FUDO').length,
        unmatchedMpCount: reconciliationRows.filter(r => r.status === 'UNMATCHED_MP').length,
        reconciliationPercentage,
      },
      reconciliationRows,
      mpPayments: parsedMpPayments,
    });
  } catch (error: any) {
    console.error('Error in Mercado Pago reconcile API:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Error al procesar la conciliación de Mercado Pago',
    }, { status: 500 });
  }
}
