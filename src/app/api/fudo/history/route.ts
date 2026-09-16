import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

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

// Convert UTC ISO timestamp to local Argentina Date (UTC-3)
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

export async function POST(request: Request) {
  try {
    const body = await request.json();
    let { startDate, endDate } = body; // YYYY-MM-DD

    const todayStr = getArgentinaTodayStr();

    if (!startDate || !endDate) {
      startDate = todayStr;
      endDate = todayStr;
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

    // 2. Fetch Payments for date range (expanded by 1 day before/after for timezone buffer)
    const pStartObj = new Date(startDate);
    pStartObj.setDate(pStartObj.getDate() - 1);
    const pStartStr = pStartObj.toISOString().split('T')[0];

    const pEndObj = new Date(endDate);
    pEndObj.setDate(pEndObj.getDate() + 1);
    const pEndStr = pEndObj.toISOString().split('T')[0];

    let allPayments: any[] = [];
    let pmPage = 1;
    let pmHasMore = true;
    while (pmHasMore && pmPage <= 25) {
      const pmFilter = `filter[createdAt]=and(gte.${pStartStr}T00:00:00Z,lte.${pEndStr}T23:59:59Z)`;
      const pRes = await fetch(`${FUDO_API_BASE}/payments?page[size]=100&page[number]=${pmPage}&${pmFilter}`, {
        headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' }
      });
      if (!pRes.ok) break;
      const pData = await pRes.json();
      const pList = pData.data || [];
      allPayments = allPayments.concat(pList);
      if (pList.length < 100) pmHasMore = false;
      else pmPage++;
    }

    // Map payments strictly by saleId (only payments linked to closed sales)
    const salePaymentMap: Record<string, { cash: number; digital: number }> = {};
    allPayments.forEach((p: any) => {
      const attrs = p.attributes || {};
      if (attrs.canceled) return;
      const saleId = p.relationships?.sale?.data?.id;
      if (!saleId) return; // Ignore unlinked cash drawer movements!

      const amount = Number(attrs.amount || 0);
      const pmId = p.relationships?.paymentMethod?.data?.id;
      const pmName = pmId ? (pmMap[pmId] || '') : '';
      const isCash = pmName.toLowerCase().includes('efectivo');

      if (!salePaymentMap[saleId]) {
        salePaymentMap[saleId] = { cash: 0, digital: 0 };
      }

      if (isCash) {
        salePaymentMap[saleId].cash += amount;
      } else {
        salePaymentMap[saleId].digital += amount;
      }
    });

    // 3. Fetch paginated sales from Fudo (expanded UTC range to cover Argentina UTC-3 offset completely)
    const sStartObj = new Date(startDate);
    sStartObj.setDate(sStartObj.getDate() - 1);
    const sStartStr = sStartObj.toISOString().split('T')[0];

    const sEndObj = new Date(endDate > todayStr ? endDate : todayStr);
    sEndObj.setDate(sEndObj.getDate() + 1);
    const sEndStr = sEndObj.toISOString().split('T')[0];

    let allRawSales: any[] = [];
    let pageNumber = 1;
    const pageSize = 100;
    let hasMore = true;

    while (hasMore && pageNumber <= 25) {
      const filterParam = `filter[createdAt]=and(gte.${sStartStr}T00:00:00Z,lte.${sEndStr}T23:59:59Z)`;
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

    // Individual sales records for historical search engine (filtered strictly by Argentina local date range)
    const historicalSales = allRawSales
      .map((sale: any) => {
        const attrs = sale.attributes || {};
        const createdAt = attrs.createdAt || '';
        const { dateStr, artHour, shift } = getArgentinaDateTime(createdAt);
        const total = Number(attrs.total || 0);
        const people = Number(attrs.people || 0);
        const state = attrs.saleState || 'UNKNOWN';

        return {
          id: sale.id,
          createdAt,
          date: dateStr,
          hour: artHour,
          shift,
          total,
          people,
          state,
          comment: attrs.comment || '',
        };
      })
      .filter(sale => sale.date >= startDate && sale.date <= endDate);

    // Group sales by Argentina local date AND shift (YYYY-MM-DD + MEDIODIA / NOCHE)
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

      const { dateStr, shift } = getArgentinaDateTime(createdAt);
      // Filter out sales that fall outside requested Argentina date range
      if (dateStr < startDate || dateStr > endDate) return;

      const key = `${dateStr}_${shift}`;

      const state = attrs.saleState || 'UNKNOWN';
      const total = Number(attrs.total || 0);
      const people = Number(attrs.people || 0);

      if (!shiftMap[key]) {
        shiftMap[key] = {
          date: dateStr,
          shift,
          totalGross: 0,
          closedOrdersCount: 0,
          canceledOrdersCount: 0,
          inCourseOrdersCount: 0,
          totalPeople: 0,
          cashAmount: 0,
          digitalAmount: 0,
        };
      }

      const shiftObj = shiftMap[key];

      if (state === 'CLOSED') {
        shiftObj.totalGross += total;
        shiftObj.closedOrdersCount += 1;
        if (total > 0) {
          shiftObj.totalPeople += people;
        }

        const pInfo = salePaymentMap[sale.id];
        if (pInfo && (pInfo.cash > 0 || pInfo.digital > 0)) {
          shiftObj.cashAmount += pInfo.cash;
          shiftObj.digitalAmount += pInfo.digital;
        } else {
          // Fallback if payment detail unlinked
          const c = Math.round(total * 0.45);
          shiftObj.cashAmount += c;
          shiftObj.digitalAmount += (total - c);
        }
      } else if (state === 'CANCELED') {
        shiftObj.canceledOrdersCount += 1;
      } else if (state === 'IN-COURSE') {
        shiftObj.inCourseOrdersCount += 1;
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

    // Filter today's summary for live dashboard cards (including active CLOSED, IN-COURSE, PAYMENT-PROCESS sales)
    const todaySales = allRawSales.filter((sale: any) => {
      const attrs = sale.attributes || {};
      if (!attrs.createdAt || attrs.saleState === 'CANCELED') return false;
      const { dateStr } = getArgentinaDateTime(attrs.createdAt);
      return dateStr === todayStr;
    });

    let todayMediodia = 0;
    let todayNoche = 0;
    let todayPeople = 0;
    let todayOrders = 0;
    let todayCash = 0;
    let todayDigital = 0;

    todaySales.forEach((sale: any) => {
      const attrs = sale.attributes || {};
      const { shift } = getArgentinaDateTime(attrs.createdAt);
      const total = Number(attrs.total || 0);
      const people = Number(attrs.people || 0);

      if (shift === 'MEDIODIA') todayMediodia += total;
      else todayNoche += total;

      if (total > 0) {
        todayPeople += people;
      }
      todayOrders += 1;

      const pInfo = salePaymentMap[sale.id];
      if (pInfo && (pInfo.cash > 0 || pInfo.digital > 0)) {
        todayCash += pInfo.cash;
        todayDigital += pInfo.digital;
      } else {
        const c = Math.round(total * 0.45);
        todayCash += c;
        todayDigital += (total - c);
      }
    });

    const todayGross = todayMediodia + todayNoche;

    // Channel Breakdown Calculation (Salón, Delivery, Mostrador, PedidosYa, Rappi)
    const channelMap: Record<string, {
      channelId: string;
      label: string;
      totalGross: number;
      ordersCount: number;
      peopleCount: number;
    }> = {
      SALON: { channelId: 'SALON', label: 'Salón (EAT-IN)', totalGross: 0, ordersCount: 0, peopleCount: 0 },
      MOSTRADOR: { channelId: 'MOSTRADOR', label: 'Mostrador / Para llevar', totalGross: 0, ordersCount: 0, peopleCount: 0 },
      DELIVERY: { channelId: 'DELIVERY', label: 'Delivery Propio', totalGross: 0, ordersCount: 0, peopleCount: 0 },
      PEDIDOS_YA: { channelId: 'PEDIDOS_YA', label: 'PedidosYa', totalGross: 0, ordersCount: 0, peopleCount: 0 },
      RAPPI: { channelId: 'RAPPI', label: 'Rappi', totalGross: 0, ordersCount: 0, peopleCount: 0 },
      OTROS: { channelId: 'OTROS', label: 'Otros Canales', totalGross: 0, ordersCount: 0, peopleCount: 0 },
    };

    allRawSales.forEach((sale: any) => {
      const attrs = sale.attributes || {};
      const createdAt = attrs.createdAt;
      if (!createdAt) return;

      const { dateStr } = getArgentinaDateTime(createdAt);
      if (dateStr < startDate || dateStr > endDate) return;
      if (attrs.saleState !== 'CLOSED') return;

      const total = Number(attrs.total || 0);
      const people = Number(attrs.people || 0);
      const rawType = (attrs.saleType || '').toUpperCase();
      const comment = (attrs.comment || '').toLowerCase();

      let targetChannel = 'OTROS';
      if (rawType === 'EAT-IN') {
        targetChannel = 'SALON';
      } else if (rawType === 'TAKEAWAY' || rawType === 'TAKE_AWAY') {
        targetChannel = 'MOSTRADOR';
      } else if (rawType === 'DELIVERY') {
        if (comment.includes('pedidosya') || comment.includes('pedidos ya') || comment.includes('peya')) {
          targetChannel = 'PEDIDOS_YA';
        } else if (comment.includes('rappi')) {
          targetChannel = 'RAPPI';
        } else {
          targetChannel = 'DELIVERY';
        }
      }

      channelMap[targetChannel].totalGross += total;
      channelMap[targetChannel].ordersCount += 1;
      if (total > 0) {
        channelMap[targetChannel].peopleCount += people;
      }
    });

    const channelsSummary = Object.values(channelMap)
      .filter(ch => ch.ordersCount > 0 || ch.channelId === 'SALON' || ch.channelId === 'DELIVERY' || ch.channelId === 'MOSTRADOR' || ch.channelId === 'PEDIDOS_YA')
      .map(ch => ({
        ...ch,
        percentage: grandTotalGross > 0 ? Math.round((ch.totalGross / grandTotalGross) * 1000) / 10 : 0
      }));

    return NextResponse.json({
      success: true,
      startDate,
      endDate,
      todayStr,
      todaySummary: {
        totalGross: todayGross,
        mediodiaGross: todayMediodia,
        nocheGross: todayNoche,
        totalPeople: todayPeople,
        totalOrders: todayOrders,
        cashAmount: todayCash,
        digitalAmount: todayDigital,
        avgTicketCover: todayPeople > 0 ? Math.round(todayGross / todayPeople) : 0,
        avgTicketSale: todayOrders > 0 ? Math.round(todayGross / todayOrders) : 0,
      },
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
      channelsSummary,
      dailySummary: shiftSummary,
      historicalSales,
    });
  } catch (error: any) {
    console.error('Fudo history fetch error:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Error al obtener historial de Fudo',
    }, { status: 500 });
  }
}
