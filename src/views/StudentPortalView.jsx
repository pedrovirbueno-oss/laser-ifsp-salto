import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { 
  FolderPlus, 
  UploadCloud, 
  FileCode, 
  CheckCircle2, 
  Clock, 
  Send, 
  Layers, 
  User, 
  GraduationCap, 
  Mail, 
  Trash2,
  Sparkles,
  ExternalLink
} from 'lucide-react';

export const StudentPortalView = () => {
  const { createStudentProject, studentProjects, setPortalMode } = useApp();

  // Form State
  const [projectTitle, setProjectTitle] = useState('');
  const [studentName, setStudentName] = useState('');
  const [studentProntuario, setStudentProntuario] = useState('');
  const [studentEmail, setStudentEmail] = useState('');
  const [course, setCourse] = useState('Engenharia de Controle e Automação');
  const [materialType, setMaterialType] = useState('MDF 3.0mm CRYS');
  const [totalQuantity, setTotalQuantity] = useState(1);
  const [studentNotes, setStudentNotes] = useState('');

  // Multiple File Attachments State (CRIAR PROJETO - Múltiplos desenhos CAD/Vector)
  const [attachments, setAttachments] = useState([
    { name: 'desenho_base_chassi.dxf', size: '1.4 MB' },
    { name: 'suporte_sensores.svg', size: '520 KB' }
  ]);

  const [newFileName, setNewFileName] = useState('');

  const handleFileUploadChange = (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    const mapped = files.map(f => ({
      name: f.name,
      size: `${(f.size / 1024).toFixed(1)} KB`
    }));
    setAttachments(prev => [...prev, ...mapped]);
    e.target.value = '';
  };

  const handleAddAttachment = () => {
    if (!newFileName.trim()) return;
    const ext = newFileName.includes('.') ? '' : '.dxf';
    setAttachments(prev => [...prev, { name: `${newFileName}${ext}`, size: `${(Math.random() * 1.5 + 0.3).toFixed(1)} MB` }]);
    setNewFileName('');
  };

  const handleRemoveAttachment = (index) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!projectTitle || !studentName || !studentProntuario || !studentEmail) {
      alert('Por favor, preencha todos os campos obrigatórios do formulário.');
      return;
    }

    if (attachments.length === 0) {
      alert('Por favor, anexe ao menos um arquivo de desenho da peça (.dxf, .svg ou .dwg).');
      return;
    }

    createStudentProject({
      projectTitle,
      studentName,
      studentProntuario,
      studentEmail,
      course,
      materialType,
      totalQuantity: Number(totalQuantity),
      attachments,
      studentNotes
    });

    // Reset Form
    setProjectTitle('');
    setStudentNotes('');
  };

  return (
    <div className="space-y-6 pb-12">
      
      {/* Top Plugin Header Banner */}
      <div className="bg-slate-900 text-white p-6 rounded-3xl shadow-xl relative overflow-hidden flex flex-wrap items-center justify-between gap-4">
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="flex items-center space-x-4">
          <div className="bg-white p-2.5 rounded-2xl shadow-lg shrink-0">
            <img 
              src="/assets/logo-ifsp-salto.png" 
              alt="IFSP Câmpus Salto Logo" 
              className="h-12 w-auto object-contain"
            />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="bg-emerald-500 text-white text-[10px] font-extrabold px-2.5 py-0.5 rounded-full tracking-wider">
                PORTAL DO ALUNO & SOLICITANTE
              </span>
              <span className="text-slate-500 text-xs">•</span>
              <span className="text-slate-400 text-xs font-mono">IFSP Câmpus Salto</span>
            </div>
            <h1 className="text-2xl font-extrabold tracking-tight text-white leading-tight mt-0.5">
              REQUISIÇÃO DE PROJETOS E CORTE A LASER CO2
            </h1>
            <p className="text-xs text-slate-300">
              Envie seus desenhos vetorizados (DXF/SVG), solicite materiais e acompanhe o agendamento de execução.
            </p>
          </div>
        </div>

        {!window.location.search.includes('mode=student') && (
          <button
            onClick={() => setPortalMode('MANAGEMENT')}
            className="flex items-center space-x-2 bg-slate-800 hover:bg-slate-700 text-emerald-400 border border-slate-700 px-4 py-2.5 rounded-xl font-bold text-xs shadow-md transition-all cursor-pointer"
          >
            <ExternalLink className="w-4 h-4" />
            <span>Voltar ao Painel do Operador</span>
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* FORMULÁRIO DE REQUISIÇÃO DO ALUNO (7 cols) */}
        <div className="lg:col-span-7 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-6">
          
          <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <FolderPlus className="w-5 h-5 text-emerald-600" />
              <h2 className="text-base font-bold text-slate-900">
                CRIAR NOVO PROJETO (REQUISITAR CORTE)
              </h2>
            </div>
            <span className="bg-emerald-50 text-emerald-800 text-[10px] font-bold px-2.5 py-0.5 rounded border border-emerald-200">
              ENVIO EM TEMPO REAL
            </span>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            
            {/* Título do Projeto */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                <span>Título do Projeto / Peça *</span>
              </label>
              <input
                type="text"
                placeholder="Ex: Protótipo Chassis Robô Baja SAE ou Peças TCC"
                value={projectTitle}
                onChange={(e) => setProjectTitle(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                required
              />
            </div>

            {/* Grid 2 Cols: Nome Aluno & Prontuário */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-slate-400" />
                  <span>Nome Completo do Aluno *</span>
                </label>
                <input
                  type="text"
                  placeholder="Ex: Lucas Almeida"
                  value={studentName}
                  onChange={(e) => setStudentName(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <GraduationCap className="w-3.5 h-3.5 text-slate-400" />
                  <span>Prontuário IFSP *</span>
                </label>
                <input
                  type="text"
                  placeholder="Ex: SP308491"
                  value={studentProntuario}
                  onChange={(e) => setStudentProntuario(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  required
                />
              </div>
            </div>

            {/* Grid 2 Cols: E-mail & Curso */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-slate-400" />
                  <span>E-mail Institucional para Aviso *</span>
                </label>
                <input
                  type="email"
                  placeholder="aluno@aluno.ifsp.edu.br"
                  value={studentEmail}
                  onChange={(e) => setStudentEmail(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <GraduationCap className="w-3.5 h-3.5 text-slate-400" />
                  <span>Curso / Disciplina *</span>
                </label>
                <select
                  value={course}
                  onChange={(e) => setCourse(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
                >
                  <option value="Engenharia de Controle e Automação">Engenharia de Controle e Automação</option>
                  <option value="Técnico em Automação Industrial">Técnico em Automação Industrial</option>
                  <option value="Técnico em Edificações">Técnico em Edificações</option>
                  <option value="Projeto Integrador / TCC">Projeto Integrador / TCC</option>
                  <option value="Equipe Bajabots / Projetos de Extensão">Equipe Bajabots / Projetos de Extensão</option>
                </select>
              </div>
            </div>

            {/* Grid 2 Cols: Material & Quantidade */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-slate-400" />
                  <span>Tipo de Material Desejado *</span>
                </label>
                <select
                  value={materialType}
                  onChange={(e) => setMaterialType(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
                >
                  <option value="MDF 3.0mm CRYS">MDF 3.0mm CRYS</option>
                  <option value="MDF 6.0mm Naval">MDF 6.0mm Naval</option>
                  <option value="Acrílico Cristal 3.0mm">Acrílico Cristal 3.0mm</option>
                  <option value="Acrílico Cristal 5.0mm">Acrílico Cristal 5.0mm</option>
                  <option value="PETG 1.0mm Transparente">PETG 1.0mm Transparente</option>
                  <option value="Papelão Hidráulico 1.5mm">Papelão Hidráulico 1.5mm</option>
                  <option value="EVA Alta Densidade 5mm">EVA Alta Densidade 5mm</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-slate-400" />
                  <span>Quantidade Total de Peças *</span>
                </label>
                <input
                  type="number"
                  min="1"
                  max="50"
                  value={totalQuantity}
                  onChange={(e) => setTotalQuantity(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  required
                />
              </div>
            </div>

            {/* SEÇÃO "CRIAR PROJETO" - ANEXAR MÚLTIPLOS DESENHOS CAD/VECTOR (.DXF, .SVG, .DWG) */}
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
              <div className="flex justify-between items-center">
                <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <UploadCloud className="w-4 h-4 text-indigo-600" />
                  <span>Anexar Desenhos das Peças (.dxf, .svg, .dwg, .pdf) *</span>
                </label>
                <span className="text-[10px] font-mono text-indigo-700 font-bold bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                  {attachments.length} Arquivo(s) Anexado(s)
                </span>
              </div>

              <p className="text-[11px] text-slate-500">
                Você pode incluir múltiplos arquivos em um mesmo projeto. Os responsáveis analisarão cada vetor antes de aprovar.
              </p>

              {/* Real File Upload + Manual Name Input */}
              <div className="flex flex-wrap gap-2">
                <label className="bg-emerald-600 hover:bg-emerald-700 text-white px-3.5 py-2 rounded-xl text-xs font-bold shadow-2xs transition-colors cursor-pointer flex items-center gap-1.5 shrink-0">
                  <UploadCloud className="w-4 h-4" />
                  <span>Selecionar Arquivo do Computador (.dxf, .svg)</span>
                  <input
                    type="file"
                    multiple
                    accept=".dxf,.svg,.dwg,.pdf"
                    onChange={handleFileUploadChange}
                    className="hidden"
                  />
                </label>

                <input
                  type="text"
                  placeholder="Ou digite o nome (ex: chassi_lateral.dxf)"
                  value={newFileName}
                  onChange={(e) => setNewFileName(e.target.value)}
                  className="grow px-3 py-1.5 bg-white border border-slate-300 rounded-xl text-xs font-mono"
                />
                <button
                  type="button"
                  onClick={handleAddAttachment}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-3.5 py-1.5 rounded-xl text-xs font-bold shadow-2xs transition-colors cursor-pointer shrink-0"
                >
                  + Adicionar
                </button>
              </div>

              {/* Attached File List */}
              <div className="space-y-1.5 pt-1">
                {attachments.map((file, idx) => (
                  <div 
                    key={idx} 
                    className="flex items-center justify-between bg-white p-2.5 rounded-xl border border-slate-200 text-xs font-mono"
                  >
                    <div className="flex items-center space-x-2 truncate">
                      <FileCode className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span className="font-bold text-slate-800 truncate">{file.name}</span>
                      <span className="text-[10px] text-slate-400">({file.size})</span>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleRemoveAttachment(idx)}
                      className="text-slate-400 hover:text-red-600 transition-colors p-1 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Observações do Aluno */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">Observações Técnicas Adicionais (Opcional)</label>
              <textarea
                rows="2"
                placeholder="Detalhes sobre folgas de montagem, furações de motor ou urgência..."
                value={studentNotes}
                onChange={(e) => setStudentNotes(e.target.value)}
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              ></textarea>
            </div>

            <button
              type="submit"
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-3 rounded-xl font-bold text-xs shadow-md transition-all flex items-center justify-center space-x-2 cursor-pointer"
            >
              <Send className="w-4 h-4" />
              <span>ENVIAR PROJETO PARA O OPERADOR EM TEMPO REAL</span>
            </button>

          </form>

        </div>

        {/* STATUS DOS MEUS PROJETOS & HISTÓRICO (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          
          <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-4">
            <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-2">
              <Clock className="w-4 h-4 text-emerald-600" />
              <span>ACOMPANHAMENTO DE PROJETOS SOLICITADOS</span>
            </h3>

            <div className="space-y-3">
              {studentProjects.map(project => (
                <div key={project.id} className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
                  
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="font-mono text-[10px] text-slate-400 font-bold">{project.id}</span>
                      <h4 className="font-bold text-sm text-slate-900 leading-snug">{project.projectTitle}</h4>
                    </div>

                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      project.status === 'PENDENTE_ANALISE'
                        ? 'bg-amber-100 text-amber-800'
                        : project.status === 'APROVADO_AGENDADO'
                        ? 'bg-emerald-100 text-emerald-800 font-extrabold'
                        : 'bg-blue-100 text-blue-800'
                    }`}>
                      {project.status === 'PENDENTE_ANALISE' && '🟡 AGUARDANDO ANÁLISE'}
                      {project.status === 'APROVADO_AGENDADO' && '🟢 APROVADO & AGENDADO'}
                    </span>
                  </div>

                  {/* Agendamento Box if Approved */}
                  {project.status === 'APROVADO_AGENDADO' && (
                    <div className="bg-emerald-500 text-white p-3 rounded-xl space-y-1 font-mono text-xs shadow-xs">
                      <div className="flex items-center justify-between font-bold">
                        <span>🗓️ DATA & HORA AGENDADA:</span>
                        <span>{project.scheduledDate} às {project.scheduledTime}</span>
                      </div>
                      <p className="text-[10px] text-emerald-100 font-sans">
                        Sua Ordem de Serviço <strong>{project.associatedOsCode}</strong> foi gerada e agendada no laboratório.
                      </p>
                    </div>
                  )}

                  <div className="text-xs space-y-1 text-slate-600">
                    <p><strong>Solicitante:</strong> {project.studentName} ({project.studentProntuario})</p>
                    <p><strong>Material:</strong> {project.materialType} • {project.totalQuantity} peças</p>
                    <p><strong>Arquivos CAD:</strong> {project.attachments.map(a => a.name).join(', ')}</p>
                  </div>

                </div>
              ))}
            </div>

          </div>

          <div className="bg-emerald-50 p-4 rounded-2xl border border-emerald-200 text-xs text-emerald-900 space-y-1">
            <div className="flex items-center space-x-1.5 font-bold">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Sincronização Instantânea com o Laboratório</span>
            </div>
            <p className="text-[11px] text-emerald-800">
              Assim que você envia sua requisição, o operador do laboratório recebe uma notificação pop-up imediata na tela de supervisão e analisa o tempo de corte.
            </p>
          </div>

        </div>

      </div>

    </div>
  );
};
