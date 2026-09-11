import { NextResponse } from 'next/server';

const FUDO_AUTH_URL = 'https://auth.fu.do/api';
const FUDO_API_BASE = 'https://api.fu.do/v1alpha1';

const DEFAULT_API_KEY = process.env.FUDO_API_KEY || 'MjFAMTM3NTcy';
const DEFAULT_API_SECRET = process.env.FUDO_API_SECRET || 'bupmioSE6FRHA61RWgxv9AJnmrvjAqoI';

// Cache token in memory during execution
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

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const dateParam = searchParams.get('date'); // YYYY-MM-DD
    const targetDate = dateParam || new Date().toISOString().split('T')[0];

    const token = await getFudoToken();

    // Fetch sales from Fudo
    const salesRes = await fetch(`${FUDO_API_BASE}/sales?sort=-createdAt&page[size]=200`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json',
      },
      next: { revalidate: 30 } // Cache for 30s
    });

    if (!salesRes.ok) {
      const err = await salesRes.text();
      return NextResponse.json({ error: `Fudo API sales error: ${err}` }, { status: salesRes.status });
    }

    const salesData = await salesRes.json();
    const rawSales = salesData.data || [];

    // Filter sales for target date if specified
    const filteredSales = rawSales.filter((sale: any) => {
      const createdAt = sale.attributes?.createdAt;
      if (!createdAt) return true;
      // Compare YYYY-MM-DD
      const saleDate = new Date(createdAt).toISOString().split('T')[0];
      return saleDate === targetDate;
    });

    // Calculate aggregated metrics
    let totalGrossSales = 0;
    let closedSalesCount = 0;
    let inCourseSalesCount = 0;
    let totalPeople = 0;

    const salesList = filteredSales.map((sale: any) => {
      const attrs = sale.attributes || {};
      const state = attrs.saleState || 'UNKNOWN';
      const total = Number(attrs.total || 0);

      if (state === 'CLOSED') {
        totalGrossSales += total;
        closedSalesCount += 1;
      } else if (state === 'IN-COURSE') {
        totalGrossSales += total;
        inCourseSalesCount += 1;
      }

      totalPeople += Number(attrs.people || 0);

      return {
        id: sale.id,
        createdAt: attrs.createdAt,
        closedAt: attrs.closedAt,
        total,
        people: attrs.people,
        saleType: attrs.saleType,
        saleState: state,
        tableId: sale.relationships?.table?.data?.id || null,
        waiterId: sale.relationships?.waiter?.data?.id || null,
      };
    });

    return NextResponse.json({
      success: true,
      connected: true,
      targetDate,
      summary: {
        totalSalesAmount: totalGrossSales,
        closedSalesCount,
        inCourseSalesCount,
        totalOrders: filteredSales.length,
        totalPeople,
        averageTicket: closedSalesCount > 0 ? Math.round(totalGrossSales / closedSalesCount) : 0,
      },
      sales: salesList,
    });
  } catch (error: any) {
    console.error('Fudo sync error:', error);
    return NextResponse.json({
      success: false,
      connected: false,
      error: error.message || 'Error al conectar con Fudo',
    }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const apiKey = body.apiKey || DEFAULT_API_KEY;
    const apiSecret = body.apiSecret || DEFAULT_API_SECRET;

    const token = await getFudoToken(apiKey, apiSecret);
    if (!token) {
      throw new Error('No se pudo obtener un token válido de Fudo.');
    }

    return NextResponse.json({
      success: true,
      connected: true,
      message: 'Conexión con Fudo verificada correctamente.',
      tokenPreview: `${token.substring(0, 15)}...`,
    });
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      connected: false,
      error: error.message || 'Error de autenticación con Fudo',
    }, { status: 400 });
  }
}
