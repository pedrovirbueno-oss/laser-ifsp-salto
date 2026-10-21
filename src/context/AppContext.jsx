import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';

const AppContext = createContext();

const INITIAL_CREDENTIALS = [
  {
    id: 'CRED-01',
    loginId: 'TECNICO-LAB',
    role: 'Técnico de Laboratório',
    department: 'Laboratório Maker / Manufatura Digital',
    active: true,
    createdAt: '01/10/2026'
  },
  {
    id: 'CRED-02',
    loginId: 'DOCENTE-SUP',
    role: 'Professor Responsável',
    department: 'Coordenadoria de Automação e Mecânica',
    active: true,
    createdAt: '01/10/2026'
  },
  {
    id: 'CRED-03',
    loginId: 'OPERADOR-BANCADA',
    role: 'Operador de Bancada',
    department: 'Chão de Fábrica - Bancadas Laser 01 e 02',
    active: true,
    createdAt: '05/10/2026'
  }
];

const INITIAL_MACHINES = [
  {
    id: 'LASER-01',
    number: '01',
    name: 'Corte a Laser CO2 LabMaker (Amarela)',
    model: 'CL-9060 LabMaker 80W (Tubo CO2)',
    campus: 'IFSP Câmpus Salto • Lab. Prototipagem',
    image: '/assets/machine-amarela.jpg',
    badgeColor: 'amber',
    bedSize: '900 x 600 mm',
    status: 'RODANDO',
    isUnscheduledCut: false,
    currentOsCode: 'OS-2026-0157',
    syncedFileOnBenchPc: 'OS-2026-0157_flange_redutora_6mm.dxf',
    currentPartName: 'Flange e Engrenagem Redutora Robótica (MDF 6mm)',
    partType: 'GEAR_FLANGE',
    customSvgPaths: null,
    currentOperator: 'Técnico de Laboratório',
    currentRequester: 'Lucas Almeida (SP308491)',
    currentMaterial: 'MDF 6.0mm Naval',
    totalEstimatedTime: '01h 15min',
    progress: 64.5,
    currentStageLabel: 'Perfil Externo Dentes da Engrenagem',
    laserX: 248.4,
    laserY: 162.0,
    laserActive: true,
    laserTubeHours: 342.5,
    currentAmp: 5.42
  },
  {
    id: 'LASER-02',
    number: '02',
    name: 'Corte a Laser CO2 MAFRAN MF-6040 (Azul)',
    model: 'MAFRAN MF-6040 Industrial 60W',
    campus: 'IFSP Câmpus Salto • Lab. Prototipagem',
    image: '/assets/machine-azul.png',
    badgeColor: 'blue',
    bedSize: '600 x 400 mm',
    status: 'RODANDO',
    isUnscheduledCut: false,
    currentOsCode: 'OS-2026-0158',
    syncedFileOnBenchPc: 'OS-2026-0158_painel_lateral_vent.dxf',
    currentPartName: 'Painel Frontal Ventilado Gabinete Baja (Acrílico 5mm)',
    partType: 'ENCLOSURE_PANEL',
    customSvgPaths: null,
    currentOperator: 'Operador de Bancada',
    currentRequester: 'Mariana Costa (SP309112)',
    currentMaterial: 'Acrílico Cristal 5.0mm',
    totalEstimatedTime: '40 minutos',
    progress: 48.2,
    currentStageLabel: 'Corte Cooler 120mm',
    laserX: 285.0,
    laserY: 125.0,
    laserActive: true,
    laserTubeHours: 198.0,
    currentAmp: 4.85
  }
];

const INITIAL_STUDENT_PROJECTS = [
  {
    id: 'PRJ-2026-0042',
    projectTitle: 'Chassi do Braço Robótico Manipulador',
    studentName: 'Lucas Almeida',
    studentProntuario: 'SP308491',
    studentEmail: 'lucas.almeida@aluno.ifsp.edu.br',
    course: 'TCC Eng. Controle e Automação',
    materialType: 'MDF 6.0mm Naval',
    totalQuantity: 3,
    attachments: [
      { name: 'chassi_base_superior.dxf', size: '1.4 MB' },
      { name: 'suporte_servo_mg996.svg', size: '480 KB' },
      { name: 'garra_articulada.dxf', size: '820 KB' }
    ],
    status: 'PENDENTE_ANALISE',
    createdAt: '20/10/2026 09:00',
    createdIsoDate: '2026-10-20',
    scheduledDate: '',
    scheduledTime: '',
    estimatedTimeMinutes: 45,
    associatedOsCode: '',
    studentNotes: 'Peças para montagem final do TCC. Favor atentar ao encaixe das engrenagens.'
  },
  {
    id: 'PRJ-2026-0041',
    projectTitle: 'Gabinete Acrílico Transparente Robô Baja',
    studentName: 'Mariana Costa',
    studentProntuario: 'SP309112',
    studentEmail: 'mariana.costa@aluno.ifsp.edu.br',
    course: 'Projeto Integrador III - Mecânica',
    materialType: 'Acrílico Cristal 5.0mm',
    totalQuantity: 1,
    attachments: [
      { name: 'painel_lateral_vent.dxf', size: '2.1 MB' }
    ],
    status: 'APROVADO_AGENDADO',
    createdAt: '20/10/2026 07:30',
    createdIsoDate: '2026-10-20',
    scheduledDate: '20/10/2026',
    scheduledTime: '14:00',
    estimatedTimeMinutes: 40,
    associatedOsCode: 'OS-2026-0158',
    studentNotes: 'Uso de acrílico transparente cristal.'
  }
];

const INITIAL_WORK_ORDERS = [
  {
    code: 'OS-2026-0158',
    machineId: 'LASER-02',
    materialType: 'Acrílico Cristal 5.0mm',
    quantity: '1 chapa (600x400mm)',
    estimatedTime: '40 minutos',
    realCuttingSeconds: 1640,
    requester: 'Mariana Costa (SP309112)',
    operator: 'Operador de Bancada',
    status: 'EM_ANDAMENTO',
    createdAt: '20/10/2026 08:30',
    createdIsoDate: '2026-10-20',
    completedPercentage: 48.2,
    syncedFiles: ['OS-2026-0158_painel_lateral_vent.dxf'],
    benchPcStatus: 'SINCRONIZADO NA BANCADA 02',
    notes: 'Painel frontal transparente ventilado para gabinete na máquina MAFRAN MF-6040.'
  },
  {
    code: 'OS-2026-0157',
    machineId: 'LASER-01',
    materialType: 'MDF 6.0mm Naval',
    quantity: '2 chapas (900x600mm)',
    estimatedTime: '01h 15min',
    realCuttingSeconds: 3120,
    requester: 'Lucas Almeida (SP308491)',
    operator: 'Técnico de Laboratório',
    status: 'EM_ANDAMENTO',
    createdAt: '20/10/2026 08:15',
    createdIsoDate: '2026-10-20',
    completedPercentage: 64.5,
    syncedFiles: ['OS-2026-0157_flange_redutora_6mm.dxf'],
    benchPcStatus: 'SINCRONIZADO NA BANCADA 01',
    notes: 'Corte de flange e engrenagem redutora na máquina Laser LabMaker Amarela.'
  },
  {
    code: 'OS-2026-0156',
    machineId: 'LASER-01',
    materialType: 'MDF 3.0mm CRYS',
    quantity: '1 chapa (600x400mm)',
    estimatedTime: '30 minutos',
    realCuttingSeconds: 1790,
    requester: 'Pedro Henrique (SP307210)',
    operator: 'Técnico de Laboratório',
    status: 'CONCLUIDA',
    createdAt: '19/10/2026 16:20',
    createdIsoDate: '2026-10-19',
    completedPercentage: 100,
    syncedFiles: ['OS-2026-0156_suporte_ultrassom.dxf'],
    benchPcStatus: 'FINALIZADO',
    notes: 'Suporte de sensores ultrassônicos concluído.'
  },
  {
    code: 'OS-2026-0155',
    machineId: 'LASER-02',
    materialType: 'Acrílico Cristal 3.0mm',
    quantity: '2 chapas (600x400mm)',
    estimatedTime: '50 minutos',
    realCuttingSeconds: 2890,
    requester: 'Beatriz Oliveira (SP305881)',
    operator: 'Operador de Bancada',
    status: 'CONCLUIDA',
    createdAt: '16/10/2026 14:10',
    createdIsoDate: '2026-10-16',
    completedPercentage: 100,
    syncedFiles: ['OS-2026-0155_case_controlador.svg'],
    benchPcStatus: 'FINALIZADO',
    notes: 'Case de proteção para placa controladora.'
  }
];

export const AppProvider = ({ children }) => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [portalMode, setPortalMode] = useState('MANAGEMENT'); // 'MANAGEMENT' | 'STUDENT'
  const [selectedMachineFilter, setSelectedMachineFilter] = useState('BOTH'); // 'BOTH' | 'LASER-01' | 'LASER-02'

  // Authentication State
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

  // Credentials List (Impersonal roles)
  const [credentialsList, setCredentialsList] = useState(() => {
    try {
      const saved = localStorage.getItem('ifsp_salto_credentials_v3');
      return saved ? JSON.parse(saved) : INITIAL_CREDENTIALS;
    } catch {
      return INITIAL_CREDENTIALS;
    }
  });

  // Active OS Code selected for QR Modal
  const [selectedOsForQr, setSelectedOsForQr] = useState(null);
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);
  const [selectedProjectForApproval, setSelectedProjectForApproval] = useState(null);

  // Real-time Pop-up Toast Notifications
  const [toastNotifications, setToastNotifications] = useState([]);

  // BroadcastChannel for instant multi-tab / multi-PC communication
  const broadcastRef = useRef(null);

  // Cycle & Runtime Statistics
  const [cycleStats, setCycleStats] = useState({
    cycleStartTime: '07:30',
    totalOnTimeSeconds: 19120,
    actualCuttingTimeSeconds: 14280,
    idleTimeSeconds: 4840
  });

  const [studentProjects, setStudentProjects] = useState(() => {
    try {
      const saved = localStorage.getItem('ifsp_salto_student_projects_v3');
      return saved ? JSON.parse(saved) : INITIAL_STUDENT_PROJECTS;
    } catch {
      return INITIAL_STUDENT_PROJECTS;
    }
  });

  const [workOrders, setWorkOrders] = useState(() => {
    try {
      const saved = localStorage.getItem('ifsp_salto_work_orders_v3');
      return saved ? JSON.parse(saved) : INITIAL_WORK_ORDERS;
    } catch {
      return INITIAL_WORK_ORDERS;
    }
  });

  const [machines, setMachines] = useState(INITIAL_MACHINES);

  // Queue of files automatically pushed to the Bench PC next to each laser machine
  const [benchPcQueue, setBenchPcQueue] = useState([
    {
      id: 'SYNC-01',
      osCode: 'OS-2026-0158',
      machineId: 'LASER-02',
      files: ['OS-2026-0158_painel_lateral_vent.dxf'],
      requester: 'Mariana Costa',
      syncedAt: '20/10/2026 08:30',
      status: 'CARREGADO NA CONTROLADORA'
    },
    {
      id: 'SYNC-02',
      osCode: 'OS-2026-0157',
      machineId: 'LASER-01',
      files: ['OS-2026-0157_flange_redutora_6mm.dxf'],
      requester: 'Lucas Almeida',
      syncedAt: '20/10/2026 08:15',
      status: 'CARREGADO NA CONTROLADORA'
    }
  ]);

  // Historical Telemetry Data (Strictly Electric Current in Amperes for both machines)
  const [telemetryHistory, setTelemetryHistory] = useState(() => {
    const initial = [];
    const now = new Date();
    for (let i = 15; i >= 0; i--) {
      const time = new Date(now.getTime() - i * 3000);
      const timeStr = time.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      initial.push({
        time: timeStr,
        correnteM1: Number((5.3 + (Math.random() - 0.5) * 0.45).toFixed(2)),
        correnteM2: Number((4.8 + (Math.random() - 0.5) * 0.4).toFixed(2))
      });
    }
    return initial;
  });

  // Alerts List
  const [alerts, setAlerts] = useState([
    {
      id: 1,
      type: 'SUCCESS',
      message: 'Monitoramento não-invasivo de Corrente Elétrica (A) e Posição (X, Y) ativo nas Bancadas 01 e 02.',
      timestamp: '20/10/2026 08:15:00',
      resolved: false
    }
  ]);

  const playNotificationSound = () => {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, ctx.currentTime);
      osc.frequency.setValueAtTime(880, ctx.currentTime + 0.12);
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.45);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.45);
    } catch {}
  };

  const showToast = (toastData) => {
    const id = Date.now() + Math.random();
    const nowTime = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const newToast = {
      id,
      timestamp: nowTime,
      ...toastData
    };
    setToastNotifications(prev => [newToast, ...prev].slice(0, 4));
    playNotificationSound();

    setTimeout(() => {
      setToastNotifications(prev => prev.filter(t => t.id !== id));
    }, 12000);
  };

  const dismissToast = (id) => {
    setToastNotifications(prev => prev.filter(t => t.id !== id));
  };

  const addAlert = (type, message) => {
    const now = new Date();
    const formattedDate = `${now.toLocaleDateString('pt-BR')} ${now.toLocaleTimeString('pt-BR')}`;
    setAlerts(prev => [
      {
        id: Date.now() + Math.random(),
        type,
        message,
        timestamp: formattedDate,
        resolved: false
      },
      ...prev
    ]);
  };

  // Setup Cross-Tab & Multi-PC Real-Time Sync (BroadcastChannel + Local Backend SSE + Cloud Pub/Sub SSE)
  const seenEventsRef = useRef(new Set());
  const CLOUD_SYNC_TOPIC = 'ifsp_salto_laser_sync_2026_v3';

  const emitRealtimeEvent = (type, payload) => {
    const eventId = `EVT-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    seenEventsRef.current.add(eventId);
    const envelope = { eventId, type, payload };

    // 1. Same PC (Multi-Tab BroadcastChannel)
    if (broadcastRef.current) {
      try {
        broadcastRef.current.postMessage(envelope);
      } catch {}
    }

    // 2. Local Network / Wi-Fi Server (Node.js Backend server/index.cjs via Vite proxy or port 3001)
    fetch('/api/realtime-event', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(envelope)
    }).catch(() => {
      const host = window.location.hostname || 'localhost';
      fetch(`http://${host}:3001/api/realtime-event`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(envelope)
      }).catch(() => {});
    });

    // 3. Cloud Internet Relay (Works across any 2 PCs on Vercel / Custom Domain / 4G without local server)
    fetch(`https://ntfy.sh/${CLOUD_SYNC_TOPIC}`, {
      method: 'POST',
      body: JSON.stringify(envelope)
    }).catch(() => {});
  };

  useEffect(() => {
    const processIncomingEvent = (data) => {
      const { eventId, type, payload } = data || {};
      if (!type || !payload) return;
      if (eventId) {
        if (seenEventsRef.current.has(eventId)) return;
        seenEventsRef.current.add(eventId);
      }

      if (type === 'NEW_STUDENT_PROJECT') {
        setStudentProjects(prev => {
          if (prev.some(p => p.id === payload.id)) return prev;
          return [payload, ...prev];
        });
        addAlert('SUCCESS', `Nova requisição de corte enviada pelo aluno ${payload.studentName}: "${payload.projectTitle}"`);
        showToast({
          type: 'NEW_STUDENT_PROJECT',
          badge: '🔔 NOVA SOLICITAÇÃO DE ALUNO',
          title: `Novo Projeto: ${payload.projectTitle}`,
          message: `O aluno ${payload.studentName} (${payload.studentProntuario}) anexou ${payload.attachments?.length || 1} arquivo(s) para corte em ${payload.materialType}.`,
          projectData: payload
        });
      } else if (type === 'PROJECT_APPROVED') {
        const { updatedProject, newOs, benchSyncItem } = payload;
        setStudentProjects(prev => prev.map(p => p.id === updatedProject.id ? updatedProject : p));
        setWorkOrders(prev => {
          if (prev.some(o => o.code === newOs.code)) return prev;
          return [newOs, ...prev];
        });
        if (benchSyncItem) {
          setBenchPcQueue(prev => [benchSyncItem, ...prev]);
        }
        showToast({
          type: 'SUCCESS',
          badge: '🚀 ENVIADO AO PC DA BANCADA',
          title: `${newOs.code} Aprovada & Sincronizada!`,
          message: `Arquivos enviados automaticamente para o PC da ${newOs.machineId === 'LASER-02' ? 'Máquina 02 (MAFRAN)' : 'Máquina 01 (Amarela)'}.`
        });
      } else if (type === 'UNSCHEDULED_CUT_STARTED') {
        showToast({
          type: 'WARNING',
          badge: '⚠️ CORTE AVULSO DETECTADO',
          title: `Corte Iniciado sem OS na ${payload.machineName}`,
          message: `Corrente subiu para ${payload.currentAmp}A sem OS selecionada. Trajetória do laser sendo reconstruída em tempo real.`
        });
      }
    };

    // Channel 1: BroadcastChannel (Same PC)
    if ('BroadcastChannel' in window) {
      const channel = new BroadcastChannel('ifsp_salto_realtime_bus');
      broadcastRef.current = channel;
      channel.onmessage = (event) => processIncomingEvent(event.data);
    }

    // Channel 2: Local Node.js Server SSE (/api/stream) for 2 PCs on Local Wi-Fi
    let localSse = null;
    try {
      const host = window.location.hostname || 'localhost';
      const sseUrl = window.location.port === '5173' ? '/api/stream' : `http://${host}:3001/api/stream`;
      localSse = new EventSource(sseUrl);
      localSse.addEventListener('realtime_event', (e) => {
        try {
          processIncomingEvent(JSON.parse(e.data));
        } catch {}
      });
    } catch {}

    // Channel 3: Cloud SSE Relay for 2 PCs on Vercel / Domínio / Different Networks
    let cloudSse = null;
    try {
      cloudSse = new EventSource(`https://ntfy.sh/${CLOUD_SYNC_TOPIC}/sse`);
      cloudSse.onmessage = (e) => {
        try {
          const outer = JSON.parse(e.data);
          if (outer && outer.event === 'message' && outer.message) {
            const inner = JSON.parse(outer.message);
            processIncomingEvent(inner);
          }
        } catch {}
      };
    } catch {}

    const handleStorage = (e) => {
      if (e.key === 'ifsp_salto_student_projects_v3' && e.newValue) {
        try { setStudentProjects(JSON.parse(e.newValue)); } catch {}
      }
      if (e.key === 'ifsp_salto_work_orders_v3' && e.newValue) {
        try { setWorkOrders(JSON.parse(e.newValue)); } catch {}
      }
    };
    window.addEventListener('storage', handleStorage);

    return () => {
      window.removeEventListener('storage', handleStorage);
      if (broadcastRef.current) broadcastRef.current.close();
      if (localSse) localSse.close();
      if (cloudSse) cloudSse.close();
    };
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem('ifsp_salto_student_projects_v3', JSON.stringify(studentProjects));
    } catch {}
  }, [studentProjects]);

  useEffect(() => {
    try {
      localStorage.setItem('ifsp_salto_work_orders_v3', JSON.stringify(workOrders));
    } catch {}
  }, [workOrders]);

  useEffect(() => {
    try {
      localStorage.setItem('ifsp_salto_credentials_v3', JSON.stringify(credentialsList));
    } catch {}
  }, [credentialsList]);

  // Impersonal Login handler
  const login = (loginInput, password) => {
    if (!loginInput || !password) return false;

    const normalized = loginInput.toUpperCase();
    const isDocente = normalized.includes('DOCENTE') || normalized.includes('PROF');
    const isOperador = normalized.includes('OPERADOR') || normalized.includes('BANCADA');

    const user = {
      name: isDocente
        ? 'Professor Responsável'
        : isOperador
        ? 'Operador de Bancada'
        : 'Técnico de Laboratório',
      role: isDocente
        ? 'Docente Supervisor • Laboratório IFSP'
        : isOperador
        ? 'Operação Chão de Fábrica'
        : 'Responsável Técnico • Laboratório IFSP',
      prontuario: normalized,
      avatar: '/assets/logo-ifsp-salto.png'
    };

    setCurrentUser(user);
    setIsAuthenticated(true);
    addAlert('SUCCESS', `Acesso autenticado: perfil ${user.name}.`);
    return true;
  };

  const logout = () => {
    setIsAuthenticated(false);
    setCurrentUser(null);
  };

  const addCredential = (credData) => {
    const newCred = {
      id: `CRED-${Date.now()}`,
      loginId: credData.loginId.toUpperCase(),
      role: credData.role || 'Técnico de Laboratório',
      department: credData.department || 'Laboratório de Prototipagem',
      active: true,
      createdAt: new Date().toLocaleDateString('pt-BR')
    };
    setCredentialsList(prev => [newCred, ...prev]);
    addAlert('SUCCESS', `Nova credencial institucional cadastrada: ${newCred.loginId} (${newCred.role}).`);
    showToast({
      type: 'SUCCESS',
      badge: 'CREDENCIAL CRIADA',
      title: `Perfil ${newCred.role} Adicionado`,
      message: `Identificador de acesso ${newCred.loginId} registrado no sistema.`
    });
  };

  const removeCredential = (id) => {
    setCredentialsList(prev => prev.filter(c => c.id !== id));
  };

  const formatSecondsToHms = (totalSec) => {
    if (!totalSec || isNaN(totalSec)) return '00h 00min 00s';
    const hours = Math.floor(totalSec / 3600);
    const minutes = Math.floor((totalSec % 3600) / 60);
    const seconds = totalSec % 60;
    return `${hours.toString().padStart(2, '0')}h ${minutes.toString().padStart(2, '0')}min ${seconds.toString().padStart(2, '0')}s`;
  };

  // Live Telemetry Tick (every 2 seconds) - Strictly Electric Current (A) & Synchronized OS Progress
  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      const timeStr = now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

      setCycleStats(prev => ({
        ...prev,
        totalOnTimeSeconds: prev.totalOnTimeSeconds + 2,
        actualCuttingTimeSeconds: prev.actualCuttingTimeSeconds + 2
      }));

      // Advance real machine progress and synchronize with active Work Orders
      setMachines(prevMachines => {
        const updatedMachines = prevMachines.map(m => {
          if (m.status !== 'RODANDO') {
            return { ...m, currentAmp: 1.15, laserActive: false };
          }

          const nextProgress = m.progress >= 99.6 ? 5.0 : Number((m.progress + 0.45).toFixed(1));
          const baseAmp = m.id === 'LASER-01' ? 5.4 : 4.85;
          const liveAmp = Number((baseAmp + (Math.random() - 0.5) * 0.42).toFixed(2));

          return {
            ...m,
            currentAmp: liveAmp,
            progress: nextProgress,
            laserActive: liveAmp > 3.0
          };
        });

        // Synchronize WorkOrders completedPercentage & realCuttingSeconds with Machine real progress
        setWorkOrders(prevOs => prevOs.map(os => {
          const linkedMachine = updatedMachines.find(
            m => m.currentOsCode === os.code && m.status === 'RODANDO'
          );
          if (linkedMachine) {
            return {
              ...os,
              realCuttingSeconds: (os.realCuttingSeconds || 0) + 2,
              completedPercentage: linkedMachine.progress
            };
          }
          return os;
        }));

        return updatedMachines;
      });

      setTelemetryHistory(prev => {
        const c1 = Number((5.4 + (Math.random() - 0.5) * 0.45).toFixed(2));
        const c2 = Number((4.85 + (Math.random() - 0.5) * 0.4).toFixed(2));
        return [
          ...prev.slice(1),
          {
            time: timeStr,
            correnteM1: c1,
            correnteM2: c2
          }
        ];
      });
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  // Simulate or Trigger an Unscheduled / Emergency Cut on a Machine (Zero blocking, notifies & plots live)
  const triggerUnscheduledCut = (machineId = 'LASER-01') => {
    const targetMachine = machines.find(m => m.id === machineId);
    if (!targetMachine) return;

    setMachines(prev => prev.map(m => {
      if (m.id === machineId) {
        return {
          ...m,
          status: 'RODANDO',
          isUnscheduledCut: true,
          currentOsCode: 'CORTE-AVULSO-SEM-OS',
          syncedFileOnBenchPc: 'corte_emergencial_direto_usb.rd',
          currentPartName: 'Corte Avulso / Emergencial (Detectado via Corrente & Posição X/Y)',
          currentRequester: 'Execução Direta na Bancada (Sem OS Vinculada)',
          currentOperator: 'Operador de Bancada',
          progress: 12.0,
          currentAmp: 5.65
        };
      }
      return m;
    }));

    const alertText = `⚠️ Corte Avulso sem OS detectado na ${targetMachine.name} (Corrente: 5.65 A). Planta do corte sendo reconstruída em tempo real pela posição X/Y do laser.`;
    addAlert('WARNING', alertText);

    showToast({
      type: 'WARNING',
      badge: '⚡ CORTE SEM OS DETECTADO',
      title: `Corte Avulso Iniciado • ${targetMachine.number}`,
      message: `A controladora da ${targetMachine.name} iniciou um corte sem OS apontada. O sistema liberou a operação e já está desenhando a trajetória real do laser.`
    });

    emitRealtimeEvent('UNSCHEDULED_CUT_STARTED', {
      machineName: targetMachine.name,
      currentAmp: 5.65
    });
  };

  // Link an active Work Order to a Machine (or auto-match when Bench PC opens the OS file)
  const assignOsToMachine = (os, machineIdParam) => {
    const targetMachineId = machineIdParam || os.machineId || 'LASER-01';
    const renamedFile = os.syncedFiles?.[0] || `${os.code}_projeto_corte.dxf`;

    setWorkOrders(prev => prev.map(item => {
      if (item.code === os.code) {
        return { ...item, status: 'EM_ANDAMENTO', machineId: targetMachineId };
      }
      return item;
    }));

    setMachines(prev => prev.map(m => {
      if (m.id === targetMachineId) {
        return {
          ...m,
          status: 'RODANDO',
          isUnscheduledCut: false,
          currentOsCode: os.code,
          syncedFileOnBenchPc: renamedFile,
          currentPartName: `${os.quantity} (${os.materialType})`,
          customSvgPaths: os.customSvgPaths || null,
          currentOperator: os.operator || 'Técnico de Laboratório',
          currentRequester: os.requester,
          currentMaterial: os.materialType,
          totalEstimatedTime: os.estimatedTime,
          progress: os.completedPercentage > 0 && os.completedPercentage < 100 ? os.completedPercentage : 8.5,
          currentAmp: 5.35
        };
      }
      return m;
    }));

    addAlert('SUCCESS', `OS ${os.code} reconhecida automaticamente no PC da Bancada (${renamedFile}) e vinculada à máquina ${targetMachineId}.`);
    showToast({
      type: 'SUCCESS',
      badge: '🔗 AUTO-DETECÇÃO DE ARQUIVO NA BANCADA',
      title: `${os.code} em Corte na Máquina ${targetMachineId === 'LASER-02' ? '02' : '01'}`,
      message: `Arquivo "${renamedFile}" aberto no PC da máquina + Corrente de corte detectada. Progresso sincronizado!`
    });
  };

  // Handler 1: Create Student Project Request (Aluno keeps real name!)
  const createStudentProject = (projectData) => {
    const count = studentProjects.length + 43;
    const prjId = `PRJ-2026-0${count}`;
    const now = new Date();
    const formattedDate = `${now.toLocaleDateString('pt-BR')} ${now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;
    const isoDate = now.toISOString().slice(0, 10);

    const newProject = {
      id: prjId,
      projectTitle: projectData.projectTitle || 'Projeto de Corte Laser',
      studentName: projectData.studentName || 'Aluno Solicitante',
      studentProntuario: projectData.studentProntuario || 'SP000000',
      studentEmail: projectData.studentEmail || 'aluno@aluno.ifsp.edu.br',
      course: projectData.course || 'Engenharia / Técnico IFSP',
      materialType: projectData.materialType || 'MDF 3.0mm',
      totalQuantity: projectData.totalQuantity || 1,
      attachments: projectData.attachments || [{ name: 'desenho_peca.dxf', size: '1.0 MB' }],
      customSvgPaths: projectData.customSvgPaths || null,
      status: 'PENDENTE_ANALISE',
      createdAt: formattedDate,
      createdIsoDate: isoDate,
      scheduledDate: '',
      scheduledTime: '',
      estimatedTimeMinutes: 30,
      associatedOsCode: '',
      studentNotes: projectData.studentNotes || ''
    };

    setStudentProjects(prev => [newProject, ...prev]);

    emitRealtimeEvent('NEW_STUDENT_PROJECT', newProject);

    addAlert('SUCCESS', `Novo Projeto ${prjId} enviado pelo aluno ${newProject.studentName}.`);
    showToast({
      type: 'NEW_STUDENT_PROJECT',
      badge: '🔔 PROJETO ENVIADO COM SUCESSO',
      title: `Solicitação ${prjId} Registrada!`,
      message: `O painel do operador foi notificado em tempo real sobre o projeto de ${newProject.studentName}.`,
      projectData: newProject
    });

    confetti({
      particleCount: 70,
      spread: 60,
      origin: { y: 0.6 }
    });

    return newProject;
  };

  // Handler 2: Approve & Schedule Student Project + Auto-Push to Bench PC next to the Laser Machine
  const approveStudentProject = (projectId, approvalData) => {
    const project = studentProjects.find(p => p.id === projectId);
    if (!project) return;

    const osCount = workOrders.length + 159;
    const osCode = `OS-2026-0${osCount}`;
    const targetMachineId = approvalData.machineId || 'LASER-01';

    // Automatically rename CAD files with OS Code prefix for Solution 1 Watchdog auto-detection
    const syncedFiles = project.attachments.map(att => {
      const cleanName = att.name.replace(/\s+/g, '_');
      return cleanName.startsWith(osCode) ? cleanName : `${osCode}_${cleanName}`;
    });

    const updatedProject = {
      ...project,
      status: 'APROVADO_AGENDADO',
      scheduledDate: approvalData.scheduledDate,
      scheduledTime: approvalData.scheduledTime,
      estimatedTimeMinutes: approvalData.estimatedTimeMinutes || 30,
      associatedOsCode: osCode
    };

    setStudentProjects(prev => prev.map(p => p.id === projectId ? updatedProject : p));

    const now = new Date();
    const newOs = {
      code: osCode,
      machineId: targetMachineId,
      materialType: project.materialType,
      quantity: `${project.totalQuantity} peça(s) - ${project.projectTitle}`,
      estimatedTime: `${approvalData.estimatedTimeMinutes || 30} minutos`,
      realCuttingSeconds: 0,
      requester: `${project.studentName} (${project.studentProntuario})`,
      operator: currentUser ? currentUser.name : 'Técnico de Laboratório',
      status: 'AGUARDANDO',
      createdAt: `${now.toLocaleDateString('pt-BR')} ${now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`,
      createdIsoDate: now.toISOString().slice(0, 10),
      completedPercentage: 0,
      syncedFiles,
      customSvgPaths: project.customSvgPaths || null,
      benchPcStatus: `ENVIADO AUTOMATICAMENTE AO PC DA BANCADA (${targetMachineId === 'LASER-02' ? '02 MAFRAN' : '01 AMARELA'})`,
      notes: `Agendado para ${approvalData.scheduledDate} às ${approvalData.scheduledTime}. Arquivos sincronizados na bancada: ${syncedFiles.join(', ')}`
    };

    const benchSyncItem = {
      id: `SYNC-${Date.now()}`,
      osCode,
      machineId: targetMachineId,
      files: syncedFiles,
      requester: project.studentName,
      syncedAt: newOs.createdAt,
      status: 'PRONTO NA PASTA DE CORTE DO PC DA MÁQUINA'
    };

    setWorkOrders(prev => [newOs, ...prev]);
    setBenchPcQueue(prev => [benchSyncItem, ...prev]);

    emitRealtimeEvent('PROJECT_APPROVED', { updatedProject, newOs, benchSyncItem });

    addAlert(
      'SUCCESS',
      `Projeto ${projectId} aprovado! OS ${osCode} e arquivo(s) [${syncedFiles.join(', ')}] enviados automaticamente para o PC ao lado da máquina ${targetMachineId}.`
    );

    showToast({
      type: 'SUCCESS',
      badge: '💻 ENVIADO AO PC DA MÁQUINA',
      title: `${osCode} Sincronizada na Bancada!`,
      message: `Os arquivos já foram renomeados (${syncedFiles[0]}) e enviados sozinhos para o PC de corte ao lado da máquina.`
    });

    setSelectedOsForQr(newOs);
    setIsQrModalOpen(true);
  };

  // Handler: Create manual OS
  const createWorkOrder = (osData) => {
    const count = workOrders.length + 159;
    const code = `OS-2026-0${count}`;
    const now = new Date();
    const formattedDate = `${now.toLocaleDateString('pt-BR')} ${now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;
    const isoDate = now.toISOString().slice(0, 10);
    const targetMachineId = osData.machineId || 'LASER-01';
    const autoFileName = `${code}_peca_bancada.dxf`;

    const newOs = {
      code,
      machineId: targetMachineId,
      materialType: osData.materialType || 'MDF 3.0mm',
      quantity: osData.quantity || '1 unidade',
      estimatedTime: osData.estimatedTime || '30 minutos',
      realCuttingSeconds: 0,
      requester: osData.requester || 'Solicitante Interno',
      operator: osData.operator || (currentUser ? currentUser.name : 'Técnico de Laboratório'),
      status: 'AGUARDANDO',
      createdAt: formattedDate,
      createdIsoDate: isoDate,
      completedPercentage: 0,
      syncedFiles: [autoFileName],
      benchPcStatus: `SINCRONIZADO NO PC DA BANCADA (${targetMachineId === 'LASER-02' ? '02 MAFRAN' : '01 AMARELA'})`,
      notes: osData.notes || 'Ordem gerada e sincronizada automaticamente com o PC de corte da bancada.'
    };

    const benchSyncItem = {
      id: `SYNC-${Date.now()}`,
      osCode: code,
      machineId: targetMachineId,
      files: [autoFileName],
      requester: newOs.requester,
      syncedAt: formattedDate,
      status: 'PRONTO NA PASTA DE CORTE DO PC DA MÁQUINA'
    };

    setWorkOrders(prev => [newOs, ...prev]);
    setBenchPcQueue(prev => [benchSyncItem, ...prev]);

    addAlert('SUCCESS', `Nova Ordem de Serviço ${code} emitida e enviada para o PC da máquina ${targetMachineId}.`);
    showToast({
      type: 'SUCCESS',
      badge: 'QR CODE & AUTO-SYNC BANCADA',
      title: `Ordem de Serviço ${code} Criada`,
      message: `Sincronizada automaticamente com o PC de corte da ${targetMachineId === 'LASER-02' ? 'Máquina 02' : 'Máquina 01'}.`
    });

    confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } });

    setSelectedOsForQr(newOs);
    setIsQrModalOpen(true);
    return newOs;
  };

  return (
    <AppContext.Provider
      value={{
        activeTab,
        setActiveTab,
        portalMode,
        setPortalMode,
        selectedMachineFilter,
        setSelectedMachineFilter,
        isAuthenticated,
        currentUser,
        login,
        logout,
        credentialsList,
        addCredential,
        removeCredential,
        cycleStats,
        formatSecondsToHms,
        studentProjects,
        createStudentProject,
        approveStudentProject,
        workOrders,
        setWorkOrders,
        createWorkOrder,
        assignOsToMachine,
        triggerUnscheduledCut,
        benchPcQueue,
        machines,
        setMachines,
        telemetryHistory,
        alerts,
        setAlerts,
        addAlert,
        toastNotifications,
        showToast,
        dismissToast,
        selectedOsForQr,
        setSelectedOsForQr,
        isQrModalOpen,
        setIsQrModalOpen,
        selectedProjectForApproval,
        setSelectedProjectForApproval
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => useContext(AppContext);
