import { NextRequest, NextResponse } from 'next/server';
import { repositories, demoRepositories, IS_DEMO_MODE } from '@/repositories';
import { DEMO_COMPANY_ID, demoProfiles } from '@/repositories/demo/seedData';
import { createServerSupabaseClient, createAdminSupabaseClient } from '@/lib/supabase/server';
import { createAuditLogEntry } from '@/lib/audit';
import { ProductionRecord } from '@/types';

function mapToDomain(row: any): ProductionRecord {
  const produced_quantity = Number(row.produced_quantity || 0);
  const rejected_quantity = Number(row.rejected_quantity || 0);
  const good_quantity = Math.max(0, produced_quantity - rejected_quantity);

  return {
    id: row.id,
    company_id: row.company_id,
    machine_id: row.machine_id,
    machine_name: row.machine_name || row.machines?.name,
    operator_id: row.operator_id,
    operator_name: row.operator_name || row.profiles?.name,
    order_id: row.order_id,
    order_code: row.order_code || row.production_orders?.code,
    product_id: row.product_id,
    product_name: row.product_name || row.products?.name,
    shift_id: row.shift_id,
    shift_name: row.shift_name || row.shifts?.name,
    start_time: row.start_time,
    end_time: row.end_time || undefined,
    produced_quantity,
    rejected_quantity,
    good_quantity,
    notes: row.notes || undefined,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

export async function POST(req: NextRequest) {
  try {
    let companyId = DEMO_COMPANY_ID;
    let userId = 'user-operator-demo';
    let userName = 'João Pedro';
    let userRole = 'operator';
    const testSessionRole = req.cookies.get('nexo_test_session')?.value;
    const useDemoPersistence = IS_DEMO_MODE || Boolean(testSessionRole);

    if (testSessionRole) {
      const matched = demoProfiles.find((p) => p.role === testSessionRole) || demoProfiles[2];
      companyId = matched.company_id;
      userId = matched.id;
      userName = matched.name;
      userRole = matched.role;
    } else if (!IS_DEMO_MODE) {
      // 1. Authenticate session from HTTP cookies
      const supabase = createServerSupabaseClient();
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        return NextResponse.json({ error: 'Sessão expirada ou não autenticada.' }, { status: 401 });
      }

      // 2. Fetch authenticated profile via server-side Admin Client
      const supabaseAdmin = createAdminSupabaseClient();
      const { data: profile, error: profileErr } = await supabaseAdmin
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .maybeSingle();

      if (profileErr || !profile) {
        return NextResponse.json({ error: 'Perfil de usuário não encontrado.' }, { status: 401 });
      }

      companyId = profile.company_id;
      userId = profile.id;
      userName = profile.name;
      userRole = profile.role;
    }

    const body = await req.json();
    const action = body.action || (body.record_id || body.recordId ? 'register' : 'start');
    const activeRepos = useDemoPersistence ? demoRepositories : repositories;

    // =========================================================================
    // ACTION: START PRODUCTION
    // =========================================================================
    if (action === 'start') {
      const { machine_id, order_id, product_id, shift_id, order_code, product_name } = body;

      if (!machine_id || typeof machine_id !== 'string') {
        return NextResponse.json({ error: 'machine_id é obrigatório.' }, { status: 400 });
      }

      if (useDemoPersistence) {
        const activeProd = await activeRepos.production.getActiveByMachine(companyId, machine_id);
        if (activeProd) {
          return NextResponse.json({ error: 'Esta máquina já possui uma sessão de produção ativa.' }, { status: 409 });
        }
        const activeDown = await activeRepos.downtime.getActiveByMachine(companyId, machine_id);
        if (activeDown) {
          return NextResponse.json({ error: 'Esta máquina possui uma parada em andamento. Finalize a parada antes de iniciar a produção.' }, { status: 400 });
        }
      } else {
        const supabaseAdmin = createAdminSupabaseClient();

        const { data: activeProds, error: actErr } = await supabaseAdmin
          .from('production_records')
          .select('id')
          .eq('company_id', companyId)
          .eq('machine_id', machine_id)
          .is('end_time', null);

        if (actErr) throw actErr;
        if (activeProds && activeProds.length > 0) {
          return NextResponse.json({ error: 'Esta máquina já possui uma sessão de produção ativa.' }, { status: 409 });
        }

        const { data: activeDowns, error: downErr } = await supabaseAdmin
          .from('downtime_records')
          .select('id')
          .eq('company_id', companyId)
          .eq('machine_id', machine_id)
          .is('end_time', null);

        if (downErr) throw downErr;
        if (activeDowns && activeDowns.length > 0) {
          return NextResponse.json({ error: 'Esta máquina possui uma parada em andamento. Finalize a parada antes de iniciar a produção.' }, { status: 400 });
        }
      }

      let createdRecord: ProductionRecord;

      if (useDemoPersistence) {
        createdRecord = await activeRepos.production.create({
          company_id: companyId,
          machine_id,
          operator_id: userId,
          operator_name: userName,
          order_id: order_id || '',
          order_code: order_code || '',
          product_id: product_id || '',
          product_name: product_name || '',
          shift_id: shift_id || '',
          start_time: new Date().toISOString(),
          produced_quantity: 0,
          rejected_quantity: 0,
        });
      } else {
        const supabaseAdmin = createAdminSupabaseClient();
        const dbPayload = {
          company_id: companyId,
          machine_id,
          operator_id: userId,
          order_id: order_id || null,
          product_id: product_id || null,
          shift_id: shift_id || null,
          start_time: new Date().toISOString(),
          produced_quantity: 0,
          rejected_quantity: 0,
        };

        const { data, error } = await supabaseAdmin
          .from('production_records')
          .insert(dbPayload)
          .select('*, machines(name), profiles(name), production_orders(code), products(name), shifts(name)')
          .maybeSingle();

        if (error) throw error;
        if (!data) throw new Error('Falha ao registrar início de produção no banco.');
        createdRecord = mapToDomain({
          ...data,
          order_code: order_code || data.production_orders?.code,
          product_name: product_name || data.products?.name,
        });
      }

      // Secondary updates using supabaseAdmin in Production Mode
      const nowIso = new Date().toISOString();
      if (useDemoPersistence) {
        try {
          if (order_id) await activeRepos.orders.update(companyId, order_id, { status: 'active' });
          await activeRepos.machines.update(companyId, machine_id, { status: 'producing' });
          await activeRepos.audit.create(
            createAuditLogEntry(companyId, userId, userName, 'START_PRODUCTION', 'PRODUCTION_RECORD', createdRecord.id, null, {
              machineId: machine_id,
              orderCode: order_code,
              productName: product_name,
            })
          );
        } catch (e) {
          console.warn('Falha secundária em Demo Mode:', e);
        }
      } else {
        const supabaseAdmin = createAdminSupabaseClient();
        try {
          if (order_id) {
            await supabaseAdmin
              .from('production_orders')
              .update({ status: 'active', updated_at: nowIso })
              .eq('id', order_id)
              .eq('company_id', companyId);
          }
          await supabaseAdmin
            .from('machines')
            .update({ status: 'producing', updated_at: nowIso })
            .eq('id', machine_id)
            .eq('company_id', companyId);

          const auditEntry = createAuditLogEntry(
            companyId,
            userId,
            userName,
            'START_PRODUCTION',
            'PRODUCTION_RECORD',
            createdRecord.id,
            null,
            { machineId: machine_id, orderCode: order_code, productName: product_name }
          );
          await supabaseAdmin.from('audit_logs').insert(auditEntry);
        } catch (e) {
          console.warn('Falha secundária ao atualizar entidades em Produção:', e);
        }
      }

      return NextResponse.json({
        success: true,
        message: 'Sessão de produção iniciada com sucesso.',
        data: createdRecord,
      }, { status: 201 });
    }

    // =========================================================================
    // ACTION: REGISTER PRODUCTION
    // =========================================================================
    if (action === 'register') {
      const recordId = body.record_id || body.recordId;
      if (!recordId) {
        return NextResponse.json({ error: 'ID da sessão de produção não informado.' }, { status: 400 });
      }

      const producedQuantity = Number(body.produced_quantity ?? body.producedQuantity ?? 0);
      const rejectedQuantity = Number(body.rejected_quantity ?? body.rejectedQuantity ?? 0);

      if (isNaN(producedQuantity) || producedQuantity < 0 || isNaN(rejectedQuantity) || rejectedQuantity < 0) {
        return NextResponse.json({ error: 'A quantidade produzida e rejeitada não podem ser negativas.' }, { status: 400 });
      }

      if (rejectedQuantity > producedQuantity) {
        return NextResponse.json({ error: 'A quantidade rejeitada (refugo) no lote não pode ser maior que a quantidade total produzida.' }, { status: 400 });
      }

      let existingRecord: ProductionRecord | null = null;

      if (useDemoPersistence) {
        const all = await activeRepos.production.getAll(companyId);
        existingRecord = all.find((r) => r.id === recordId) || null;
      } else {
        const supabaseAdmin = createAdminSupabaseClient();
        const { data, error } = await supabaseAdmin
          .from('production_records')
          .select('*, machines(name), profiles(name), production_orders(code), products(name), shifts(name)')
          .eq('id', recordId)
          .eq('company_id', companyId)
          .maybeSingle();

        if (error) throw error;
        if (data) existingRecord = mapToDomain(data);
      }

      if (!existingRecord) {
        return NextResponse.json({ error: 'Registro de produção não encontrado para a empresa.' }, { status: 404 });
      }

      // SECURITY: Operator can only update their OWN production session
      if (userRole === 'operator' && existingRecord.operator_id !== userId) {
        return NextResponse.json({ error: 'Acesso negado: Operador não pode alterar o registro de produção de outro operador.' }, { status: 403 });
      }

      const newProduced = (existingRecord.produced_quantity || 0) + producedQuantity;
      const newRejected = (existingRecord.rejected_quantity || 0) + rejectedQuantity;

      let updatedRecord: ProductionRecord;

      if (useDemoPersistence) {
        updatedRecord = await activeRepos.production.update(companyId, recordId, {
          produced_quantity: newProduced,
          rejected_quantity: newRejected,
          notes: body.notes || existingRecord.notes,
        });
      } else {
        const supabaseAdmin = createAdminSupabaseClient();
        const dbPayload = {
          produced_quantity: newProduced,
          rejected_quantity: newRejected,
          notes: body.notes || existingRecord.notes,
          updated_at: new Date().toISOString(),
        };

        const { data, error } = await supabaseAdmin
          .from('production_records')
          .update(dbPayload)
          .eq('id', recordId)
          .eq('company_id', companyId)
          .select('*, machines(name), profiles(name), production_orders(code), products(name), shifts(name)')
          .maybeSingle();

        if (error) throw error;
        if (!data) throw new Error('Falha ao atualizar apontamento de produção no banco.');
        updatedRecord = mapToDomain(data);
      }

      // Secondary updates using supabaseAdmin in Production Mode
      if (useDemoPersistence) {
        if (existingRecord.order_id) {
          try {
            const order = await activeRepos.orders.getById(companyId, existingRecord.order_id);
            if (order) {
              await activeRepos.orders.update(companyId, order.id, {
                produced_quantity: (order.produced_quantity || 0) + producedQuantity,
                rejected_quantity: (order.rejected_quantity || 0) + rejectedQuantity,
              });
            }
          } catch (e) {
            console.warn('Falha secundária ao atualizar ordem em Demo Mode:', e);
          }
        }
        try {
          await activeRepos.audit.create(
            createAuditLogEntry(
              companyId,
              userId,
              userName,
              'REGISTER_PRODUCTION',
              'PRODUCTION_RECORD',
              recordId,
              { produced: existingRecord.produced_quantity, rejected: existingRecord.rejected_quantity },
              { addedProduced: producedQuantity, addedRejected: rejectedQuantity, totalProduced: newProduced }
            )
          );
        } catch (e) {
          console.warn('Falha secundária ao registrar audit log em Demo Mode:', e);
        }
      } else {
        const supabaseAdmin = createAdminSupabaseClient();
        if (existingRecord.order_id) {
          try {
            const { data: orderRow } = await supabaseAdmin
              .from('production_orders')
              .select('id, produced_quantity, rejected_quantity, planned_quantity')
              .eq('id', existingRecord.order_id)
              .eq('company_id', companyId)
              .maybeSingle();

            if (orderRow) {
              const nextOrderProduced = Number(orderRow.produced_quantity || 0) + producedQuantity;
              const nextOrderRejected = Math.min(nextOrderProduced, Number(orderRow.rejected_quantity || 0) + rejectedQuantity);
              await supabaseAdmin
                .from('production_orders')
                .update({
                  produced_quantity: nextOrderProduced,
                  rejected_quantity: nextOrderRejected,
                  updated_at: new Date().toISOString(),
                })
                .eq('id', orderRow.id)
                .eq('company_id', companyId);
            }
          } catch (e) {
            console.warn('Falha secundária ao atualizar ordem em Produção:', e);
          }
        }

        try {
          const auditEntry = createAuditLogEntry(
            companyId,
            userId,
            userName,
            'REGISTER_PRODUCTION',
            'PRODUCTION_RECORD',
            recordId,
            { produced: existingRecord.produced_quantity, rejected: existingRecord.rejected_quantity },
            { addedProduced: producedQuantity, addedRejected: rejectedQuantity, totalProduced: newProduced }
          );
          await supabaseAdmin.from('audit_logs').insert(auditEntry);
        } catch (e) {
          console.warn('Falha secundária ao registrar audit log em Produção:', e);
        }
      }

      return NextResponse.json({
        success: true,
        message: 'Apontamento de produção registrado com sucesso.',
        data: updatedRecord,
      }, { status: 200 });
    }

    // =========================================================================
    // ACTION: END PRODUCTION
    // =========================================================================
    if (action === 'end') {
      const recordId = body.record_id || body.recordId;
      if (!recordId) {
        return NextResponse.json({ error: 'ID da sessão de produção não informado.' }, { status: 400 });
      }

      let existingRecord: ProductionRecord | null = null;

      if (useDemoPersistence) {
        const all = await activeRepos.production.getAll(companyId);
        existingRecord = all.find((r) => r.id === recordId) || null;
      } else {
        const supabaseAdmin = createAdminSupabaseClient();
        const { data, error } = await supabaseAdmin
          .from('production_records')
          .select('*, machines(name), profiles(name), production_orders(code), products(name), shifts(name)')
          .eq('id', recordId)
          .eq('company_id', companyId)
          .maybeSingle();

        if (error) throw error;
        if (data) existingRecord = mapToDomain(data);
      }

      if (!existingRecord) {
        return NextResponse.json({ error: 'Sessão de produção não encontrada.' }, { status: 404 });
      }

      // SECURITY: Operator can only end their OWN production session
      if (userRole === 'operator' && existingRecord.operator_id !== userId) {
        return NextResponse.json({ error: 'Acesso negado: Operador não pode finalizar a sessão de produção de outro operador.' }, { status: 403 });
      }

      const endTime = new Date().toISOString();
      let updatedRecord: ProductionRecord;

      if (useDemoPersistence) {
        updatedRecord = await activeRepos.production.update(companyId, recordId, {
          end_time: endTime,
        });
        try {
          await activeRepos.machines.update(companyId, existingRecord.machine_id, { status: 'inactive' });
          await activeRepos.audit.create(
            createAuditLogEntry(
              companyId,
              userId,
              userName,
              'END_PRODUCTION',
              'PRODUCTION_RECORD',
              recordId,
              { startTime: existingRecord.start_time },
              { endTime, totalProduced: existingRecord.produced_quantity }
            )
          );
        } catch (e) {
          console.warn('Falha secundária ao finalizar produção em Demo Mode:', e);
        }
      } else {
        const supabaseAdmin = createAdminSupabaseClient();
        const { data, error } = await supabaseAdmin
          .from('production_records')
          .update({
            end_time: endTime,
            updated_at: endTime,
          })
          .eq('id', recordId)
          .eq('company_id', companyId)
          .select('*, machines(name), profiles(name), production_orders(code), products(name), shifts(name)')
          .maybeSingle();

        if (error) throw error;
        if (!data) throw new Error('Falha ao encerrar sessão de produção no banco.');
        updatedRecord = mapToDomain(data);

        try {
          await supabaseAdmin
            .from('machines')
            .update({ status: 'inactive', updated_at: endTime })
            .eq('id', existingRecord.machine_id)
            .eq('company_id', companyId);

          const auditEntry = createAuditLogEntry(
            companyId,
            userId,
            userName,
            'END_PRODUCTION',
            'PRODUCTION_RECORD',
            recordId,
            { startTime: existingRecord.start_time },
            { endTime, totalProduced: existingRecord.produced_quantity }
          );
          await supabaseAdmin.from('audit_logs').insert(auditEntry);
        } catch (e) {
          console.warn('Falha secundária ao finalizar produção em Produção:', e);
        }
      }

      return NextResponse.json({
        success: true,
        message: 'Sessão de produção finalizada com sucesso.',
        data: updatedRecord,
      }, { status: 200 });
    }

    return NextResponse.json({ error: 'Ação inválida ou não suportada.' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Erro interno ao processar operação de produção.' }, { status: 500 });
  }
}

