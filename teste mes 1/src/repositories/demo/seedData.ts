import { Company, Profile, Machine, Product, Shift, ProductionOrder, ProductionRecord, DowntimeReason, DowntimeRecord, AuditLog, ApiKey } from '@/types';

export const DEMO_COMPANY_ID = '00000000-0000-0000-0000-000000000001';

export const demoCompany: Company = {
  id: DEMO_COMPANY_ID,
  name: 'Metalúrgica Vale Industrial',
  legal_name: 'Metalúrgica Vale Industrial S/A',
  document: '12.345.678/0001-90',
  email: 'contato@valeindustrial.com.br',
  phone: '(11) 4004-9000',
  timezone: 'America/Sao_Paulo',
  active: true,
  setup_completed_at: '2026-01-01T00:00:00.000Z',
  created_at: new Date(Date.now() - 60 * 24 * 3600 * 1000).toISOString(),
  updated_at: new Date().toISOString(),
};

export const demoProfiles: Profile[] = [
  {
    id: 'user-admin-demo',
    company_id: DEMO_COMPANY_ID,
    name: 'Carlos Mendes (Admin)',
    email: 'admin@nexoproduction.demo',
    role: 'admin',
    active: true,
    created_at: new Date(Date.now() - 60 * 24 * 3600 * 1000).toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'user-supervisor-demo',
    company_id: DEMO_COMPANY_ID,
    name: 'Roberto Silva (Supervisor)',
    email: 'supervisor@nexoproduction.demo',
    role: 'supervisor',
    active: true,
    created_at: new Date(Date.now() - 60 * 24 * 3600 * 1000).toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'user-operator-demo',
    company_id: DEMO_COMPANY_ID,
    name: 'João Pedro (Operador)',
    email: 'operador@nexoproduction.demo',
    role: 'operator',
    active: true,
    created_at: new Date(Date.now() - 60 * 24 * 3600 * 1000).toISOString(),
    updated_at: new Date().toISOString(),
  },
];

export const demoShifts: Shift[] = [
  { id: 'shift-a', company_id: DEMO_COMPANY_ID, name: 'Turno A', start_time: '06:00', end_time: '14:00', active: true },
  { id: 'shift-b', company_id: DEMO_COMPANY_ID, name: 'Turno B', start_time: '14:00', end_time: '22:00', active: true },
  { id: 'shift-c', company_id: DEMO_COMPANY_ID, name: 'Turno C', start_time: '22:00', end_time: '06:00', active: true },
];

export const demoDowntimeReasons: DowntimeReason[] = [
  { id: 'reason-1', company_id: DEMO_COMPANY_ID, name: 'Setup de Ferramental', category: 'setup', active: true, created_at: new Date().toISOString() },
  { id: 'reason-2', company_id: DEMO_COMPANY_ID, name: 'Manutenção Preventiva', category: 'maintenance', active: true, created_at: new Date().toISOString() },
  { id: 'reason-3', company_id: DEMO_COMPANY_ID, name: 'Falta de Matéria-Prima', category: 'material', active: true, created_at: new Date().toISOString() },
  { id: 'reason-4', company_id: DEMO_COMPANY_ID, name: 'Inspeção de Qualidade', category: 'quality', active: true, created_at: new Date().toISOString() },
  { id: 'reason-5', company_id: DEMO_COMPANY_ID, name: 'Ausência de Operador', category: 'operator', active: true, created_at: new Date().toISOString() },
  { id: 'reason-6', company_id: DEMO_COMPANY_ID, name: 'Ajuste de Parâmetro', category: 'adjustment', active: true, created_at: new Date().toISOString() },
  { id: 'reason-7', company_id: DEMO_COMPANY_ID, name: 'Falha Elétrica', category: 'electrical', active: true, created_at: new Date().toISOString() },
  { id: 'reason-8', company_id: DEMO_COMPANY_ID, name: 'Quebra Mecânica', category: 'mechanical', active: true, created_at: new Date().toISOString() },
];

export const demoMachines: Machine[] = [
  { id: 'm-1', company_id: DEMO_COMPANY_ID, name: 'Torno CNC Romi Centur 30D', code: 'CNC-01', sector: 'Usinagem', description: 'Torno CNC de alta precisão para eixos usinados', status: 'producing', active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'm-2', company_id: DEMO_COMPANY_ID, name: 'Centro de Usinagem Haas VF-2', code: 'CNC-02', sector: 'Usinagem', description: 'Centro de usinagem vertical 3 eixos', status: 'producing', active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'm-3', company_id: DEMO_COMPANY_ID, name: 'Torno CNC Mazak Quick Turn', code: 'CNC-03', sector: 'Usinagem', description: 'Torno multifuncional para componentes pesados', status: 'stopped', active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'm-4', company_id: DEMO_COMPANY_ID, name: 'Prensa Hidráulica 200T', code: 'PRS-01', sector: 'Estamparia', description: 'Prensa para conformação de chapa metálica', status: 'producing', active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'm-5', company_id: DEMO_COMPANY_ID, name: 'Prensa Excêntrica 100T', code: 'PRS-02', sector: 'Estamparia', description: 'Estamparia rápida de terminais metálicos', status: 'setup', active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'm-6', company_id: DEMO_COMPANY_ID, name: 'Corte Laser Fiber 3kW', code: 'LAS-01', sector: 'Corte e Dobra', description: 'Corte a laser de chapas até 16mm', status: 'producing', active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'm-7', company_id: DEMO_COMPANY_ID, name: 'Dobradeira CNC Trumpf TruBend', code: 'DOB-01', sector: 'Corte e Dobra', description: 'Dobra com compensação de ângulo a laser', status: 'producing', active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'm-8', company_id: DEMO_COMPANY_ID, name: 'Robô de Solda Yaskawa Motoman', code: 'SOL-01', sector: 'Soldagem', description: 'Célula automatizada de soldagem MIG/MAG', status: 'maintenance', active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'm-9', company_id: DEMO_COMPANY_ID, name: 'Injetora Plástica Romi EN 150', code: 'INJ-01', sector: 'Injeção', description: 'Injeção de buchas e acabamentos plásticos', status: 'producing', active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'm-10', company_id: DEMO_COMPANY_ID, name: 'Retífica Cilíndrica Ferdimat', code: 'RET-01', sector: 'Acabamento', description: 'Retificadora de precisão para acoplamentos', status: 'producing', active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'm-11', company_id: DEMO_COMPANY_ID, name: 'Lavadora Industrial Ultrassônica', code: 'LAV-01', sector: 'Acabamento', description: 'Desengraxamento e desengraxamento químico', status: 'inactive', active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'm-12', company_id: DEMO_COMPANY_ID, name: 'Linha de Montagem Automatizada', code: 'MNT-01', sector: 'Montagem', description: 'Montagem final de subconjuntos mecânicos', status: 'producing', active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
];

export const demoProducts: Product[] = [
  { id: 'p-1', company_id: DEMO_COMPANY_ID, name: 'Eixo Transmissão Aço 4140', code: 'PROD-101', description: 'Eixo usinado temperado para redutores', target_cycle_time_seconds: 45, target_quantity_per_hour: 80, target_scrap_percentage: 1.5, active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'p-2', company_id: DEMO_COMPANY_ID, name: 'Flange de Fixação SAE 1020', code: 'PROD-102', description: 'Flange usinada com 8 furos rebaixados', target_cycle_time_seconds: 60, target_quantity_per_hour: 60, target_scrap_percentage: 2.0, active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'p-3', company_id: DEMO_COMPANY_ID, name: 'Suporte Lateral Estampado', code: 'PROD-103', description: 'Suporte em chapa galvanizada 3mm', target_cycle_time_seconds: 12, target_quantity_per_hour: 300, target_scrap_percentage: 1.0, active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'p-4', company_id: DEMO_COMPANY_ID, name: 'Painel Frontal Cortado Laser', code: 'PROD-104', description: 'Painel em aço inox 304 escovado', target_cycle_time_seconds: 90, target_quantity_per_hour: 40, target_scrap_percentage: 1.2, active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'p-5', company_id: DEMO_COMPANY_ID, name: 'Bucha Plástica de Encaixe', code: 'PROD-105', description: 'Bucha em Poliamida PA6 com fibra', target_cycle_time_seconds: 15, target_quantity_per_hour: 240, target_scrap_percentage: 2.5, active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
];

export const demoOrders: ProductionOrder[] = [
  { id: 'op-1', company_id: DEMO_COMPANY_ID, code: 'OP-2026-0840', product_id: 'p-1', product_name: 'Eixo Transmissão Aço 4140', planned_quantity: 1000, produced_quantity: 840, rejected_quantity: 12, good_quantity: 828, start_date: new Date(Date.now() - 5 * 24 * 3600 * 1000).toISOString(), due_date: new Date(Date.now() + 2 * 24 * 3600 * 1000).toISOString(), status: 'active', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'op-2', company_id: DEMO_COMPANY_ID, code: 'OP-2026-0841', product_id: 'p-2', product_name: 'Flange de Fixação SAE 1020', planned_quantity: 500, produced_quantity: 480, rejected_quantity: 8, good_quantity: 472, start_date: new Date(Date.now() - 3 * 24 * 3600 * 1000).toISOString(), due_date: new Date(Date.now() + 1 * 24 * 3600 * 1000).toISOString(), status: 'active', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'op-3', company_id: DEMO_COMPANY_ID, code: 'OP-2026-0842', product_id: 'p-3', product_name: 'Suporte Lateral Estampado', planned_quantity: 3000, produced_quantity: 1200, rejected_quantity: 25, good_quantity: 1175, start_date: new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString(), due_date: new Date(Date.now() + 4 * 24 * 3600 * 1000).toISOString(), status: 'active', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'op-4', company_id: DEMO_COMPANY_ID, code: 'OP-2026-0843', product_id: 'p-4', product_name: 'Painel Frontal Cortado Laser', planned_quantity: 250, produced_quantity: 250, rejected_quantity: 3, good_quantity: 247, start_date: new Date(Date.now() - 10 * 24 * 3600 * 1000).toISOString(), due_date: new Date(Date.now() - 1 * 24 * 3600 * 1000).toISOString(), status: 'completed', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'op-5', company_id: DEMO_COMPANY_ID, code: 'OP-2026-0844', product_id: 'p-5', product_name: 'Bucha Plástica de Encaixe', planned_quantity: 2000, produced_quantity: 0, rejected_quantity: 0, good_quantity: 0, start_date: new Date(Date.now() + 1 * 24 * 3600 * 1000).toISOString(), due_date: new Date(Date.now() + 6 * 24 * 3600 * 1000).toISOString(), status: 'planned', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
];

export const demoProductionRecords: ProductionRecord[] = [
  { id: 'rec-1', company_id: DEMO_COMPANY_ID, machine_id: 'm-1', machine_name: 'Torno CNC Romi Centur 30D', operator_id: 'user-operator-demo', operator_name: 'João Pedro', order_id: 'op-1', order_code: 'OP-2026-0840', product_id: 'p-1', product_name: 'Eixo Transmissão Aço 4140', shift_id: 'shift-a', shift_name: 'Turno A', start_time: new Date(Date.now() - 4 * 3600 * 1000).toISOString(), produced_quantity: 450, rejected_quantity: 6, good_quantity: 444, notes: 'Produção em ritmo normal', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'rec-2', company_id: DEMO_COMPANY_ID, machine_id: 'm-2', machine_name: 'Centro de Usinagem Haas VF-2', operator_id: 'user-operator-demo', operator_name: 'João Pedro', order_id: 'op-2', order_code: 'OP-2026-0841', product_id: 'p-2', product_name: 'Flange de Fixação SAE 1020', shift_id: 'shift-a', shift_name: 'Turno A', start_time: new Date(Date.now() - 3 * 3600 * 1000).toISOString(), produced_quantity: 320, rejected_quantity: 4, good_quantity: 316, notes: 'Lote aprovado pela qualidade', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
];

export const demoDowntimeRecords: DowntimeRecord[] = [
  { id: 'dt-1', company_id: DEMO_COMPANY_ID, machine_id: 'm-3', machine_name: 'Torno CNC Mazak Quick Turn', operator_id: 'user-operator-demo', operator_name: 'João Pedro', order_id: 'op-1', order_code: 'OP-2026-0840', reason_id: 'reason-1', reason_name: 'Setup de Ferramental', category: 'setup', start_time: new Date(Date.now() - 27 * 60 * 1000).toISOString(), duration_seconds: 1620, notes: 'Troca de insertos e alinhamento de castanhas', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'dt-2', company_id: DEMO_COMPANY_ID, machine_id: 'm-8', machine_name: 'Robô de Solda Yaskawa Motoman', operator_id: 'user-operator-demo', operator_name: 'João Pedro', order_id: 'op-3', order_code: 'OP-2026-0842', reason_id: 'reason-2', reason_name: 'Manutenção Preventiva', category: 'maintenance', start_time: new Date(Date.now() - 45 * 60 * 1000).toISOString(), duration_seconds: 2700, notes: 'Lubrificação dos eixos e troca de bocal de solda', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
];

export const demoAuditLogs: AuditLog[] = [
  { id: 'audit-1', company_id: DEMO_COMPANY_ID, user_id: 'user-admin-demo', user_name: 'Carlos Mendes', action: 'LOGIN', entity_type: 'AUTH', entity_id: 'user-admin-demo', created_at: new Date(Date.now() - 2 * 3600 * 1000).toISOString() },
  { id: 'audit-2', company_id: DEMO_COMPANY_ID, user_id: 'user-operator-demo', user_name: 'João Pedro', action: 'START_PRODUCTION', entity_type: 'PRODUCTION', entity_id: 'rec-1', new_data: { machine: 'CNC-01', order: 'OP-2026-0840' }, created_at: new Date(Date.now() - 4 * 3600 * 1000).toISOString() },
  { id: 'audit-3', company_id: DEMO_COMPANY_ID, user_id: 'user-operator-demo', user_name: 'João Pedro', action: 'REGISTER_PRODUCTION', entity_type: 'PRODUCTION', entity_id: 'rec-1', new_data: { produced: 450, rejected: 6 }, created_at: new Date(Date.now() - 1 * 3600 * 1000).toISOString() },
  { id: 'audit-4', company_id: DEMO_COMPANY_ID, user_id: 'user-operator-demo', user_name: 'João Pedro', action: 'START_DOWNTIME', entity_type: 'DOWNTIME', entity_id: 'dt-1', new_data: { reason: 'Setup de Ferramental' }, created_at: new Date(Date.now() - 27 * 60 * 1000).toISOString() },
];
