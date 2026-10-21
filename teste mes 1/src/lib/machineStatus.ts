import { MachineStatus, ProductionRecord, DowntimeRecord, DowntimeCategory } from '@/types';

export interface DynamicMachineState {
  status: MachineStatus;
  statusLabel: string;
  statusColor: 'green' | 'yellow' | 'blue' | 'red' | 'gray';
  statusBadge: string;
  activeDowntime?: DowntimeRecord;
  activeProduction?: ProductionRecord;
}

/**
 * Derives machine status dynamically from real-time events.
 * 
 * Priority Rules:
 *  1. Open Downtime Record (end_time is null/undefined):
 *     - category 'setup' -> 'setup' (🔵 Setup)
 *     - category 'maintenance' -> 'maintenance' (🔴 Manutenção)
 *     - all other downtime categories -> 'stopped' (🟡 Parada)
 *  2. Open Production Record (end_time is null/undefined) -> 'producing' (🟢 Produzindo)
 *  3. Neither -> 'inactive' (⚪ Sem Operação)
 */
export function deriveMachineStatus(
  activeProduction?: ProductionRecord | null,
  activeDowntime?: DowntimeRecord | null
): DynamicMachineState {
  if (activeDowntime && !activeDowntime.end_time) {
    const category = activeDowntime.category;
    if (category === 'setup') {
      return {
        status: 'setup',
        statusLabel: 'Em Setup',
        statusColor: 'blue',
        statusBadge: '🔵 Setup',
        activeDowntime,
      };
    }
    if (category === 'maintenance') {
      return {
        status: 'maintenance',
        statusLabel: 'Em Manutenção',
        statusColor: 'red',
        statusBadge: '🔴 Manutenção',
        activeDowntime,
      };
    }
    return {
      status: 'stopped',
      statusLabel: 'Parada',
      statusColor: 'yellow',
      statusBadge: '🟡 Parada',
      activeDowntime,
    };
  }

  if (activeProduction && !activeProduction.end_time) {
    return {
      status: 'producing',
      statusLabel: 'Produzindo',
      statusColor: 'green',
      statusBadge: '🟢 Produzindo',
      activeProduction,
    };
  }

  return {
    status: 'inactive',
    statusLabel: 'Sem Operação',
    statusColor: 'gray',
    statusBadge: '⚪ Sem Operação',
  };
}
