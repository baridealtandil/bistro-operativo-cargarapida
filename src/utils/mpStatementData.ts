// Data module for Mercado Pago Official Statement (Resumen de Cuenta en Pesos)
// Captures 100% of outgoing CBU/CVU bank transfers, supplier payments, tax withholdings, and software subscriptions.

export interface MpStatementEgreso {
  id: string;
  dateStr: string;     // DD/MM/YY
  rawDateStr: string;  // YYYY-MM-DD
  amount: number;
  concept: string;
}

export const OFFICIAL_MP_STATEMENT_EGRESOS: MpStatementEgreso[] = [
  { id: '176649434410', dateStr: '01/09/26', rawDateStr: '2026-09-01', amount: 81616.78, concept: 'Pago Fudo (Suscripción POS)' },
  { id: '175755188271', dateStr: '01/09/26', rawDateStr: '2026-09-01', amount: 419841.23, concept: 'Transferencia enviada Christian Matias,fermin' },
  { id: '175755188271-tax', dateStr: '01/09/26', rawDateStr: '2026-09-01', amount: 2519.05, concept: 'Pago de impuestos Christian Matias,fermin' },
  { id: '176710927178', dateStr: '01/09/26', rawDateStr: '2026-09-01', amount: 200000.00, concept: 'Transferencia enviada Pink Restaurante Y Pizzeria De Tandil Sa' },
  { id: '177028643790', dateStr: '03/09/26', rawDateStr: '2026-09-03', amount: 1121000.00, concept: 'Transferencia enviada Pink Restaurante Y Pizzeria De Tandil Sa' },
  { id: '177142545842', dateStr: '03/09/26', rawDateStr: '2026-09-03', amount: 268266.00, concept: 'Transferencia enviada Angel Daniel Tort' },
  { id: '176237681841', dateStr: '04/09/26', rawDateStr: '2026-09-04', amount: 1330000.00, concept: 'Transferencia enviada Pink Restaurante Y Pizzeria De Tandil Sa' },
  { id: '176257999643', dateStr: '04/09/26', rawDateStr: '2026-09-04', amount: 776560.90, concept: 'Pago con QR USINA TANDIL' },
  { id: '176257999643-tax', dateStr: '04/09/26', rawDateStr: '2026-09-04', amount: 4659.37, concept: 'Pago de impuestos USINA TANDIL' },
  { id: '176280227855', dateStr: '04/09/26', rawDateStr: '2026-09-04', amount: 653900.00, concept: 'Transferencia enviada Jose Enrique Martinez' },
  { id: '177250835026', dateStr: '04/09/26', rawDateStr: '2026-09-04', amount: 180000.00, concept: 'Transferencia enviada El Nuevo Ideal De Tandil Srl' },
  { id: '177250835026-tax', dateStr: '04/09/26', rawDateStr: '2026-09-04', amount: 1080.00, concept: 'Pago de impuestos El Nuevo Ideal De Tandil Srl' },
  { id: '177462767194', dateStr: '05/09/26', rawDateStr: '2026-09-05', amount: 300000.00, concept: 'Transferencia enviada Agustina,l Pez Camelo' },
  { id: '177462767194-tax', dateStr: '05/09/26', rawDateStr: '2026-09-05', amount: 1800.00, concept: 'Pago de impuestos Agustina,l Pez Camelo' },
  { id: '177675068572', dateStr: '06/09/26', rawDateStr: '2026-09-06', amount: 20000.00, concept: 'Transferencia enviada Gabriel Adan Marcasso' },
  { id: '177675068572-tax', dateStr: '06/09/26', rawDateStr: '2026-09-06', amount: 120.00, concept: 'Pago de impuestos Gabriel Adan Marcasso' },
  { id: '176760726621', dateStr: '07/09/26', rawDateStr: '2026-09-07', amount: 650000.00, concept: 'Transferencia enviada Gonzalez Guerra Matias Fernando' },
  { id: '176760726621-tax', dateStr: '07/09/26', rawDateStr: '2026-09-07', amount: 3900.00, concept: 'Pago de impuestos Gonzalez Guerra Matias Fernando' },
  { id: '177834386698', dateStr: '07/09/26', rawDateStr: '2026-09-07', amount: 251500.00, concept: 'Transferencia enviada Carolina Barrientos' },
  { id: '177919672710', dateStr: '08/09/26', rawDateStr: '2026-09-08', amount: 2600000.00, concept: 'Transferencia enviada Pink Restaurante Y Pizzeria De Tandil Sa' },
  { id: '178003894148', dateStr: '08/09/26', rawDateStr: '2026-09-08', amount: 352366.75, concept: 'Pago de servicio Personal' },
  { id: '177100675227', dateStr: '09/09/26', rawDateStr: '2026-09-09', amount: 116701.36, concept: 'Transferencia enviada Ghezan Hnos Sociedad Cole Ctiva' },
  { id: '177100675227-tax', dateStr: '09/09/26', rawDateStr: '2026-09-09', amount: 700.21, concept: 'Pago de impuestos Ghezan Hnos Sociedad Cole Ctiva' },
  { id: '178200995286', dateStr: '09/09/26', rawDateStr: '2026-09-09', amount: 17941.68, concept: 'Pago Fudo' },
  { id: '178267406680', dateStr: '10/09/26', rawDateStr: '2026-09-10', amount: 1200000.00, concept: 'Transferencia enviada Pink Restaurante Y Pizzeria De Tandil Sa' },
  { id: '177311385241', dateStr: '10/09/26', rawDateStr: '2026-09-10', amount: 2500000.00, concept: 'Transferencia enviada Uma Restaurantes Y Eventos Tandil Sas' },
  { id: '177311385241-tax', dateStr: '10/09/26', rawDateStr: '2026-09-10', amount: 15000.00, concept: 'Pago de impuestos Uma Restaurantes Y Eventos Tandil Sas' },
  { id: '178291416156', dateStr: '10/09/26', rawDateStr: '2026-09-10', amount: 1350000.00, concept: 'Transferencia enviada Eloisa Casado' },
  { id: '178291416156-tax', dateStr: '10/09/26', rawDateStr: '2026-09-10', amount: 8100.00, concept: 'Pago de impuestos Eloisa Casado' },
  { id: '177321353823', dateStr: '10/09/26', rawDateStr: '2026-09-10', amount: 210000.00, concept: 'Transferencia enviada Uma Restaurantes Y Eventos Tandil Sas' },
  { id: '177321353823-tax', dateStr: '10/09/26', rawDateStr: '2026-09-10', amount: 1260.00, concept: 'Pago de impuestos Uma Restaurantes Y Eventos Tandil Sas' },
  { id: '177391416156', dateStr: '10/09/26', rawDateStr: '2026-09-10', amount: 50300.00, concept: 'Transferencia enviada Claudia Peirano' },
];

export function getStatementEgresosForRange(startDate: string, endDate: string): MpStatementEgreso[] {
  return OFFICIAL_MP_STATEMENT_EGRESOS.filter(
    item => item.rawDateStr >= startDate && item.rawDateStr <= endDate
  );
}
