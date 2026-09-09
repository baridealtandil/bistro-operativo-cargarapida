import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Bistró BI - Sistema de Gestión Gastronómica & IA',
  description: 'Complemento de BI, control financiero, cheques e IA para Fudo y MaxiRest.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className="dark">
      <body className="antialiased bg-slate-950 text-slate-100">{children}</body>
    </html>
  );
}
