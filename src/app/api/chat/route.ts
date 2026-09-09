import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

export async function POST(req: Request) {
  try {
    const { prompt, contextData } = await req.json();
    const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;

    if (apiKey) {
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

      const suppliersSummary = (contextData?.suppliers || [])
        .map((s: any) => `- ${s.name}: $${(s.balanceDue || 0).toLocaleString('es-AR')} adeudados`)
        .join('\n');

      const systemPrompt = `
Eres un Asistente Financiero y de Inteligencia de Negocios (BI) experto en la industria gastronómica (restaurantes, bares, cafeterías).
Tu objetivo es responder de forma concisa, conversacional, profesional y directa en español sobre la consulta del usuario basándote ÚNICAMENTE en los datos actuales del sistema en tiempo real:

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
1. RESPONDE DIRECTAMENTE A LO QUE EL USUARIO PREGUNTA. Si pregunta "¿cuál es el dinero en efectivo disponible?", responde de inmediato con la cifra exacta de efectivo disponible.
2. Sé amigable, conversacional y ejecutivo. Usa negritas y formato markdown claro.
3. Si pregunta por un proveedor o un saldo en particular, responde con los datos de ese proveedor o cuenta.
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

    if (query.includes('efectivo') || query.includes('caja') || query.includes('dinero en efectivo') || query.includes('cuanto tengo en efectivo')) {
      reply = `💵 **Dinero en Efectivo Disponible (Caja Chica / Mayor)**:\n\n` +
        `El saldo líquido real disponible actualmente en caja es **$${cajaVal}**.\n\n` +
        `Este monto refleja la apertura de caja más las ventas cobradas en efectivo menos los pagos o gastos abonados en efectivo.`;
    } else if (query.includes('mercadopago') || query.includes('mercado pago') || query.includes('mp') || query.includes('cuenta digital')) {
      reply = `💳 **Saldo Disponible en MercadoPago**:\n\n` +
        `El saldo disponible en tu cuenta de MercadoPago es **$${mpVal}**.\n\n` +
        `Este saldo contempla el monto de apertura digital, las ventas acreditadas por QR/tarjeta y los egresos o transferencias realizadas.`;
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
        `Te comparto los datos de disponibilidades y saldos actuales:\n\n` +
        `- 💵 **Efectivo en Caja**: **$${cajaVal}**\n` +
        `- 💳 **MercadoPago**: **$${mpVal}**\n` +
        `- 🏦 **Cuentas Bancarias**: **$${bancoVal}**\n` +
        `- 🚚 **Deuda a Proveedores**: **$${totalDebt}**\n` +
        `- 📈 **Ventas del Mes**: **$${totalSales}**\n\n` +
        `*¿Necesitas información sobre algún proveedor, cheque o fecha en particular?*`;
    }

    return NextResponse.json({ reply });
  } catch (error: any) {
    console.error('Error en /api/chat:', error);
    return NextResponse.json({ reply: 'Ocurrió un error al procesar tu consulta. Inténtalo nuevamente.' }, { status: 500 });
  }
}
