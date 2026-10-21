import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { User, KeyRound, ShieldAlert, ArrowRight } from 'lucide-react';

export const LoginView = () => {
  const { login } = useApp();
  const [prontuario, setProntuario] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!prontuario || !password) {
      setErrorMsg('Por favor, informe o Identificador de Perfil e a Senha.');
      return;
    }

    const success = login(prontuario, password);
    if (!success) {
      setErrorMsg('Credenciais inválidas. Verifique os dados digitados.');
    }
  };

  const handleQuickLogin = (demoId, demoPass) => {
    login(demoId, demoPass);
  };

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4 font-sans text-slate-800">
      
      <div className="bg-white max-w-md w-full rounded-3xl border border-slate-200 shadow-2xl overflow-hidden animate-scale-up">
        
        {/* Header with IFSP Salto Logo */}
        <div className="bg-slate-900 text-white p-8 text-center relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none"></div>
          
          <div className="inline-block bg-white p-3 rounded-2xl shadow-lg mb-4 border border-slate-200">
            <img 
              src="/assets/logo-ifsp-salto.png" 
              alt="IFSP Câmpus Salto Logo" 
              className="h-16 w-auto object-contain"
            />
          </div>

          <h2 className="text-xl font-extrabold tracking-tight text-white leading-snug">
            ACESSO RESTRITO AO LABORATÓRIO
          </h2>
          <p className="text-xs text-slate-400 font-medium mt-1">
            Sistema de Supervisão de Corte a Laser CO2 • IFSP Câmpus Salto
          </p>
        </div>

        {/* Login Form */}
        <div className="p-8 space-y-6">

          {errorMsg && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-800 text-xs flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-red-600 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* Perfil / Identificador */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-slate-400" />
                <span>Credencial Institucional / Perfil *</span>
              </label>
              <input
                type="text"
                placeholder="Ex: TECNICO-LAB ou DOCENTE-SUP"
                value={prontuario}
                onChange={(e) => setProntuario(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                required
              />
            </div>

            {/* Senha */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <KeyRound className="w-3.5 h-3.5 text-slate-400" />
                <span>Senha de Acesso *</span>
              </label>
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                required
              />
            </div>

            {/* Entrar Button */}
            <button
              type="submit"
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-3 rounded-xl font-bold text-xs shadow-md transition-all flex items-center justify-center space-x-2 cursor-pointer mt-2"
            >
              <span>AUTENTICAR E ENTRAR NO SISTEMA</span>
              <ArrowRight className="w-4 h-4" />
            </button>

          </form>

          {/* Quick Demo Access Buttons (Impersonal Roles) */}
          <div className="pt-4 border-t border-slate-100 space-y-2">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider text-center">
              Perfis Institucionais de Acesso
            </p>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleQuickLogin('TECNICO-LAB', '123456')}
                className="bg-slate-50 hover:bg-slate-100 border border-slate-200 p-2.5 rounded-xl text-left cursor-pointer transition-colors"
              >
                <p className="font-bold text-xs text-slate-800">Técnico de Laboratório</p>
                <p className="text-[10px] text-emerald-700 font-mono">ID: TECNICO-LAB</p>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('DOCENTE-SUP', '123456')}
                className="bg-slate-50 hover:bg-slate-100 border border-slate-200 p-2.5 rounded-xl text-left cursor-pointer transition-colors"
              >
                <p className="font-bold text-xs text-slate-800">Professor Responsável</p>
                <p className="text-[10px] text-blue-700 font-mono">ID: DOCENTE-SUP</p>
              </button>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="bg-slate-50 p-4 border-t border-slate-100 text-center text-[10px] text-slate-400 font-medium">
          Instituto Federal de São Paulo • Câmpus Salto
        </div>

      </div>

    </div>
  );
};
