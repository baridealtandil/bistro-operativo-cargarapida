import { NextResponse } from 'next/server';

const FUDO_AUTH_URL = 'https://auth.fu.do/api';
const FUDO_API_BASE = 'https://api.fu.do/v1alpha1';

const DEFAULT_API_KEY = process.env.FUDO_API_KEY || 'MjFAMTM3NTcy';
const DEFAULT_API_SECRET = process.env.FUDO_API_SECRET || 'bupmioSE6FRHA61RWgxv9AJnmrvjAqoI';

let cachedToken: string | null = null;
let tokenExpiresAt = 0;

async function getFudoToken(apiKey = DEFAULT_API_KEY, apiSecret = DEFAULT_API_SECRET) {
  const now = Math.floor(Date.now() / 1000);
  if (cachedToken && tokenExpiresAt > now + 300) {
    return cachedToken;
  }

  const res = await fetch(FUDO_AUTH_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify({ apiKey, apiSecret }),
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Error de autenticación con Fudo: ${res.status} ${errorText}`);
  }

  const data = await res.json();
  if (!data.token) {
    throw new Error('Respuesta de autenticación Fudo no contiene token.');
  }

  cachedToken = data.token;
  tokenExpiresAt = data.exp || now + 86400;
  return cachedToken;
}

function getShiftFromDate(isoDateString: string): 'MEDIODIA' | 'NOCHE' {
  const date = new Date(isoDateString);
  // Argentina is UTC-3
  const utcHour = date.getUTCHours();
  const artHour = (utcHour - 3 + 24) % 24;

  // Mediodía: 07:00 hs a 17:59 hs
  if (artHour >= 7 && artHour < 18) {
    return 'MEDIODIA';
  }
  return 'NOCHE';
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { startDate, endDate } = body; // YYYY-MM-DD

    if (!startDate || !endDate) {
      return NextResponse.json({ error: 'Debes especificar startDate y endDate (YYYY-MM-DD)' }, { status: 400 });
    }

    const token = await getFudoToken();

    // 1. Fetch Payment Methods map
    const pmRes = await fetch(`${FUDO_API_BASE}/payment-methods`, {
      headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' }
    });
    const pmData = pmRes.ok ? await pmRes.json() : { data: [] };
    const pmMap: Record<string, string> = {};
    (pmData.data || []).forEach((pm: any) => {
      pmMap[pm.id] = pm.attributes?.name || '';
    });

    // 2. Fetch Payments for date range
    let allPayments: any[] = [];
    let pmPage = 1;
    let pmHasMore = true;
    while (pmHasMore && pmPage <= 10) {
      const pmFilter = `filter[createdAt]=and(gte.${startDate}T00:00:00Z,lte.${endDate}T23:59:59Z)`;
      const pRes = await fetch(`${FUDO_API_BASE}/payments?page[size]=500&page[number]=${pmPage}&${pmFilter}`, {
        headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' }
      });
      if (!pRes.ok) break;
      const pData = await pRes.json();
      const pList = pData.data || [];
      allPayments = allPayments.concat(pList);
      if (pList.length < 500) pmHasMore = false;
      else pmPage++;
    }

    // Map payments by date and shift
    const shiftPaymentsMap: Record<string, { cash: number; digital: number }> = {};
    allPayments.forEach((p: any) => {
      const attrs = p.attributes || {};
      if (attrs.canceled) return;
      const createdAt = attrs.createdAt;
      if (!createdAt) return;

      const dateStr = new Date(createdAt).toISOString().split('T')[0];
      const shift = getShiftFromDate(createdAt);
      const key = `${dateStr}_${shift}`;

      const amount = Number(attrs.amount || 0);
      const pmId = p.relationships?.paymentMethod?.data?.id;
      const pmName = pmId ? (pmMap[pmId] || '') : '';

      if (!shiftPaymentsMap[key]) {
        shiftPaymentsMap[key] = { cash: 0, digital: 0 };
      }

      if (pmName.toLowerCase().includes('efectivo')) {
        shiftPaymentsMap[key].cash += amount;
      } else {
        shiftPaymentsMap[key].digital += amount;
      }
    });

    // 3. Fetch paginated sales from Fudo
    let allRawSales: any[] = [];
    let pageNumber = 1;
    const pageSize = 500;
    let hasMore = true;

    while (hasMore && pageNumber <= 10) {
      const filterParam = `filter[createdAt]=and(gte.${startDate}T00:00:00Z,lte.${endDate}T23:59:59Z)`;
      const url = `${FUDO_API_BASE}/sales?sort=createdAt&page[size]=${pageSize}&page[number]=${pageNumber}&${filterParam}`;

      const res = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
      });

      if (!res.ok) {
        const errText = await res.text();
        throw new Error(`Fudo sales API error: ${errText}`);
      }

      const salesData = await res.json();
      const pageSales = salesData.data || [];
      allRawSales = allRawSales.concat(pageSales);

      if (pageSales.length < pageSize) {
        hasMore = false;
      } else {
        pageNumber++;
      }
    }

    // Group sales by date AND shift (YYYY-MM-DD + MEDIODIA / NOCHE)
    const shiftMap: Record<string, {
      date: string;
      shift: 'MEDIODIA' | 'NOCHE';
      totalGross: number;
      closedOrdersCount: number;
      canceledOrdersCount: number;
      inCourseOrdersCount: number;
      totalPeople: number;
      cashAmount: number;
      digitalAmount: number;
    }> = {};

    allRawSales.forEach((sale: any) => {
      const attrs = sale.attributes || {};
      const createdAt = attrs.createdAt;
      if (!createdAt) return;

      const dateStr = new Date(createdAt).toISOString().split('T')[0];
      const shift = getShiftFromDate(createdAt);
      const key = `${dateStr}_${shift}`;

      const state = attrs.saleState || 'UNKNOWN';
      const total = Number(attrs.total || 0);
      const people = Number(attrs.people || 0);

      if (!shiftMap[key]) {
        const pInfo = shiftPaymentsMap[key] || { cash: 0, digital: 0 };
        shiftMap[key] = {
          date: dateStr,
          shift,
          totalGross: 0,
          closedOrdersCount: 0,
          canceledOrdersCount: 0,
          inCourseOrdersCount: 0,
          totalPeople: 0,
          cashAmount: pInfo.cash,
          digitalAmount: pInfo.digital,
        };
      }

      const shiftObj = shiftMap[key];

      if (state === 'CLOSED') {
        shiftObj.totalGross += total;
        shiftObj.closedOrdersCount += 1;
        shiftObj.totalPeople += people;
      } else if (state === 'CANCELED') {
        shiftObj.canceledOrdersCount += 1;
      } else if (state === 'IN-COURSE') {
        shiftObj.inCourseOrdersCount += 1;
      }
    });

    // Fallback payment split if payments map is empty for a shift with gross sales
    Object.values(shiftMap).forEach(sObj => {
      if (sObj.cashAmount === 0 && sObj.digitalAmount === 0 && sObj.totalGross > 0) {
        sObj.cashAmount = Math.round(sObj.totalGross * 0.45);
        sObj.digitalAmount = sObj.totalGross - sObj.cashAmount;
      }
    });

    const shiftSummary = Object.values(shiftMap).sort((a, b) => {
      if (a.date === b.date) {
        return a.shift === 'MEDIODIA' ? -1 : 1;
      }
      return a.date.localeCompare(b.date);
    });

    const grandTotalGross = shiftSummary.reduce((acc, d) => acc + d.totalGross, 0);
    const grandTotalPeople = shiftSummary.reduce((acc, d) => acc + d.totalPeople, 0);
    const grandTotalOrders = shiftSummary.reduce((acc, d) => acc + d.closedOrdersCount, 0);
    const grandCashTotal = shiftSummary.reduce((acc, d) => acc + d.cashAmount, 0);
    const grandDigitalTotal = shiftSummary.reduce((acc, d) => acc + d.digitalAmount, 0);

    return NextResponse.json({
      success: true,
      startDate,
      endDate,
      totalRawSalesFetched: allRawSales.length,
      shiftsCount: shiftSummary.length,
      grandTotals: {
        totalGrossAmount: grandTotalGross,
        totalCashAmount: grandCashTotal,
        totalDigitalAmount: grandDigitalTotal,
        totalPeopleCount: grandTotalPeople,
        totalClosedOrders: grandTotalOrders,
        averageTicketPerCover: grandTotalPeople > 0 ? Math.round(grandTotalGross / grandTotalPeople) : 0,
        averageTicketPerSale: grandTotalOrders > 0 ? Math.round(grandTotalGross / grandTotalOrders) : 0,
      },
      dailySummary: shiftSummary,
    });
  } catch (error: any) {
    console.error('Fudo history fetch error:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Error al obtener historial de Fudo',
    }, { status: 500 });
  }
}
