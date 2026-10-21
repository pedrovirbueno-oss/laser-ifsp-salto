import React from 'react';
import '@/app/globals.css';
import { AuthProvider } from '@/context/AuthContext';
import { FilterProvider } from '@/context/FilterContext';

export const metadata = {
  title: 'NEXO Production — Plataforma B2B de Monitoramento Industrial',
  description: 'Digitalize o apontamento de produção, acompanhe máquinas em tempo real e OEE.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className="bg-slate-950 text-slate-100 font-sans antialiased">
        <AuthProvider>
          <FilterProvider>{children}</FilterProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
