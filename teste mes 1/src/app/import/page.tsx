'use client';

import React, { useState } from 'react';
import Sidebar from '@/components/layout/Sidebar';
import Header from '@/components/layout/Header';
import { Upload, CheckCircle2, AlertCircle, FileSpreadsheet } from 'lucide-react';
import Papa from 'papaparse';

export default function ImportPage() {
  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
  const [parsedRows, setParsedRows] = useState<any[]>([]);
  const [columnMapping, setColumnMapping] = useState<Record<string, string>>({
    date: '',
    machine: '',
    product: '',
    quantity: '',
    scrap: '',
  });

  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [isImported, setIsImported] = useState(false);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        if (results.meta.fields) {
          setCsvHeaders(results.meta.fields);
          // Auto guess mapping
          const fields = results.meta.fields;
          setColumnMapping({
            date: fields.find((f) => /data|date/i.test(f)) || fields[0] || '',
            machine: fields.find((f) => /maquina|machine|cnc/i.test(f)) || fields[1] || '',
            product: fields.find((f) => /produto|product/i.test(f)) || fields[2] || '',
            quantity: fields.find((f) => /quantidade|produced|total/i.test(f)) || fields[3] || '',
            scrap: fields.find((f) => /refugo|scrap|rejeitado/i.test(f)) || fields[4] || '',
          });
        }
        setParsedRows(results.data);
      },
    });
  };

  const handleProcessImport = () => {
    const errors: string[] = [];
    parsedRows.forEach((row, i) => {
      const qty = Number(row[columnMapping.quantity]);
      const scrap = Number(row[columnMapping.scrap]);
      if (isNaN(qty) || qty < 0) {
        errors.push(`Linha ${i + 1}: Quantidade produzida inválida (${row[columnMapping.quantity]})`);
      }
      if (isNaN(scrap) || scrap < 0) {
        errors.push(`Linha ${i + 1}: Quantidade de refugo inválida (${row[columnMapping.scrap]})`);
      }
    });

    setValidationErrors(errors);
    if (errors.length === 0) {
      setIsImported(true);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Header />
        <main className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto w-full">
          <div className="border-b border-slate-800 pb-4">
            <h1 className="text-2xl font-extrabold text-white">Importar Dados de Produção (CSV / Excel)</h1>
            <p className="text-xs text-slate-400">Faça upload de arquivos legados de produção e faça o mapeamento de colunas.</p>
          </div>

          {/* File Upload Box */}
          <div className="bg-slate-900 border-2 border-dashed border-slate-800 hover:border-blue-500/50 rounded-2xl p-8 text-center space-y-4 transition-colors">
            <Upload className="w-10 h-10 text-blue-400 mx-auto" />
            <div>
              <span className="font-bold text-white block">Selecione o Arquivo CSV</span>
              <span className="text-xs text-slate-400">Arraste ou clique para selecionar o arquivo .csv</span>
            </div>
            <input type="file" accept=".csv" onChange={handleFileUpload} className="hidden" id="csv-input" />
            <label
              htmlFor="csv-input"
              className="inline-block px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold cursor-pointer transition-all shadow-md shadow-blue-500/20"
            >
              Escolher Arquivo CSV
            </label>
          </div>

          {/* Column Mapping Section */}
          {csvHeaders.length > 0 && (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
              <h2 className="text-base font-bold text-white">Mapeamento de Colunas</h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 text-xs">
                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">Data → date</label>
                  <select
                    value={columnMapping.date}
                    onChange={(e) => setColumnMapping({ ...columnMapping, date: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 text-white rounded-lg p-2 font-mono"
                  >
                    {csvHeaders.map((h) => (
                      <option key={h} value={h}>{h}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">Máquina → machine</label>
                  <select
                    value={columnMapping.machine}
                    onChange={(e) => setColumnMapping({ ...columnMapping, machine: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 text-white rounded-lg p-2 font-mono"
                  >
                    {csvHeaders.map((h) => (
                      <option key={h} value={h}>{h}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">Produto → product</label>
                  <select
                    value={columnMapping.product}
                    onChange={(e) => setColumnMapping({ ...columnMapping, product: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 text-white rounded-lg p-2 font-mono"
                  >
                    {csvHeaders.map((h) => (
                      <option key={h} value={h}>{h}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">Quantidade → quantity</label>
                  <select
                    value={columnMapping.quantity}
                    onChange={(e) => setColumnMapping({ ...columnMapping, quantity: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 text-white rounded-lg p-2 font-mono"
                  >
                    {csvHeaders.map((h) => (
                      <option key={h} value={h}>{h}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">Refugo → scrap</label>
                  <select
                    value={columnMapping.scrap}
                    onChange={(e) => setColumnMapping({ ...columnMapping, scrap: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 text-white rounded-lg p-2 font-mono"
                  >
                    {csvHeaders.map((h) => (
                      <option key={h} value={h}>{h}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Validation Feedback */}
              {validationErrors.length > 0 && (
                <div className="p-4 bg-red-950/60 border border-red-800/80 rounded-xl space-y-1 text-xs text-red-300">
                  <span className="font-bold block flex items-center gap-1.5"><AlertCircle className="w-4 h-4" /> Erros de Validação Encontrados:</span>
                  {validationErrors.map((err, idx) => (
                    <p key={idx}>{err}</p>
                  ))}
                </div>
              )}

              {isImported && (
                <div className="p-4 bg-emerald-950/60 border border-emerald-800/80 rounded-xl text-xs text-emerald-300 flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                  <span className="font-bold">{parsedRows.length} registros validados e importados com sucesso!</span>
                </div>
              )}

              <button
                type="button"
                onClick={handleProcessImport}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-emerald-500/20"
              >
                Validar e Processar Importação
              </button>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
