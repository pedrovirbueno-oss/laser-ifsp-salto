import React from 'react';
import Link from 'next/link';
import {
  Touchpad,
  Activity,
  BarChart3,
  FileSpreadsheet,
  Cpu,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  Zap,
} from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-blue-600 selection:text-white">
      {/* Navigation Bar */}
      <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur-md fixed top-0 w-full z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center font-bold text-2xl text-white shadow-lg shadow-blue-500/20">
              N
            </div>
            <div>
              <span className="font-bold text-white tracking-wide text-lg">NEXO</span>
              <span className="block text-[10px] text-blue-400 font-semibold tracking-widest uppercase">
                Soluções Industriais e Automação
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <Link
              href="/login"
              className="text-sm font-semibold text-slate-300 hover:text-white transition-colors hidden sm:block"
            >
              Entrar
            </Link>
            <Link
              href="/login"
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-bold transition-all shadow-lg shadow-blue-600/30 flex items-center gap-2"
            >
              Acessar Demonstração <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-36 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-center relative">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-950/80 border border-blue-800/60 text-blue-300 text-xs font-semibold mb-6">
          <Zap className="w-3.5 h-3.5 text-blue-400" /> Plataforma SaaS B2B para Gestão da Produção Industrial
        </div>

        <h1 className="text-4xl sm:text-6xl font-extrabold text-white tracking-tight leading-tight max-w-4xl mx-auto mb-6">
          Visibilidade total da sua <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400">produção industrial</span>.
        </h1>

        <p className="text-lg sm:text-xl text-slate-400 max-w-3xl mx-auto mb-10 leading-relaxed">
          Digitalize o apontamento, acompanhe sua operação em tempo real e transforme dados operacionais em decisões estratégicas de alta performance.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href="/login"
            className="w-full sm:w-auto px-8 py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold text-base transition-all shadow-xl shadow-blue-600/30 flex items-center justify-center gap-3"
          >
            Conhecer a Plataforma <ArrowRight className="w-5 h-5" />
          </Link>
          <Link
            href="/login"
            className="w-full sm:w-auto px-8 py-4 bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-800 rounded-xl font-bold text-base transition-all flex items-center justify-center"
          >
            Acessar Demonstração
          </Link>
        </div>
      </section>

      {/* Feature Grid */}
      <section className="py-20 bg-slate-900/50 border-y border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-white mb-4">Recursos Desenhados para a Indústria Real</h2>
            <p className="text-slate-400 max-w-2xl mx-auto text-sm sm:text-base">
              Elimine formulários em papel, planilhas desatualizadas e consolidações manuais no fim do turno.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 hover:border-blue-500/50 transition-colors">
              <div className="w-12 h-12 bg-blue-950 border border-blue-800/60 rounded-xl flex items-center justify-center text-blue-400 mb-6">
                <Touchpad className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Apontamento Digital Touch</h3>
              <p className="text-slate-400 text-sm leading-relaxed mb-4">
                Substitua registros manuais com uma interface operacional simplificada para tablets e touchscreens no chão de fábrica.
              </p>
              <ul className="space-y-2 text-xs text-slate-300">
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-400" /> Início de produção em 2 toques</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-400" /> Registro ágil de peças boas e refugo</li>
              </ul>
            </div>

            {/* Feature 2 */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 hover:border-blue-500/50 transition-colors">
              <div className="w-12 h-12 bg-blue-950 border border-blue-800/60 rounded-xl flex items-center justify-center text-blue-400 mb-6">
                <Activity className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Monitoramento de Máquinas</h3>
              <p className="text-slate-400 text-sm leading-relaxed mb-4">
                Acompanhe o status instantâneo do parque fabril (Produzindo, Parada, Setup, Manutenção) derivado de eventos reais.
              </p>
              <ul className="space-y-2 text-xs text-slate-300">
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-400" /> Cronômetro de paradas em tempo real</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-400" /> Registro de motivos por categoria</li>
              </ul>
            </div>

            {/* Feature 3 */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 hover:border-blue-500/50 transition-colors">
              <div className="w-12 h-12 bg-blue-950 border border-blue-800/60 rounded-xl flex items-center justify-center text-blue-400 mb-6">
                <BarChart3 className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Indicadores & OEE</h3>
              <p className="text-slate-400 text-sm leading-relaxed mb-4">
                Calcule a eficiência da fábrica com precisão matemática através de Disponibilidade, Performance e Qualidade.
              </p>
              <ul className="space-y-2 text-xs text-slate-300">
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-400" /> Dashboards gerenciais completos</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-400" /> Ranking de eficiência por máquina</li>
              </ul>
            </div>

            {/* Feature 4 */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 hover:border-blue-500/50 transition-colors">
              <div className="w-12 h-12 bg-blue-950 border border-blue-800/60 rounded-xl flex items-center justify-center text-blue-400 mb-6">
                <FileSpreadsheet className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Relatórios Gerenciais em PDF</h3>
              <p className="text-slate-400 text-sm leading-relaxed mb-4">
                Gere documentos executivos estruturados contendo dados da empresa, paradas por motivo e cumprimento de metas.
              </p>
            </div>

            {/* Feature 5 */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 hover:border-blue-500/50 transition-colors md:col-span-2">
              <div className="w-12 h-12 bg-blue-950 border border-blue-800/60 rounded-xl flex items-center justify-center text-blue-400 mb-6">
                <Cpu className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Arquitetura Preparada para Integração Industrial</h3>
              <p className="text-slate-400 text-sm leading-relaxed mb-4">
                Hoje com apontamento digital manual, amanhã conectada a CLPs, ESP32, Modbus TCP, OPC-UA e gateways IoT através de REST API autenticada com API Keys por empresa.
              </p>
              <div className="flex flex-wrap gap-2 text-xs">
                <span className="px-3 py-1 bg-slate-950 rounded border border-slate-800 font-mono text-blue-400">POST /api/telemetry</span>
                <span className="px-3 py-1 bg-slate-950 rounded border border-slate-800 font-mono text-blue-400">POST /api/production</span>
                <span className="px-3 py-1 bg-slate-950 rounded border border-slate-800 font-mono text-blue-400">GET /api/machines/:id/status</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-800 py-8 bg-slate-950">
        <div className="max-w-7xl mx-auto px-4 text-center text-xs text-slate-500 space-y-2">
          <p>© {new Date().getFullYear()} NEXO Soluções Industriais e Automação S/A. Todos os direitos reservados.</p>
          <p className="flex items-center justify-center gap-1">
            <ShieldCheck className="w-4 h-4 text-blue-400 inline" /> Sistema de Apontamento e Monitoramento Industrial B2B
          </p>
        </div>
      </footer>
    </div>
  );
}
