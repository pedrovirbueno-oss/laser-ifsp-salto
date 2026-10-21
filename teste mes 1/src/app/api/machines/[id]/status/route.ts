import { NextRequest, NextResponse } from 'next/server';
import { repositories, IS_DEMO_MODE } from '@/repositories';
import { deriveMachineStatus } from '@/lib/machineStatus';
import { DEMO_COMPANY_ID } from '@/repositories/demo/seedData';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    let companyId = DEMO_COMPANY_ID;

    if (!IS_DEMO_MODE) {
      const supabase = createServerSupabaseClient();
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
      }
      const profile = await repositories.users.getById(session.user.id);
      if (!profile) {
        return NextResponse.json({ error: 'Perfil de usuário não encontrado' }, { status: 401 });
      }
      companyId = profile.company_id;
    }

    const machineId = params.id;
    const machine = await repositories.machines.getById(companyId, machineId);
    if (!machine) {
      return NextResponse.json({ error: 'Máquina não encontrada' }, { status: 404 });
    }

    const activeProd = await repositories.production.getActiveByMachine(companyId, machineId);
    const activeDown = await repositories.downtime.getActiveByMachine(companyId, machineId);
    const state = deriveMachineStatus(activeProd, activeDown);

    return NextResponse.json({
      success: true,
      machine_code: machine.code,
      machine_name: machine.name,
      status: state.status,
      status_label: state.statusLabel,
      active_order: activeProd?.order_code || null,
      active_downtime_reason: activeDown?.reason_id || null,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Erro ao consultar status' }, { status: 500 });
  }
}

