import { NextRequest, NextResponse } from 'next/server';
import { repositories, demoRepositories, IS_DEMO_MODE } from '@/repositories';
import { DEMO_COMPANY_ID, demoProfiles } from '@/repositories/demo/seedData';
import { createServerSupabaseClient, createAdminSupabaseClient } from '@/lib/supabase/server';
import { createAuditLogEntry } from '@/lib/audit';
import { DowntimeRecord } from '@/types';

function mapDowntimeToDomain(row: any): DowntimeRecord {
  return {
    id: row.id,
    company_id: row.company_id,
    machine_id: row.machine_id,
    machine_name: row.machine_name || row.machines?.name,
    operator_id: row.operator_id,
    operator_name: row.operator_name || row.profiles?.name,
    order_id: row.order_id || undefined,
    order_code: row.order_code || row.production_orders?.code,
    reason_id: row.reason_id,
    reason_name: row.reason_name || row.downtime_reasons?.name,
    category: row.category || row.downtime_reasons?.category,
    start_time: row.start_time,
    end_time: row.end_time || undefined,
    duration_seconds: Number(row.duration_seconds || 0),
    notes: row.notes || undefined,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

export async function POST(req: NextRequest) {
  try {
    let companyId = DEMO_COMPANY_ID;
    let operatorId = 'user-operator-demo';
    let operatorName = 'João Pedro';
    const testSessionRole = req.cookies.get('nexo_test_session')?.value;
    const useDemoPersistence = IS_DEMO_MODE || Boolean(testSessionRole);

    if (testSessionRole) {
      const matched = demoProfiles.find((p) => p.role === testSessionRole) || demoProfiles[2];
      companyId = matched.company_id;
      operatorId = matched.id;
      operatorName = matched.name;
    } else if (!IS_DEMO_MODE) {
      const supabase = createServerSupabaseClient();
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
      }
      const supabaseAdmin = createAdminSupabaseClient();
      const { data: profile, error: profileErr } = await supabaseAdmin
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .maybeSingle();

      if (profileErr || !profile) {
        return NextResponse.json({ error: 'Perfil de usuário não encontrado' }, { status: 401 });
      }
      companyId = profile.company_id;
      operatorId = profile.id;
      operatorName = profile.name;
    }

    const body = await req.json();
    const action = body.action || (body.downtime_id || body.downtimeId ? 'end' : 'start');
    const activeRepos = useDemoPersistence ? demoRepositories : repositories;

    // =========================================================================
    // ACTION: END DOWNTIME
    // =========================================================================
    if (action === 'end') {
      const downtimeId = body.downtime_id || body.downtimeId;
      if (!downtimeId) {
        return NextResponse.json({ error: 'downtime_id é obrigatório para encerrar parada' }, { status: 400 });
      }

      if (useDemoPersistence) {
        const allDowntimes = await activeRepos.downtime.getAll(companyId);
        const existing = allDowntimes.find((d) => d.id === downtimeId);
        if (!existing || existing.end_time) {
          return NextResponse.json({ error: 'Registro de parada ativo não encontrado.' }, { status: 404 });
        }
        const endTime = new Date();
        const startTime = new Date(existing.start_time);
        const durationSeconds = Math.max(0, Math.floor((endTime.getTime() - startTime.getTime()) / 1000));
        const updated = await activeRepos.downtime.update(companyId, downtimeId, {
          end_time: endTime.toISOString(),
          duration_seconds: durationSeconds,
        });
        try {
          const activeProd = await activeRepos.production.getActiveByMachine(companyId, existing.machine_id);
          await activeRepos.machines.update(companyId, existing.machine_id, {
            status: activeProd ? 'producing' : 'inactive',
          });
          await activeRepos.audit.create(
            createAuditLogEntry(companyId, operatorId, operatorName, 'END_DOWNTIME', 'DOWNTIME_RECORD', downtimeId, { startTime: existing.start_time }, { endTime: endTime.toISOString(), durationSeconds })
          );
        } catch (e) {
          console.warn('Falha secundária ao encerrar parada em Demo Mode:', e);
        }
        return NextResponse.json({ success: true, message: 'Parada encerrada com sucesso', data: updated });
      }

      const supabaseAdmin = createAdminSupabaseClient();
      const { data: existing, error: getErr } = await supabaseAdmin
        .from('downtime_records')
        .select('*')
        .eq('id', downtimeId)
        .eq('company_id', companyId)
        .maybeSingle();

      if (getErr) throw getErr;
      if (!existing || existing.end_time) {
        return NextResponse.json({ error: 'Registro de parada ativo não encontrado.' }, { status: 404 });
      }

      const endTime = new Date();
      const startTime = new Date(existing.start_time);
      const durationSeconds = Math.max(0, Math.floor((endTime.getTime() - startTime.getTime()) / 1000));
      const nowIso = endTime.toISOString();

      const { data: updatedRow, error: updErr } = await supabaseAdmin
        .from('downtime_records')
        .update({
          end_time: nowIso,
          duration_seconds: durationSeconds,
          updated_at: nowIso,
        })
        .eq('id', downtimeId)
        .eq('company_id', companyId)
        .select('*, machines(name), profiles(name), production_orders(code), downtime_reasons(name, category)')
        .maybeSingle();

      if (updErr) throw updErr;
      if (!updatedRow) throw new Error('Falha ao atualizar parada no banco.');

      try {
        const { data: activeProds } = await supabaseAdmin
          .from('production_records')
          .select('id')
          .eq('company_id', companyId)
          .eq('machine_id', existing.machine_id)
          .is('end_time', null);

        const nextStatus = activeProds && activeProds.length > 0 ? 'producing' : 'inactive';
        await supabaseAdmin
          .from('machines')
          .update({ status: nextStatus, updated_at: nowIso })
          .eq('id', existing.machine_id)
          .eq('company_id', companyId);

        const auditEntry = createAuditLogEntry(
          companyId,
          operatorId,
          operatorName,
          'END_DOWNTIME',
          'DOWNTIME_RECORD',
          downtimeId,
          { startTime: existing.start_time },
          { endTime: nowIso, durationSeconds }
        );
        await supabaseAdmin.from('audit_logs').insert(auditEntry);
      } catch (e) {
        console.warn('Falha secundária ao encerrar parada em Produção:', e);
      }

      return NextResponse.json({
        success: true,
        message: 'Parada encerrada com sucesso',
        data: mapDowntimeToDomain(updatedRow),
      });
    }

    // =========================================================================
    // ACTION: START DOWNTIME
    // =========================================================================
    const { machine_id, reason_id, order_id, notes } = body;

    if (!machine_id || !reason_id) {
      return NextResponse.json({ error: 'machine_id e reason_id são obrigatórios' }, { status: 400 });
    }

    if (useDemoPersistence) {
      const machine = await activeRepos.machines.getById(companyId, machine_id);
      if (!machine) {
        return NextResponse.json({ error: 'Máquina não encontrada ou pertencente a outra empresa' }, { status: 404 });
      }
      const reasons = await activeRepos.downtime.getReasons(companyId);
      const reason = reasons.find((r) => r.id === reason_id && r.active);
      if (!reason) {
        return NextResponse.json({ error: 'Motivo de parada não encontrado ou inativo para esta empresa' }, { status: 404 });
      }
      let targetOrderCode = '';
      if (order_id) {
        const order = await activeRepos.orders.getById(companyId, order_id);
        if (!order) {
          return NextResponse.json({ error: 'Ordem de produção não encontrada ou pertencente a outra empresa' }, { status: 404 });
        }
        targetOrderCode = order.code;
      }

      const record = await activeRepos.downtime.create({
        company_id: companyId,
        machine_id,
        machine_name: machine.name,
        operator_id: operatorId,
        operator_name: operatorName,
        order_id: order_id || undefined,
        order_code: targetOrderCode || undefined,
        reason_id,
        reason_name: reason.name,
        category: reason.category,
        start_time: new Date().toISOString(),
        duration_seconds: 0,
        notes: notes || 'Parada iniciada via terminal',
      });

      const cat = reason.category || 'other';
      let machineStatus: 'stopped' | 'setup' | 'maintenance' = 'stopped';
      if (cat === 'setup') machineStatus = 'setup';
      if (cat === 'maintenance') machineStatus = 'maintenance';
      await activeRepos.machines.update(companyId, machine_id, { status: machineStatus });

      const auditEntry = createAuditLogEntry(
        companyId,
        operatorId,
        operatorName,
        'START_DOWNTIME',
        'downtime_record',
        record.id,
        null,
        { machine_id, reason_id, category: reason.category }
      );
      await activeRepos.audit.create(auditEntry);

      return NextResponse.json({
        success: true,
        message: 'Parada registrada com sucesso',
        data: record,
      }, { status: 201 });
    }

    // Production Mode via supabaseAdmin
    const supabaseAdmin = createAdminSupabaseClient();

    const { data: machine } = await supabaseAdmin
      .from('machines')
      .select('id, name')
      .eq('id', machine_id)
      .eq('company_id', companyId)
      .maybeSingle();

    if (!machine) {
      return NextResponse.json({ error: 'Máquina não encontrada ou pertencente a outra empresa' }, { status: 404 });
    }

    const { data: reason } = await supabaseAdmin
      .from('downtime_reasons')
      .select('id, name, category, active')
      .eq('id', reason_id)
      .eq('company_id', companyId)
      .maybeSingle();

    if (!reason || !reason.active) {
      return NextResponse.json({ error: 'Motivo de parada não encontrado ou inativo para esta empresa' }, { status: 404 });
    }

    if (order_id) {
      const { data: order } = await supabaseAdmin
        .from('production_orders')
        .select('id, code')
        .eq('id', order_id)
        .eq('company_id', companyId)
        .maybeSingle();
      if (!order) {
        return NextResponse.json({ error: 'Ordem de produção não encontrada ou pertencente a outra empresa' }, { status: 404 });
      }
    }

    const { data: createdRow, error: insErr } = await supabaseAdmin
      .from('downtime_records')
      .insert({
        company_id: companyId,
        machine_id,
        operator_id: operatorId,
        order_id: order_id || null,
        reason_id,
        start_time: new Date().toISOString(),
        duration_seconds: 0,
        notes: notes || 'Parada iniciada via terminal',
      })
      .select('*, machines(name), profiles(name), production_orders(code), downtime_reasons(name, category)')
      .maybeSingle();

    if (insErr) throw insErr;
    if (!createdRow) throw new Error('Falha ao gravar parada no banco.');

    const record = mapDowntimeToDomain(createdRow);

    try {
      const cat = reason.category || 'other';
      let machineStatus: 'stopped' | 'setup' | 'maintenance' = 'stopped';
      if (cat === 'setup') machineStatus = 'setup';
      if (cat === 'maintenance') machineStatus = 'maintenance';

      await supabaseAdmin
        .from('machines')
        .update({ status: machineStatus, updated_at: new Date().toISOString() })
        .eq('id', machine_id)
        .eq('company_id', companyId);

      const auditEntry = createAuditLogEntry(
        companyId,
        operatorId,
        operatorName,
        'START_DOWNTIME',
        'DOWNTIME_RECORD',
        record.id,
        null,
        { machine_id, reason_id, category: reason.category }
      );
      await supabaseAdmin.from('audit_logs').insert(auditEntry);
    } catch (e) {
      console.warn('Falha secundária ao iniciar parada em Produção:', e);
    }

    return NextResponse.json({
      success: true,
      message: 'Parada registrada com sucesso',
      data: record,
    }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Erro ao registrar parada' }, { status: 500 });
  }
}


