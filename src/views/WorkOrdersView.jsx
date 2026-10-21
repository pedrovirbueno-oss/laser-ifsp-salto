import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { 
  FileText, 
  PlusCircle, 
  Search, 
  QrCode, 
  User, 
  Clock, 
  Layers, 
  Timer,
  Sparkles,
  Calendar,
  FileCode,
  Printer,
  MonitorCheck,
  Play
} from 'lucide-react';

export const WorkOrdersView = () => {
  const { 
    workOrders, 
    createWorkOrder, 
    setSelectedOsForQr, 
    setIsQrModalOpen, 
    formatSecondsToHms,
    studentProjects,
    setSelectedProjectForApproval,
    assignOsToMachine
  } = useApp();

  const [formData, setFormData] = useState({
    machineId: 'LASER-01',
    materialType: 'MDF 3.0mm CRYS',
    quantity: '2 chapas (600x400mm)',
    estimatedTime: '45 minutos',
    requester: 'Lucas Almeida (SP308491)',
    operator: 'Técnico de Laboratório'
  });

  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('TODAS');

  const pendingStudentProjects = studentProjects.filter(p => p.status === 'PENDENTE_ANALISE');

  const handleSubmit = (e) => {
    e.preventDefault();
    createWorkOrder(formData);
    setFormData({
      machineId: 'LASER-01',
      materialType: 'MDF 3.0mm CRYS',
      quantity: '1 chapa (600x400mm)',
      estimatedTime: '30 minutos',
      requester: '',
      operator: 'Técnico de Laboratório'
    });
  };

  const filteredOrders = workOrders.filter(os => {
    const matchesSearch = 
      os.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      os.requester.toLowerCase().includes(searchTerm.toLowerCase()) ||
      os.materialType.toLowerCase().includes(searchTerm.toLowerCase()) ||
      os.operator.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (filterStatus === 'TODAS') return matchesSearch;
    return matchesSearch && os.status === filterStatus;
  });

  return (
    <div className="space-y-6 pb-12">
      
      {/* Top Header Banner */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 leading-tight flex items-center gap-2">
            <FileText className="w-6 h-6 text-emerald-600" />
            <span>GESTÃO DE ORDENS DE SERVIÇO & AUTO-ENVIO À BANCADA</span>
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Aprovação de projetos com envio automático do arquivo para o PC da máquina e auto-reconhecimento por nome de arquivo + corrente
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <span className="bg-emerald-100 text-emerald-800 text-xs font-bold px-3 py-1.5 rounded-full border border-emerald-200">
            {workOrders.length} OSs Registradas
          </span>
        </div>
      </div>

      {/* FILA DE SOLICITAÇÕES DE ALUNOS PARA ANÁLISE E AGENDAMENTO */}
      {pendingStudentProjects.length > 0 && (
        <div className="bg-amber-50/70 p-5 rounded-3xl border-2 border-amber-300 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-amber-200 pb-2">
            <div className="flex items-center space-x-2">
              <Sparkles className="w-5 h-5 text-amber-600" />
              <h2 className="text-sm font-extrabold text-amber-950 uppercase tracking-wider">
                SOLICITAÇÕES DE PROJETOS DE ALUNOS ({pendingStudentProjects.length} PENDENTES DE ANÁLISE)
              </h2>
            </div>
            <span className="text-[10px] bg-amber-500 text-white font-bold px-2.5 py-0.5 rounded-full animate-pulse">
              NOVA REQUISIÇÃO RECEBIDA
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {pendingStudentProjects.map(project => (
              <div key={project.id} className="bg-white p-4 rounded-2xl border border-amber-200 shadow-xs space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="font-mono text-[10px] text-slate-400 font-bold">{project.id} • {project.createdAt}</span>
                    <h3 className="font-bold text-sm text-slate-900 leading-tight">{project.projectTitle}</h3>
                  </div>
                  <span className="text-[10px] bg-amber-100 text-amber-800 font-bold px-2 py-0.5 rounded">
                    PENDENTE
                  </span>
                </div>

                <div className="text-xs space-y-1 text-slate-600">
                  <p><strong>Aluno Solicitante:</strong> {project.studentName} ({project.studentProntuario})</p>
                  <p><strong>Curso:</strong> {project.course}</p>
                  <p><strong>Material Solic.:</strong> {project.materialType} • {project.totalQuantity} peça(s)</p>
                </div>

                {/* Attached CAD Drawings List */}
                <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 text-xs font-mono text-indigo-700 space-y-1">
                  <span className="text-[10px] text-slate-400 font-sans block">Arquivos CAD Anexados pelo Aluno:</span>
                  {project.attachments.map((file, idx) => (
                    <div key={idx} className="flex items-center space-x-1.5 truncate">
                      <FileCode className="w-3.5 h-3.5 shrink-0" />
                      <span className="truncate">{file.name} ({file.size})</span>
                    </div>
                  ))}
                </div>

                <button
                  onClick={() => setSelectedProjectForApproval(project)}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-2.5 rounded-xl shadow-xs transition-colors flex items-center justify-center space-x-2 cursor-pointer"
                >
                  <Calendar className="w-4 h-4" />
                  <span>APROVAR, AGENDAR E ENVIAR P/ PC DA MÁQUINA</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* FORMULARIO DE OS MANUAL (5 cols) */}
        <div className="lg:col-span-5 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-5">
          
          <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <PlusCircle className="w-5 h-5 text-emerald-600" />
              <span>NOVA ORDEM DE SERVIÇO</span>
            </h2>
            <span className="text-[10px] text-slate-400 font-mono">ENVIO AUTOMÁTICO À BANCADA</span>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <Printer className="w-3.5 h-3.5 text-slate-400" />
                <span>Máquina de Corte a Laser (Destino) *</span>
              </label>
              <select
                value={formData.machineId}
                onChange={(e) => setFormData({ ...formData, machineId: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
              >
                <option value="LASER-01">01 • Laser CO2 LabMaker (Amarela)</option>
                <option value="LASER-02">02 • Laser CO2 MAFRAN MF-6040 (Azul)</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-slate-400" />
                <span>Qual o Material Usado? *</span>
              </label>
              <select
                value={formData.materialType}
                onChange={(e) => setFormData({ ...formData, materialType: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
              >
                <option value="MDF 3.0mm CRYS">MDF 3.0mm CRYS</option>
                <option value="MDF 6.0mm Naval">MDF 6.0mm Naval</option>
                <option value="Acrílico Cristal 3.0mm">Acrílico Cristal 3.0mm</option>
                <option value="Acrílico Cristal 5.0mm">Acrílico Cristal 5.0mm</option>
                <option value="PETG 1.0mm Transparente">PETG 1.0mm Transparente</option>
                <option value="Papelão Hidráulico 1.5mm">Papelão Hidráulico 1.5mm</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-slate-400" />
                <span>Quantidade de Material Usado *</span>
              </label>
              <input
                type="text"
                placeholder="Ex: 2 chapas (600x400mm)"
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                <span>Tempo Previsto de Corte *</span>
              </label>
              <input
                type="text"
                placeholder="Ex: 45 minutos"
                value={formData.estimatedTime}
                onChange={(e) => setFormData({ ...formData, estimatedTime: e.target.value })}
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-slate-400" />
                <span>Aluno / Solicitante *</span>
              </label>
              <input
                type="text"
                placeholder="Ex: Lucas Almeida (SP308491)"
                value={formData.requester}
                onChange={(e) => setFormData({ ...formData, requester: e.target.value })}
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-slate-400" />
                <span>Perfil do Responsável (Impessoal) *</span>
              </label>
              <select
                value={formData.operator}
                onChange={(e) => setFormData({ ...formData, operator: e.target.value })}
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
              >
                <option value="Técnico de Laboratório">Técnico de Laboratório</option>
                <option value="Professor Responsável">Professor Responsável</option>
                <option value="Operador de Bancada">Operador de Bancada</option>
              </select>
            </div>

            <button
              type="submit"
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-3 px-4 rounded-xl font-bold text-xs shadow-md transition-all flex items-center justify-center space-x-2 cursor-pointer mt-2"
            >
              <QrCode className="w-4 h-4" />
              <span>GERAR OS, QR CODE & ENVIAR P/ BANCADA</span>
            </button>

          </form>

        </div>

        {/* LISTA DE OS E TEMPO REAL DE MÁQUINA (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
            <div className="relative grow max-w-md">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar por código, aluno solicitante ou material..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div className="flex items-center space-x-1">
              {['TODAS', 'EM_ANDAMENTO', 'AGUARDANDO', 'CONCLUIDA'].map((st) => (
                <button
                  key={st}
                  onClick={() => setFilterStatus(st)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold cursor-pointer transition-colors ${
                    filterStatus === st
                      ? 'bg-slate-900 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {st === 'EM_ANDAMENTO' ? 'EM CORTE' : st}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            {filteredOrders.map((os) => (
              <div
                key={os.code}
                className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs hover:border-emerald-300 transition-all space-y-3"
              >
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-2">
                  <div className="flex items-center space-x-2">
                    <span className="font-mono font-extrabold text-sm text-slate-900">
                      {os.code}
                    </span>
                    <span className="text-slate-300">•</span>
                    <span className="text-xs font-medium text-slate-500">{os.createdAt}</span>
                    <span className="text-[10px] font-bold bg-slate-100 text-slate-700 px-2 py-0.5 rounded">
                      {os.machineId === 'LASER-02' ? 'Máquina 02 (MAFRAN)' : 'Máquina 01 (Amarela)'}
                    </span>
                  </div>

                  <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                    os.status === 'EM_ANDAMENTO'
                      ? 'bg-emerald-100 text-emerald-800 animate-pulse'
                      : os.status === 'CONCLUIDA'
                      ? 'bg-blue-100 text-blue-800'
                      : 'bg-amber-100 text-amber-800'
                  }`}>
                    {os.status === 'EM_ANDAMENTO' ? `● EM CORTE (${os.completedPercentage?.toFixed(0)}%)` : os.status}
                  </span>
                </div>

                {/* Automatic Bench PC File Sync Badge */}
                <div className="bg-emerald-50/70 px-3 py-2 rounded-xl border border-emerald-200 flex flex-wrap items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-1.5 text-emerald-950">
                    <MonitorCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Arquivo no PC da Máquina:</span>
                    <code className="font-mono font-bold text-emerald-800">
                      {os.syncedFiles?.[0] || `${os.code}_projeto.dxf`}
                    </code>
                  </div>
                  <span className="text-[10px] font-bold text-emerald-700">
                    {os.benchPcStatus || 'SINCRONIZADO NA BANCADA'}
                  </span>
                </div>

                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center space-x-2">
                    <Timer className={`w-4 h-4 ${os.status === 'EM_ANDAMENTO' ? 'text-emerald-600 animate-spin' : 'text-slate-500'}`} />
                    <div>
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
                        TEMPO REAL DE USO DA MÁQUINA
                      </span>
                      <span className="font-mono text-sm font-extrabold text-slate-900">
                        {formatSecondsToHms(os.realCuttingSeconds)}
                      </span>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
                      PREVISÃO ESTIMADA
                    </span>
                    <span className="font-mono text-xs font-semibold text-amber-700">
                      {os.estimatedTime}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                  <div>
                    <p className="text-[10px] text-slate-400 font-medium">Material</p>
                    <p className="font-semibold text-slate-800 truncate">{os.materialType}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-400 font-medium">Qtd. Material</p>
                    <p className="font-semibold text-slate-800 truncate">{os.quantity}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-400 font-medium">Aluno / Solicitante</p>
                    <p className="font-semibold text-slate-800 truncate">{os.requester}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-400 font-medium">Perfil Operador</p>
                    <p className="font-semibold text-slate-800 truncate">{os.operator}</p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100">
                  {os.status === 'AGUARDANDO' && (
                    <button
                      onClick={() => assignOsToMachine(os, os.machineId)}
                      className="flex items-center space-x-1.5 text-xs bg-slate-900 hover:bg-slate-800 text-white px-3 py-1.5 rounded-xl font-bold cursor-pointer transition-colors"
                      title="Simula o PC ao lado da máquina abrindo o arquivo desta OS e a corrente subindo"
                    >
                      <Play className="w-3.5 h-3.5 text-emerald-400 fill-current" />
                      <span>Simular Auto-Reconhecimento no PC da Máquina</span>
                    </button>
                  )}

                  <button
                    onClick={() => {
                      setSelectedOsForQr(os);
                      setIsQrModalOpen(true);
                    }}
                    className="flex items-center space-x-1.5 text-xs bg-emerald-600 hover:bg-emerald-700 text-white px-3.5 py-1.5 rounded-xl font-bold cursor-pointer transition-colors shadow-2xs ml-auto"
                  >
                    <QrCode className="w-3.5 h-3.5" />
                    <span>Ver QR Code & Ficha da OS</span>
                  </button>
                </div>

              </div>
            ))}
          </div>

        </div>

      </div>

    </div>
  );
};
