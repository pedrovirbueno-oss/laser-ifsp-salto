import { NextRequest, NextResponse } from 'next/server';
import { repositories } from '@/repositories';
import { hashApiKey } from '@/lib/apiKey';

export async function POST(req: NextRequest) {
  try {
    const rawApiKey = req.headers.get('x-api-key');
    if (!rawApiKey) {
      return NextResponse.json({ error: 'Chave de API (x-api-key) não fornecida' }, { status: 401 });
    }

    const keyHash = hashApiKey(rawApiKey);
    const validKey = await repositories.apiKeys.validateKey(keyHash);

    if (!validKey || !validKey.active) {
      return NextResponse.json({ error: 'Chave de API inválida, revogada ou inativa' }, { status: 401 });
    }

    const companyId = validKey.company_id; // Company derived STRICTLY from API key binding

    const body = await req.json();
    const { machine_code, timestamp, metrics } = body;

    if (!machine_code || typeof machine_code !== 'string') {
      return NextResponse.json({ error: 'Payload inválido: machine_code é obrigatório e deve ser uma string' }, { status: 400 });
    }

    if (!metrics || typeof metrics !== 'object') {
      return NextResponse.json({ error: 'Payload inválido: métricas de telemetria ausentes ou malformatadas' }, { status: 400 });
    }

    // Verify machine exists and belongs to the API key's company
    const machine = await repositories.machines.getByCode(companyId, machine_code);
    if (!machine) {
      return NextResponse.json({ error: `Máquina '${machine_code}' não encontrada para esta empresa` }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: 'Telemetria processada e autenticada com sucesso',
      company_id: companyId,
      machine_code,
      received_at: new Date().toISOString(),
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Erro interno no processamento de telemetria' }, { status: 500 });
  }
}
