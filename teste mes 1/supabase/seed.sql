-- NEXO PRODUCTION - DEMO SEED DATASET
-- Company: Metalúrgica Vale Industrial

-- Insert Company
INSERT INTO public.companies (id, name, legal_name, document, email, phone, timezone, active)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'Metalúrgica Vale Industrial',
  'Metalúrgica Vale Industrial S/A',
  '12.345.678/0001-90',
  'contato@valeindustrial.com.br',
  '(11) 4004-9000',
  'America/Sao_Paulo',
  true
) ON CONFLICT (id) DO NOTHING;

-- Insert Shifts
INSERT INTO public.shifts (id, company_id, name, start_time, end_time, active) VALUES
('10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'Turno A', '06:00', '14:00', true),
('10000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', 'Turno B', '14:00', '22:00', true),
('10000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000001', 'Turno C', '22:00', '06:00', true)
ON CONFLICT (id) DO NOTHING;

-- Insert Downtime Reasons
INSERT INTO public.downtime_reasons (id, company_id, name, category, active) VALUES
('20000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'Setup de Ferramental', 'setup', true),
('20000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', 'Manutenção Preventiva', 'maintenance', true),
('20000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000001', 'Falta de Matéria-Prima', 'material', true),
('20000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000001', 'Inspeção de Qualidade', 'quality', true),
('20000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000001', 'Ausência de Operador', 'operator', true),
('20000000-0000-0000-0000-000000000006', '00000000-0000-0000-0000-000000000006', 'Ajuste de Parâmetro', 'adjustment', true),
('20000000-0000-0000-0000-000000000007', '00000000-0000-0000-0000-000000000001', 'Falha Elétrica', 'electrical', true),
('20000000-0000-0000-0000-000000000008', '00000000-0000-0000-0000-000000000001', 'Quebra Mecânica', 'mechanical', true)
ON CONFLICT (id) DO NOTHING;

-- Insert Machines (12 Machines)
INSERT INTO public.machines (id, company_id, name, code, sector, description, status, active) VALUES
('30000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'Torno CNC Romi Centur 30D', 'CNC-01', 'Usinagem', 'Torno CNC de alta precisão para eixos usinados', 'producing', true),
('30000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', 'Centro de Usinagem Haas VF-2', 'CNC-02', 'Usinagem', 'Centro de usinagem vertical 3 eixos', 'producing', true),
('30000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000001', 'Torno CNC Mazak Quick Turn', 'CNC-03', 'Usinagem', 'Torno multifuncional para componentes pesados', 'stopped', true),
('30000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000001', 'Prensa Hidráulica 200T', 'PRS-01', 'Estamparia', 'Prensa para conformação de chapa metálica', 'producing', true),
('30000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000001', 'Prensa Excêntrica 100T', 'PRS-02', 'Estamparia', 'Estamparia rápida de terminais metálicos', 'setup', true),
('30000000-0000-0000-0000-000000000006', '00000000-0000-0000-0000-000000000001', 'Corte Laser Fiber 3kW', 'LAS-01', 'Corte e Dobra', 'Corte a laser de chapas até 16mm', 'producing', true),
('30000000-0000-0000-0000-000000000007', '00000000-0000-0000-0000-000000000001', 'Dobradeira CNC Trumpf TruBend', 'DOB-01', 'Corte e Dobra', 'Dobra com compensação de ângulo a laser', 'producing', true),
('30000000-0000-0000-0000-000000000008', '00000000-0000-0000-0000-000000000001', 'Robô de Solda Yaskawa Motoman', 'SOL-01', 'Soldagem', 'Célula automatizada de soldagem MIG/MAG', 'maintenance', true),
('30000000-0000-0000-0000-000000000009', '00000000-0000-0000-0000-000000000001', 'Injetora Plástica Romi EN 150', 'INJ-01', 'Injeção', 'Injeção de buchas e acabamentos plásticos', 'producing', true),
('30000000-0000-0000-0000-000000000010', '00000000-0000-0000-0000-000000000001', 'Retífica Cilíndrica Ferdimat', 'RET-01', 'Acabamento', 'Retificadora de precisão para acoplamentos', 'producing', true),
('30000000-0000-0000-0000-000000000011', '00000000-0000-0000-0000-000000000001', 'Lavadora Industrial Ultrassônica', 'LAV-01', 'Acabamento', 'Desengraxamento e desengraxamento químico', 'inactive', true),
('30000000-0000-0000-0000-000000000012', '00000000-0000-0000-0000-000000000001', 'Linha de Montagem Automatizada', 'MNT-01', 'Montagem', 'Montagem final de subconjuntos mecânicos', 'producing', true)
ON CONFLICT (id) DO NOTHING;

-- Insert Products (Sample top products)
INSERT INTO public.products (id, company_id, name, code, description, target_cycle_time_seconds, target_quantity_per_hour, target_scrap_percentage, active) VALUES
('40000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'Eixo Transmissão Aço 4140', 'PROD-101', 'Eixo usinado temperado para redutores', 45.00, 80.00, 1.50, true),
('40000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', 'Flange de Fixação SAE 1020', 'PROD-102', 'Flange usinada com 8 furos rebaixados', 60.00, 60.00, 2.00, true),
('40000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000001', 'Suporte Lateral Estampado', 'PROD-103', 'Suporte em chapa galvanizada 3mm', 12.00, 300.00, 1.00, true),
('40000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000001', 'Painel Frontal Cortado Laser', 'PROD-104', 'Painel em aço inox 304 escovado', 90.00, 40.00, 1.20, true),
('40000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000001', 'Bucha Plástica de Encaixe', 'PROD-105', 'Bucha em Poliamida PA6 com fibra', 15.00, 240.00, 2.50, true)
ON CONFLICT (id) DO NOTHING;
