import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

const FUDO_AUTH_URL = 'https://auth.fu.do/api';
const FUDO_API_BASE = 'https://api.fu.do/v1alpha1';
const DEFAULT_API_KEY = process.env.FUDO_API_KEY || 'MjFAMTM3NTcy';
const DEFAULT_API_SECRET = process.env.FUDO_API_SECRET || 'bupmioSE6FRHA61RWgxv9AJnmrvjAqoI';

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

async function getFudoLiveMetrics() {
  try {
    const authRes = await fetch(FUDO_AUTH_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ apiKey: DEFAULT_API_KEY, apiSecret: DEFAULT_API_SECRET }),
    });
    if (!authRes.ok) return null;
    const authData = await authRes.json();
    const token = authData.token;
    if (!token) return null;

    const todayStr = getArgentinaTodayStr();
    
    const nowArt = new Date();
    const startDateObj = new Date(nowArt);
    startDateObj.setDate(nowArt.getDate() - 7);
    const startDateStr = getArgentinaTodayStr(startDateObj);

    // Expand buffer range by 1 day before and after for UTC offset
    const filterParam = `filter[createdAt]=and(gte.${startDateStr}T00:00:00Z,lte.${todayStr}T23:59:59Z)`;
    const salesRes = await fetch(`${FUDO_API_BASE}/sales?sort=createdAt&page[size]=500&${filterParam}`, {
      headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' }
    });

    if (!salesRes.ok) return null;
    const salesData = await salesRes.json();
    const rawSales = salesData.data || [];

    let todayMediodia = 0;
    let todayNoche = 0;
    let todayPeople = 0;
    let todayOrders = 0;

    let weekGross = 0;
    let weekPeople = 0;
    let weekOrders = 0;

    rawSales.forEach((s: any) => {
      const attrs = s.attributes || {};
      if (attrs.saleState !== 'CLOSED') return;
      const createdAt = attrs.createdAt;
      if (!createdAt) return;

      const { dateStr, shift } = getArgentinaDateTime(createdAt);
      const total = Number(attrs.total || 0);
      const people = Number(attrs.people || 0);

      weekGross += total;
      weekPeople += people;
      weekOrders += 1;

      if (dateStr === todayStr) {
        todayOrders += 1;
        todayPeople += people;
        if (shift === 'MEDIODIA') todayMediodia += total;
        else todayNoche += total;
      }
    });

    return {
      todayStr,
      todayMediodia,
      todayNoche,
      todayTotal: todayMediodia + todayNoche,
      todayPeople,
      todayOrders,
      todayAvgCover: todayPeople > 0 ? Math.round((todayMediodia + todayNoche) / todayPeople) : 0,
      weekGross,
      weekPeople,
      weekOrders,
    };
  } catch (e) {
    console.error('Error fetching live Fudo metrics in chat API:', e);
    return null;
  }
}

const DEFAULT_MP_TOKEN = process.env.MERCADOPAGO_ACCESS_TOKEN || 'APP_USR-8198042150956293-091022-2bbdbf2826c401999b2a435a981d9074-836632087';

async function getMercadoPagoLiveMetrics() {
  try {
    const todayStr = getArgentinaTodayStr();
    const beginDateIso = `${todayStr}T00:00:00.000-03:00`;
    const endDateIso = `${todayStr}T23:59:59.999-03:00`;

    const searchUrl = `https://api.mercadopago.com/v1/payments/search?sort=date_created&criteria=desc&begin_date=${beginDateIso}&end_date=${endDateIso}&limit=100`;
    const res = await fetch(searchUrl, {
      headers: { 'Authorization': `Bearer ${DEFAULT_MP_TOKEN}` }
    });

    if (!res.ok) return null;
    const data = await res.json();
    const results = (data.results || []).filter((p: any) => p.status === 'approved');

    let grossTotal = 0;
    let netTotal = 0;
    let feesTotal = 0;
    let taxesTotal = 0;

    results.forEach((p: any) => {
      const gross = Number(p.transaction_amount || 0);
      const net = Number(p.transaction_details?.net_received_amount || gross);
      let mpFee = 0;
      (p.fee_details || []).forEach((f: any) => { mpFee += Number(f.amount || 0); });
      let taxes = 0;
      (p.charges_details || []).forEach((c: any) => {
        if (c.type === 'tax') taxes += Number(c.amounts?.original || 0);
      });

      grossTotal += gross;
      netTotal += net;
      feesTotal += mpFee;
      taxesTotal += taxes;
    });

    return {
      todayStr,
      paymentsCount: results.length,
      grossTotal: Math.round(grossTotal),
      netTotal: Math.round(netTotal),
      feesTotal: Math.round(feesTotal * 100) / 100,
      taxesTotal: Math.round(taxesTotal * 100) / 100,
    };
  } catch (e) {
    console.error('Error fetching MP live metrics in chat API:', e);
    return null;
  }
}

export async function POST(req: Request) {
  try {
    const { prompt, contextData } = await req.json();
    const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;

    // Fetch up-to-the-second live Fudo & Mercado Pago metrics
    const [fudoLive, mpLive] = await Promise.all([
      getFudoLiveMetrics(),
      getMercadoPagoLiveMetrics(),
    ]);

    const fudoSection = fudoLive
      ? `
📊 DATOS EN TIEMPO REAL DE FUDO POS (Día Actual: ${fudoLive.todayStr}):
- ☀️ Ventas Turno Mediodía Hoy (07-18 hs): $${fudoLive.todayMediodia.toLocaleString('es-AR')}
- 🌙 Ventas Turno Noche Hoy (18-07 hs): $${fudoLive.todayNoche.toLocaleString('es-AR')}
- 💰 Total Facturado Hoy: $${fudoLive.todayTotal.toLocaleString('es-AR')}
- 👥 Cubiertos / Pax Hoy: ${fudoLive.todayPeople} pax
- 🧾 Comandas Cerradas Hoy: ${fudoLive.todayOrders} órdenes
- 💵 Ticket Promedio por Cubierto Hoy: $${fudoLive.todayAvgCover.toLocaleString('es-AR')}
- 📈 Acumulado Últimos 7 Días Fudo: $${fudoLive.weekGross.toLocaleString('es-AR')} (${fudoLive.weekPeople} pax en ${fudoLive.weekOrders} comandas)`
      : `
📊 DATOS DE FUDO POS:
- Sincronizado dinámicamente con la API de Fudo POS.`;

    const mpSection = mpLive
      ? `
💳 DATOS EN TIEMPO REAL DE MERCADO PAGO API (Cantina Pink - Día Actual: ${mpLive.todayStr}):
- 🔹 Cobros Aprobados Hoy: ${mpLive.paymentsCount} cobros
- 💵 Total Bruto Vendido por MP Hoy: $${mpLive.grossTotal.toLocaleString('es-AR')}
- 🟢 Neto Limpio Acreditado en Cuenta Hoy: $${mpLive.netTotal.toLocaleString('es-AR')}
- 🔻 Comisiones MP Deducidas Hoy: $${mpLive.feesTotal.toLocaleString('es-AR')}
- 🏛️ Retenciones Impositivas (SIRTAC IIBB / Déb-Créd) Hoy: $${mpLive.taxesTotal.toLocaleString('es-AR')}`
      : `
💳 DATOS DE MERCADO PAGO:
- Conectado a la API Oficial de Mercado Pago (Cantina Pink - ID 836632087).`;

    if (apiKey) {
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

      const suppliersSummary = (contextData?.suppliers || [])
        .map((s: any) => `- ${s.name}: $${(s.balanceDue || 0).toLocaleString('es-AR')} adeudados`)
        .join('\n');

      const systemPrompt = `
Eres un Asistente Financiero y de Inteligencia de Negocios (BI) experto en la industria gastronómica.
Tu objetivo es responder de forma concisa, conversacional, profesional y directa en español sobre la consulta del usuario basándote ÚNICAMENTE en los datos actuales del sistema en tiempo real:

${fudoSection}

${mpSection}

DATOS EN TIEMPO REAL DEL RESTAURANTE:
- 💵 DINERO EN EFECTIVO DISPONIBLE (Caja Chica/Mayor): $${(contextData?.cajaMayorBalance || 0).toLocaleString('es-AR')}
- 💳 MERCADOPAGO SALDO DISPONIBLE: $${(contextData?.mercadoPagoBalance || 0).toLocaleString('es-AR')}
- 🏦 CUENTAS BANCARIAS SALDO DISPONIBLE: $${(contextData?.bancosBalance || 0).toLocaleString('es-AR')}
- 🚚 DEUDA TOTAL CON PROVEEDORES: $${(contextData?.totalSupplierDebt || 0).toLocaleString('es-AR')}
- Facturación Neta del Mes: $${(contextData?.totalSalesNetMonth || 0).toLocaleString('es-AR')}
- Compras a Proveedores del Mes: $${(contextData?.totalPurchasesMonth || 0).toLocaleString('es-AR')}
- Costo Laboral Total (Sueldos): $${(contextData?.totalLaborMonth || 0).toLocaleString('es-AR')}
- Gastos Fijos y Servicios: $${(contextData?.totalFixedExpensesMonth || 0).toLocaleString('es-AR')}
- Prime Cost Actual: ${(contextData?.primeCostPercentage || 0).toFixed(1)}% (Target: <60-65%)
  - Food Cost %: ${(contextData?.foodCostPercentage || 0).toFixed(1)}%
  - Labor Cost %: ${(contextData?.laborCostPercentage || 0).toFixed(1)}%
- Utilidad Neta Estimada: $${(contextData?.netProfitEstMonth || 0).toLocaleString('es-AR')}
- Cheques Pendientes a vencer: $${(contextData?.pendingChecksAmount7Days || 0).toLocaleString('es-AR')}
- Servicios Públicos pendientes: $${(contextData?.pendingServicesAmount || 0).toLocaleString('es-AR')}

DESGLOSE DE PROVEEDORES:
${suppliersSummary || 'Sin proveedores cargados'}

Instrucciones:
1. RESPONDE DIRECTAMENTE A LO QUE EL USUARIO PREGUNTA. Si pregunta sobre ventas de Fudo, Mercado Pago, comisiones, retenciones SIRTAC, Mediodía, Noche, Cubiertos o Cajas, usa los datos en tiempo real de Fudo POS y Mercado Pago API.
2. Sé amigable, conversacional y ejecutivo. Usa negritas y formato markdown claro.
3. Si pregunta por un proveedor, comisiones de MP o conciliación, responde con la información detallada disponible.
`;

      const result = await model.generateContent([systemPrompt, `Pregunta del usuario: ${prompt}`]);
      const response = await result.response;
      return NextResponse.json({ reply: response.text() });
    }

    // Motor Conversacional Inteligente (Fallback cuando se opera sin API Key)
    const query = (prompt || '').toLowerCase().trim();
    let reply = '';

    const cajaVal = (contextData?.cajaMayorBalance || 0).toLocaleString('es-AR');
    const mpVal = (contextData?.mercadoPagoBalance || 0).toLocaleString('es-AR');
    const bancoVal = (contextData?.bancosBalance || 0).toLocaleString('es-AR');
    const totalDebt = (contextData?.totalSupplierDebt || 0).toLocaleString('es-AR');
    const totalSales = (contextData?.totalSalesNetMonth || 0).toLocaleString('es-AR');

    if (query.includes('fudo') || query.includes('mediodia') || query.includes('mediodía') || query.includes('noche') || query.includes('cubierto') || query.includes('comanda')) {
      if (fudoLive) {
        reply = `🍽️ **Métricas en Tiempo Real de Fudo POS (Día ${formatArgentinaDate(fudoLive.todayStr)})**:\n\n` +
          `- ☀️ **Ventas Turno Mediodía (07-18 hs)**: **$${fudoLive.todayMediodia.toLocaleString('es-AR')}**\n` +
          `- 🌙 **Ventas Turno Noche (18-07 hs)**: **$${fudoLive.todayNoche.toLocaleString('es-AR')}**\n` +
          `- 💰 **Total Facturado Hoy**: **$${fudoLive.todayTotal.toLocaleString('es-AR')}**\n` +
          `- 👥 **Cubiertos Atendidos**: **${fudoLive.todayPeople} pax** (Ticket promedio: $${fudoLive.todayAvgCover.toLocaleString('es-AR')})\n` +
          `- 🧾 **Comandas Cerradas**: **${fudoLive.todayOrders} órdenes**\n\n` +
          `*Puedes consultar o buscar datos históricos en el módulo **Espejo Fudo POS**.*`;
      } else {
        reply = `🍽️ **Datos de Fudo POS**:\n\n` +
          `Las métricas de Fudo POS están sincronizadas automáticamente. Puedes consultar el tablero completo en la pestaña **Espejo Fudo POS**.`;
      }
    } else if (query.includes('efectivo') || query.includes('caja') || query.includes('dinero en efectivo') || query.includes('cuanto tengo en efectivo')) {
      reply = `💵 **Dinero en Efectivo Disponible (Caja Chica / Mayor)**:\n\n` +
        `El saldo líquido real disponible actualmente en caja es **$${cajaVal}**.\n\n` +
        `Este monto refleja la apertura de caja más las ventas cobradas en efectivo menos los pagos o gastos abonados en efectivo.`;
    } else if (query.includes('mercadopago') || query.includes('mercado pago') || query.includes('mp') || query.includes('conciliacion') || query.includes('conciliación') || query.includes('comision') || query.includes('comisión') || query.includes('retencion') || query.includes('retención')) {
      if (mpLive) {
        reply = `💳 **Métricas en Tiempo Real de Mercado Pago API (Cantina Pink)**:\n\n` +
          `- 🔹 **Cobros Aprobados Hoy**: **${mpLive.paymentsCount} cobros**\n` +
          `- 💵 **Bruto Cobrado Hoy**: **$${mpLive.grossTotal.toLocaleString('es-AR')}**\n` +
          `- 🟢 **Neto Acreditado Limpio**: **$${mpLive.netTotal.toLocaleString('es-AR')}**\n` +
          `- 🔻 **Comisiones MP Deducidas**: **$${mpLive.feesTotal.toLocaleString('es-AR')}**\n` +
          `- 🏛️ **Retenciones Impositivas (SIRTAC/Imp. Créd-Déb)**: **$${mpLive.taxesTotal.toLocaleString('es-AR')}**\n` +
          `- 🏦 **Saldo Disponible en Mercado Pago**: **$${mpVal}**\n\n` +
          `*Puedes ver la conciliación venta por venta Fudo vs Mercado Pago en la pestaña **Conciliación Mercado Pago**.*`;
      } else {
        reply = `💳 **Saldo y Conciliación MercadoPago**:\n\n` +
          `El saldo disponible en tu cuenta de MercadoPago es **$${mpVal}**.\n\n` +
          `Puedes ver la conciliación venta por venta con Fudo POS en la pestaña **Conciliación Mercado Pago**.`;
      }
    } else if (query.includes('banco') || query.includes('bancaria') || query.includes('galicia') || query.includes('nacion') || query.includes('cuenta corriente')) {
      reply = `🏦 **Saldo Disponible en Cuentas Bancarias**:\n\n` +
        `El saldo total consolidado en cuentas bancarias es **$${bancoVal}**.\n\n` +
        `Puedes consultar el desglose por entidad en el módulo de **Bancos**.`;
    } else if (query.includes('proveedor') || query.includes('deuda') || query.includes('debo') || query.includes('factura')) {
      let matchingSup = '';
      if (contextData?.suppliers && contextData.suppliers.length > 0) {
        const found = contextData.suppliers.find((s: any) => query.includes(s.name.toLowerCase()));
        if (found) {
          matchingSup = `\n\n📌 Para **${found.name}**: El saldo adeudado actual es **$${(found.balanceDue || 0).toLocaleString('es-AR')}**.`;
        }
      }
      reply = `🚚 **Estado de Cuentas con Proveedores**:\n\n` +
        `- **Deuda Total Acumulada**: **$${totalDebt}**${matchingSup}\n\n` +
        `Recuerda que puedes consultar o imputar nuevos pagos en la pestaña de **Proveedores** o **Pagos**.`;
    } else if (query.includes('prime cost') || query.includes('costo') || query.includes('rentabilidad')) {
      const pc = (contextData?.primeCostPercentage || 0).toFixed(1);
      reply = `📊 **Análisis de Prime Cost & Rentabilidad**:\n\n` +
        `- **Prime Cost Actual**: **${pc}%** ${contextData?.primeCostPercentage > 65 ? '⚠️ *(Por encima del 65% recomendado)*' : '✅ *(Saludable)*'}\n` +
        `- **Food Cost (Insumos/Compras)**: ${(contextData?.foodCostPercentage || 0).toFixed(1)}% ($${(contextData?.totalPurchasesMonth || 0).toLocaleString('es-AR')})\n` +
        `- **Labor Cost (Sueldos)**: ${(contextData?.laborCostPercentage || 0).toFixed(1)}% ($${(contextData?.totalLaborMonth || 0).toLocaleString('es-AR')})\n` +
        `- **Utilidad Neta Proyectada**: **$${(contextData?.netProfitEstMonth || 0).toLocaleString('es-AR')}**`;
    } else if (query.includes('cheque') || query.includes('vence') || query.includes('vencimiento')) {
      reply = `💳 **Cheques y Vencimientos**:\n\n` +
        `- **Total Cheques Pendientes a vencer**: **$${(contextData?.pendingChecksAmount7Days || 0).toLocaleString('es-AR')}**\n` +
        `- **Servicios Públicos pendientes**: **$${(contextData?.pendingServicesAmount || 0).toLocaleString('es-AR')}**`;
    } else if (query.includes('venta') || query.includes('facturación') || query.includes('ingreso') || query.includes('cuanto vendi')) {
      reply = `📈 **Resumen de Ventas e Ingresos**:\n\n` +
        `- **Ventas Netas Acumuladas**: **$${totalSales}**\n` +
        `- **Cubiertos Atendidos**: ${contextData?.totalCoversMonth || 0} (Ticket Promedio: $${Math.round(contextData?.averageTicketPerCover || 0).toLocaleString('es-AR')})`;
    } else {
      reply = `🤖 **Asistente Inteligente del Restaurante**:\n\n` +
        `Te comparto los datos en tiempo real del restaurante:\n\n` +
        (fudoLive ? `- 🍽️ **Ventas Fudo Hoy**: **$${fudoLive.todayTotal.toLocaleString('es-AR')}** (Mediodía: $${fudoLive.todayMediodia.toLocaleString('es-AR')}, Noche: $${fudoLive.todayNoche.toLocaleString('es-AR')})\n` : '') +
        (mpLive ? `- 💳 **Mercado Pago Hoy**: **$${mpLive.netTotal.toLocaleString('es-AR')} neto** de $${mpLive.grossTotal.toLocaleString('es-AR')} bruto (${mpLive.paymentsCount} cobros)\n` : '') +
        `- 💵 **Efectivo en Caja**: **$${cajaVal}**\n` +
        `- 💳 **MercadoPago Saldo**: **$${mpVal}**\n` +
        `- 🏦 **Cuentas Bancarias**: **$${bancoVal}**\n` +
        `- 🚚 **Deuda a Proveedores**: **$${totalDebt}**\n` +
        `- 📈 **Ventas del Mes**: **$${totalSales}**\n\n` +
        `*¿En qué puedo ayudarte? Puedes preguntarme sobre turnos de Fudo, Mercado Pago, comisiones, proveedores o cuentas.*`;
    }

    return NextResponse.json({ reply });
  } catch (error: any) {
    console.error('Error en /api/chat:', error);
    return NextResponse.json({ reply: 'Ocurrió un error al procesar tu consulta. Inténtalo nuevamente.' }, { status: 500 });
  }
}

function formatArgentinaDate(dateStr: string): string {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
  return dateStr;
}
